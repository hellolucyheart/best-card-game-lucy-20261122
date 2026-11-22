// Tiny WebAudio synth for Bloom Clash — no audio files, just oscillators.
// Every effect is a short named sequence; the mute flag survives a reload
// through localStorage, and M toggles it from anywhere in the game.
let ctx = null;
let muted = false;
try {
  muted = window.localStorage.getItem('bloom-clash-muted') === '1';
} catch {
  muted = false;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    window.localStorage.setItem('bloom-clash-muted', value ? '1' : '0');
  } catch {
    // Storage may be unavailable in a sandboxed frame; sound still works.
  }
  return muted;
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq, at, dur, type, vol) {
  const ac = audio();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ac.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(vol, ac.currentTime + at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.05);
}

const SEQUENCES = {
  play: [[660, 0, 0.09, 'triangle', 0.12]],
  hit: [[220, 0, 0.12, 'sawtooth', 0.1], [160, 0.05, 0.14, 'sawtooth', 0.08]],
  block: [[440, 0, 0.08, 'sine', 0.1], [520, 0.06, 0.1, 'sine', 0.09]],
  heal: [[523, 0, 0.1, 'sine', 0.1], [659, 0.08, 0.1, 'sine', 0.1], [784, 0.16, 0.16, 'sine', 0.1]],
  draw: [[880, 0, 0.06, 'triangle', 0.07], [1046, 0.05, 0.08, 'triangle', 0.07]],
  poison: [[330, 0, 0.12, 'square', 0.05], [277, 0.1, 0.16, 'square', 0.05]],
  turn: [[392, 0, 0.08, 'triangle', 0.09], [523, 0.07, 0.1, 'triangle', 0.09]],
  win: [[523, 0, 0.12, 'triangle', 0.12], [659, 0.12, 0.12, 'triangle', 0.12], [784, 0.24, 0.12, 'triangle', 0.12], [1046, 0.36, 0.3, 'triangle', 0.14]],
  lose: [[392, 0, 0.16, 'sawtooth', 0.07], [311, 0.16, 0.16, 'sawtooth', 0.07], [233, 0.32, 0.3, 'sawtooth', 0.07]],
};

export function playSound(name) {
  const seq = SEQUENCES[name];
  if (!seq) return;
  for (const [freq, at, dur, type, vol] of seq) blip(freq, at, dur, type, vol);
}
