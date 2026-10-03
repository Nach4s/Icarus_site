// ─── State ────────────────────────────────────────────────────
let canvas, ctx;
let gameState = 'MENU';   // MENU | PLAYING | PAUSED | GAMEOVER | RECORDS | SKINS
let lastTime = 0;
let score = 0;
let bestScore = parseInt(localStorage.getItem('icarusBest') || '0', 10);
let startTime = 0;        // performance.now() at game start
let diffLevel = 1;
let muted = false;
let animFrameId = null;

// Input state
const keys = {};
// Floating touch joystick: x/y is the analog direction (-1…1), set in input.js
const touchStick = { active: false, id: null, ox: 0, oy: 0, x: 0, y: 0 };

// ─── Touch-screen scaling ─────────────────────────────────────
// On phones the game canvas renders at a larger logical resolution and CSS
// scales it down, so the playfield is roughly as roomy as on a desktop.
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
const MIN_LOGICAL_SIDE = 620; // px — smallest playfield side on touch screens

let canvasTextBoost = 1;      // enlarges pixel-font labels on the scaled canvas
let topSafeY = 0;             // canvas y below the DOM HUD (touch screens only)

function sizeGameCanvas(c) {
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const k = IS_TOUCH ? Math.max(1, MIN_LOGICAL_SIDE / minSide) : 1;
  c.width = Math.round(window.innerWidth * k);
  c.height = Math.round(window.innerHeight * k);
  canvasTextBoost = 1 + (k - 1) * 0.85;
  // Event pills/banners are drawn at fixed canvas y; on the downscaled phone
  // canvas they would land under SCORE/LEVEL, so keep them below the HUD
  const hud = document.getElementById('hud');
  topSafeY = IS_TOUCH && hud ? Math.round(hud.offsetHeight * k) : 0;
}

// Phones (iOS/Android) draw symbols like ☠ ⚡ ☣ ⚠ as colour emoji, ignoring
// fillStyle; append U+FE0E so they render as tinted text glyphs like on Windows.
const CANVAS_SYMBOLS = /([☀-➿])(?![︎️])/g;
const origFillText = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
  if (typeof text === 'string') text = text.replace(CANVAS_SYMBOLS, '$1︎');
  return origFillText.call(this, text, ...rest);
};

// Vector icons for spots where a glyph would still turn into an emoji on phones
function drawShieldIcon(ctx, x, y, size, color) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.72, s * 0.9, -s * 0.72);
  ctx.lineTo(s * 0.9, -s * 0.05);
  ctx.quadraticCurveTo(s * 0.85, s * 0.62, 0, s);
  ctx.quadraticCurveTo(-s * 0.85, s * 0.62, -s * 0.9, -s * 0.05);
  ctx.lineTo(-s * 0.9, -s * 0.72);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.72, 0, -s);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawBoltIcon(ctx, x, y, size, color) {
  const s = size / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(s * 0.25, -s);
  ctx.lineTo(-s * 0.55, s * 0.12);
  ctx.lineTo(-s * 0.02, s * 0.12);
  ctx.lineTo(-s * 0.25, s);
  ctx.lineTo(s * 0.55, -s * 0.15);
  ctx.lineTo(s * 0.02, -s * 0.15);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Canvas labels are drawn in logical pixels, so after the CSS downscale the
// 7–10px pixel font becomes unreadable on phones — enlarge it to compensate.
if (IS_TOUCH) {
  const fontProp = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'font');
  Object.defineProperty(CanvasRenderingContext2D.prototype, 'font', {
    configurable: true,
    get() { return fontProp.get.call(this); },
    set(v) {
      if (canvasTextBoost > 1 && this.canvas && this.canvas.id === 'game-canvas' &&
          typeof v === 'string' && v.includes('Press Start 2P')) {
        v = v.replace(/(\d+(?:\.\d+)?)px/, (m, n) => (n * canvasTextBoost).toFixed(1) + 'px');
      }
      fontProp.set.call(this, v);
    },
  });
}

