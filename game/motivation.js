/* Wit's motivation lines (original, written for Witlo). Short, warm, never guilt-tripping.
   Used by the daily motivation notification and by the occasional in-game bubble. */
export const MOTIVATION = {
  // the morning notification (one a day, rotating)
  daily: [
    ['☀️ Small reps, big brain', 'Five minutes of practice today beats an hour someday. Wit believes in you.'],
    ['🧠 Your brain is a muscle', 'Give it one good workout today. A Daily 5 is enough.'],
    ['🌱 Progress is quiet', "You won't notice it daily, but it adds up. Keep showing up."],
    ['🎯 Aim for 1% sharper', 'Not perfect. Just a little better than yesterday.'],
    ['⚡ Speed comes from practice', "Every question you've solved makes the next one faster."],
    ['🦉 Wit\'s tip of the day', 'Read the question twice, solve once. Most mistakes hide in the reading.'],
    ['📚 Toppers aren\'t born', 'They just practised one more question than everyone else.'],
    ['🔥 Today counts', 'One quick game keeps your mind sharp and your streak warm.'],
    ['💡 Curiosity wins', 'Every wrong answer is a trick you\'re about to learn.'],
    ['🏁 Start small', 'One question. Then maybe one more. That\'s how champions train.'],
    ['🌟 You\'re getting better', "Even on days it doesn't feel like it. The numbers say so."],
    ['🧩 Puzzle o\'clock', 'Your daily brain snack is ready. Takes less time than a reel.'],
    ['🚀 Future you says thanks', 'The practice you do today is the speed you\'ll have in the exam hall.'],
    ['🤝 Calm mind, sharp mind', 'Breathe, read, solve. You\'ve got this.'],
  ],
  // after a loss / during a tough game
  losing: [
    'Every expert was once a beginner who kept going. 💪',
    "A loss is just practice with a scoreboard. Let's go again!",
    "You didn't lose, you collected data. Next round's yours.",
    'Close games make the best comebacks. 🔥',
    'Mistakes are proof you are trying. Keep at it!',
    "Tough round. Wit's still betting on you. 🦉",
    'Shake it off. Fresh questions, fresh chances.',
  ],
  // mid-game, when behind
  comeback: [
    'Deep breath. One question at a time! 🧘',
    "Still time. Focus on the next one, not the score.",
    'Speed comes back when you stop rushing. You got this!',
    'Comeback mode: ON ⚡',
  ],
  // after any game
  after: [
    'Every game makes you a little sharper. 🧠',
    'Practice today, confidence tomorrow.',
    "You're building a faster brain, one round at a time.",
    'Consistency beats talent when talent skips practice.',
    'Learned something new? That\'s the real win. ✨',
  ],
  // on the leaderboard
  board: [
    'The top spot resets every midnight. Anyone can take it! 👑',
    'Climbing is just a few good games away. 🧗',
    "Don't compare, compete. Beat your own best first.",
    'Every name up there started at zero too.',
    "Today's board is still wide open. Go get it! 🚀",
  ],
};

export const pickLine = (list, seed) => list[Math.abs(seed == null ? Math.floor(Math.random() * 1e9) : seed) % list.length];
