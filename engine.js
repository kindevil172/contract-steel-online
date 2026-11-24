// ================= ENGINE =================
                      
                                                              
                                                     
                                                       
                                                                                                                                                                                                                                                                                                                                   
                                                                                                                                    
                                                                                                                                                                                                 
                                                                                                                 
                                                   
                                                                                                                        

const MAX_GOLD = 8, HAND_MAX = 8, BOARD_MAX = 6, DECK_SIZE = 20;
const CARDS            = [
  { id: "brawler", name: "Tavern Brawler", cost: 1, kind: "unit", atk: 2, hp: 1, fac: "crimson", flavor: "Paid in ale, fights for free." },
  { id: "recruit", name: "Shield Recruit", cost: 1, kind: "unit", atk: 1, hp: 3, fac: "iron", guard: true, flavor: "First contract, first shield." },
  { id: "cutpurse", name: "Cutpurse", cost: 1, kind: "unit", atk: 2, hp: 1, fac: "shadow", swift: true, flavor: "Your coin was never safe." },
  { id: "pikeman", name: "Hired Pikeman", cost: 2, kind: "unit", atk: 3, hp: 3, fac: "iron", flavor: "Ten silver a day, plus spear." },
  { id: "gatewarden", name: "Gate Warden", cost: 2, kind: "unit", atk: 1, hp: 4, fac: "iron", guard: true, flavor: "None pass without paying." },
  { id: "duelist", name: "Reckless Duelist", cost: 2, kind: "unit", atk: 3, hp: 1, fac: "crimson", swift: true, flavor: "Strikes first, asks fees later." },
  { id: "medic", name: "Field Medic", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "gilded", text: "Hire: heal your captain 3.", flavor: "Stitches billed separately." },
  { id: "assassin", name: "Rooftop Assassin", cost: 3, kind: "unit", atk: 3, hp: 2, fac: "shadow", swift: true, flavor: "Half up front, half on delivery." },
  { id: "veteran", name: "Tower Shield Veteran", cost: 3, kind: "unit", atk: 2, hp: 5, fac: "iron", guard: true, flavor: "Thirty wars, zero retreats." },
  { id: "axe", name: "Axe-for-Hire", cost: 3, kind: "unit", atk: 4, hp: 3, fac: "crimson", flavor: "Will split anything for coin." },
  { id: "quartermaster", name: "Guild Quartermaster", cost: 3, kind: "unit", atk: 3, hp: 3, fac: "gilded", text: "Hire: draw a card.", flavor: "Keeps the ledgers balanced." },
  { id: "captain", name: "Blood-Oath Captain", cost: 4, kind: "unit", atk: 5, hp: 5, fac: "crimson", flavor: "Her word is her contract." },
  { id: "bastion", name: "Iron Company Bastion", cost: 4, kind: "unit", atk: 3, hp: 6, fac: "iron", guard: true, flavor: "A wall that draws a wage." },
  { id: "nightblade", name: "Nightblade Master", cost: 5, kind: "unit", atk: 5, hp: 4, fac: "shadow", swift: true, flavor: "The guild's priciest name." },
  { id: "battlemage", name: "Hired Battlemage", cost: 5, kind: "unit", atk: 4, hp: 5, fac: "gilded", text: "Hire: 3 damage to the enemy captain.", flavor: "Spells cost extra." },
  { id: "ogre", name: "Ogre Siegebreaker", cost: 5, kind: "unit", atk: 5, hp: 7, fac: "crimson", text: "Rage: +1 attack after each fight it survives.", flavor: "Paid by the gate broken." },
  { id: "legion", name: "The Unbroken Legion", cost: 7, kind: "unit", atk: 7, hp: 8, fac: "iron", guard: true, text: "Hire: 1 damage to all enemy sellswords.", flavor: "A whole company, one invoice." },
  { id: "ambush", name: "Ambush", cost: 1, kind: "spell", fac: "shadow", target: "enemy", text: "Deal 2 damage to an enemy sellsword or captain.", flavor: "From the hedgerows." },
  { id: "bounty", name: "Bounty Hunt", cost: 3, kind: "spell", fac: "shadow", target: "enemy", text: "Deal 4 damage to an enemy sellsword or captain.", flavor: "Dead or alive. Mostly dead." },
  { id: "healer", name: "Healer's Fee", cost: 2, kind: "spell", fac: "gilded", target: "none", text: "Heal your captain 5. Draw a card.", flavor: "Worth every coin." },
  { id: "contracts", name: "New Contracts", cost: 2, kind: "spell", fac: "gilded", target: "none", text: "Draw 2 cards.", flavor: "The notice board is full." },
  { id: "battlepay", name: "Battle Pay", cost: 2, kind: "spell", fac: "crimson", target: "none", text: "Your sellswords get +1/+1 and can attack now.", flavor: "Gold makes the blood run hot." },
  { id: "firebomb", name: "Alchemist's Firebomb", cost: 3, kind: "spell", fac: "gilded", target: "none", text: "Deal 2 damage to ALL sellswords.", flavor: "Friendly fire not refundable." },
  { id: "bonus", name: "Signing Bonus", cost: 0, kind: "spell", fac: "gilded", target: "none", token: true, text: "Gain 1 gold this turn.", flavor: "For going second." },
  { id: "debt", name: "Unpaid Debt", cost: 9, kind: "spell", fac: "gilded", target: "none", token: true, text: "Curse. Cannot be played. Clogs your hand until you cut it at a shop or event.", flavor: "The Ledger always collects." },
  { id: "blade", name: "Masterwork Blade", cost: 1, kind: "spell", fac: "iron", target: "friend", text: "Give a friendly sellsword +2/+1.", flavor: "Forged on credit." },
  { id: "drummer", name: "War Drummer", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "crimson", isNew: true, text: "Hire: your other sellswords get +1 attack.", flavor: "The beat is the battle plan." },
  { id: "berserker", name: "Frenzied Berserker", cost: 3, kind: "unit", atk: 3, hp: 3, fac: "crimson", isNew: true, text: "Rage: +1 attack after each fight it survives.", flavor: "Charges by the head, not the hour." },
  { id: "raider", name: "Border Raider", cost: 1, kind: "unit", atk: 1, hp: 2, fac: "crimson", swift: true, drain: true, isNew: true, flavor: "Takes what he needs. Then more." },
  { id: "warlord", name: "Kaelra, Red Warlord", cost: 6, kind: "unit", atk: 6, hp: 5, fac: "crimson", swift: true, legend: true, isNew: true, text: "Hire: your other sellswords can attack now.", flavor: "She never charges. She leads it." },
  { id: "bloodmoney", name: "Blood Money", cost: 1, kind: "spell", fac: "crimson", target: "enemyUnit", isNew: true, text: "Deal 3 damage to an enemy sellsword. Your captain takes 2.", flavor: "Paid in advance, in red." },
  { id: "sergeant", name: "Drill Sergeant", cost: 3, kind: "unit", atk: 2, hp: 4, fac: "iron", guard: true, isNew: true, text: "Hire: your other sellswords get +1 health.", flavor: "Louder than the war drums." },
  { id: "crossbow", name: "Pavise Crossbowman", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "iron", isNew: true, text: "Hire: 1 damage to the weakest enemy sellsword.", flavor: "Reloads behind a door." },
  { id: "sapper", name: "Ironclad Sapper", cost: 4, kind: "unit", atk: 3, hp: 4, fac: "iron", isNew: true, text: "Last Pay: 2 damage to the enemy captain.", flavor: "Fuse length: negotiable." },
  { id: "dorn", name: "Marshal Dorn, Iron Wall", cost: 7, kind: "unit", atk: 5, hp: 9, fac: "iron", guard: true, legend: true, isNew: true, text: "Hire: your other sellswords gain Guard and +2 health.", flavor: "Forty years. One step back, never." },
  { id: "shieldwall", name: "Shield Wall", cost: 2, kind: "spell", fac: "iron", target: "none", isNew: true, text: "Your sellswords get +2 health.", flavor: "Lock shields. Hold the price." },
  { id: "poisoner", name: "Venom Poisoner", cost: 3, kind: "unit", atk: 1, hp: 3, fac: "shadow", deadly: true, isNew: true, flavor: "One drop, one fee." },
  { id: "infiltrator", name: "Masked Infiltrator", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "shadow", hidden: true, isNew: true, flavor: "Wore your colors to dinner." },
  { id: "knife", name: "Knife in the Dark", cost: 2, kind: "spell", fac: "shadow", target: "enemyUnit", isNew: true, text: "Deal 3 damage to an enemy sellsword.", flavor: "Nobody saw the thrower." },
  { id: "spymaster", name: "Guild Spymaster", cost: 4, kind: "unit", atk: 3, hp: 4, fac: "shadow", hidden: true, isNew: true, text: "Hire: draw a card.", flavor: "Knows your plan. Sells it twice." },
  { id: "widow", name: "The Faceless Widow", cost: 6, kind: "unit", atk: 4, hp: 5, fac: "shadow", hidden: true, deadly: true, legend: true, isNew: true, flavor: "Every contract ends in mourning." },
  { id: "moneylender", name: "Camp Moneylender", cost: 1, kind: "unit", atk: 1, hp: 2, fac: "gilded", isNew: true, text: "Last Pay: draw a card.", flavor: "Debts outlive debtors." },
  { id: "priest", name: "Battle Priest", cost: 4, kind: "unit", atk: 3, hp: 5, fac: "gilded", isNew: true, text: "Hire: heal your captain 4 and fully heal your sellswords.", flavor: "Prayers at standard rates." },
  { id: "golem", name: "Contract Golem", cost: 5, kind: "unit", atk: 5, hp: 6, fac: "gilded", isNew: true, flavor: "Never sleeps, never haggles." },
  { id: "buyout", name: "Hostile Buyout", cost: 5, kind: "spell", fac: "gilded", target: "enemyUnit", isNew: true, text: "Take control of an enemy sellsword with 3 or less attack.", flavor: "Loyalty has a price. Pay it." },
  { id: "selene", name: "Selene Goldhand", cost: 5, kind: "unit", atk: 3, hp: 5, fac: "gilded", drain: true, legend: true, isNew: true, text: "Hire: draw 2 cards.", flavor: "Audits kingdoms. Collects in blood." },
  { id: "grunt", name: "Goblin Grunt", cost: 1, kind: "unit", atk: 1, hp: 1, fac: "horde", token: true, flavor: "Cheap. Plentiful. Mostly brave." },
  { id: "rabble", name: "Goblin Rabble", cost: 1, kind: "unit", atk: 2, hp: 1, fac: "horde", isNew: true, text: "Hire: summon a 1/1 Goblin Grunt.", flavor: "Paid per head. Many heads." },
  { id: "kobold", name: "Kobold Tunneler", cost: 1, kind: "unit", atk: 2, hp: 1, fac: "horde", isNew: true, text: "Last Pay: 1 damage to the enemy captain.", flavor: "Digs in, blows up, bills you." },
  { id: "bomber", name: "Goblin Bomber", cost: 2, kind: "unit", atk: 2, hp: 1, fac: "horde", isNew: true, text: "Last Pay: 2 damage to the weakest enemy sellsword.", flavor: "Fuse? What fuse?" },
  { id: "shaman", name: "Goblin Shaman", cost: 3, kind: "unit", atk: 2, hp: 2, fac: "horde", isNew: true, text: "Hire: your other sellswords get +1/+1.", flavor: "The bones say: charge." },
  { id: "worg", name: "Worg Rider", cost: 3, kind: "unit", atk: 3, hp: 2, fac: "horde", swift: true, isNew: true, text: "Hire: summon a 1/1 Goblin Grunt.", flavor: "The wolf eats first." },
  { id: "bloodtusk", name: "Orc Bloodtusk", cost: 3, kind: "unit", atk: 2, hp: 4, fac: "horde", isNew: true, text: "Feast: +1/+1 whenever another friendly sellsword falls.", flavor: "Grows fat on bad odds." },
  { id: "gorger", name: "Ogre Gorger", cost: 3, kind: "unit", atk: 2, hp: 3, fac: "horde", isNew: true, text: "Hire: devour your weakest other sellsword and gain its attack and health.", flavor: "Lunch is part of the contract." },
  { id: "troll", name: "Hired Troll", cost: 5, kind: "unit", atk: 5, hp: 6, fac: "horde", isNew: true, text: "Regenerate: fully heals at the start of your turn.", flavor: "Billed by the limb. Regrows them." },
  { id: "warcall", name: "Horn of the Horde", cost: 2, kind: "spell", fac: "horde", target: "none", isNew: true, text: "Summon two 1/1 Goblin Grunts.", flavor: "They come out of every hole." },
  { id: "bloodfeast", name: "Blood Feast", cost: 0, kind: "spell", fac: "horde", target: "friend", isNew: true, text: "Destroy a friendly sellsword. Draw 2 cards.", flavor: "Nobody asks what's in the stew." },
  { id: "warboss", name: "Grimfang, the Warboss", cost: 6, kind: "unit", atk: 5, hp: 5, fac: "horde", legend: true, isNew: true, text: "Hire: summon Goblin Grunts until your side is full. Your Grunts get +1 attack.", flavor: "Every goblin within a mile owes him." },
  // ---- Wave 3: four new Commons and Rares per company ----
  { id: "skirmisher", name: "Blooded Skirmisher", cost: 2, kind: "unit", atk: 2, hp: 1, fac: "crimson", swift: true, text: "Rage: +1 attack after each fight it survives.", flavor: "First into the mud, last to stop grinning." },
  { id: "charge", name: "Reckless Charge", cost: 1, kind: "spell", fac: "crimson", target: "friend", text: "Give a friendly sellsword +2 attack. It can attack now.", flavor: "Nobody ordered it. Everybody followed." },
  { id: "headtaker", name: "Crimson Headtaker", cost: 5, kind: "unit", atk: 3, hp: 3, fac: "crimson", swift: true, text: "Hire: 2 damage to the weakest enemy sellsword.", flavor: "Paid per head. Keeps the receipts." },
  { id: "reaver", name: "Red Reaver", cost: 3, kind: "unit", atk: 3, hp: 3, fac: "crimson", drain: true, text: "Rage: +1 attack after each fight it survives.", flavor: "Drinks deep from every cut." },
  { id: "squire", name: "Iron Squire", cost: 2, kind: "unit", atk: 2, hp: 3, fac: "iron", guard: true, text: "Last Pay: heal your captain 3.", flavor: "Holds the line. Mostly by accident." },
  { id: "holdline", name: "Hold the Line", cost: 1, kind: "spell", fac: "iron", target: "friend", text: "Give a friendly sellsword Guard and +3 health.", flavor: "Plant it. Brace. Get paid." },
  { id: "ballista", name: "Siege Ballista", cost: 4, kind: "unit", atk: 2, hp: 5, fac: "iron", text: "Hire: 3 damage to the strongest enemy sellsword.", flavor: "Aim for the big one. Bill the widow." },
  { id: "juggernaut", name: "Iron Juggernaut", cost: 6, kind: "unit", atk: 5, hp: 8, fac: "iron", guard: true, text: "Rage: +1 attack after each fight it survives.", flavor: "A siege tower that learned to walk." },
  { id: "cutthroat", name: "Alley Cutthroat", cost: 2, kind: "unit", atk: 3, hp: 2, fac: "shadow", hidden: true, flavor: "Smiles from the dark. Never twice." },
  { id: "dart", name: "Poisoned Dart", cost: 1, kind: "spell", fac: "shadow", target: "enemyUnit", text: "Deal 1 damage to an enemy sellsword. Draw a card.", flavor: "A pinprick. Then the fever." },
  { id: "stalker", name: "Veiled Stalker", cost: 3, kind: "unit", atk: 2, hp: 2, fac: "shadow", hidden: true, deadly: true, flavor: "The fog has eyes. And a knife." },
  { id: "marked", name: "Marked for Death", cost: 4, kind: "spell", fac: "shadow", target: "enemyUnit", text: "Destroy an enemy sellsword.", flavor: "The Guild accepts all contracts." },
  { id: "clerk", name: "Coin Clerk", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "gilded", text: "Hire: gain 1 gold this turn.", flavor: "Counts twice. Pays once." },
  { id: "taxman", name: "Tax Collector", cost: 3, kind: "unit", atk: 2, hp: 4, fac: "gilded", drain: true, flavor: "Death and taxes. He handles both." },
  { id: "paladin", name: "Gilded Paladin", cost: 4, kind: "unit", atk: 3, hp: 5, fac: "gilded", guard: true, drain: true, flavor: "Holy light, billed hourly." },
  { id: "volley", name: "Arcane Volley", cost: 4, kind: "spell", fac: "gilded", target: "none", text: "Deal 2 damage to all enemy sellswords.", flavor: "Gold-leaf bolts. Premium rates." },
  { id: "looter", name: "Goblin Looter", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "horde", text: "Last Pay: draw a card.", flavor: "Takes the boots off the dead. Then yours." },
  { id: "brute", name: "Orc Brute", cost: 2, kind: "unit", atk: 2, hp: 2, fac: "horde", text: "Feast: +1/+1 whenever another friendly sellsword falls.", flavor: "Gets hungrier the worse it goes." },
  { id: "warchief", name: "Goblin War Chief", cost: 4, kind: "unit", atk: 2, hp: 3, fac: "horde", text: "Hire: summon a 1/1 Goblin Grunt, then your Grunts get +1/+1.", flavor: "Wears a crown. Stole it, too." },
  { id: "ravager", name: "Orc Ravager", cost: 5, kind: "unit", atk: 4, hp: 3, fac: "horde", swift: true, text: "Feast: +1/+1 whenever another friendly sellsword falls.", flavor: "Paints himself in the fallen." },
  { id: "jace", name: "Jace the Stalwart", cost: 5, kind: "unit", atk: 3, hp: 8, fac: "iron", guard: true, text: "Rage: heal 2 after each fight he survives.", flavor: "Blond as wheat, broad as a gate, and twice as hard to move." },
];
const CARD                          = {};
for (const c of CARDS) CARD[c.id] = c;
// Rarity is set per card by power and uniqueness (not by cost). Tokens and curses count as common.
const RARITY                         = {
  brawler: "common", recruit: "common", cutpurse: "common", pikeman: "common", gatewarden: "common", duelist: "common", medic: "common",
  assassin: "common", veteran: "common", axe: "common", quartermaster: "common", ambush: "common", healer: "common", contracts: "common",
  blade: "common", drummer: "common", berserker: "common", raider: "common", crossbow: "common", sergeant: "common", shieldwall: "common",
  infiltrator: "common", knife: "common", moneylender: "common", rabble: "common", kobold: "common", bomber: "common", worg: "common",
  bloodtusk: "common", warcall: "common", bonus: "common", debt: "common", grunt: "common",
  skirmisher: "common", charge: "common", squire: "common", holdline: "common", cutthroat: "common", dart: "common", clerk: "common",
  taxman: "common", looter: "common", brute: "common",
  headtaker: "rare", reaver: "rare", ballista: "rare", juggernaut: "rare", stalker: "rare", marked: "rare", paladin: "rare",
  volley: "rare", warchief: "rare", ravager: "rare",
  captain: "rare", bastion: "rare", ogre: "rare", bounty: "rare", battlepay: "rare", firebomb: "rare", bloodmoney: "rare", sapper: "rare",
  poisoner: "rare", spymaster: "rare", priest: "rare", golem: "rare", shaman: "rare", gorger: "rare", troll: "rare", bloodfeast: "rare",
  nightblade: "epic", battlemage: "epic", legion: "epic", buyout: "epic", jace: "epic",
  warlord: "legendary", dorn: "legendary", widow: "legendary", selene: "legendary", warboss: "legendary",
};
for (const c of CARDS) c.rarity = RARITY[c.id] || (c.legend ? "legendary" : "common");
const rarityOf = (c         )         => c.rarity || "common";
const RARITY_NAME                         = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };
const RARITY_LETTER                         = { common: "C", rare: "R", epic: "E", legendary: "L" };
const COLLECTION = CARDS.filter((c) => !c.token);

