// Accounts over HTTP + WebSocket: signup/login/logout/portrait, then online, draft, tournament and siege co-op results land in the stats.
import WebSocket from "ws";
import { aiAction, apply, PREMADE } from "../engine.js";
const BASE = process.env.BASE || "http://localhost:8080";
const WSURL = BASE.replace(/^http/, "ws") + "/ws";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const api = async (path, body, tok) => { const r = await fetch(BASE + path, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", ...(tok ? { authorization: `Bearer ${tok}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); let d = {}; try { d = await r.json(); } catch {} return { code: r.status, d }; };
const sfx = Date.now().toString(36).slice(-5);
const U1 = `tester_a_${sfx}`, U2 = `tester_b_${sfx}`, PW = "correct-horse-" + sfx;
check((await api("/api/status")).d.accounts === true, "accounts are up");
check((await api("/api/signup", { username: "x", password: PW })).code === 400, "short username rejected");
check((await api("/api/signup", { username: U1, password: "short" })).code === 400, "short password rejected");
const s1 = await api("/api/signup", { username: U1, password: PW, pic: "selene" });
check(s1.code === 200 && s1.d.token && s1.d.user.pic === "selene" && s1.d.user.stats.played === 0, "sign up A with a portrait");
check(!JSON.stringify(s1.d).includes(PW) && !JSON.stringify(s1.d.user).includes("s1$"), "no password or hash in the reply");
check((await api("/api/signup", { username: U1.toUpperCase(), password: PW })).code === 409, "duplicate username (any case) rejected");
const s2 = await api("/api/signup", { username: U2, password: PW, pic: "rotmaw" }); check(s2.code === 200, "sign up B");
check((await api("/api/login", { username: U1, password: "wrong-password" })).code === 401, "wrong password rejected");
const l1 = await api("/api/login", { username: U1.toUpperCase(), password: PW }); check(l1.code === 200 && l1.d.token !== s1.d.token, "log in A (case-insensitive name) gets a new session");
let TA = l1.d.token; const TB = s2.d.token;
check((await api("/api/pic", { pic: "not-a-card" }, TA)).code === 400, "bad portrait rejected");
check((await api("/api/pic", { pic: "hollowqueen" }, TA)).d.user.pic === "hollowqueen", "portrait changed");
check((await api("/api/logout", {}, s1.d.token)).code === 200 && (await api("/api/me", null, s1.d.token)).code === 401, "logout ends that session");
check((await api("/api/me", null, TA)).code === 200, "other session still valid");
check((await api("/api/me", null, "garbage")).code === 401, "garbage token rejected");

function bot(name, tok, pic) {
  const c = { name, msgs: [], st: null, room: null, side: null, done: false, acted: -1, siege: null, draft: null, tour: null };
  c.ws = new WebSocket(WSURL);
  c.open = new Promise((r) => c.ws.on("open", r));
  c.send = (m) => c.ws.send(JSON.stringify({ ...m, ...(tok && (m.t === "create" || m.t === "join") ? { auth: tok, pic } : {}) }));
  c.ws.on("message", (d) => {
    const m = JSON.parse(String(d)); c.msgs.push(m);
    if (m.t === "room") c.room = m;
    if (m.t === "draft") { c.draft = m; if (m.stage === "pick" && !m.done && m.legal.length) c.send({ t: "pick", idx: m.legal[0] }); if (m.stage === "review" && !(m.ready || []).includes(m.side)) c.send({ t: "ready" }); }
    if (m.t === "tour") c.tour = m;
    if (m.t === "siege") c.siege = m;
    if (m.t === "state") {
      c.st = m; c.side = m.side; const g = m.g; if (g.winner) { c.done = true; return; }
      if (c.acted === m.seq) return;
      if (g.phase === "roll") { if (g.roll && g.roll.winner === m.side) { c.acted = m.seq; c.send({ t: "act", action: { t: "first", first: true } }); } return; }
      if (g.phase === "mull") { if (g.mull && g.mull[m.side] < 0) { c.acted = m.seq; c.send({ t: "act", action: { t: "mull", idx: [] } }); } return; }
      if (g.turn === m.side) { c.acted = m.seq; let a = aiAction(g); if (apply(g, a) === g) a = { t: "end" }; c.send({ t: "act", action: a }); }
    }
    if (m.t === "error" && c.st && !c.st.g.winner && c.st.g.turn === c.side && c.st.g.phase === "play") c.send({ t: "act", action: { t: "end" } });
  });
  return c;
}
const until = async (f, ms, what) => { for (let t = 0; t < ms; t += 100) { if (f()) return true; await sleep(100); } console.log("  timeout:", what); return false; };
const me = async (tok) => (await api("/api/me", null, tok)).d.user;
// ---- online match ----
{
  const A = bot("A", TA, "hollowqueen"), B = bot("B", TB, "rotmaw"); await A.open; await B.open;
  A.send({ t: "create", name: U1, deck: { name: PREMADE[0].name, cards: PREMADE[0].cards } }); await until(() => A.room, 3000, "room");
  B.send({ t: "join", code: A.room.code, name: U2, deck: { name: PREMADE[1].name, cards: PREMADE[1].cards } });
  await until(() => A.st && B.st, 5000, "state");
  check(A.st.pics && A.st.pics.a === "hollowqueen" && A.st.pics.b === "rotmaw", "match state carries both portraits " + JSON.stringify(A.st.pics));
  check(await until(() => A.done && B.done, 120000, "online match end"), "online match finished");
  await sleep(1500);
  const a = await me(TA), b = await me(TB); const aw = A.st.g.winner === "a";
  console.log("  online:", JSON.stringify(a.stats.modes.online), JSON.stringify(b.stats.modes.online), a.stats.recent[0]);
  check(a.stats.modes.online.w + a.stats.modes.online.l === 1 && b.stats.modes.online.w + b.stats.modes.online.l === 1 && a.stats.modes.online.w === (aw ? 1 : 0), "online win/loss recorded for both");
  check(a.stats.recent[0] && a.stats.recent[0].opp === U2 && a.stats.recent[0].mode === "online" && a.stats.recent[0].fac, "recent match: mode, opponent, faction");
  check(Object.keys(a.stats.cards).length > 0 && Object.keys(a.stats.fac).length === 1, "most-played cards and faction tracked");
  check(a.stats.played === 1 && (aw ? a.stats.streak === 1 && a.stats.best === 1 : a.stats.streak === 0), "games played and streak");
  A.ws.close(); B.ws.close();
}
// ---- draft match ----
{
  const A = bot("A", TA, "hollowqueen"), B = bot("B", TB, "rotmaw"); await A.open; await B.open;
  A.send({ t: "create", mode: "draft", name: U1 }); await until(() => A.room, 3000, "room");
  B.send({ t: "join", code: A.room.code, name: U2 });
  check(await until(() => A.draft && A.draft.pics && A.draft.pics.b === "rotmaw", 5000, "draft pics"), "draft messages carry the opponent's portrait");
  check(await until(() => A.done && B.done, 180000, "draft match end"), "draft match finished");
  await sleep(1500); const a = await me(TA);
  check(a.stats.modes.draft.w + a.stats.modes.draft.l === 1 && a.stats.recent[0].mode === "draft", "draft result recorded");
  A.ws.close(); B.ws.close();
}
// ---- tournament (A + 3 computer seats) ----
{
  const A = bot("A", TA, "hollowqueen"); await A.open;
  A.send({ t: "create", mode: "tour", name: U1 }); await until(() => A.tour, 3000, "tour");
  check(A.tour.seats[0].pic === "hollowqueen", "tournament seat shows the portrait");
  for (const i of [1, 2, 3]) A.send({ t: "tseat", idx: i, ai: true });
  await until(() => A.tour && A.tour.full, 3000, "full"); A.send({ t: "tstart" });
  check(await until(() => A.done, 240000, "tour match"), "tournament match finished");
  await sleep(1500); const a = await me(TA);
  check(a.stats.modes.tour.w + a.stats.modes.tour.l >= 1 && a.stats.recent[0].mode === "tour", "tournament result recorded: " + JSON.stringify(a.stats.modes.tour));
  A.send({ t: "leave" }); A.ws.close();
}
// ---- siege co-op: both press Ready with no defenders until the castle falls ----
{
  const A = bot("A", TA, "hollowqueen"), B = bot("B", TB, "rotmaw"); await A.open; await B.open;
  A.send({ t: "create", mode: "siege", name: U1 }); await until(() => A.room, 3000, "room");
  B.send({ t: "join", code: A.room.code, name: U2 });
  check(await until(() => A.siege && A.siege.pics && A.siege.pics[0] === "hollowqueen" && A.siege.pics[1] === "rotmaw", 5000, "siege pics"), "siege co-op carries both portraits");
  let lastDay = 0;
  const ok = await until(() => { const s = A.siege && A.siege.s; if (!s) return false; if (s.phase === "lost" || s.phase === "won") return true; if (s.phase === "day" && s.day !== lastDay) { lastDay = s.day; A.send({ t: "sact", a: { t: "ready" } }); B.send({ t: "sact", a: { t: "ready" } }); } if (s.phase === "night" && s.g && s.g.winner) A.send({ t: "sfin" }); return false; }, 240000, "siege end");
  check(ok, "co-op siege ended: " + (A.siege && A.siege.s.phase) + " on day " + (A.siege && A.siege.s.day));
  await sleep(1500); const a = await me(TA), b = await me(TB);
  check(a.stats.modes.siegeCoop.l === 1 && b.stats.modes.siegeCoop.l === 1 && a.stats.siegeBest >= 1 && a.stats.recent[0].mode === "siegeCoop" && /with/.test(a.stats.recent[0].opp), "siege co-op loss recorded for both with best day " + a.stats.siegeBest);
  A.ws.close(); B.ws.close();
}
// ---- siege solo report ----
{
  const r = await api("/api/report", { mode: "siegeSolo", win: true, day: 12, fac: "iron", cards: { recruit: 3, brawler: 2 } }, TB);
  check(r.code === 200 && r.d.user.stats.modes.siegeSolo.w === 1 && r.d.user.stats.siegeWins === 1 && r.d.user.stats.siegeBest === 12, "solo siege result reported");
  check((await api("/api/report", { mode: "online", win: true }, TB)).code === 400, "client can't report online results");
}
console.log(`users ${U1} ${U2}`);
console.log(fails ? `${fails} FAIL` : "ALL PASS"); process.exit(fails ? 1 : 0);
