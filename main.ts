// Bloom Clash — the hand-in program (Node 22, standard library only).
// The grader runs `node /bot/main.ts` with no network on a read-only tree
// and an empty writable /output. This program stages the game and its
// screenshots under that output directory, then writes /output/dossier.json
// with the vendored make.fun library so the sealed scorer can check the
// entry and the judge can read it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The caps the scorer enforces, mirrored here so a bad entry fails loudly
// at home instead of quietly on the server: at most 4 screenshots of
// 256 KiB, at most 993 files and 48 MiB under game/, paths under 1000
// bytes, and the dossier text capped at 160 KiB — all inside /output's
// 1000-entry, 64 MiB budget shared by game/, screenshots/ and dossier.json.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function stageGame() {
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error('game/index.html is missing — the entry has no game to hand in');
  }
  mkdirSync(outDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
  }
}

function main() {
  stageGame();
  const dossier = buildDossier(outDir, CAPS);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
}

main();