function shuffle   (a     )      { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = r[i]; r[i] = r[j]; r[j] = x; } return r; }
const other = (s      )       => (s === "a" ? "b" : "a");
function push(g   , m        ) { g.log = [m].concat(g.log).slice(0, 8); }
function draw(g   , s      , n = 1) {
  const p = g[s];
  for (let i = 0; i < n; i++) {
    let c = p.deck.shift();
    if (!c && p.recycle && p.grave && p.grave.length) { p.deck = shuffle(p.grave); p.grave = []; c = p.deck.shift(); push(g, `${p.name} reshuffled ${p.deck.length + 1} spent cards into the deck`); }
    if (!c) { p.fatigue++; p.hp -= p.fatigue; push(g, `${p.name}: no contracts left, ${p.fatigue} damage`); continue; }
    if (p.hand.length >= HAND_MAX) { push(g, `${p.name} discarded ${CARD[c].name} (hand full)`); if (p.recycle && p.grave) p.grave.push(c); } else p.hand.push(c);
  }
}
const RAGE_HEAL                         = { jace: 2 }; // Rage variant: heals instead of +1 attack
const RAGE = ["berserker", "ogre", "skirmisher", "reaver", "juggernaut"], FEAST = ["bloodtusk", "brute", "ravager"];
function heal(p        , n        ) { p.hp = Math.min(p.maxHp, p.hp + n); }
function summon(g   , s      , n        ) { const p = g[s]; for (let i = 0; i < n && p.board.length < BOARD_MAX; i++) p.board.push({ uid: g.uid++, id: "grunt", atk: 1, hp: 1, maxHp: 1, ready: false, guard: false, hidden: false }); }
function checkWin(g   ) { if (g.winner) return; if (g.b.hp <= 0) g.winner = "a"; else if (g.a.hp <= 0) g.winner = "b"; }
function startTurn(g   , s      ) {
  g.turn = s; const p = g[s];
  p.maxGold = Math.min(MAX_GOLD, p.maxGold + (p.maxGold === 0 ? 2 : 1)); p.gold = p.maxGold;
  for (const u of p.board) { u.ready = true; if (u.id === "troll") u.hp = Math.max(u.hp, u.maxHp); }
  draw(g, s);
  checkWin(g);
}
                                                                                                                                                 
