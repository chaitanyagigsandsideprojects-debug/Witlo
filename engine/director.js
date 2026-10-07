/* =========================================================
   EXPERIENCE DIRECTOR
   The question engine answers "what questions can exist?". The Director answers
   "what should THIS player experience NEXT?".

   PLAYER STATE (skills, concept mastery, recent answers)
     → EXPERIENCE DIRECTOR picks an intent (confidence, challenge, discovery, practice,
       revisit, recovery, aha) and scores every eligible question type for novelty,
       learning value and flow
     → the existing generator builds a fresh, validated question of the chosen type.

   It never changes a mode's rules, timers or scoring. It only decides which kind of
   question comes next and nudges difficulty within a small, fair range (±130).
   ========================================================= */
import { kit, make, CAT_KEYS } from './core';
import { taxoOf } from './taxonomy';

let LIB = null; // { TEMPLATES, MIX, eligible, levelOf } – injected by index.js (avoids a circular import)
export function initDirector(lib) { LIB = lib; }

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DIFF_ADJ = { confidence: -90, recovery: -110, challenge: 70, discovery: -40, practice: 0, revisit: -20, aha: 0, transfer: 20, intro: -80, harder: 80 };
const DEEP_SKILLS = new Set(['multistep', 'constraint', 'data', 'inference', 'reading', 'deduce']);

/* ---------- 1. What should the player feel next? ---------- */
// log: this session's answers [{ tid, ok, secs, time, diff, skill, arch, family, cat, sub, aha, intent }]
export function chooseIntent(mode, log, H, rand) {
  const n = log.length; const last = log.slice(-3); const r = rand();
  if (mode === 'daily') return 'practice';
  const wrong2 = n >= 2 && !log[n - 1].ok && !log[n - 2].ok;
  const struggling = wrong2 && (last.some((e) => e.secs > e.time * 0.7) || last.some((e) => e.diff >= (H ? H.skill(e.cat) : 300)));
  if (struggling || (wrong2 && mode === 'long')) return 'recovery';
  if (mode === 'train') return 'practice';
  if (n === 0) return mode === 'long' ? 'discovery' : 'confidence';
  // after several hard ones, give a "yep, I've got this" moment
  const hardRun = last.length === 3 && last.filter((e) => !e.ok || e.intent === 'challenge').length >= 2;
  if (hardRun && mode !== 'long') return 'confidence';
  // on a roll: raise the bar
  if (last.length === 3 && last.every((e) => e.ok && e.secs <= e.time * 0.5)) return 'challenge';
  // a teaching moment every few questions
  const sinceAha = (() => { for (let i = n - 1; i >= 0; i--) if (log[i].aha) return n - 1 - i; return n; })();
  if (sinceAha >= (mode === 'long' ? 2 : 5) && r < 0.6) return 'aha';
  const rusty = H && Object.keys(H.concepts).some((t) => H.conceptState(t) === 'rusty');
  if (mode === 'long') return r < 0.45 ? 'discovery' : r < 0.75 ? 'challenge' : 'practice';
  return r < 0.28 ? 'discovery' : r < 0.68 ? 'practice' : r < 0.8 && rusty ? 'revisit' : r < 0.92 ? 'challenge' : 'aha';
}

/* ---------- 2. How good is this question type for that experience? ---------- */
function scoreTemplate(T, intent, ctx) {
  const tx = taxoOf(T.id); const H = ctx.history; const st = H ? H.conceptState(T.id) : 'new';
  let w = 1;
  // Weighted cooldowns over this session (recent = strongest): same concept, skill, archetype, topic, family
  const log = ctx.log || [];
  for (let i = log.length - 1, age = 0; i >= 0 && age < 8; i--, age++) {
    const e = log[i]; const d = Math.pow(0.62, age);
    if (e.tid === T.id) w *= 1 - 0.93 * d;
    if (e.skill === tx.skill) w *= 1 - 0.5 * d;
    if (e.arch === tx.arch) w *= 1 - 0.3 * d;
    if (e.sub === T.sub) w *= 1 - 0.45 * d;
    if (e.family === tx.family) w *= 1 - 0.2 * d;
  }
  // Across sessions: types seen in the last ~30 answers feel familiar, so soften them
  if (H && H.recent.length) { const seen = H.recent.slice(-40).filter((e) => e.t === T.id).length; w *= Math.pow(0.6, seen); }
  // Long-term breadth: less-explored concepts get a lift (except when the player needs a sure-footed question)
  const a = H && H.concepts[T.id] ? H.concepts[T.id].a : 0;
  if (intent !== 'confidence' && intent !== 'recovery') w *= 1 + 1.6 / (1 + a);
  // Intent
  const M = {
    discovery: { new: 3, discovered: 2.2, learning: 1, developing: 0.9, mastered: 0.5, rusty: 1 },
    practice: { new: 0.8, discovered: 1.6, learning: 2, developing: 1.8, mastered: 0.8, rusty: 1.4 },
    revisit: { new: 0.4, discovered: 0.8, learning: 1, developing: 1, mastered: 1.4, rusty: 4 },
    confidence: { new: 0.35, discovered: 0.8, learning: 0.6, developing: 2.2, mastered: 2.8, rusty: 1.2 },
    challenge: { new: 0.7, discovered: 1, learning: 1, developing: 2, mastered: 1.6, rusty: 1.2 },
    recovery: { new: 0.5, discovered: 1, learning: 0.9, developing: 1.6, mastered: 2, rusty: 1.3 },
    aha: { new: 1.4, discovered: 1.4, learning: 1.2, developing: 1.2, mastered: 0.9, rusty: 1.2 },
  }[intent] || {};
  w *= M[st] || 1;
  if (intent === 'aha') w *= tx.aha ? 6 : 0.25;
  if (intent === 'recovery' && ctx.lastFail) {
    // a related but different, more approachable concept: recover without repeating the same task
    if (tx.family === ctx.lastFail.family && T.id !== ctx.lastFail.tid) w *= 4;
    else if (T.id === ctx.lastFail.tid) w *= 0.2;
  }
  if (ctx.mode === 'long') { if (DEEP_SKILLS.has(tx.skill)) w *= 1.8; if (T.deep) w *= 1.5; if (tx.aha) w *= 1.2; }
  return Math.max(w, 1e-4);
}

