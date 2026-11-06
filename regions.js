/* =========================================================
   Reading Quest – Regions & Stages (DATA ONLY)
   ---------------------------------------------------------
   Edit this file to rename regions/stages or change unlock
   rules. No game code lives here.

   open:      true  = students can enter the region
              false = shows "Coming soon"
   boss:      true  = boss stage (unlocks by stars, not by
              clearing the previous stage)
   needStars: stars needed in this region to unlock the boss
   ========================================================= */

window.RQ_REGIONS = [
  {
    id: 'village',
    name: 'Word Village',
    jp: 'ことばの村',
    skill: 'Letters, sounds & words',
    skillJp: '文字・音・単語',
    color: '#F5A623',
    open: true,
    stages: [
      { id: 'v1', name: 'Letter Friends', jp: 'アルファベット' },
      { id: 'v2', name: 'Sound Match',    jp: '音あわせ' },
      { id: 'v3', name: 'First Sounds',   jp: 'さいしょの音' },
      { id: 'v4', name: 'Build a Word',   jp: '単語づくり' },
      { id: 'v5', name: 'Quick Words',    jp: 'すばやく読もう' },
      { id: 'v6', name: 'Picture Words',  jp: '絵と単語' },
      { id: 'v7', name: 'Spell It',       jp: 'つづろう' },
      { id: 'v8', name: 'Word Mix',       jp: 'ミックス' },
      { id: 'vboss', name: 'Village Boss', jp: '村のボス', boss: true, needStars: 16 }
    ]
  },
  {
    id: 'forest',
    name: 'Sentence Forest',
    jp: '文の森',
    skill: 'Building sentences',
    skillJp: '文をつくる',
    color: '#2EAD6B',
    open: false,
    stages: []
  },
  {
    id: 'mountain',
    name: 'Story Mountain',
    jp: 'お話の山',
    skill: 'Short stories',
    skillJp: '短いお話',
    color: '#6C8EBF',
    open: false,
    stages: []
  },
  {
    id: 'castle',
    name: 'Reading Castle',
    jp: '読書のお城',
    skill: 'Reading challenges',
    skillJp: '読みのチャレンジ',
    color: '#8E6CDB',
    open: false,
    stages: []
  }
];