function newGame(A         , B         )    {
  const mk = (c         )         => ({ name: c.name, hp: c.hp, maxHp: c.maxHp ?? c.hp, gold: 0, maxGold: c.ramp ?? 0, deck: shuffle(c.deck), hand: [], board: [], fatigue: 0, recycle: !!c.recycle, grave: [] });
  const g    = { a: mk(A), b: mk(B), turn: "a", round: 1, log: [], winner: null, uid: 1 };
  draw(g, "a", A.hand ?? 3); draw(g, "b", B.hand ?? 5); if (B.bonus !== false) g.b.hand.push("bonus");
  push(g, `The contract is signed. ${A.name} goes first.`);
  startTurn(g, "a");
  return g;
}
const clone = (g   )    => JSON.parse(JSON.stringify(g));
function hasGuard(p        ) { return p.board.some((u) => u.guard && !u.hidden); }
function canAttackTarget(g   , s      , t        )          {
  const e = g[other(s)];
  if (t.side !== other(s)) return false;
  if (t.uid === "hero") return !hasGuard(e);
  const u = e.board.find((x) => x.uid === t.uid);
  if (!u || u.hidden) return false;
  return !hasGuard(e) || u.guard;
}
function spellTargetOk(g   , s      , c         , t                    )          {
  if (!c.target || c.target === "none") return true;
  if (!t) return false;
  if (c.target === "friend") return t.side === s && t.uid !== "hero" && g[s].board.some((u) => u.uid === t.uid);
  if (t.side !== other(s)) return false;
  if (t.uid === "hero") return c.target === "enemy";
  const u = g[t.side].board.find((x) => x.uid === t.uid);
  if (!u || u.hidden) return false;
  if (c.id === "buyout") return u.atk <= 3;
  return true;
}
function dmgTarget(g   , t        , n        ) {
  if (t.uid === "hero") { g[t.side].hp -= n; return; }
  const u = g[t.side].board.find((x) => x.uid === t.uid); if (u) u.hp -= n;
}
function cleanup(g   ) {
  for (let pass = 0; pass < 4; pass++) {
    let any = false;
    for (const s of ["a", "b"]          ) {
      const dead = g[s].board.filter((u) => u.hp <= 0);
      if (!dead.length) continue;
      any = true;
      g[s].board = g[s].board.filter((u) => u.hp > 0);
      for (const d of dead) {
        push(g, `${CARD[d.id].name} fell`);
        const gv = g[s].grave; if (g[s].recycle && gv && !CARD[d.id].token) gv.push(d.id);
        if (d.id === "moneylender" || d.id === "looter") draw(g, s);
        if (d.id === "squire") heal(g[s], 3);
        if (d.id === "kobold") g[other(s)].hp -= 1;
        if (d.id === "bomber") { const w = g[other(s)].board.filter((u) => !u.hidden && u.hp > 0).sort((x, y) => x.hp - y.hp)[0]; if (w) w.hp -= 2; }
        for (const u of g[s].board) if (FEAST.includes(u.id)) { u.atk++; u.hp++; u.maxHp++; }
        if (d.id === "sapper") { g[other(s)].hp -= 2; push(g, `Sapper's charge hit ${g[other(s)].name} for 2`); }
      }
    }
    if (!any) break;
  }
  checkWin(g);
}
function canPlay(g   , s      , idx        )          {
  const p = g[s]; const c = CARD[p.hand[idx]]; if (!c || c.cost > p.gold || c.id === "debt") return false;
  if (c.kind === "unit" && p.board.length >= BOARD_MAX) return false;
  if (c.target === "friend" && p.board.length === 0) return false;
  if (c.id === "warcall" && p.board.length >= BOARD_MAX) return false;
  if (c.target === "enemyUnit") {
    const e = g[other(s)];
    if (!e.board.some((u) => spellTargetOk(g, s, c, { side: other(s), uid: u.uid }))) return false;
    if (c.id === "buyout" && p.board.length >= BOARD_MAX) return false;
  }
  return true;
}
function apply(g0   , a        )    {
  if (g0.winner) return g0;
  const g = clone(g0);
  const s = g.turn, p = g[s], e = g[other(s)];
  if (a.t === "end") {
    push(g, `${p.name} ended the turn`);
    if (s === "b") g.round++;
    startTurn(g, other(s)); return g;
  }
  if (a.t === "play") {
    if (!canPlay(g, s, a.idx)) return g0;
    const c = CARD[p.hand[a.idx]];
    const tg = a.target;
    if (!spellTargetOk(g, s, c, tg)) return g0;
    p.hand.splice(a.idx, 1); p.gold -= c.cost;
    if (p.recycle && p.grave && c.kind === "spell" && !c.token) p.grave.push(c.id);
    push(g, `${p.name} ${c.kind === "unit" ? "hired" : "played"} ${c.name}`);
    if (c.kind === "unit") {
      const nu       = { uid: g.uid++, id: c.id, atk: c.atk || 0, hp: c.hp || 1, maxHp: c.hp || 1, ready: !!c.swift, guard: !!c.guard, hidden: !!c.hidden };
      const others = p.board.slice();
      p.board.push(nu);
      if (c.id === "medic") heal(p, 3);
      if (c.id === "quartermaster" || c.id === "spymaster") draw(g, s);
      if (c.id === "selene") draw(g, s, 2);
      if (c.id === "battlemage") e.hp -= 3;
      if (c.id === "legion") for (const u of e.board) u.hp -= 1;
      if (c.id === "drummer") for (const u of others) u.atk += 1;
      if (c.id === "warlord") for (const u of others) u.ready = true;
      if (c.id === "sergeant") for (const u of others) { u.hp += 1; u.maxHp += 1; }
      if (c.id === "dorn") for (const u of others) { u.guard = true; u.hp += 2; u.maxHp += 2; }
      if (c.id === "priest") { heal(p, 4); for (const u of p.board) u.hp = Math.max(u.hp, u.maxHp); }
      if (c.id === "crossbow") { const w = e.board.filter((u) => !u.hidden).sort((x, y) => x.hp - y.hp)[0]; if (w) w.hp -= 1; }
      if (c.id === "rabble" || c.id === "worg") summon(g, s, 1);
      if (c.id === "shaman") for (const u of others) { u.atk++; u.hp++; u.maxHp++; }
      if (c.id === "gorger") { const v = others.slice().sort((x, y) => x.atk + x.hp - y.atk - y.hp)[0]; if (v) { nu.atk += v.atk; nu.hp += Math.max(0, v.hp); nu.maxHp = nu.hp; v.hp = 0; } }
      if (c.id === "headtaker") { const w = e.board.filter((u) => !u.hidden).sort((x, y) => x.hp - y.hp)[0]; if (w) w.hp -= 2; }
      if (c.id === "ballista") { const w = e.board.filter((u) => !u.hidden).sort((x, y) => y.atk - x.atk || y.hp - x.hp)[0]; if (w) w.hp -= 3; }
      if (c.id === "clerk") p.gold += 1;
      if (c.id === "warchief") { summon(g, s, 1); for (const u of p.board) if (u.id === "grunt") { u.atk++; u.hp++; u.maxHp++; } }
      if (c.id === "warboss") { summon(g, s, BOARD_MAX); for (const u of p.board) if (u.id === "grunt") u.atk++; }
    } else {
      if (c.id === "warcall") summon(g, s, 2);
      if (c.id === "bloodfeast" && tg) { const u = p.board.find((x) => x.uid === tg.uid); if (u) u.hp = 0; draw(g, s, 2); }
      if (c.id === "ambush" && tg) dmgTarget(g, tg, 2);
      if (c.id === "bounty" && tg) dmgTarget(g, tg, 4);
      if (c.id === "knife" && tg) dmgTarget(g, tg, 3);
      if (c.id === "dart" && tg) { dmgTarget(g, tg, 1); draw(g, s); }
      if (c.id === "marked" && tg) { const u = e.board.find((x) => x.uid === tg.uid); if (u) u.hp = 0; }
      if (c.id === "volley") for (const u of e.board) u.hp -= 2;
      if (c.id === "charge" && tg) { const u = p.board.find((x) => x.uid === tg.uid); if (u) { u.atk += 2; u.ready = true; } }
      if (c.id === "holdline" && tg) { const u = p.board.find((x) => x.uid === tg.uid); if (u) { u.guard = true; u.hp += 3; u.maxHp += 3; } }
      if (c.id === "bloodmoney" && tg) { dmgTarget(g, tg, 3); p.hp -= 2; }
      if (c.id === "healer") { heal(p, 5); draw(g, s); }
      if (c.id === "contracts") draw(g, s, 2);
      if (c.id === "bonus") p.gold += 1;
      if (c.id === "battlepay") for (const u of p.board) { u.atk++; u.hp++; u.maxHp++; u.ready = true; }
      if (c.id === "shieldwall") for (const u of p.board) { u.hp += 2; u.maxHp += 2; }
      if (c.id === "firebomb") for (const u of p.board.concat(e.board)) u.hp -= 2;
      if (c.id === "blade" && tg) { const u = p.board.find((x) => x.uid === tg.uid); if (u) { u.atk += 2; u.hp += 1; u.maxHp += 1; } }
      if (c.id === "buyout" && tg) { const i = e.board.findIndex((x) => x.uid === tg.uid); if (i >= 0) { const u = e.board.splice(i, 1)[0]; u.ready = false; u.hidden = false; p.board.push(u); } }
    }
    cleanup(g); return g;
  }
  if (a.t === "attack") {
    const u = p.board.find((x) => x.uid === a.uid);
    if (!u || !u.ready || !canAttackTarget(g, s, a.target)) return g0;
    u.ready = false; u.hidden = false;
    const uc = CARD[u.id];
    if (a.target.uid === "hero") {
      e.hp -= u.atk; if (uc.drain) heal(p, u.atk);
      push(g, `${uc.name} struck ${e.name} for ${u.atk}`);
    } else {
      const d = e.board.find((x) => x.uid === a.target.uid);
      if (!d) return g0;
      const dc = CARD[d.id];
      const toD = u.atk, toU = d.atk;
      d.hp -= toD; u.hp -= toU;
      if (uc.deadly && toD > 0) d.hp = Math.min(d.hp, 0);
      if (dc.deadly && toU > 0) u.hp = Math.min(u.hp, 0);
      if (uc.drain) heal(p, toD);
      if (dc.drain) heal(e, toU);
      if (RAGE.includes(u.id) && u.hp > 0) u.atk++;
      if (RAGE.includes(d.id) && d.hp > 0) d.atk++;
      for (const x of [u, d]) if (RAGE_HEAL[x.id] && x.hp > 0) x.hp = Math.min(x.maxHp, x.hp + RAGE_HEAL[x.id]);
      push(g, `${uc.name} fought ${dc.name}`);
    }
    cleanup(g); return g;
  }
  return g0;
}
const value = (u      ) => u.atk + u.hp + (u.guard ? 1 : 0) + (RAGE_HEAL[u.id] ? 2 : 0) + (CARD[u.id].deadly ? 3 : 0) + (CARD[u.id].legend ? 2 : 0);
function aiAction(g   )         {
  const s = g.turn, o = other(s), p = g[s], e = g[o];
  const ready = p.board.filter((u) => u.ready);
  const vis = e.board.filter((u) => !u.hidden);
  const order = p.hand.map((id, idx) => ({ idx, c: CARD[id] })).sort((x, y) => y.c.cost - x.c.cost);
  for (const { idx, c } of order) {
    if (!canPlay(g, s, idx)) continue;
    if (c.kind === "unit") {
      if (c.id === "drummer" && p.board.length === 0 && p.hand.length > 2 && p.gold < 4) continue;
      if (c.id === "gorger" && p.board.length === 0) continue;
      if (c.id === "shaman" && p.board.length < 2 && p.hand.length > 2) continue;
      return { t: "play", idx };
    }
    if (c.id === "healer" && (p.hp <= p.maxHp - 3 || p.hand.length <= 3)) return { t: "play", idx };
    if (c.id === "contracts" && p.hand.length <= 4) return { t: "play", idx };
    if (c.id === "bonus" && p.hand.some((h, j) => j !== idx && CARD[h].cost === p.gold + 1)) return { t: "play", idx };
    if (c.id === "battlepay" && p.board.length >= 2) return { t: "play", idx };
    if (c.id === "shieldwall" && p.board.length >= 2) return { t: "play", idx };
    if (c.id === "warcall" && p.board.length <= 4) return { t: "play", idx };
    if (c.id === "bloodfeast" && p.hand.length <= 5) { const v = p.board.filter((u) => u.id === "grunt" || u.id === "kobold" || u.id === "bomber" || u.hp <= 1).sort((x, y) => value(x) - value(y))[0]; if (v) return { t: "play", idx, target: { side: s, uid: v.uid } }; }
    if (c.id === "firebomb") { const net = e.board.filter((u) => u.hp <= 2).reduce((x, u) => x + value(u), 0) - p.board.filter((u) => u.hp <= 2).reduce((x, u) => x + value(u), 0); if (net >= 5) return { t: "play", idx }; }
    if (c.id === "charge") { const t = p.board.filter((u) => !u.ready).sort((x, y) => y.atk - x.atk)[0]; if (t) return { t: "play", idx, target: { side: s, uid: t.uid } }; }
    if (c.id === "holdline" && e.board.length) { const t = p.board.slice().sort((x, y) => (x.guard ? 1 : 0) - (y.guard ? 1 : 0) || value(y) - value(x))[0]; return { t: "play", idx, target: { side: s, uid: t.uid } }; }
    if (c.id === "volley") { const net = e.board.filter((u) => u.hp <= 2).reduce((x, u) => x + value(u), 0); if (net >= 4 || e.board.length >= 3) return { t: "play", idx }; }
    if (c.id === "marked") { const t = vis.slice().sort((x, y) => value(y) - value(x))[0]; if (t && value(t) >= 6) return { t: "play", idx, target: { side: o, uid: t.uid } }; }
    if (c.id === "dart") { const k = vis.filter((u) => u.hp <= 1).sort((x, y) => value(y) - value(x))[0] || (p.hand.length <= 3 ? vis.slice().sort((x, y) => x.hp - y.hp)[0] : undefined); if (k) return { t: "play", idx, target: { side: o, uid: k.uid } }; }
    if (c.id === "blade") { const best = p.board.slice().sort((x, y) => value(y) - value(x))[0]; return { t: "play", idx, target: { side: s, uid: best.uid } }; }
    if (c.id === "buyout") { const t = vis.filter((u) => u.atk <= 3).sort((x, y) => value(y) - value(x))[0]; if (t && value(t) >= 5) return { t: "play", idx, target: { side: o, uid: t.uid } }; }
    if (c.id === "knife" || c.id === "bloodmoney") {
      if (c.id === "bloodmoney" && p.hp <= 4) continue;
      const kill = vis.filter((u) => u.hp <= 3).sort((x, y) => value(y) - value(x))[0];
      if (kill && value(kill) >= 4) return { t: "play", idx, target: { side: o, uid: kill.uid } };
    }
    if (c.id === "ambush" || c.id === "bounty") {
      const n = c.id === "ambush" ? 2 : 4;
      if (e.hp <= n) return { t: "play", idx, target: { side: o, uid: "hero" } };
      const kill = vis.filter((u) => u.hp <= n).sort((x, y) => value(y) - value(x))[0];
      if (kill && value(kill) >= n + 1) return { t: "play", idx, target: { side: o, uid: kill.uid } };
      if (e.hp <= 6) return { t: "play", idx, target: { side: o, uid: "hero" } };
    }
  }
  if (ready.length) {
    const facePower = ready.reduce((x, u) => x + u.atk, 0);
    const guards = vis.filter((u) => u.guard);
    const u = ready.slice().sort((x, y) => (CARD[y.id].deadly ? 1 : 0) - (CARD[x.id].deadly ? 1 : 0))[0];
    if (guards.length) {
      const g1 = CARD[u.id].deadly ? guards.slice().sort((x, y) => value(y) - value(x))[0] : guards.slice().sort((x, y) => x.hp - y.hp)[0];
      return { t: "attack", uid: u.uid, target: { side: o, uid: g1.uid } };
    }
    if (facePower >= e.hp) return { t: "attack", uid: u.uid, target: { side: o, uid: "hero" } };
    const dl = !!CARD[u.id].deadly;
    const trades = vis.filter((d) => (dl || d.hp <= u.atk) && (d.atk < u.hp || value(d) > value(u) + 1) && !(CARD[d.id].deadly && u.atk < d.hp && value(u) > 4)).sort((x, y) => value(y) - value(x));
    if (trades.length) return { t: "attack", uid: u.uid, target: { side: o, uid: trades[0].uid } };
    return { t: "attack", uid: u.uid, target: { side: o, uid: "hero" } };
  }
  return { t: "end" };
}

