// The card catalogue for Bloom Clash. Every card is a plain data row:
// id, name, cost in petals, kind, art, and the numbers its effect uses.
// The engine in state.js is the only place that interprets these fields,
// so adding a card is a one-line catalogue change.
export const CATALOGUE = [
  { id: 'slash',  name: 'Petal Slash',  cost: 1, kind: 'attack', art: '🌸', damage: 6,  text: 'Deal 6 damage.' },
  { id: 'jab',    name: 'Thorn Jab',    cost: 1, kind: 'attack', art: '🌵', damage: 4,  poison: 2, text: 'Deal 4 damage. Apply 2 Poison.' },
  { id: 'heavy',  name: 'Bloom Burst',  cost: 2, kind: 'attack', art: '💥', damage: 10, text: 'Deal 10 damage.' },
  { id: 'fan',    name: 'Petal Fan',    cost: 2, kind: 'attack', art: '🪭', damage: 8,  draw: 1, text: 'Deal 8 damage. Draw 1 card.' },
  { id: 'storm',  name: 'Petal Storm',  cost: 3, kind: 'attack', art: '🌪️', damage: 13, text: 'Deal 13 damage.' },
  { id: 'guard',  name: 'Leaf Guard',   cost: 1, kind: 'skill',  art: '🍃', block: 8,  text: 'Gain 8 Block.' },
  { id: 'wall',   name: 'Bark Wall',    cost: 2, kind: 'skill',  art: '🪵', block: 13, text: 'Gain 13 Block.' },
  { id: 'heal',   name: 'Dew Drop',     cost: 1, kind: 'skill',  art: '💧', heal: 6,  text: 'Restore 6 HP.' },
  { id: 'sun',    name: 'Sunbeam',      cost: 0, kind: 'skill',  art: '☀️', draw: 2,  text: 'Draw 2 cards.' },
  { id: 'spore',  name: 'Spore Cloud',  cost: 2, kind: 'attack', art: '🍄', damage: 3,  poison: 4, text: 'Deal 3 damage. Apply 4 Poison.' },
  { id: 'snare',  name: 'Vine Snare',   cost: 1, kind: 'attack', art: '🌿', damage: 3,  weaken: 1, text: 'Deal 3 damage. Weaken the foe.' },
  { id: 'dew',    name: 'Morning Dew',  cost: 0, kind: 'power',  art: '🌅', energy: 2, text: 'Gain 2 Petals this turn.' },
];

export const MAX_HP = 30;
export const HAND_SIZE = 5;
export const DRAW_PER_TURN = 2;
export const ENERGY_PER_TURN = 3;
// Thorn plays on the same budget as you do, but it only ever spends it on
// two cards a turn — it holds the rest back to watch your hand.
export const ENEMY_ENERGY_PER_TURN = 3;

// The 24-card starter deck: three Slashes and Guards anchor it, the rest
// is one or two copies of every trick in the catalogue.
const DECK_RECIPE = {
  slash: 3, jab: 2, heavy: 2, fan: 2, storm: 1,
  guard: 3, wall: 2, heal: 2, sun: 2,
  spore: 2, snare: 2, dew: 1,
};

export function cardById(id) {
  return CATALOGUE.find((c) => c.id === id);
}

export function buildDeck() {
  const deck = [];
  for (const [id, count] of Object.entries(DECK_RECIPE)) {
    for (let i = 0; i < count; i++) deck.push(id);
  }
  return deck;
}

export function kindLabel(kind) {
  return kind === 'attack' ? 'Attack' : kind === 'skill' ? 'Skill' : 'Power';
}
