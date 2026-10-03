// ─── Menu Rocket Animation ────────────────────────────────────
let menuCanvas, menuCtx, menuPhase = 0, menuAnimId = null;
function initMenuAnimation() {
  menuCanvas = document.getElementById('menu-rocket-canvas');
  menuCtx = menuCanvas.getContext('2d');
  menuPhase = 0;
  cancelAnimationFrame(menuAnimId);

  function menuLoop(ts) {
    menuPhase = ts / 1000;
    menuCtx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
    drawRocketPixelArt(menuCtx, menuCanvas.width / 2, menuCanvas.height / 2 - 4, menuPhase, 2.0, 0, 0);
    menuAnimId = requestAnimationFrame(menuLoop);
  }
  menuAnimId = requestAnimationFrame(menuLoop);
}

// ─── Game Over background animation ──────────────────────────
let goCanvas, goCtx, goStars = [], goAnimId = null;
function initGameOverAnimation(isNewRecord) {
  goCanvas = document.getElementById('gameover-bg-canvas');
  if (!goCanvas) return;
  goCanvas.width = window.innerWidth;
  goCanvas.height = window.innerHeight;
  goCtx = goCanvas.getContext('2d');

  // Always recreate goStars to avoid stale state
  goStars = [];
  for (let i = 0; i < 120; i++) {
    goStars.push({
      x: Math.random() * goCanvas.width,
      y: Math.random() * goCanvas.height,
      size: Math.random() * 2 + 0.5,
      speed: 15 + Math.random() * 40,
      alpha: 0.3 + Math.random() * 0.6,
    });
  }

  cancelAnimationFrame(goAnimId);
  let lastT = 0;

  // Spawn fireworks for new record
  if (isNewRecord) {
    setTimeout(() => spawnFireworks(goCanvas.width, goCanvas.height), 400);
    setTimeout(() => spawnFireworks(goCanvas.width, goCanvas.height), 1200);
    setTimeout(() => spawnFireworks(goCanvas.width, goCanvas.height), 2200);
  }

  function goLoop(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    goCtx.fillStyle = '#07071a';
    goCtx.fillRect(0, 0, goCanvas.width, goCanvas.height);
    goStars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > goCanvas.height) { s.y = 0; s.x = Math.random() * goCanvas.width; }
      goCtx.globalAlpha = s.alpha;
      goCtx.fillStyle = '#fff';
      goCtx.fillRect(s.x, s.y, s.size, s.size);
    });
    goCtx.globalAlpha = 1;

    // Draw fireworks particles on the gameover canvas too
    if (isNewRecord) {
      drawParticles(goCtx);
      updateParticles(dt);
    }

    goAnimId = requestAnimationFrame(goLoop);
  }
  goAnimId = requestAnimationFrame(goLoop);
}

// ─── Records background animation ────────────────────────────
let recCanvas, recCtx, recStars = [], recAnimId = null;
function initRecordsAnimation() {
  recCanvas = document.getElementById('records-bg-canvas');
  if (!recCanvas) return;
  recCanvas.width = window.innerWidth;
  recCanvas.height = window.innerHeight;
  recCtx = recCanvas.getContext('2d');

  recStars = [];
  for (let i = 0; i < 100; i++) {
    recStars.push({
      x: Math.random() * recCanvas.width,
      y: Math.random() * recCanvas.height,
      size: Math.random() * 2 + 0.3,
      speed: 10 + Math.random() * 20,
      alpha: 0.2 + Math.random() * 0.5,
    });
  }

  cancelAnimationFrame(recAnimId);
  let lastT = 0;
  function recLoop(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    recCtx.fillStyle = '#07071a';
    recCtx.fillRect(0, 0, recCanvas.width, recCanvas.height);
    recStars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > recCanvas.height) { s.y = 0; s.x = Math.random() * recCanvas.width; }
      recCtx.globalAlpha = s.alpha;
      recCtx.fillStyle = '#fff';
      recCtx.fillRect(s.x, s.y, s.size, s.size);
    });
    recCtx.globalAlpha = 1;
    recAnimId = requestAnimationFrame(recLoop);
  }
  recAnimId = requestAnimationFrame(recLoop);
}

// ─── Screen Management ────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function goToMenu() {
  playSfxClick();
  gameState = 'MENU';
  cancelAnimationFrame(animFrameId);
  cancelAnimationFrame(goAnimId);
  cancelAnimationFrame(recAnimId);
  cancelAnimationFrame(skinsAnimId);
  stopBgMusic();

  EL.menuBestVal.textContent = bestScore;
  EL.bestVal.textContent = bestScore;
  updateCoinsUI();

  showScreen('screen-menu');
  initMenuAnimation();
}

function showRecordsScreen() {
  playSfxClick();
  gameState = 'RECORDS';
  cancelAnimationFrame(animFrameId);
  cancelAnimationFrame(goAnimId);
  cancelAnimationFrame(menuAnimId);
  cancelAnimationFrame(skinsAnimId);
  stopBgMusic();

  buildRecordsUI();
  showScreen('screen-records');
  initRecordsAnimation();
}

