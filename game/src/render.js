// All drawing of Midnight Archive on one canvas: the archive floor, the walls and
// bookcases, the guards with their vision cones, the player with a small lantern
// glow, and the HUD and screens. Nothing here changes the simulation.

import {
  BLOCKERS,
  CRATES,
  EXIT,
  FIELD,
  FONT,
  GUARD,
  PALETTE,
  PLAYER,
  RUGS,
  SHELVES,
  WALLS,
} from './config.js';
import { exitOpen } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** A stable colour picked from a small shelf of book-spine colours. */
function spineColour(shelfIndex, spineIndex) {
  const colours = ['#a8442f', '#c98a2e', '#4a7a5c', '#3e5f8a', '#7a4a6e', '#8a7a3e', '#5c4a8a'];
  return colours[(shelfIndex * 7 + spineIndex * 3) % colours.length];
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Floorboards: faint horizontal seams every 46 pixels.
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 2;
  for (let y = 46; y < FIELD.height; y += 46) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
  for (const rug of RUGS) {
    ctx.fillStyle = PALETTE.rugEdge;
    ctx.fillRect(rug.x - 6, rug.y - 6, rug.w + 12, rug.h + 12);
    ctx.fillStyle = PALETTE.rug;
    ctx.fillRect(rug.x, rug.y, rug.w, rug.h);
    ctx.strokeStyle = 'rgba(240, 210, 160, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(rug.x + 10, rug.y + 10, rug.w - 20, rug.h - 20);
  }
}

function drawWalls(ctx) {
  for (const wall of WALLS) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTop;
    if (wall.w > wall.h) ctx.fillRect(wall.x, wall.y, wall.w, 5);
    else ctx.fillRect(wall.x, wall.y, 5, wall.h);
  }
}

function drawShelves(ctx) {
  SHELVES.forEach((shelf, shelfIndex) => {
    ctx.fillStyle = PALETTE.shelf;
    ctx.fillRect(shelf.x, shelf.y, shelf.w, shelf.h);
    ctx.fillStyle = PALETTE.shelfEdge;
    ctx.fillRect(shelf.x, shelf.y, shelf.w, 4);
    // Book spines along the front of the case.
    for (let i = 0; i < 12; i += 1) {
      ctx.fillStyle = spineColour(shelfIndex, i);
      ctx.fillRect(shelf.x + 6 + i * 12, shelf.y + 8, 9, shelf.h - 14);
    }
  });
  for (const crate of CRATES) {
    ctx.fillStyle = PALETTE.crate;
    ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
    ctx.strokeStyle = PALETTE.crateEdge;
    ctx.lineWidth = 3;
    ctx.strokeRect(crate.x + 4, crate.y + 4, crate.w - 8, crate.h - 8);
    ctx.beginPath();
    ctx.moveTo(crate.x + 4, crate.y + 4);
    ctx.lineTo(crate.x + crate.w - 4, crate.y + crate.h - 4);
    ctx.moveTo(crate.x + crate.w - 4, crate.y + 4);
    ctx.lineTo(crate.x + 4, crate.y + crate.h - 4);
    ctx.stroke();
  }
}

function drawPages(ctx, world, time) {
  for (const page of world.pages) {
    if (page.taken) continue;
    const pulse = 0.55 + 0.25 * Math.sin(time * 3 + page.x);
    const glow = ctx.createRadialGradient(page.x, page.y, 4, page.x, page.y, 46);
    glow.addColorStop(0, `rgba(255, 217, 119, ${pulse})`);
    glow.addColorStop(1, 'rgba(255, 217, 119, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(page.x, page.y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(page.x, page.y);
    ctx.rotate(-0.25);
    ctx.fillStyle = PALETTE.page;
    ctx.fillRect(-11, -14, 22, 28);
    ctx.strokeStyle = '#b89a5e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-11, -14, 22, 28);
    ctx.strokeStyle = '#6b5a34';
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, -6);
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(-6, 6);
    ctx.lineTo(2, 6);
    ctx.stroke();
    ctx.restore();
  }
}

