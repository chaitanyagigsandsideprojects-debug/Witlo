/* Progression: ranks, XP levels, daily missions, achievements, personal bests.
   Pure functions so they can be tested outside the app. */
import { seeded } from '../engine/core';

export const TIERS = [
  { name: 'Bronze', min: 0, icon: '🥉' }, { name: 'Silver', min: 1100, icon: '🥈' }, { name: 'Gold', min: 1200, icon: '🥇' },
  { name: 'Platinum', min: 1350, icon: '💠' }, { name: 'Diamond', min: 1500, icon: '💎' }, { name: 'Master', min: 1650, icon: '🔮' },
  { name: 'Grandmaster', min: 1800, icon: '👑' },
];
export function tierOf(score) { let i = 0; TIERS.forEach((t, k) => { if (score >= t.min) i = k; }); return { tier: TIERS[i], next: TIERS[i + 1] || null, index: i }; }
export function tierProgress(score) { const { tier, next } = tierOf(score); if (!next) return 1; const lo = Math.max(tier.min, 1000); return Math.max(0, Math.min(1, (score - lo) / (next.min - lo))); }

// XP levels: level n → n+1 needs 100 + 50(n−1) XP
export function levelOf(xp) {
  let lv = 1; let need = 100; let rest = xp || 0;
  while (rest >= need) { rest -= need; lv += 1; need = 100 + 50 * (lv - 1); }
  return { lv, into: rest, need, frac: rest / need };
}

/* ---------------- Missions ---------------- */
const CAT_LABEL = { quant: 'Quant', logic: 'Logic', di: 'DI', verbal: 'Verbal', visual: 'Visual' };
const MISSION_POOL = {
  easy: [
    { id: 'play2', text: 'Play 2 games', goal: 2, xp: 30 },
    { id: 'daily', text: 'Complete the Daily 5', goal: 1, xp: 30 },
    { id: 'correct10', text: 'Get 10 answers right', goal: 10, xp: 30 },
  ],
  mid: [
    { id: 'win1', text: 'Win a Blitz duel', goal: 1, xp: 50 },
    { id: 'cat5', text: 'Solve 5 {cat} questions', goal: 5, xp: 50 },
    { id: 'fast3', text: 'Answer 3 in under 3 seconds', goal: 3, xp: 50 },
    { id: 'train1', text: 'Finish a Train session', goal: 1, xp: 50 },
  ],
  hard: [
    { id: 'combo5', text: 'Hit a 5-answer combo', goal: 1, xp: 80 },
    { id: 'long1', text: 'Finish a Long Mode session', goal: 1, xp: 80 },
    { id: 'correct30', text: 'Get 30 answers right', goal: 30, xp: 80 },
    { id: 'win3', text: 'Win 3 Blitz duels', goal: 3, xp: 80 },
  ],
};
export function missionsFor(dayKeyStr, seedNum) {
  const r = seeded(seedNum * 13 + 7); const pick = (a) => a[Math.floor(r() * a.length)];
  const cats = Object.keys(CAT_LABEL); const cat = pick(cats);
  return ['easy', 'mid', 'hard'].map((tier) => { const m = pick(MISSION_POOL[tier]); return { ...m, cat, text: m.text.replace('{cat}', CAT_LABEL[cat]), prog: 0, done: false }; }).map((m) => ({ ...m, day: dayKeyStr }));
}
// event = { kind, win, correct, fastCount, maxCombo, catCorrect: {cat: n} }
export function advanceMissions(list, ev) {
  const gained = [];
  const out = list.map((m) => {
    if (m.done) return m; let inc = 0;
    if (m.id === 'play2') inc = 1;
    if (m.id === 'daily' && ev.kind === 'daily') inc = 1;
    if (m.id === 'correct10' || m.id === 'correct30') inc = ev.correct;
    if ((m.id === 'win1' || m.id === 'win3') && ev.win) inc = 1;
    if (m.id === 'cat5') inc = (ev.catCorrect && ev.catCorrect[m.cat]) || 0;
    if (m.id === 'fast3') inc = ev.fastCount || 0;
    if (m.id === 'train1' && ev.kind === 'train') inc = 1;
    if (m.id === 'long1' && ev.kind === 'long' && ev.finished) inc = 1;
    if (m.id === 'combo5' && ev.maxCombo >= 5) inc = 1;
    const prog = Math.min(m.goal, m.prog + inc); const done = prog >= m.goal;
    if (done) gained.push(m);
    return { ...m, prog, done };
  });
  return { list: out, gained };
}

