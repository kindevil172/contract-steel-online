// Wall cards on the Page (file harness, Vs Computer). Reads the screen only.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEW = process.env.VIEW || "phone";
const OUT = process.env.OUT || "/workspace/anim-test/shots/wall-cards-page/"; fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || "file:///workspace/anim-test/index_m.html";
const N = { wallguard: "Guard of the Wall", wallmage: "Iron Mage Apprentice" };
const deck = []; for (const id of ["wallguard", "wallmage", "recruit", "gatewarden", "veteran", "squire", "pikeman", "slime", "brawler", "raider"]) deck.push(id, id);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const errs = [], done = {}; const KEYS = ["guard", "mage", "lost"];
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
  if (!opened) throw new Error("no Vs Computer");
  await sleep(400);
  for (const h of await p.$$("div[style*='cursor: pointer']")) if ((await h.evaluate((e) => e.textContent)).includes("Tweak Test")) { await tap(h); break; }
  await sleep(500);
  for (let t = 0; t < 60; t++) { const g = await btn("Go first"); if (g) { await tap(g); break; } if (await btn(/Keep this hand|Swap \d/)) break; await sleep(200); }
  for (let t = 0; t < 60 && !(await btn(/Keep this hand/)); t++) await sleep(200);
  { const mh = await p.$$("[data-mull-hand] > div"); let sw = 0; for (const h of mh) { const tx = await h.evaluate((e) => e.innerText); if (!Object.values(N).some((n) => tx.includes(n))) { await tap(h); sw++; } } if (sw) await press(/^Swap \d+ card/); else await press("Keep this hand"); }
  for (let turn = 0; turn < 25; turn++) {
    for (let t = 0; t < 150 && !(await myTurn()) && !(await btn("Main menu")); t++) await sleep(200);
    if (!(await myTurn())) break;
    await sleep(600);
    { const us = (await units()).filter((u) => u.mine); const gw = us.find((u) => u.name === N.wallguard);
      if (done.guard && !done.lost && gw && !us.some((u) => u.name === "Wall")) { check(gw.atk === 1, `Page: no Wall left -> Guard of the Wall shows ${gw.atk} attack`); await shot("03-wall-gone-guard-1.png", `[data-fx='${gw.fx}']`); done.lost = true; } }
    for (let step = 0; step < 5; step++) {
      for (let k = 0; k < 3; k++) { const r = await btn("Refuse"); if (!r) break; await tap(r); await sleep(900); }
      const s = await me(); const mine = (await units()).filter((u) => u.mine);
      if (!done.guard && s.gold >= 3 && mine.length <= 3 && (await handHas(N.wallguard))) {
        await tap(await handEl(N.wallguard)); await sleep(1500); const us = (await units()).filter((u) => u.mine); const w = us.find((u) => u.name === "Wall"), gw = us.find((u) => u.name === N.wallguard);
        check(!!w && w.atk === 0 && w.hp === 4 && /Guard/.test(w.text) && gw && gw.atk === 3 && gw.hp === 2, `Page: Wall ${w ? w.atk + "/" + w.hp : "?"} appeared, Guard of the Wall ${gw ? gw.atk + "/" + gw.hp : "?"}`); await shot("01-wall-guard-3.png", w ? `[data-fx='${w.fx}']` : undefined); done.guard = true; continue; }
      if (!done.mage && s.gold >= 4 && mine.length <= 4 && (await handHas(N.wallmage)) && (done.guard || turn > 5)) {
        const before = mine.filter((u) => u.name === "Wall").map((u) => ({ fx: u.fx, atk: u.atk, hp: u.hp }));
        await tap(await handEl(N.wallmage)); await sleep(1500); const ws = (await units()).filter((u) => u.mine && u.name === "Wall");
        const fresh = ws.filter((u) => !before.some((b) => b.fx === u.fx)); const okOld = before.every((b) => { const n = ws.find((u) => u.fx === b.fx); return n && n.atk === b.atk + 1 && n.hp === b.hp + 1; });
        check(fresh.length === 1 && fresh[0].atk === 1 && fresh[0].hp === 5 && okOld, `Page: Apprentice made a 1/5 Wall and buffed all Walls (${ws.map((u) => u.atk + "/" + u.hp).join(", ")})`); await shot("02-apprentice-walls.png", fresh[0] ? `[data-fx='${fresh[0].fx}']` : undefined); done.mage = true; continue; }
      let did = false;
      if (mine.length < 3) for (const n of ["Tavern Brawler", "Hired Pikeman", "Slime", "Border Raider"]) { const h = await handEl(n); if (h) { await tap(h); await sleep(700); const s2 = await me(); if (s2.gold < s.gold) { did = true; break; } } }
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
