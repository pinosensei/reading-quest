/* =========================================================
   Reading Quest – Stage question makers
   ---------------------------------------------------------
   Each stage id (from content/regions.js) has a function that
   returns a list of questions. engine.js plays them.

   Question format:
   {
     kind:  'listen' | 'look'     (listen needs sound ON)
     say:   text the voice reads   (optional)
     instruction / instructionJp: what to do
     prompt: HTML shown big in the middle
     choices: ['b', 'd', 'p', 'q']   (shown on the buttons)
     answer:  'b'
     big:     true = big letter buttons
     weak:   { key, en, jp, kind }  saved if the student misses it
   }
   ========================================================= */
(function () {
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // How the voice should say each letter name (single letters are
  // often read wrongly, e.g. "A" as "uh")
  const LETTER_SAY = {
    A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'jee', H: 'aitch', I: 'eye',
    J: 'jay', K: 'kay', L: 'el', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are',
    S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee'
  };

  // Letters students often mix up – used as tricky wrong answers
  const LOOK_ALIKE = [
    ['b', 'd', 'p', 'q'], ['m', 'n', 'h', 'u'], ['i', 'j', 'l', 't'], ['a', 'o', 'e', 'c'],
    ['v', 'w', 'y', 'u'], ['f', 't', 'k', 'h'], ['g', 'q', 'p', 'y'], ['r', 'n', 'h', 'm'], ['s', 'z', 'x', 'c']
  ];
  const SOUND_ALIKE = [
    ['B', 'D', 'E', 'G', 'P', 'T', 'V', 'Z'], ['A', 'H', 'J', 'K'], ['F', 'L', 'M', 'N', 'S', 'X'],
    ['I', 'Y'], ['Q', 'U', 'W'], ['O', 'R']
  ];

  // ---------- helpers ----------
  const rand = (n) => Math.floor(Math.random() * n);
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  // 4 choices: answer + up to 3 from "tricky" list, then random fillers
  function makeChoices(answer, tricky, pool, n = 4) {
    const set = [answer];
    shuffle(tricky.filter((x) => x !== answer)).forEach((x) => { if (set.length < n) set.push(x); });
    shuffle(pool).forEach((x) => { if (set.length < n && !set.includes(x)) set.push(x); });
    return shuffle(set);
  }
  // pick n different items, avoiding ones used already
  function pickLetters(n, used) {
    const out = shuffle(ABC.filter((l) => !used.has(l))).slice(0, n);
    out.forEach((l) => used.add(l));
    return out;
  }

  // ---------- Stage 1: Letter Friends ----------
  function letterFriends(opts) {
    const used = new Set();
    const qs = [];
    const canListen = opts.sound;

    // A) Listen and tap the letter (4)
    if (canListen) {
      pickLetters(4, used).forEach((L) => {
        const group = SOUND_ALIKE.find((g) => g.includes(L)) || [];
        qs.push({
          kind: 'listen',
          say: LETTER_SAY[L],
          instruction: 'Listen and tap the letter.',
          instructionJp: 'きいて、そのもじをタップしよう。',
          prompt: '<div class="prompt-ear">👂</div>',
          choices: makeChoices(L, group, ABC),
          answer: L,
          big: true,
          weak: { key: 'letter:' + L, en: L, jp: 'アルファベット ' + L, kind: 'letter-name' }
        });
      });
    }

    // B) Big letter -> find the small letter (3, or 5 if no sound)
    pickLetters(canListen ? 3 : 5, used).forEach((L) => {
      const l = L.toLowerCase();
      const group = LOOK_ALIKE.find((g) => g.includes(l)) || [];
      qs.push({
        kind: 'look',
        say: LETTER_SAY[L],
        instruction: 'Find the small letter.',
        instructionJp: '小文字（こもじ）はどれ？',
        prompt: `<div class="prompt-letter">${L}</div>`,
        choices: makeChoices(l, group, ABC.map((x) => x.toLowerCase())),
        answer: l,
        big: true,
        weak: { key: 'case:' + L, en: L + ' → ' + l, jp: '大文字と小文字', kind: 'letter-case' }
      });
    });

    // C) What comes next / what is missing? (3, or 5 if no sound)
    for (let i = 0; i < (canListen ? 3 : 5); i++) {
      const start = rand(ABC.length - 3);
      const row = ABC.slice(start, start + 4);
      const missing = i % 2 === 0 ? 3 : 1 + rand(2); // next letter, or a gap in the middle
      const answer = row[missing];
      const lower = Math.random() < 0.4;               // sometimes in small letters
      const show = (x) => (lower ? x.toLowerCase() : x);
      const shown = row.map((x, k) => (k === missing ? '<span class="gap">?</span>' : `<span>${show(x)}</span>`)).join('');
      const near = ABC.slice(Math.max(0, start - 2), start + 6).filter((x) => !row.includes(x) || x === answer);
      qs.push({
        kind: 'look',
        instruction: missing === 3 ? 'What comes next?' : 'Which letter is missing?',
        instructionJp: missing === 3 ? 'つぎにくるもじはどれ？' : 'ぬけているもじはどれ？',
        prompt: `<div class="prompt-row">${shown}</div>`,
        choices: makeChoices(show(answer), near.map(show),
          ABC.filter((x) => !row.includes(x) || x === answer).map(show)),
        answer: show(answer),
        big: true,
        weak: { key: 'order:' + answer, en: row.join(' '), jp: 'ABCのじゅんばん', kind: 'letter-order' }
      });
    }

    // Mix types a little but keep the easy listening ones first
    return qs.slice(0, canListen ? 4 : 0).concat(shuffle(qs.slice(canListen ? 4 : 0)));
  }

  window.RQ_STAGES = {
    v1: letterFriends
    // v2 Sound Match, v3 First Sounds ... arrive in the next steps
  };
  window.RQStageHelpers = { shuffle, makeChoices, LETTER_SAY, ABC };
})();
