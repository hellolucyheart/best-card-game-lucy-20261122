// Bloom Clash — the table host. boot.js wires the buttons and keys, runs
// Thorn's turn one card at a time so each play can be seen, and stages the
// four screenshot scenes (?shot=start|play|clash|win) as fixed, seeded
// tableaux — no live play needed to photograph them.
import { seedFromQuery } from './rng.js';
import { cardById } from './cards.js';
import { beginEnemyTurn, beginPlayerTurn, createGame, playCard, playEnemyCard } from './state.js';
import { planEnemyTurn } from './ai.js';
import { clearPlayed, floatNumber, hideOverlay, render, showPlayed } from './render.js';
import { isMuted, playSound, setMuted } from './sound.js';

const sleep = (ms) => new Promise((r) => window.setTimeout(r, ms));

let state = null;
let busy = false;

function animateEvents(events) {
  for (const ev of events) {
    const panel = ev.target === 'player' ? 'playerPanel' : 'enemyPanel';
    if (ev.kind === 'damage') {
      floatNumber(panel, `−${ev.hpLost}`, 'dmg');
      if (ev.absorbed > 0) floatNumber(panel, `🛡️${ev.absorbed}`, 'block');
      playSound('hit');
    } else if (ev.kind === 'block') {
      floatNumber(panel, `+${ev.amount} 🛡️`, 'block');
      playSound('block');
    } else if (ev.kind === 'heal') {
      floatNumber(panel, `+${ev.amount}`, 'heal');
      playSound('heal');
    } else if (ev.kind === 'draw') {
      playSound('draw');
    } else if (ev.kind === 'poison' || ev.kind === 'poison-apply') {
      floatNumber(panel, `☠️${ev.amount}`, 'dmg');
      playSound('poison');
    } else if (ev.kind === 'energy') {
      playSound('draw');
    }
  }
}

function afterMove() {
  render(state, ui);
  if (state.winner) {
    playSound(state.winner === 'player' ? 'win' : 'lose');
  }
}

const ui = {
  async onPlay(index, el) {
    if (busy || state.phase !== 'player' || state.winner) return;
    const result = playCard(state, index);
    if (!result.ok) return;
    busy = true;
    if (el) el.classList.add('played-anim');
    playSound('play');
    showPlayed(result.card, 'player');
    animateEvents(result.events);
    afterMove();
    await sleep(420);
    busy = false;
    if (!state.winner) render(state, ui);
  },
};

async function runEnemyTurn() {
  busy = true;
  playSound('turn');
  beginEnemyTurn(state);
  render(state, ui);
  await sleep(600);
  const plan = planEnemyTurn(state, state.rand);
  for (const cardId of plan) {
    if (state.winner) break;
    const result = playEnemyCard(state, cardId);
    if (!result.ok) continue;
    showPlayed(result.card, 'enemy');
    animateEvents(result.events);
    afterMove();
    await sleep(850);
  }
  clearPlayed();
  if (!state.winner) {
    beginPlayerTurn(state);
    playSound('turn');
    afterMove();
  }
  busy = false;
}

function newGame(seed) {
  state = createGame(seed);
  window.__bloom = state;
  clearPlayed();
  hideOverlay();
  busy = false;
  render(state, ui);
}

