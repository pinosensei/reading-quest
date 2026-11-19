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

  // ---------- Picture words for Stage 2 & 3 ----------
  // Starter words with a clear picture, one simple word, and a first
  // letter that makes its usual sound (no ch/sh/th/ph/wh/kn/wr starts).
  const PIC_THEMES = ['animals', 'food', 'school', 'things', 'body'];
  const ODD_START = /^(ch|sh|th|ph|wh|kn|wr)/;
  const ODD_WORDS = ['eye', 'ear', 'owl', 'onion', 'one', 'eight', 'head'];
  function pictureWords() {
    const seenPic = new Set();
    return window.RQWords.list('starter').filter((w) => {
      if (!PIC_THEMES.includes(w.theme) || !w.pic) return false;
      if (!/^[a-z]+$/.test(w.en) || ODD_START.test(w.en) || ODD_WORDS.includes(w.en)) return false;
      if (seenPic.has(w.pic)) return false;   // no two words with the same picture
      seenPic.add(w.pic);
      return true;
    });
  }
  // Pick n words, at most 2 starting with the same letter
  function pickWords(words, n) {
    const out = [], perLetter = {};
    shuffle(words).forEach((w) => {
      const f = w.en[0];
      if (out.length < n && (perLetter[f] || 0) < 2) { out.push(w); perLetter[f] = (perLetter[f] || 0) + 1; }
    });
    return out;
  }
  const weakWord = (w) => ({ key: 'word:' + w.en, en: w.en, jp: w.jp, kind: 'word' });

  // ---------- Stage 2: Sound Match ----------
  // Hear a word -> tap its picture. Q1–8: the other pictures start with
  // different letters. Q9–12 (harder): one picture starts the SAME way
  // (cat / cake), so students must listen to the whole word.
  // If sound is OFF: read the word -> tap the picture.
  function soundMatch(opts) {
    const all = pictureWords();
    return pickWords(all, 12).map((w, i) => {
      const hard = i >= 8;
      const same = shuffle(all.filter((x) => x.en !== w.en && x.en[0] === w.en[0]));
      const diff = shuffle(all.filter((x) => x.en[0] !== w.en[0]));
      const wrong = [];
      if (hard && same.length) wrong.push(same[0]);
      diff.forEach((x) => {
        if (wrong.length < 3 && !wrong.some((y) => y.en[0] === x.en[0])) wrong.push(x);
      });
      const choices = shuffle([w].concat(wrong)).map((x) => x.pic);
      return opts.sound ? {
        kind: 'listen',
        say: w.en,
        instruction: hard ? 'Listen carefully! Tap the picture.' : 'Listen and tap the picture.',
        instructionJp: hard ? 'よくきいて、絵をタップしよう。' : 'きいて、絵をタップしよう。',
        prompt: '<div class="prompt-ear">👂</div>',
        choices, answer: w.pic, pics: true,
        reveal: `${w.pic} ${w.en}`,
        weak: weakWord(w)
      } : {
        kind: 'look',
        instruction: 'Read and tap the picture.',
        instructionJp: 'よんで、絵をタップしよう。',
        prompt: `<div class="prompt-word">${w.en}</div>`,
        choices, answer: w.pic, pics: true,
        reveal: `${w.pic} ${w.en}`,
        weak: weakWord(w)
      };
    });
  }

  // ---------- Stage 3: First Sounds ----------
  // See a picture (and hear the word) -> tap its first letter.
  // Wrong letters are ones that SOUND close (b/d/p, m/n, f/v ...).
  const SOUND_GROUPS = [
    ['b', 'd', 'p'], ['m', 'n'], ['f', 'v', 'h'], ['s', 'z'], ['g', 'k', 'j'],
    ['t', 'd'], ['r', 'l'], ['w', 'y', 'r'], ['c', 'g'], ['a', 'e', 'i', 'o', 'u']
  ];
  // letters that make the SAME sound must never be a wrong answer
  const SAME_SOUND = { c: ['k', 'q'], k: ['c', 'q'] };
  function firstSounds(opts) {
    const lower = ABC.map((x) => x.toLowerCase());
    return pickWords(pictureWords(), 12).map((w) => {
      const f = w.en[0];
      const banned = SAME_SOUND[f] || [];
      const tricky = [].concat(...SOUND_GROUPS.filter((g) => g.includes(f)));
      const choices = makeChoices(f,
        tricky.filter((x) => !banned.includes(x)),
        lower.filter((x) => !banned.includes(x)));
      return {
        kind: opts.sound ? 'listen' : 'look',
        say: w.en,
        instruction: 'What is the first letter?',
        instructionJp: 'さいしょのもじはどれ？',
        prompt: `<div class="prompt-pic">${w.pic}</div>`,
        choices, answer: f, big: true,
        reveal: `${f} – ${w.en}`,
        weak: weakWord(w)
      };
    });
  }

  // ---------- Stage 4: Build a Word ----------
  // See the picture (and hear the word) -> tap letter tiles in order.
  // Q1–4: 3 letters, Q5–8: 4 letters, Q9–12: 5–6 letters.
  // Extra wrong tiles: 1 for short words, 2 for longer ones.
  function buildWord(opts) {
    const seenPic = new Set();
    const words = window.RQWords.list('starter').filter((w) => {
      if (!PIC_THEMES.includes(w.theme) || !w.pic || !/^[a-z]{3,6}$/.test(w.en)) return false;
      if (seenPic.has(w.pic)) return false;
      seenPic.add(w.pic);
      return true;
    });
    const byLen = (min, max) => words.filter((w) => w.en.length >= min && w.en.length <= max);
    const picked = []
      .concat(shuffle(byLen(3, 3)).slice(0, 4))
      .concat(shuffle(byLen(4, 4)).slice(0, 4))
      .concat(shuffle(byLen(5, 6)).slice(0, 4));

    return picked.map((w) => {
      const letters = w.en.split('');
      const extraCount = w.en.length <= 3 ? 1 : 2;
      const extras = shuffle(ABC.map((x) => x.toLowerCase()).filter((x) => !letters.includes(x))).slice(0, extraCount);
      let tiles = shuffle(letters.concat(extras));
      // make sure the tiles don't already spell the word in order
      while (tiles.join('').startsWith(w.en)) tiles = shuffle(tiles);
      return {
        type: 'build',
        kind: opts.sound ? 'listen' : 'look',
        say: w.en,
        instruction: 'Spell the word!',
        instructionJp: 'もじをならべて、たんごをつくろう。',
        prompt: `<div class="prompt-pic">${w.pic}</div>` +
          (opts.jpHints ? `<div class="prompt-jp">${w.jp}</div>` : ''),
        answer: w.en,
        tiles,
        weak: weakWord(w)
      };
    });
  }

  // ---------- Stage 5: Quick Words ----------
  // A word flashes for a short time, then hides -> tap the same word
  // from 4 look-alikes. Uses the student's chosen level.
  // Show time: Q1–4 2.5s, Q5–8 2.0s, Q9–12 1.5s (+ a little for long words).

  // Real English words used ONLY as look-alike wrong answers
  const LOOK_ALIKE_WORDS = (
    'bat bad bag big bug bed bet bit but bus bun cab can cap cut cot cub dad den dig dim dot dug fan fat fin fit fog fun fur ' +
    'gas gum hen hit hop hot hug hut jam jet job jog kid kit lid lip log lot man mat men mix mop mud net nut pan pat pet pig pin ' +
    'pit pot rag ram rat rip rod rub rug sad sat sit six tag tan ten tip top tub van vet web wet win zip ' +
    'bake bike book boot boat coat goat card cart core cord cold cool dish wish fast last list lift fill hill bill pill will ' +
    'wall tall talk walk mild mind kind find fine line note nose rose hose home hope hole pole bear beer pear deer door ' +
    'rain ruin ride rice race mice nice milk silk sock rock duck luck fork form farm star stir stop step ship shop ' +
    'chair cheer clock click black block bread broad tree three train trail snack snake shake mouse house horse ' +
    'apple ample lemon melon peach beach teach tiger timer paper piper water later lunch bunch money monkey ' +
    'flower flour floor tower power river rover sister mister winter window wonder wander summer simmer dinner diner ' +
    'number member remember famous family farmer fancy careful colorful country counter weather whether ' +
    'library literary liberty lately lightly station stations nation motion museum medium hospital hostile ' +
    'beautiful beauty interest interesting important impossible possible popular poster delicious difficult different ' +
    'passport support airport ticket pocket rocket volunteer festival forest concert concern contest content ' +
    'environment equipment experience experiment energy enemy culture capture language luggage technology ' +
    'tradition traditional addition condition solution pollution population information invitation opinion onion ' +
    'protect project produce reduce develop envelope discover discuss create crate respect respond support suppose ' +
    'improve approve communicate community international national necessary natural serious similar various valuable'
  ).split(' ');

  // How alike two words look (higher = more alike)
  function alike(a, b) {
    if (a === b) return -1;
    let score = 0;
    if (a[0] === b[0]) score += 3;
    if (a[a.length - 1] === b[b.length - 1]) score += 1;
    score -= Math.abs(a.length - b.length) * 1.2;
    // shared letters in the same position
    for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) score += 1;
    // shared start (2-3 letters)
    if (a.slice(0, 2) === b.slice(0, 2)) score += 1.5;
    if (a.slice(0, 3) === b.slice(0, 3)) score += 1.5;
    return score;
  }

  function quickWords(opts) {
    const level = opts.level || 'starter';
    const words = window.RQWords.list(level).filter((w) => /^[a-z]+$/.test(w.en));
    const allWords = ['starter', 'lv1', 'lv2', 'lv3']
      .flatMap((l) => window.RQWords.list(l).map((w) => w.en))
      .filter((w) => /^[a-z]+$/.test(w));
    const pool = Array.from(new Set(allWords.concat(LOOK_ALIKE_WORDS)));

    return shuffle(words).slice(0, 12).map((w, i) => {
      // best 6 look-alikes, then pick 3 of them at random so games differ
      const best = pool
        .filter((x) => x !== w.en)
        .map((x) => ({ x, s: alike(w.en, x) + Math.random() }))
        .sort((p, q) => q.s - p.s)
        .slice(0, 6).map((p) => p.x);
      const choices = shuffle([w.en].concat(shuffle(best).slice(0, 3)));
      const base = i < 4 ? 2500 : i < 8 ? 2000 : 1500;
      const flashMs = base + Math.max(0, w.en.length - 5) * 150;
      return {
        kind: 'look',
        say: w.en,                       // only spoken if the answer is wrong
        flashMs,
        instruction: 'Read the word quickly!',
        instructionJp: 'すばやくよもう！',
        instruction2: 'Which word did you see?',
        instruction2Jp: 'どのことばだった？',
        prompt: `<div class="prompt-word">${w.en}</div>`,
        choices, answer: w.en,
        reveal: w.en + (w.jp ? ` (${w.jp})` : ''),
        weak: weakWord(w)
      };
    });
  }

  window.RQ_STAGES = {
    v1: letterFriends,
    v2: soundMatch,
    v3: firstSounds,
    v4: buildWord,
    v5: quickWords
    // v6 Picture Words ... arrives in the next step
  };
  window.RQStageHelpers = { shuffle, makeChoices, LETTER_SAY, ABC };
})();
