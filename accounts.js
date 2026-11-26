// Contract & Steel accounts: username + password (scrypt), session tokens, portraits and match stats in Postgres.
// Everything here is optional: if DATABASE_URL is missing or the database is unreachable, the game keeps running
// and the account API answers 503 so the client can say "accounts are offline, play as a guest".
import crypto from "node:crypto";

const MODES = ["online", "draft", "tour", "siegeSolo", "siegeCoop"];
export const MODE_NAMES = { online: "Online match", draft: "Online draft", tour: "Tournament", siegeSolo: "Siege (solo)", siegeCoop: "Siege (co-op)" };
let pool = null, dbOk = false, dbErr = "not configured", retryT = null;
const sessCache = new Map(); // sha256(token) -> { uid, exp, at }
const pendingResults = []; // results that could not be written while the DB was down (kept in memory, bounded)

export const accountsUp = () => dbOk;
export async function initAccounts(url) {
  if (!url) { console.log("accounts: DATABASE_URL not set, accounts disabled (guests only)"); return; }
  let pg; try { pg = (await import("pg")).default; } catch (e) { dbErr = "pg module missing"; console.log("accounts: pg module missing, accounts disabled"); return; }
  const ssl = /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined;
  pool = new pg.Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, ssl });
  pool.on("error", (e) => { console.log("accounts: pool error", e.code || e.message); dbOk = false; schedule(); });
  await connect();
}
function schedule() { clearTimeout(retryT); retryT = setTimeout(connect, 30000); }
async function connect() {
  try {
    await pool.query(`create table if not exists cs_users (id serial primary key, uname text not null, uname_l text unique not null, pw text not null, pic text not null default 'captain', stats jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), last_seen timestamptz not null default now())`);
    await pool.query(`create table if not exists cs_sessions (th text primary key, uid int not null references cs_users(id) on delete cascade, expires timestamptz not null)`);
    await pool.query(`delete from cs_sessions where expires < now()`);
    if (!dbOk) console.log("accounts: database ready");
    dbOk = true; dbErr = "";
    while (pendingResults.length) { const r = pendingResults.shift(); try { await writeResult(r.uid, r.res); } catch { pendingResults.unshift(r); throw new Error("flush failed"); } }
  } catch (e) { if (dbOk || dbErr !== (e.code || e.message)) console.log("accounts: database unreachable:", e.code || e.message); dbOk = false; dbErr = e.code || e.message; schedule(); }
}
// ---------- passwords and sessions ----------
const scryptP = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))));
async function hashPw(pw) { const salt = crypto.randomBytes(16); const k = await scryptP(pw, salt); return `s1$${salt.toString("base64")}$${k.toString("base64")}`; }
async function checkPw(pw, stored) { const [v, s, h] = String(stored).split("$"); if (v !== "s1" || !s || !h) return false; const k = await scryptP(pw, Buffer.from(s, "base64")); const want = Buffer.from(h, "base64"); return want.length === k.length && crypto.timingSafeEqual(want, k); }
const th = (tok) => crypto.createHash("sha256").update(String(tok)).digest("hex");
const SESSION_DAYS = 60;
async function newSession(uid) { const tok = crypto.randomBytes(32).toString("base64url"); await pool.query("insert into cs_sessions (th, uid, expires) values ($1, $2, now() + interval '60 days')", [th(tok), uid]); return tok; }
export async function userIdFor(tok) {
  if (!tok || typeof tok !== "string" || tok.length > 100 || !dbOk) return null;
  const h = th(tok), c = sessCache.get(h);
  if (c && c.exp > Date.now() && Date.now() - c.at < 5 * 60 * 1000) return c.uid;
  try {
    const r = await pool.query("select uid, extract(epoch from expires) * 1000 as exp from cs_sessions where th = $1 and expires > now()", [h]);
    if (!r.rows.length) { sessCache.delete(h); return null; }
    const uid = r.rows[0].uid; sessCache.set(h, { uid, exp: Number(r.rows[0].exp), at: Date.now() }); return uid;
  } catch { return null; }
}
// ---------- stats ----------
export const emptyStats = () => ({ modes: Object.fromEntries(MODES.map((m) => [m, { w: 0, l: 0 }])), played: 0, streak: 0, best: 0, siegeBest: 0, siegeWins: 0, fac: {}, cards: {}, recent: [] });
function fixStats(s) { const e = emptyStats(); s = s && typeof s === "object" ? s : {}; const out = { ...e, ...s, modes: { ...e.modes, ...(s.modes || {}) }, fac: s.fac || {}, cards: s.cards || {}, recent: Array.isArray(s.recent) ? s.recent : [] }; return out; }
// res: { mode, win, opp, fac, cards: {id:n}, day? }
export function applyResult(stats, res) {
  const s = fixStats(stats); const m = MODES.includes(res.mode) ? res.mode : "online";
  const k = s.modes[m] || (s.modes[m] = { w: 0, l: 0 });
  if (res.win) k.w++; else k.l++;
  s.played++;
  s.streak = res.win ? s.streak + 1 : 0; s.best = Math.max(s.best, s.streak);
  if (m === "siegeSolo" || m === "siegeCoop") { if (res.win) s.siegeWins++; if (Number.isFinite(res.day)) s.siegeBest = Math.max(s.siegeBest, Math.min(12, Math.max(0, Math.floor(res.day)))); }
  if (res.fac) s.fac[res.fac] = (s.fac[res.fac] || 0) + 1;
  for (const [id, n] of Object.entries(res.cards || {})) if (Number.isFinite(n) && n > 0) s.cards[id] = (s.cards[id] || 0) + Math.min(60, Math.floor(n));
  // keep the card table small: top 60
  const top = Object.entries(s.cards).sort((a, b) => b[1] - a[1]).slice(0, 60); s.cards = Object.fromEntries(top);
  s.recent = [{ mode: m, opp: String(res.opp || "").slice(0, 40), res: res.win ? "W" : "L", fac: res.fac || "", at: Date.now(), ...(Number.isFinite(res.day) ? { day: res.day } : {}) }, ...s.recent].slice(0, 10);
  return s;
}
async function writeResult(uid, res) {
  const c = await pool.connect();
  try {
    await c.query("begin");
    const r = await c.query("select stats from cs_users where id = $1 for update", [uid]);
    if (r.rows.length) await c.query("update cs_users set stats = $2, last_seen = now() where id = $1", [uid, JSON.stringify(applyResult(r.rows[0].stats, res))]);
    await c.query("commit");
  } catch (e) { try { await c.query("rollback"); } catch {} throw e; } finally { c.release(); }
}
// Fire and forget: never blocks or breaks a game.
export function recordResult(uid, res) {
  if (!uid || !pool) return;
  if (!dbOk) { if (pendingResults.length < 500) pendingResults.push({ uid, res }); return; }
  writeResult(uid, res).catch((e) => { console.log("accounts: result not saved yet:", e.code || e.message); if (pendingResults.length < 500) pendingResults.push({ uid, res }); dbOk = false; schedule(); });
}
// ---------- HTTP API ----------
const okName = (u) => typeof u === "string" && /^[A-Za-z0-9_-]{3,20}$/.test(u);
const okPw = (p) => typeof p === "string" && p.length >= 8 && p.length <= 100;
const tries = new Map(); // ip -> [timestamps]
function limited(ip, max = 12) { const now = Date.now(); const a = (tries.get(ip) || []).filter((t) => now - t < 60000); a.push(now); tries.set(ip, a); if (tries.size > 5000) tries.clear(); return a.length > max; }
const view = (row) => ({ name: row.uname, pic: row.pic, stats: fixStats(row.stats), since: row.created_at });
function body(req) { return new Promise((res) => { let d = ""; req.on("data", (c) => { d += c; if (d.length > 20000) { d = ""; req.destroy(); } }); req.on("end", () => { try { res(JSON.parse(d || "{}")); } catch { res(null); } }); req.on("error", () => res(null)); }); }
const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(obj)); };
const bearer = (req) => { const h = String(req.headers.authorization || ""); return h.startsWith("Bearer ") ? h.slice(7).trim() : ""; };
export async function handleApi(req, res, pathname, picOk) {
  if (pathname === "/api/status") return json(res, 200, { accounts: dbOk });
  if (!dbOk) return json(res, 503, { error: "Accounts are offline right now. You can keep playing as a guest." });
  if (req.method !== "POST" && req.method !== "GET") return json(res, 405, { error: "Method not allowed." });
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  try {
    if (pathname === "/api/signup" && req.method === "POST") {
      if (limited(ip, 6)) return json(res, 429, { error: "Too many tries. Wait a minute and try again." });
      const b = await body(req); if (!b) return json(res, 400, { error: "Bad request." });
      if (!okName(b.username)) return json(res, 400, { error: "Usernames are 3 to 20 letters, numbers, _ or -." });
      if (!okPw(b.password)) return json(res, 400, { error: "Passwords need at least 8 characters." });
      const pic = picOk(b.pic) ? b.pic : "captain";
      const hash = await hashPw(b.password);
      const r = await pool.query("insert into cs_users (uname, uname_l, pw, pic, stats) values ($1, $2, $3, $4, $5) on conflict (uname_l) do nothing returning *", [b.username, b.username.toLowerCase(), hash, pic, JSON.stringify(emptyStats())]);
      if (!r.rows.length) return json(res, 409, { error: "That username is taken." });
      return json(res, 200, { token: await newSession(r.rows[0].id), user: view(r.rows[0]) });
    }
    if (pathname === "/api/login" && req.method === "POST") {
      if (limited(ip)) return json(res, 429, { error: "Too many tries. Wait a minute and try again." });
      const b = await body(req); if (!b || typeof b.username !== "string" || typeof b.password !== "string") return json(res, 400, { error: "Bad request." });
      const r = await pool.query("select * from cs_users where uname_l = $1", [b.username.toLowerCase().slice(0, 40)]);
      if (!r.rows.length || !(await checkPw(b.password.slice(0, 100), r.rows[0].pw))) return json(res, 401, { error: "Wrong username or password." });
      await pool.query("update cs_users set last_seen = now() where id = $1", [r.rows[0].id]);
      return json(res, 200, { token: await newSession(r.rows[0].id), user: view(r.rows[0]) });
    }
    const tok = bearer(req); const uid = await userIdFor(tok);
    if (!uid) return json(res, 401, { error: "Please log in again." });
    if (pathname === "/api/me" && req.method === "GET") { const r = await pool.query("select * from cs_users where id = $1", [uid]); return r.rows.length ? json(res, 200, { user: view(r.rows[0]) }) : json(res, 401, { error: "Please log in again." }); }
    if (pathname === "/api/logout" && req.method === "POST") { await pool.query("delete from cs_sessions where th = $1", [th(tok)]); sessCache.delete(th(tok)); return json(res, 200, { ok: true }); }
    if (pathname === "/api/pic" && req.method === "POST") {
      const b = await body(req); if (!b || !picOk(b.pic)) return json(res, 400, { error: "Pick a card portrait." });
      const r = await pool.query("update cs_users set pic = $2 where id = $1 returning *", [uid, b.pic]); return json(res, 200, { user: view(r.rows[0]) });
    }
    // Siege solo is played in the browser, so the client reports its own result (one per finished siege).
    if (pathname === "/api/report" && req.method === "POST") {
      if (limited("r" + uid, 20)) return json(res, 429, { error: "Too many reports." });
      const b = await body(req); if (!b || b.mode !== "siegeSolo") return json(res, 400, { error: "Only solo siege results are reported here." });
      const cards = {}; for (const [id, n] of Object.entries(b.cards || {}).slice(0, 80)) if (picOk(id)) cards[id] = Number(n) || 0;
      await writeResult(uid, { mode: "siegeSolo", win: !!b.win, opp: "The besiegers", fac: typeof b.fac === "string" ? b.fac.slice(0, 12) : "", cards, day: Number(b.day) || 0 });
      const r = await pool.query("select * from cs_users where id = $1", [uid]); return json(res, 200, { user: view(r.rows[0]) });
    }
    return json(res, 404, { error: "Not found." });
  } catch (e) { console.log("accounts: api error", e.code || e.message); if (e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT" || /timeout|terminat/i.test(e.message || "")) { dbOk = false; schedule(); } return json(res, 503, { error: "Accounts are offline right now. You can keep playing as a guest." }); }
}
// Player portrait lookups for rooms: account picture if signed in.
export async function picFor(uid) { if (!uid || !dbOk) return null; try { const r = await pool.query("select pic, uname from cs_users where id = $1", [uid]); return r.rows[0] || null; } catch { return null; } }
