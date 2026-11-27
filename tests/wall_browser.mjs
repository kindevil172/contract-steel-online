// Wall cards, real browser (desktop or 390x844 phone) vs a WebSocket bot.
// Guard of the Wall creates a Wall and shows 3 attack; the Wall can't attack; Iron Mage Apprentice adds a Wall and buffs all Walls +1/+1;
// when the last Wall dies, Guard of the Wall drops back to 1 attack.
import puppeteer from "puppeteer-core";
import WebSocket from "ws";
import fs from "node:fs";
import { CARD, canAttackTarget } from "../engine.js";
const BASE = process.env.BASE || "http://localhost:8080", WSURL = BASE.replace(/^http/, "ws") + "/ws";
const VIEW = process.env.VIEW || "phone", OUT = process.env.OUT || "/workspace/anim-test/shots/wall-cards-local/"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const myDeck = { name: "Wall Test", cards: [] }; for (const id of ["wallguard", "wallmage", "wallguard", "wallmage", "brawler", "pikeman", "slime", "raider", "looter", "brute", "kobold", "duelist"]) myDeck.cards.push(id); while (myDeck.cards.length < 20) myDeck.cards.push(["brawler", "pikeman", "slime", "raider", "looter", "brute", "kobold", "duelist"][myDeck.cards.length % 8]);
const botDeck = { name: "Bot Rabble", cards: [] }; for (const id of ["brawler", "raider", "kobold", "pikeman", "duelist", "berserker", "reaver", "taxman", "giantslime", "looter"]) botDeck.cards.push(id, id);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const mobile = VIEW === "phone"; const done = {}; let shots = 0; const errs = [];
const KEYS = ["guard", "noAttack", "mage", "lost"];
async function game(gi) {
  const ctx = await browser.createBrowserContext(); const P = await ctx.newPage();
  if (mobile) await P.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); else await P.setViewport({ width: 1280, height: 900 });
  P.on("pageerror", (e) => errs.push(e.message));
  let my = null; const cdp = await P.target().createCDPSession(); await cdp.send("Network.enable");
  cdp.on("Network.webSocketFrameReceived", (e) => { try { const m = JSON.parse(e.response.payloadData); if (m.t === "state" && m.g) my = m; } catch {} });
  await P.evaluateOnNewDocument((d) => { try { localStorage.setItem("contract-steel-decks-v1", JSON.stringify([{ id: "test-deck", name: d.name, cards: d.cards }])); } catch {} }, myDeck);
  const tap = async (h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); if (mobile) await h.tap(); else await h.click(); await sleep(300); };
  async function byText(text, sel = "button") { for (const h of await P.$$(sel)) { const t = await h.evaluate((e) => e.textContent.trim()); if ((t === text || (text instanceof RegExp && text.test(t))) && !(await h.evaluate((e) => e.disabled))) return h; } return null; }
  const press = async (t, sel) => { const h = await byText(t, sel); if (!h) throw new Error("no " + t); await tap(h); };
  const shot = async (f, sel) => { if (sel) await P.$eval(sel, (e) => e.scrollIntoView({ block: "center", behavior: "instant" })).catch(() => {}); await sleep(300); await P.screenshot({ path: OUT + `${VIEW}-${f}` }); shots++; };
  const domUnit = (uid) => P.$eval(`[data-fx='u${uid}']`, (e) => { const m = e.innerText.match(/⚔\s*(\d+)\s*♥\s*(-?\d+)/); return m ? { atk: +m[1], hp: +m[2], text: e.innerText } : null; }).catch(() => null);
  const B = { st: null, room: null }; B.ws = new WebSocket(WSURL);
  B.ws.on("message", (d) => { const m = JSON.parse(String(d)); if (m.t === "state") B.st = m; if (m.t === "room") B.room = m; if (m.t === "error") console.log("  bot error:", m.msg); });
  await new Promise((r) => B.ws.on("open", r)); B.send = (m) => B.ws.send(JSON.stringify(m));
  const waitSeq = async (s0, ms = 8000) => { for (let t = 0; t < ms; t += 50) { if (B.st && B.st.seq > s0 && my && my.seq >= B.st.seq) return true; await sleep(50); } return false; };
  B.send({ t: "create", mode: "match", name: "Rabblebot", deck: botDeck });
  for (let t = 0; t < 100 && !B.room; t++) await sleep(50);
  await P.goto(`${BASE}/?room=${B.room.code}`); await sleep(1500);
  await press(/Wall Test/, "div[style*='cursor: pointer']"); await press("Join room");
  for (let t = 0; t < 200 && !(B.st && B.st.g); t++) await sleep(50);
  const bs = () => B.st.side, ms = () => (bs() === "a" ? "b" : "a"), G = () => B.st.g, M = () => my.g;
  for (let t = 0; t < 300 && G().phase === "roll"; t++) { if (G().roll && G().roll.winner === bs()) { B.send({ t: "act", action: { t: "first", first: false } }); await sleep(400); } else { const h = await byText("Go first"); if (h) { await tap(h); await sleep(400); } } await sleep(100); }
  B.send({ t: "act", action: { t: "mull", idx: [] } });
  for (let t = 0; t < 80 && !(await byText("Keep this hand")); t++) await sleep(150);
  { const mh = await P.$$("[data-mull-hand] > div"); let sw = 0; for (const h of mh) { const tx = await h.evaluate((e) => e.innerText); if (!/Guard of the Wall|Iron Mage Apprentice/.test(tx)) { await tap(h); sw++; } } if (sw) await press(/^Swap \d+ card/); else await press("Keep this hand"); }
  for (let t = 0; t < 100 && G().phase !== "play"; t++) await sleep(100);
  const handEl = async (name) => { for (const h of await P.$$("div[title]")) { const ok = await h.evaluate((e, n) => e.innerText.includes(n) && !e.hasAttribute("data-fx") && e.getBoundingClientRect().width >= 100 && !e.closest("[data-tactic-show]") && !e.closest("[data-recent-plays]") && !e.closest("[data-mull-hand]") && e.style.opacity === "1", name); if (ok) return h; } return null; };
  const act = async (fn) => { const s0 = B.st.seq; await fn(); const ok = await waitSeq(s0, 6000); await sleep(450); return ok; };
  let bturns = 0;
  async function botTurn() {
    const g = G(), me = bs(), o = ms(), p = g[me];
    if (p.due && p.due.length) { await act(() => B.send({ t: "act", action: { t: "trib", uid: p.due[0], pay: true } })); return true; }
    const h = p.hand.map((id, idx) => ({ id, idx })).filter((x) => CARD[x.id].kind === "unit" && CARD[x.id].cost <= p.gold && p.board.length < 5).sort((x, y) => CARD[x.id].cost - CARD[y.id].cost)[0];
    if (h) { await act(() => B.send({ t: "act", action: { t: "play", idx: h.idx } })); return true; }
    // knock the Walls down once the browser has shown the Apprentice buff (or after a while)
    if (done.guard && (done.mage || bturns > 7)) {
      const wall = g[o].board.find((u) => u.id === "wall" && canAttackTarget(g, me, { side: o, uid: u.uid })); const r = p.board.find((u) => u.ready && !u.stun);
      if (wall && r) { await act(() => B.send({ t: "act", action: { t: "attack", uid: r.uid, target: { side: o, uid: wall.uid } } })); return true; }
    }
    await act(() => B.send({ t: "act", action: { t: "end" } })); bturns++; return false;
  }
  async function browserTurn() {
    for (let t = 0; t < 40 && !(await byText("End turn")); t++) await sleep(100);
    const me = ms();
    // the last Wall fell on the bot's turn: Guard of the Wall must be back to 1 attack
    { const p = M()[me]; const gw = p.board.find((u) => u.id === "wallguard"); if (done.guard && !done.lost && gw && !p.board.some((u) => u.id === "wall")) { const d = await domUnit(gw.uid); check(gw.atk === 1 && d && d.atk === 1, `last Wall fell: Guard of the Wall back to 1 attack (state ${gw.atk}, screen ${d && d.atk})`); done.lost = true; await shot("05-wall-gone-guard-1-attack.png", `[data-fx='u${gw.uid}']`); } }
    for (let step = 0; step < 5; step++) {
      const p = M()[me], has = (id) => p.hand.includes(id);
      if (!done.guard && has("wallguard") && p.gold >= 3 && p.board.length <= 3) {
        const h = await handEl("Guard of the Wall"); if (h) { await act(() => tap(h)); const q = M()[me]; const gw = q.board.find((u) => u.id === "wallguard"), w = q.board.find((u) => u.id === "wall");
          const dg = gw && (await domUnit(gw.uid)), dw = w && (await domUnit(w.uid));
          check(!!w && w.atk === 0 && w.hp === 4 && w.guard && dw && dw.atk === 0 && dw.hp === 4 && /Wall/.test(dw.text), `a 0/4 Guard Wall appeared (screen ${dw && dw.atk}/${dw && dw.hp})`);
          check(gw && gw.atk === 3 && dg && dg.atk === 3, `Guard of the Wall shows 3 attack with a Wall (screen ${dg && dg.atk}/${dg && dg.hp})`);
          await shot("01-wall-appears-guard-3-attack.png", `[data-fx='u${w ? w.uid : 0}']`); done.guard = true; continue; }
      }
      if (done.guard && !done.noAttack) { const w = p.board.find((u) => u.id === "wall"); if (w && p.board.some((u) => u.id === "wall") && bturns >= 1) { const el = await P.$(`[data-fx='u${w.uid}']`); if (el) { await tap(el); const t = await P.evaluate(() => document.body.innerText);
            const sel = /Pick a target for Wall/.test(t); const dim = await el.evaluate((e) => e.style.opacity); check(!sel && !w.ready, `the Wall can't attack: tapping it selects nothing (opacity ${dim})`); await shot("02-wall-cant-attack.png", `[data-fx='u${w.uid}']`); done.noAttack = true; } } }
      if (!done.mage && has("wallmage") && p.gold >= 4 && p.board.length <= 4 && (done.guard || bturns > 10)) {
        const before = p.board.filter((u) => u.id === "wall").map((u) => ({ uid: u.uid, atk: u.atk, hp: u.hp }));
        const h = await handEl("Iron Mage Apprentice"); if (h) { await act(() => tap(h)); const q = M()[me]; const ws = q.board.filter((u) => u.id === "wall");
          const fresh = ws.filter((u) => !before.some((b) => b.uid === u.uid)); const okOld = before.every((b) => { const n = ws.find((u) => u.uid === b.uid); return n && n.atk === b.atk + 1 && n.hp === b.hp + 1; });
          const dms = []; for (const u of ws) dms.push(await domUnit(u.uid));
          check(fresh.length === 1 && fresh[0].atk === 1 && fresh[0].hp === 5 && okOld && dms.every((d, i) => d && d.atk === ws[i].atk && d.hp === ws[i].hp), `Apprentice: new Wall 1/5 and every Wall +1/+1 (walls now ${ws.map((u) => u.atk + "/" + u.hp).join(", ")}; before ${before.map((b) => b.atk + "/" + b.hp).join(", ") || "none"})`);
          const m = q.board.find((u) => u.id === "wallmage"); await shot("03-apprentice-buffs-walls.png", `[data-fx='u${fresh[0] ? fresh[0].uid : 0}']`); if (m) await shot("04-apprentice-and-walls.png", `[data-fx='u${m.uid}']`); done.mage = true; continue; }
      }
      const fill = p.hand.map((id, idx) => ({ id, idx })).filter((x) => !["wallguard", "wallmage"].includes(x.id) && CARD[x.id].cost <= p.gold - (done.guard ? 0 : 3) && p.board.length < 3)[0];
      if (fill) { const h = await handEl(CARD[fill.id].name); if (h) { await act(() => tap(h)); continue; } }
      break;
    }
    const e = await byText("End turn"); if (e) await act(() => tap(e));
  }
  let turns = 0;
  while (turns < 26 && !G().winner && !KEYS.every((k) => done[k])) {
    if (G().turn === bs()) { while (await botTurn()) { if (G().winner) break; } } else { await browserTurn(); turns++; }
  }
  console.log(`  game ${gi}: ${turns} browser turns, winner ${G().winner || "-"}, done ${JSON.stringify(done)}`);
  B.ws.close(); await ctx.close();
}
for (let gi = 1; gi <= 4 && !KEYS.every((k) => done[k]); gi++) await game(gi);
for (const k of KEYS) check(!!done[k], `covered: ${k}`);
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS", `(${shots} shots in ${OUT})`);
await browser.close(); process.exit(fails ? 1 : 0);
