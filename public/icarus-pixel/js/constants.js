/* ══════════════════════════════════════════════════════════════
   ICARUS PIXEL — game.js  v3.0
   Full game engine: Canvas 2D, Game Loop, Entities, Audio,
   HUD, Records, Achievements, Mobile Controls
   Rocket: 100% procedural Canvas art, no external images
══════════════════════════════════════════════════════════════ */

'use strict';


// ─── Constants ────────────────────────────────────────────────
const ROCKET_SPEED = 320;   // px/sec
const LEVEL_DURATION = 11;        // seconds per level without an event
const LEVEL_DURATION_EVENT = 15;  // seconds per level while an event is running
const MAX_PARTICLES = 350;   // cap to avoid memory issues
const STAR_LAYERS = [
  { count: 80, speed: 20, size: 1, alpha: 0.4 },
  { count: 50, speed: 50, size: 1.5, alpha: 0.65 },
  { count: 25, speed: 100, size: 2.5, alpha: 0.9 },
];
const COMET_TYPES = [
  { label: 'small', r: 6, speed: 260, spawnW: 3 },
  { label: 'medium', r: 12, speed: 175, spawnW: 2 },
  { label: 'large', r: 22, speed: 100, spawnW: 1 },
];
const ASTEROID_TYPES = [
  { label: 'tiny', r: 8, speed: 220, spawnW: 2 },
  { label: 'normal', r: 16, speed: 140, spawnW: 2 },
  { label: 'big', r: 28, speed: 80, spawnW: 1 },
];

// Synthwave Magenta exclusive asteroid catalog: mostly asteroids with giant Mega-Asteroids
const SYNTHWAVE_ASTEROID_TYPES = [
  { label: 'tiny', r: 8, speed: 240, spawnW: 1 },
  { label: 'normal', r: 16, speed: 180, spawnW: 3 },
  { label: 'big', r: 28, speed: 140, spawnW: 3 },
  { label: 'mega', r: 62, speed: 110, spawnW: 0.5, isMega: true },
];

// Minimum asteroid radius that can split (smaller ones don't split)
const MIN_SPLIT_R = 28;
const MEGA_ASTEROID_R = 50;

// Minimum comet radius that can randomly explode mid-path
const MIN_COMET_EXPLODE_R = 12;
// How long (seconds) the comet blast danger zone persists
const DANGER_ZONE_DURATION = 1.5;

