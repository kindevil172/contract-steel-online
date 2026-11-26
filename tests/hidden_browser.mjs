// Hidden rework, real browser + WebSocket bot, against the running server.
//   ROLE=opp   : the browser is the OPPONENT of a Hidden deck (bot). It must see only shadowy cards, and the WS frames must never carry the card.
//   ROLE=owner : the browser plays the Hidden deck; it sees its own cards with the Hidden marker and attacks through the UI.
// Both roles check: the reveal attack takes no damage back, and a First Strike defender (Jordan) still strikes first.
import puppeteer from "puppeteer-core";
import WebSocket from "ws";
import fs from "node:fs";
import { CARD, COLLECTION, canAttackTarget } from "../engine.js";
const BASE = process.env.BASE || "http://localhost:8080", WSURL = BASE.replace(/^http/, "ws") + "/ws";
const ROLE = process.env.ROLE || "opp", VIEW = process.env.VIEW || "phone";
const OUT = process.env.OUT || "/workspace/anim-test/shots/hidden-rework/"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const HID = COLLECTION.filter((c) => c.hidden).map((c) => c.id), HIDNAMES = HID.map((id) => CARD[id].name);
const fill = COLLECTION.filter((c) => c.kind === "unit" && !c.hidden && !c.trib && !c.legend && c.cost <= 3 && !c.first && !c.swift).map((c) => c.id);
const hidDeck = { name: "Hidden Test", cards: ["infiltrator", "infiltrator", "cutthroat", "cutthroat", "stalker", "stalker", "ambusher", "ambusher", "spymaster", "widow"] };
for (const id of ["brawler", "recruit", "pikeman", "gatewarden", "veteran"]) hidDeck.cards.push(id, id);
const fsDeck = { name: "First Strike Wall", cards: ["jordan", "jordan"] };
for (const id of ["brawler", "pikeman", "axe", "berserker", "poisoner", "taxman", "brute", "kobold", "slime"]) fsDeck.cards.push(id, id);
// ---------- bot ----------
function bot(name) {
  const c = { name, st: null, room: null, msgs: [] };
  c.ws = new WebSocket(WSURL);
  c.ws.on("message", (d) => { const m = JSON.parse(String(d)); c.msgs.push(m); if (m.t === "state") c.st = m; if (m.t === "room") c.room = m; if (m.t === "error") { console.log("  bot error:", m.msg, JSON.stringify(c.lastSent)); } });
  c.open = () => new Promise((r) => c.ws.on("open", r));
  c.send = (m) => { c.lastSent = m; c.ws.send(JSON.stringify(m)); };
  c.waitSeq = async (s0, ms = 10000) => { for (let t = 0; t < ms; t += 50) { if (c.st && c.st.seq > s0) return true; await sleep(50); } return false; };
  return c;
}
// ---------- browser ----------
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const ctx = await browser.createBrowserContext(); const P = await ctx.newPage();
const mobile = VIEW === "phone";
if (mobile) await P.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); else await P.setViewport({ width: 1280, height: 900 });
const errs = []; P.on("pageerror", (e) => errs.push(e.message));
const frames = []; const cdp = await P.target().createCDPSession(); await cdp.send("Network.enable");
cdp.on("Network.webSocketFrameReceived", (e) => frames.push(e.response.payloadData));
const myDeck = ROLE === "owner" ? hidDeck : fsDeck, botDeck = ROLE === "owner" ? fsDeck : hidDeck;
await P.evaluateOnNewDocument((d) => { try { localStorage.setItem("contract-steel-decks-v1", JSON.stringify([{ id: "test-deck", name: d.name, cards: d.cards }])); } catch {} }, myDeck);
const tap = async (h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); if (mobile) await h.tap(); else await h.click(); await sleep(250); };
async function byText(text, sel = "button") { for (const h of await P.$$(sel)) { const t = await h.evaluate((e) => e.textContent.trim()); if ((t === text || (text instanceof RegExp && text.test(t))) && !(await h.evaluate((e) => e.disabled))) return h; } return null; }
const press = async (t, sel) => { const h = await byText(t, sel); if (!h) throw new Error("no " + t); await tap(h); };
const body = () => P.evaluate(() => document.body.innerText);
const shot = async (f) => { if (/0[34]-/.test(f)) { await P.evaluate(() => window.scrollTo(0, 0)); await sleep(200); } await P.screenshot({ path: OUT + `${VIEW}-${ROLE}-${f}` }); };
// bot hosts, browser joins
const B = bot("Bot"); await B.open();
B.send({ t: "create", mode: "match", name: ROLE === "owner" ? "Shieldbot" : "Shadebot", deck: botDeck });
for (let t = 0; t < 100 && !B.room; t++) await sleep(50);
await P.goto(`${BASE}/?room=${B.room.code}`); await sleep(1200);
await press(/Hidden Test|First Strike Wall/, "div[style*='cursor: pointer']"); await press("Join room");
for (let t = 0; t < 200 && !(B.st && B.st.g); t++) await sleep(50);
const bs = () => B.st.side, bg = () => B.st.g;
// roll: whoever wins makes the browser go first? keep it simple: the bot's side goes second when it chooses
for (let t = 0; t < 300; t++) {
  const g = bg(); if (g.phase !== "roll") break;
  if (g.roll && g.roll.winner === bs()) { B.send({ t: "act", action: { t: "first", first: false } }); await sleep(400); }
  else { const h = await byText("Go first"); if (h) { await tap(h); await sleep(400); } }
  await sleep(100);
}
for (let t = 0; t < 100 && bg().phase === "roll"; t++) await sleep(100);
B.send({ t: "act", action: { t: "mull", idx: [] } });
for (let t = 0; t < 80; t++) { const h = await byText("Keep this hand"); if (h) { await tap(h); break; } await sleep(150); }
for (let t = 0; t < 100 && bg().phase !== "play"; t++) await sleep(100);
check(bg().phase === "play", "match started");
// ---------- play ----------
let sawShadow = false, shadowShot = false, noRetal = null, fsHit = null, ownShot = false, ownerMarker = false, leak = [], frameLeak = 0;
const unitOf = (g, side, uid) => g[side].board.find((x) => x.uid === uid);
async function botTurn() {
  const g = bg(), me = bs(), p = g[me], foe = g[me === "a" ? "b" : "a"];
  if (p.due && p.due.length) { const s0 = B.st.seq; B.send({ t: "act", action: { t: "trib", uid: p.due[0], pay: true } }); await B.waitSeq(s0); return true; }
  // hire: Jordan first, else the cheapest unit
  const order = p.hand.map((id, idx) => ({ id, idx })).filter((x) => CARD[x.id].kind === "unit" && CARD[x.id].cost <= p.gold && p.board.length < 6 && (p.board.length < 3 || x.id === "jordan" || (ROLE === "opp" && CARD[x.id].hidden))).sort((x, y) => (y.id === "jordan") - (x.id === "jordan") || CARD[x.id].cost - CARD[y.id].cost);
  if (order.length) { const s0 = B.st.seq; B.send({ t: "act", action: { t: "play", idx: order[0].idx } }); await B.waitSeq(s0); return true; }
  if (ROLE === "opp") {
    // the Hidden bot: reveal-attack Jordan once, and a non-First-Strike sellsword once
    const hid = p.board.filter((u) => u.hidden && u.ready && !u.stun);
    const fs_ = me === "a" ? "b" : "a", okT = (u) => canAttackTarget(g, me, { side: fs_, uid: u.uid });
    const jordan = foe.board.find((u) => u.id === "jordan" && okT(u)), plain = foe.board.find((u) => !CARD[u.id].first && u.id !== "shade" && okT(u));
    const tgt = fsHit === null && jordan ? jordan : noRetal === null && plain ? plain : null;
    if (hid.length && tgt) {
      const u = hid.sort((x, y) => (tgt.id === "jordan" ? x.hp - y.hp : y.hp - x.hp))[0]; const before = { ...u }, tb = { ...tgt };
      if (tgt.id === "jordan") { await sleep(300); await P.evaluate(() => window.scrollTo(0, 0)); await sleep(200); await shot("02-before-first-strike.png"); }
      const s0 = B.st.seq; B.send({ t: "act", action: { t: "attack", uid: u.uid, target: { side: me === "a" ? "b" : "a", uid: tgt.uid } } }); await B.waitSeq(s0);
      const after = unitOf(bg(), me, u.uid), ta = unitOf(bg(), me === "a" ? "b" : "a", tgt.uid);
      if (tgt.id === "jordan") { fsHit = !after || after.hp === before.hp - tb.atk; console.log(`  First Strike: ${CARD[before.id].name} ${before.atk}/${before.hp} attacked Jordan ${tb.atk}/${tb.hp} -> attacker ${after ? after.hp + " hp" : "died"}, Jordan ${ta ? ta.hp + " hp" : "died"}`); await sleep(900); await shot("03-after-first-strike.png"); }
      else { noRetal = !!after && after.hp === before.hp && !after.hidden; console.log(`  Reveal attack: ${CARD[before.id].name} ${before.atk}/${before.hp} hit ${CARD[tb.id].name} ${tb.atk}/${tb.hp} -> attacker ${after ? after.hp + " hp" : "died"}, defender ${ta ? ta.hp + " hp" : "died"}`); await sleep(900); await shot("04-after-reveal-attack.png"); }
      return true;
    }
  }
  const s0 = B.st.seq; B.send({ t: "act", action: { t: "end" } }); await B.waitSeq(s0); return false;
}
async function browserTurn() {
  // pay any Tribute, then hire what we can (unit cards only), then (owner) attack from Hidden through the UI
  for (let k = 0; k < 4; k++) { const h = await byText(/^Pay /); if (!h) break; await tap(h); await sleep(400); }
  for (let guard = 0; guard < 8; guard++) {
    const before = await P.$$eval("[data-fx^='u']", (e) => e.length);
    const all = await P.$$("div[title]"); const PREF = ROLE === "opp" ? ["Jordan"] : HIDNAMES; const jf = []; for (const h of all) jf.push([(await h.evaluate((e, pr) => pr.some((n) => e.innerText.includes(n)), PREF)) ? 0 : 1, h]);
    const cards = jf.sort((x, y) => x[0] - y[0]).map((x) => x[1]); let did = false;
    for (const h of cards) {
      const ok = await h.evaluate((e) => !/is holding/.test(e.title) && e.getBoundingClientRect().width >= 100 && !e.closest("[data-tactic-show]") && !e.closest("[data-mull-hand]") && !e.closest("[data-recent-plays]") && e.style.opacity === "1" && !e.hasAttribute("data-fx"));
      if (!ok) continue;
      if (bg()[bs() === "a" ? "b" : "a"].board.length >= 3 && !(await h.evaluate((e, pr) => pr.some((n) => e.innerText.includes(n)), PREF))) continue;
      await tap(h); await sleep(500);
      if (/Choose a target/.test(await body())) { const c = await byText("Cancel"); if (c) await tap(c); continue; }
      if ((await P.$$eval("[data-fx^='u']", (e) => e.length)) > before) { did = true; break; }
    }
    if (!did) break;
  }
  if (ROLE === "owner") {
    const g = bg(), me = bs(), mine = me === "a" ? "b" : "a"; // the browser's side, seen by the bot
    const hid = g[mine].board.filter((u) => u.hidden); // shades in the bot's view
    if (hid.length && !ownShot) { await sleep(500); await shot("01-own-hidden-cards.png"); ownShot = true;
      const t = await P.$$eval("[data-fx^='u']", (els) => els.map((e) => e.innerText).join(" | ")); ownerMarker = HIDNAMES.some((n) => t.includes(n)) && /Hidden/.test(t); }
    const okT = (u) => canAttackTarget(g, mine, { side: me, uid: u.uid });
    const jordan = g[me].board.find((u) => u.id === "jordan" && okT(u)), plain = g[me].board.find((u) => !CARD[u.id].first && okT(u));
    const tgt = fsHit === null && jordan ? jordan : noRetal === null && plain ? plain : null;
    for (const u of hid) {
      if (!tgt) break;
      const el = await P.$(`[data-fx='u${u.uid}']`); if (!el) continue;
      const ready = await el.evaluate((e) => e.style.opacity !== "0.45"); if (!ready) continue;
      const nameHp = await el.evaluate((e) => e.innerText);
      const s0 = B.st.seq; await tap(el); const te = await P.$(`[data-fx='u${tgt.uid}']`); if (!te) break; await tap(te); await B.waitSeq(s0); await sleep(300);
      const after = unitOf(bg(), mine, u.uid), ta = unitOf(bg(), me, tgt.uid);
      const real = after ? CARD[after.id] : null;
      if (tgt.id === "jordan") { fsHit = !after || (real && after.hp === real.hp - CARD.jordan.atk); console.log(`  First Strike (UI attack): ${nameHp.split("\n")[0]} -> attacker ${after ? after.hp + " hp" : "died"}, Jordan ${ta ? ta.hp + " hp" : "died"}`); await sleep(700); await shot("03-after-first-strike.png"); }
      else { noRetal = !!after && !after.hidden && real && after.hp === real.hp; console.log(`  Reveal attack (UI): ${real ? real.name : "?"} -> attacker ${after ? after.hp + "/" + (real && real.hp) : "died"}, ${CARD[tgt.id].name} ${ta ? ta.hp + " hp" : "died"}`); await sleep(700); await shot("04-after-reveal-attack.png"); }
      break;
    }
  }
  const e = await byText("End turn"); if (e) await tap(e);
}
let turns = 0;
while (turns < 40 && !(noRetal !== null && fsHit !== null) && !bg().winner) {
  const g = bg();
  if (g.turn === bs()) { while (await botTurn()) { if (bg().winner) break; } turns++; }
  else {
    for (let t = 0; t < 60 && !(await byText("End turn")); t++) await sleep(100);
    if (ROLE === "opp") {
      // the opponent's screen: shadows only, never a name
      const sh = (await P.$$("[data-shadow-card]")).length; const t = await body();
      const named = HIDNAMES.filter((n) => t.includes(n) && bg()[bs()].board.some((u) => u.hidden && CARD[u.id].name === n) && !bg()[bs()].board.some((u) => !u.hidden && CARD[u.id].name === n) && !bg().log.some((l) => l.includes(n)));
      if (named.length) { leak.push(...named); if (leak.length === named.length) { const i = t.indexOf(named[0]); console.log("  LEAK context:", JSON.stringify(t.slice(Math.max(0, i - 200), i + 80))); } }
      if (sh) { sawShadow = true; if (!shadowShot) { await P.$eval("[data-shadow-card]", (e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await sleep(300); await shot("01-opponent-sees-shadows.png"); shadowShot = true; const rp = await P.$("[data-recent-hidden]"); check(!!rp, "recent plays show '☾ Hidden sellsword'"); } }
    }
    await browserTurn(); turns++;
  }
  await sleep(300);
}
console.log(`  loop ended: turns ${turns}, winner ${bg().winner}, browser board ${bg()[bs() === "a" ? "b" : "a"].board.map((u) => u.id).join(",")}, bot board ${bg()[bs()].board.map((u) => u.id + (u.hidden ? "(h)" : "")).join(",")}, hand ${bg()[bs()==="a"?"b":"a"].hand.length}`);
console.log("  browser hand:", JSON.stringify(await P.$$eval("div[title]", (els) => els.filter((e) => e.getBoundingClientRect().width >= 100 && !e.hasAttribute("data-fx")).map((e) => e.innerText.split("\n").slice(0, 2).join(" ") + " op=" + e.style.opacity))));
// frames: while hidden, the browser (opponent of the Hidden side) never receives the card id or stats
if (ROLE === "opp") {
  for (const f of frames) { let m; try { m = JSON.parse(f); } catch { continue; } if (m.t !== "state" || !m.g) continue; const o = m.side === "a" ? "b" : "a";
    for (const u of m.g[o].board) if (u.hidden && (u.id !== "shade" || u.atk !== 0 || u.hp !== 1 || u.trib || u.deadly)) frameLeak++;
    for (const x of m.g.plays || []) if (x.side === o && x.hid && x.id !== "shade") frameLeak++;
    for (const l of m.g.log || []) if (/hired (Masked|Alley|Veiled|Guild|The Faceless|Moss|Giant Centipede)/.test(l)) frameLeak++; }
  check(sawShadow, "opponent sees the shadowy face-down card");
  check(leak.length === 0, "no Hidden card name on the opponent's screen while hidden " + JSON.stringify(leak));
  check(frameLeak === 0 && frames.length > 5, `no Hidden card id/stats/log in ${frames.length} WebSocket frames to the opponent`);
} else check(ownerMarker, "owner sees their own Hidden card normally, with the Hidden marker");
check(noRetal === true, "reveal attack took no damage back");
check(fsHit === true, "First Strike defender still strikes first");
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS");
B.ws.close(); await browser.close(); process.exit(fails ? 1 : 0);
