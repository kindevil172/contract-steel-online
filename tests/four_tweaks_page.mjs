// Four card tweaks on the Page (file harness, Vs Computer). Reads the screen only.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEW = process.env.VIEW || "phone";
const OUT = process.env.OUT || "/workspace/anim-test/shots/four-tweaks-page/"; fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || "file:///workspace/anim-test/index_m.html";
const N = { golem: "Contract Golem", battlemage: "Hired Battlemage", graci: "Graci, Kind-Hearted", buyout: "Hostile Buyout" };
const deck = []; for (const id of ["golem", "battlemage", "graci", "buyout", "recruit", "gatewarden", "veteran", "squire", "pikeman", "slime"]) deck.push(id, id);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const errs = [], done = {}; const KEYS = ["text", "golemGrey", "golemAlt", "bmHero", "graci", "buyout"];
const mobile = VIEW === "phone";
const p = await browser.newPage(); if (mobile) await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); else await p.setViewport({ width: 1280, height: 900 });
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(URL); await p.evaluate((a) => { localStorage.clear(); localStorage.setItem("contract-steel-decks-v1", JSON.stringify([{ id: "d1", name: "Tweak Test", cards: a }])); }, deck); await p.reload(); await sleep(800);
const btn = async (t, en = true) => { for (const h of await p.$$("button")) { const s = await h.evaluate((e) => e.textContent.trim()); if ((typeof t === "string" ? s === t : t.test(s)) && (!en || !(await h.evaluate((e) => e.disabled)))) return h; } return null; };
const tap = async (h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); if (mobile) await h.tap(); else await h.click(); await sleep(350); };
const press = async (t) => { const h = await btn(t); if (!h) throw new Error("no button " + t); await tap(h); };
const text = () => p.evaluate(() => document.body.innerText);
const shot = async (f, sel) => { if (sel) await p.$eval(sel, (e) => e.scrollIntoView({ block: "center", behavior: "instant" })).catch(() => {}); await sleep(300); await p.screenshot({ path: OUT + `${VIEW}-${f}` }); };
const me = async () => p.$eval("[data-hero-side='a']", (e) => { const t = e.innerText; const hp = t.match(/♥\s*(-?\d+)/), g = t.match(/Gold\s*(\d+)/); return { hp: hp ? +hp[1] : null, gold: g ? +g[1] : null }; });
const units = () => p.evaluate(() => { const hb = document.querySelector("[data-hero-side='a']").getBoundingClientRect().top + window.scrollY, ht = document.querySelector("[data-hero-side='b']").getBoundingClientRect().top + window.scrollY; const mid = (hb + ht) / 2;
  return [...document.querySelectorAll("[data-fx^='u']")].filter((e) => !e.className.includes("cs-die")).map((e) => { const t = e.innerText; const m = t.match(/⚔\s*(\d+)\s*♥\s*(-?\d+)/); return { fx: e.getAttribute("data-fx"), mine: e.getBoundingClientRect().top + window.scrollY > mid, shadow: e.hasAttribute("data-shadow-card"), name: t.split("\n")[0], text: t, atk: m ? +m[1] : null, hp: m ? +m[2] : null }; }); });
