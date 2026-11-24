// Contract & Steel online server: static files + WebSocket rooms. Host-authoritative: the server owns the game state.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import { newGame, apply, deckProblems, CARD } from "./engine.js";

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
    send(p.ws, { t: "state", code: room.code, side: p.side, seq: room.seq, g: redact(room.g, p.side), last: room.last, peer: !!(peer && peer.ws), rematch: [...room.rematch].map((tk) => room.players.find((q) => q.token === tk)?.side) });
  }
}
function start(room) {
  const pa = room.players.find((p) => p.side === "a"), pb = room.players.find((p) => p.side === "b");
  room.g = newGame({ name: pa.name, deck: pa.deck.cards, hp: 15 }, { name: pb.name, deck: pb.deck.cards, hp: 15 });
  room.seq++; room.last = null; room.rematch = new Set();
  broadcast(room);
}
function attach(room, p, ws) {
  if (p.ws && p.ws !== ws) { try { send(p.ws, { t: "error", msg: "This seat was opened on another device.", fatal: true }); p.ws.close(); } catch {} }
  p.ws = ws; ws.room = room; ws.player = p; room.touched = Date.now();
  send(ws, { t: "room", code: room.code, token: p.token, side: p.side, name: p.name });
  const peer = room.players.find((q) => q !== p);
  if (peer) send(peer.ws, { t: "peer", here: true, name: p.name });
  if (room.g) broadcast(room); else send(ws, { t: "wait", code: room.code });
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
      const bad = checkDeck(m.deck); if (bad) { send(ws, { t: "error", msg: bad }); return; }
      const code = newCode();
      const room = { code, players: [], g: null, seq: 0, last: null, touched: Date.now(), rematch: new Set() };
      const p = { token: crypto.randomUUID(), name: cleanName(m.name, "Host"), deck: { name: String(m.deck.name || "Deck").slice(0, 40), cards: m.deck.cards.slice() }, side: "a", ws: null };
      room.players.push(p); rooms.set(code, room); attach(room, p, ws);
      return;
    }
    if (m.t === "join") {
      const code = String(m.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const room = rooms.get(code);
      if (!room) { send(ws, { t: "error", msg: `No room with code ${code || "(blank)"}. Check the code, or ask your friend to create a new room.` }); return; }
      if (room.players.length >= 2) { send(ws, { t: "error", msg: "That room already has two players." }); return; }
      const bad = checkDeck(m.deck); if (bad) { send(ws, { t: "error", msg: bad }); return; }
      const host = room.players[0];
      const p = { token: crypto.randomUUID(), name: cleanName(m.name, "Guest"), deck: { name: String(m.deck.name || "Deck").slice(0, 40), cards: m.deck.cards.slice() }, side: "b", ws: null };
      if (p.name === host.name) p.name = `${p.name} 2`;
      room.players.push(p); attach(room, p, ws); start(room);
      return;
    }
    if (m.t === "rejoin") {
      const room = rooms.get(String(m.code || "").toUpperCase());
      const p = room && room.players.find((q) => q.token === m.token);
      if (!p) { send(ws, { t: "error", msg: "That match has ended or expired. Start a new room.", gone: true }); return; }
      attach(room, p, ws);
      return;
    }
    const room = ws.room, p = ws.player;
    if (!room || !p) { send(ws, { t: "error", msg: "You are not in a room." }); return; }
    room.touched = Date.now();
    if (m.t === "act") {
      if (!room.g) { send(ws, { t: "error", msg: "Waiting for an opponent." }); return; }
      if (room.g.winner) { send(ws, { t: "error", msg: "The match is over." }); return; }
      if (room.g.turn !== p.side) { send(ws, { t: "error", msg: "It's not your turn." }); broadcast(room); return; }
      const a = m.action;
      const ok = a && ((a.t === "end") || (a.t === "play" && Number.isInteger(a.idx)) || (a.t === "attack" && Number.isInteger(a.uid) && a.target));
      if (!ok) { send(ws, { t: "error", msg: "Invalid move." }); return; }
      const clean = a.t === "end" ? { t: "end" } : a.t === "play" ? { t: "play", idx: a.idx, ...(a.target ? { target: { side: a.target.side === "b" ? "b" : "a", uid: a.target.uid === "hero" ? "hero" : Number(a.target.uid) } } : {}) } : { t: "attack", uid: a.uid, target: { side: a.target.side === "b" ? "b" : "a", uid: a.target.uid === "hero" ? "hero" : Number(a.target.uid) } };
      let next;
      try { next = apply(room.g, clean); } catch (e) { console.error("apply failed", e); next = room.g; }
      if (next === room.g) { send(ws, { t: "error", msg: "That move isn't allowed right now." }); broadcast(room); return; }
      room.g = next; room.seq++; room.last = { action: clean, actor: p.side };
      broadcast(room);
      return;
    }
    if (m.t === "rematch") {
      if (!room.g || !room.g.winner) return;
      room.rematch.add(p.token);
      if (room.players.length === 2 && room.players.every((q) => room.rematch.has(q.token))) {
        for (const q of room.players) q.side = q.side === "a" ? "b" : "a"; // loser/winner swap seats so the other player goes first
        start(room);
      } else broadcast(room);
      return;
    }
    if (m.t === "leave") {
      room.players = room.players.filter((q) => q !== p);
      ws.room = null; ws.player = null;
      for (const q of room.players) send(q.ws, { t: "peer", here: false, left: true, name: p.name });
      if (room.players.length === 0) rooms.delete(room.code);
      send(ws, { t: "left" });
      return;
    }
  });
  ws.on("close", () => {
    const room = ws.room, p = ws.player;
    if (!room || !p || p.ws !== ws) return;
    p.ws = null; room.touched = Date.now();
    for (const q of room.players) if (q !== p) send(q.ws, { t: "peer", here: false, name: p.name });
  });
});
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.alive) { ws.terminate(); continue; } ws.alive = false; ws.ping(); }
  const now = Date.now();
  for (const [code, room] of rooms) if (now - room.touched > ROOM_IDLE_MS && room.players.every((p) => !p.ws)) rooms.delete(code);
}, 15000);
server.listen(PORT, () => console.log(`Contract & Steel online on http://localhost:${PORT}`));
