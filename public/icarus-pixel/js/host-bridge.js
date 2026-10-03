// ─── Host bridge (Icarus site integration) ─────────────────────────
// 1. Notifies the parent page (debounced) whenever game progress is saved,
//    so the site can sync it to the player's account.
// 2. Lets the parent page pause the game (e.g. when ESC exits fullscreen,
//    the browser swallows the keydown so the game never sees it).
(function () {
  const KEYS = ['icarus_coins', 'icarus_unlocked_skins', 'icarus_selected_skin',
                'icarusBest', 'icarusScores', 'icarusStats'];
  let timer = null;

  function notifyHost() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'icarus-progress-changed' }, window.location.origin);
      }
    }, 800);
  }

  const origSet = Storage.prototype.setItem;
  const origRemove = Storage.prototype.removeItem;
  Storage.prototype.setItem = function (k, v) {
    origSet.call(this, k, v);
    if (this === window.localStorage && KEYS.includes(k)) notifyHost();
  };
  Storage.prototype.removeItem = function (k) {
    origRemove.call(this, k);
    if (this === window.localStorage && KEYS.includes(k)) notifyHost();
  };

  function safePause() {
    if (typeof pauseGame === 'function' && gameState === 'PLAYING') pauseGame();
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== window.location.origin) return;
    if (e.data && e.data.type === 'icarus-pause') safePause();
  });

  // Also pause when the tab/window is hidden or loses focus
  document.addEventListener('visibilitychange', () => { if (document.hidden) safePause(); });
  window.addEventListener('blur', safePause);
})();
