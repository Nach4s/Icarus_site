// ─── DEBUG: Level Control ─────────────────────────────────────
function debugChangeLevel(delta) {
  if (gameState !== 'PLAYING') return;
  diffLevel = Math.max(1, diffLevel + delta);
  sessionLevel = diffLevel;
  EL.levelVal.textContent = diffLevel;
  document.getElementById('debug-lvl-val').textContent = diffLevel;

  // Trigger effects same as normal level-up
  playSfxLevelUp();
  if (rocket && rocket.alive) spawnLevelUpRing(rocket.x, rocket.y);
  EL.hudLevel.classList.add('level-flash');
  setTimeout(() => EL.hudLevel.classList.remove('level-flash'), 600);

  // Theme transition at milestones
  if (diffLevel === 5 || diffLevel === 10 || diffLevel === 15 || diffLevel === 20 ||
      (diffLevel > 20 && diffLevel % 5 === 0)) {
    triggerThemeTransition();
  }

  // End active event on level advance and start next event when reached
  if (delta > 0) {
    if (activeEvent) endEvent();
    if (diffLevel >= nextEventLevel) {
      if (!activeEvent && canvas) startEvent(diffLevel, canvas.width, canvas.height);
      nextEventLevel = diffLevel + getNextEventLevelInterval();
    }
  }

  // Trigger periodic pirates if advancing level
  if (delta > 0 && diffLevel >= nextPirateLevel) {
    if (canvas) triggerLevelPirates(canvas.width, canvas.height);
    nextPirateLevel = diffLevel + getNextPirateLevelInterval();
  }
}

// Keep debug display in sync with real level during gameplay
function syncDebugLevel() {
  const el = document.getElementById('debug-lvl-val');
  if (el) el.textContent = diffLevel;
}

// ─── Input Handlers ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  // Also map by physical key code so layout doesn't matter (WASD on any keyboard)
  if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys['ArrowUp']    = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys['ArrowDown']  = true;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys['ArrowLeft']  = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys['ArrowRight'] = true;

  if (e.key === 'Escape') {
    if (gameState === 'PLAYING') pauseGame();
    else if (gameState === 'PAUSED') resumeGame();
  }
  if (gameState === 'PLAYING' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', e => {
  keys[e.key] = false;
  // Mirror the code-based mapping on keyup
  if (e.code === 'KeyW' || e.code === 'ArrowUp')    keys['ArrowUp']    = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown')  keys['ArrowDown']  = false;
  if (e.code === 'KeyA' || e.code === 'ArrowLeft')  keys['ArrowLeft']  = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys['ArrowRight'] = false;
});


// ─── Resize Handler ───────────────────────────────────────────
// Coordinate fields scaled with the playfield (velocities and radii are not)
const WORLD_X_KEYS = ['x', 'cx', 'aimX', 'splitX', 'targetX', 'cannonMuzzleX',
                      'minX', 'maxX', 'targetMinX', 'targetMaxX', 'zoneW'];
const WORLD_Y_KEYS = ['y', 'cy', 'aimY', 'splitY', 'targetY', 'cannonMuzzleY',
                      'minY', 'maxY', 'targetMinY', 'targetMaxY', 'zoneH'];

function scaleEntity(e, sx, sy) {
  if (!e) return;
  for (const k of WORLD_X_KEYS) if (typeof e[k] === 'number') e[k] *= sx;
  for (const k of WORLD_Y_KEYS) if (typeof e[k] === 'number') e[k] *= sy;
}

// When the playfield changes size mid-run (fullscreen on/off, phone rotation)
// move everything proportionally — otherwise objects keep their old coordinates
// and get culled as "off-screen" once the field shrinks.
function rescaleWorld(sx, sy) {
  scaleEntity(rocket, sx, sy);
  scaleEntity(pirateMothership, sx, sy);
  scaleEntity(eventBounds, sx, sy);
  [obstacles, particles, dangerZones, pirates, blackHoles, toxicBarrels,
   toxicClouds, floatingTexts, pirateWarnings].forEach(list => {
    list.forEach(e => scaleEntity(e, sx, sy));
  });
  solarFlares.forEach(f => { f.pos *= f.axis === 'H' ? sy : sx; });
  rescaleBiomeHazards(sx, sy);
  if (pushWave) {
    const s = pushWave.edge < 2 ? sx : sy; // edges 0/1 sweep horizontally
    pushWave.frontPos *= s;
    pushWave.totalDist *= s;
  }
}

