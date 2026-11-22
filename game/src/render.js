// Bloom Clash — the table. render.js turns state into DOM and nothing else:
// it never changes the rules, it only shows them. boot.js owns the clicks.
import { cardById, kindLabel, MAX_HP } from './cards.js';
import { enemyIntent } from './ai.js';

const $ = (id) => document.getElementById(id);

export function statusChips(side) {
  const chips = [];
  if (side.block > 0) chips.push(`<span class="chip block">🛡️ ${side.block} Block</span>`);
  if (side.poison > 0) chips.push(`<span class="chip poison">☠️ ${side.poison} Poison</span>`);
  if (side.weak > 0) chips.push(`<span class="chip weak">🌿 Weakened</span>`);
  return chips.join('');
}

export function cardElement(card, opts = {}) {
  const el = document.createElement(opts.button ? 'button' : 'div');
  el.className = `card ${card.kind}${opts.mini ? ' mini' : ''}`;
  el.innerHTML = `
    <span class="cost">${card.cost}</span>
    <span class="art">${card.art}</span>
    <span class="name">${card.name}</span>
    <span class="kind">${kindLabel(card.kind)}</span>
    <span class="text">${card.text}</span>
    ${opts.keyLabel ? `<span class="key">${opts.keyLabel}</span>` : ''}`;
  return el;
}

function renderSide(state, name, panel) {
  const side = state[name];
  const fill = $(panel.fill);
  const text = $(panel.text);
  fill.style.width = `${Math.max(0, (side.hp / MAX_HP) * 100)}%`;
  text.textContent = `${side.hp} / ${MAX_HP} HP${side.block > 0 ? ` · 🛡️ ${side.block}` : ''}`;
  $(panel.status).innerHTML = statusChips(side);
}

export function render(state, ui) {
  renderSide(state, 'player', { fill: 'playerHpFill', text: 'playerHpText', status: 'playerStatus' });
  renderSide(state, 'enemy', { fill: 'enemyHpFill', text: 'enemyHpText', status: 'enemyStatus' });

  $('turnLabel').textContent = state.winner
    ? `Duel over — ${state.winner === 'player' ? 'you win!' : 'Thorn wins'}`
    : `Turn ${state.turn} — ${state.phase === 'player' ? 'your move' : "Thorn's move…"}`;
  $('deckLabel').textContent = `Deck ${state.player.deck.length}`;
  $('discardLabel').textContent = `Discard ${state.player.discard.length}`;

  const pips = $('energyPips');
  pips.innerHTML = '';
  for (let i = 0; i < Math.max(3, state.player.energy); i++) {
    const petal = document.createElement('span');
    petal.className = `petal${i < state.player.energy ? ' on' : ''}`;
    petal.textContent = '🌸';
    pips.appendChild(petal);
  }

  const enemyHand = $('enemyHand');
  enemyHand.innerHTML = '';
  for (let i = 0; i < state.enemy.hand.length; i++) {
    const back = document.createElement('span');
    back.className = 'mini-card';
    enemyHand.appendChild(back);
  }
  $('enemyIntent').textContent = state.winner ? '—' : enemyIntent(state);

  const hand = $('hand');
  hand.innerHTML = '';
  state.player.hand.forEach((id, i) => {
    const card = cardById(id);
    const el = cardElement(card, { button: true, keyLabel: `${i + 1}` });
    const playable = state.phase === 'player' && !state.winner && state.player.energy >= card.cost;
    el.disabled = !playable;
    el.addEventListener('click', () => ui.onPlay(i, el));
    hand.appendChild(el);
  });

  const log = $('log');
  log.innerHTML = state.log.map((e) => `<div class="${e.who === 'enemy' ? 'enemy-line' : ''}">${e.html}</div>`).join('');
  log.scrollTop = log.scrollHeight;

  $('endTurnBtn').disabled = state.phase !== 'player' || Boolean(state.winner);
  if (state.winner) showOverlay(state);
}

// A big number that floats up from a fighter's portrait, then vanishes.
export function floatNumber(targetPanelId, text, kind) {
  const anchor = document.getElementById(targetPanelId);
  if (!anchor) return;
  const rect = anchor.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float-num ${kind}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2 - 20}px`;
  el.style.top = `${rect.top + 10}px`;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1050);
}

export function showPlayed(card, who) {
  const slot = $(who === 'player' ? 'playedCard' : 'playedEnemy');
  slot.innerHTML = '';
  slot.appendChild(cardElement(card, { mini: true }));
}

export function clearPlayed() {
  $('playedCard').innerHTML = '';
  $('playedEnemy').innerHTML = '';
}

function showOverlay(state) {
  const win = state.winner === 'player';
  $('overlayEmoji').textContent = win ? '🏆' : '🥀';
  $('overlayTitle').textContent = win ? 'Victory!' : 'Thorn wins…';
  $('overlayText').textContent = win
    ? 'Thorn wilts under your petals. The garden is yours, Sakura!'
    : 'Thorn’s brambles close in. Shuffle up and try a sharper deck!';
  $('overlayStats').innerHTML = `
    <span class="stat"><b>${state.turn}</b>turns</span>
    <span class="stat"><b>${state.stats.cardsPlayed}</b>cards played</span>
    <span class="stat"><b>${state.stats.damageDealt}</b>damage dealt</span>
    <span class="stat"><b>${state.stats.heals}</b>HP healed</span>`;
  $('overlay').classList.remove('hidden');
}

export function hideOverlay() {
  $('overlay').classList.add('hidden');
}
