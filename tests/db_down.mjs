// With the database unreachable: the profile says accounts are offline, guests can still open everything.
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE || "http://localhost:8081";
const OUT = process.env.OUT || "/workspace/anim-test/shots/accounts/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
await p.goto(BASE); await sleep(1500);
await (await p.$("[data-profile-chip]")).tap(); await sleep(1200);
const st = await p.$eval("[data-acct-status]", (e) => e.getAttribute("data-acct-status")).catch(() => "");
check(st === "offline", "profile shows accounts offline: " + st);
const t = await p.evaluate(() => document.body.innerText);
check(/offline/i.test(t) && /guest/i.test(t), "offline message tells you to play as a guest");
await p.screenshot({ path: OUT + "phone-08-db-down.png" });
check(errs.length === 0, "no page errors " + JSON.stringify(errs));
console.log(fails ? fails + " FAIL" : "ALL PASS"); await b.close();
