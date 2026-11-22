// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a simple
// autopilot, so the frame is what a short game really looks like and the same
// seed always gives the same frame. The world is fully deterministic, so the
// seed only exists to match the kit's screenshot convention.
//
// The autopilot is a greedy walker with a waypoint map: it routes through the
// doorways of the level (a straight greedy walk gets stuck behind a bookcase),
// then picks, each step, the direction that gets it closest to the next
// waypoint without stepping into a guard's cone.

import { BLOCKERS, EXIT, PLAYER, STEP } from './config.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_WIN,
  circleHitsRect,
  guardSees,
  resetWorld,
  segmentHitsRect,
  stepWorld,
} from './world.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 26;
const END_LIMIT_SECONDS = 600;

/** Junctions of the level's open floor, one per room and doorway. */
const WAYPOINTS = [
  { x: 80, y: 640 },
  { x: 80, y: 400 },
  { x: 350, y: 400 },
  { x: 350, y: 640 },
  { x: 640, y: 640 },
  { x: 640, y: 360 },
  { x: 700, y: 120 },
  { x: 700, y: 640 },
  { x: 1000, y: 640 },
  { x: 930, y: 300 },
  { x: 1180, y: 300 },
  { x: 350, y: 120 },
  { x: 1000, y: 120 },
  { x: 1050, y: 60 },
  { x: 1180, y: 640 },
];

/** The eight compass directions plus standing still. */
const DIRECTIONS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

/** True when a player-sized circle could walk straight from (x1,y1) to (x2,y2). */
function walkClear(x1, y1, x2, y2) {
  for (const rect of BLOCKERS) {
    const fat = { x: rect.x - 16, y: rect.y - 16, w: rect.w + 32, h: rect.h + 32 };
    if (segmentHitsRect(x1, y1, x2, y2, fat)) return false;
  }
  return true;
}

function nearestWaypoint(x, y) {
  let best = 0;
  let bestDist = Infinity;
  WAYPOINTS.forEach((point, index) => {
    const dist = Math.hypot(point.x - x, point.y - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = index;
    }
  });
  return best;
}

/** Breadth-first route through the waypoints, from the player to (tx, ty). */
function routeTo(world, tx, ty) {
  const from = nearestWaypoint(world.player.x, world.player.y);
  const to = nearestWaypoint(tx, ty);
  const previous = new Array(WAYPOINTS.length).fill(-1);
  const queue = [from];
  previous[from] = from;
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === to) break;
    for (let next = 0; next < WAYPOINTS.length; next += 1) {
      if (previous[next] !== -1) continue;
      if (!walkClear(WAYPOINTS[current].x, WAYPOINTS[current].y, WAYPOINTS[next].x, WAYPOINTS[next].y)) continue;
      previous[next] = current;
      queue.push(next);
    }
  }
  if (previous[to] === -1) return [WAYPOINTS[to]];
  const path = [];
  let node = to;
  while (node !== from) {
    path.unshift(WAYPOINTS[node]);
    node = previous[node];
  }
  path.unshift(WAYPOINTS[from]);
  return path;
}

/** Where the autopilot wants to go next: the nearest lost page, else the exit. */
function autopilotTarget(world, goToExit) {
  let best = null;
  let bestDist = Infinity;
  for (const page of world.pages) {
    if (page.taken) continue;
    const dist = Math.hypot(page.x - world.player.x, page.y - world.player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = page;
    }
  }
  if (best) return best;
  if (goToExit) return { x: EXIT.x + EXIT.w / 2, y: EXIT.y + EXIT.h / 2 };
  // All pages found and the play scene is not trying to win: linger near the
  // exit, where the last guard patrols, instead of walking through the door.
  return { x: 930, y: 300 };
}

/**
 * Pick a direction: route toward the target through the waypoints, then take the
 * step that gets closest to the next waypoint without stepping into a guard's
 * cone. `cautious` keeps well clear of cones; a hurried pilot does not look
 * at them at all.
 */
function autopilot(world, cautious, goToExit) {
  const target = autopilotTarget(world, goToExit);
  let goal = target;
  if (Math.hypot(target.x - world.player.x, target.y - world.player.y) > 110) {
    const path = routeTo(world, target.x, target.y);
    // path[0] is the waypoint nearest the player — the one the player is
    // standing on or just left — so the next waypoint is the first goal.
    for (let index = 1; index < path.length; index += 1) {
      if (Math.hypot(path[index].x - world.player.x, path[index].y - world.player.y) > 24) {
        goal = path[index];
        break;
      }
    }
  }
  // A chasing guard changes the job: run from it first, and only then think
  // about pages. The chase is slower than the player, so distance is safety.
  const chaser = world.guards.find((guard) => guard.state === 'chase');
  let best = DIRECTIONS[0];
  let bestCost = Infinity;
  for (const dir of DIRECTIONS) {
    // Look a short step ahead: a long lookahead steps through walls the
    // player cannot cross, and then "stay" beats every real move.
    const nx = world.player.x + dir.x * 24;
    const ny = world.player.y + dir.y * 24;
    let cost;
    if (chaser) {
      cost = -Math.hypot(chaser.x - nx, chaser.y - ny);
    } else {
      cost = Math.hypot(goal.x - nx, goal.y - ny);
    }
    if (BLOCKERS.some((rect) => circleHitsRect(nx, ny, PLAYER.radius, rect))) cost += 5000;
    if (cautious) {
      for (const guard of world.guards) {
        if (guardSees(guard, nx, ny)) cost += 3000;
        const near = Math.hypot(guard.x - nx, guard.y - ny);
        if (near < 80) cost += 900 - near * 8;
      }
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = dir;
    }
  }
  return best;
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it and the best time to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name !== 'play' && name !== 'end') {
    // Five seconds of patrols running behind the title screen.
    world.screen = SCREEN_PLAY;
    for (let i = 0; i < START_SECONDS / STEP; i += 1) stepWorld(world, { x: 0, y: 0 }, STEP);
    world.screen = SCREEN_TITLE;
    world.time = 0;
    return { screen: SCREEN_TITLE, best: null };
  }

  world.screen = SCREEN_PLAY;
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const cautious = name !== 'end';
  const goToExit = name === 'end';
  for (let i = 0; i < limit / STEP; i += 1) {
    stepWorld(world, autopilot(world, cautious, goToExit), STEP);
    if (world.screen !== SCREEN_PLAY) break;
  }
  if (world.screen === SCREEN_WIN) return { screen: SCREEN_WIN, best: null };
  if (world.screen === SCREEN_OVER) return { screen: SCREEN_OVER, best: null };
  return { screen: SCREEN_PLAY, best: null };
}