window.addEventListener('resize', () => {
  if (gameState === 'PLAYING' || gameState === 'PAUSED') {
    // Ignore transient zero-size frames (e.g. mid fullscreen transition)
    if (window.innerWidth < 50 || window.innerHeight < 50) return;
    const oldW = canvas.width, oldH = canvas.height;
    sizeGameCanvas(canvas);
    initStars(canvas.width, canvas.height);
    if (oldW && oldH) rescaleWorld(canvas.width / oldW, canvas.height / oldH);
  }
  if (goCanvas) { goCanvas.width = window.innerWidth; goCanvas.height = window.innerHeight; }
  if (recCanvas) { recCanvas.width = window.innerWidth; recCanvas.height = window.innerHeight; }
});

// ─── Touch Controls: floating joystick ────────────────────────
// Put a finger anywhere on the playfield and drag: the rocket flies in the
// drag direction, faster the further the finger is pulled from where it landed.
const STICK_RADIUS = 52;   // px — finger distance for full speed
const STICK_DEAD = 0.12;   // fraction of the radius ignored (jitter)
const stickEl = document.getElementById('touch-stick');
const stickKnob = document.getElementById('touch-stick-knob');

function findTouch(list, id) {
  for (let i = 0; i < list.length; i++) if (list[i].identifier === id) return list[i];
  return null;
}

function releaseStick() {
  touchStick.active = false;
  touchStick.id = null;
  touchStick.x = touchStick.y = 0;
  if (stickEl) stickEl.classList.remove('visible');
}

function updateStick(t) {
  let dx = t.clientX - touchStick.ox;
  let dy = t.clientY - touchStick.oy;
  let dist = Math.sqrt(dx * dx + dy * dy);
  // Drag the stick base along when the finger goes past the rim,
  // so reversing direction responds instantly
  if (dist > STICK_RADIUS) {
    touchStick.ox = t.clientX - (dx / dist) * STICK_RADIUS;
    touchStick.oy = t.clientY - (dy / dist) * STICK_RADIUS;
    dx = (dx / dist) * STICK_RADIUS;
    dy = (dy / dist) * STICK_RADIUS;
    dist = STICK_RADIUS;
  }
  const mag = dist / STICK_RADIUS;
  if (mag < STICK_DEAD) {
    touchStick.x = touchStick.y = 0;
  } else {
    const m = (mag - STICK_DEAD) / (1 - STICK_DEAD);
    touchStick.x = (dx / dist) * m;
    touchStick.y = (dy / dist) * m;
  }
  if (stickEl) {
    stickEl.style.transform = `translate(${touchStick.ox}px, ${touchStick.oy}px)`;
    stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}

document.addEventListener('touchstart', e => {
  if (gameState !== 'PLAYING') return;
  // Let buttons (pause etc.) receive their taps
  if (e.target.closest && e.target.closest('button')) return;
  e.preventDefault();
  if (touchStick.active) return; // one finger steers, extra fingers are ignored
  const t = e.changedTouches[0];
  touchStick.active = true;
  touchStick.id = t.identifier;
  touchStick.ox = t.clientX;
  touchStick.oy = t.clientY;
  updateStick(t);
  if (stickEl) stickEl.classList.add('visible');
}, { passive: false });

document.addEventListener('touchmove', e => {
  if (!touchStick.active) return;
  const t = findTouch(e.changedTouches, touchStick.id);
  if (!t) return;
  if (gameState === 'PLAYING') updateStick(t);
  e.preventDefault();
}, { passive: false });

function onTouchEnd(e) {
  if (touchStick.active && findTouch(e.changedTouches, touchStick.id)) releaseStick();
}
document.addEventListener('touchend', onTouchEnd);
document.addEventListener('touchcancel', onTouchEnd);

// ─── Ripple effect for all buttons ───────────────────────────
function setupRipple() {
  document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      ripple.classList.add('btn-ripple');
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ─── CSS for level flash ──────────────────────────────────────
const levelFlashStyle = document.createElement('style');
levelFlashStyle.textContent = `
  #hud-level.level-flash .hud-value {
    animation: level-flash-anim 0.6s ease;
  }
  @keyframes level-flash-anim {
    0%   { color: #fff; text-shadow: 0 0 30px #fff, 0 0 60px #fff; transform: scale(1.5); }
    50%  { color: #ff8800; text-shadow: 0 0 20px #ff8800; transform: scale(1.2); }
    100% { color: #ff6b35; text-shadow: 0 0 12px rgba(255,107,53,0.6); transform: scale(1); }
  }
`;
document.head.appendChild(levelFlashStyle);

// ─── Startup ──────────────────────────────────────────────────
cacheEls();
updateCoinsUI();
setupRipple();
EL.menuBestVal.textContent = bestScore;
showScreen('screen-menu');

// Rocket is fully procedural — start menu animation immediately
initMenuAnimation();

