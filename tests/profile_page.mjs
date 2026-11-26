// Page local profile on a phone (390x844): name + portrait, a quick match vs computer, stats + recent list, campaign progress, memory-only fallback.
import puppeteer from "puppeteer-core";
import fs from "node:fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.env.OUT || "/workspace/anim-test/shots/profile-page/"; fs.mkdirSync(OUT, { recursive: true });
const URL = "file:///workspace/anim-test/index_m.html";
const browser = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const errs = [];
async function mk() { const p = await browser.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => { if (m.type() === "error" && !/WebSocket|favicon|ERR_/.test(m.text())) errs.push(m.text()); }); return p; }
const p = await mk();
const btn = async (p, t) => { for (const h of await p.$$("button")) { const s = await h.evaluate((e) => e.textContent.trim()); if ((typeof t === "string" ? s === t : t.test(s)) && !(await h.evaluate((e) => e.disabled))) return h; } return null; };
const press = async (p, t) => { const h = await btn(p, t); if (!h) throw new Error("no button " + t); await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await h.tap(); await sleep(350); };
const tapSel = async (p, sel) => { const h = await p.$(sel); if (!h) throw new Error("no " + sel); await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await sleep(150); await h.tap(); await sleep(350); };
const text = (p) => p.evaluate(() => document.querySelector("[data-cs-root]")?.innerText || document.body.innerText);
const shotTop = async (p, f) => { await p.evaluate(() => window.scrollTo(0, 0)); await sleep(300); await p.screenshot({ path: OUT + f }); };
await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(900);
check(!!(await p.$("[data-profile-chip]")), "menu shows the profile card");
await shotTop(p, "01-menu-chip.png");
await tapSel(p, "[data-profile-chip]");
check(!!(await p.$("[data-profile-screen]")), "profile screen opens");
check(!(await p.$("[data-profile-memory]")), "no memory-only warning when storage works");
check(!(await p.$("[data-acct-status]")), "no account box on the Page (local profile only)");
await p.type("[data-profile-name]", "Kind Captain");
await press(p, "Change portrait");
const n = (await p.$$("[data-portrait-pick]")).length; check(n >= 100, "portrait picker shows every card's art: " + n);
await shotTop(p, "02-picker.png");
await tapSel(p, '[data-portrait-pick="selene"]'); await sleep(400);
check(await p.$eval("[data-profile-pic]", (e) => e.getAttribute("data-profile-pic")) === "selene", "portrait chosen: selene");
const sx = await p.evaluate(() => document.documentElement.scrollWidth); check(sx <= 390, "profile: no sideways scroll " + sx);
const saved = await p.evaluate(() => JSON.parse(localStorage.getItem("contract-steel-profile-v1") || "{}"));
check(saved.name === "Kind Captain" && saved.pic === "selene", "profile saved to localStorage");
await shotTop(p, "03-profile-set.png");
// quick match vs computer: the player only ends turns, so the computer wins
await press(p, "Menu"); await press(p, "Choose deck");
for (const h of await p.$$("div[style*='cursor: pointer']")) if ((await h.evaluate((e) => e.textContent)).includes("Crimson")) { await h.tap(); await sleep(250); break; }
for (let j = 0; j < 60 && (await p.$eval("[data-roll]", (e) => e.getAttribute("data-roll")).catch(() => "")) !== "landed"; j++) await sleep(100);
await sleep(300); if (await btn(p, "Go first")) await press(p, "Go first");
for (let j = 0; j < 60 && !(await btn(p, "Keep this hand")); j++) await sleep(150);
await press(p, "Keep this hand"); await sleep(600);
const pics = await p.$$eval("[data-hero-pic]", (els) => els.map((e) => e.getAttribute("data-hero-pic")));
check(pics.includes("selene") && pics.length === 2, "portrait by your health bar: " + pics.join(","));
await shotTop(p, "04-battle-portrait.png");
let turns = 0;
while (turns < 120 && !(await btn(p, "Main menu"))) { const h = await btn(p, "End turn"); if (h) { await h.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" })); await h.tap(); turns++; } await sleep(500); }
check(!!(await btn(p, "Main menu")), "quick match finished after " + turns + " end-turns");
const lost = !/Victory! The contract is yours/.test(await text(p));
await press(p, "Main menu"); await tapSel(p, "[data-profile-chip]"); await sleep(300);
const quick = await p.$eval('[data-stats-scope="local"] [data-stat-mode="quick"]', (e) => e.innerText).catch(() => "");
check(lost ? /0\s*won · 1\s*lost/.test(quick) : /1\s*won · 0\s*lost/.test(quick), "local stats record the quick match: " + quick.replace(/\s+/g, " "));
const rec = await p.$eval('[data-recent-list="local"]', (e) => e.innerText).catch(() => "");
check(/Vs computer/.test(rec), "last matches lists it: " + rec.split("\n").slice(0, 3).join(" "));
const played = await p.$eval('[data-stat="local-played"]', (e) => e.innerText).catch(() => "");
check(/^1/.test(played.trim()), "games played 1: " + played.replace(/\s+/g, " "));
const st = await p.evaluate(() => JSON.parse(localStorage.getItem("contract-steel-profile-v1") || "{}"));
check(st.stats && st.stats.played === 1 && st.stats.recent && st.stats.recent.length === 1, "saved stats survive in localStorage");
check(!!(await p.$("[data-camp-progress]")), "campaign progress section shown");
await p.$eval('[data-stats-scope="local"]', (e) => e.scrollIntoView({ block: "start", behavior: "instant" })); await sleep(300); await p.screenshot({ path: OUT + "05-profile-stats.png" });
// reload: profile persists
await p.reload(); await sleep(900); await tapSel(p, "[data-profile-chip]");
check(await p.$eval("[data-profile-pic]", (e) => e.getAttribute("data-profile-pic")) === "selene" && /1/.test(await p.$eval('[data-stat="local-played"]', (e) => e.innerText)), "profile survives a reload");
// memory-only: storage throws
const q = await mk();
await q.evaluateOnNewDocument(() => { const bad = () => { throw new Error("blocked"); }; Storage.prototype.setItem = bad; Storage.prototype.getItem = bad; });
await q.goto(URL); await sleep(900);
check(!!(await q.$("[data-cs-root]")) || /Contract/.test(await text(q)), "game loads with storage blocked");
await tapSel(q, "[data-profile-chip]");
check(!!(await q.$("[data-profile-memory]")), "memory-only warning shown: " + ((await q.$eval("[data-profile-memory]", (e) => e.innerText).catch(() => "")).slice(0, 120)));
await q.type("[data-profile-name]", "Ghost"); await press(q, "Change portrait"); await tapSel(q, '[data-portrait-pick="rotmaw"]');
check(await q.$eval("[data-profile-pic]", (e) => e.getAttribute("data-profile-pic")) === "rotmaw", "portrait still works in memory");
await shotTop(q, "06-memory-only.png");
check(errs.length === 0, "no page errors " + JSON.stringify(errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : "ALL PASS");
await browser.close(); process.exit(fails ? 1 : 0);