// ─── Skins & Hangar System ────────────────────────────────────
let skinsCanvas, skinsCtx, skinsStars = [], skinsAnimId = null;

function showSkinsScreen() {
  playSfxClick();
  gameState = 'SKINS';
  cancelAnimationFrame(animFrameId);
  cancelAnimationFrame(goAnimId);
  cancelAnimationFrame(menuAnimId);
  cancelAnimationFrame(recAnimId);
  stopBgMusic();

  buildSkinsUI();
  showScreen('screen-skins');
  initSkinsAnimation();
}

function buildSkinsUI() {
  updateCoinsUI();
  if (!EL.skinsGrid) return;
  EL.skinsGrid.innerHTML = '';

  SKINS_DEF.forEach(skin => {
    const isOwned = unlockedSkins.includes(skin.id);
    const isSelected = selectedSkin === skin.id;
    const canAfford = userCoins >= skin.price;

    const card = document.createElement('div');
    card.className = `skin-card ${isSelected ? 'selected' : ''} ${skin.cardClass || (skin.isSpecial ? 'special-icarus' : '')}`;

    let buttonHtml = '';
    if (isSelected) {
      buttonHtml = `<button class="btn-skin-action btn-selected" disabled>✔ ВЫБРАНО</button>`;
    } else if (isOwned) {
      buttonHtml = `<button class="btn-skin-action btn-select" onclick="selectSkin('${skin.id}')">ВЫБРАТЬ</button>`;
    } else if (canAfford) {
      buttonHtml = `<button class="btn-skin-action btn-buy" onclick="unlockSkin('${skin.id}')">КУПИТЬ ЗА ${skin.price} 🪙</button>`;
    } else {
      buttonHtml = `<button class="btn-skin-action btn-locked" disabled>🔒 ${skin.price} 🪙</button>`;
    }

    const priceText = skin.price === 0
      ? '<span class="skin-price-tag free">БЕСПЛАТНО</span>'
      : `<span class="skin-price-tag">🪙 ${skin.price} монет</span>`;

    card.innerHTML = `
      <div class="skin-preview-wrap">
        <canvas class="skin-preview-canvas" id="skin-preview-${skin.id}" width="110" height="110"></canvas>
      </div>
      <div class="skin-info">
        <div class="skin-name">${skin.name}</div>
        <div class="skin-desc">${skin.desc}</div>
      </div>
      <div class="skin-card-bottom">
        ${priceText}
        ${buttonHtml}
      </div>
    `;

    EL.skinsGrid.appendChild(card);
  });
}

function initSkinsAnimation() {
  skinsCanvas = document.getElementById('skins-bg-canvas');
  if (!skinsCanvas) return;
  skinsCanvas.width = window.innerWidth;
  skinsCanvas.height = window.innerHeight;
  skinsCtx = skinsCanvas.getContext('2d');

  skinsStars = [];
  for (let i = 0; i < 90; i++) {
    skinsStars.push({
      x: Math.random() * skinsCanvas.width,
      y: Math.random() * skinsCanvas.height,
      size: Math.random() * 2 + 0.4,
      speed: 12 + Math.random() * 24,
      alpha: 0.2 + Math.random() * 0.55,
    });
  }

  cancelAnimationFrame(skinsAnimId);
  let lastT = 0;

  function skinsLoop(ts) {
    const dt = Math.min((ts - lastT) / 1000, 0.05);
    lastT = ts;
    const t = ts / 1000;

    skinsCtx.fillStyle = '#07071a';
    skinsCtx.fillRect(0, 0, skinsCanvas.width, skinsCanvas.height);
    skinsStars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > skinsCanvas.height) { s.y = 0; s.x = Math.random() * skinsCanvas.width; }
      skinsCtx.globalAlpha = s.alpha;
      skinsCtx.fillStyle = '#fff';
      skinsCtx.fillRect(s.x, s.y, s.size, s.size);
    });
    skinsCtx.globalAlpha = 1;

    // Render interactive live preview of each skin on its card
    SKINS_DEF.forEach(skin => {
      const cvs = document.getElementById(`skin-preview-${skin.id}`);
      if (!cvs) return;
      const pCtx = cvs.getContext('2d');
      pCtx.clearRect(0, 0, cvs.width, cvs.height);
      const bob = Math.sin(t * 3.5 + skin.price * 0.3) * 3;
      drawRocketSkin(pCtx, skin.id, cvs.width / 2, cvs.height / 2 + bob, t, 1.7, 0, -20, 0);
    });

    skinsAnimId = requestAnimationFrame(skinsLoop);
  }
  skinsAnimId = requestAnimationFrame(skinsLoop);
}

