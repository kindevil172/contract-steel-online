// Contract & Steel online server: static files + WebSocket rooms. Host-authoritative: the server owns the game state.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { newGame, apply, deckProblems, CARD, COLLECTION, rarityOf, copyLimit, aiAction, aiMulligan } from "./engine.js";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(DIR, "public");
const PORT = Number(process.env.PORT || 8080);
const ROOM_IDLE_MS = 30 * 60 * 1000;
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  const u = new URL(req.url || "/", "http://x");
  if (u.pathname === "/health") { res.writeHead(200, { "content-type": "text/plain" }); res.end(`ok ${rooms.size} rooms`); return; }
  let p = decodeURIComponent(u.pathname);
  if (p === "/" || p === "") p = "/index.html";
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { "content-type": "text/plain" }); res.end("Not found"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": p.startsWith("/art/") ? "max-age=86400" : "no-cache" });
    res.end(data);
  });
});

/** rooms: code -> { code, players: [{token, name, deck, side, ws}], g, seq, last, touched, rematch:Set } */
const rooms = new Map();
const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() { for (;;) { let c = ""; for (let i = 0; i < 5; i++) c += ALPH[crypto.randomInt(ALPH.length)]; if (!rooms.has(c)) return c; } }
const send = (ws, m) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
const cleanName = (n, d) => (String(n || "").replace(/[^\p{L}\p{N} _.'-]/gu, "").trim().slice(0, 20) || d);

function checkDeck(deck) {
  if (!deck || !Array.isArray(deck.cards)) return "Pick a deck first.";
  if (!deck.cards.every((c) => typeof c === "string" && CARD[c] && !CARD[c].token)) return "That deck has unknown cards.";
  const probs = deckProblems(deck.cards);
  return probs.length ? `Deck not legal: ${probs.join("; ")}` : null;
}
// ================= DRAFT =================
// Two players open a 5-card pack each, pick 1, swap packs, repeat until both packs are empty (5 picks each),
// then open fresh packs. 4 rounds = 20 cards each. Packs are rolled per slot by rarity weight, all 5 companies.
const DRAFT = { packSize: 5, rounds: 4, pickMs: Number(process.env.DRAFT_PICK_MS) || 40000, reviewMs: Number(process.env.DRAFT_REVIEW_MS) || 15000, weights: [["common", 62], ["rare", 28], ["epic", 7], ["legendary", 3]] };
const POOL = {}; for (const c of COLLECTION) (POOL[rarityOf(c)] ||= []).push(c.id);
const R_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3 };
function rollRarity() { let x = crypto.randomInt(100); for (const [r, w] of DRAFT.weights) { if (x < w) return r; x -= w; } return "common"; }
function genPack() {
  const pack = [];
  while (pack.length < DRAFT.packSize) { const list = POOL[rollRarity()].filter((id) => !pack.includes(id)); if (list.length) pack.push(list[crypto.randomInt(list.length)]); }
  return pack;
}
const overLimit = (picks, id) => picks.filter((c) => c === id).length >= copyLimit(id);
// A card that would break the copy limit (2 each, 1 per legendary) can't be taken unless every card left in the pack is like that.
const legalIdx = (pack, picks) => { const ok = pack.map((id, i) => (overLimit(picks, id) ? -1 : i)).filter((i) => i >= 0); return ok.length ? ok : pack.map((_, i) => i); };
function autoPick(d, side) {
  const pack = d.packs[side], ok = legalIdx(pack, d.picks[side]);
  if (Number.isInteger(d.sel[side]) && ok.includes(d.sel[side])) return d.sel[side];
  const best = Math.max(...ok.map((i) => R_ORDER[rarityOf(CARD[pack[i]])]));
  const top = ok.filter((i) => R_ORDER[rarityOf(CARD[pack[i]])] === best);
  return top[crypto.randomInt(top.length)];
}
function sendDraft(room, only) {
  const d = room.draft; if (!d) return;
  for (const p of room.players) {
    if (only && p !== only) continue;
    const o = p.side === "a" ? "b" : "a", peer = room.players.find((q) => q !== p);
    send(p.ws, { t: "draft", code: room.code, side: p.side, stage: d.stage, round: d.round, step: d.step, rounds: DRAFT.rounds, total: DRAFT.rounds * DRAFT.packSize, pack: d.chosen[p.side] == null ? d.packs[p.side] : [], legal: d.stage === "pick" && d.chosen[p.side] == null ? legalIdx(d.packs[p.side], d.picks[p.side]) : [], picks: d.picks[p.side], sel: d.sel[p.side], done: d.stage === "pick" && d.chosen[p.side] != null, peerDone: d.stage === "review" ? d.ready.has(o) : d.chosen[o] != null, peerCount: d.picks[o].length, peerName: peer ? peer.name : "", left: Math.max(0, d.deadline - Date.now()), pickMs: d.stage === "review" ? DRAFT.reviewMs : DRAFT.pickMs, ready: [...d.ready], peer: !!(peer && (peer.ai || peer.ws)), ...(room.tourRoom ? { tour: true, round: d.round, stageName: room.rec.mi === 2 ? "Final" : "Semifinal" } : {}) });
  }
  if (room.tourRoom) aiKick(room);
}
function draftTimer(room, ms, fn) { const d = room.draft; clearTimeout(d.timer); d.deadline = Date.now() + ms; d.timer = setTimeout(() => { if (room.draft === d && alive(room)) fn(); }, ms); }
// A tournament match lives inside its tournament room; it is alive while that room is.
const alive = (room) => (room.tourRoom ? rooms.get(room.code) === room.tourRoom : rooms.get(room.code) === room);
function beginStep(room) {
  const d = room.draft; d.chosen = { a: null, b: null }; d.sel = { a: null, b: null };
  const at = `${d.round}.${d.step}`;
  draftTimer(room, DRAFT.pickMs, () => { for (const s of ["a", "b"].filter((x) => d.chosen[x] == null)) if (`${d.round}.${d.step}` === at && d.stage === "pick") takePick(room, s, autoPick(d, s), true); });
  sendDraft(room);
}
function newRound(room) { const d = room.draft; d.packs = { a: genPack(), b: genPack() }; d.step = 0; beginStep(room); }
function startDraft(room) {
  room.g = null; room.last = null; room.rematch = new Map();
  room.draft = { stage: "pick", round: 0, step: 0, packs: { a: [], b: [] }, picks: { a: [], b: [] }, chosen: { a: null, b: null }, sel: { a: null, b: null }, ready: new Set(), deadline: 0, timer: null };
  newRound(room);
}
function takePick(room, side, idx, auto) {
  const d = room.draft;
  if (!d || d.stage !== "pick" || d.chosen[side] != null) return "You already picked. Waiting for the other player.";
  const pack = d.packs[side];
  if (!Number.isInteger(idx) || idx < 0 || idx >= pack.length) return "That card isn't in your pack.";
  if (!legalIdx(pack, d.picks[side]).includes(idx)) return `You already have the most copies of ${CARD[pack[idx]].name} allowed.`;
  d.picks[side].push(pack[idx]); pack.splice(idx, 1); d.chosen[side] = idx;
  if (d.chosen.a != null && d.chosen.b != null) {
    if (d.packs.a.length) { const t = d.packs.a; d.packs.a = d.packs.b; d.packs.b = t; d.step++; beginStep(room); }
    else if (d.round + 1 < DRAFT.rounds) { d.round++; newRound(room); }
    else { d.stage = "review"; d.ready = new Set(); draftTimer(room, DRAFT.reviewMs, () => finishDraft(room)); sendDraft(room); }
  } else if (!auto) sendDraft(room);
  return null;
}
function finishDraft(room) {
  const d = room.draft; if (!d || d.stage !== "review") return;
  clearTimeout(d.timer); d.stage = "done";
  for (const p of room.players) p.deck = { name: "Draft deck", cards: d.picks[p.side].slice() };
  room.draft = null; start(room);
}

function redact(g, side) {
  const v = JSON.parse(JSON.stringify(g));
  const o = side === "a" ? "b" : "a";
  v[o].hand = v[o].hand.map(() => "?");
  v.a.deck = v.a.deck.map(() => "?");
  v.b.deck = v.b.deck.map(() => "?");
  return v;
}
function broadcast(room) {
  for (const p of room.players) {
    const peer = room.players.find((q) => q !== p);
    if (!p.ws) continue;
    send(p.ws, { t: "state", mode: room.mode, rk: Object.fromEntries([...room.rematch].map(([tk, k]) => [room.players.find((q) => q.token === tk)?.side, k])), code: room.code, side: p.side, seq: room.seq, g: redact(room.g, p.side), last: room.last, peer: !!(peer && (peer.ai || peer.ws)), rematch: [...room.rematch.keys()].map((tk) => room.players.find((q) => q.token === tk)?.side) });
  }
  if (room.tourRoom) tourAfter(room);
}
function start(room) {
  const pa = room.players.find((p) => p.side === "a"), pb = room.players.find((p) => p.side === "b");
  room.g = newGame({ name: pa.name, deck: pa.deck.cards, hp: 15 }, { name: pb.name, deck: pb.deck.cards, hp: 15 });
  room.seq++; room.last = null; room.rematch = new Map();
  broadcast(room);
}
function attach(room, p, ws) {
  if (p.ws && p.ws !== ws) { try { send(p.ws, { t: "error", msg: "This seat was opened on another device.", fatal: true }); p.ws.close(); } catch {} }
  p.ws = ws; ws.room = room; ws.player = p; room.touched = Date.now();
  send(ws, { t: "room", mode: room.mode, code: room.code, token: p.token, side: p.side, name: p.name });
  const peer = room.players.find((q) => q !== p);
  if (peer) send(peer.ws, { t: "peer", here: true, name: p.name });
  if (room.draft) { sendDraft(room, p); if (peer) sendDraft(room, peer); } else if (room.g) broadcast(room); else send(ws, { t: "wait", code: room.code, mode: room.mode });
}

// ================= TOURNAMENT =================
// 4 seats, single elimination. Semifinals (seat 1 v 4, seat 2 v 3) run at the same time, then the final.
// Every match is a normal Draft (same packs, picks and deck size). The host can put the AI in empty seats,
// and a player who drops mid-tournament is replaced by the AI. AI vs AI matches are simulated on the server.
const TOUR = { aiMs: Number(process.env.TOUR_AI_MS) || 900, aiPickMs: Number(process.env.TOUR_AI_PICK_MS) || 600, simMs: Number(process.env.TOUR_SIM_MS) || 5000, dropMs: Number(process.env.TOUR_DROP_MS) || 45000 };
const AI_NAMES = ["Baron Vex", "Lady Morrow", "Old Grimtusk", "Sister Ash", "The Gilded Hand"];
const seatHere = (s) => s.ai || !!s.ws;
const mkSeat = (i) => ({ idx: i, token: null, name: "", ws: null, ai: false, human: false, wasHuman: false, dropT: null });
const resetSeat = (s) => { clearTimeout(s.dropT); Object.assign(s, mkSeat(s.idx)); };
const ROUND_NAME = ["Semifinal 1", "Semifinal 2", "Final"];
function lostSeat(t, idx) { return t.matches.some((m) => m && m.status === "done" && (m.sa === idx || m.sb === idx) && m.winner !== idx); }
function activeRec(room, seat) { return room.tour.matches.find((m) => m && m.room && m.status !== "done" && (m.sa === seat.idx || m.sb === seat.idx)) || null; }
function tourView(room, seat) {
  const t = room.tour;
  const mine = seat ? t.matches.map((m, i) => (m && (m.sa === seat.idx || m.sb === seat.idx) ? i : -1)).filter((i) => i >= 0) : [];
  return {
    t: "tour", code: room.code, you: seat ? seat.idx : -1, host: !!seat && seat.idx === t.host, stage: t.stage,
    seats: t.seats.map((s) => ({ name: s.name, ai: s.ai, human: s.human, standIn: s.ai && s.wasHuman, here: seatHere(s), empty: !s.ai && !s.human })),
    matches: t.matches.map((m, i) => (m ? { name: ROUND_NAME[i], a: m.sa, b: m.sb, first: m.first, status: m.status, winner: m.winner, rounds: m.rounds, hp: m.hp, sim: m.sim } : null)),
    champion: t.champion, notice: t.notice || "", myMatch: mine.length ? mine[mine.length - 1] : -1,
    out: seat ? lostSeat(t, seat.idx) : false, full: t.seats.every((s) => s.ai || s.human),
  };
}
function tourSend(room, notice) {
  if (notice !== undefined) room.tour.notice = notice;
  for (const s of room.tour.seats) if (s.ws) send(s.ws, tourView(room, s));
}
function attachTour(room, seat, ws) {
  if (seat.ws && seat.ws !== ws) { try { send(seat.ws, { t: "error", msg: "This seat was opened on another device.", fatal: true }); seat.ws.close(); } catch {} }
  seat.ws = ws; ws.room = room; ws.player = seat; room.touched = Date.now();
  clearTimeout(seat.dropT); seat.dropT = null;
  let note;
  if (seat.ai && seat.wasHuman) { seat.ai = false; note = `${seat.name} is back and took their seat back from the AI.`; }
  send(ws, { t: "room", mode: "tour", code: room.code, token: seat.token, side: null, name: seat.name });
  tourSend(room, note);
  const rec = activeRec(room, seat);
  if (rec) { const mr = rec.room; if (mr.draft) sendDraft(mr, mr.players.find((q) => q.seat === seat)); else if (mr.g) broadcast(mr); }
}
function matchPlayer(seat, side) {
  return { seat, side, deck: null, get token() { return seat.token || `ai-${seat.idx}`; }, get name() { return seat.name; }, get ws() { return seat.ai ? null : seat.ws; }, get ai() { return seat.ai; } };
}
// Quick server-side AI vs AI match: draft both decks with the auto-pick rule, then play it out.
function simMatch(nameA, nameB) {
  const picks = { a: [], b: [] };
  for (let r = 0; r < DRAFT.rounds; r++) {
    let packs = { a: genPack(), b: genPack() };
    while (packs.a.length) {
      for (const sd of ["a", "b"]) { const d = { packs, picks, sel: { a: null, b: null } }; const i = autoPick(d, sd); picks[sd].push(packs[sd][i]); packs[sd].splice(i, 1); }
      packs = { a: packs.b, b: packs.a };
    }
  }
  let g = newGame({ name: nameA, deck: picks.a, hp: 15 }, { name: nameB, deck: picks.b, hp: 15 });
  for (let k = 0; k < 3000 && !g.winner; k++) {
    if (g.phase === "mull") { const sd = g.mull.a < 0 ? "a" : "b"; g = apply(g, { t: "mull", side: sd, idx: aiMulligan(g, sd) }); continue; }
    let n = apply(g, aiAction(g)); if (n === g) n = apply(g, { t: "end" }); if (n === g) break; g = n;
  }
  const winner = g.winner || (g.a.hp >= g.b.hp ? "a" : "b");
  return { winner, rounds: g.round, hp: [Math.max(0, g.a.hp), Math.max(0, g.b.hp)] };
}
function startMatch(room, mi, sa, sb) {
  const t = room.tour, A = t.seats[sa], B = t.seats[sb];
  // Coin flip for who goes first in each match.
  const flip = crypto.randomInt(2) === 1;
  const rec = { mi, sa, sb, first: flip ? sb : sa, status: "draft", winner: null, rounds: 0, hp: null, sim: false, room: null };
  t.matches[mi] = rec;
  if (A.ai && B.ai) {
    rec.status = "sim"; rec.sim = true;
    setTimeout(() => { if (rooms.get(room.code) !== room || rec.status !== "sim") return; const r = flip ? simMatch(B.name, A.name) : simMatch(A.name, B.name); const aWon = (r.winner === "a") !== flip; finishRec(room, rec, aWon ? sa : sb, r.rounds, flip ? [r.hp[1], r.hp[0]] : r.hp); }, TOUR.simMs);
    return;
  }
  const child = { code: room.code, mode: "tour", tourRoom: room, rec, players: flip ? [matchPlayer(B, "a"), matchPlayer(A, "b")] : [matchPlayer(A, "a"), matchPlayer(B, "b")], g: null, draft: null, seq: (mi + 1) * 1000000, last: null, touched: Date.now(), rematch: new Map(), aiT: null };
  rec.room = child;
  startDraft(child);
}
function finishRec(room, rec, winnerSeat, rounds, hp) {
  if (rec.status === "done") return;
  const t = room.tour, nm = (i) => t.seats[i].name;
  rec.status = "done"; rec.winner = winnerSeat; rec.rounds = rounds; rec.hp = hp;
  if (rec.room) { clearTimeout(rec.room.aiT); if (rec.room.draft) clearTimeout(rec.room.draft.timer); }
  const loser = winnerSeat === rec.sa ? rec.sb : rec.sa;
  const [m0, m1, m2] = t.matches;
  if (t.stage === "semis" && m0 && m1 && m0.status === "done" && m1.status === "done") {
    t.stage = "final";
    t.notice = `${nm(winnerSeat)} beat ${nm(loser)}. Final: ${nm(m0.winner)} vs ${nm(m1.winner)}.`;
    startMatch(room, 2, m0.winner, m1.winner);
    tourSend(room);
    return;
  }
  if (t.stage === "final" && m2 && m2.status === "done") {
    t.stage = "done"; t.champion = m2.winner;
    tourSend(room, `${nm(m2.winner)} wins the tournament!`);
    return;
  }
  tourSend(room, `${nm(winnerSeat)} beat ${nm(loser)} in ${ROUND_NAME[rec.mi]}.`);
}
function tourAfter(child) {
  const rec = child.rec, room = child.tourRoom;
  if (!rec || rec.status === "done") return;
  if (child.g && child.g.winner) {
    const g = child.g, sideOf = (idx) => child.players.find((q) => q.seat.idx === idx).side;
    finishRec(room, rec, child.players.find((q) => q.side === g.winner).seat.idx, g.round, [Math.max(0, g[sideOf(rec.sa)].hp), Math.max(0, g[sideOf(rec.sb)].hp)]);
    return;
  }
  if (child.g && rec.status === "draft") { rec.status = "playing"; tourSend(room); }
  aiKick(child);
}
function aiKick(room) {
  if (room.aiT || !room.players.some((q) => q.ai) || (room.rec && room.rec.status === "done")) return;
  room.aiT = setTimeout(() => { room.aiT = null; if (alive(room)) aiStep(room); }, room.draft ? TOUR.aiPickMs : TOUR.aiMs);
}
function aiStep(room) {
  const d = room.draft;
  if (d) {
    if (d.stage === "pick") { for (const q of room.players) if (q.ai && room.draft === d && d.stage === "pick" && d.chosen[q.side] == null) takePick(room, q.side, autoPick(d, q.side), false); }
    else if (d.stage === "review") { const n = d.ready.size; for (const q of room.players) if (q.ai) d.ready.add(q.side); if (d.ready.size === 2) finishDraft(room); else if (d.ready.size !== n) sendDraft(room); }
    return;
  }
  const g = room.g; if (!g || g.winner) return;
  if (g.phase === "mull") {
    let changed = false;
    for (const q of room.players) if (q.ai && room.g.phase === "mull" && room.g.mull[q.side] < 0) { const idx = aiMulligan(room.g, q.side); room.g = apply(room.g, { t: "mull", side: q.side, idx }); room.seq++; room.last = { action: { t: "mull", side: q.side, n: idx.length }, actor: q.side }; changed = true; }
    if (changed) broadcast(room);
    return;
  }
  const cur = room.players.find((q) => q.side === g.turn);
  if (!cur || !cur.ai) return;
  let a = aiAction(g), next = apply(g, a);
  if (next === g) { a = { t: "end" }; next = apply(g, a); }
  if (next === g) return;
  room.g = next; room.seq++; room.last = { action: a, actor: g.turn };
  broadcast(room);
}
function dropToAI(room, seat, why) {
  const t = room.tour;
  if (t.stage === "lobby" || t.stage === "done" || lostSeat(t, seat.idx) || seat.ai) return;
  seat.ai = true; seat.wasHuman = true;
  tourSend(room, `${seat.name} ${why}. The AI is playing for them.`);
  const rec = activeRec(room, seat);
  if (rec && rec.room) { const mr = rec.room; if (mr.draft) sendDraft(mr); else if (mr.g) broadcast(mr); aiKick(mr); }
}
function handleTour(ws, room, seat, m) {
  const t = room.tour;
  if (m.t === "tseat") {
    if (seat.idx !== t.host || t.stage !== "lobby") { send(ws, { t: "error", msg: "Only the host can change seats before the start." }); return true; }
    const s = t.seats[m.idx]; if (!s || s === seat) return true;
    if (m.ai) {
      if (s.human && s.ws) { send(ws, { t: "error", msg: `${s.name} is here. You can only give the AI an empty or offline seat.` }); return true; }
      resetSeat(s); const used = new Set(t.seats.map((x) => x.name));
      s.ai = true; s.name = `${AI_NAMES.find((n) => !used.has(`${n} (AI)`)) || "Sellsword"} (AI)`;
      tourSend(room, `Seat ${s.idx + 1} is now ${s.name}.`);
    } else if (s.ai) { resetSeat(s); tourSend(room, `Seat ${s.idx + 1} is open again.`); }
    return true;
  }
  if (m.t === "tstart") {
    if (seat.idx !== t.host || t.stage !== "lobby") return true;
    if (!t.seats.every((s) => s.ai || s.human)) { send(ws, { t: "error", msg: "Fill all 4 seats with players or the AI first." }); return true; }
    t.stage = "semis";
    t.notice = `Semifinals: ${t.seats[0].name} vs ${t.seats[3].name}, and ${t.seats[1].name} vs ${t.seats[2].name}.`;
    startMatch(room, 0, 0, 3); startMatch(room, 1, 1, 2);
    for (const s of t.seats) if (s.human && !s.ws) s.dropT = setTimeout(() => { if (!s.ws && alive(room)) dropToAI(room, s, "is offline"); }, TOUR.dropMs);
    tourSend(room);
    return true;
  }
  if (m.t === "leave") {
    ws.room = null; ws.player = null; seat.ws = null;
    if (t.stage === "lobby") {
      const name = seat.name; resetSeat(seat);
      if (!t.seats.some((s) => s.human)) { rooms.delete(room.code); send(ws, { t: "left" }); return true; }
      if (seat.idx === t.host) { t.host = t.seats.find((s) => s.human).idx; }
      tourSend(room, `${name} left. ${t.seats[t.host].name} is the host.`);
    } else dropToAI(room, seat, "left");
    if (t.seats.every((s) => !s.ws) && t.stage === "done") rooms.delete(room.code);
    send(ws, { t: "left" });
    return true;
  }
  if (m.t === "rematch") return true;
  return false;
}

const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 16 * 1024 });
wss.on("connection", (ws) => {
  ws.alive = true;
  ws.on("pong", () => { ws.alive = true; });
  ws.on("message", (raw) => {
    let m; try { m = JSON.parse(String(raw)); } catch { send(ws, { t: "error", msg: "Bad message." }); return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "ping") { send(ws, { t: "pong" }); return; }
    if (m.t === "create") {
      if (m.mode === "tour") {
        const code = newCode(), seats = [0, 1, 2, 3].map(mkSeat);
        const room = { code, mode: "tour", players: seats, tour: { seats, host: 0, stage: "lobby", matches: [null, null, null], champion: null, notice: "" }, g: null, draft: null, seq: 0, last: null, touched: Date.now(), rematch: new Map() };
        Object.assign(seats[0], { human: true, token: crypto.randomUUID(), name: cleanName(m.name, "Host") });
        rooms.set(code, room); attachTour(room, seats[0], ws);
        return;
      }
      const mode = m.mode === "draft" ? "draft" : "match";
      const bad = mode === "draft" ? null : checkDeck(m.deck); if (bad) { send(ws, { t: "error", msg: bad }); return; }
      const code = newCode();
      const room = { code, mode, players: [], g: null, draft: null, seq: 0, last: null, touched: Date.now(), rematch: new Map() };
      const p = { token: crypto.randomUUID(), name: cleanName(m.name, "Host"), deck: mode === "draft" ? null : { name: String(m.deck.name || "Deck").slice(0, 40), cards: m.deck.cards.slice() }, side: "a", ws: null };
      room.players.push(p); rooms.set(code, room); attach(room, p, ws);
      return;
    }
    if (m.t === "join") {
      const code = String(m.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const room = rooms.get(code);
      if (!room) { send(ws, { t: "error", msg: `No room with code ${code || "(blank)"}. Check the code, or ask your friend to create a new room.` }); return; }
      if (room.mode === "tour") {
        const t = room.tour;
        if (t.stage !== "lobby") { send(ws, { t: "error", msg: "That tournament has already started." }); return; }
        const s = t.seats.find((x) => !x.human && !x.ai);
        if (!s) { send(ws, { t: "error", msg: "That tournament is full (4 seats)." }); return; }
        let name = cleanName(m.name, "Guest"); const used = new Set(t.seats.map((x) => x.name)); for (let k = 2; used.has(name); k++) name = `${cleanName(m.name, "Guest").slice(0, 17)} ${k}`;
        Object.assign(s, { human: true, ai: false, wasHuman: false, token: crypto.randomUUID(), name });
        attachTour(room, s, ws); tourSend(room, `${name} took seat ${s.idx + 1}.`);
        return;
      }
      if (room.players.length >= 2) { send(ws, { t: "error", msg: "That room already has two players." }); return; }
      const draft = room.mode === "draft";
      const bad = draft ? null : checkDeck(m.deck); if (bad) { send(ws, { t: "error", msg: bad }); return; }
      const host = room.players[0];
      const p = { token: crypto.randomUUID(), name: cleanName(m.name, "Guest"), deck: draft ? null : { name: String(m.deck.name || "Deck").slice(0, 40), cards: m.deck.cards.slice() }, side: "b", ws: null };
      if (p.name === host.name) p.name = `${p.name} 2`;
      room.players.push(p); attach(room, p, ws); if (draft) startDraft(room); else start(room);
      return;
    }
    if (m.t === "rejoin") {
      const room = rooms.get(String(m.code || "").toUpperCase());
      const p = room && room.players.find((q) => q.token === m.token);
      if (!p) { send(ws, { t: "error", msg: "That match has ended or expired. Start a new room.", gone: true }); return; }
      if (room.mode === "tour") { attachTour(room, p, ws); return; }
      attach(room, p, ws);
      return;
    }
    let room = ws.room, p = ws.player;
    if (!room || !p) { send(ws, { t: "error", msg: "You are not in a room." }); return; }
    if (room.mode === "tour") {
      room.touched = Date.now();
      if (handleTour(ws, room, p, m)) return;
      const rec = activeRec(room, p);
      if (!rec) { send(ws, { t: "error", msg: "Your next match hasn't started yet." }); return; }
      room = rec.room; p = room.players.find((q) => q.seat === ws.player);
    }
    room.touched = Date.now();
    if (m.t === "pick") {
      const err = takePick(room, p.side, m.idx, false);
      if (err) { send(ws, { t: "error", msg: err }); sendDraft(room, p); }
      return;
    }
    if (m.t === "sel") {
      const d = room.draft; if (!d || d.stage !== "pick" || d.chosen[p.side] != null) return;
      if (Number.isInteger(m.idx) && m.idx >= 0 && m.idx < d.packs[p.side].length) d.sel[p.side] = m.idx;
      return;
    }
    if (m.t === "ready") {
      const d = room.draft; if (!d || d.stage !== "review") return;
      d.ready.add(p.side);
      if (d.ready.size === 2) finishDraft(room); else sendDraft(room);
      return;
    }
    if (m.t === "act") {
      if (!room.g) { send(ws, { t: "error", msg: "Waiting for an opponent." }); return; }
      if (room.g.winner) { send(ws, { t: "error", msg: "The match is over." }); return; }
      if (room.g.phase === "mull") {
        // Opening-hand swap: both players choose privately and at the same time. Only the count is shared.
        const a = m.action;
        const idx = a && a.t === "mull" && Array.isArray(a.idx) && a.idx.length <= 4 && a.idx.every((i) => Number.isInteger(i)) ? a.idx : null;
        if (!idx) { send(ws, { t: "error", msg: "Choose which opening cards to swap first." }); broadcast(room); return; }
        let next;
        try { next = apply(room.g, { t: "mull", side: p.side, idx }); } catch (e) { console.error("mull failed", e); next = room.g; }
        if (next === room.g) { send(ws, { t: "error", msg: "You already locked in your hand." }); broadcast(room); return; }
        room.g = next; room.seq++; room.last = { action: { t: "mull", side: p.side, n: idx.length }, actor: p.side };
        broadcast(room);
        return;
      }
      if (room.g.turn !== p.side) { send(ws, { t: "error", msg: "It's not your turn." }); broadcast(room); return; }
      const a = m.action;
      const ok = a && ((a.t === "end") || (a.t === "play" && Number.isInteger(a.idx)) || (a.t === "attack" && Number.isInteger(a.uid) && a.target) || (a.t === "trib" && Number.isInteger(a.uid)));
      if (!ok) { send(ws, { t: "error", msg: "Invalid move." }); return; }
      const clean = a.t === "end" ? { t: "end" } : a.t === "trib" ? { t: "trib", uid: a.uid, pay: !!a.pay } : a.t === "play" ? { t: "play", idx: a.idx, ...(a.target ? { target: { side: a.target.side === "b" ? "b" : "a", uid: a.target.uid === "hero" ? "hero" : Number(a.target.uid) } } : {}) } : { t: "attack", uid: a.uid, target: { side: a.target.side === "b" ? "b" : "a", uid: a.target.uid === "hero" ? "hero" : Number(a.target.uid) } };
      let next;
      try { next = apply(room.g, clean); } catch (e) { console.error("apply failed", e); next = room.g; }
      if (next === room.g) { send(ws, { t: "error", msg: "That move isn't allowed right now." }); broadcast(room); return; }
      room.g = next; room.seq++; room.last = { action: clean, actor: p.side };
      broadcast(room);
      return;
    }
    if (m.t === "rematch") {
      if (!room.g || !room.g.winner) return;
      const kind = room.mode === "draft" && m.kind === "redraft" ? "redraft" : "same";
      room.rematch.set(p.token, kind);
      if (room.players.length === 2 && room.players.every((q) => room.rematch.get(q.token) === kind)) {
        for (const q of room.players) q.side = q.side === "a" ? "b" : "a"; // loser/winner swap seats so the other player goes first
        if (kind === "redraft") startDraft(room); else start(room);
      } else broadcast(room);
      return;
    }
    if (m.t === "leave") {
      room.players = room.players.filter((q) => q !== p);
      ws.room = null; ws.player = null;
      for (const q of room.players) send(q.ws, { t: "peer", here: false, left: true, name: p.name });
      if (room.draft) { clearTimeout(room.draft.timer); room.draft = null; }
      if (room.players.length === 0) rooms.delete(room.code);
      send(ws, { t: "left" });
      return;
    }
  });
  ws.on("close", () => {
    const room = ws.room, p = ws.player;
    if (!room || !p || p.ws !== ws) return;
    if (room.mode === "tour") {
      p.ws = null; room.touched = Date.now(); tourSend(room);
      if (room.tour.stage !== "lobby") { clearTimeout(p.dropT); p.dropT = setTimeout(() => { if (!p.ws && alive(room)) dropToAI(room, p, "dropped"); }, TOUR.dropMs); }
      return;
    }
    p.ws = null; room.touched = Date.now();
    for (const q of room.players) if (q !== p) send(q.ws, { t: "peer", here: false, name: p.name });
  });
});
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  const now = Date.now();
  for (const [code, room] of rooms) if (now - room.touched > ROOM_IDLE_MS && room.players.every((p) => !p.ws)) { if (room.draft) clearTimeout(room.draft.timer); rooms.delete(code); }
}, 15000);
server.listen(PORT, () => console.log(`Contract & Steel online on http://localhost:${PORT}`));
