# best-card-game-lucy-20261122

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/hellolucyheart/best-card-game-lucy-20261122/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/hellolucyheart/best-card-game-lucy-20261122/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

**Bloom Clash** is a petal-powered card duel. You play Sakura, a gardener with a deck of twelve tricks, against Thorn, the Bramble King — first to 0 HP loses. Every turn you draw cards, spend petals to play them, and try to outwit an AI rival that guards when hurt, heals when desperate, and punishes an open hand.

The deck mixes direct damage (Petal Slash, Bloom Burst, the 13-damage Petal Storm), defence (Leaf Guard, Bark Wall), recovery (Dew Drop), card flow (Sunbeam, Petal Fan), and dirty tricks: Thorn Jab and Spore Cloud stack Poison that burns at the start of a turn, Vine Snare weakens the foe's next hits, and Morning Dew buys extra petals. Thorn runs the same catalogue through a greedy heuristic that re-scores its hand after every play, and it telegraphs its mood above its portrait so you can plan around it.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step and no network: the game is plain static files under `game/`, and every sound is synthesized live with WebAudio.

**Controls** — click a card or press 1–5 to play it, Space (or the End turn button) to pass to Thorn, M to mute, R for a new duel. Poison ticks at the start of your turn, Block fades when your next turn begins, and a run of 200 simulated duels put a decent greedy player at an 84% win rate — winnable, but Thorn bites back.

## How it is built

- `game/index.html` + `game/styles.css` — the table: fighter panels, hand, log, overlays.
- `game/src/state.js` — the rules engine: decks, hands, Block / Poison / Weaken, win check.
- `game/src/cards.js` — the twelve-card catalogue and the 24-card starter deck.
- `game/src/ai.js` — Thorn's greedy brain and its one-line telegraph.
- `game/src/render.js` — the table renderer: cards, HP bars, floating numbers.
- `game/src/boot.js` — wiring, turn sequencing, and the four staged screenshot scenes (`?shot=start|play|clash|win` with `?seed=`).
- `game/src/rng.js` + `game/src/sound.js` — seeded randomness and the WebAudio synth.
- `main.ts` — the hand-in program: stages the game and its screenshots under the output directory and writes `dossier.json` (run `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`).

Screenshots live under `screenshots/` (four staged captures at 1280×800, each under 256 KiB).

---

<sub>Entered on [make.fun](https://make.fun/?ref=68wvraae&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