// ─── Achievements Definition ──────────────────────────────────
// check(s) gets the saved stats: best*, s.total.X (lifetime), s.best.X (best run),
// s.sectorsVisited / s.eventTypesSurvived (sets) — see mergeRunStats in records.js
const ACHIEVEMENTS_DEF = [
  // Progress
  { id: 'liftoff', icon: '🚀', name: 'Liftoff', desc: 'Play your first game', check: (s) => s.gamesPlayed >= 1 },
  { id: 'level_5', icon: '🌌', name: 'Sector Jumper', desc: 'Reach level 5', check: (s) => s.bestLevel >= 5 },
  { id: 'level_10', icon: '🛰️', name: 'Deep Space', desc: 'Reach level 10', check: (s) => s.bestLevel >= 10 },
  { id: 'level_15', icon: '💀', name: 'Point of No Return', desc: 'Reach level 15', check: (s) => s.bestLevel >= 15 },
  { id: 'level_20', icon: '👑', name: 'Icarus Ascended', desc: 'Reach level 20', check: (s) => s.bestLevel >= 20 },
  { id: 'endurance', icon: '⏱️', name: 'Endurance', desc: 'Survive 3 minutes in one run', check: (s) => s.bestTime >= 180 },
  { id: 'high_flyer', icon: '⭐', name: 'High Flyer', desc: 'Score 250 points in one run', check: (s) => s.bestScore >= 250 },
  // Exploration & events
  { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Visit 4 sectors in one run', check: (s) => (s.best.sectors || 0) >= 4 },
  { id: 'cartographer', icon: '🗺️', name: 'Cartographer', desc: 'Visit all 8 sectors', check: (s) => s.sectorsVisited.length >= 8 },
  { id: 'event_veteran', icon: '🎖️', name: 'Event Veteran', desc: 'Survive 5 events in one run', check: (s) => (s.best.eventsSurvived || 0) >= 5 },
  { id: 'seen_it_all', icon: '🌀', name: 'Seen It All', desc: 'Survive every type of event', check: (s) => s.eventTypesSurvived.length >= 5 },
  // Pirates
  { id: 'pirate_hunter', icon: '🏴‍☠️', name: 'Pirate Hunter', desc: 'Destroy 25 pirates', check: (s) => (s.total.pirateKills || 0) >= 25 },
  { id: 'ion_trap', icon: '⚡', name: 'Ion Trap', desc: 'Lure a pirate into an ion arc', check: (s) => (s.total.ionKills || 0) >= 1 },
  { id: 'minesweeper', icon: '💣', name: 'Minesweeper', desc: 'Make a pirate crash into a mine', check: (s) => (s.total.mineKills || 0) >= 1 },
  { id: 'volcanologist', icon: '🌋', name: 'Volcanologist', desc: 'Hit a pirate with a magma fireball', check: (s) => (s.total.magmaKills || 0) >= 1 },
  // Biome survival
  { id: 'nova_survivor', icon: '☀️', name: 'Supernova Survivor', desc: 'Outlast 3 supernovae in one run', check: (s) => (s.best.novasSurvived || 0) >= 3 },
  { id: 'solar_surfer', icon: '🌊', name: 'Solar Surfer', desc: 'Ride out 3 solar storms in one run', check: (s) => (s.best.wavesSurvived || 0) >= 3 },
  { id: 'event_horizon', icon: '🕳️', name: 'Event Horizon', desc: 'Outlast 5 black holes in one run', check: (s) => (s.best.blackHolesSurvived || 0) >= 5 },
  { id: 'gas_mask', icon: '☣️', name: 'Gas Mask', desc: 'Spend 10 seconds in toxic fog in one run', check: (s) => (s.best.fogTime || 0) >= 10 },
  { id: 'storm_chaser', icon: '☄️', name: 'Storm Chaser', desc: 'Make it through the Synthwave asteroid storm', check: (s) => (s.total.synthwaveCleared || 0) >= 1 },
  // Hangar
  { id: 'coin_collector', icon: '💰', name: 'Coin Collector', desc: 'Earn 100 coins in total', check: (s) => (s.total.coins || 0) >= 100 },
  { id: 'new_ship', icon: '🛸', name: 'New Ship', desc: 'Unlock a ship in the hangar', check: () => unlockedSkins.length > 1 },
];

// ─── Coins & Skins State ──────────────────────────────────────
let userCoins = parseInt(localStorage.getItem('icarus_coins') || '0', 10);
let unlockedSkins = [];
try {
  unlockedSkins = JSON.parse(localStorage.getItem('icarus_unlocked_skins') || '["classic"]');
} catch(e) {
  unlockedSkins = ['classic'];
}
if (!unlockedSkins.includes('classic')) unlockedSkins.push('classic');

// Seamless migration for updated skins
if (unlockedSkins.includes('solar_phoenix') && !unlockedSkins.includes('space_shuttle')) {
  unlockedSkins.push('space_shuttle');
}
if (unlockedSkins.includes('golden_aegis') && !unlockedSkins.includes('venator')) {
  unlockedSkins.push('venator');
}

let selectedSkin = localStorage.getItem('icarus_selected_skin') || 'classic';
if (selectedSkin === 'solar_phoenix') selectedSkin = 'space_shuttle';
if (selectedSkin === 'golden_aegis') selectedSkin = 'venator';
if (!unlockedSkins.includes(selectedSkin)) selectedSkin = 'classic';
localStorage.setItem('icarus_selected_skin', selectedSkin);

// Skins catalog: prices in 15–30 range as requested
const SKINS_DEF = [
  {
    id: 'classic',
    name: 'Classic Icarus',
    price: 0,
    desc: 'A reliable titanium shuttle with a plasma engine.',
    tag: 'STANDARD',
  },
  {
    id: 'void_phantom',
    name: 'Void Phantom',
    price: 15,
    desc: 'A stealthy antimatter fighter with neon crystal blades.',
    tag: 'VOID',
    cardClass: 'special-void',
  },
  {
    id: 'space_shuttle',
    name: 'Space Shuttle',
    price: 20,
    desc: 'The legendary NASA stack: orange tank, white SRB boosters and an orbiter with a fiery trail.',
    tag: 'SPACEPLANE',
    cardClass: 'special-shuttle',
  },
  {
    id: 'icarus_wings',
    name: 'Wings of Icarus',
    price: 25,
    desc: 'The legendary winged Icarus. Soars through the cosmic void, shedding a trail of golden feathers.',
    tag: 'LEGENDARY',
    cardClass: 'special-icarus',
    isSpecial: true,
  },
  {
    id: 'venator',
    name: 'Venator Cruiser',
    price: 30,
    desc: 'A Star Destroyer of the Grand Army of the Republic: wedge-shaped hull, twin bridge towers, a scarlet stripe and ion engines.',
    tag: 'STAR WARS',
    cardClass: 'special-venator',
  },
  {
    id: 'cyber_dreadnought',
    name: 'Cyber Dreadnought',
    price: 35,
    desc: 'A heavy assault cruiser with quantum generators, neon capacitors and plasma power cores.',
    tag: 'CYBERPUNK',
    cardClass: 'special-cyber',
    isSpecial: true,
  },
];

function saveCoins() {
  localStorage.setItem('icarus_coins', userCoins);
  updateCoinsUI();
}

function updateCoinsUI() {
  if (EL.menuCoinsVal) EL.menuCoinsVal.textContent = userCoins;
  if (EL.skinsCoinCount) EL.skinsCoinCount.textContent = userCoins;
}

function addCoins(n) {
  if (n <= 0) return;
  userCoins += n;
  saveCoins();
  playSfxCoin();
}

function unlockSkin(skinId) {
  const skin = SKINS_DEF.find(s => s.id === skinId);
  if (!skin) return false;
  if (unlockedSkins.includes(skinId)) return true;
  if (userCoins < skin.price) return false;

  userCoins -= skin.price;
  unlockedSkins.push(skinId);
  selectedSkin = skinId;
  localStorage.setItem('icarus_unlocked_skins', JSON.stringify(unlockedSkins));
  localStorage.setItem('icarus_selected_skin', selectedSkin);
  saveCoins();
  playSfxAchievement();
  buildSkinsUI();
  // Buying a ship can unlock an achievement right away
  const stats = getStats();
  const newly = checkAchievements(stats);
  if (newly.length) {
    saveStats(stats);
    newly.forEach(def => showAchievementToast(def));
  }
  return true;
}

function selectSkin(skinId) {
  if (!unlockedSkins.includes(skinId)) return false;
  selectedSkin = skinId;
  localStorage.setItem('icarus_selected_skin', selectedSkin);
  playSfxClick();
  buildSkinsUI();
  return true;
}

