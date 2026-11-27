// Engine rules for the Wall cards: Guard of the Wall, Iron Mage Apprentice, Wall token.
import { newGame, apply, CARD, COLLECTION, aiAction, siegeMuster, newSiege, SHOP_POOL } from "../engine.js";
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const deck = Array(20).fill("recruit");
function setup() {
  let g = newGame({ name: "Ana", deck, hp: 15 }, { name: "Ben", deck, hp: 15 });
  g = apply(g, { t: "first", side: g.roll.winner, first: g.roll.winner === "a" });
  g = apply(g, { t: "mull", side: "a", idx: [] }); g = apply(g, { t: "mull", side: "b", idx: [] });
  g.turn = "a"; g.phase = "play"; g.a.board = []; g.b.board = []; g.log = []; g.plays = []; g.a.due = []; g.b.due = [];
  return g;
}
const unit = (g, id, extra = {}) => ({ uid: g.uid++, id, atk: CARD[id].atk, hp: CARD[id].hp, maxHp: CARD[id].hp, ready: true, guard: !!CARD[id].guard, hidden: !!CARD[id].hidden, ...extra });
const C = (id) => CARD[id];
check(C("wallguard").cost === 3 && C("wallguard").atk === 1 && C("wallguard").hp === 2 && C("wallguard").fac === "iron", "Guard of the Wall 3g 1/2 iron");
check(C("wallmage").cost === 4 && C("wallmage").atk === 1 && C("wallmage").hp === 2 && C("wallmage").fac === "iron", "Iron Mage Apprentice 4g 1/2 iron");
check(C("wall").token && C("wall").guard && C("wall").atk === 0 && C("wall").hp === 4, "Wall token 0/4 Guard");
check(!COLLECTION.some((c) => c.id === "wall") && COLLECTION.filter((c) => c.fac === "iron").length === 20 && COLLECTION.length === 102, `collection 102, iron 20, no Wall (${COLLECTION.length})`);
// Guard of the Wall
let g = setup(); g.a.hand = ["wallguard"]; g.a.gold = 3; g = apply(g, { t: "play", idx: 0 });
let gw = g.a.board.find((u) => u.id === "wallguard"), w = g.a.board.find((u) => u.id === "wall");
check(gw && w && w.atk === 0 && w.hp === 4 && w.guard, "hire creates a 0/4 Guard Wall");
check(gw.atk === 3 && gw.hp === 2, `Guard of the Wall is 3/2 while the Wall stands (${gw.atk}/${gw.hp})`);
// Wall can't attack, even next turn or with Reckless Charge
g = apply(g, { t: "end" }); g = apply(g, { t: "end" }); w = g.a.board.find((u) => u.id === "wall");
check(!w.ready, "Wall never readies");
{ const e = unit(g, "brawler"); g.b.board = [e]; const n = apply(g, { t: "attack", uid: w.uid, target: { side: "b", uid: e.uid } }); check(n === g, "Wall can't attack"); }
{ let h = JSON.parse(JSON.stringify(g)); h.a.hand = ["charge"]; h.a.gold = 1; const ww = h.a.board.find((u) => u.id === "wall"); h = apply(h, { t: "play", idx: 0, target: { side: "a", uid: ww.uid } }); const w2 = h.a.board.find((u) => u.id === "wall"); check(w2.atk === 2 && !w2.ready, "Reckless Charge on a Wall: +2 attack but still can't attack"); }
// Wall dies -> loses +2
{ let h = JSON.parse(JSON.stringify(g)); const ww = h.a.board.find((u) => u.id === "wall"); h.a.hand = ["knife"]; ww.hp = 3; h.b.hand = []; h.turn = "a";
  // kill own wall with Blood Blade-like damage: use dmg via enemy ogre attack
  h.turn = "b"; const og = unit(h, "ogre"); h.b.board = [og]; h = apply(h, { t: "attack", uid: og.uid, target: { side: "a", uid: ww.uid } });
  const g2 = h.a.board.find((u) => u.id === "wallguard"); check(!h.a.board.some((u) => u.id === "wall") && g2.atk === 1, `Wall dies -> Guard of the Wall back to 1 attack (${g2.atk})`); }
