// Four card tweaks, real browser (desktop or 390x844 phone) vs a WebSocket bot, against the running server.
// Golem 7-gold hire (greyed out below 7 gold; 5/8 Guard at 7), Graci heals captain 5, Battlemage any target (own sellsword, own captain), Hostile Buyout for 4.
import puppeteer from "puppeteer-core";
import WebSocket from "ws";
import fs from "node:fs";
import { CARD, canAttackTarget } from "../engine.js";
const BASE = process.env.BASE || "http://localhost:8080", WSURL = BASE.replace(/^http/, "ws") + "/ws";
const VIEW = process.env.VIEW || "phone", OUT = process.env.OUT || "/workspace/anim-test/shots/four-tweaks-local/"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const TEST = ["golem", "battlemage", "graci", "buyout"];
const myDeck = { name: "Tweak Test", cards: [] }; for (const id of [...TEST, "brawler", "pikeman", "slime", "raider", "looter", "brute"]) myDeck.cards.push(id, id);
const botDeck = { name: "Bot Rabble", cards: [] }; for (const id of ["brawler", "raider", "kobold", "pikeman", "duelist", "berserker", "reaver", "taxman", "giantslime", "looter"]) botDeck.cards.push(id, id);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const mobile = VIEW === "phone";
const done = {}; // golemGrey, golemAlt, bmUnit, bmHero, graci, buyout
let shots = 0, errs = [];
async function game(gi) {
  const ctx = await browser.createBrowserContext(); const P = await ctx.newPage();
  if (mobile) await P.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); else await P.setViewport({ width: 1280, height: 900 });
  P.on("pageerror", (e) => errs.push(e.message));
  let my = null; const cdp = await P.target().createCDPSession(); await cdp.send("Network.enable");
  cdp.on("Network.webSocketFrameReceived", (e) => { try { const m = JSON.parse(e.response.payloadData); if (m.t === "state" && m.g) my = m; } catch {} });
  await P.evaluateOnNewDocument((d) => { try { localStorage.setItem("contract-steel-decks-v1", JSON.stringify([{ id: "test-deck", name: d.name, cards: d.cards }])); } catch {} }, myDeck);
  const tap = async (h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); if (mobile) await h.tap(); else await h.click(); await sleep(300); };
  async function byText(text, sel = "button", enabledOnly = true) { for (const h of await P.$$(sel)) { const t = await h.evaluate((e) => e.textContent.trim()); if ((t === text || (text instanceof RegExp && text.test(t))) && (!enabledOnly || !(await h.evaluate((e) => e.disabled)))) return h; } return null; }
  const press = async (t, sel) => { const h = await byText(t, sel); if (!h) throw new Error("no " + t); await tap(h); };
  const shot = async (f, sel) => { if (sel) await P.$eval(sel, (e) => e.scrollIntoView({ block: "center", behavior: "instant" })).catch(() => {}); await sleep(250); await P.screenshot({ path: OUT + `${VIEW}-${f}` }); shots++; };
  // bot
  const B = { st: null, room: null }; B.ws = new WebSocket(WSURL);
  B.ws.on("message", (d) => { const m = JSON.parse(String(d)); if (m.t === "state") B.st = m; if (m.t === "room") B.room = m; if (m.t === "error") console.log("  bot error:", m.msg); });
  await new Promise((r) => B.ws.on("open", r));
  B.send = (m) => B.ws.send(JSON.stringify(m));
  const waitSeq = async (s0, ms = 10000) => { for (let t = 0; t < ms; t += 50) { if (B.st && B.st.seq > s0 && my && my.seq >= B.st.seq) return true; await sleep(50); } return false; };
  B.send({ t: "create", mode: "match", name: "Rabblebot", deck: botDeck });
  for (let t = 0; t < 100 && !B.room; t++) await sleep(50);
  await P.goto(`${BASE}/?room=${B.room.code}`); await sleep(1500);
  await press(/Tweak Test/, "div[style*='cursor: pointer']"); await press("Join room");
  for (let t = 0; t < 200 && !(B.st && B.st.g); t++) await sleep(50);
  const bs = () => B.st.side, ms = () => (bs() === "a" ? "b" : "a"), G = () => B.st.g, M = () => my.g;
  for (let t = 0; t < 300 && G().phase === "roll"; t++) {
    if (G().roll && G().roll.winner === bs()) { B.send({ t: "act", action: { t: "first", first: false } }); await sleep(400); }
    else { const h = await byText("Go first"); if (h) { await tap(h); await sleep(400); } }
    await sleep(100);
  }
  B.send({ t: "act", action: { t: "mull", idx: [] } });
  // mulligan: swap everything that isn't a test card
  for (let t = 0; t < 80 && !(await byText("Keep this hand")); t++) await sleep(150);
  const mh = await P.$$("[data-mull-hand] > div"); let sw = 0;
  for (const h of mh) { const tx = await h.evaluate((e) => e.innerText); if (!TEST.some((id) => tx.includes(CARD[id].name))) { await tap(h); sw++; } }
  if (sw) await press(/^Swap \d+ card/); else await press("Keep this hand");
  for (let t = 0; t < 100 && G().phase !== "play"; t++) await sleep(100);
  check(G().phase === "play", `game ${gi}: match started`);
  const handEl = async (name) => { for (const h of await P.$$("div[title]")) { const ok = await h.evaluate((e, n) => e.innerText.includes(n) && !e.hasAttribute("data-fx") && e.getBoundingClientRect().width >= 100 && !e.closest("[data-hire-choice]") && !e.closest("[data-tactic-show]") && !e.closest("[data-recent-plays]") && !e.closest("[data-mull-hand]") && e.style.opacity === "1", name); if (ok) return h; } return null; };
  const act = async (fn) => { const s0 = B.st.seq; await fn(); const ok = await waitSeq(s0, 6000); await sleep(400); return ok; };
  async function botTurn() {
    const g = G(), me = bs(), o = ms(), p = g[me], foe = g[o];
    if (p.due && p.due.length) { await act(() => B.send({ t: "act", action: { t: "trib", uid: p.due[0], pay: true } })); return true; }
    const h = p.hand.map((id, idx) => ({ id, idx })).filter((x) => CARD[x.id].kind === "unit" && CARD[x.id].cost <= p.gold && p.board.length < 4).sort((x, y) => CARD[x.id].cost - CARD[y.id].cost)[0];
    if (h) { await act(() => B.send({ t: "act", action: { t: "play", idx: h.idx } })); return true; }
    // hit the browser's captain while it is above 9 (sets up Graci); never fight sellswords
    const r = p.board.find((u) => u.ready && !u.stun);
    if (r && foe.hp > 9 && canAttackTarget(g, me, { side: o, uid: "hero" })) { await act(() => B.send({ t: "act", action: { t: "attack", uid: r.uid, target: { side: o, uid: "hero" } } })); return true; }
    await act(() => B.send({ t: "act", action: { t: "end" } })); return false;
  }
  async function browserTurn() {
    for (let t = 0; t < 40 && !(await byText("End turn")); t++) await sleep(100);
    for (let step = 0; step < 6; step++) {
      const g = M(), me = ms(), p = g[me], o = bs(), has = (id) => p.hand.includes(id);
      if (has("golem") && !done.golemGrey && p.gold >= 5 && p.gold < 7) {
        const h = await handEl(CARD.golem.name); if (h) { await tap(h); await sleep(400);
          const ov = await P.$("[data-hire-choice='golem']"); const b7 = await byText("7 gold · 5/8 Guard", "button", false);
          const dis = b7 && (await b7.evaluate((e) => e.disabled)); const note = await P.$("[data-hire-note='gold']");
          check(!!ov && dis === true && !!note, `Golem hire choice at ${p.gold} gold: 7-gold option greyed out with a note`);
          await shot("01-golem-7gold-greyed.png", "[data-hire-choice='golem'] button"); done.golemGrey = true; await press("Cancel"); continue; }
      }
      if (has("golem") && !done.golemAlt && p.gold >= 7) {
        const h = await handEl(CARD.golem.name); if (h) { await tap(h); await sleep(400); await shot("02-golem-choice-7gold.png", "[data-hire-choice='golem'] button");
          const g0 = p.gold; await act(() => press("7 gold · 5/8 Guard"));
          const u = M()[me].board.find((x) => x.id === "golem" && x.guard && x.hp === 8);
          check(!!u && u.atk === 5 && u.maxHp === 8 && M()[me].gold === g0 - 7, `Golem hired for 7: ${u ? `${u.atk}/${u.hp} Guard` : "missing"}, gold ${g0} -> ${M()[me].gold}`);
          await shot("03-golem-5-8-guard.png", `[data-fx='u${u ? u.uid : 0}']`); done.golemAlt = true; continue; }
      }
      if (has("battlemage") && p.gold >= 5 && (!done.bmUnit || !done.bmHero) && p.board.length < 6) {
        const target = !done.bmUnit ? p.board.slice().sort((x, y) => y.hp - x.hp)[0] : null;
        if (done.bmUnit || target) {
          const h = await handEl(CARD.battlemage.name); if (h) { await tap(h); await sleep(400);
            const heroRing = await P.$eval(`[data-hero-side='${me}']`, (e) => e.style.boxShadow).catch(() => "");
            check(/rgb|#/.test(heroRing) && heroRing !== "none", "Battlemage selected: your own captain is outlined as a target");
            if (!done.bmUnit) await shot("04-battlemage-any-target.png", `[data-hero-side='${me}']`);
            if (!done.bmUnit) { const hp0 = target.hp; await act(async () => { const el = await P.$(`[data-fx='u${target.uid}']`); await tap(el); });
              const a = M()[me].board.find((x) => x.uid === target.uid); check(a ? a.hp === hp0 - 3 : hp0 <= 3, `Battlemage hit my own ${CARD[target.id].name} for 3 (${hp0} -> ${a ? a.hp : "fell"})`); done.bmUnit = true; await shot("05-battlemage-hit-own-unit.png"); }
            else { const hp0 = p.hp; await act(async () => { await tap(await P.$(`[data-hero-side='${me}']`)); });
              check(M()[me].hp === hp0 - 3, `Battlemage hit my own captain for 3 (${hp0} -> ${M()[me].hp})`); done.bmHero = true; await shot("06-battlemage-hit-own-captain.png", `[data-hero-side='${me}']`); }
            continue; }
        }
      }
      if (has("graci") && !done.graci && p.gold >= 4 && p.hp <= p.maxHp - 5 && p.board.length < 6) {
        const h = await handEl(CARD.graci.name); if (h) { const hp0 = p.hp; await act(() => tap(h));
          check(M()[me].hp === hp0 + 5, `Graci healed my captain 5 (${hp0} -> ${M()[me].hp})`); done.graci = true; await shot("07-graci-heal-5.png", `[data-hero-side='${me}']`); continue; }
      }
      if (has("buyout") && !done.buyout && p.gold >= 4 && p.board.length < 6) {
        const t = g[o].board.filter((u) => !u.hidden && u.atk <= 3).sort((x, y) => y.hp - x.hp)[0];
        const h = t && (await handEl(CARD.buyout.name));
        if (h) { const g0 = p.gold; await tap(h); await sleep(300); await act(async () => { await tap(await P.$(`[data-fx='u${t.uid}']`)); });
          const ok = M()[me].board.some((x) => x.uid === t.uid); check(ok && M()[me].gold === g0 - 4, `Hostile Buyout took ${CARD[t.id].name} for 4 gold (gold ${g0} -> ${M()[me].gold})`); done.buyout = true; await shot("08-buyout-4-gold.png", `[data-fx='u${t.uid}']`); continue; }
      }
      // filler: keep the hand small, never spend gold a pending test needs next turn
      const fill = p.hand.map((id, idx) => ({ id, idx })).filter((x) => !TEST.includes(x.id) && CARD[x.id].cost <= p.gold && p.board.length < 4)[0];
      if (fill && (p.hand.length > 5 || p.gold - CARD[fill.id].cost >= 0)) { const h = await handEl(CARD[fill.id].name); if (h) { await act(() => tap(h)); continue; } }
      break;
    }
    const e = await byText("End turn"); if (e) await act(() => tap(e));
  }
  let turns = 0;
  if (!shots) { await sleep(500); }
  while (turns < 30 && !G().winner && !["golemGrey", "golemAlt", "bmUnit", "bmHero", "graci", "buyout"].every((k) => done[k])) {
    if (G().turn === bs()) { while (await botTurn()) { if (G().winner) break; } }
    else { await browserTurn(); turns++; if (turns === 2 && gi === 1) await shot("00-hand-card-text.png"); }
  }
  console.log(`  game ${gi}: ${turns} browser turns, winner ${G().winner || "-"}, done ${JSON.stringify(done)}`);
  B.ws.close(); await ctx.close();
}
for (let gi = 1; gi <= 4 && !["golemGrey", "golemAlt", "bmUnit", "bmHero", "graci", "buyout"].every((k) => done[k]); gi++) await game(gi);
for (const k of ["golemGrey", "golemAlt", "bmUnit", "bmHero", "graci", "buyout"]) check(!!done[k], `covered: ${k}`);
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS", `(${shots} shots in ${OUT})`);
await browser.close(); process.exit(fails ? 1 : 0);
