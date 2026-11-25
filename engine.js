// ================= ENGINE =================
                      
                                                                        
                                                                
                                                              
                                                       
                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                
                                                                                                                                                                                                                                  
                                                                                                                                                                                                                                                                                                                                                                     
                                                   
                                                                                                                                                                                                                                                                          

const MAX_GOLD = 8, HAND_MAX = 8, BOARD_MAX = 6, DECK_SIZE = 20;
const CARDS            = [
  { id: "brawler", name: "Tavern Brawler", cost: 1, kind: "unit", atk: 2, hp: 2, fac: "crimson", flavor: "Paid in ale, fights for free." },
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
  { id: "attorin", name: "Attorin, Line Breaker", cost: 5, kind: "unit", atk: 9, hp: 1, fac: "horde", text: "Last Pay: summon 3 Goblin Grunts.", flavor: "He breaks the line. The goblins fill the hole." },
  { id: "zack", name: "Zack, Hollow-Hearted", cost: 5, kind: "unit", atk: 4, hp: 3, fac: "shadow", swift: true, text: "Hire: give your strongest other sellsword Deadly.", flavor: "Nothing behind the eyes. Everything on the blade." },
  { id: "jordan", name: "Jordan, Fire-Hearted", cost: 4, kind: "unit", atk: 3, hp: 4, fac: "crimson", first: true, flavor: "Mud in the eyes, steel in the ribs. Honor is extra." },
  { id: "graci", name: "Graci, Kind-Hearted", cost: 4, kind: "unit", atk: 2, hp: 4, fac: "gilded", text: "Hire: heal your captain and all your sellswords 2, then draw a card.", flavor: "Bandages, blessings, and a very stern look." },
  { id: "bogleech", name: "Bog Leech", cost: 1, kind: "unit", atk: 1, hp: 2, fac: "beast", trib: { k: "gold", n: 1 }, text: "Fed: heal your captain 1 and gain +1 attack.", flavor: "It takes a little. It gives a little back." },
  { id: "rotmaw", name: "Rotmaw, the Hungry Wyrm", cost: 5, kind: "unit", atk: 5, hp: 5, fac: "beast", trib: { k: "eat", n: 1 }, text: "Each turn it eats a random ally and gains its attack and health. Fed: 2 damage to a random enemy.", flavor: "Rot never fills it. Nothing ever has." },
  { id: "ambusher", name: "Alley Ambusher", cost: 3, kind: "unit", atk: 3, hp: 3, fac: "shadow", hidden: true, isNew: true, text: "When it leaves Hidden by attacking a sellsword, Stun that sellsword.", flavor: "You never see the first blow. You feel it for a day." },
  { id: "bodyguard", name: "Hired Bodyguard", cost: 1, kind: "unit", atk: 1, hp: 2, fac: "gilded", guard: true, isNew: true, text: "You may hire it for 4 gold instead: it enters as 2/5.", flavor: "Paid by the hour. Paid more by the scar." },
  { id: "sentry", name: "Fortress Sentry", cost: 4, kind: "unit", atk: 2, hp: 6, fac: "iron", guard: true, isNew: true, text: "Can't be Stunned.", flavor: "The wall moves before he does." },
  { id: "bloodblade", name: "Blood Blade", cost: 1, kind: "spell", fac: "crimson", target: "unit", isNew: true, text: "Deal 2 damage to any sellsword. If it survives, it gains +2 attack.", flavor: "It drinks first. Then it shares." },
  { id: "hollowqueen", name: "Hollow Queen", cost: 6, kind: "unit", atk: 0, hp: 1, fac: "beast", trib: { k: "gold", n: 2 }, legend: true, isNew: true, text: "Hire: devour the enemy sellsword with the most attack + health (even Hidden). Gain its attack and health.", flavor: "She is never full. She is only ever hollow." },
  { id: "slime", name: "Slime", cost: 0, kind: "unit", atk: 1, hp: 1, fac: "beast", flavor: "It was a puddle. Then it was hungry." },
  { id: "tunnelcent", name: "Tunnel Centipede", cost: 2, kind: "unit", atk: 3, hp: 2, fac: "beast", trib: { k: "gold", n: 1 }, text: "Fed: +1 health.", flavor: "Every trench is its burrow." },
  { id: "carcass", name: "Carcass Beetle", cost: 4, kind: "unit", atk: 2, hp: 5, fac: "beast", guard: true, trib: { k: "gold", n: 2 }, text: "Fed: +1/+1.", flavor: "Wears last week's casualties as armor." },
  { id: "boar", name: "Bristleback Boar", cost: 3, kind: "unit", atk: 5, hp: 5, fac: "beast", trib: { k: "gold", n: 2 }, flavor: "Feed it, or stand behind something solid." },
  { id: "scavworg", name: "Scavenger Worg", cost: 2, kind: "unit", atk: 2, hp: 3, fac: "beast", trib: { k: "discard", n: 1 }, text: "Fed: draw a card.", flavor: "Brings back what it doesn't eat." },
  { id: "bear", name: "Stoneskin Bear", cost: 4, kind: "unit", atk: 5, hp: 6, fac: "beast", trib: { k: "gold", n: 3 }, text: "Fed: +1/+2.", flavor: "Arrows stick. It does not notice." },
  { id: "mossmen", name: "Moss Men", cost: 1, kind: "unit", atk: 1, hp: 1, fac: "beast", hidden: true, trib: { k: "gold", n: 1 }, text: "Fed: +1/+1.", flavor: "The hill was watching the whole time." },
  { id: "giantcent", name: "Giant Centipede", cost: 4, kind: "unit", atk: 5, hp: 5, fac: "beast", hidden: true, trib: { k: "hp", n: 2 }, flavor: "It only takes a little blood. From you." },
  { id: "giantslime", name: "Giant Slime", cost: 3, kind: "unit", atk: 2, hp: 6, fac: "beast", text: "At the end of your turn, heal 1.", flavor: "Cut it in half. Now there's more of it." },
  { id: "madcurse", name: "Maddening Curse", cost: 3, kind: "spell", fac: "beast", target: "enemyUnit", text: "Give an enemy sellsword Tribute 3 gold and Stun it.", flavor: "Feed the whisper, or it feeds on you." },
  { id: "gorge", name: "Gorge", cost: 2, kind: "spell", fac: "beast", target: "friend", text: "Your chosen sellsword devours your weakest other sellsword and gains its attack and health.", flavor: "Nothing in the wild goes to waste." },
  { id: "behemoth", name: "Ironhide Behemoth", cost: 6, kind: "unit", atk: 5, hp: 6, fac: "beast", trib: { k: "gold", n: 4 }, text: "Fed: gain Guard and +2/+2.", flavor: "Every meal adds another plate of hide." },
  { id: "thousandleg", name: "1000-Legged Giant Centipede", cost: 8, kind: "unit", atk: 10, hp: 10, fac: "beast", guard: true, trib: { k: "gold", n: 4 }, flavor: "Count the legs and you are already dead." },
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
  taxman: "common", looter: "common", brute: "common", ambusher: "common", bodyguard: "common", sentry: "common", bloodblade: "common",
  headtaker: "rare", reaver: "rare", ballista: "rare", juggernaut: "rare", stalker: "rare", marked: "rare", paladin: "rare",
  volley: "rare", warchief: "rare", ravager: "rare",
  captain: "rare", bastion: "rare", ogre: "rare", bounty: "rare", battlepay: "rare", firebomb: "rare", bloodmoney: "rare", sapper: "rare",
  poisoner: "rare", spymaster: "rare", priest: "rare", golem: "rare", shaman: "rare", gorger: "rare", troll: "rare", bloodfeast: "rare",
  nightblade: "epic", battlemage: "epic", legion: "epic", buyout: "epic", jace: "epic", attorin: "epic", zack: "epic", jordan: "epic", behemoth: "epic", thousandleg: "epic", graci: "epic", rotmaw: "epic",
  slime: "common", tunnelcent: "common", carcass: "common", boar: "common", scavworg: "common", bear: "common", mossmen: "common", giantcent: "common",
  giantslime: "rare", madcurse: "rare", gorge: "rare",
  warlord: "legendary", dorn: "legendary", widow: "legendary", selene: "legendary", warboss: "legendary", hollowqueen: "legendary",
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
    if (!c && p.nofat) continue;
    if (!c) { p.fatigue++; p.hp -= p.fatigue; push(g, `${p.name}: no contracts left, ${p.fatigue} damage`); continue; }
    if (p.hand.length >= HAND_MAX) { push(g, `${p.name} discarded ${CARD[c].name} (hand full)`); if (p.recycle && p.grave) p.grave.push(c); } else p.hand.push(c);
  }
}
const RAGE_HEAL                         = { jace: 2 }; // Rage variant: heals instead of +1 attack
const RAGE = ["berserker", "ogre", "skirmisher", "reaver", "juggernaut"], FEAST = ["bloodtusk", "brute", "ravager"];
const isDeadly = (u      ) => !!u.deadly || !!CARD[u.id].deadly;
// ---------- Beasts: Tribute ----------
const tribText = (t      ) => t.k === "eat" ? "Tribute: eats an ally" : t.k === "gold" ? `Tribute ${t.n} gold` : t.k === "discard" ? `Tribute: discard ${t.n}` : `Tribute: lose ${t.n} health`;
const tribPay = (t      ) => t.k === "gold" ? `Pay ${t.n} gold` : t.k === "discard" ? `Discard ${t.n} card${t.n === 1 ? "" : "s"}` : `Lose ${t.n} health`;
function canTribute(p        , t      )          { return t.k === "eat" ? p.board.filter((x) => x.hp > 0).length >= 2 : t.k === "gold" ? p.gold >= t.n : t.k === "discard" ? p.hand.length >= t.n : p.hp > t.n; }
const FED_VALUE                         = { tunnelcent: 1, carcass: 2, scavworg: 2, bear: 3, mossmen: 2, behemoth: 5, bogleech: 2 };
// Unpaid: the beast turns on its own side. It fights your lowest-health other sellsword, or hits your captain if it is alone.
function rampTarget(p        , u      )                   { return p.board.filter((x) => x.uid !== u.uid && x.hp > 0).sort((x, y) => x.hp - y.hp || value(x) - value(y))[0]; }
function payTribute(g   , s      , uid        , pay         ) {
  const p = g[s]; p.due = (p.due || []).filter((x) => x !== uid);
  const u = p.board.find((x) => x.uid === uid); if (!u || !u.trib || u.hp <= 0) return;
  const t = u.trib, nm = CARD[u.id].name;
  if (pay && canTribute(p, t)) {
    if (t.k === "eat") {
      // Rotmaw's Tribute: it eats a random other friendly sellsword (that unit dies; Last Pay still triggers) and gains its attack and current health.
      const os = p.board.filter((x) => x.uid !== u.uid && x.hp > 0); const v = os[Math.floor(Math.random() * os.length)];
      const ga = v.atk, gh = v.hp; u.atk += ga; u.hp += gh; u.maxHp += gh; v.hp = 0;
      push(g, `${nm} ate ${CARD[v.id].name} (+${ga}/+${gh})`);
    } else if (t.k === "gold") p.gold -= t.n;
    else if (t.k === "hp") p.hp -= t.n;
    else for (let i = 0; i < t.n; i++) { let k = 0; p.hand.forEach((id, j) => { if (CARD[id].cost < CARD[p.hand[k]].cost) k = j; }); const d = p.hand.splice(k, 1)[0]; if (p.recycle && p.grave) p.grave.push(d); push(g, `${p.name} discarded ${CARD[d].name} to feed ${nm}`); }
    if (t.k !== "eat") push(g, `${p.name} paid ${nm}'s Tribute (${t.k === "gold" ? `${t.n} gold` : t.k === "hp" ? `${t.n} health` : `${t.n} card`})`);
    if (u.id === "tunnelcent") { u.hp++; u.maxHp++; }
    if (u.id === "carcass" || u.id === "mossmen") { u.atk++; u.hp++; u.maxHp++; }
    if (u.id === "bear") { u.atk++; u.hp += 2; u.maxHp += 2; }
    if (u.id === "behemoth") { u.guard = true; u.atk += 2; u.hp += 2; u.maxHp += 2; }
    if (u.id === "scavworg") draw(g, s);
    if (u.id === "bogleech") { heal(p, 1); u.atk++; }
    if (u.id === "rotmaw") { const es = g[other(s)].board.filter((x) => x.hp > 0 && !x.hidden); const t = es[Math.floor(Math.random() * es.length)]; if (t) { t.hp -= 2; push(g, `${nm} spat rot at ${CARD[t.id].name} for 2`); } }
    return;
  }
  u.ready = false; u.hidden = false;
  const v = rampTarget(p, u);
  if (v) {
    const toV = u.atk, toU = v.atk;
    v.hp -= toV; u.hp -= toU;
    if (isDeadly(u) && toV > 0) v.hp = Math.min(v.hp, 0);
    if (isDeadly(v) && toU > 0) u.hp = Math.min(u.hp, 0);
    push(g, `Unfed, ${nm} turned on ${CARD[v.id].name}`);
  } else { p.hp -= u.atk; push(g, `Unfed, ${nm} mauled ${p.name} for ${u.atk}`); }
}
function heal(p        , n        ) { p.hp = Math.min(p.maxHp, p.hp + n); }
function summon(g   , s      , n        ) { const p = g[s]; for (let i = 0; i < n && p.board.length < BOARD_MAX; i++) p.board.push({ uid: g.uid++, id: "grunt", atk: 1, hp: 1, maxHp: 1, ready: false, guard: false, hidden: false }); }
function checkWin(g   ) {
  if (g.winner) return; if (g.b.hp <= 0) g.winner = "a"; else if (g.a.hp <= 0) g.winner = "b";
  // Siege: the wave breaks when it has nothing left to send, and withdraws at dawn after SIEGE_ROUNDS rounds.
  if (!g.winner && g.siege) { const b = g.b; if (!b.board.some((u) => u.hp > 0) && !b.deck.length && !b.hand.some((id) => CARD[id].kind === "unit")) g.winner = "a"; else if (g.round > SIEGE_ROUNDS) g.winner = "a"; }
}
function startTurn(g   , s      ) {
  g.turn = s; const p = g[s];
  p.maxGold = Math.min(MAX_GOLD, p.maxGold + (p.maxGold === 0 ? 2 : 1)); p.gold = p.maxGold;
  for (const u of p.board) { u.ready = !u.stun; if (u.id === "troll") u.hp = Math.max(u.hp, u.maxHp); }
  draw(g, s);
  p.due = p.board.filter((u) => !!u.trib && u.trib.k !== "eat").map((u) => u.uid);
  // Automatic Tribute (Rotmaw): resolved right away, no choice.
  for (const u of p.board.slice()) if (u.trib && u.trib.k === "eat" && u.hp > 0) payTribute(g, s, u.uid, true);
  cleanup(g);
  checkWin(g);
}
const OPEN_HAND = 4;
// Mulligan: put the chosen opening cards back, shuffle, draw that many. Once per captain; play starts when both are done.
function mulligan(g0   , side      , idx          )    {
  if (g0.phase !== "mull" || !g0.mull || g0.mull[side] >= 0) return g0;
  const p0 = g0[side];
  if (!Array.isArray(idx) || idx.length > p0.hand.length || new Set(idx).size !== idx.length || !idx.every((i) => Number.isInteger(i) && i >= 0 && i < p0.hand.length)) return g0;
  const g = clone(g0); const p = g[side];
  const back = idx.map((i) => p.hand[i]);
  p.hand = p.hand.filter((_, i) => !idx.includes(i));
  p.deck = shuffle(p.deck.concat(back));
  draw(g, side, back.length);
  g.mull [side] = back.length;
  push(g, back.length ? `${p.name} swapped ${back.length} card${back.length === 1 ? "" : "s"}` : `${p.name} kept their hand`);
  if (g.mull .a >= 0 && g.mull .b >= 0) {
    g.phase = "play";
    const fs       = g.first || "a", ss = other(fs);
    g[ss].hand.push("bonus");
    push(g, `${g[fs].name} goes first. ${g[ss].name} gets a Signing Bonus.`);
    startTurn(g, fs);
  }
  return g;
}
// The roll winner picks: go first (first = true) or second.
function chooseFirst(g0   , side      , first         )    {
  if (g0.phase !== "roll" || !g0.roll || g0.roll.winner !== side) return g0;
  const g = clone(g0);
  g.first = first ? side : other(side); g.phase = "mull";
  push(g, `${g[side].name} chooses to go ${first ? "first" : "second"}. Each captain may swap cards from their opening hand.`);
  return g;
}
// Simple mulligan rule for the computer: send back anything costing 5 or more.
const aiMulligan = (g   , side      )           => g[side].hand.map((id, i) => (CARD[id].cost >= 5 ? i : -1)).filter((i) => i >= 0);
                                                                                                                                                                  