function startGame() {
  playSfxClick();
  initAudio();
  resumeAudio();

  // Reset state
  score = 0;
  diffLevel = 1;
  sessionLevel = 1;
  scoreTimer = 0;
  spawnTimer = 0;
  diffTimer = 0;
  obstacles = [];
  particles = [];
  dangerZones = [];
  pirates = [];
  pirateMothership = null;
  activeEvent = null;
  floatingTexts = [];
  pirateWarnings = [];
  solarFlares = [];
  blackHoles = [];
  blackHoleTimer = 0;
  toxicBarrels = [];
  toxicClouds = [];
  rocketFogTransition = 0;
  toxicBarrelTimer = 0;
  nextToxicBarrelInterval = getToxicBarrelInterval();
  eventBounds = { active: false };
  eventPlan = {};
  newAchievementsThisRun = [];
  pushWave = null;
  pushWaveTimer = 0;
  pushWaveInterval = 0;
  gameState = 'PLAYING';
  startTime = performance.now();   // FIX: record actual start time

  // Schedule first pirate encounter (spawns once every 1-3 levels, not every level)
  lastPirateInterval = 0;
  nextPirateLevel = 1 + getNextPirateLevelInterval();

  // Schedule first special event (every 3-4 levels)
  lastEventInterval = 0;
  nextEventLevel = 1 + getNextEventLevelInterval();

  // HUD reset
  EL.scoreVal.textContent = '0';
  EL.levelVal.textContent = '1';
  EL.bestVal.textContent = bestScore;

  cancelAnimationFrame(menuAnimId);
  cancelAnimationFrame(goAnimId);
  cancelAnimationFrame(recAnimId);
  cancelAnimationFrame(skinsAnimId);

  canvas = document.getElementById('game-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx = canvas.getContext('2d');

  initRunTheme();
  initStars(canvas.width, canvas.height);
  rocket = createRocket(canvas.width, canvas.height);
  rocket.invincible = 1.5;

  showScreen('screen-game');
  EL.pauseOverlay.classList.add('hidden');

  if (!muted) startBgMusic();

  cancelAnimationFrame(animFrameId);
  lastTime = performance.now();
  animFrameId = requestAnimationFrame(gameLoop);
}

function resumeGame() {
  playSfxClick();
  gameState = 'PLAYING';
  EL.pauseOverlay.classList.add('hidden');
}

function pauseGame() {
  if (gameState !== 'PLAYING') return;
  gameState = 'PAUSED';
  EL.pauseOverlay.classList.remove('hidden');
}

function showGameOver() {
  gameState = 'GAMEOVER';
  cancelAnimationFrame(animFrameId);
  stopBgMusic();

  // FIX: Use real elapsed time
  const elapsedMs = performance.now() - startTime;
  const elapsed = Math.round(elapsedMs / 1000);

  const isNewRecord = score > bestScore;
  if (isNewRecord) {
    bestScore = score;
    localStorage.setItem('icarusBest', bestScore);
  }

  // Update stats
  const stats = getStats();
  stats.gamesPlayed++;
  if (score > stats.bestScore) stats.bestScore = score;
  if (elapsed > stats.bestTime) stats.bestTime = elapsed;
  if (diffLevel > stats.bestLevel) stats.bestLevel = diffLevel;

  // Check achievements
  const newAch = checkAchievements(stats);
  saveStats(stats);

  // Save score entry
  saveScore({
    score,
    level: diffLevel,
    time: elapsed,
    date: Date.now(),
  });

  // Coins calculation: 1 coin per 20 points (halved reward: 2x fewer coins)
  const earnedCoins = Math.floor(score / 20);
  if (earnedCoins > 0) {
    addCoins(earnedCoins);
  }
  if (EL.finalCoins) {
    EL.finalCoins.textContent = `+${earnedCoins} (Всего: ${userCoins})`;
  }

  // Show new achievements in toast queue (delayed slightly)
  newAchievementsThisRun = newAch;
  if (newAch.length > 0) {
    setTimeout(() => {
      newAch.forEach(def => showAchievementToast(def));
    }, 600);
  }

  // Update UI
  EL.finalScore.textContent = score;
  EL.finalBest.textContent = bestScore;
  EL.finalTime.textContent = formatTime(elapsed);
  EL.timeVal.textContent = formatTime(elapsed);

  if (isNewRecord) {
    EL.newRecBadge.classList.remove('hidden');
  } else {
    EL.newRecBadge.classList.add('hidden');
  }

  // Show achievements earned this run
  if (newAch.length > 0) {
    EL.aeContainer.classList.remove('hidden');
    EL.aeList.innerHTML = newAch.map((def, i) =>
      `<div class="ae-item" style="animation-delay:${i * 0.15}s">${def.icon} ${def.name}</div>`
    ).join('');
  } else {
    EL.aeContainer.classList.add('hidden');
  }

  // Update menu best
  EL.menuBestVal.textContent = bestScore;
  updateCoinsUI();

  showScreen('screen-gameover');
  initGameOverAnimation(isNewRecord);
}

