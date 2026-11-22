// The simulation of Midnight Archive: one fixed-step world with no rendering and
// no randomness, so the same inputs always give the same world. The player sneaks
// through the archive, guards patrol with vision cones, pages are collected and
// the exit opens once all three are found.

import {
  BLOCKERS,
  DETECTION,
  EXIT,
  FIELD,
  GUARD,
  GUARDS,
  LIVES,
  PAGES,
  PAGES_TO_WIN,
  PLAYER,
  PLAYER_START,
  STEP,
} from './config.js';

export const EVENT_NONE = 0;
export const EVENT_PAGE = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_GAMEOVER = 16;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

/** True when the circle at (x, y) with radius r overlaps the rectangle. */
export function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

/** True when the segment (x1,y1)-(x2,y2) touches the rectangle (a wall or shelf). */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Either end inside the rectangle.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const dx = x2 - x1;
  const dy = y2 - y1;
  // Test the four edges; a hit on any of them blocks the sight line.
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const ex = ex2 - ex1;
    const ey = ey2 - ey1;
    const den = dx * ey - dy * ex;
    if (den === 0) continue;
    const t = ((ex1 - x1) * ey - (ey1 - y1) * ex) / den;
    const u = ((ex1 - x1) * dy - (ey1 - y1) * dx) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when no wall or shelf stands between (x1,y1) and (x2,y2). */
export function lineOfSight(x1, y1, x2, y2) {
  for (const rect of BLOCKERS) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/** True when (px,py) lies inside the guard's vision cone with a clear sight line. */
export function guardSees(guard, px, py) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.sightRange) return false;
  if (dist < 26) return lineOfSight(guard.x, guard.y, px, py);
  const angle = Math.atan2(dy, dx);
  let diff = angle - guard.facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > GUARD.sightHalfAngle) return false;
  return lineOfSight(guard.x, guard.y, px, py);
}

/** A fresh world, ready for a run. */
export function createWorld() {
  return {
    time: 0,
    screen: SCREEN_TITLE,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, moving: false },
    guards: GUARDS.map((def, index) => ({
      name: def.name,
      waypoints: def.waypoints,
      speed: def.speed,
      x: def.waypoints[0].x,
      y: def.waypoints[0].y,
      facing: 0,
      waypoint: 1,
      wait: 0,
      state: 'patrol',
      seeing: false,
      searchX: 0,
      searchY: 0,
      searchTime: 0,
      stepPhase: index * 0.35,
    })),
    pages: PAGES.map((p) => ({ x: p.x, y: p.y, taken: false })),
    pagesTaken: 0,
    detection: 0,
    lives: LIVES,
    spotted: 0,
    caughtFlash: 0,
    winTime: 0,
  };
}

export function resetWorld(world) {
  const fresh = createWorld();
  fresh.screen = world.screen;
  Object.assign(world, fresh);
}

/** Move a circle through the level, sliding along walls, one axis at a time. */
function moveCircle(world, body, dx, dy) {
  const r = body === world.player ? PLAYER.radius : GUARD.radius;
  const nx = body.x + dx;
  if (!BLOCKERS.some((rect) => circleHitsRect(nx, body.y, r, rect))) body.x = nx;
  const ny = body.y + dy;
  if (!BLOCKERS.some((rect) => circleHitsRect(body.x, ny, r, rect))) body.y = ny;
  body.x = Math.max(24 + r, Math.min(FIELD.width - 24 - r, body.x));
  body.y = Math.max(24 + r, Math.min(FIELD.height - 24 - r, body.y));
}

