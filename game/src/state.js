// Bloom Clash — the rules engine. Pure logic, no DOM: it owns the decks,
// the hands, block / poison / weaken, and the win check. The renderer in
// render.js only reads this state; boot.js drives the turns.
import { buildDeck, cardById, DRAW_PER_TURN, ENERGY_PER_TURN, ENEMY_ENERGY_PER_TURN, HAND_SIZE, MAX_HP } from './cards.js';
import { mulberry32, shuffle } from './rng.js';

export function freshSide(deck) {
  return {
    hp: MAX_HP, block: 0, poison: 0, weak: 0,
    energy: ENERGY_PER_TURN, hand: [], deck, discard: [],
  };
}

export function createGame(seed) {
  const rand = mulberry32(seed);
  const state = {
    seed,
    turn: 1,
    phase: 'player', // 'player' | 'enemy' | 'over'
    player: freshSide(shuffle(buildDeck(), rand)),
    enemy: freshSide(shuffle(buildDeck(), rand)),
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, heals: 0 },
    winner: null,
    rand,
  };
  drawCards(state, 'player', HAND_SIZE);
  drawCards(state, 'enemy', HAND_SIZE);
  addLog(state, 'system', '🌸 <b>Sakura</b> faces <b>Thorn</b> — first to 0 HP loses. Good luck!');
  return state;
}

export function addLog(state, who, html) {
  state.log.push({ who, html });
  if (state.log.length > 60) state.log.splice(0, state.log.length - 60);
}

export function drawCards(state, sideName, count) {
  const side = state[sideName];
  for (let i = 0; i < count; i++) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = shuffle([...side.discard], state.rand);
      side.discard = [];
      addLog(state, 'system', `♻️ ${sideName === 'player' ? 'Your' : "Thorn's"} discard pile reshuffles into the deck.`);
    }
    side.hand.push(side.deck.pop());
  }
}

// Poison burns at the start of a side's turn, then fades by one stack.
function tickPoison(state, sideName) {
  const side = state[sideName];
  if (side.poison <= 0) return [];
  const dmg = side.poison;
  const events = [{ kind: 'poison', target: sideName, amount: dmg }];
  hurt(state, sideName, dmg);
  side.poison = Math.max(0, side.poison - 1);
  addLog(state, 'system', `☠️ Poison bites ${sideName === 'player' ? 'you' : 'Thorn'} for <b>${dmg}</b>.`);
  return events;
}

// Raw damage after block. Returns the HP actually lost.
export function hurt(state, sideName, amount) {
  const side = state[sideName];
  const absorbed = Math.min(side.block, amount);
  side.block -= absorbed;
  const hpLost = amount - absorbed;
  side.hp = Math.max(0, side.hp - hpLost);
  if (sideName === 'player') state.stats.damageTaken += hpLost;
  else state.stats.damageDealt += hpLost;
  checkEnd(state);
  return { hpLost, absorbed };
}

function checkEnd(state) {
  if (state.winner) return;
  if (state.enemy.hp <= 0) state.winner = 'player';
  else if (state.player.hp <= 0) state.winner = 'enemy';
  if (state.winner) state.phase = 'over';
}

