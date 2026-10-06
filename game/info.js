/* Short explainers shown when players tap an ⓘ, a badge or a card */
export const INFO = {
  freeze: {
    icon: '🧊', title: 'Streak Freeze',
    body: 'A Streak Freeze protects your daily streak if you miss a day. It is used up automatically: miss one day and one freeze covers it, so your streak keeps going.\n\nYou can hold up to 2 at a time ("0/2" means you have none yet). Get one by watching a short optional ad.',
  },
  streak: {
    icon: '🔥', title: 'Daily streak',
    body: 'Your streak is how many days in a row you have played at least one game (any mode counts, even a single Daily 5).\n\nEvery day you show up earns bonus XP, and longer streaks unlock titles: Spark, Kindle, Blaze, Rocket, Wizard, Sage and Legend. Miss a day without a Streak Freeze and it starts again from 1.',
  },
  missions: {
    icon: '🎯', title: 'Daily missions',
    body: 'Three small goals that change every day: one easy, one medium, one stretch. Finishing them earns extra XP and helps you level up faster.\n\nThey are designed to nudge you towards a good daily routine: a quick game, a bit of practice in a weak area, and something a little harder than usual.',
  },
  rank: {
    icon: '🥇', title: 'Rank and rating',
    body: 'Your rating goes up when you win Blitz duels and down when you lose. Beating a stronger rival earns more; losing to a weaker one costs more. Just playing more does not raise it: only winning does.\n\nRanks: Bronze → Silver (1100) → Gold (1200) → Platinum (1350) → Diamond (1500) → Master (1650) → Grandmaster (1800).',
  },
  xp: {
    icon: '⭐', title: 'XP and levels',
    body: 'XP measures how much you have trained. You earn it for every correct answer, combos, finishing games, daily missions and your daily streak bonus.\n\nXP fills your level bar. Unlike rating, XP never goes down, so every session counts.',
  },
  board: {
    icon: '🏅', title: 'Leaderboards',
    body: '"All" ranks today\'s best Blitz score. The subject tabs rank how many questions you got right today in that subject, across every mode.\n\nBoards reset at midnight, so anyone can top them. Until live matches launch, the other players are Witlo\'s AI challengers.',
  },
  weak: {
    icon: '🧠', title: 'How your weak spot is found',
    body: 'Each area (Quant, Logic, DI, Verbal, Visual) has a skill score that works like a chess rating against question difficulty. Missing an Expert question costs you little; missing an Easy one costs more. Getting a hard one right counts for more than an easy one.\n\nYour weak spot is the area with the lowest skill score, once you have answered at least 8 questions in two or more areas. Inside that area, the weakest topic is the one with the lowest accuracy (smoothed, so one unlucky miss doesn\'t count as 0%).',
  },
  long: {
    icon: '🌊', title: 'Long Mode',
    body: 'Blitz is about speed. Long Mode is about depth: arrangements, puzzles, caselets, multi-step DI and reading. There is no rival and no countdown, just a suggested time. After each answer you see the explanation and a full solution.',
  },
  daily: {
    icon: '📅', title: 'Daily 5',
    body: 'Five questions, one from each subject, and everyone in the world gets the same five today. There is no rival, just you and the clock: finish fast and share your score.\n\nPlaying it also keeps your streak alive.',
  },
  survival: {
    icon: '❤️', title: 'Survival',
    body: 'Keep answering until you lose 3 lives. Each question has 20 seconds, and questions get harder every 5 correct answers. How far can you go?',
  },
  rush: {
    icon: '🏃', title: 'Category Rush',
    body: '60 seconds, one subject, as many right answers as you can. Great for sharpening one area at speed. Your best score for each subject is saved.',
  },
};

export const GOALS = [
  { id: 'fun', icon: '🎮', title: 'Just for fun', sub: 'Quick brain games, no pressure', mix: { quant: 20, logic: 25, di: 10, verbal: 20, visual: 25 }, skill: 260 },
  { id: 'placement', icon: '💼', title: 'Placement prep', sub: 'Campus aptitude rounds', mix: { quant: 35, logic: 30, di: 15, verbal: 15, visual: 5 }, skill: 320 },
  { id: 'exams', icon: '📝', title: 'Competitive exams', sub: 'CAT, Bank PO, SSC and more', mix: { quant: 35, logic: 30, di: 20, verbal: 15, visual: 0 }, skill: 360 },
  { id: 'brain', icon: '🧠', title: 'Sharpen my brain', sub: 'A daily mental workout', mix: null, skill: 300 },
  { id: 'compete', icon: '🏆', title: 'I love competition', sub: 'Climb ranks, beat rivals', mix: null, skill: 320 },
];