// Two walls: still +2 only
{ let h = setup(); h.a.hand = ["wallguard", "wallguard"]; h.a.gold = 6; h = apply(h, { t: "play", idx: 0 }); h = apply(h, { t: "play", idx: 0 });
  check(h.a.board.filter((u) => u.id === "wallguard").every((u) => u.atk === 3) && h.a.board.filter((u) => u.id === "wall").length === 2, "two Guards + two Walls: each Guard 3 attack (bonus doesn't stack)"); }
// Apprentice
{ let h = setup(); h.a.hand = ["wallmage"]; h.a.gold = 4; const old = { uid: h.uid++, id: "wall", atk: 0, hp: 4, maxHp: 4, ready: false, guard: true, hidden: false }; h.a.board = [old]; h = apply(h, { t: "play", idx: 0 });
  const ws = h.a.board.filter((u) => u.id === "wall"); check(ws.length === 2 && ws.every((u) => u.atk === 1 && u.hp === 5 && u.maxHp === 5), `Apprentice: new Wall + all Walls +1/+1 (${ws.map((u) => u.atk + "/" + u.hp)})`);
  const m = h.a.board.find((u) => u.id === "wallmage"); check(m.atk === 1 && m.hp === 2, "Apprentice stays 1/2"); }
// Full board: no Wall, Apprentice still buffs existing Walls
{ let h = setup(); h.a.hand = ["wallmage"]; h.a.gold = 4; h.a.board = [unit(h, "wall", { ready: false }), unit(h, "brawler"), unit(h, "brawler"), unit(h, "brawler"), unit(h, "brawler")]; h = apply(h, { t: "play", idx: 0 });
  const ws = h.a.board.filter((u) => u.id === "wall"); check(h.a.board.length === 6 && ws.length === 1 && ws[0].hp === 5 && ws[0].atk === 1, "full board: no new Wall, existing Wall buffed"); }
{ let h = setup(); h.a.hand = ["wallguard"]; h.a.gold = 3; h.a.board = [1, 2, 3, 4, 5].map(() => unit(h, "brawler")); h = apply(h, { t: "play", idx: 0 });
  check(!h.a.board.some((u) => u.id === "wall") && h.a.board.find((u) => u.id === "wallguard").atk === 1, "full board: Guard of the Wall makes no Wall and stays 1/2"); }
// Siege garrison and wave
{ let h = setup(); h.a.board = [unit(h, "wallguard"), unit(h, "wallmage")]; h.b.board = [unit(h, "wallguard", { ent: true })]; siegeMuster(h, true);
  const aw = h.a.board.filter((u) => u.id === "wall"); check(aw.length === 2 && aw.every((u) => u.hp === 5) && h.a.board.find((u) => u.id === "wallguard").atk === 3, "siege garrison: both Hire effects fire (2 Walls 1/5, Guard 3/2)");
  check(h.b.board.some((u) => u.id === "wall") && h.b.board.find((u) => u.id === "wallguard").atk === 3, "siege wave: Guard of the Wall makes its Wall"); }
// AI: never attacks with a Wall, plays the cards
{ let h = setup(); h.a.hand = ["wallguard"]; h.a.gold = 3; const a = aiAction(h); check(a.t === "play", "AI hires Guard of the Wall"); }
{ let h = setup(); const ww = unit(h, "wall", { atk: 3, ready: true }); h.a.board = [ww]; h.a.hand = []; const a = aiAction(h); check(!(a.t === "attack" && a.uid === ww.uid), "AI never attacks with a Wall"); }
check(SHOP_POOL().some((c) => c.id === "wallguard") && !SHOP_POOL().some((c) => c.id === "wall"), "siege shop pool has the new cards, not the Wall");
console.log(fails ? `${fails} FAILED` : "ALL OK"); process.exit(fails ? 1 : 0);
