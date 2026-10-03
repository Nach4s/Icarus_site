// ─── Dynamic Space Color Themes ───────────────────────────────
const SPACE_THEMES = [
  {
    name: 'Violet Cosmos',
    bg: [8, 5, 24],
    circle: [147, 51, 234],
    nebulae: [
      [147, 51, 234],
      [168, 85, 247],
      [124, 58, 237],
      [192, 38, 211]
    ]
  },
  {
    name: 'Emerald Nebula',
    bg: [3, 18, 14],
    circle: [16, 185, 129],
    nebulae: [
      [16, 185, 129],
      [5, 150, 105],
      [52, 211, 153],
      [20, 184, 166]
    ]
  },
  {
    name: 'Crimson Pulsar',
    bg: [20, 5, 8],
    circle: [239, 68, 68],
    nebulae: [
      [239, 68, 68],
      [244, 63, 94],
      [225, 29, 72],
      [251, 113, 133]
    ]
  },
  {
    name: 'Neon Azure',
    bg: [4, 13, 26],
    circle: [6, 182, 212],
    nebulae: [
      [6, 182, 212],
      [14, 165, 233],
      [56, 189, 248],
      [0, 229, 255]
    ]
  },
  {
    name: 'Golden Supernova',
    bg: [20, 12, 3],
    circle: [245, 158, 11],
    nebulae: [
      [245, 158, 11],
      [251, 191, 36],
      [217, 119, 6],
      [249, 115, 22]
    ]
  },
  {
    name: 'Synthwave Magenta',
    bg: [20, 4, 22],
    circle: [236, 72, 153],
    nebulae: [
      [236, 72, 153],
      [217, 70, 239],
      [244, 114, 182],
      [162, 28, 175]
    ]
  },
  {
    name: 'Deep Ultramarine',
    bg: [4, 7, 28],
    circle: [59, 130, 246],
    nebulae: [
      [59, 130, 246],
      [99, 102, 241],
      [79, 70, 229],
      [37, 99, 235]
    ]
  },
  {
    name: 'Fiery Magma',
    bg: [22, 8, 3],
    circle: [249, 115, 22],
    nebulae: [
      [249, 115, 22],
      [234, 88, 12],
      [251, 146, 60],
      [194, 65, 12]
    ]
  },
];

let currentThemeIndex = 0;
let currentBgTheme = SPACE_THEMES[0];
let curBg = [...currentBgTheme.bg];
let fromBg = [...currentBgTheme.bg];
let targetBg = [...currentBgTheme.bg];
let currentBgColor = `rgb(${curBg[0]},${curBg[1]},${curBg[2]})`;

const themeTransition = {
  active: false,
  timer: 0,
  duration: 2.5,
  sectorName: '',
};

let runThemeDeck = [];
let runThemeIndex = 0;

function shuffleRunThemes() {
  const indices = SPACE_THEMES.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  runThemeDeck = indices;
  runThemeIndex = 0;
}

function initRunTheme() {
  shuffleRunThemes();
  currentThemeIndex = runThemeDeck[0];
  currentBgTheme = SPACE_THEMES[currentThemeIndex];
  noteRunSector(currentBgTheme.name);
  curBg = [...currentBgTheme.bg];
  fromBg = [...curBg];
  targetBg = [...curBg];
  currentBgColor = `rgb(${curBg[0]},${curBg[1]},${curBg[2]})`;
  themeTransition.active = false;
  if (typeof nebulae !== 'undefined' && nebulae && nebulae.length > 0) {
    nebulae.forEach((n, idx) => {
      if (n.isMainCircle) {
        n.curColor = [...currentBgTheme.circle];
        n.targetColor = [...currentBgTheme.circle];
      } else {
        const col = currentBgTheme.nebulae[idx % currentBgTheme.nebulae.length];
        n.curColor = [...col];
        n.targetColor = [...col];
      }
    });
  }

  // Emerald Nebula barrel spawn interval: quick first barrel (3–5s)
  if (typeof getToxicBarrelInterval === 'function') {
    const isGreen = isGreenZoneTheme();
    nextToxicBarrelInterval = isGreen ? (3 + Math.random() * 2.5) : getToxicBarrelInterval(false);
    toxicBarrelTimer = 0;
  }

  // Synthwave Magenta: clear any lingering barrels & pirates at start
  if (isSynthwaveTheme()) {
    if (typeof toxicBarrels !== 'undefined') toxicBarrels = [];
    if (typeof pirates !== 'undefined' && pirates.length > 0) pirates = [];
  }

  // Crimson Pulsar: clear barrels/BH, init push wave timer (pirates stay but will be affected by waves)
  if (isCrimsonTheme()) {
    if (typeof toxicBarrels !== 'undefined') toxicBarrels = [];
    pushWave = null;
    pushWaveTimer = 0;
    pushWaveInterval = 8 + Math.random() * 5; // first wave 8–13s after game start
  }
}

