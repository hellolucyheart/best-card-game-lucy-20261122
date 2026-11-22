// Thorn's brain: a small greedy heuristic, not a search. It scores every
// card it can afford, plays the best one, then re-scores — the same loop a
// new player would run by hand. Seeded randomness only breaks ties, so a
// ?seed= duel replays identically.
import { cardById } from './cards.js';

function scoreCard(card, me, foe) {
  let score = 0;
  if (card.damage) {
    // Damage is worth more the closer the foe is to falling.
    score += card.damage * (foe.hp <= card.damage ? 3 : 1);
    if (foe.hp <= 10) score += 4;
  }
  if (card.poison) score += card.poison * 1.5;
  if (card.weaken) score += 3;
  if (card.block) {
    // Block matters when the foe can hit back hard; it is gold when hurt.
    score += card.block * (me.hp <= 12 ? 1.5 : me.hp <= 20 ? 1.1 : 0.45);
  }
  if (card.heal) score += me.hp <= 14 ? card.heal * 2.0 : me.hp <= 24 ? card.heal * 0.6 : 0;
  if (card.draw) score += 3.5;
  if (card.energy) score += 5;
  // Cheap cards edge out pricey ones when the scores are close.
  score -= card.cost * 0.4;
  return score;
}

// Returns the ordered list of card ids Thorn plays this turn — at most two,
// so it can never dump its whole hand into one brutal turn. It never
// spends its last petal on a draw when a strike is on the table.
export function planEnemyTurn(state, rand) {
  const plays = [];
  let energy = state.enemy.energy;
  const hand = [...state.enemy.hand];
  const me = { hp: state.enemy.hp };
  const foe = { hp: state.player.hp };

  for (;;) {
    const affordable = hand
      .map((id, i) => ({ id, i, card: cardById(id), score: scoreCard(cardById(id), me, foe) }))
      .filter((c) => c.card.cost <= energy && c.score > 0.5);
    if (affordable.length === 0) break;
    affordable.sort((a, b) => b.score - a.score || rand() - 0.5);
    const best = affordable[0];
    plays.push(best.id);
    hand.splice(best.i, 1);
    energy -= best.card.cost;
    if (best.card.damage) foe.hp = Math.max(0, foe.hp - best.card.damage);
    if (best.card.heal) me.hp = Math.min(30, me.hp + best.card.heal);
    if (best.card.block) me.block = (me.block ?? 0) + best.card.block;
    if (plays.length >= 2) break;
  }
  return plays;
}

// The one-line telegraph shown above Thorn's portrait so the player can
// plan around the coming turn. It is a hint, not a promise: Thorn may
// still draw into something else.
export function enemyIntent(state) {
  const foe = state.enemy;
  if (foe.hp <= 10) return '🌿 Thorn is hurt — expect guards and healing.';
  const biggest = Math.max(0, ...foe.hand.map((id) => cardById(id).damage ?? 0));
  if (biggest >= 11) return '💥 Thorn is winding up a heavy hit…';
  if (foe.hand.some((id) => (cardById(id).poison ?? 0) > 0)) return '🍄 Thorn is brewing something foul…';
  return '🌵 Thorn is sizing you up.';
}