function resolveCard(state, actor, target, card) {
  const events = [];
  const actorSide = state[actor];
  const targetSide = state[target];
  // Weak lives on the attacker: it shaves 3 off every hit they land.
  const weakCut = actorSide.weak > 0 && card.damage ? 3 : 0;
  const weakNote = weakCut > 0 ? ' (weakened −3)' : '';

  if (card.damage) {
    const before = targetSide.hp;
    const dealt = Math.max(0, card.damage - weakCut);
    const { hpLost, absorbed } = hurt(state, target, dealt);
    events.push({ kind: 'damage', target, amount: dealt, hpLost, absorbed });
    addLog(state, actor, `${card.art} <b>${actor === 'player' ? 'You play' : 'Thorn plays'} ${card.name}</b> — ${dealt} damage${weakNote}${absorbed ? `, ${absorbed} blocked` : ''}.`);
    void before;
  }
  if (card.block) {
    actorSide.block += card.block;
    events.push({ kind: 'block', target: actor, amount: card.block });
    addLog(state, actor, `${card.art} <b>${actor === 'player' ? 'You play' : 'Thorn plays'} ${card.name}</b> — +${card.block} Block.`);
  }
  if (card.heal) {
    const healed = Math.min(card.heal, MAX_HP - actorSide.hp);
    actorSide.hp += healed;
    state.stats.heals += actor === 'player' ? healed : 0;
    events.push({ kind: 'heal', target: actor, amount: healed });
    addLog(state, actor, `${card.art} <b>${actor === 'player' ? 'You play' : 'Thorn plays'} ${card.name}</b> — restore ${healed} HP.`);
  }
  if (card.poison) {
    targetSide.poison += card.poison;
    events.push({ kind: 'poison-apply', target, amount: card.poison });
    addLog(state, actor, `🍄 ${card.name} coats ${target === 'player' ? 'you' : 'Thorn'} in spores (+${card.poison} Poison).`);
  }
  if (card.weaken) {
    targetSide.weak = Math.max(targetSide.weak, card.weaken);
    events.push({ kind: 'weaken', target, amount: card.weaken });
    addLog(state, actor, `🌿 ${card.name} tangles ${target === 'player' ? 'your' : "Thorn's"} arms — Weaken.`);
  }
  if (card.draw) {
    drawCards(state, actor, card.draw);
    events.push({ kind: 'draw', target: actor, amount: card.draw });
  }
  if (card.energy) {
    actorSide.energy += card.energy;
    events.push({ kind: 'energy', target: actor, amount: card.energy });
    addLog(state, actor, `🌅 <b>${actor === 'player' ? 'You play' : 'Thorn plays'} ${card.name}</b> — +${card.energy} Petals.`);
  }
  return events;
}

// The player's move. Returns { ok, events, error } — boot.js animates the
// events and re-renders; a bad move changes nothing.
export function playCard(state, handIndex) {
  if (state.phase !== 'player') return { ok: false, error: 'Not your turn.' };
  if (state.winner) return { ok: false, error: 'The duel is over.' };
  const id = state.player.hand[handIndex];
  if (id === undefined) return { ok: false, error: 'No card there.' };
  const card = cardById(id);
  if (state.player.energy < card.cost) {
    return { ok: false, error: `Need ${card.cost} petals for ${card.name}.` };
  }
  state.player.energy -= card.cost;
  state.player.hand.splice(handIndex, 1);
  state.player.discard.push(id);
  state.stats.cardsPlayed += 1;
  const events = resolveCard(state, 'player', 'enemy', card);
  return { ok: true, card, events };
}

// Thorn's single move, called once per planned card by boot.js.
export function playEnemyCard(state, cardId) {
  const idx = state.enemy.hand.indexOf(cardId);
  if (idx === -1) return { ok: false, error: 'Thorn does not hold that card.' };
  const card = cardById(cardId);
  if (state.enemy.energy < card.cost) return { ok: false, error: 'Thorn cannot afford that.' };
  state.enemy.energy -= card.cost;
  state.enemy.hand.splice(idx, 1);
  state.enemy.discard.push(cardId);
  const events = resolveCard(state, 'enemy', 'player', card);
  return { ok: true, card, events };
}

// Called when the player ends the turn: Thorn ticks, draws, and plays.
// boot.js awaits between plays for the animation; this only opens the turn.
// Your own Weaken wears off now — it covered Thorn's whole last turn.
export function beginEnemyTurn(state) {
  state.phase = 'enemy';
  if (state.player.weak > 0) state.player.weak -= 1;
  const side = state.enemy;
  side.block = 0;
  side.energy = ENEMY_ENERGY_PER_TURN;
  const events = tickPoison(state, 'enemy');
  drawCards(state, 'enemy', DRAW_PER_TURN);
  return events;
}

// Called after Thorn's last play: your block fades, poison ticks, you draw.
// Thorn's Weaken on you wears off now — it covered your whole last turn.
export function beginPlayerTurn(state) {
  state.turn += 1;
  state.phase = 'player';
  if (state.enemy.weak > 0) state.enemy.weak -= 1;
  const side = state.player;
  side.block = 0;
  side.energy = ENERGY_PER_TURN;
  const events = tickPoison(state, 'player');
  drawCards(state, 'player', DRAW_PER_TURN);
  if (!state.winner) {
    addLog(state, 'system', `— Turn ${state.turn}: your move. —`);
  }
  return events;
}