/* ---------------- Achievements ---------------- */
export const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🏆', name: 'First Victory', desc: 'Win your first Blitz duel' },
  { id: 'combo10', icon: '🔥', name: 'Unstoppable', desc: '10 correct in a row' },
  { id: 'perfect', icon: '💯', name: 'Perfect Run', desc: 'A game with no mistakes (5+ answers)' },
  { id: 'speed', icon: '⚡', name: 'Speed Demon', desc: '5 answers under 2 seconds in one game' },
  { id: 'hundred', icon: '💪', name: 'Hundred Club', desc: '100 correct answers' },
  { id: 'brainiac', icon: '🧠', name: 'Brainiac', desc: '1,000 correct answers' },
  { id: 'calc', icon: '🧮', name: 'Calculator Brain', desc: '100 Quant answers right' },
  { id: 'logic', icon: '🧩', name: 'Logic Lord', desc: '100 Logic answers right' },
  { id: 'streak7', icon: '📅', name: '7-Day Warrior', desc: 'Play 7 days in a row' },
  { id: 'streak30', icon: '🧙', name: 'Habit Wizard', desc: 'Play 30 days in a row' },
  { id: 'deep', icon: '🌊', name: 'Deep Diver', desc: 'Finish a Long 10' },
  { id: 'comeback', icon: '🦅', name: 'Comeback King', desc: 'Win right after 2+ losses' },
  { id: 'gold', icon: '🥇', name: 'Gold Rush', desc: 'Reach Gold rank' },
  { id: 'diamond', icon: '💎', name: 'Diamond Mind', desc: 'Reach Diamond rank' },
  { id: 'night', icon: '🌙', name: 'Night Owl', desc: 'Play after 11 pm' },
  { id: 'early', icon: '🌅', name: 'Early Bird', desc: 'Play before 7 am' },
];
// ctx = { ev, profile (after update), totals: { correct, quant, logic }, hour, lossStreakBefore }
export function checkAchievements(have, ctx) {
  const { ev, profile: P, totals, hour } = ctx; const got = [];
  const test = {
    first_win: ev.win, combo10: ev.maxCombo >= 10, perfect: ev.answered >= 5 && ev.correct === ev.answered,
    speed: (ev.under2 || 0) >= 5, hundred: totals.correct >= 100, brainiac: totals.correct >= 1000, calc: totals.quant >= 100, logic: totals.logic >= 100,
    streak7: P.streak >= 7, streak30: P.streak >= 30, deep: ev.kind === 'long' && ev.finished && ev.total >= 10, comeback: ev.win && (ctx.lossStreakBefore || 0) >= 2,
    gold: P.score >= 1200, diamond: P.score >= 1500, night: hour >= 23, early: hour < 7,
  };
  ACHIEVEMENTS.forEach((a) => { if (!have[a.id] && test[a.id]) got.push(a); });
  return got;
}

/* ---------------- XP for a game ---------------- */
export function xpFor(ev) {
  let xp = ev.correct * 10 + Math.max(0, ev.maxCombo - 2) * 3;
  if (ev.kind === 'blitz') xp += ev.win ? 30 : 10;
  if (ev.kind === 'daily') xp += 20 + (ev.correct === 5 ? 20 : 0);
  if (ev.kind === 'long') xp += ev.finished ? 40 : 0;
  if (ev.kind === 'train') xp += 15;
  return Math.round(xp);
}

/* ---------------- Wit's lines ---------------- */
export const WIT = {
  correct: ['Nailed it.', 'Clean.', 'Sharp!', 'Yes!', 'Smooth.'],
  fast: ['ZOOM!', 'Lightning!', 'Too quick!'],
  combo3: ['3 in a row!', 'Heating up 🔥'],
  combo5: ['ON FIRE 🔥', "You're getting dangerous."],
  combo10: ['UNSTOPPABLE!', 'Are you even human?'],
  wrong: ['Oof. Sneaky one.', 'Shake it off.', 'Next one’s yours.'],
  broke: ['Combo broken. Go again!', 'Reset. Refocus.'],
  win: ["LET'S GOOO!", 'WHO’S THE GENIUS NOW?', 'Too sharp for them!'],
  lose: ['So close. Rematch?', 'They got lucky. Again?', 'Good fight. Run it back?'],
  promo: ['Promotion unlocked!'],
  pb: ['New personal best!'],
};
