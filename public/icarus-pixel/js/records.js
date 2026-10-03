// ─── Records & Achievements (localStorage) ────────────────────
function getStats() {
  try {
    return JSON.parse(localStorage.getItem('icarusStats') || 'null') || {
      gamesPlayed: 0,
      bestScore: 0,
      bestTime: 0,
      bestLevel: 1,
      achievements: [],
    };
  } catch (e) {
    return { gamesPlayed: 0, bestScore: 0, bestTime: 0, bestLevel: 1, achievements: [] };
  }
}

function saveStats(stats) {
  localStorage.setItem('icarusStats', JSON.stringify(stats));
}

function getTopScores() {
  try {
    return JSON.parse(localStorage.getItem('icarusScores') || '[]');
  } catch (e) { return []; }
}

function saveScore(entry) {
  let scores = getTopScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores = scores.slice(0, 5);
  localStorage.setItem('icarusScores', JSON.stringify(scores));
}

function clearRecords() {
  if (!confirm('Сбросить все рекорды и достижения?')) return;
  localStorage.removeItem('icarusScores');
  localStorage.removeItem('icarusStats');
  localStorage.removeItem('icarusBest');
  bestScore = 0;
  EL.menuBestVal.textContent = 0;
  buildRecordsUI();
  playSfxClick();
}

// Check & unlock new achievements
function checkAchievements(stats) {
  const newly = [];
  for (const def of ACHIEVEMENTS_DEF) {
    if (!stats.achievements.includes(def.id) && def.check(stats)) {
      stats.achievements.push(def.id);
      newly.push(def);
    }
  }
  return newly;
}

// Show achievement toast
let toastQueue = [];
let toastShowing = false;

function showAchievementToast(def) {
  toastQueue.push(def);
  if (!toastShowing) processToastQueue();
}

function processToastQueue() {
  if (!toastQueue.length) { toastShowing = false; return; }
  toastShowing = true;
  const def = toastQueue.shift();
  EL.toastIcon.textContent = def.icon;
  EL.toastName.textContent = def.name;
  EL.toast.classList.remove('hidden');
  requestAnimationFrame(() => {
    EL.toast.classList.add('show');
  });
  playSfxAchievement();
  setTimeout(() => {
    EL.toast.classList.remove('show');
    setTimeout(() => {
      EL.toast.classList.add('hidden');
      setTimeout(processToastQueue, 200);
    }, 400);
  }, 2800);
}

// Helper to format time as minutes and seconds
function formatTime(totalSeconds) {
  const t = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(t / 60);
  const s = t % 60;
  if (m > 0) {
    return `${m} мин ${s} сек`;
  }
  return `${s} сек`;
}

// ─── Records UI builder ───────────────────────────────────────
function buildRecordsUI() {
  const scores = getTopScores();
  const stats = getStats();
  const newAch = checkAchievements(stats);
  if (newAch.length > 0) saveStats(stats);

  // Table
  if (scores.length === 0) {
    EL.recordsEmpty.classList.remove('hidden');
    EL.recordsTbody.innerHTML = '';
  } else {
    EL.recordsEmpty.classList.add('hidden');
    EL.recordsTbody.innerHTML = scores.map((s, i) => {
      const rankClass = i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const date = new Date(s.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      return `<tr>
        <td class="${rankClass}">${medal}</td>
        <td class="${rankClass}" style="font-size:12px">${s.score}</td>
        <td>${s.level}</td>
        <td>${formatTime(s.time)}</td>
        <td style="font-size:7px;color:var(--col-text-dim)">${date}</td>
      </tr>`;
    }).join('');
  }

  // Achievements grid
  EL.achGrid.innerHTML = ACHIEVEMENTS_DEF.map(def => {
    const unlocked = stats.achievements.includes(def.id);
    return `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" title="${def.desc}">
      <div class="achievement-icon">${def.icon}</div>
      <div class="achievement-name">${def.name}</div>
      <div class="achievement-desc">${def.desc}</div>
    </div>`;
  }).join('');
}