function weightedPick(rand, items, weightOf) {
  const ws = items.map(weightOf); const tot = ws.reduce((a, b) => a + b, 0);
  let x = rand() * tot; for (let i = 0; i < items.length; i++) { x -= ws[i]; if (x <= 0) return items[i]; } return items[items.length - 1];
}

/* ---------- 3. Category: keep the mode's mix, but avoid monotony ---------- */
function chooseCat(ctx, intent, rand) {
  const mix = ctx.mix || LIB.MIX[ctx.mode] || LIB.MIX.blitz; const log = ctx.log || [];
  const l1 = log[log.length - 1]; const l2 = log[log.length - 2];
  return weightedPick(rand, CAT_KEYS.filter((c) => (mix[c] || 0) > 0), (c) => {
    let w = mix[c];
    if (l1 && l1.cat === c) w *= l2 && l2.cat === c ? 0.12 : 0.5;
    if (intent === 'recovery' && ctx.lastFail && ctx.lastFail.cat === c) w *= 3;
    if (intent === 'discovery' || intent === 'challenge') { const k = log.filter((e) => e.cat === c).length; w *= 1 / (1 + 0.5 * k); }
    return w;
  });
}

/* ---------- Train: teach for transfer, not repetition ---------- */
// 8 steps: intro → new context → new archetype → harder → transfer → practice → harder transfer → confidence check
const TRAIN_PLAN = ['intro', 'context', 'archetype', 'harder', 'transfer', 'practice', 'harder', 'confidence'];
function trainPool(ctx, step, pool) {
  const log = ctx.log || []; const prev = log[log.length - 1];
  const focusFam = ctx.sub ? taxoOf((pool.find((T) => T.sub === ctx.sub) || pool[0]).id).family : ctx.focusFamily;
  const inFam = pool.filter((T) => taxoOf(T.id).family === focusFam);
  const inSub = ctx.sub ? pool.filter((T) => T.sub === ctx.sub) : inFam;
  const pick = (arr) => (arr.length ? arr : inFam.length ? inFam : pool);
  if (step === 'intro' || step === 'confidence' || step === 'practice' || step === 'harder' && !prev) return pick(inSub);
  if (step === 'context') return pick(inSub.filter((T) => !prev || T.id !== prev.tid));
  if (step === 'archetype') return pick(inFam.filter((T) => !prev || taxoOf(T.id).arch !== prev.arch));
  if (step === 'transfer') return pick(inFam.filter((T) => T.sub !== ctx.sub && (!prev || T.id !== prev.tid)));
  return pick(step === 'harder' && log.length > 5 ? inFam : inSub);
}

