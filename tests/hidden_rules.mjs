// Engine rules for the Hidden rework: face-down view, no retaliation on the reveal attack, First Strike still strikes first.
import { newGame, apply, viewFor, CARD } from "../engine.js";
let fails = 0; const check = (c, m) => { console.log(c ? "ok" : "FAIL", m); if (!c) fails++; };
const deck = Array(20).fill("recruit");
function setup() {
  let g = newGame({ name: "Ana", deck, hp: 15 }, { name: "Ben", deck, hp: 15 });
  g = apply(g, { t: "first", side: g.roll.winner, first: g.roll.winner === "a" });
  g = apply(g, { t: "mull", side: "a", idx: [] }); g = apply(g, { t: "mull", side: "b", idx: [] });
  g.turn = "a"; g.phase = "play"; g.a.board = []; g.b.board = []; g.log = []; g.plays = [];
  return g;
}
const unit = (g, id, extra = {}) => ({ uid: g.uid++, id, atk: CARD[id].atk, hp: CARD[id].hp, maxHp: CARD[id].hp, ready: true, guard: !!CARD[id].guard, hidden: !!CARD[id].hidden, ...extra });
check(CARD.infiltrator.atk === 2 && CARD.infiltrator.hp === 3 && CARD.infiltrator.cost === 2 && CARD.infiltrator.hidden, "Masked Infiltrator is 2g 2/3 Hidden");
// 1) reveal attack: no damage back
{ const g = setup(); const u = unit(g, "cutthroat"), d = unit(g, "ogre"); g.a.board = [u]; g.b.board = [d];
  const n = apply(g, { t: "attack", uid: u.uid, target: { side: "b", uid: d.uid } });
  const nu = n.a.board.find((x) => x.uid === u.uid), nd = n.b.board.find((x) => x.uid === d.uid);
  check(nu && nu.hp === CARD.cutthroat.hp && !nu.hidden, `reveal attack takes no damage back (cutthroat ${nu && nu.hp}/${CARD.cutthroat.hp}, revealed)`);
  check(!nd || nd.hp === CARD.ogre.hp - CARD.cutthroat.atk, "defender took the hit");
  // 2) second attack: normal retaliation
  nu.ready = true; n.turn = "a";
  if (nd) { const m = apply(n, { t: "attack", uid: nu.uid, target: { side: "b", uid: nd.uid } }); const mu = m.a.board.find((x) => x.uid === u.uid);
    check(!mu || mu.hp < CARD.cutthroat.hp, "after the reveal it fights normally (takes damage back)"); } }
// 3) First Strike defender strikes first and can kill the Hidden attacker before it hits
{ const g = setup(); const u = unit(g, "infiltrator", { hp: 2, maxHp: 3 }), d = unit(g, "jordan"); g.a.board = [u]; g.b.board = [d];
  const n = apply(g, { t: "attack", uid: u.uid, target: { side: "b", uid: d.uid } });
  check(!n.a.board.find((x) => x.uid === u.uid), "First Strike defender (3 atk) kills a 2-health Hidden attacker first");
  check(n.b.board.find((x) => x.uid === d.uid).hp === CARD.jordan.hp, "...and takes no damage because the attacker died first"); }
{ const g = setup(); const u = unit(g, "giantcent", { trib: undefined }), d = unit(g, "jordan"); g.a.board = [u]; g.b.board = [d];
  const n = apply(g, { t: "attack", uid: u.uid, target: { side: "b", uid: d.uid } });
  const nu = n.a.board.find((x) => x.uid === u.uid);
  check(nu && nu.hp === CARD.giantcent.hp - CARD.jordan.atk && !n.b.board.find((x) => x.uid === d.uid), "First Strike still hits a Hidden attacker that survives (5/5 takes 3, kills Jordan)"); }
// 4) Ambusher stun still works
{ const g = setup(); const u = unit(g, "ambusher"), d = unit(g, "troll"); g.a.board = [u]; g.b.board = [d];
  const n = apply(g, { t: "attack", uid: u.uid, target: { side: "b", uid: d.uid } });
  const nd = n.b.board.find((x) => x.uid === d.uid), nu = n.a.board.find((x) => x.uid === u.uid);
  check(nd && nd.stun && nu.hp === CARD.ambusher.hp, "Alley Ambusher stuns from Hidden and takes no damage back"); }
// 5) hiring a Hidden unit: log and recent plays don't name it; viewFor blanks it for the opponent only
{ let g = setup(); g.a.hand = ["widow", "recruit"]; g.a.gold = g.a.maxGold = 8;
  g = apply(g, { t: "play", idx: 0 });
  check(!g.log.some((m) => /Widow/.test(m)) && g.log.some((m) => /hired a Hidden sellsword/.test(m)), "war ledger: 'Ana hired a Hidden sellsword'");
  const vb = viewFor(g, "b"), va = viewFor(g, "a");
  const w = g.a.board[0];
  const sb = vb.a.board.find((x) => x.uid === w.uid);
  check(sb.id === "shade" && sb.atk === 0 && sb.hp === 1 && !sb.deadly && !sb.trib, "opponent's view: id 'shade', no stats/keywords");
  check(!JSON.stringify(vb).includes('"widow"'), "opponent's view never contains the card id");
  check(va.a.board.find((x) => x.uid === w.uid).id === "widow", "owner's view shows the real card");
  check(vb.plays.at(-1).id === "shade" && va.plays.at(-1).id === "widow", "recent plays redacted for the opponent only"); }
// 6) Tribute on a Hidden beast doesn't leak in the ledger or the due list
{ let g = setup(); const u = unit(g, "mossmen", { trib: { k: "gold", n: 1 } }); g.a.board = [u]; g.turn = "b"; g.b.hand = []; g = apply(g, { t: "end" });
  const vb = viewFor(g, "b");
  check(!(vb.a.due || []).includes(u.uid), "opponent doesn't see the Hidden beast's Tribute due");
  g = apply(g, { t: "trib", uid: u.uid, pay: true });
  check(!g.log.some((m) => /Moss Men|Tribute/.test(m)), "no Tribute line for a Hidden beast: " + g.log[0]); }
console.log(fails ? fails + " FAILED" : "ALL PASS"); process.exit(fails ? 1 : 0);
