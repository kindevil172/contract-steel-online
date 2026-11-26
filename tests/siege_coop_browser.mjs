// Siege co-op in two phone browsers (390x844): create a siege room, join by link, shared buying/posting with names, both Ready, night battle opens on both, commander plays while the partner watches, back to the city at dawn.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:8080";
const SHOTS = process.env.SHOTS || "/workspace/anim-test/shots/siege-coop/"; fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const errors = []; let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
async function mk(label) {
  const ctx = await browser.createBrowserContext(); const p = await ctx.newPage();
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  p.on("pageerror", (e) => errors.push(`${label}: ${e.message}`)); p.on("console", (m) => { if (m.type() === "error" && !/favicon/.test(m.text())) errors.push(`${label} console: ${m.text()}`); });
  p.label = label; return p;
}
async function byText(p, t) { for (const h of await p.$$("button")) { const s = await h.evaluate((e) => e.textContent.trim()); if ((typeof t === "string" ? s === t : t.test(s)) && !(await h.evaluate((e) => e.disabled))) return h; } return null; }
async function press(p, t) { const h = await byText(p, t); if (!h) throw new Error(`${p.label}: no "${t}"`); await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await h.tap(); await sleep(250); }
const body = (p) => p.evaluate(() => document.body.innerText);
const top = async (p, f) => { await p.evaluate(() => window.scrollTo(0, 0)); await sleep(250); await p.screenshot({ path: SHOTS + f }); };
const waitFor = async (p, fn, ms = 15000, arg) => { const t = Date.now(); while (Date.now() - t < ms) { if (await p.evaluate(fn, arg).catch(() => false)) return true; await sleep(150); } return false; };
const A = await mk("Ana"), B = await mk("Ben");
await A.goto(BASE); await waitFor(A, () => [...document.querySelectorAll("button")].some((b) => b.textContent.trim() === "Play online"));
await press(A, "Play online"); await sleep(300); await A.type('input[placeholder="Your name"]', "Ana");
await press(A, "Create a siege room (co-op)"); await sleep(800);
const code = (await body(A)).match(/Room code\s+([A-Z0-9]{5})/)[1];
check(/Siege room created/.test(await body(A)), "siege room created " + code);
await top(A, "01-room.png");
await B.goto(`${BASE}/?room=${code}`); await sleep(700);
await B.type('input[placeholder="Your name"]', "Ben"); await press(B, "Join room");
check(await waitFor(A, () => !!document.querySelector("[data-siege=day]")) && await waitFor(B, () => !!document.querySelector("[data-siege=day]")), "both on the city map");
check(/Co-op · Room/.test(await body(A)) && /Ana &\s*Ben\s*share this chest/.test(await body(B)), "co-op header and shared chest");
await top(A, "02-ana-city.png"); await top(B, "03-ben-city.png");
const gold = (p) => p.$eval("[data-siege-gold]", (e) => Number(e.getAttribute("data-siege-gold")));
check(await gold(A) === 0 && (await A.$$("[data-siege-reserve] [data-scard]")).length === 8, "start: 8 shared starting units, empty chest");
check(/Shield Recruit/.test(await body(B)) && /Tavern Brawler/.test(await body(B)), "Ben sees the same starting reserve");
// post: each player takes turns posting to gates
for (let k = 0; k < 10; k++) {
  const p = k % 2 ? B : A;
  const c = await p.$("[data-siege-reserve] [data-scard]"); if (!c) { await sleep(400); continue; }
  await c.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await c.tap(); await sleep(250);
  const z = await p.$(`[data-zone="${k % 4}"] circle:last-of-type`); await z.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await z.tap(); await sleep(600);
}
check(/\(Ana\)/.test(await body(B)) && /\(Ben\)/.test(await body(A)), "war log names each player's moves");
await A.$eval("[data-siege-map]", (e) => e.scrollIntoView({ block: "start", behavior: "instant" })); await sleep(250); await A.screenshot({ path: SHOTS + "05-ana-placed.png" });
await press(A, /^Ready for night/); await sleep(600);
check(/Ana is ready/.test(await body(B)), "Ben sees Ana is ready");
await B.evaluate(() => window.scrollTo(0, document.querySelector("[data-siege-ready]").offsetTop - 300)); await sleep(200); await B.screenshot({ path: SHOTS + "06-ben-sees-ready.png" });
await press(B, /^Ready for night/);
const inBattle = await waitFor(A, () => !!document.querySelector("[data-siege-battle]") || /Day 2 of 12/.test(document.body.innerText), 15000);
check(inBattle, "night falls for both");
let shots = 0, battles = 0;
for (let step = 0; step < 900; step++) {
  const ta = await body(A), tb = await body(B);
  if (/Day 2 of 12/.test(ta) && /Day 2 of 12/.test(tb)) break;
  const aB = /Siege · Night/.test(ta), bB = /Siege · Night/.test(tb);
  if (aB && bB && shots === 0) {
    const watcher = /You are watching/.test(ta) ? A : /You are watching/.test(tb) ? B : null;
    check(!!watcher, "the partner watches the commander's fight");
    if (watcher) { const wt = await body(watcher); check(!/Your turn/.test(wt), "watcher never sees \"Your turn\""); check(/on the field/.test(wt) && /defeat every unit|You are watching/.test(wt), "wave shows units left"); }
    await top(A, "07-ana-battle.png"); await top(B, "08-ben-battle.png"); shots++;
  }
  const back = (await byText(A, "Back to the city")) || (await byText(B, "Back to the city"));
  if (back) { battles++; if (battles === 1) { await A.screenshot({ path: SHOTS + "09-battle-won-lost.png" }); } await back.tap(); await sleep(800); continue; }
  for (const p of [A, B]) { const e = await byText(p, "End turn"); if (e) { await e.tap(); await sleep(250); } }
  await sleep(250);
}
check(/Day 2 of 12/.test(await body(A)) && /Day 2 of 12/.test(await body(B)), "dawn of day 2 on both phones");
// day 2: income arrives; both buy from the shared chest at marked-up prices
{ const g0 = await gold(A); check(g0 > 0, "day 2 income: " + g0);
  await press(A, /^Buy \d+g$/); await sleep(700);
  check(await waitFor(B, (g) => Number(document.querySelector("[data-siege-gold]").getAttribute("data-siege-gold")) < g, 8000, g0) , "Ben sees Ana's spend");
  const h = await byText(B, /^Buy \d+g$/); if (h) { await h.tap(); await sleep(700); }
  check(/· Ana/.test(await body(B)) && /· Ben/.test(await body(A)), "reserve shows who bought each card");
  await B.$eval("[data-siege-reserve]", (e) => e.scrollIntoView({ block: "start", behavior: "instant" })); await sleep(250); await B.screenshot({ path: SHOTS + "10b-ben-reserve-names.png" }); }
await top(A, "10-ana-day2.png"); await top(B, "11-ben-day2.png");
const noSide = await A.evaluate(() => document.documentElement.scrollWidth); check(noSide <= 390, "no sideways scroll " + noSide);
await press(B, "Leave room"); await sleep(800);
check(await waitFor(A, () => /defends the city alone/.test(document.body.innerText)), "Ana continues alone after Ben leaves");
await top(A, "12-ana-alone.png");
check(errors.length === 0, "no page errors " + JSON.stringify(errors.slice(0, 4)));
console.log(fails ? `${fails} FAIL` : "ALL PASS");
await browser.close(); process.exit(fails ? 1 : 0);
