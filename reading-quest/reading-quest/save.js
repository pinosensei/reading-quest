/* =========================================================
   Reading Quest – Save System
   ---------------------------------------------------------
   This is the ONLY file that touches localStorage.
   It reads/writes ONLY these two keys:
     rq_save_v1          (the save)
     rq_save_v1_backup   (copy of a broken save, if any)
   It never reads, writes or deletes any other key, so
   NH Interactive / Learn Live data on the same domain is safe.
   ========================================================= */

(function () {
  const KEY = 'rq_save_v1';
  const BACKUP_KEY = 'rq_save_v1_backup';
  const VERSION = 1;

  function defaultSave() {
    const now = Date.now();
    return {
      version: VERSION,
      player: null, // { name, avatar, startLevel } – set in Player Setup
      settings: { sound: true, voiceSpeed: 'normal', jpHints: true, textSize: 'normal' },
      coins: 0,
      progress: {},  // { village: { v1: { stars: 3, best: 95 } } }
      weakWords: [],
      createdAt: now,
      updatedAt: now
    };
  }

  // Check localStorage works (blocked in some private modes)
  let storageOK = true;
  try {
    localStorage.setItem(KEY + '_test', '1');
    localStorage.removeItem(KEY + '_test');
  } catch (e) {
    storageOK = false;
  }

  // Fill in any missing fields so older/partial saves still work
  function repair(data) {
    const d = defaultSave();
    if (!data || typeof data !== 'object') return d;
    return {
      version: VERSION,
      player: data.player && typeof data.player.name === 'string' ? data.player : null,
      settings: Object.assign(d.settings, data.settings || {}),
      coins: Number.isFinite(data.coins) && data.coins >= 0 ? Math.floor(data.coins) : 0,
      progress: data.progress && typeof data.progress === 'object' ? data.progress : {},
      weakWords: Array.isArray(data.weakWords) ? data.weakWords : [],
      createdAt: data.createdAt || d.createdAt,
      updatedAt: data.updatedAt || d.updatedAt
    };
  }

  function load() {
    if (!storageOK) return defaultSave();
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return defaultSave(); }
    if (!raw) return defaultSave();
    try {
      const data = JSON.parse(raw);
      if (data.version > VERSION) throw new Error('future version');
      return repair(data);
    } catch (e) {
      // Broken save: keep a copy, then start fresh instead of crashing
      try { localStorage.setItem(BACKUP_KEY, raw); } catch (e2) {}
      console.warn('Reading Quest: save was unreadable; copy kept in', BACKUP_KEY);
      return defaultSave();
    }
  }

  let state = load();

  function write() {
    state.updatedAt = Date.now();
    if (!storageOK) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Reading Quest: could not save', e);
      return false;
    }
  }

  // ---------- Backup code (copy/paste) ----------
  // Base64 of the JSON, with a short checksum so typos are caught.
  function checksum(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h.toString(36).slice(-4).padStart(4, '0');
  }
  function toCode() {
    const json = JSON.stringify(state);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return 'RQ1-' + checksum(b64) + '-' + b64;
  }
  function fromCode(code) {
    code = String(code || '').trim().replace(/\s+/g, '');
    const m = code.match(/^RQ1-([0-9a-z]{4})-(.+)$/);
    if (!m) throw new Error('This is not a Reading Quest code.');
    if (checksum(m[2]) !== m[1]) throw new Error('The code has a typo or is incomplete.');
    const json = decodeURIComponent(escape(atob(m[2])));
    return repair(JSON.parse(json));
  }

  // ---------- Public API ----------
  window.RQSave = {
    storageOK,
    get: () => state,
    save: write,

    setPlayer(player) { state.player = player; write(); },
    setSetting(name, value) { state.settings[name] = value; write(); },
    addCoins(n) { state.coins = Math.max(0, state.coins + Math.floor(n)); write(); },

    getStage(regionId, stageId) {
      return (state.progress[regionId] || {})[stageId] || null;
    },
    // Only ever improves a result – never lowers stars/best
    recordStage(regionId, stageId, stars, score) {
      const r = state.progress[regionId] = state.progress[regionId] || {};
      const old = r[stageId] || { stars: 0, best: 0 };
      r[stageId] = { stars: Math.max(old.stars, stars), best: Math.max(old.best, score) };
      write();
    },
    regionStars(regionId) {
      return Object.values(state.progress[regionId] || {}).reduce((s, x) => s + (x.stars || 0), 0);
    },

    // Backup
    exportCode: toCode,
    importCode(code) { state = fromCode(code); write(); },
    downloadFile() {
      const blob = new Blob([toCode()], { type: 'text/plain' });
      const a = document.createElement('a');
      const name = (state.player && state.player.name) || 'player';
      a.href = URL.createObjectURL(blob);
      a.download = 'reading-quest-' + name.replace(/[^\w-]/g, '') + '.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    },

    // Deletes ONLY Reading Quest's own save
    resetAll() {
      state = defaultSave();
      try { localStorage.removeItem(KEY); } catch (e) {}
    }
  };
})();
