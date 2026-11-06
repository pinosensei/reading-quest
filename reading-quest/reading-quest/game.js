/* =========================================================
   Reading Quest – Game (Step 1: screens, setup, map, settings)
   ========================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const S = window.RQSave;
  const REGIONS = window.RQ_REGIONS;

  // ---------------- Original avatars (drawn in code) ----------------
  const AVATARS = [
    { id: 'kai',  name: 'Kai',  type: 'boy',  hair: 'short',   hairColor: '#2B2A33', skin: '#F6D3B3', shirt: '#4A90E2' },
    { id: 'ren',  name: 'Ren',  type: 'boy',  hair: 'spiky',   hairColor: '#6B3E26', skin: '#EBC09A', shirt: '#2EAD6B' },
    { id: 'taro', name: 'Taro', type: 'boy',  hair: 'cap',     hairColor: '#2B2A33', skin: '#D9A47C', shirt: '#FF8A3D' },
    { id: 'mia',  name: 'Mia',  type: 'girl', hair: 'pigtails',hairColor: '#2B2A33', skin: '#F6D3B3', shirt: '#E5609B' },
    { id: 'hana', name: 'Hana', type: 'girl', hair: 'long',    hairColor: '#8A4B2A', skin: '#EBC09A', shirt: '#8E6CDB' },
    { id: 'sora', name: 'Sora', type: 'girl', hair: 'bob',     hairColor: '#2B2A33', skin: '#D9A47C', shirt: '#FFC531' }
  ];

  function avatarSVG(id) {
    const a = AVATARS.find((x) => x.id === id) || AVATARS[0];
    const h = a.hairColor;
    let back = '', front = '';
    switch (a.hair) {
      case 'short':
        front = `<path d="M26 44 Q26 20 50 20 Q74 20 74 44 Q66 32 50 32 Q36 32 26 44Z" fill="${h}"/>`; break;
      case 'spiky':
        front = `<path d="M25 46 L28 26 L36 32 L40 18 L48 28 L54 16 L60 28 L68 20 L70 32 L76 28 L75 46 Q66 32 50 33 Q34 32 25 46Z" fill="${h}"/>`; break;
      case 'cap':
        front = `<path d="M24 42 Q24 18 50 18 Q76 18 76 42Z" fill="#E5484D"/><rect x="48" y="38" width="36" height="7" rx="3.5" fill="#C23A3E"/><circle cx="50" cy="20" r="3" fill="#C23A3E"/>`; break;
      case 'pigtails':
        back = `<circle cx="20" cy="50" r="10" fill="${h}"/><circle cx="80" cy="50" r="10" fill="${h}"/><circle cx="27" cy="44" r="3" fill="#FFC531"/><circle cx="73" cy="44" r="3" fill="#FFC531"/>`;
        front = `<path d="M26 46 Q24 20 50 20 Q76 20 74 46 Q70 30 56 30 L50 36 L44 30 Q30 30 26 46Z" fill="${h}"/>`; break;
      case 'long':
        back = `<path d="M22 46 Q20 18 50 18 Q80 18 78 46 L80 84 L20 84Z" fill="${h}"/>`;
        front = `<path d="M26 44 Q28 22 50 22 Q72 22 74 44 Q60 30 40 34 Q32 36 26 44Z" fill="${h}"/>`; break;
      case 'bob':
        back = `<path d="M22 48 Q20 18 50 18 Q80 18 78 48 L78 62 Q70 66 66 60 L34 60 Q30 66 22 62Z" fill="${h}"/>`;
        front = `<path d="M26 44 Q26 22 50 22 Q74 22 74 44 L74 38 Q50 30 26 38Z" fill="${h}"/><rect x="62" y="28" width="10" height="5" rx="2.5" fill="#4A90E2"/>`; break;
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true">
      ${back}
      <path d="M20 100 Q20 74 50 74 Q80 74 80 100Z" fill="${a.shirt}"/>
      <rect x="44" y="64" width="12" height="12" rx="4" fill="${a.skin}"/>
      <circle cx="50" cy="46" r="24" fill="${a.skin}"/>
      <circle cx="26" cy="48" r="4" fill="${a.skin}"/><circle cx="74" cy="48" r="4" fill="${a.skin}"/>
      ${front}
      <circle cx="41" cy="48" r="3.4" fill="#2B2A33"/><circle cx="59" cy="48" r="3.4" fill="#2B2A33"/>
      <circle cx="42.2" cy="46.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="46.8" r="1.1" fill="#fff"/>
      <circle cx="35" cy="56" r="3.5" fill="#FF8A8A" opacity=".45"/><circle cx="65" cy="56" r="3.5" fill="#FF8A8A" opacity=".45"/>
      <path d="M43 57 Q50 63 57 57" stroke="#2B2A33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  // ---------------- Levels (original, not textbook-branded) ----------------
  const LEVELS = [
    { id: 'starter', icon: '🌱', name: 'Starter', jp: '小学生' },
    { id: 'lv1',     icon: '⭐', name: 'Level 1', jp: '中学1年' },
    { id: 'lv2',     icon: '🌟', name: 'Level 2', jp: '中学2年' },
    { id: 'lv3',     icon: '🏆', name: 'Level 3', jp: '中学3年' }
  ];

  // ---------------- Helpers ----------------
  function show(screenId) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden'));
    $(screenId).classList.remove('hidden');
    window.scrollTo(0, 0);
  }
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }
  function confirmBox(text) {
    return new Promise((resolve) => {
      $('confirm-text').textContent = text;
      $('modal-confirm').classList.remove('hidden');
      const done = (v) => { $('modal-confirm').classList.add('hidden'); resolve(v); };
      $('confirm-yes').onclick = () => done(true);
      $('confirm-no').onclick = () => done(false);
    });
  }
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function starsHTML(n, max = 3) {
    let out = '';
    for (let i = 0; i < max; i++) out += `<span class="${i < n ? 'star-on' : 'star-off'}">★</span>`;
    return out;
  }

  // ---------------- Voice ----------------
  function speak(text) {
    const st = S.get().settings;
    if (!st.sound || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = st.voiceSpeed === 'slow' ? 0.7 : 0.95;
    const v = speechSynthesis.getVoices().find((x) => /^en(-|_)(US|GB)/i.test(x.lang));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // ---------------- Apply settings ----------------
  function applySettings() {
    const st = S.get().settings;
    document.body.classList.toggle('large-text', st.textSize === 'large');
    document.querySelectorAll('.seg').forEach((seg) => {
      const val = String(st[seg.dataset.setting]);
      seg.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.value === val));
    });
  }

  // ---------------- Title ----------------
  function initTitle() {
    if (!S.storageOK) $('storage-warning').classList.remove('hidden');
    const hasPlayer = !!S.get().player;
    $('btn-continue').classList.toggle('hidden', !hasPlayer);
    $('btn-new').innerHTML = hasPlayer
      ? 'New player <small>あたらしくはじめる</small>'
      : 'Start <small>はじめる</small>';
    if (hasPlayer) $('btn-new').className = 'btn btn-ghost btn-big';
  }
  $('btn-continue').onclick = () => openMap();
  $('btn-new').onclick = async () => {
    if (S.get().player) {
      const ok = await confirmBox('Start a new player? This deletes the current Reading Quest save.\nあたらしくはじめると、今のきろくはきえます。');
      if (!ok) return;
      S.resetAll();
      applySettings();
    }
    openSetup();
  };

  // ---------------- Player setup ----------------
  let pick = { avatar: null, level: null };
  function openSetup() {
    pick = { avatar: null, level: null };
    $('input-name').value = '';
    $('setup-error').classList.add('hidden');
    $('avatar-grid').innerHTML = AVATARS.map((a) =>
      `<button class="avatar-option" data-id="${a.id}">${avatarSVG(a.id)}<span>${a.name}</span></button>`).join('');
    $('level-grid').innerHTML = LEVELS.map((l) =>
      `<button class="level-option" data-id="${l.id}"><span class="lv-icon">${l.icon}</span>${l.name}<small>${l.jp}</small></button>`).join('');
    show('screen-setup');
  }
  $('avatar-grid').onclick = (e) => {
    const b = e.target.closest('.avatar-option'); if (!b) return;
    pick.avatar = b.dataset.id;
    document.querySelectorAll('.avatar-option').forEach((x) => x.classList.toggle('selected', x === b));
  };
  $('level-grid').onclick = (e) => {
    const b = e.target.closest('.level-option'); if (!b) return;
    pick.level = b.dataset.id;
    document.querySelectorAll('.level-option').forEach((x) => x.classList.toggle('selected', x === b));
  };
  $('btn-setup-done').onclick = () => {
    const name = $('input-name').value.trim();
    let err = '';
    if (!/^[A-Za-z][A-Za-z .'-]{0,11}$/.test(name)) err = 'Please type your name in English letters. なまえをローマ字で入れてね。';
    else if (!pick.avatar) err = 'Choose a character! キャラクターをえらんでね。';
    else if (!pick.level) err = 'Choose your level! レベルをえらんでね。';
    if (err) { $('setup-error').textContent = err; $('setup-error').classList.remove('hidden'); return; }
    S.setPlayer({ name, avatar: pick.avatar, startLevel: pick.level });
    speak('Welcome, ' + name + '!');
    openMap();
  };

  // ---------------- World map ----------------
  // Spot positions in % of the map (zig-zag path from bottom to top)
  const SPOTS = {
    village:  { x: 22, y: 80, icon: '🏡' },
    forest:   { x: 72, y: 66, icon: '🌳' },
    mountain: { x: 28, y: 40, icon: '⛰️' },
    castle:   { x: 74, y: 18, icon: '🏰' }
  };

  const MAP_SVG = `
  <svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
    <rect width="400" height="300" fill="#BFE6F5"/>
    <path d="M30 290 Q10 200 40 150 Q20 80 80 50 Q120 10 220 20 Q330 10 370 60 Q395 120 370 180 Q395 250 340 290Z" fill="#CDE8A8"/>
    <path d="M44 280 Q28 200 54 155 Q38 90 92 62 Q130 30 220 34 Q320 26 356 70 Q378 125 356 182 Q376 245 330 280Z" fill="#B8DE8C"/>
    <path d="M88 240 Q180 240 288 198 Q200 160 112 120 Q200 80 296 54" fill="none" stroke="#F3E3BC" stroke-width="12" stroke-linecap="round"/>
    <path d="M88 240 Q180 240 288 198 Q200 160 112 120 Q200 80 296 54" fill="none" stroke="#E3CB92" stroke-width="2.5" stroke-dasharray="6 8" stroke-linecap="round"/>
    <!-- village houses -->
    <g transform="translate(48 210)">
      <rect x="0" y="12" width="18" height="14" fill="#FFF1DC"/><path d="M-3 13 L9 2 L21 13Z" fill="#E56F22"/>
      <rect x="24" y="16" width="16" height="12" fill="#FFF1DC"/><path d="M21 17 L32 7 L43 17Z" fill="#4A90E2"/>
    </g>
    <!-- forest -->
    <g fill="#2E8B57">
      <circle cx="318" cy="222" r="12"/><circle cx="336" cy="214" r="14"/><circle cx="352" cy="226" r="11"/>
      <circle cx="300" cy="234" r="10"/><circle cx="330" cy="238" r="12"/>
    </g>
    <!-- mountain -->
    <path d="M60 140 L100 76 L128 112 L146 90 L184 140Z" fill="#9AAFCB"/>
    <path d="M88 96 L100 76 L112 92 L104 90 L98 98Z" fill="#fff"/>
    <!-- castle -->
    <g transform="translate(322 20)">
      <rect x="0" y="14" width="40" height="26" fill="#D9CCF2"/>
      <rect x="-6" y="6" width="12" height="34" fill="#C7B6EC"/><rect x="34" y="6" width="12" height="34" fill="#C7B6EC"/>
      <path d="M-8 7 L0 -4 L8 7Z" fill="#8E6CDB"/><path d="M32 7 L40 -4 L48 7Z" fill="#8E6CDB"/>
      <rect x="15" y="26" width="10" height="14" rx="5" fill="#8E6CDB"/>
    </g>
    <!-- waves -->
    <g stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round">
      <path d="M10 40 q6 -5 12 0 q6 5 12 0"/><path d="M370 260 q6 -5 12 0 q6 5 12 0"/><path d="M8 250 q6 -5 12 0"/>
    </g>
  </svg>`;

  function openMap() {
    const st = S.get();
    if (!st.player) return openSetup();
    $('top-avatar').innerHTML = avatarSVG(st.player.avatar);
    $('top-name').textContent = st.player.name;
    $('top-coins').textContent = st.coins.toLocaleString();

    let html = MAP_SVG;
    REGIONS.forEach((r) => {
      const p = SPOTS[r.id]; if (!p) return;
      const max = r.stages.length * 3;
      const sub = r.open
        ? `<span class="spot-stars">⭐ ${S.regionStars(r.id)} / ${max}</span>`
        : `<span class="spot-stars">🔒 Coming soon</span>`;
      html += `<button class="map-spot ${r.open ? 'open' : 'locked'}" data-id="${r.id}"
        style="left:${p.x}%;top:${p.y}%;--spot-color:${r.color}">
        <span>${p.icon}</span><b>${r.name}</b>${sub}</button>`;
    });
    $('world-map').innerHTML = html;
    show('screen-map');
  }
  $('world-map').onclick = (e) => {
    const b = e.target.closest('.map-spot'); if (!b) return;
    const r = REGIONS.find((x) => x.id === b.dataset.id);
    if (!r.open) { toast(`${r.name} is coming soon! もうすぐオープン！`); return; }
    openRegion(r.id);
  };

  // ---------------- Region ----------------
  let currentRegion = null;
  function isStageOpen(region, index) {
    const stage = region.stages[index];
    if (stage.boss) return S.regionStars(region.id) >= (stage.needStars || 0);
    if (index === 0) return true;
    const prev = S.getStage(region.id, region.stages[index - 1].id);
    return !!(prev && prev.stars > 0);
  }
  function openRegion(regionId) {
    const r = REGIONS.find((x) => x.id === regionId);
    currentRegion = r;
    const jp = S.get().settings.jpHints;
    document.documentElement.style.setProperty('--region-color', r.color);
    $('region-title').innerHTML = `${escapeHTML(r.name)}${jp ? ` <small>${r.jp}</small>` : ''}`;
    $('region-skill').textContent = r.skill + (jp ? ' ・ ' + r.skillJp : '');
    $('region-stars').textContent = `${S.regionStars(r.id)} / ${r.stages.length * 3}`;
    document.querySelectorAll('.js-coins').forEach((el) => (el.textContent = S.get().coins.toLocaleString()));

    let n = 0;
    $('stage-list').innerHTML = r.stages.map((st, i) => {
      const open = isStageOpen(r, i);
      const rec = S.getStage(r.id, st.id);
      const label = st.boss ? '👑 BOSS' : `Stage ${++n}`;
      const lockInfo = st.boss ? `🔒 Need ⭐${st.needStars}` : '🔒';
      return `<button class="stage-card ${open ? '' : 'locked'} ${st.boss ? 'boss' : ''}" data-index="${i}">
        <span class="stage-num">${label}</span>
        <span class="stage-name">${escapeHTML(st.name)}</span>
        ${jp ? `<small>${st.jp}</small>` : ''}
        ${open ? `<span class="stage-stars">${starsHTML(rec ? rec.stars : 0)}</span>` : `<span class="stage-lock">${lockInfo}</span>`}
      </button>`;
    }).join('');
    show('screen-region');
  }
  $('stage-list').onclick = (e) => {
    const b = e.target.closest('.stage-card'); if (!b) return;
    const i = +b.dataset.index;
    if (!isStageOpen(currentRegion, i)) { toast('Clear the stage before this one first! まえのステージをクリアしよう！'); return; }
    // Step 2 will start the real game here.
    toast('🛠️ Games arrive in Step 2! ゲームはステップ2で追加します。');
  };
  $('btn-back-map').onclick = () => openMap();

  // ---------------- Settings ----------------
  function openSettings() {
    applySettings();
    $('code-box').classList.add('hidden');
    $('code-actions').classList.add('hidden');
    $('backup-msg').textContent = '';
    $('modal-settings').classList.remove('hidden');
  }
  function closeSettings() {
    $('modal-settings').classList.add('hidden');
    // refresh whichever screen is showing (text size / hints may change)
    if (!$('screen-region').classList.contains('hidden') && currentRegion) openRegion(currentRegion.id);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('.js-open-settings')) openSettings();
    if (e.target.closest('.js-close-modal')) closeSettings();
    if (e.target.id === 'modal-settings') closeSettings();
  });
  document.querySelectorAll('.seg').forEach((seg) => {
    seg.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      let v = b.dataset.value;
      if (v === 'true') v = true; else if (v === 'false') v = false;
      S.setSetting(seg.dataset.setting, v);
      applySettings();
    };
  });
  $('btn-test-voice').onclick = () => {
    if (!S.get().settings.sound) { toast('Sound is OFF. おとがOFFです。'); return; }
    speak('Hello! Let\'s read together.');
  };

  // Backup
  const msg = (t, ok = true) => { $('backup-msg').textContent = t; $('backup-msg').style.color = ok ? 'var(--good)' : 'var(--danger)'; };
  $('btn-download').onclick = () => { S.downloadFile(); msg('Saved file downloaded! ダウンロードしました。'); };
  $('btn-show-code').onclick = () => {
    $('code-box').value = S.exportCode();
    $('code-box').readOnly = true;
    $('code-box').classList.remove('hidden');
    $('code-actions').classList.remove('hidden');
    $('btn-copy-code').classList.remove('hidden');
    $('btn-load-code').classList.add('hidden');
    msg('');
  };
  $('btn-enter-code').onclick = () => {
    $('code-box').value = '';
    $('code-box').readOnly = false;
    $('code-box').placeholder = 'Paste your RQ1-... code here';
    $('code-box').classList.remove('hidden');
    $('code-actions').classList.remove('hidden');
    $('btn-copy-code').classList.add('hidden');
    $('btn-load-code').classList.remove('hidden');
    $('code-box').focus();
    msg('');
  };
  $('btn-copy-code').onclick = async () => {
    try { await navigator.clipboard.writeText($('code-box').value); msg('Copied! コピーしました。'); }
    catch (e) { $('code-box').select(); msg('Select and copy the code. コードをコピーしてね。'); }
  };
  async function loadCode(code) {
    const ok = await confirmBox('Load this save? Your current Reading Quest progress will be replaced.\nこのきろくを読みこみますか？');
    if (!ok) return;
    try {
      S.importCode(code);
      applySettings();
      msg('Loaded! 読みこみました。');
      setTimeout(() => { closeSettings(); openMap(); }, 600);
    } catch (e) {
      msg('❌ ' + e.message, false);
    }
  }
  $('btn-load-code').onclick = () => loadCode($('code-box').value);
  $('input-file').onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => loadCode(reader.result);
    reader.readAsText(f);
    e.target.value = '';
  };
  $('btn-reset').onclick = async () => {
    const ok = await confirmBox('Delete your Reading Quest save? This cannot be undone.\n(Your other Pino Sensei sites are NOT affected.)\nきろくをけしますか？');
    if (!ok) return;
    S.resetAll();
    applySettings();
    $('modal-settings').classList.add('hidden');
    initTitle();
    show('screen-title');
  };

  // Close modals with Escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSettings(); });

  // Some browsers load voices late
  if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};

  // ---------------- Start ----------------
  applySettings();
  initTitle();
  show('screen-title');
})();