// Fixed mid-duel tableaux for the screenshots. Each one starts from a
// fresh seeded game and then rewrites the visible state by hand, so the
// picture is identical on every load with the same ?seed=.
function stageShot(shot, seed) {
  newGame(seed);
  const log = state.log;
  if (shot === 'start') return;
  if (shot === 'play') {
    state.turn = 4;
    state.player.hp = 18; state.player.block = 5; state.player.energy = 2;
    state.player.hand = ['slash', 'guard', 'heavy', 'heal', 'sun'];
    state.player.deck = Array.from({ length: 12 }, (_, i) => ['slash', 'guard', 'jab', 'heal'][i % 4]);
    state.player.discard = ['jab', 'guard', 'sun', 'slash'];
    state.enemy.hp = 21; state.enemy.poison = 2;
    state.enemy.hand = ['jab', 'guard', 'heavy', 'spore'];
    state.log = [
      ...log,
      { who: 'player', html: '🌸 <b>You play Petal Slash</b> — 6 damage.' },
      { who: 'enemy', html: '🌵 <b>Thorn plays Bark Wall</b> — +13 Block.' },
      { who: 'player', html: '🍄 <b>You play Spore Cloud</b> — 3 damage. Apply 4 Poison.' },
      { who: 'system', html: '☠️ Poison bites Thorn for <b>4</b>.' },
      { who: 'system', html: '— Turn 4: your move. —' },
    ];
  } else if (shot === 'clash') {
    state.turn = 7;
    state.player.hp = 12; state.player.block = 0; state.player.energy = 0;
    state.player.hand = ['jab', 'guard'];
    state.player.deck = Array.from({ length: 6 }, () => 'slash');
    state.player.discard = ['storm', 'heavy', 'slash', 'fan', 'guard', 'heal', 'sun', 'spore'];
    state.enemy.hp = 6; state.enemy.poison = 3; state.enemy.weak = 1;
    state.enemy.hand = ['guard', 'heal'];
    state.log = [
      ...log,
      { who: 'player', html: '🌪️ <b>You play Petal Storm</b> — 13 damage!' },
      { who: 'enemy', html: '🌵 <b>Thorn plays Dew Drop</b> — restore 6 HP.' },
      { who: 'system', html: '☠️ Poison bites Thorn for <b>3</b>.' },
      { who: 'system', html: '— Turn 7: your move. —' },
    ];
    showPlayed(cardById('storm'), 'player');
  } else if (shot === 'win') {
    state.turn = 9;
    state.player.hp = 9; state.player.block = 4; state.player.energy = 1;
    state.player.hand = ['guard', 'heal', 'slash'];
    state.player.deck = Array.from({ length: 8 }, () => 'slash');
    state.enemy.hp = 0;
    state.enemy.hand = [];
    state.stats = { damageDealt: 42, damageTaken: 21, cardsPlayed: 17, heals: 12 };
    state.winner = 'player';
    state.phase = 'over';
    state.log = [
      ...log,
      { who: 'player', html: '🌪️ <b>You play Petal Storm</b> — 13 damage!' },
      { who: 'system', html: '<span class="good">🏆 Thorn wilts! You win the duel!</span>' },
    ];
  }
  render(state, ui);
}

function init() {
  const params = new URLSearchParams(window.location.search);
  const seed = seedFromQuery(window.location.search);
  const shot = params.get('shot');
  if (shot) stageShot(shot, seed);
  else newGame(seed);

  document.getElementById('endTurnBtn').addEventListener('click', () => {
    if (busy || state.phase !== 'player' || state.winner) return;
    void runEnemyTurn();
  });
  document.getElementById('restartBtn').addEventListener('click', () => {
    newGame((Math.random() * 0xffffffff) >>> 0);
  });
  document.getElementById('againBtn').addEventListener('click', () => {
    newGame((Math.random() * 0xffffffff) >>> 0);
  });
  const soundBtn = document.getElementById('soundBtn');
  const paintSound = () => { soundBtn.textContent = isMuted() ? '🔇 Muted' : '🔊 Sound'; };
  soundBtn.addEventListener('click', () => { setMuted(!isMuted()); paintSound(); });
  paintSound();

  window.addEventListener('keydown', (ev) => {
    if (ev.key >= '1' && ev.key <= '5') {
      const i = Number(ev.key) - 1;
      const cards = document.querySelectorAll('#hand .card');
      if (cards[i]) cards[i].click();
    } else if (ev.code === 'Space') {
      ev.preventDefault();
      document.getElementById('endTurnBtn').click();
    } else if (ev.key === 'm' || ev.key === 'M') {
      setMuted(!isMuted());
      paintSound();
    } else if (ev.key === 'r' || ev.key === 'R') {
      newGame((Math.random() * 0xffffffff) >>> 0);
    }
  });
}

init();
