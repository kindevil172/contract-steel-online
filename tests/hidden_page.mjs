// Hidden rework on the Page (file harness, 390x844 phone): 2 players on one screen.
// Player 1 plays Hidden cards: Player 2 sees only shadowy cards (no names) and "☾ Hidden sellsword" in recent plays; the ledger never names them.
// Player 1 sees its own cards with the Hidden marker; the reveal attack takes no damage back; Jordan (First Strike) still strikes first.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.env.OUT || "/workspace/anim-test/shots/hidden-page/"; fs.mkdirSync(OUT, { recursive: true });
const URL = "file:///workspace/anim-test/index_m.html";
const HIDNAMES = ["Masked Infiltrator", "Alley Cutthroat", "Veiled Stalker", "Alley Ambusher", "Guild Spymaster", "The Faceless Widow", "Moss Men", "Giant Centipede"];
const hidDeck = ["infiltrator", "infiltrator", "cutthroat", "cutthroat", "stalker", "stalker", "ambusher", "ambusher", "spymaster", "widow"]; for (const id of ["brawler", "recruit", "pikeman", "gatewarden", "veteran"]) hidDeck.push(id, id);
const fsDeck = ["jordan", "jordan"]; for (const id of ["brawler", "pikeman", "axe", "berserker", "poisoner", "taxman", "brute", "kobold", "slime"]) fsDeck.push(id, id);
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const errs = [];
const p = await browser.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/WebSocket|favicon|ERR_/.test(m.text())) errs.push(m.text()); });
await p.goto(URL); await p.evaluate((a, b) => { localStorage.clear(); localStorage.setItem("contract-steel-decks-v1", JSON.stringify([{ id: "d1", name: "Hidden Test", cards: a }, { id: "d2", name: "First Strike Wall", cards: b }])); }, hidDeck, fsDeck); await p.reload(); await sleep(900);
const btn = async (t) => { for (const h of await p.$$("button")) { const s = await h.evaluate((e) => e.textContent.trim()); if ((typeof t === "string" ? s === t : t.test(s)) && !(await h.evaluate((e) => e.disabled))) return h; } return null; };
const tap = async (h) => { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await h.tap(); await sleep(300); };
const press = async (t) => { const h = await btn(t); if (!h) throw new Error("no button " + t); await tap(h); };
const pickDeck = async (name) => { for (const h of await p.$$("div[style*='cursor: pointer']")) if ((await h.evaluate((e) => e.textContent)).includes(name)) { await tap(h); await sleep(300); return; } throw new Error("no deck " + name); };
const text = () => p.evaluate(() => document.body.innerText);
const shot = async (f, sel) => { if (sel) await p.$eval(sel, (e) => e.scrollIntoView({ block: "center", behavior: "instant" })).catch(() => {}); else await p.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await p.screenshot({ path: OUT + f }); };
// units on the board, split into mine (bottom row) and theirs
const units = () => p.evaluate(() => {
  const heroes = [...document.querySelectorAll("[data-fx^='h']")].map((e) => e.getBoundingClientRect().top + window.scrollY).sort((a, b) => a - b);
  const mid = (heroes[0] + heroes[1]) / 2;
  return [...document.querySelectorAll("[data-fx^='u']")].filter((e) => !e.className.includes("cs-die")).map((e) => { const t = e.innerText; const m = t.match(/⚔\s*(\d+)\s*♥\s*(-?\d+)/); return { fx: e.getAttribute("data-fx"), mine: e.getBoundingClientRect().top + window.scrollY > mid, shadow: e.hasAttribute("data-shadow-card"), text: t, name: t.split("\n")[0], atk: m ? +m[1] : null, hp: m ? +m[2] : null, ready: e.style.opacity !== "0.45" }; });
});
await press("Choose decks"); await pickDeck("Hidden Test"); await pickDeck("First Strike Wall");
for (let t = 0; t < 40 && (await p.$eval("[data-roll]", (e) => e.getAttribute("data-roll")).catch(() => "")) !== "landed"; t++) await sleep(150);
const head = await p.evaluate(() => document.querySelector("[data-roll]")?.innerText.split("\n")[0] || "");
await press(/Player 1/.test(head) ? "Go first" : "Go second"); await sleep(200);
const ready = async () => { const h = await btn(/^I'm .*ready$/); if (h) { await tap(h); await sleep(300); return true; } return false; };
await ready(); await press("Keep this hand"); await ready(); await press("Keep this hand"); await ready();
let noRetal = null, fsHit = null, sawShadow = false, leak = [], ownerMarker = false, ledgerLeak = [], recentOk = false, shots = {};
const who = async () => (/You are|Player 1/.test(await p.evaluate(() => [...document.querySelectorAll("[data-fx^='h']")].map((e) => e.innerText).pop() || "")) ? 1 : 2);
for (let turn = 0; turn < 40 && !(noRetal !== null && fsHit !== null); turn++) {
  const me = await who(); const pref = me === 1 ? HIDNAMES : ["Jordan"];
  // hire: preferred cards, others only while the board is small
  for (let k = 0; k < 6; k++) {
    const hand = await p.$$("div[title]"); let did = false;
    const mineN = (await units()).filter((u) => u.mine).length;
    const cands = [];
    for (const h of hand) { const info = await h.evaluate((e) => ({ ok: !/is holding/.test(e.title) && e.getBoundingClientRect().width >= 100 && !e.hasAttribute("data-fx") && !e.closest("[data-recent-plays]") && !e.closest("[data-tactic-show]") && e.style.opacity === "1", t: e.innerText })); if (info.ok) cands.push({ h, pref: pref.some((n) => info.t.includes(n)) }); }
    cands.sort((a, b) => b.pref - a.pref);
    for (const c of cands) { if (!c.pref && mineN >= 3) continue; if (mineN >= 6) break; await tap(c.h); await sleep(400); if (/Choose a target/.test(await text())) { const x = await btn("Cancel"); if (x) await tap(x); continue; } did = true; break; }
    if (!did) break;
  }
  const us = await units();
  if (me === 1) {
    const mineHidden = us.filter((u) => u.mine && /Hidden/.test(u.text));
    if (mineHidden.length && !ownerMarker) { ownerMarker = mineHidden.some((u) => HIDNAMES.some((n) => u.text.includes(n))); await shot("01-player1-own-hidden.png", "[data-fx^='u']"); }
    const enemy = us.filter((u) => !u.mine && !u.shadow);
    const jordan = enemy.find((u) => /Jordan/.test(u.name)), plain = enemy.find((u) => !/Jordan/.test(u.name));
    const tgt = fsHit === null && jordan ? jordan : noRetal === null && plain ? plain : null;
    const att = mineHidden.filter((u) => u.ready).sort((a, b) => (tgt && /Jordan/.test(tgt.name) ? a.hp - b.hp : b.hp - a.hp))[0];
    if (att && tgt) {
      await tap(await p.$(`[data-fx='${att.fx}']`)); const te = await p.$(`[data-fx='${tgt.fx}']`);
      if (te && (await te.evaluate((e) => getComputedStyle(e).boxShadow.includes("rgb")))) {
        await tap(te); await sleep(1600);
        const after = (await units()).find((u) => u.fx === att.fx), ta = (await units()).find((u) => u.fx === tgt.fx);
        if (/Jordan/.test(tgt.name)) { fsHit = !after || after.hp === att.hp - tgt.atk; console.log(`  First Strike: ${att.name} ${att.atk}/${att.hp} -> Jordan ${tgt.atk}/${tgt.hp}: attacker ${after ? after.hp + " hp" : "died"}, Jordan ${ta ? ta.hp + " hp" : "died"}`); await shot("04-first-strike.png"); }
        else { noRetal = !!after && after.hp === att.hp; console.log(`  Reveal attack: ${att.name} ${att.atk}/${att.hp} -> ${tgt.name} ${tgt.atk}/${tgt.hp}: attacker ${after ? after.hp + " hp" : "died"}, defender ${ta ? ta.hp + " hp" : "died"}`); await shot("03-reveal-attack.png"); }
      } else { const x = await btn("Cancel"); if (x) await tap(x); }
    }
  } else {
    const sh = us.filter((u) => !u.mine && u.shadow).length; const t = await text();
    if (sh) { sawShadow = true; const shown = us.filter((u) => !u.shadow).map((u) => u.text).join(" "), lg0 = t.slice(t.indexOf("War ledger"));
      const named = HIDNAMES.filter((n) => t.includes(n) && !shown.includes(n) && !new RegExp(`${n} (fought|struck|Stunned|fell)|discarded ${n} \\(hand full\\)`).test(lg0)); if (named.length) { leak.push(...named); const i = t.indexOf(named[0]); console.log("  LEAK:", JSON.stringify(t.slice(Math.max(0, i - 300), i + 60))); await shot("leak.png"); }
      if (!shots.opp) { shots.opp = 1; await shot("02-player2-sees-shadows.png", "[data-shadow-card]"); recentOk = /Player 1: ☾ Hidden sellsword|Player: ☾ Hidden sellsword/.test(t) || !!(await p.$("[data-recent-hidden]")); } }
  }
  const lg = await p.evaluate(() => { const i = document.body.innerText.indexOf("War ledger"); return document.body.innerText.slice(i); });
  for (const n of HIDNAMES) if (new RegExp(`hired ${n}`).test(lg)) ledgerLeak.push(n);
  await press("End turn"); await sleep(300); await ready(); await sleep(200);
}
check(ownerMarker, "Player 1 sees their own Hidden cards normally, with the Hidden marker");
check(sawShadow, "Player 2 sees shadowy face-down cards");
check(leak.length === 0, "no Hidden card names on Player 2's screen while hidden " + JSON.stringify(leak));
check(recentOk, "Player 2's recent plays show '☾ Hidden sellsword'");
check(ledgerLeak.length === 0, "war ledger never names a Hidden hire");
check(noRetal === true, "reveal attack took no damage back");
check(fsHit === true, "Jordan (First Strike) still struck first");
const help = await (async () => { await press("How to play"); await sleep(300); const t = await text(); await press("Hide rules"); return t; })();
check(/played face down/.test(help) && /no damage back unless the defender has First Strike/.test(help), "rules text updated");
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS"); await browser.close(); process.exit(fails ? 1 : 0);
