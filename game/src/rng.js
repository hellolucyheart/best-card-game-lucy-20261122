// Seeded randomness for Bloom Clash. A tiny mulberry32 generator so a
// ?seed= link replays the same shuffles and the same AI tie-breaks, while a
// plain visit just plays with fresh entropy.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromQuery(search) {
  const raw = new URLSearchParams(search).get('seed');
  const n = raw === null ? (Math.random() * 0xffffffff) >>> 0 : Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n >>> 0 : 7;
}

// Fisher-Yates, in place, driven by the caller's generator.
export function shuffle(deck, rand) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}

export function pickOne(list, rand) {
  return list[Math.floor(rand() * list.length)];
}