function drawExit(ctx, world, time) {
  const open = exitOpen(world);
  const glow = ctx.createRadialGradient(
    EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 4,
    EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 90,
  );
  const colour = open ? '57, 217, 138' : '120, 130, 120';
  const pulse = open ? 0.5 + 0.2 * Math.sin(time * 4) : 0.18;
  glow.addColorStop(0, `rgba(${colour}, ${pulse})`);
  glow.addColorStop(1, `rgba(${colour}, 0)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
  roundRect(ctx, EXIT.x, EXIT.y, EXIT.w, EXIT.h, 6);
  ctx.fill();
  ctx.fillStyle = '#0d2b1a';
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(open ? 'EXIT' : 'SEALED', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 1);
  if (!open) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `12px ${FONT}`;
    ctx.fillText(`${world.pagesTaken} / 3 pages`, EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h + 16);
  }
}

function drawCone(ctx, guard) {
  const colour =
    guard.state === 'chase'
      ? PALETTE.coneAlert
      : guard.seeing
        ? PALETTE.coneSuspicious
        : PALETTE.cone;
  const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, GUARD.sightRange);
  grad.addColorStop(0, colour);
  grad.addColorStop(1, 'rgba(255, 214, 110, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, GUARD.sightRange, guard.facing - GUARD.sightHalfAngle, guard.facing + GUARD.sightHalfAngle);
  ctx.closePath();
  ctx.fill();
  // A thin bright edge on the cone so its reach reads at a glance.
  ctx.strokeStyle = colour.replace(/[\d.]+\)$/, '0.55)');
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, GUARD.sightRange, guard.facing - GUARD.sightHalfAngle, guard.facing + GUARD.sightHalfAngle);
  ctx.closePath();
  ctx.stroke();
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) drawCone(ctx, guard);
  for (const guard of world.guards) {
    // Lantern light around the guard.
    const light = ctx.createRadialGradient(guard.x, guard.y, 6, guard.x, guard.y, 70);
    light.addColorStop(0, 'rgba(255, 220, 140, 0.22)');
    light.addColorStop(1, 'rgba(255, 220, 140, 0)');
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 70, 0, Math.PI * 2);
    ctx.fill();
    // Body: a night watchman in a dark blue coat.
    ctx.fillStyle = PALETTE.guardDark;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius - 4, 0, Math.PI * 2);
    ctx.fill();
    // Facing: a small lantern held out in front.
    const lx = guard.x + Math.cos(guard.facing) * (GUARD.radius + 4);
    const ly = guard.y + Math.sin(guard.facing) * (GUARD.radius + 4);
    ctx.fillStyle = '#ffd977';
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fill();
    // "?" while suspicious, "!" while chasing.
    if (guard.state === 'chase' || guard.seeing) {
      ctx.fillStyle = guard.state === 'chase' ? '#ff5a4e' : '#ffb347';
      ctx.font = `bold 20px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - GUARD.radius - 4);
    }
  }
}

