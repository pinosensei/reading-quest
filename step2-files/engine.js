/* =========================================================
   Reading Quest – Game Engine (shared by every stage)
   ---------------------------------------------------------
   Plays a list of questions from stages.js, then shows the
   result: stars, coins, and saves missed items as weak words.

   Scoring:  0–1 mistakes = 3 stars, 2–3 = 2 stars, 4+ = 1 star
   Coins:    5 per star, +10 bonus the FIRST time you get 3 stars
   ========================================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const S = window.RQSave;
  const APP = window.RQApp;

  let run = null; // the stage being played

  // ---------- little sound effects (no files needed) ----------
  let audioCtx = null;
  function beep(type) {
    if (!S.get().settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = type === 'good' ? [660, 880] : type === 'win' ? [523, 659, 784, 1047] : [220, 180];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type === 'bad' ? 'square' : 'triangle';
        o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(type === 'bad' ? 0.06 : 0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g).connect(audioCtx.destination);
        o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* sound not available – ignore */ }
  }

  function starsFor(mistakes) { return mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1; }

  // ---------- start a stage ----------
  function start(regionId, stageId) {
    const region = window.RQ_REGIONS.find((r) => r.id === regionId);
    const stage = region && region.stages.find((s) => s.id === stageId);
    const maker = window.RQ_STAGES[stageId];
    if (!stage || !maker) {
      APP.toast('🛠️ This stage is coming soon! もうすぐあそべます。');
      return;
    }
    const st = S.get();
    const questions = maker({
      sound: st.settings.sound && 'speechSynthesis' in window,
      level: (st.player && st.player.startLevel) || 'starter'
    });
    run = { region, stage, questions, index: 0, mistakes: 0, missed: [], locked: false };
    document.documentElement.style.setProperty('--region-color', region.color);
    $('play-stage-name').textContent = (stage.boss ? '👑 ' : '') + stage.name;
    APP.show('screen-play');
    showQuestion();
  }

  // ---------- one question ----------
  function showQuestion() {
    const q = run.questions[run.index];
    const jp = S.get().settings.jpHints;
    run.locked = false;
    run.missedThis = false;

    $('play-count').textContent = `${run.index + 1} / ${run.questions.length}`;
    $('play-bar-fill').style.width = (run.index / run.questions.length) * 100 + '%';
    $('play-instruction').textContent = q.instruction;
    $('play-instruction-jp').textContent = jp ? q.instructionJp || '' : '';
    $('play-prompt').innerHTML = q.prompt || '';
    $('play-feedback').textContent = '';
    $('play-feedback').className = 'play-feedback';

    const canSay = q.kind === 'listen' && q.say;
    $('btn-listen').classList.toggle('hidden', !canSay);

    $('play-choices').className = 'play-choices' + (q.big ? ' big' : '');
    $('play-choices').innerHTML = q.choices.map((c) =>
      `<button class="choice-btn" data-value="${APP.escapeHTML(c)}">${APP.escapeHTML(c)}</button>`).join('');

    // little pop-in animation
    const card = document.querySelector('.play-card');
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');

    if (canSay) setTimeout(() => APP.speak(q.say), 350);
  }

  function answer(btn) {
    if (!run || run.locked) return;
    const q = run.questions[run.index];
    const value = btn.dataset.value;

    if (value === q.answer) {
      run.locked = true;
      btn.classList.add('correct');
      beep('good');
      const praise = ['Great!', 'Nice!', 'Good job!', 'Perfect!', 'Yes!'][Math.floor(Math.random() * 5)];
      $('play-feedback').textContent = run.missedThis ? 'OK! ⭕' : praise + ' ⭕';
      $('play-feedback').className = 'play-feedback good';
      setTimeout(next, run.missedThis ? 900 : 750);
    } else {
      // wrong: count ONE mistake per question, show the answer, then move on
      btn.classList.add('wrong');
      beep('bad');
      if (!run.missedThis) {
        run.missedThis = true;
        run.mistakes++;
        if (q.weak) run.missed.push(q.weak);
      }
      run.locked = true;
      const right = [...document.querySelectorAll('.choice-btn')].find((b) => b.dataset.value === q.answer);
      setTimeout(() => {
        right.classList.add('show-answer');
        $('play-feedback').textContent = `The answer is "${q.answer}". こたえは「${q.answer}」`;
        $('play-feedback').className = 'play-feedback bad';
        if (q.say) APP.speak(q.say);
      }, 350);
      setTimeout(next, 1900);
    }
  }

  function next() {
    run.index++;
    if (run.index < run.questions.length) showQuestion();
    else finish();
  }

  // ---------- result ----------
  function finish() {
    const { region, stage, mistakes, missed } = run;
    const stars = starsFor(mistakes);
    const total = run.questions.length;
    const score = Math.round(((total - mistakes) / total) * 100);
    const before = S.getStage(region.id, stage.id);
    const firstThree = stars === 3 && !(before && before.stars === 3);
    const coins = stars * 5 + (firstThree ? 10 : 0);

    S.recordStage(region.id, stage.id, stars, score);
    S.addCoins(coins);
    missed.forEach((w) => S.addWeak(w));

    $('play-bar-fill').style.width = '100%';
    $('result-stage').textContent = (stage.boss ? '👑 ' : '') + stage.name;
    $('result-title').innerHTML = stars === 3 ? 'Amazing! <small>すばらしい！</small>'
      : stars === 2 ? 'Great job! <small>よくできました！</small>'
      : 'Stage clear! <small>クリア！</small>';
    $('result-stars').innerHTML = [1, 2, 3].map((n) =>
      `<span class="big-star ${n <= stars ? 'on' : ''}" style="animation-delay:${n * 0.25}s">★</span>`).join('');
    $('result-detail').textContent = `Correct: ${total - mistakes} / ${total}` + (mistakes ? `  ・  Mistakes: ${mistakes}` : '  ・  No mistakes! 🎉');
    $('result-coins').innerHTML = `🪙 +${coins}` + (firstThree ? ' <small>(⭐⭐⭐ bonus +10)</small>' : '');

    // Is there a next stage, and is it open now?
    const i = region.stages.indexOf(stage);
    const nextStage = region.stages[i + 1];
    const canNext = nextStage && APP.isStageOpen(region, i + 1) && !!window.RQ_STAGES[nextStage.id];
    $('btn-next-stage').classList.toggle('hidden', !canNext);
    run.nextStageId = canNext ? nextStage.id : null;

    APP.show('screen-result');
    beep('win');
    APP.speak(stars === 3 ? 'Amazing!' : stars === 2 ? 'Great job!' : 'Stage clear!');
  }

  // ---------- buttons ----------
  $('play-choices').onclick = (e) => {
    const b = e.target.closest('.choice-btn'); if (b) answer(b);
  };
  $('btn-listen').onclick = () => { const q = run && run.questions[run.index]; if (q && q.say) APP.speak(q.say); };
  $('btn-quit').onclick = async () => {
    const ok = await APP.confirmBox('Quit this stage? Your answers will not be saved.\nステージをやめますか？');
    if (ok) { run = null; APP.openRegion(); }
  };
  $('btn-retry').onclick = () => start(run.region.id, run.stage.id);
  $('btn-next-stage').onclick = () => {
    if (!window.RQ_STAGES[run.nextStageId]) {
      APP.openRegion();
      APP.toast('🛠️ The next game is coming soon! つぎのゲームはもうすぐ！');
      return;
    }
    start(run.region.id, run.nextStageId);
  };
  $('btn-to-stages').onclick = () => APP.openRegion();

  // Keyboard: 1-4 to answer (for PC)
  document.addEventListener('keydown', (e) => {
    if ($('screen-play').classList.contains('hidden')) return;
    const n = parseInt(e.key, 10);
    const btns = document.querySelectorAll('.choice-btn');
    if (n >= 1 && n <= btns.length) answer(btns[n - 1]);
  });

  window.RQPlay = { start };
})();
