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
      const notes = type === 'good' ? [660, 880] : type === 'win' ? [523, 659, 784, 1047]
        : type === 'tick' ? [990] : [220, 180];
      notes.forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = type === 'bad' ? 'square' : 'triangle';
        o.frequency.value = f;
        const t = audioCtx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(type === 'bad' ? 0.06 : type === 'tick' ? 0.08 : 0.18, t + 0.02);
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
      jpHints: st.settings.jpHints,
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
    clearTimeout(run.flashTimer);

    $('play-count').textContent = `${run.index + 1} / ${run.questions.length}`;
    $('play-bar-fill').style.width = (run.index / run.questions.length) * 100 + '%';
    $('play-instruction').textContent = q.instruction;
    $('play-instruction-jp').textContent = jp ? q.instructionJp || '' : '';
    $('play-prompt').innerHTML = q.prompt || '';
    $('play-feedback').textContent = '';
    $('play-feedback').className = 'play-feedback';

    const canSay = q.kind === 'listen' && q.say;
    $('btn-listen').classList.toggle('hidden', !canSay);

    if (q.type === 'build') {
      // Letter tiles: tap them in order to spell the word
      run.built = 0;
      $('play-choices').className = 'play-choices build';
      $('play-choices').innerHTML =
        `<div class="build-slots">${q.answer.split('').map(() => '<span class="slot"></span>').join('')}</div>
         <div class="build-tiles">${q.tiles.map((t) =>
           `<button class="tile" data-value="${APP.escapeHTML(t)}">${APP.escapeHTML(t)}</button>`).join('')}</div>`;
    } else {
      $('play-choices').className = 'play-choices' + (q.big ? ' big' : '') + (q.pics ? ' pics' : '');
      $('play-choices').innerHTML = q.choices.map((c) =>
        `<button class="choice-btn" data-value="${APP.escapeHTML(c)}">${APP.escapeHTML(c)}</button>`).join('');
    }

    // Flash mode (Quick Words): show the word for a short time, then hide it
    if (q.flashMs) {
      run.locked = true;
      $('play-choices').classList.add('waiting');
      $('play-prompt').insertAdjacentHTML('beforeend',
        `<div class="flash-timer"><i style="animation-duration:${q.flashMs}ms"></i></div>`);
      const myRun = run;
      run.flashTimer = setTimeout(() => {
        if (run !== myRun) return;
        $('play-prompt').innerHTML = '<div class="prompt-word hidden-word">？</div>';
        $('play-instruction').textContent = q.instruction2 || q.instruction;
        $('play-instruction-jp').textContent = jp ? q.instruction2Jp || '' : '';
        $('play-choices').classList.remove('waiting');
        run.locked = false;
      }, q.flashMs);
    }

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
      if (q.sayOnCorrect) APP.speak(q.sayOnCorrect);
      setTimeout(next, q.sayOnCorrect ? 1100 : run.missedThis ? 900 : 750);
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
        const shown = q.reveal || q.answer;
        if (q.flashMs) $('play-prompt').innerHTML = `<div class="prompt-word">${APP.escapeHTML(q.answer)}</div>`;
        $('play-feedback').textContent = `The answer is "${shown}". こたえは「${shown}」`;
        $('play-feedback').className = 'play-feedback bad';
        if (q.say) APP.speak(q.say);
      }, 350);
      setTimeout(next, 1900);
    }
  }

  // ---------- letter tiles (Build a Word) ----------
  function countMistake(q) {
    if (run.missedThis) return;
    run.missedThis = true;
    run.mistakes++;
    if (q.weak) run.missed.push(q.weak);
  }
  function buildTap(tile) {
    if (!run || run.locked) return;
    const q = run.questions[run.index];
    const want = q.answer[run.built];
    document.querySelectorAll('.tile.hint').forEach((t) => t.classList.remove('hint'));

    if (tile && tile.dataset.value === want) {
      const slot = document.querySelectorAll('.build-slots .slot')[run.built];
      slot.textContent = want;
      slot.classList.add('filled');
      tile.classList.add('used');
      tile.disabled = true;
      run.built++;
      beep('tick');
      $('play-feedback').textContent = '';
      if (run.built === q.answer.length) {
        run.locked = true;
        document.querySelectorAll('.build-slots .slot').forEach((sl) => sl.classList.add('done'));
        beep('good');
        const praise = ['Great!', 'Nice spelling!', 'Good job!', 'Perfect!', 'You did it!'][Math.floor(Math.random() * 5)];
        $('play-feedback').textContent = (run.missedThis ? 'OK!' : praise) + ' ⭕ ' + q.answer;
        $('play-feedback').className = 'play-feedback good';
        setTimeout(next, 1100);
      }
    } else {
      // wrong letter: shake, count one mistake for this word, then glow the right tile as a hint
      if (tile) {
        tile.classList.add('wrong');
        setTimeout(() => tile.classList.remove('wrong'), 450);
      }
      beep('bad');
      countMistake(q);
      $('play-feedback').textContent = 'Try again! もういちど！';
      $('play-feedback').className = 'play-feedback bad';
      const right = [...document.querySelectorAll('.tile:not(.used)')].find((t) => t.dataset.value === want);
      if (right) setTimeout(() => right.classList.add('hint'), 450);
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
    const t = e.target.closest('.tile'); if (t && !t.disabled) buildTap(t);
  };
  $('btn-listen').onclick = () => { const q = run && run.questions[run.index]; if (q && q.say) APP.speak(q.say); };
  $('btn-quit').onclick = async () => {
    const ok = await APP.confirmBox('Quit this stage? Your answers will not be saved.\nステージをやめますか？');
    if (ok) { if (run) clearTimeout(run.flashTimer); run = null; APP.openRegion(); }
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
    const q = run && run.questions[run.index];
    if (q && q.type === 'build' && /^[a-z]$/i.test(e.key)) {   // PC: type the letters
      const key = e.key.toLowerCase();
      buildTap([...document.querySelectorAll('.tile:not(.used)')].find((t) => t.dataset.value === key) || null);
      return;
    }
    const n = parseInt(e.key, 10);
    const btns = document.querySelectorAll('.choice-btn');
    if (n >= 1 && n <= btns.length) answer(btns[n - 1]);
  });

  window.RQPlay = { start };
})();