function drawPlayer(ctx, world) {
  const p = world.player;
  const glow = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, PLAYER.light);
  glow.addColorStop(0, 'rgba(255, 200, 110, 0.32)');
  glow.addColorStop(1, 'rgba(255, 200, 110, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER.light, 0, Math.PI * 2);
  ctx.fill();
  // A hooded archivist: cloak, hood and a warm lantern.
  ctx.fillStyle = PALETTE.playerCloak;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER.radius - 5, 0, Math.PI * 2);
  ctx.fill();
  // A bright ring, so the player reads at a glance even inside a cone.
  ctx.strokeStyle = 'rgba(242, 181, 68, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER.radius + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#3a2a12';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 2, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHud(ctx, world) {
  ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 40);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const minutes = Math.floor(world.time / 60);
  const seconds = Math.floor(world.time % 60).toString().padStart(2, '0');
  ctx.fillText(`⏱ ${minutes}:${seconds}`, 16, 21);
  ctx.fillText(`✦ Pages ${world.pagesTaken} / 3`, 150, 21);
  ctx.fillText(`♥`.repeat(Math.max(world.lives, 0)) + `♡`.repeat(Math.max(3 - world.lives, 0)), 300, 21);
  ctx.fillText(`👁 Spotted ${world.spotted}`, 420, 21);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('WASD / arrows move · click to walk · R restart · P pause · M mute', FIELD.width - 16, 21);

  // The detection meter, front and centre.
  const mw = 260;
  const mx = (FIELD.width - mw) / 2;
  const my = 52;
  ctx.fillStyle = 'rgba(10, 8, 6, 0.72)';
  roundRect(ctx, mx - 8, my - 8, mw + 16, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#33291f';
  roundRect(ctx, mx, my, mw, 10, 5);
  ctx.fill();
  if (world.detection > 0) {
    const frac = world.detection / 100;
    ctx.fillStyle = frac > 0.65 ? PALETTE.danger : '#ffb347';
    roundRect(ctx, mx, my, mw * frac, 10, 5);
    ctx.fill();
  }
  ctx.fillStyle = world.detection > 0 ? PALETTE.text : PALETTE.muted;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(world.detection > 65 ? 'SEEN — HIDE!' : 'detection', FIELD.width / 2, my + 24);
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(8, 6, 5, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 64px ${FONT}`;
  ctx.fillText('MIDNIGHT ARCHIVE', FIELD.width / 2, 210);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `22px ${FONT}`;
  ctx.fillText('A stealth game in one quiet museum after dark', FIELD.width / 2, 258);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('You are Wren, the night archivist. The wardens patrol with lanterns —', FIELD.width / 2, 320);
  ctx.fillText('their cones of light are the law. Find the 3 lost pages, then slip out', FIELD.width / 2, 346);
  ctx.fillText('through the green exit door, unseen.', FIELD.width / 2, 372);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `17px ${FONT}`;
  ctx.fillText('Move: WASD or arrow keys · or click a floor tile to walk there', FIELD.width / 2, 430);
  ctx.fillText('Hide behind shelves and crates — walls and cases block a guard’s sight', FIELD.width / 2, 456);
  ctx.fillText('If a guard sees you the meter fills; break line of sight to let it drain', FIELD.width / 2, 482);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Click or press Enter to begin', FIELD.width / 2, 540);
  if (best !== null) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText(`Best escape: ${best}`, FIELD.width / 2, 580);
  }
}

function drawWin(ctx, world, best) {
  ctx.fillStyle = 'rgba(8, 20, 12, 0.80)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.exit;
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillText('UNSEEN', FIELD.width / 2, 240);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `22px ${FONT}`;
  ctx.fillText('You slipped out with the pages, and no lantern ever found you.', FIELD.width / 2, 292);
  ctx.font = `19px ${FONT}`;
  ctx.fillText(`Escape time ${Math.floor(world.winTime / 60)}:${Math.floor(world.winTime % 60).toString().padStart(2, '0')}  ·  Spotted ${world.spotted} times  ·  ${world.lives} ${world.lives === 1 ? 'life' : 'lives'} left`, FIELD.width / 2, 350);
  if (best !== null) ctx.fillText(`Best escape: ${best}`, FIELD.width / 2, 384);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Press R to play again', FIELD.width / 2, 450);
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(24, 6, 5, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.danger;
  ctx.font = `bold 56px ${FONT}`;
  ctx.fillText('CAUGHT', FIELD.width / 2, 250);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `22px ${FONT}`;
  ctx.fillText('The lanterns found you three times. The archive keeps its pages.', FIELD.width / 2, 302);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Press R to try again', FIELD.width / 2, 370);
}

/** Draw the whole game at the given animation time (seconds). */
export function render(ctx, world, time, best, paused) {
  drawFloor(ctx);
  drawShelves(ctx);
  drawPages(ctx, world, time);
  drawExit(ctx, world, time);
  drawWalls(ctx);
  drawGuards(ctx, world);
  if (world.screen === SCREEN_PLAY || world.screen === SCREEN_WIN || world.screen === SCREEN_OVER) drawPlayer(ctx, world);
  if (world.screen === SCREEN_PLAY) drawHud(ctx, world);
  if (world.screen === SCREEN_PLAY && world.caughtFlash > 0) {
    ctx.fillStyle = `rgba(255, 60, 40, ${Math.min(0.35, world.caughtFlash * 0.3)})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', FIELD.width / 2, FIELD.height / 2 - 40);
  }
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (world.screen === SCREEN_WIN) drawWin(ctx, world, best);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  if (paused) {
    ctx.fillStyle = 'rgba(8, 6, 5, 0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2);
  }
}