/** Step one guard: patrol, chase the player, or search the last seen spot. */
function stepGuard(world, guard, dt) {
  const player = world.player;
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const seeing = guardSees(guard, player.x, player.y);

  if (seeing && !guard.seeing) world.spottedPending = true;
  guard.seeing = seeing;

  if (guard.state === 'chase') {
    if (!seeing && world.detection < DETECTION.chaseAt * 0.4) {
      guard.state = 'search';
      guard.searchX = player.x;
      guard.searchY = player.y;
      guard.searchTime = 2.2;
    } else {
      const step = (GUARD.chaseSpeed * dt) / Math.max(dist, 1);
      moveCircle(world, guard, dx * step, dy * step);
      guard.facing = Math.atan2(dy, dx);
    }
    return;
  }

  if (guard.state === 'search') {
    guard.searchTime -= dt;
    const sdx = guard.searchX - guard.x;
    const sdy = guard.searchY - guard.y;
    const sdist = Math.hypot(sdx, sdy);
    if (sdist > 8) {
      const step = (GUARD.patrolSpeed * 1.25 * dt) / Math.max(sdist, 1);
      moveCircle(world, guard, sdx * step, sdy * step);
      guard.facing = Math.atan2(sdy, sdx);
    } else {
      // Arrived: look around, then give up and go back to the patrol.
      guard.facing += dt * 1.6;
      if (guard.searchTime <= 0) guard.state = 'patrol';
    }
    if (seeing && world.detection >= DETECTION.chaseAt) guard.state = 'chase';
    return;
  }

  // Patrol: walk the waypoints, waiting briefly at each one.
  if (seeing && world.detection >= DETECTION.chaseAt) {
    guard.state = 'chase';
    return;
  }
  if (guard.wait > 0) {
    guard.wait -= dt;
    guard.facing += dt * 0.9;
    return;
  }
  const target = guard.waypoints[guard.waypoint];
  const tdx = target.x - guard.x;
  const tdy = target.y - guard.y;
  const tdist = Math.hypot(tdx, tdy);
  if (tdist < 6) {
    guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
    guard.wait = GUARD.waitAtWaypoint;
    return;
  }
  const step = (guard.speed * dt) / tdist;
  moveCircle(world, guard, tdx * step, tdy * step);
  guard.facing = Math.atan2(tdy, tdx);
}

/**
 * Advance the world one fixed step. `input` is { x, y } (a unit move direction)
 * and is only honoured while the game is being played. Returns an event bitmask.
 */
export function stepWorld(world, input, dt = STEP) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  world.time += dt;
  world.spottedPending = false;

  // The player walks, sliding along walls.
  const moving = input.x !== 0 || input.y !== 0;
  world.player.moving = moving;
  if (moving) {
    const len = Math.hypot(input.x, input.y) || 1;
    moveCircle(world, world.player, (input.x / len) * PLAYER.speed * dt, (input.y / len) * PLAYER.speed * dt);
  }

  // Pick up a lost page by walking over it.
  for (const page of world.pages) {
    if (!page.taken && Math.hypot(page.x - world.player.x, page.y - world.player.y) < 26) {
      page.taken = true;
      world.pagesTaken += 1;
      events |= EVENT_PAGE;
    }
  }

  // Guards move, watch and chase; the detection meter fills while any guard sees
  // the player and drains while nobody does.
  let anySeeing = false;
  let nearestSeen = Infinity;
  for (const guard of world.guards) {
    stepGuard(world, guard, dt);
    if (guard.seeing) {
      anySeeing = true;
      nearestSeen = Math.min(nearestSeen, Math.hypot(guard.x - world.player.x, guard.y - world.player.y));
    }
  }
  if (world.spottedPending) {
    world.spotted += 1;
    events |= EVENT_SPOTTED;
  }
  if (anySeeing) {
    const closeness = 1 - nearestSeen / GUARD.sightRange;
    world.detection += (DETECTION.farRate + (DETECTION.closeRate - DETECTION.farRate) * closeness) * dt;
  } else {
    world.detection -= DETECTION.decayRate * dt;
  }
  world.detection = Math.max(0, Math.min(100, world.detection));

  if (world.caughtFlash > 0) world.caughtFlash -= dt;

  // Caught: lose a life, or the run is over.
  if (world.detection >= 100) {
    world.lives -= 1;
    world.detection = 0;
    world.caughtFlash = 1.2;
    events |= EVENT_CAUGHT;
    if (world.lives <= 0) {
      world.screen = SCREEN_OVER;
      return events | EVENT_GAMEOVER;
    }
    world.player.x = PLAYER_START.x;
    world.player.y = PLAYER_START.y;
    for (const guard of world.guards) {
      guard.x = guard.waypoints[0].x;
      guard.y = guard.waypoints[0].y;
      guard.waypoint = 1;
      guard.wait = 0;
      guard.state = 'patrol';
      guard.seeing = false;
      guard.facing = 0;
    }
    return events;
  }

  // The exit opens once every page is found; reaching it wins the run.
  if (world.pagesTaken >= PAGES_TO_WIN) {
    const p = world.player;
    if (p.x > EXIT.x - 8 && p.x < EXIT.x + EXIT.w + 8 && p.y > EXIT.y - 8 && p.y < EXIT.y + EXIT.h + 8) {
      world.screen = SCREEN_WIN;
      world.winTime = world.time;
      return events | EVENT_WIN;
    }
  }
  return events;
}

/** The exit is open when every lost page has been found. */
export function exitOpen(world) {
  return world.pagesTaken >= PAGES_TO_WIN;
}
