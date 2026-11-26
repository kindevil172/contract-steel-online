// Accounts in real browsers: desktop (1280x900) and phone (390x844). Sign up, log out/in, pick portraits,
// play an online match through the UI, then check both profiles' stats.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:8080";
const OUT = process.env.OUT || "/workspace/anim-test/shots/accounts/"; fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const errors = [];
async function mk(label, mobile) {
  const ctx = await browser.createBrowserContext(); const p = await ctx.newPage();
  if (mobile) await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); else await p.setViewport({ width: 1280, height: 900 });
  p.on("pageerror", (e) => errors.push(`${label}: ${e.message}`)); p.on("console", (m) => { if (m.type() === "error" && !/favicon|401|409|Failed to load resource/.test(m.text())) errors.push(`${label} console: ${m.text()}`); });
  p.label = label; p.mobile = mobile; return p;
}
const tapEl = async (p, h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); if (p.mobile) await h.tap(); else await h.click(); };
async function byText(p, text, sel = "button") { for (const h of await p.$$(sel)) { const t = await h.evaluate((e) => e.textContent.trim()); if (t === text || (text instanceof RegExp && text.test(t))) { if (await h.evaluate((e) => e.disabled)) continue; return h; } } return null; }
async function press(p, text, sel) { const h = await byText(p, text, sel); if (!h) throw new Error(`${p.label}: no "${text}"`); await tapEl(p, h); await sleep(250); }
const waitSel = async (p, sel, ms = 15000) => { for (let t = 0; t < ms; t += 200) { if (await p.$(sel)) return true; await sleep(200); } return false; };
const waitFor = async (f, ms = 15000) => { for (let t = 0; t < ms; t += 200) { if (await f()) return true; await sleep(200); } return false; };
const bodyText = (p) => p.evaluate(() => document.body.innerText);
const top = async (p, f) => { await p.evaluate(() => window.scrollTo(0, 0)); await sleep(250); await p.screenshot({ path: OUT + f }); };
const noSide = async (p, m) => { const sx = await p.evaluate(() => document.documentElement.scrollWidth); check(sx <= (p.mobile ? 390 : 1280), `${p.label} ${m}: no sideways scroll (${sx})`); };
const sfx = Date.now().toString(36).slice(-5), PW = "steel-and-coin-" + sfx;
const users = { desktop: `Desk_${sfx}`, phone: `Phone_${sfx}` }, pics = { desktop: "selene", phone: "rotmaw" };
const A = await mk("desktop", false), B = await mk("phone", true);
for (const p of [A, B]) {
  await p.goto(BASE); await sleep(1000);
  check(await waitSel(p, "[data-profile-chip]"), `${p.label}: menu shows the profile card`);
  await tapEl(p, await p.$("[data-profile-chip]")); await sleep(500);
  check(await waitSel(p, '[data-acct-status="guest"]'), `${p.label}: profile screen, signed out (guest)`);
  if (p === A) await top(p, "desktop-01-profile-guest.png");
  await p.type("[data-acct-user]", users[p.label]); await p.type("[data-acct-pass]", PW);
  await press(p, "Sign up");
  check(await waitSel(p, '[data-acct-status="in"]'), `${p.label}: signed up and signed in`);
  await press(p, "Change portrait"); await sleep(300);
  const n = (await p.$$("[data-portrait-pick]")).length; check(n >= 100, `${p.label}: portrait picker shows every card's art (${n})`);
  await top(p, `${p.label}-02-portrait-picker.png`);
  await tapEl(p, await p.$(`[data-portrait-pick="${pics[p.label]}"]`)); await sleep(800);
  check(await p.$eval("[data-profile-pic]", (e) => e.getAttribute("data-profile-pic")) === pics[p.label], `${p.label}: portrait chosen: ${pics[p.label]}`);
  await noSide(p, "profile");
}
// phone: log out and back in; the portrait comes back from the account
await press(B, "Log out"); check(await waitSel(B, '[data-acct-status="guest"]'), "phone: logged out");
await B.evaluate(() => { const e = document.querySelector("[data-acct-user]"); e.focus(); e.select(); }); await B.type("[data-acct-user]", users.phone); await B.type("[data-acct-pass]", "wrong-password-1");
await press(B, "Log in"); check(await waitSel(B, "[data-acct-error]") && /Wrong username or password/.test(await bodyText(B)), "phone: wrong password refused");
await B.evaluate(() => { const e = document.querySelector("[data-acct-pass]"); e.focus(); e.select(); });
await B.type("[data-acct-pass]", PW); await press(B, "Log in");
check(await waitSel(B, '[data-acct-status="in"]') && (await B.$eval("[data-profile-pic]", (e) => e.getAttribute("data-profile-pic"))) === "rotmaw", "phone: logged back in, portrait restored from the account");
await top(B, "phone-03-profile-signed-in.png");
// online match: desktop hosts, phone joins
await press(A, "Menu"); await press(A, "Play online"); await sleep(400);
check(await waitSel(A, `[data-lobby-account="${users.desktop}"]`) && !!(await A.$('[data-lobby-pic="selene"]')), "desktop lobby: signed in, portrait shown");
await press(A, /Shadow Knives/, "div[style*='cursor: pointer']"); await press(A, "Create a room"); await sleep(900);
const code = (await bodyText(A)).match(/Room code\s+([A-Z0-9]{5})/)[1];
check(!!(await A.$("[data-lobby-vs] [data-lobby-pic='selene']")), "desktop waiting room shows the portrait");
await top(A, "desktop-04-lobby-waiting.png");
await B.goto(`${BASE}/?room=${code}`); await sleep(1200);
check(await waitSel(B, `[data-lobby-account="${users.phone}"]`) && !!(await B.$('[data-lobby-pic="rotmaw"]')), "phone lobby: signed in, portrait shown");
await press(B, /Grimfang Horde/, "div[style*='cursor: pointer']"); await top(B, "phone-04-lobby.png"); await press(B, "Join room");
check(await waitSel(A, "[data-roll='landed']", 30000) && await waitSel(B, "[data-roll='landed']", 30000), "match opens on the roll for both");
const aCh = !!(await A.$("[data-roll-choice]")); await press(aCh ? A : B, "Go first");
check(await waitSel(A, "[data-mulligan='pick']") && await waitSel(B, "[data-mulligan='pick']"), "mulligan on both");
await press(A, "Keep this hand"); await press(B, "Keep this hand");
const myTurn = async (p) => { const h = await byText(p, "End turn"); return !!h; };
check(await waitFor(async () => (await myTurn(A)) || (await myTurn(B)), 20000), "play started");
await sleep(800);
const heroPics = (p) => p.$$eval("[data-hero-pic]", (els) => els.map((e) => e.getAttribute("data-hero-pic")).sort().join(","));
check((await heroPics(A)) === "rotmaw,selene" && (await heroPics(B)) === "rotmaw,selene", `both portraits by the health bars (desktop ${await heroPics(A)} | phone ${await heroPics(B)})`);
await top(A, "desktop-05-battle-portraits.png"); await top(B, "phone-05-battle-portraits.png");
// the phone plays cards; the desktop only ends its turns
async function playTurn(p) {
  for (let guard = 0; guard < 8; guard++) {
    if (!(await myTurn(p))) return;
    const idx = await p.$$eval("div[title]", (els) => els.map((e, i) => ({ i, ok: !/is holding/.test(e.title) && e.getBoundingClientRect().width >= 100 && !e.closest("[data-tactic-show]") && !e.closest("[data-mull-hand]") && e.style.opacity === "1" })).filter((x) => x.ok).map((x) => x.i));
    let did = false;
    for (const i of idx) {
      const all = await p.$$("div[title]"); if (!all[i]) continue; await tapEl(p, all[i]).catch(() => {}); await sleep(300);
      if (/Choose a target/.test(await bodyText(p))) { for (const sel of ["[data-fx='ha']", "[data-fx='hb']"]) { const h = await p.$(sel); if (h && /Choose a target/.test(await bodyText(p))) { await tapEl(p, h).catch(() => {}); await sleep(300); } } }
      if (/Choose a target/.test(await bodyText(p))) { const c = await byText(p, "Cancel"); if (c) { await tapEl(p, c); await sleep(200); } continue; }
      did = true; break;
    }
    if (did) { await sleep(900); continue; }
    break;
  }
  // attack with everything that can, at the captain
  const ids = await p.$$eval("[data-fx^='u']", (els) => els.map((e) => e.getAttribute("data-fx")));
  for (const id of ids) { if (!(await myTurn(p))) break; const u = await p.$(`[data-fx='${id}']`); if (!u) continue; await tapEl(p, u).catch(() => {}); await sleep(200); const h = await p.$("[data-fx='ha']"); if (h && /Choose|attack|target/i.test(await bodyText(p))) { await tapEl(p, h).catch(() => {}); await sleep(600); } }
  if (await myTurn(p)) { await press(p, "End turn").catch(() => {}); await sleep(400); }
}
let turns = 0; const over = async () => /Victory!|wins the contract/.test(await bodyText(A)) && /Victory!|wins the contract/.test(await bodyText(B));
while (turns < 80 && !(await over())) {
  if (await myTurn(B)) { await playTurn(B); turns++; } else if (await myTurn(A)) { await press(A, "End turn").catch(() => {}); turns++; }
  await sleep(700);
}
check(await over(), `match finished after ${turns} turns`);
const aWon = /Victory!/.test(await bodyText(A));
console.log("  winner:", aWon ? "desktop" : "phone");
await top(A, "desktop-06-match-end.png"); await top(B, "phone-06-match-end.png");
await sleep(2500);
for (const p of [A, B]) {
  await press(p, "Leave room"); await sleep(400); await press(p, "Menu"); await sleep(300);
  await tapEl(p, await p.$("[data-profile-chip]")); await sleep(1500);
  const won = (p === A) === aWon, other = p === A ? users.phone : users.desktop;
  const ok = await waitFor(async () => { const t = await p.$eval('[data-stats-scope="acct"] [data-stat-mode="online"]', (e) => e.innerText).catch(() => ""); return won ? /1\s*won · 0\s*lost/.test(t) : /0\s*won · 1\s*lost/.test(t); }, 15000);
  check(ok, `${p.label}: account stats show the online ${won ? "win" : "loss"}`);
  const rec = await p.$eval('[data-recent-list="acct"]', (e) => e.innerText).catch(() => "");
  check(rec.includes(other) && /Online match/.test(rec), `${p.label}: last matches lists the opponent (${rec.split("\n").slice(0, 4).join(" ")})`);
  const played = await p.$eval('[data-stat="acct-played"]', (e) => e.innerText).catch(() => "");
  check(/^1\b/.test(played), `${p.label}: games played 1 (${played.replace(/\n/g, " ")})`);
  const cards = await p.$eval('[data-pf-section="acctstats"] [data-top-cards]', (e) => e.innerText).catch(() => "");
  console.log(`  ${p.label} top cards:`, cards.replace(/\n/g, " "));
  await p.$eval('[data-pf-section="acctstats"]', (e) => e.scrollIntoView({ block: "start", behavior: "instant" })); await sleep(300); await p.screenshot({ path: OUT + `${p.label}-07-profile-stats.png` });
  await noSide(p, "profile stats");
}
check(errors.length === 0, "no page errors " + JSON.stringify(errors.slice(0, 3)));
console.log(fails ? `${fails} FAIL` : "ALL PASS"); await browser.close(); process.exit(fails ? 1 : 0);
