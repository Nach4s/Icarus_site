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

