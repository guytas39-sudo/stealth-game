// Midnight Archive, handed in by its entry program.
//
// The game itself is the static files under game/ (game/index.html plus its ES
// modules — canvas art, synthesized WebAudio, no libraries, no network). This
// program's only job is to hand those files in: it copies game/ and
// screenshots/ into the output directory and asks the vendored make.fun library
// to write the dossier.json the judge reads.
//
// Run it with Node 22. The grader sets MAKEFUN_OUTPUT_DIR to /output; outside
// the grader, point that variable at any empty directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// To play the game first, serve game/ with any static server and open
// game/index.html in desktop Chrome.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's caps for this bounty, from reference/gate.json: the dossier text
// is capped at 160 KiB, at most 4 screenshots of at most 256 KiB each, and the
// game itself at most 993 files and 48 MiB. Passing them here means an entry
// this program writes is one the scorer accepts.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn(sourceDir, outDir) {
  mkdirSync(outDir, { recursive: true });
  cpSync(join(sourceDir, 'game'), join(outDir, 'game'), { recursive: true });
  const shots = join(sourceDir, 'screenshots');
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });
  const taken = existsSync(shots) ? readdirSync(shots).length : 0;
  if (taken < 3) throw new Error(`expected at least 3 screenshots, found ${taken}`);
  writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
}

const entryDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
handIn(entryDir, outputDir);
