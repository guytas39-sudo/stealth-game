// Every tuning number, colour and the whole level layout of Midnight Archive in
// one place. The playfield is a fixed 1280x720 logical area; the renderer scales
// it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 235,
  /** How far the player's little lantern light reaches. */
  light: 110,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 108,
  chaseSpeed: 168,
  /** Seconds a guard waits at each patrol waypoint, looking around. */
  waitAtWaypoint: 0.55,
  /** How far a guard can see, in pixels. */
  sightRange: 245,
  /** Half of a guard's vision cone, in radians. */
  sightHalfAngle: 0.62,
};

export const DETECTION = {
  /** Fill per second while seen at point-blank range; falls off with distance. */
  closeRate: 82,
  farRate: 16,
  /** Drain per second while no guard can see the player. */
  decayRate: 30,
  /** Above this the guards start chasing. */
  chaseAt: 35,
};

export const LIVES = 3;
export const PAGES_TO_WIN = 3;

/** Rectangles that block both movement and sight: { x, y, w, h, kind }. */
export const WALLS = [
  // Outer walls.
  { x: 0, y: 0, w: 1280, h: 24, kind: 'wall' },
  { x: 0, y: 696, w: 1280, h: 24, kind: 'wall' },
  { x: 0, y: 0, w: 24, h: 720, kind: 'wall' },
  { x: 1256, y: 0, w: 24, h: 720, kind: 'wall' },
  // Vertical wall A, with a gap in the middle (y 284..436).
  { x: 420, y: 24, w: 24, h: 260, kind: 'wall' },
  { x: 420, y: 436, w: 24, h: 260, kind: 'wall' },
  // Vertical wall B, with a gap (y 224..380).
  { x: 840, y: 24, w: 24, h: 200, kind: 'wall' },
  { x: 840, y: 380, w: 24, h: 316, kind: 'wall' },
  // Horizontal walls left and right, each leaving a doorway.
  { x: 24, y: 330, w: 260, h: 24, kind: 'wall' },
  { x: 996, y: 330, w: 260, h: 24, kind: 'wall' },
];

/** Bookcases: tall cover that blocks movement and sight. */
export const SHELVES = [
  { x: 110, y: 110, w: 150, h: 40, kind: 'shelf' },
  { x: 110, y: 540, w: 150, h: 40, kind: 'shelf' },
  { x: 500, y: 110, w: 150, h: 40, kind: 'shelf' },
  { x: 500, y: 560, w: 150, h: 40, kind: 'shelf' },
  { x: 1060, y: 110, w: 150, h: 40, kind: 'shelf' },
  { x: 1060, y: 540, w: 150, h: 40, kind: 'shelf' },
];

/** Crates: low square cover. */
export const CRATES = [
  { x: 330, y: 480, w: 60, h: 60, kind: 'crate' },
  { x: 680, y: 440, w: 60, h: 60, kind: 'crate' },
];

/** Every rectangle that blocks movement and sight. */
export const BLOCKERS = [...WALLS, ...SHELVES, ...CRATES];

/** Rugs: decoration only, drawn on the floor, never blocking. */
export const RUGS = [
  { x: 90, y: 380, w: 180, h: 120 },
  { x: 560, y: 260, w: 180, h: 130 },
  { x: 1010, y: 420, w: 180, h: 120 },
];

export const PLAYER_START = { x: 80, y: 640 };

/** The three lost pages to collect before the exit opens. */
export const PAGES = [
  { x: 180, y: 380 },
  { x: 640, y: 80 },
  { x: 1140, y: 420 },
];

/** The sealed exit door, top-right corner. */
export const EXIT = { x: 1150, y: 30, w: 76, h: 46 };

/** Guard patrols: waypoints each guard walks in a loop. */
export const GUARDS = [
  {
    name: 'Bram',
    waypoints: [
      { x: 180, y: 180 },
      { x: 360, y: 180 },
      { x: 360, y: 300 },
      { x: 180, y: 300 },
    ],
    speed: 105,
  },
  {
    name: 'Odo',
    waypoints: [
      { x: 540, y: 640 },
      { x: 760, y: 640 },
      { x: 760, y: 420 },
      { x: 540, y: 420 },
    ],
    speed: 110,
  },
  {
    name: 'Mira',
    waypoints: [
      { x: 1000, y: 180 },
      { x: 1180, y: 180 },
      { x: 1180, y: 300 },
      { x: 1000, y: 300 },
    ],
    speed: 105,
  },
  {
    name: 'Fen',
    waypoints: [
      { x: 640, y: 260 },
      { x: 640, y: 480 },
    ],
    speed: 115,
  },
];

export const PALETTE = {
  floor: '#241c15',
  floorLine: '#2e241a',
  rug: '#4a2f2a',
  rugEdge: '#6b453c',
  wall: '#3b4150',
  wallTop: '#565e70',
  shelf: '#5a3d24',
  shelfEdge: '#7a5636',
  crate: '#8a6a42',
  crateEdge: '#a8875c',
  page: '#f4e3b2',
  pageGlow: '#ffd977',
  exit: '#39d98a',
  exitLocked: '#5b6b60',
  player: '#f2b544',
  playerCloak: '#7a4a21',
  guard: '#7d8fb3',
  guardDark: '#4a5878',
  cone: 'rgba(255, 214, 110, 0.20)',
  coneSuspicious: 'rgba(255, 150, 60, 0.30)',
  coneAlert: 'rgba(255, 70, 60, 0.34)',
  panel: '#1a1512',
  text: '#efe6d4',
  muted: '#a99a80',
  danger: '#ff5a4e',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best escape time is kept between visits (this browser only). */
export const BEST_KEY = 'midnight-archive.best';
