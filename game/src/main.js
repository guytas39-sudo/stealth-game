// Midnight Archive: the game loop, the screens, and the wiring between the
// simulation, the renderer, the input and the sounds. A ?shot=start|play|end
// query stages one fixed scene and draws it once, for the screenshots.

import { BEST_KEY, FIELD, STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import {
  EVENT_CAUGHT,
  EVENT_PAGE,
  EVENT_SPOTTED,
  EVENT_WIN,
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  createWorld,
  stepWorld,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const world = createWorld();
const input = createInput(canvas);
const audio = createAudio();

let best = null;
try {
  best = localStorage.getItem(BEST_KEY);
} catch {
  best = null;
}

let paused = false;
let clickTarget = null;
let lastStepAt = 0;
let playerStepAt = 0;
let alertedAt = -10;

/** Scale the 1280x720 field onto the window, keeping its shape. */
function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
  ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function saveBest() {
  const text = formatTime(world.winTime);
  try {
    const old = localStorage.getItem(BEST_KEY);
    if (old === null || world.winTime < parseFloat(old)) localStorage.setItem(BEST_KEY, String(world.winTime));
  } catch {
    // Private mode: the best time simply does not persist.
  }
  best = text;
  return text;
}

/** The move direction for this frame: keys first, else the clicked floor tile. */
function moveDirection() {
  const keys = input.keyDirection();
  if (keys) {
    clickTarget = null;
    return keys;
  }
  if (clickTarget) {
    const dx = clickTarget.x - world.player.x;
    const dy = clickTarget.y - world.player.y;
    if (Math.hypot(dx, dy) < 8) {
      clickTarget = null;
      return { x: 0, y: 0 };
    }
    return { x: dx, y: dy };
  }
  return { x: 0, y: 0 };
}

function frame(now) {
  requestAnimationFrame(frame);
  const time = now / 1000;

  if (input.pressed('m')) audio.toggleMute();
  if (input.pressed('p') && world.screen === SCREEN_PLAY) paused = !paused;
  if (input.pressed('r')) {
    world.screen = SCREEN_PLAY;
    paused = false;
    clickTarget = null;
    const keepBest = best;
    Object.assign(world, createWorld());
    world.screen = SCREEN_PLAY;
    best = keepBest;
    audio.click();
  }

  const clicked = input.takeClick();
  if (clicked) {
    audio.unlock();
    if (world.screen === SCREEN_TITLE) {
      world.screen = SCREEN_PLAY;
      audio.click();
    } else if (world.screen === SCREEN_PLAY) {
      clickTarget = clicked;
    }
  }
  if (input.pressed('enter')) {
    audio.unlock();
    if (world.screen === SCREEN_TITLE) world.screen = SCREEN_PLAY;
  }

  if (!paused && world.screen === SCREEN_PLAY) {
    const events = stepWorld(world, moveDirection(), STEP);
    if (events & EVENT_PAGE) audio.pickup();
    if (events & EVENT_SPOTTED) {
      statusEl.textContent = 'A guard has spotted you — break line of sight!';
    }
    if (world.detection > 60 && world.time - alertedAt > 3) {
      alertedAt = world.time;
      audio.alert();
    }
    if (events & EVENT_CAUGHT) audio.caught();
    if (events & EVENT_WIN) {
      saveBest();
      audio.win();
      statusEl.textContent = 'You escaped unseen!';
    }
    // Footsteps: the player's own, and the nearest guard's, louder when close.
    if (world.player.moving && world.time - playerStepAt > 0.34) {
      playerStepAt = world.time;
      audio.playerStep();
    }
    let nearest = Infinity;
    for (const guard of world.guards) {
      nearest = Math.min(nearest, Math.hypot(guard.x - world.player.x, guard.y - world.player.y));
    }
    if (world.time - lastStepAt > 0.45) {
      lastStepAt = world.time;
      audio.footstep(nearest);
    }
  }

  render(ctx, world, time, best, paused);
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshot mode: stage one fixed scene, draw it once, and stop.
  fitCanvas();
  const staged = stageShot(shot, world);
  render(ctx, world, 1.5, best, false);
  document.title = `Midnight Archive — ${staged.screen}`;
} else {
  window.addEventListener('resize', fitCanvas);
  fitCanvas();
  requestAnimationFrame(frame);
}
