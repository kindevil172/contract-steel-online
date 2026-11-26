// Engine rules for the four card tweaks: Contract Golem 7-gold hire, Graci heals captain 5, Hired Battlemage any target, Hostile Buyout 4 gold.
import { newGame, apply, CARD, aiAction, siegeMuster, spellTargetOk, canPlay } from "../engine.js";
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
check(CARD.buyout.cost === 4, "Hostile Buyout costs 4");
check(CARD.golem.cost === 5 && CARD.golem.atk === 5 && CARD.golem.hp === 6 && !CARD.golem.guard, "Contract Golem stays 5g 5/6");
check(CARD.battlemage.target === "any" && CARD.battlemage.text === "Hire: 3 damage to any target.", "Battlemage text/target");
// Golem
{ let g = setup(); g.a.hand = ["golem"]; g.a.gold = 7; const n = apply(g, { t: "play", idx: 0, alt: true }); const u = n.a.board[0];
  check(u && u.atk === 5 && u.hp === 8 && u.maxHp === 8 && u.guard && n.a.gold === 0, `golem 7 gold -> 5/8 Guard, gold 0 (${u && `${u.atk}/${u.hp} g${u.guard}`} gold ${n.a.gold})`); }
{ let g = setup(); g.a.hand = ["golem"]; g.a.gold = 7; const n = apply(g, { t: "play", idx: 0 }); const u = n.a.board[0];
  check(u && u.atk === 5 && u.hp === 6 && !u.guard && n.a.gold === 2, "golem normal hire -> 5/6, 5 gold"); }
{ let g = setup(); g.a.hand = ["golem"]; g.a.gold = 6; const n = apply(g, { t: "play", idx: 0, alt: true });
  check(n === g, "golem 7-gold option refused with 6 gold"); }
{ let g = setup(); g.a.hand = ["bodyguard"]; g.a.gold = 4; const n = apply(g, { t: "play", idx: 0, alt: true }); const u = n.a.board[0];
  check(u && u.atk === 2 && u.hp === 5 && u.guard && n.a.gold === 0, "bodyguard 4-gold still 2/5 Guard"); }
{ let g = setup(); g.a.hand = ["golem", "ogre"]; g.a.gold = 7; const a = aiAction(g); check(a.t === "play" && g.a.hand[a.idx] === "golem" && a.alt, "AI pays 7 for golem when nothing else fits"); }
{ let g = setup(); g.a.hand = ["golem", "medic"]; g.a.gold = 7; const a = aiAction(g); check(a.t === "play" && g.a.hand[a.idx] === "golem" && !a.alt, `AI pays 5 when a 2-cost card also fits (${JSON.stringify(a)})`); }
// Graci
{ let g = setup(); g.a.hand = ["graci"]; g.a.gold = 4; g.a.hp = 6; const w = unit(g, "ogre", { hp: 2 }); g.a.board = [w]; g.a.deck = ["recruit", "recruit"];
  const n = apply(g, { t: "play", idx: 0 }); check(n.a.hp === 11, `Graci heals captain 5 (6 -> ${n.a.hp})`); check(n.a.board[0].hp === 4, "Graci heals sellswords 2"); check(n.a.hand.length === 1, "Graci draws a card"); }
{ let g = setup(); g.a.hand = ["graci"]; g.a.gold = 4; g.a.hp = 13; const n = apply(g, { t: "play", idx: 0 }); check(n.a.hp === 15, "Graci heal capped at max"); }
// Battlemage
const bm = (tgt, prep) => { let g = setup(); g.a.hand = ["battlemage"]; g.a.gold = 5; const mine = unit(g, "ogre"), foe = unit(g, "ogre"); g.a.board = [mine]; g.b.board = [foe]; if (prep) prep(g, mine, foe); return { g, mine, foe, n: apply(g, { t: "play", idx: 0, target: tgt(mine, foe) }) }; };
{ const { n, foe } = bm((m, f) => ({ side: "b", uid: f.uid })); check(n.b.board.find((x) => x.uid === foe.uid).hp === CARD.ogre.hp - 3 && n.b.hp === 15, "Battlemage hits an enemy sellsword for 3"); }
{ const { n, mine } = bm((m) => ({ side: "a", uid: m.uid })); check(n.a.board.find((x) => x.uid === mine.uid).hp === CARD.ogre.hp - 3, "Battlemage hits a friendly sellsword for 3"); }
{ const { n } = bm(() => ({ side: "b", uid: "hero" })); check(n.b.hp === 12, "Battlemage hits the enemy captain for 3"); }
{ const { n } = bm(() => ({ side: "a", uid: "hero" })); check(n.a.hp === 12 && n.a.board.length === 2, "Battlemage can hit your own captain for 3"); }
{ const { n, g } = bm((m, f) => ({ side: "b", uid: f.uid }), (g, m, f) => { f.hidden = true; }); check(n === g, "Battlemage can't target a Hidden enemy"); }
{ let g = setup(); g.a.hand = ["battlemage"]; g.a.gold = 5; check(apply(g, { t: "play", idx: 0 }) === g, "Battlemage needs a target"); }
{ let g = setup(); g.siege = { x: 1 }; check(!spellTargetOk(g, "a", CARD.battlemage, { side: "b", uid: "hero" }), "Siege: wave has no captain to target"); check(spellTargetOk(g, "a", CARD.battlemage, { side: "a", uid: "hero" }), "Siege: own walls targetable"); }
{ let g = setup(); g.a.hand = ["battlemage"]; g.a.gold = 5; const f = unit(g, "ogre", { hp: 3 }); g.b.board = [f]; const a = aiAction(g); check(a.t === "play" && a.target && a.target.uid === f.uid, `AI Battlemage kills a 3-health ogre (${JSON.stringify(a.target)})`); }
{ let g = setup(); g.a.hand = ["battlemage"]; g.a.gold = 5; const a = aiAction(g); check(a.t === "play" && a.target && a.target.side === "b" && a.target.uid === "hero", "AI Battlemage hits enemy captain otherwise"); }
// Siege garrison: default (no target) battlemage hits the enemy captain, golem garrison is plain 5/6
{ let g = setup(); const b = unit(g, "battlemage"), gl = unit(g, "golem"); g.a.board = [b, gl]; siegeMuster(g, false); check(g.b.hp === 12 && gl.hp === 6 && !gl.guard, "garrison Battlemage keeps auto-target; garrison Golem is the normal 5/6"); }
// Buyout at 4
{ let g = setup(); g.a.hand = ["buyout"]; g.a.gold = 4; const f = unit(g, "pikeman"); g.b.board = [f]; check(canPlay(g, "a", 0), "Buyout playable with 4 gold"); const n = apply(g, { t: "play", idx: 0, target: { side: "b", uid: f.uid } }); check(n.a.board.some((x) => x.uid === f.uid) && n.a.gold === 0, "Buyout takes control for 4"); }
console.log(fails ? `${fails} FAILED` : "ALL OK"); process.exit(fails ? 1 : 0);
