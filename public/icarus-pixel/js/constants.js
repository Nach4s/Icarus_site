/* ══════════════════════════════════════════════════════════════
   ICARUS PIXEL — game.js  v3.0
   Full game engine: Canvas 2D, Game Loop, Entities, Audio,
   HUD, Records, Achievements, Mobile Controls
   Rocket: 100% procedural Canvas art, no external images
══════════════════════════════════════════════════════════════ */

'use strict';


// ─── Constants ────────────────────────────────────────────────
const ROCKET_SPEED = 320;   // px/sec
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
const ACHIEVEMENTS_DEF = [
  { id: 'first_flight', icon: '🚀', name: 'Первый полёт', desc: 'Сыграй первую игру', check: (s) => s.gamesPlayed >= 1 },
  { id: 'survivor_30', icon: '⏱', name: '30 секунд', desc: 'Продержись 30 секунд', check: (s) => s.bestTime >= 30 },
  { id: 'survivor_60', icon: '⌛', name: 'Минута', desc: 'Продержись 60 секунд', check: (s) => s.bestTime >= 60 },
  { id: 'survivor_120', icon: '🕐', name: '2 минуты', desc: 'Продержись 2 минуты', check: (s) => s.bestTime >= 120 },
  { id: 'score_10', icon: '🎯', name: 'Десяточка', desc: 'Набери 10 очков', check: (s) => s.bestScore >= 10 },
  { id: 'score_50', icon: '⭐', name: 'Пятидесятник', desc: 'Набери 50 очков', check: (s) => s.bestScore >= 50 },
  { id: 'score_100', icon: '💫', name: 'Центурион', desc: 'Набери 100 очков', check: (s) => s.bestScore >= 100 },
  { id: 'score_150', icon: '🏆', name: 'Мастер', desc: 'Набери 150 очков', check: (s) => s.bestScore >= 150 },
  { id: 'score_200', icon: '👑', name: 'Легенда', desc: 'Набери 200 очков', check: (s) => s.bestScore >= 200 },
  { id: 'level_10', icon: '💀', name: 'Безумие', desc: 'Достигни 10 уровня', check: (s) => s.bestLevel >= 10 },
  { id: 'level_15', icon: '⚡', name: 'Апокалипсис', desc: 'Достигни 15 уровня', check: (s) => s.bestLevel >= 15 },
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
    name: 'Классический Икар',
    price: 0,
    desc: 'Надежный титановый челнок с плазменным двигателем.',
    tag: 'СТАНДАРТ',
  },
  {
    id: 'void_phantom',
    name: 'Призрак Бездны',
    price: 15,
    desc: 'Скрытный истребитель из антиматерии с неоновыми кристаллическими клинками.',
    tag: 'БЕЗДНА',
    cardClass: 'special-void',
  },
  {
    id: 'space_shuttle',
    name: 'Спейс Шаттл',
    price: 20,
    desc: 'Легендарный комплекс NASA: оранжевый бак, белые ускорители SRB и орбитальный челнок с огненным шлейфом.',
    tag: 'КОСМОПЛАН',
    cardClass: 'special-shuttle',
  },
  {
    id: 'icarus_wings',
    name: 'Крылья Икара',
    price: 25,
    desc: 'Легендарный крылатый Икар. Парит в космической бездне, роняя шлейф золотых перьев.',
    tag: 'ЛЕГЕНДАРНЫЙ',
    cardClass: 'special-icarus',
    isSpecial: true,
  },
  {
    id: 'venator',
    name: 'Крейсер «Венатор»',
    price: 30,
    desc: 'Звёздный разрушитель Великой Армии Республики: клиновидный корпус, двойной мостик, алая полоса и ионные двигатели.',
    tag: 'STAR WARS',
    cardClass: 'special-venator',
  },
  {
    id: 'cyber_dreadnought',
    name: 'Кибер-Дредноут',
    price: 35,
    desc: 'Тяжелый штурмовой крейсер с квантовыми генераторами, неоновыми конденсаторами и плазменными энергоблоками.',
    tag: 'КИБЕРПАНК',
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