function triggerThemeTransition() {
  if (isSynthwaveTheme() && rocket && rocket.alive) runStats.synthwaveCleared++;
  runThemeIndex++;
  // If player survived all themes in the deck without dying (8 sectors = 40 levels!),
  // reshuffle a fresh cycle without repeating the immediately preceding theme:
  if (runThemeIndex >= runThemeDeck.length) {
    const lastIdx = runThemeDeck[runThemeDeck.length - 1];
    shuffleRunThemes();
    if (runThemeDeck[0] === lastIdx && runThemeDeck.length > 1) {
      [runThemeDeck[0], runThemeDeck[1]] = [runThemeDeck[1], runThemeDeck[0]];
    }
  }

  currentThemeIndex = runThemeDeck[runThemeIndex];
  currentBgTheme = SPACE_THEMES[currentThemeIndex];
  noteRunSector(currentBgTheme.name);

  fromBg = [...curBg];
  targetBg = [...currentBgTheme.bg];

  nebulae.forEach((n, idx) => {
    n.fromColor = [...n.curColor];
    if (n.isMainCircle) {
      n.targetColor = [...currentBgTheme.circle];
    } else {
      n.targetColor = [...currentBgTheme.nebulae[idx % currentBgTheme.nebulae.length]];
    }
  });

  themeTransition.active = true;
  themeTransition.timer = 0;
  themeTransition.duration = 2.5;
  themeTransition.sectorName = currentBgTheme.name;

  if (isGreenZoneTheme()) {
    // Green Zone: black holes disabled (enableBlackHoles = false)
    if (typeof blackHoles !== 'undefined' && blackHoles.length > 0) {
      for (let i = 0; i < blackHoles.length; i++) {
        blackHoles[i].life = Math.min(blackHoles[i].life, 0.4);
      }
    }
    if (typeof blackHoleTimer !== 'undefined') blackHoleTimer = 0;
    // Transitioning into Emerald Nebula: first barrel spawns quickly (3–5 seconds)!
    nextToxicBarrelInterval = 3 + Math.random() * 2;
    toxicBarrelTimer = 0;
  } else if (isSynthwaveTheme()) {
    // Synthwave Magenta: no toxic barrels and no pirates spawning, but existing ones stay
    // (no deletion of existing pirates/barrels)
  } else if (isCrimsonTheme()) {
    // Crimson Pulsar: no toxic barrels, no black holes — pirates stay but are affected by push waves!
    // (no deletion of existing pirates/barrels)
    if (typeof blackHoles !== 'undefined' && blackHoles.length > 0) {
      for (let i = 0; i < blackHoles.length; i++) {
        blackHoles[i].life = Math.min(blackHoles[i].life, 0.3);
      }
    }
    // Reset push wave: first wave comes in 6–10s after entering
    pushWave = null;
    pushWaveTimer = 0;
    pushWaveInterval = 6 + Math.random() * 4;
  } else if (isMagmaTheme()) {
    // Fiery Magma: no black holes (eruptions own this sector) — collapse leftovers
    blackHoles.forEach(bh => { bh.life = Math.min(bh.life, 0.4); });
    blackHoleTimer = 0;
  }

  playSfxWarp();
}

// ── Biome & Theme Detection Helpers ───────────────────────────
function isSynthwaveTheme() {
  if (!currentBgTheme) return false;
  return currentBgTheme.name === 'Synthwave Magenta' ||
    (currentBgTheme.circle && currentBgTheme.circle[0] === 236 && currentBgTheme.circle[1] === 72);
}

function isCrimsonTheme() {
  if (!currentBgTheme) return false;
  return currentBgTheme.name === 'Crimson Pulsar' ||
    (currentBgTheme.circle && currentBgTheme.circle[0] === 239 && currentBgTheme.circle[1] === 68 && currentBgTheme.circle[2] === 68);
}

function isPurpleSpaceTheme() {
  if (!currentBgTheme) return false;
  return currentBgTheme === SPACE_THEMES[0] ||
    (currentBgTheme.circle && currentBgTheme.circle[0] === 147 && currentBgTheme.circle[1] === 51);
}

function isGreenZoneTheme() {
  if (!currentBgTheme) return false;
  return currentBgTheme === SPACE_THEMES[1] ||
    currentBgTheme.name === 'Emerald Nebula' ||
    (currentBgTheme.circle && currentBgTheme.circle[0] === 16 && currentBgTheme.circle[1] === 185);
}


// Biomes with their own hazards in biomes.js
function isNeonAzureTheme() {
  return !!currentBgTheme && currentBgTheme.name === 'Neon Azure';
}

function isGoldenSupernovaTheme() {
  return !!currentBgTheme && currentBgTheme.name === 'Golden Supernova';
}

function isUltramarineTheme() {
  return !!currentBgTheme && currentBgTheme.name === 'Deep Ultramarine';
}

function isMagmaTheme() {
  return !!currentBgTheme && currentBgTheme.name === 'Fiery Magma';
}

function isBiomeHazardTheme() {
  return isNeonAzureTheme() || isGoldenSupernovaTheme() || isUltramarineTheme() || isMagmaTheme();
}