function newGame(A         , B         )    {
  const mk = (c         )         => ({ name: c.name, hp: c.hp, maxHp: c.maxHp ?? c.hp, gold: 0, maxGold: c.ramp ?? 0, deck: shuffle(c.deck), hand: [], board: [], fatigue: 0, recycle: !!c.recycle, grave: [], ...(c.nofat ? { nofat: true } : {}) });
  // Turn order: each side rolls a die (ties are rerolled); the higher roll chooses to go first or second.
  const d6 = () => 1 + Math.floor(Math.random() * 6);
  let ra = d6(), rb = d6(), ties = 0; while (ra === rb && ties < 50) { ties++; ra = d6(); rb = d6(); }
  const roll = { a: ra, b: rb, ties, winner: (ra > rb ? "a" : "b")        , id: 1 + Math.floor(Math.random() * 1e9) };
  const g    = { a: mk(A), b: mk(B), turn: "a", round: 1, log: [], winner: null, uid: 1, phase: "roll", roll, mull: { a: -1, b: -1 }, plays: [] };
  // Both captains open with 4 cards and may mulligan once (after the roll); the second player gets the Signing Bonus when play starts.
  draw(g, "a", OPEN_HAND); draw(g, "b", OPEN_HAND);
  push(g, `The contract is signed. ${A.name} rolled ${ra}, ${B.name} rolled ${rb}${ties ? ` (after ${ties} tie${ties === 1 ? "" : "s"})` : ""}. ${g[roll.winner].name} chooses who goes first.`);
  return g;
}
const clone = (g   )    => JSON.parse(JSON.stringify(g));
function stunUnit(g   , u      )          { if (u.id === "sentry") { push(g, `${CARD[u.id].name} can't be Stunned`); return false; } u.stun = 1; u.ready = false; return true; }
function hasGuard(p        ) { return p.board.some((u) => u.guard && !u.hidden && !u.stun); }
function canAttackTarget(g   , s      , t        )          {
  const e = g[other(s)];
  if (t.side !== other(s)) return false;
  if (t.uid === "hero") return !hasGuard(e);
  const u = e.board.find((x) => x.uid === t.uid);
  if (!u || u.hidden) return false;
  return !hasGuard(e) || (u.guard && !u.stun);
}
function spellTargetOk(g   , s      , c         , t                    )          {
  if (!c.target || c.target === "none") return true;
  if (!t) return false;
  if (c.target === "friend") return t.side === s && t.uid !== "hero" && g[s].board.some((u) => u.uid === t.uid);
  if (c.target === "unit") { if (t.uid === "hero") return false; const u = g[t.side].board.find((x) => x.uid === t.uid); return !!u && u.hp > 0 && (t.side === s || !u.hidden); }
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
        if (d.id === "attorin") { summon(g, s, 3); push(g, `Attorin's Grimfang followers charge in`); }
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
  if (c.target === "unit" && !p.board.some((u) => u.hp > 0) && !g[other(s)].board.some((u) => u.hp > 0 && !u.hidden)) return false;
  if (c.id === "gorge" && p.board.length < 2) return false;
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
  if (g0.phase === "roll") return a.t === "first" ? chooseFirst(g0, a.side, !!a.first) : g0;
  if (a.t === "first") return g0;
  if (g0.phase === "mull") return a.t === "mull" ? mulligan(g0, a.side, a.idx) : g0;
  if (a.t === "mull") return g0;
  if (a.t === "trib") {
    const due0 = g0[g0.turn].due || [];
    if (!due0.includes(a.uid)) return g0;
    const g = clone(g0); payTribute(g, g.turn, a.uid, !!a.pay); cleanup(g); return g;
  }
  let g = clone(g0);
  // Any other move first settles the Tribute still owed this turn with the sensible default.
  if ((g[g.turn].due || []).length) { let k = 0; while ((g[g.turn].due || []).length && k++ < 10) { const uid = g[g.turn].due [0]; const u = g[g.turn].board.find((x) => x.uid === uid); payTribute(g, g.turn, uid, !!u && tribWise(g, g.turn, u)); cleanup(g); } if (g.winner) return g; }
  const s = g.turn, p = g[s], e = g[other(s)];
  if (a.t === "end") {
    push(g, `${p.name} ended the turn`);
    for (const u of p.board) { if (u.stun) u.stun = 0; if (u.id === "giantslime") u.hp = Math.min(u.maxHp, u.hp + 1); }
    if (s !== (g.first || "a")) g.round++;
    startTurn(g, other(s)); return g;
  }
  if (a.t === "play") {
    if (!canPlay(g, s, a.idx)) return g0;
    const c = CARD[p.hand[a.idx]];
    const tg = a.target;
    if (!spellTargetOk(g, s, c, tg)) return g0;
    const alt = c.id === "bodyguard" && !!a.alt; const cost = alt ? 4 : c.cost;
    if (p.gold < cost) return g0;
    p.hand.splice(a.idx, 1); p.gold -= cost;
    if (p.recycle && p.grave && c.kind === "spell" && !c.token) p.grave.push(c.id);
    push(g, `${p.name} ${c.kind === "unit" ? "hired" : "played"} ${c.name}`);
    g.plays = (g.plays || []).concat([{ side: s, id: c.id, n: g.uid++ }]).slice(-6);
    if (c.kind === "unit") {
      const nu       = { uid: g.uid++, id: c.id, atk: c.atk || 0, hp: c.hp || 1, maxHp: c.hp || 1, ready: !!c.swift, guard: !!c.guard, hidden: !!c.hidden, ...(c.trib ? { trib: { ...c.trib } } : {}) };
      const others = p.board.slice();
      if (alt) { nu.atk = 2; nu.hp = nu.maxHp = 5; push(g, `${p.name} paid 4 gold: Hired Bodyguard enters as 2/5`); }
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
      if (c.id === "graci") { heal(p, 2); for (const u of p.board) u.hp = Math.min(u.maxHp, u.hp + 2); draw(g, s); }
      if (c.id === "zack") { const t = others.filter((u) => !isDeadly(u)).sort((x, y) => y.atk - x.atk || y.hp - x.hp)[0]; if (t) { t.deadly = true; push(g, `${CARD[t.id].name} gained Deadly`); } }
      if (c.id === "warchief") { summon(g, s, 1); for (const u of p.board) if (u.id === "grunt") { u.atk++; u.hp++; u.maxHp++; } }
      if (c.id === "warboss") { summon(g, s, BOARD_MAX); for (const u of p.board) if (u.id === "grunt") u.atk++; }
      if (c.id === "hollowqueen") {
        // Devours the enemy sellsword with the highest attack + current health (random tiebreak, Hidden included); it is destroyed and she gains its attack and current health.
        const es = e.board.filter((u) => u.hp > 0);
        if (es.length) { const top = Math.max(...es.map((u) => u.atk + u.hp)); const cs = es.filter((u) => u.atk + u.hp === top); const v = cs[Math.floor(Math.random() * cs.length)];
          const ga = v.atk, gh = v.hp; nu.atk += ga; nu.hp += gh; nu.maxHp += gh; v.hp = 0; push(g, `Hollow Queen devoured ${CARD[v.id].name} (+${ga}/+${gh})`); }
      }
    } else {
      if (c.id === "warcall") summon(g, s, 2);
      if (c.id === "bloodfeast" && tg) { const u = p.board.find((x) => x.uid === tg.uid); if (u) u.hp = 0; draw(g, s, 2); }
      if (c.id === "ambush" && tg) dmgTarget(g, tg, 2);
      if (c.id === "bloodblade" && tg) { const u = g[tg.side].board.find((x) => x.uid === tg.uid); if (u) { u.hp -= 2; if (u.hp > 0) { u.atk += 2; push(g, `${CARD[u.id].name} took 2 and gained +2 attack`); } } }
      if (c.id === "bounty" && tg) dmgTarget(g, tg, 4);
      if (c.id === "knife" && tg) dmgTarget(g, tg, 3);
      if (c.id === "dart" && tg) { dmgTarget(g, tg, 1); draw(g, s); }
      if (c.id === "madcurse" && tg) { const u = e.board.find((x) => x.uid === tg.uid); if (u) { u.trib = { k: "gold", n: 3 }; const st = stunUnit(g, u); push(g, `${CARD[u.id].name} is cursed: Tribute 3 gold${st ? ", and Stunned" : ""}`); } }
      if (c.id === "gorge" && tg) { const u = p.board.find((x) => x.uid === tg.uid); const v = u && p.board.filter((x) => x.uid !== u.uid).sort((x, y) => x.atk + x.hp - y.atk - y.hp)[0]; if (u && v) { u.atk += v.atk; u.hp += Math.max(0, v.hp); u.maxHp += Math.max(0, v.hp); v.hp = 0; push(g, `${CARD[u.id].name} devoured ${CARD[v.id].name}`); } }
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
    if (!u || !u.ready || u.stun || !canAttackTarget(g, s, a.target)) return g0;
    const wasHidden = u.hidden; u.ready = false; u.hidden = false;
    const uc = CARD[u.id];
    if (a.target.uid === "hero") {
      e.hp -= u.atk; if (uc.drain) heal(p, u.atk);
      push(g, `${uc.name} struck ${e.name} for ${u.atk}`);
    } else {
      const d = e.board.find((x) => x.uid === a.target.uid);
      if (!d) return g0;
      const dc = CARD[d.id];
      const toD = u.atk, toU = d.atk;
      const hitD = () => { d.hp -= toD; if (isDeadly(u) && toD > 0) d.hp = Math.min(d.hp, 0); if (uc.drain) heal(p, toD); };
      const hitU = () => { u.hp -= toU; if (isDeadly(d) && toU > 0) u.hp = Math.min(u.hp, 0); if (dc.drain) heal(e, toU); };
      // First Strike: strikes before the other side; if that kills, no damage comes back. Both or neither: damage is simultaneous.
      if (uc.first && !dc.first) { hitD(); if (d.hp > 0) hitU(); }
      else if (dc.first && !uc.first) { hitU(); if (u.hp > 0) hitD(); }
      else { hitD(); hitU(); }
      if (RAGE.includes(u.id) && u.hp > 0) u.atk++;
      if (RAGE.includes(d.id) && d.hp > 0) d.atk++;
      for (const x of [u, d]) if (RAGE_HEAL[x.id] && x.hp > 0) x.hp = Math.min(x.maxHp, x.hp + RAGE_HEAL[x.id]);
      push(g, `${uc.name} fought ${dc.name}`);
      if (u.id === "ambusher" && wasHidden && d.hp > 0 && stunUnit(g, d)) push(g, `${uc.name} Stunned ${dc.name}`);
    }
    cleanup(g); return g;
  }
  return g0;
}
const value = (u      ) => u.atk + u.hp + (u.guard ? 1 : 0) + (RAGE_HEAL[u.id] ? 2 : 0) + (isDeadly(u) ? 3 : 0) + (CARD[u.id].first ? 1 : 0) + (CARD[u.id].legend ? 2 : 0);
// Pay a Tribute when it costs less than letting the beast turn on its own side.
function tribWise(g   , s      , u      )          {
  const p = g[s], t = u.trib; if (!t || !canTribute(p, t)) return false;
  const v = rampTarget(p, u);
  let refuse = 0;
  if (v) { refuse = (u.atk >= v.hp || isDeadly(u) ? value(v) : Math.min(u.atk, v.hp) * 0.6) + (v.atk >= u.hp || isDeadly(v) ? value(u) : v.atk * 0.4); }
  else refuse = u.atk * (p.hp <= u.atk + 4 ? 10 : 1.2);
  let cost = 0;
  if (t.k === "gold") { const left = p.gold - t.n; const playable = p.hand.some((id) => CARD[id].cost <= p.gold && CARD[id].cost > left && id !== "debt"); cost = t.n * (playable ? 1.1 : 0.4); }
  else if (t.k === "discard") cost = t.n * 1.5;
  else cost = t.n * (p.hp <= 8 ? 3 : 1);
  refuse += u.atk; // an unfed beast also loses its attack this turn
  return cost - (FED_VALUE[u.id] || 0) <= refuse;
}
const goldDue = (p        ) => p.board.reduce((x, u) => x + (u.trib && u.trib.k === "gold" ? u.trib.n : 0), 0);
function aiAction(g   )         {
  if (g.phase === "roll" && g.roll) return { t: "first", side: g.roll.winner, first: true }; // going first wins ~70% in sims
  if (g.phase === "mull" && g.mull) { const ms       = g.mull.a < 0 ? "a" : "b"; return { t: "mull", side: ms, idx: aiMulligan(g, ms) }; }
  const s = g.turn, o = other(s), p = g[s], e = g[o];
  if (p.due && p.due.length) { const u = p.board.find((x) => x.uid === p.due [0]); return { t: "trib", uid: p.due[0], pay: !!u && tribWise(g, s, u) }; }
  const ready = p.board.filter((u) => u.ready && !u.stun);
  const vis = e.board.filter((u) => !u.hidden);
  const order = p.hand.map((id, idx) => ({ idx, c: CARD[id] })).sort((x, y) => y.c.cost - x.c.cost);
  for (const { idx, c } of order) {
    if (!canPlay(g, s, idx)) continue;
    if (c.kind === "unit") {
      if (c.id === "drummer" && p.board.length === 0 && p.hand.length > 2 && p.gold < 4) continue;
      if (c.id === "gorger" && p.board.length === 0) continue;
      if (c.id === "hollowqueen" && !e.board.some((u) => u.hp > 0 && u.atk + u.hp >= 4)) continue;
      if (c.trib && c.trib.k === "gold" && goldDue(p) + c.trib.n > Math.min(MAX_GOLD, p.maxGold + 1)) continue;
      if (c.id === "zack" && !p.board.some((u) => !isDeadly(u)) && p.hand.length > 2) continue;
      if (c.id === "shaman" && p.board.length < 2 && p.hand.length > 2) continue;
      if (c.id === "bodyguard" && p.gold >= 4) { const blocks = p.hand.some((h, j) => j !== idx && CARD[h].cost <= p.gold - 1 && CARD[h].cost > p.gold - 4 && canPlay(g, s, j)); return { t: "play", idx, alt: !blocks }; }
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
    if (c.id === "madcurse") { const t = vis.slice().sort((x, y) => (y.guard ? 2 : 0) + value(y) - (x.guard ? 2 : 0) - value(x))[0]; if (t && value(t) >= 6) return { t: "play", idx, target: { side: o, uid: t.uid } }; }
    if (c.id === "gorge" && p.board.length >= 2) { const best = p.board.slice().sort((x, y) => value(y) - value(x))[0]; const v = p.board.filter((x) => x.uid !== best.uid).sort((x, y) => x.atk + x.hp - y.atk - y.hp)[0]; if (v && (value(v) <= 3 || v.id === "grunt" || v.id === "slime")) return { t: "play", idx, target: { side: s, uid: best.uid } }; }
    if (c.id === "marked") { const t = vis.slice().sort((x, y) => value(y) - value(x))[0]; if (t && value(t) >= 6) return { t: "play", idx, target: { side: o, uid: t.uid } }; }
    if (c.id === "dart") { const k = vis.filter((u) => u.hp <= 1).sort((x, y) => value(y) - value(x))[0] || (p.hand.length <= 3 ? vis.slice().sort((x, y) => x.hp - y.hp)[0] : undefined); if (k) return { t: "play", idx, target: { side: o, uid: k.uid } }; }
    if (c.id === "bloodblade") {
      const kill = vis.filter((u) => u.hp > 0 && u.hp <= 2).sort((x, y) => value(y) - value(x))[0];
      if (kill && value(kill) >= 3) return { t: "play", idx, target: { side: o, uid: kill.uid } };
      const buff = p.board.filter((u) => u.hp >= 4 && u.ready && !u.stun).sort((x, y) => y.hp - x.hp || y.atk - x.atk)[0];
      if (buff) return { t: "play", idx, target: { side: s, uid: buff.uid } };
      if (kill) return { t: "play", idx, target: { side: o, uid: kill.uid } };
    }
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
    const u = ready.slice().sort((x, y) => (isDeadly(y) ? 1 : 0) - (isDeadly(x) ? 1 : 0))[0];
    if (guards.length) {
      const g1 = isDeadly(u) ? guards.slice().sort((x, y) => value(y) - value(x))[0] : guards.slice().sort((x, y) => x.hp - y.hp)[0];
      return { t: "attack", uid: u.uid, target: { side: o, uid: g1.uid } };
    }
    if (facePower >= e.hp) return { t: "attack", uid: u.uid, target: { side: o, uid: "hero" } };
    const dl = isDeadly(u), fu = !!CARD[u.id].first;
    const trades = vis.filter((d) => { const fd = !!CARD[d.id].first; const kills = dl || d.hp <= u.atk; if (fd && !fu && d.atk >= u.hp) return false; return kills && (d.atk < u.hp || (fu && !fd) || value(d) > value(u) + 1) && !(isDeadly(d) && u.atk < d.hp && value(u) > 4 && !(fu && !fd)); }).sort((x, y) => value(y) - value(x));
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
  { id: "p-beast", name: "Wild Beasts", premade: true, cards: ex({ slime: 2, mossmen: 2, tunnelcent: 2, scavworg: 2, giantcent: 2, giantslime: 1, madcurse: 1, thousandleg: 1, rabble: 2, worg: 2, kobold: 2, shaman: 1 }) },
  { id: "p-horde", name: "Grimfang Horde", premade: true, cards: ex({ rabble: 2, kobold: 2, bomber: 2, worg: 2, shaman: 2, bloodtusk: 1, brute: 1, gorger: 1, warcall: 2, troll: 2, warboss: 1, ogre: 1, warchief: 1 }) },
];
const PREMADE_BLURB                         = {
  "p-crimson": "Crimson Blades with Shadow poison. Hit early, hit hard.",
  "p-iron": "Iron Company shields and Gilded medics. Outlast, then crush.",
  "p-shadow": "Shadow Guild hidden blades behind a few Iron shields.",
  "p-gilded": "Gilded Ledger card draw and mages, backed by Iron.",
  "p-beast": "Beasts that demand Tribute every turn, with Grimfang goblins to feed the line. Feed them and they grow.",
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

// ================= SIEGE DEFENSE =================
// Co-op last stand: a walled city with 4 outer gates, 4 inner wards and the castle. Days: shared gold buys cards and garrisons zones.
// Nights: waves hit reachable zones; each fight uses the normal battle rules (garrison already on the field, the zone's walls are the captain).
                                           
                                                                            
                                                                                                                                            
                                                                                                                                                                                                                                                  
                 
                                                                                                                                                                  
                                                                                                                                                            
                                                                                                                    
 
                                                                                                                                                                                                 
const SIEGE_DAYS = 12, SIEGE_ROUNDS = 14, SIEGE_SHOP = 6, SIEGE_REROLL = 1;
// Tuning knobs (sims adjust these): gold, walls, and how fast the waves grow.
const ST = { start: 10, base: 1, zoneInc: 1, castleInc: 1, win: 2, boss: 3, wallO: 10, wallI: 13, wallC: 16, hpBase: 6, hpDay: 0.5, deckBase: 2, deckDiv: 3, vanBase: 1, vanDiv: 5, buffDiv: 8, rampDiv: 4, bossAtkDiv: 3, bossHp: 1, n2: 2, n3: 5, n4: 10, retakeHp: 3 };
const SIEGE_START_GOLD = ST.start;
const SZ_NAMES = ["North Gate", "East Gate", "South Gate", "West Gate", "North Ward", "East Ward", "South Ward", "West Ward", "The Castle"];
const szWalls = (k        ) => (k === "outer" ? ST.wallO : k === "inner" ? ST.wallI : ST.wallC);
const szCap = (z       ) => (z.kind === "castle" ? 6 : 4);
const SZ_TAC_CAP = 3;
const siegeBehind = (i        ) => (i < 4 ? i + 4 : i < 8 ? 8 : -1);
const siegeIncomeOf = (z       ) => (z.st !== "held" ? 0 : z.kind === "castle" ? ST.castleInc : ST.zoneInc);
const siegeIncome = (s       ) => ST.base + s.zones.reduce((x, z) => x + siegeIncomeOf(z), 0);
const siegePrice = (id        ) => Math.max(1, CARD[id].cost);
const siegeBuyback = (id        ) => Math.max(1, Math.ceil(siegePrice(id) / 2));
const isBoss = (day        ) => day % 3 === 0;
function siegeReachable(s       , i        )          {
  const z = s.zones[i]; if (z.st !== "held") return false;
  if (z.kind === "outer") return true;
  if (z.kind === "inner") return s.zones[i - 4].st === "lost";
  return s.zones.slice(4, 8).some((x) => x.st === "lost");
}
const SHOP_POOL = ()            => COLLECTION.filter((c) => c.id !== "debt" && c.id !== "bonus");
function siegeShopRoll()           {
  const pool                           = {};
  for (const c of SHOP_POOL()) (pool[rarityOf(c)] = pool[rarityOf(c)] || []).push(c.id);
  const out           = [];
  while (out.length < SIEGE_SHOP) {
    let x = Math.floor(Math.random() * 100), r = "common";
    for (const [k, w] of [["common", 60], ["rare", 29], ["epic", 8], ["legendary", 3]]                      ) { if (x < w) { r = k; break; } x -= w; }
    const l = (pool[r] || []).filter((id) => !out.includes(id)); if (l.length) out.push(l[Math.floor(Math.random() * l.length)]);
  }
  return out;
}
function newSiege(players          )        {
  const zones          = SZ_NAMES.map((name, i) => ({ i, kind: (i < 4 ? "outer" : i < 8 ? "inner" : "castle")          , name, st: "held"         , units: [], tactics: [], foe: [] }));
  const s        = { v: 1, day: 1, phase: "day", gold: ST.start, zones, reserve: [], camp: [], shop: siegeShopRoll(), uid: 1, log: [], fights: [], cur: -1, g: null, push: [], players: players.slice(0, 2), ready: players.slice(0, 2).map(() => false), report: [], stats: { won: 0, lost: 0, zones: 0, bosses: 0, fallen: 0 }, nextCmd: 0, seq: 0 };
  slog(s, `Day 1. The banners of every company are on the horizon. ${ST.start} gold in the war chest; hold the walls for ${SIEGE_DAYS} nights.`);
  return s;
}
function slog(s       , m        ) { s.log = [m].concat(s.log).slice(0, 14); }
const sClone = (s       )        => JSON.parse(JSON.stringify(s));
const findCard = (s       , sid        )                                                                              => {
  let i = s.reserve.findIndex((x) => x.sid === sid); if (i >= 0) return { where: "reserve", list: s.reserve, c: s.reserve[i] };
  for (const z of s.zones) for (const list of [z.units, z.tactics]) { i = list.findIndex((x) => x.sid === sid); if (i >= 0) return { where: "zone", zone: z, list, c: list[i] }; }
  return null;
};
const pname = (s       , who        ) => s.players[who] || "You";
// Day actions from either player (who = player index). Returns the same object when the action isn't allowed.
function siegeDo(s0       , a      , who        )        {
  if (s0.phase !== "day" || !a) return s0;
  const s = sClone(s0); const nm = pname(s, who); const by = s.players.length > 1 ? ` (${nm})` : "";
  if (a.t === "buy") {
    const id = s.shop[a.i]; if (!id || s.gold < siegePrice(id)) return s0;
    s.gold -= siegePrice(id); s.shop[a.i] = null; s.reserve.push({ sid: s.uid++, id, by: nm });
    slog(s, `Bought ${CARD[id].name} for ${siegePrice(id)} gold${by}`);
  } else if (a.t === "reroll") {
    if (s.gold < SIEGE_REROLL) return s0; s.gold -= SIEGE_REROLL; s.shop = siegeShopRoll(); slog(s, `New offers at the market${by}`);
  } else if (a.t === "buyback") {
    const i = s.camp.findIndex((x) => x.sid === a.sid); if (i < 0) return s0; const c = s.camp[i]; const pr = siegeBuyback(c.id); if (s.gold < pr) return s0;
    s.gold -= pr; s.camp.splice(i, 1); c.wounded = true; c.by = nm; s.reserve.push(c); slog(s, `${CARD[c.id].name} bought back from the healing camp for ${pr} gold (wounded)${by}`);
  } else if (a.t === "place") {
    const z = s.zones[a.zone]; const f = findCard(s, a.sid); if (!z || !f || z.st === "lost") return s0;
    const isUnit = CARD[f.c.id].kind === "unit"; const dest = isUnit ? z.units : z.tactics;
    if (f.zone && f.zone.i === z.i) return s0;
    if (dest.length >= (isUnit ? szCap(z) : SZ_TAC_CAP)) return s0;
    f.list.splice(f.list.indexOf(f.c), 1); f.c.by = nm; dest.push(f.c);
    slog(s, `${CARD[f.c.id].name} ${isUnit ? "posted to" : "sent to"} ${z.name}${by}`);
  } else if (a.t === "unplace") {
    const f = findCard(s, a.sid); if (!f || f.where !== "zone") return s0;
    f.list.splice(f.list.indexOf(f.c), 1); s.reserve.push(f.c); slog(s, `${CARD[f.c.id].name} pulled back to the reserve${by}`);
  } else if (a.t === "ready") {
    s.ready[who] = a.on !== false;
    if (s.ready.every((x) => x)) siegeNight(s);
  } else return s0;
  s.seq++;
  return s;
}
// ---------- waves ----------
const WAVE_POOL = ()           => PREMADE.flatMap((d) => d.cards).filter((id) => CARD[id] && !CARD[id].legend);
const pickN =     (a     , n        )      => shuffle(a).slice(0, n);
function waveUnit(g                 , id        , buff = 0)       { const c = CARD[id]; return { uid: g.uid++, id, atk: (c.atk || 0), hp: (c.hp || 1) + buff, maxHp: (c.hp || 1) + buff, ready: false, guard: !!c.guard, hidden: !!c.hidden, ...(c.trib ? { trib: { ...c.trib } } : {}) }; }
function waveFight(s       , zone        , kind                 , carry        , boss         )         {
  const d = s.day, pool = WAVE_POOL();
  const units = pool.filter((id) => CARD[id].kind === "unit" && CARD[id].cost <= 1 + Math.ceil(d / 2));
  const vanN = Math.min(5, ST.vanBase + Math.floor(d / ST.vanDiv)) - carry.length;
  const buff = Math.floor((d - 1) / ST.buffDiv);
  const van         = carry.map((u) => ({ ...u, ready: false, stun: 0 }));
  for (const id of pickN(units, Math.max(0, vanN))) van.push(waveUnit(s, id, buff));
  let bossId                    ;
  if (boss) {
    const bp = COLLECTION.filter((c) => c.kind === "unit" && (rarityOf(c) === "epic" || rarityOf(c) === "legendary") && !c.trib);
    const b = bp[Math.floor(Math.random() * bp.length)]; bossId = b.id;
    const u = waveUnit(s, b.id, Math.round(d * ST.bossHp)); u.atk += Math.floor(d / ST.bossAtkDiv); if (d >= 12) u.guard = true; van.unshift(u);
  }
  const deck = pickN(pool, ST.deckBase + Math.ceil(d / ST.deckDiv));
  return { zone, kind, van: van.slice(0, BOARD_MAX), deck, hp: ST.hpBase + Math.round(d * ST.hpDay), ramp: Math.min(5, Math.floor(d / ST.rampDiv)), boss: bossId, name: boss ? `${CARD[bossId ].name}'s host` : kind === "push" ? "Breach column" : `Wave ${d}`, cmd: 0 };
}
function siegeNight(s       ) {
  s.phase = "night"; s.fights = []; s.report = []; s.ready = s.ready.map(() => false);
  const d = s.day;
  // 1) enemies holding a zone since last night: retake or lose it
  for (const z of s.zones) if (z.st === "contested") {
    const deck = pickN(WAVE_POOL(), 1 + Math.floor(d / 3));
    s.fights.push({ zone: z.i, kind: "retake", van: z.foe.map((u) => ({ ...u, ready: false, stun: 0 })), deck, hp: ST.retakeHp + Math.floor(d / 2), ramp: Math.min(5, Math.floor(d / ST.rampDiv)), name: "Occupiers", cmd: 0 });
  }
  // 2) breach columns pushing into the zone behind a destroyed one
  const pushT = new Set        ();
  for (const p of s.push) { if (s.zones[p.zone].st !== "held") continue; pushT.add(p.zone); s.fights.push(waveFight(s, p.zone, "push", p.units.slice(0, BOARD_MAX - 1), false)); }
  s.push = [];
  // 3) tonight's wave hits some reachable zones; every 3rd night brings a boss
  const reach = s.zones.filter((z) => siegeReachable(s, z.i) && !pushT.has(z.i)).map((z) => z.i);
  const n = Math.min(reach.length, d < ST.n2 + 1 ? 1 : d <= ST.n3 ? 2 : d <= ST.n4 ? 3 : 4);
  const targets = pickN(reach, n);
  targets.forEach((zi, k) => s.fights.push(waveFight(s, zi, "wave", [], isBoss(d) && k === 0)));
  if (isBoss(d) && !targets.length && s.fights.length) { const f = s.fights[s.fights.length - 1]; const w = waveFight(s, f.zone, "wave", [], true); f.van = w.van; f.boss = w.boss; f.name = w.name; }
  slog(s, `Night ${d}: ${s.fights.length} attack${s.fights.length === 1 ? "" : "s"} on the city${isBoss(d) ? ", a boss leads the wave" : ""}.`);
  s.cur = -1; siegeNext(s);
}
function siegeGame(s       , f        )    {
  const z = s.zones[f.zone];
  const g = newGame({ name: z.name, deck: [], hp: szWalls(z.kind), nofat: true }, { name: f.name, deck: f.deck, hp: f.hp, ramp: f.ramp });
  g.phase = "play"; delete g.roll; delete g.mull; g.first = "b"; g.siege = { zone: f.zone, boss: f.boss };
  g.a.hand = z.tactics.map((c) => c.id);
  g.a.board = z.units.map((c) => { const u = waveUnit(g, c.id); u.sid = c.sid; return u; });
  g.b.board = f.van.map((u) => ({ ...u, uid: g.uid++, ready: false }));
  g.log = [`${f.name} attacks ${z.name}! Hold the walls (♥ ${szWalls(z.kind)}) and break the warband (♥ ${f.hp}).`];
  startTurn(g, "b");
  return g;
}
// Move to the next fight; fights with nobody defending resolve on their own.
function siegeNext(s       ) {
  s.g = null;
  while (s.phase === "night") {
    s.cur++;
    if (s.cur >= s.fights.length) { siegeDawn(s); return; }
    const f = s.fights[s.cur]; const z = s.zones[f.zone];
    if (z.st === "lost") { f.done = true; f.auto = true; f.note = `${z.name} already fell.`; continue; }
    if (!z.units.length && !z.tactics.length) { f.done = true; f.auto = true; siegeResolve(s, f, false, f.van.map((u) => ({ ...u })), []); continue; }
    f.cmd = s.nextCmd % Math.max(1, s.players.length); s.nextCmd++;
    s.g = siegeGame(s, f); return;
  }
}
function siegeResolve(s       , f        , won         , foeLeft        , aliveSids          , handLeft           = []) {
  const z = s.zones[f.zone]; f.done = true; f.won = won;
  // garrison: the fallen go to the healing camp (or are lost for good if already wounded)
  const fallen = z.units.filter((c) => !aliveSids.includes(c.sid));
  z.units = z.units.filter((c) => aliveSids.includes(c.sid));
  for (const c of fallen) { if (c.wounded) { s.stats.fallen++; s.report.push(`${CARD[c.id].name} fell again and is gone for good.`); } else { s.camp.push({ sid: c.sid, id: c.id }); s.report.push(`${CARD[c.id].name} was carried to the healing camp.`); } }
  // tactics not played stay with the zone
  const left = handLeft.slice(); z.tactics = z.tactics.filter((c) => { const k = left.indexOf(c.id); if (k >= 0) { left.splice(k, 1); return true; } return false; });
  if (won) {
    const gold = ST.win + (f.boss ? ST.boss : 0); s.gold += gold; f.gold = gold; s.stats.won++; if (f.boss) s.stats.bosses++;
    if (z.st === "contested") { z.st = "held"; z.foe = []; s.report.push(`${z.name} retaken! +${gold} gold.`); } else s.report.push(`${z.name} held against ${f.name}. +${gold} gold.`);
    return;
  }
  s.stats.lost++;
  const occ = foeLeft.filter((u) => u.hp > 0).slice(0, BOARD_MAX).map((u) => ({ ...u, ready: false, stun: 0 }));
  if (z.kind === "castle") { z.st = "lost"; s.phase = "lost"; s.report.push(`The castle has fallen on night ${s.day}.`); slog(s, `The castle has fallen. The city is lost.`); return; }
  if (f.kind === "retake" || z.st === "contested") {
    z.st = "lost"; s.stats.zones++;
    for (const c of z.units.concat(z.tactics)) s.reserve.push(c); z.units = []; z.tactics = []; z.foe = [];
    const b = siegeBehind(z.i);
    s.push.push({ zone: b, units: occ });
    s.report.push(`${z.name} is destroyed. The enemy will push into ${s.zones[b].name} next night.`);
    return;
  }
  z.st = "contested"; z.foe = occ.length ? occ : [];
  s.report.push(f.auto ? `${z.name} had no defenders. The enemy took it and must hold it one day to destroy it. Reinforce it to retake it!` : `${z.name} was overrun. The enemy holds it; reinforce it during the day to retake it before it is destroyed.`);
}
// Finish the current fight with the finished game.
function siegeFinish(s0       , g   )        {
  if (s0.phase !== "night" || !s0.g || !g.winner) return s0;
  const s = sClone(s0); const f = s.fights[s.cur];
  siegeResolve(s, f, g.winner === "a", g.b.board, g.a.board.filter((u) => u.sid != null && u.hp > 0).map((u) => u.sid ), g.a.hand);
  if (s.phase === "night") siegeNext(s); else s.g = null;
  s.seq++;
  return s;
}
function siegeDawn(s       ) {
  s.g = null;
  if (s.day >= SIEGE_DAYS) { s.phase = "won"; slog(s, `Dawn after night ${SIEGE_DAYS}: the siege breaks. The city stands!`); return; }
  s.day++; const inc = siegeIncome(s); s.gold += inc; s.phase = "day"; s.shop = siegeShopRoll(); s.ready = s.ready.map(() => false);
  slog(s, `Day ${s.day}. +${inc} gold from the zones still held.${isBoss(s.day) ? " Scouts report a BOSS with tonight's wave." : ""}`);
}
// ---------- computer planning (sims, and the "Plan for me" helper) ----------
const unitScore = (id        ) => { const c = CARD[id]; return (c.atk || 0) + (c.hp || 0) + (c.guard ? 2 : 0) + (c.legend ? 3 : 0) + (c.trib ? -1 : 0); };
function siegeThreat(s       )           {
  const t           = [];
  for (const z of s.zones) if (z.st === "contested") t.push(z.i);
  for (const p of s.push) if (s.zones[p.zone].st === "held") t.push(p.zone);
  for (const z of s.zones) if (siegeReachable(s, z.i) && !t.includes(z.i)) t.push(z.i);
  return t;
}
function siegeAiStep(s       , who        )       {
  const threat = siegeThreat(s);
  const power = (z       ) => z.units.reduce((x, c) => x + unitScore(c.id), 0) - (z.st === "contested" ? z.foe.reduce((x, u) => x + u.atk + u.hp, 0) : 0);
  // 1) place reserve units on the weakest threatened zone, tactics on the strongest
  const ru = s.reserve.filter((c) => CARD[c.id].kind === "unit").sort((x, y) => unitScore(y.id) - unitScore(x.id))[0];
  if (ru) { const z = threat.map((i) => s.zones[i]).filter((z) => z.units.length < szCap(z)).sort((x, y) => power(x) - power(y))[0]; if (z) return { t: "place", sid: ru.sid, zone: z.i }; }
  const rt = s.reserve.find((c) => CARD[c.id].kind === "spell");
  if (rt) { const z = threat.map((i) => s.zones[i]).filter((z) => z.units.length && z.tactics.length < SZ_TAC_CAP).sort((x, y) => power(y) - power(x))[0]; if (z) return { t: "place", sid: rt.sid, zone: z.i }; }
  // 2) buy: best value per gold among buybacks and shop units (keep a little for tactics)
  const opts                                      = [];
  for (const c of s.camp) if (CARD[c.id].kind === "unit") opts.push({ a: { t: "buyback", sid: c.sid }, v: unitScore(c.id) * 0.9, p: siegeBuyback(c.id) });
  s.shop.forEach((id, i) => { if (!id) return; const c = CARD[id]; opts.push({ a: { t: "buy", i }, v: c.kind === "unit" ? unitScore(id) : 2.2, p: siegePrice(id) }); });
  const best = opts.filter((o) => o.p <= s.gold).sort((x, y) => y.v / y.p - x.v / x.p)[0];
  const room = threat.some((i) => s.zones[i].units.length < szCap(s.zones[i]));
  if (best && room) return best.a;
  return { t: "ready" };
}


export { MAX_GOLD, CARDS, CARD, RARITY, rarityOf, RARITY_NAME, RARITY_LETTER, COLLECTION, shuffle, other, push, draw, RAGE_HEAL, RAGE, isDeadly, tribText, tribPay, canTribute, FED_VALUE, rampTarget, payTribute, heal, summon, checkWin, startTurn, OPEN_HAND, mulligan, chooseFirst, aiMulligan, newGame, clone, stunUnit, hasGuard, canAttackTarget, spellTargetOk, dmgTarget, cleanup, canPlay, apply, value, tribWise, goldDue, aiAction, ex, PREMADE, PREMADE_BLURB, copyLimit, deckProblems, countOf, SIEGE_DAYS, ST, SIEGE_START_GOLD, SZ_NAMES, szWalls, szCap, SZ_TAC_CAP, siegeBehind, siegeIncomeOf, siegeIncome, siegePrice, siegeBuyback, isBoss, siegeReachable, SHOP_POOL, siegeShopRoll, newSiege, slog, sClone, findCard, pname, siegeDo, WAVE_POOL, pickN, waveUnit, waveFight, siegeNight, siegeGame, siegeNext, siegeResolve, siegeFinish, siegeDawn, unitScore, siegeThreat, siegeAiStep };