// ================= DECKS =================
                                                                                
const ex = (spec                        )           => { const r           = []; for (const k of Object.keys(spec)) for (let i = 0; i < spec[k]; i++) r.push(k); return r; };
const PREMADE         = [
  { id: "p-crimson", name: "Crimson Rush", premade: true, cards: ex({ raider: 2, duelist: 2, drummer: 2, assassin: 2, axe: 2, berserker: 2, bloodmoney: 1, charge: 1, poisoner: 2, captain: 1, headtaker: 1, warlord: 1, nightblade: 1 }) },
  { id: "p-iron", name: "Iron Wall", premade: true, cards: ex({ squire: 2, gatewarden: 2, pikeman: 2, medic: 2, crossbow: 2, sergeant: 2, veteran: 1, shieldwall: 1, ballista: 1, bastion: 1, priest: 1, sapper: 2, dorn: 1 }) },
  { id: "p-shadow", name: "Shadow Knives", premade: true, cards: ex({ cutpurse: 2, infiltrator: 2, ambush: 1, dart: 1, knife: 2, poisoner: 2, assassin: 2, spymaster: 1, bounty: 1, nightblade: 2, widow: 1, veteran: 1, bastion: 1, marked: 1 }) },
  { id: "p-gilded", name: "Gilded Ledger", premade: true, cards: ex({ moneylender: 2, recruit: 2, medic: 2, blade: 2, quartermaster: 2, golem: 1, battlemage: 2, priest: 1, selene: 1, pikeman: 1, taxman: 1, veteran: 1, paladin: 1, sergeant: 1 }) },
  { id: "p-horde", name: "Grimfang Horde", premade: true, cards: ex({ rabble: 2, kobold: 2, bomber: 2, worg: 2, shaman: 2, bloodtusk: 1, brute: 1, gorger: 1, warcall: 2, troll: 2, warboss: 1, ogre: 1, warchief: 1 }) },
];
const PREMADE_BLURB                         = {
  "p-crimson": "Crimson Blades with Shadow poison. Hit early, hit hard.",
  "p-iron": "Iron Company shields and Gilded medics. Outlast, then crush.",
  "p-shadow": "Shadow Guild hidden blades behind a few Iron shields.",
  "p-gilded": "Gilded Ledger card draw and mages, backed by Iron.",
  "p-horde": "Monster warband: flood the field with goblins, then bring the trolls and ogres.",
};
function copyLimit(id        )         { return CARD[id] && CARD[id].legend ? 1 : 2; }
function deckProblems(cards          , size = DECK_SIZE)           {
  const out           = [];
  if (cards.length !== size) out.push(`${cards.length}/${size} cards`);
  const n                         = {};
  for (const c of cards) { if (!CARD[c] || CARD[c].token) { out.push(`Unknown card ${c}`); continue; } n[c] = (n[c] || 0) + 1; }
  for (const k of Object.keys(n)) if (n[k] > copyLimit(k)) out.push(`Too many ${CARD[k].name} (max ${copyLimit(k)})`);
  return out;
}
const countOf = (cards          , id        ) => cards.filter((c) => c === id).length;


export { MAX_GOLD, CARDS, CARD, RARITY, rarityOf, RARITY_NAME, RARITY_LETTER, COLLECTION, shuffle, other, push, draw, RAGE_HEAL, RAGE, heal, summon, checkWin, startTurn, newGame, clone, hasGuard, canAttackTarget, spellTargetOk, dmgTarget, cleanup, canPlay, apply, value, aiAction, ex, PREMADE, PREMADE_BLURB, copyLimit, deckProblems, countOf };