const handEl = async (name) => { for (const h of await p.$$("div[title]")) { if (await h.evaluate((e, n) => e.innerText.includes(n) && !e.hasAttribute("data-fx") && e.getBoundingClientRect().width >= 100 && !e.closest("[data-hire-choice]") && !e.closest("[data-tactic-show]") && !e.closest("[data-recent-plays]") && !e.closest("[data-mull-hand]") && e.style.opacity === "1", name)) return h; } return null; };
const handHas = async (name) => !!(await handEl(name));
const myTurn = async () => !!(await btn("End turn"));
for (let gi = 1; gi <= 8 && !KEYS.every((k) => done[k]); gi++) {
  await p.evaluate(() => window.scrollTo(0, 0));
  for (let t = 0; t < 20 && !(await btn("Main menu")) && !(await btn("Choose deck")); t++) await sleep(200);
  const mm = await btn("Main menu"); if (mm) await tap(mm);
  let opened = false;
  for (const h of await p.$$("button")) { const ok = await h.evaluate((e) => e.textContent.trim() === "Choose deck" && /Vs Computer/.test(e.parentElement?.innerText + (e.parentElement?.parentElement?.innerText || ""))); if (ok) { await tap(h); opened = true; break; } }
  if (!opened) { console.log((await text()).slice(0, 600)); throw new Error("no Vs Computer"); }
  await sleep(400);
  for (const h of await p.$$("div[style*='cursor: pointer']")) if ((await h.evaluate((e) => e.textContent)).includes("Tweak Test")) { await tap(h); break; }
  await sleep(500);
  for (let t = 0; t < 60; t++) { const g = await btn("Go first"); if (g) { await tap(g); break; } if (await btn(/Keep this hand|Swap \d/)) break; await sleep(200); }
  for (let t = 0; t < 60 && !(await btn(/Keep this hand/)); t++) await sleep(200);
  if (!(await btn(/Keep this hand/))) { console.log((await text()).slice(0, 800)); throw new Error("no mulligan"); }
  { const mh = await p.$$("[data-mull-hand] > div"); let sw = 0; for (const h of mh) { const tx = await h.evaluate((e) => e.innerText); if (!Object.values(N).some((n) => tx.includes(n))) { await tap(h); sw++; } } if (sw) await press(/^Swap \d+ card/); else await press("Keep this hand"); }
  for (let turn = 0; turn < 25; turn++) {
    for (let t = 0; t < 150 && !(await myTurn()) && !(await btn("Main menu")); t++) await sleep(200);
    if (!(await myTurn())) break;
    await sleep(500);
    if (!done.text) { const t = await text(); const hits = [/Hire: 3 damage to any target\./, /heal your captain 5 and all your sellswords 2/, /hire it for 7 gold instead: it gains Guard and \+0\/\+2/].filter((r) => r.test(t));
      if (hits.length >= 2) await shot("00-hand.png", "[data-hero-side='a']"); if (hits.length === 3) done.text = true; }
    for (let step = 0; step < 6; step++) {
      const s = await me(); const mine = (await units()).filter((u) => u.mine);
      if (!done.golemGrey && s.gold >= 5 && s.gold < 7 && (await handHas(N.golem))) {
        await tap(await handEl(N.golem)); const b7 = await btn("7 gold · 5/8 Guard", false); const dis = b7 && (await b7.evaluate((e) => e.disabled));
        check(!!(await p.$("[data-hire-choice='golem']")) && dis === true, `Page: Golem 7-gold option greyed out at ${s.gold} gold`); await shot("01-golem-greyed.png", "[data-hire-choice='golem'] button"); await press("Cancel"); done.golemGrey = true; continue; }
      if (!done.golemAlt && s.gold >= 7 && mine.length < 6 && (await handHas(N.golem))) {
        await tap(await handEl(N.golem)); await press("7 gold · 5/8 Guard"); await sleep(1500); const s2 = await me(); const gu = (await units()).find((u) => u.mine && u.name === N.golem && u.hp === 8);
        check(!!gu && gu.atk === 5 && s2.gold === s.gold - 7, `Page: Golem hired for 7 -> ${gu ? `${gu.atk}/${gu.hp}` : "?"}, gold ${s.gold} -> ${s2.gold}`); await shot("02-golem-5-8-guard.png", gu ? `[data-fx='${gu.fx}']` : undefined); done.golemAlt = true; continue; }
      if (!done.bmHero && s.gold >= 5 && mine.length < 6 && (await handHas(N.battlemage))) {
        await tap(await handEl(N.battlemage)); await shot("03-battlemage-targets.png", "[data-hero-side='a']"); const hp0 = s.hp; await tap(await p.$("[data-hero-side='a']")); await sleep(1500);
        const s2 = await me(); check(s2.hp === hp0 - 3, `Page: Battlemage hit my own captain for 3 (${hp0} -> ${s2.hp})`); done.bmHero = true; continue; }
      if (!done.graci && s.gold >= 4 && s.hp <= 10 && mine.length < 6 && (await handHas(N.graci))) {
        const hp0 = s.hp; await tap(await handEl(N.graci)); await sleep(1500); const s2 = await me(); check(s2.hp === hp0 + 5, `Page: Graci healed my captain 5 (${hp0} -> ${s2.hp})`); await shot("04-graci.png", "[data-hero-side='a']"); done.graci = true; continue; }
      if (!done.buyout && s.gold >= 4 && mine.length < 6 && (await handHas(N.buyout))) {
        const foe = (await units()).filter((u) => !u.mine && !u.shadow && u.atk !== null && u.atk <= 3)[0];
        if (foe) { await tap(await handEl(N.buyout)); await tap(await p.$(`[data-fx='${foe.fx}']`)); await sleep(1500); const s2 = await me(); const now = (await units()).find((u) => u.fx === foe.fx);
          check(!!now && now.mine && s2.gold === s.gold - 4, `Page: Hostile Buyout took ${foe.name} for 4 (gold ${s.gold} -> ${s2.gold})`); await shot("05-buyout.png", now ? `[data-fx='${now.fx}']` : undefined); done.buyout = true; continue; }
      }
      let did = false;
      if (mine.length < 5 && !(s.gold >= 5 && s.gold < 7 && done.golemGrey && !done.golemAlt && s.gold - 1 < 7 && false)) for (const n of ["Shield Recruit", "Gate Warden", "Iron Squire", "Tower Shield Veteran", "Hired Pikeman", "Slime"]) { const h = await handEl(n); if (h) { await tap(h); await sleep(700); const s2 = await me(); if (s2.gold < s.gold) { did = true; break; } } }
      if (!did) break;
    }
    if (KEYS.every((k) => done[k])) break;
    const e = await btn("End turn"); if (e) await tap(e);
  }
  console.log(`  game ${gi}: done ${JSON.stringify(done)}`);
}
for (const k of KEYS) check(!!done[k], `covered: ${k}`);
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS"); await browser.close(); process.exit(fails ? 1 : 0);
