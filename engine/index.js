/* =========================================================
   Witlo question engine · public API
   ========================================================= */
import { CATS, CAT_KEYS, LEVELS, kit, make, seeded, hash } from './core';
import quant from './quant';
import logic from './logic';
import di from './di';
import verbal from './verbal';
import visual from './visual';
import { TIPS } from './tips';
import { initDirector, directQuestion, sampleDaily, sessionMetrics } from './director';
import { taxoOf, TAXO, SKILLS, ARCHS, FAMILIES } from './taxonomy';
export { sessionMetrics, taxoOf, TAXO, SKILLS, ARCHS, FAMILIES };

export { CATS, CAT_KEYS, LEVELS, seeded, hash };
export const TEMPLATES = [...quant, ...logic, ...di, ...verbal, ...visual];
// every template carries its topic's exam shortcut (shown in solutions and in the mistake review)
TEMPLATES.forEach((T) => { if (!T.tip && TIPS[T.sub]) T.tip = TIPS[T.sub]; });
export const BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
export const SUBS = [...new Set(TEMPLATES.map((t) => `${t.cat}|${t.sub}`))].map((x) => { const [cat, sub] = x.split('|'); return { cat, sub }; });

// Content mix per mode (percent)
export const MIX = {
  blitz: { quant: 30, logic: 25, di: 15, verbal: 15, visual: 15 },
  long: { quant: 30, logic: 35, di: 25, verbal: 10, visual: 0 },
  train: { quant: 30, logic: 25, di: 15, verbal: 15, visual: 15 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// skill/difficulty score 0–1000 → level 1–4
export const levelOf = (d) => clamp(1 + Math.floor(d / 250), 1, 4);

function pickWeighted(rand, weights) {
  const keys = Object.keys(weights).filter((x) => weights[x] > 0); const tot = keys.reduce((a, x) => a + weights[x], 0);
  let r = rand() * tot; for (const x of keys) { r -= weights[x]; if (r <= 0) return x; } return keys[keys.length - 1];
}
function eligible(T, mode, L) {
  if (mode === 'blitz' || mode === 'survival' || mode === 'rush') return T.fast && T.lv[0] <= Math.max(L, 2) && (T.time || 20) <= 30;
  if (mode === 'daily') return T.fast && T.lv[0] <= Math.max(L, 2) && (T.time || 20) <= 40;
  if (mode === 'long') return T.deep || (T.fast && T.lv[1] >= 4);
  return true; // train / practice
}

/**
 * Pick the next question.
 * ctx = { mode, rand, history, cat?, sub?, diff (0–1000), recentTids? }
 * history must offer has(id) and nearSeen(near).
 */
export function nextQuestion(ctx) {
  const rand = ctx.rand || Math.random; const k = kit(rand); const recent = ctx.recentTids || [];
  const diffOf = (cat) => (typeof ctx.diff === 'function' ? ctx.diff(cat) : ctx.diff == null ? 300 : ctx.diff);
  const accept = (strictNear) => (q) => !(ctx.history && ctx.history.has(q.id)) && !(strictNear && ctx.history && ctx.history.nearSeen(q.near));
  for (let attempt = 0; attempt < 24; attempt++) {
    const cat = ctx.cat || pickWeighted(rand, ctx.mix || MIX[ctx.mode] || MIX.blitz);
    const wantL = levelOf(diffOf(cat));
    // ctx.tids: practise exactly these question types again (fresh numbers), e.g. after a game's mistakes
    const want = (T) => (ctx.tids ? ctx.tids.includes(T.id) : T.cat === cat && (!ctx.sub || T.sub === ctx.sub));
    let pool = TEMPLATES.filter((T) => want(T) && eligible(T, ctx.mode, wantL));
    if (!pool.length) pool = TEMPLATES.filter(want);
    if (!pool.length) continue;
    const fresh = pool.filter((T) => !recent.slice(ctx.tids ? -1 : -4).includes(T.id)); const T = k.pick(fresh.length ? fresh : pool);
    const L = clamp(ctx.mode === 'long' ? Math.max(wantL, 3) : wantL, T.lv[0], T.lv[1]);
    const q = make(T, k, L, accept(attempt < 16), 12);
    if (q) return q;
  }
  // last resort: anything valid, even if seen
  const T = k.pick(TEMPLATES.filter((t) => t.fast)); return make(T, k, T.lv[0], () => true, 30);
}

// Experience Director entry point: picks what this player should experience next, then generates it.
// Falls back to the plain engine if nothing fits. ctx adds `log` (this session's answers) to nextQuestion's ctx.
export function nextExperience(ctx) {
  let focusFamily = null;
  if (ctx.mode === 'train' && ctx.cat && !ctx.sub && ctx.history) {
    // weakest family of concepts inside the area (lowest recent accuracy among the ones seen), else the least explored
    const fams = {}; TEMPLATES.filter((T) => T.cat === ctx.cat).forEach((T) => { const f = taxoOf(T.id).family; const c = ctx.history.concepts[T.id]; const x = fams[f] || (fams[f] = { a: 0, e: 0 }); if (c) { x.a += c.a; x.e += c.e * c.a; } });
    const list = Object.entries(fams).map(([f, v]) => [f, v.a >= 4 ? v.e / v.a : 0.5 + 0.1 / (1 + v.a)]).sort((a, b) => a[1] - b[1]);
    focusFamily = list.length ? list[0][0] : null;
  }
  const q = directQuestion({ ...ctx, focusFamily });
  if (q) return q;
  const p = nextQuestion(ctx); const tx = taxoOf(p.tid);
  return { ...p, intent: 'practice', skill: tx.skill, arch: tx.arch, family: tx.family, aha: tx.aha, concept: tx.name };
}

// Daily 5: same five for everyone today, one per category, five different experiences, gently rising
export function dailyFive(dateSeed) { return sampleDaily(seeded(dateSeed)); }

// Adaptive skill update for one answer (per-category skill, 0–1000), Elo-style against question difficulty.
// n = answers so far in this area (early answers move skill faster).
export function updateSkill(skill, q, ok, secs, n = 20) {
  const E = 1 / (1 + Math.pow(10, (q.diff - skill) / 250)); // chance a player of this skill gets it right
  const K = Math.max(16, 64 / Math.sqrt(1 + n / 5));
  const fastBonus = ok && secs <= Math.max(3, q.time * 0.35) ? 3 : 0;
  return clamp(Math.round(skill + K * ((ok ? 1 : 0) - E) + fastBonus), 40, 980);
}

initDirector({ TEMPLATES, MIX, eligible, levelOf, BY_ID });