// Entity containers
let rocket = null;
let obstacles = [];
let particles = [];
let stars = [];
let nebulae = [];
let dangerZones = [];  // comet blast zones: { x, y, r, life, maxLife }
let scoreTimer = 0;
let spawnTimer = 0;
let diffTimer = 0;

// Events state (Levels 4, 9, 14, 19)
let pirates = [];
let pirateMothership = null;
let activeEvent = null; // { type: 'CONSTRICTION' | 'PIRATES', level: N, timer: 0, bannerTimer: 0, pirateSpawnTimer: 0, piratesSpawned: 0, maxPirates: 0 }
let eventBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0, targetMinX: 0, targetMaxX: 0, targetMinY: 0, targetMaxY: 0, active: false };
let eventPlan = {};
let floatingTexts = [];
let pirateWarnings = [];
let nextPirateLevel = 2; // Periodic pirate spawns every 1-3 levels
let lastPirateInterval = 0;

// ── Crimson Pulsar biome: Solar Push Wave ─────────────────────
// Wave sweeps the full screen; pushes everything (rocket, obstacles, pirates) in its direction.
// Player must fly AGAINST the wave at max speed to avoid being carried to the edge.
let pushWave = null;         // active wave object or null
let pushWaveTimer = 0;       // countdown to next wave spawn
let pushWaveInterval = 0;    // randomised 15–25s interval


function getNextPirateLevelInterval() {
  // Interval of 1 to 3 levels (rolls 1, 2, or 3)
  // If the previous interval was 1, choose 2 or 3 to avoid back-to-back spawns ("а не каждый раз")
  let interval;
  if (lastPirateInterval === 1) {
    interval = Math.random() < 0.5 ? 2 : 3;
  } else {
    interval = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
  }
  lastPirateInterval = interval;
  return interval;
}

// Special Events interval: triggers every 3-4 levels as requested
let nextEventLevel = 4;
let lastEventInterval = 0;

function getNextEventLevelInterval() {
  // Interval of 3 to 4 levels (rolls 3 or 4)
  // Alternate or randomize 3 and 4 levels between special events
  const interval = Math.random() < 0.5 ? 3 : 4;
  lastEventInterval = interval;
  return interval;
}

// Session tracking for achievements
let sessionLevel = 1;
let newAchievementsThisRun = [];

// ─── Cached DOM elements ──────────────────────────────────────
const EL = {};
function cacheEls() {
  EL.scoreVal = document.getElementById('score-val');
  EL.levelVal = document.getElementById('level-val');
  EL.bestVal = document.getElementById('best-val');
  EL.hudLevel = document.getElementById('hud-level');
  EL.pauseOverlay = document.getElementById('pause-overlay');
  EL.muteIcon = document.getElementById('mute-icon');
  EL.menuBestVal = document.getElementById('menu-best-val');
  EL.menuCoinsVal = document.getElementById('menu-coins-val');
  EL.finalScore = document.getElementById('final-score');
  EL.finalCoins = document.getElementById('final-coins');
  EL.finalBest = document.getElementById('final-best');
  EL.finalTime = document.getElementById('final-time');
  EL.timeVal = document.getElementById('time-val');
  EL.newRecBadge = document.getElementById('new-record-badge');
  EL.aeContainer = document.getElementById('achievements-earned');
  EL.aeList = document.getElementById('ae-list');
  EL.toast = document.getElementById('achievement-toast');
  EL.toastIcon = document.getElementById('toast-icon');
  EL.toastName = document.getElementById('toast-name');
  EL.recordsTbody = document.getElementById('records-tbody');
  EL.recordsEmpty = document.getElementById('records-empty');
  EL.achGrid = document.getElementById('achievements-grid');
  EL.skinsCoinCount = document.getElementById('skins-coin-count');
  EL.skinsGrid = document.getElementById('skins-grid');
}