/* ---------- The Director ---------- */
// ctx = { mode, rand, history, cat?, sub?, tids?, diff(cat), recentTids, log }
export function directQuestion(ctx) {
  const rand = ctx.rand || Math.random; const k = kit(rand); const H = ctx.history; const log = ctx.log || [];
  const lastFail = [...log].reverse().find((e) => !e.ok) || null;
  let intent = chooseIntent(ctx.mode, log, H, rand);
  let trainStep = null;
  if (ctx.mode === 'train' && !ctx.tids) { trainStep = TRAIN_PLAN[Math.min(log.length, TRAIN_PLAN.length - 1)]; if (intent !== 'recovery') intent = trainStep; }
  const diffOf = (cat) => (typeof ctx.diff === 'function' ? ctx.diff(cat) : ctx.diff == null ? 300 : ctx.diff);
  const adjCap = ctx.mode === 'survival' ? 0 : 130; // Survival's own "harder every 5" rule stays in charge
  const accept = (strict) => (q) => !(H && H.has(q.id)) && !(strict && H && H.nearSeen(q.near));
  const sctx = { ...ctx, log, lastFail, intent };

  for (let attempt = 0; attempt < 10; attempt++) {
    const cat = ctx.tids ? null : ctx.cat || chooseCat(sctx, intent, rand);
    const adj = clamp(DIFF_ADJ[intent] || 0, -adjCap, adjCap);
    const target = clamp(diffOf(cat || (ctx.tids && LIB.BY_ID[ctx.tids[0]] ? LIB.BY_ID[ctx.tids[0]].cat : 'quant')) + adj, 40, 980);
    const wantL = LIB.levelOf(target);
    let base = LIB.TEMPLATES.filter((T) => (ctx.tids ? ctx.tids.includes(T.id) : T.cat === cat && (!ctx.sub || trainStep || T.sub === ctx.sub)));
    let pool = base.filter((T) => LIB.eligible(T, ctx.mode, wantL));
    if (!pool.length) pool = base;
    if (trainStep) pool = trainPool({ ...sctx, focusFamily: ctx.focusFamily }, trainStep, pool);
    // prefer question types that exist at the intended level (an "intro" should never be forced up to Hard)
    const up = intent === 'challenge' || intent === 'harder' ? 1 : 0;
    const fits = pool.filter((T) => T.lv[0] <= wantL + up && T.lv[1] >= wantL - 1); if (fits.length) pool = fits;
    // never repeat the very last question types back to back
    const fresh = pool.filter((T) => !(ctx.recentTids || []).slice(-2).includes(T.id)); if (fresh.length) pool = fresh;
    if (!pool.length) continue;
    const T = weightedPick(rand, pool, (t) => scoreTemplate(t, intent, sctx));
    const L = clamp(ctx.mode === 'long' ? Math.max(wantL, 3) : wantL, T.lv[0], T.lv[1]);
    const q = make(T, k, L, accept(attempt < 6), 12);
    if (q) { const tx = taxoOf(T.id); return { ...q, intent, skill: tx.skill, arch: tx.arch, family: tx.family, aha: tx.aha, concept: tx.name }; }
  }
  return null;
}

/* ---------- Daily 5: a daily sampler of five different experiences ---------- */
// Same five for everyone (seeded by date, no personal data): one per category, five different thinking
// skills and ways of asking, gently rising difficulty, and at least one "aha".
export function sampleDaily(rand) {
  const k = kit(rand); const out = []; const diffs = [180, 320, 420, 520, 620];
  const cats = k.shuffle(CAT_KEYS);
  // the "aha" goes to a slot whose category actually has an insight question at that difficulty
  const ahaOk = cats.map((c, i) => LIB.TEMPLATES.some((T) => T.cat === c && taxoOf(T.id).aha && LIB.eligible(T, 'daily', LIB.levelOf(diffs[i]))));
  const slots = ahaOk.map((v, i) => (v ? i : -1)).filter((i) => i >= 0); const ahaSlot = slots.length ? slots[Math.floor(rand() * slots.length)] : -1;
  cats.forEach((cat, i) => {
    const wantL = LIB.levelOf(diffs[i]);
    let pool = LIB.TEMPLATES.filter((T) => T.cat === cat && LIB.eligible(T, 'daily', wantL)); if (!pool.length) pool = LIB.TEMPLATES.filter((T) => T.cat === cat);
    let q = null;
    for (let tries = 0; tries < 8 && !q; tries++) {
      const T = weightedPick(rand, pool, (t) => {
        const tx = taxoOf(t.id); let w = 1;
        if (out.some((x) => x.skill === tx.skill)) w *= 0.12;
        if (out.some((x) => x.arch === tx.arch)) w *= 0.35;
        if (i === ahaSlot) w *= tx.aha ? 6 : 0.3;
        return w;
      });
      const L = clamp(wantL, T.lv[0], T.lv[1]); q = make(T, k, L, () => true, 12);
      if (q) { const tx = taxoOf(T.id); q = { ...q, skill: tx.skill, arch: tx.arch, family: tx.family, aha: tx.aha, concept: tx.name, intent: 'practice' }; }
    }
    if (q) out.push(q);
  });
  return out;
}

/* ---------- Session variety metrics (internal, for tuning) ---------- */
export function sessionMetrics(log) {
  if (!log.length) return null;
  let maxRun = 1; let run = 1; for (let i = 1; i < log.length; i++) { run = log[i].skill === log[i - 1].skill ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  const diffs = log.map((e) => e.diff); const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  let recoveries = 0; log.forEach((e) => { if (e.intent === 'recovery' && e.ok) recoveries += 1; });
  return {
    n: log.length, concepts: new Set(log.map((e) => e.tid)).size, skills: new Set(log.map((e) => e.skill)).size, archs: new Set(log.map((e) => e.arch)).size,
    families: new Set(log.map((e) => e.family)).size, maxSameSkillRun: maxRun, diffSpread: Math.round(Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / diffs.length)),
    aha: log.filter((e) => e.aha).length, recoveries, acc: Math.round((100 * log.filter((e) => e.ok).length) / log.length),
  };
}
