/* =========================================================
   Witlo question engine · core
   Templates generate parameterized questions; every answer is computed
   in code, every question is validated, fingerprinted and difficulty-rated.
   ========================================================= */

export const CATS = {
  quant: { name: 'Quant', long: 'Quantitative Aptitude', icon: '🧮', color: '#FF7A45' },
  logic: { name: 'Logic', long: 'Logical Reasoning', icon: '🧩', color: '#5B7CFA' },
  di: { name: 'DI', long: 'Data Interpretation', icon: '📊', color: '#23B26D' },
  verbal: { name: 'Verbal', long: 'Verbal Ability', icon: '📚', color: '#F06FB1' },
  visual: { name: 'Visual', long: 'Visual Reasoning', icon: '👁️', color: '#9B7BFF' },
};
export const CAT_KEYS = Object.keys(CATS);
export const LEVELS = ['', 'Easy', 'Medium', 'Hard', 'Expert'];

// Seeded random (same seed → same sequence; used for Daily 5)
export function seeded(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a → short base-36 id
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a / gcd(a, b)) * b;
export const fact = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
export const nCr = (n, r) => { if (r < 0 || r > n) return 0; r = Math.min(r, n - r); let x = 1; for (let i = 0; i < r; i++) x = (x * (n - i)) / (i + 1); return Math.round(x); };
export const isInt = (x) => Number.isFinite(x) && Math.abs(x - Math.round(x)) < 1e-9;

// Indian digit grouping: 125000 → 1,25,000
export function fmtIN(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  const neg = n < 0; const v = Math.abs(n);
  const [int, dec] = String(Math.round(v * 100) / 100).split('.');
  let out = int;
  if (int.length > 3) { const last3 = int.slice(-3); const rest = int.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ','); out = `${rest},${last3}`; }
  return (neg ? '−' : '') + out + (dec ? `.${dec}` : '');
}
export function frac(n, d) { const g = gcd(n, d); n /= g; d /= g; return d === 1 ? String(n) : `${n}/${d}`; }

export const NAMES = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Sana', 'Vikram', 'Isha', 'Arjun', 'Neha', 'Tara', 'Dev', 'Riya', 'Kunal', 'Anaya', 'Zoya', 'Om', 'Pooja', 'Nikhil', 'Farah', 'Yash', 'Ira', 'Manav', 'Leela', 'Samar', 'Tanvi', 'Aditi', 'Karan', 'Naina', 'Rahul'];
export const MALE = ['Aarav', 'Kabir', 'Rohan', 'Vikram', 'Arjun', 'Dev', 'Kunal', 'Om', 'Nikhil', 'Yash', 'Manav', 'Samar', 'Karan', 'Rahul', 'Imran', 'Varun'];
export const FEMALE = ['Diya', 'Meera', 'Sana', 'Isha', 'Neha', 'Tara', 'Riya', 'Anaya', 'Zoya', 'Pooja', 'Farah', 'Ira', 'Leela', 'Tanvi', 'Aditi', 'Naina'];

// Toolkit handed to every template
export function kit(rand) {
  const ri = (a, b) => Math.floor(rand() * (b - a + 1)) + a;
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n) => shuffle(a).slice(0, n);
  const chance = (p) => rand() < p;
  const ord = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
  const sn = (v) => (v < 0 ? `−${Math.abs(v)}` : String(v)); // true minus sign
  return { rand, ri, pick, shuffle, pickN, chance, gcd, lcm, fact, nCr, isInt, fmtIN, frac, ord, sn };
}

/* ---------------- Options ----------------
   Templates give the answer plus "wrong" values that come from real
   mistakes (forgetting a step, adding instead of subtracting…).
   We fill the rest with near neighbours.                                  */
function numericOptions(k, ans, wrong = [], step) {
  const set = []; const seen = new Set();
  const add = (v) => {
    if (typeof v !== 'number' || !Number.isFinite(v)) return;
    v = Math.round(v * 100) / 100;
    if (Number.isInteger(ans) && !Number.isInteger(v)) return;
    if (ans >= 0 && v < 0) return;
    const key = String(v); if (seen.has(key)) return; seen.add(key); set.push(v);
  };
  add(ans);
  k.shuffle(wrong).forEach((w) => { if (set.length < 4) add(w); });
  const st = step || Math.max(1, Math.round(Math.abs(ans) / 10)) || 1;
  const near = k.shuffle([st, -st, 2 * st, -2 * st, 3 * st, -3 * st, 1, -1, 2, -2]);
  for (const d of near) { if (set.length >= 4) break; add(ans + d); }
  let m = 4; while (set.length < 4 && m < 40) { add(ans + m * st); m++; }
  return set;
}

/* ---------------- Build + validate ---------------- */
export function build(T, k, L) {
  const raw = T.gen(k, L);
  if (!raw) return null;
  const pre = raw.pre || ''; const post = raw.post || '';
  const show = (v) => (typeof v === 'number' ? `${pre}${fmtIN(v)}${post}` : String(v));
  let opts;
  if (raw.opts) opts = raw.opts.map(show);
  else if (typeof raw.ans === 'number') opts = numericOptions(k, raw.ans, raw.wrong || [], raw.step).map(show);
  else {
    const pool = [...new Set([...(raw.wrong || [])].map(String))].filter((x) => x !== String(raw.ans));
    opts = [String(raw.ans), ...k.shuffle(pool).slice(0, (raw.n || 4) - 1)];
  }
  const ans = show(raw.ans);
  if (!raw.keepOrder) opts = k.shuffle(opts);
  const params = raw.p || [];
  const fp = hash(`${T.id}|${JSON.stringify(params)}|${raw.prompt}|${raw.emph || ''}`);
  const near = hash(`${T.id}|${JSON.stringify(raw.near !== undefined ? raw.near : coarse(params))}`);
  const diff = Math.min(1000, Math.max(1, (L - 1) * 250 + 60 + (raw.bump || 0) + k.ri(0, 90)));
  return {
    id: fp, near, tid: T.id, cat: T.cat, sub: T.sub, level: L, diff,
    prompt: raw.prompt, emph: raw.emph, ans, opts, why: raw.why, steps: raw.steps || null,
    time: raw.time || T.time || (L <= 1 ? 10 : L === 2 ? 18 : L === 3 ? 45 : 90),
    vis: raw.vis || null, optKind: raw.optKind || null, words: raw.words || opts.some((o) => o.length > 9),
    emoji: raw.emoji || false, passage: raw.passage || null, emphSmall: raw.emphSmall || false,
  };
}
function coarse(params) {
  return params.map((v) => (typeof v === 'number' ? (v === 0 ? 0 : Math.sign(v) * Math.round(Math.log2(Math.abs(v) + 1) * 2)) : v));
}

const BAD = /undefined|NaN|Infinity|\[object/;
export function validate(q, T) {
  if (!q) return 'empty';
  if (!q.prompt || BAD.test(q.prompt) || (q.emph && BAD.test(q.emph))) return 'prompt';
  if (!q.why || BAD.test(q.why)) return 'why';
  const n = q.opts.length;
  if (n < 3 || n > 5) return 'optcount';
  if (q.opts.some((o) => !o || BAD.test(o))) return 'optbad';
  if (new Set(q.opts).size !== n) return 'optdup';
  if (q.opts.filter((o) => o === q.ans).length !== 1) return 'ansmissing';
  if (T && T.check && !T.check(q)) return 'check';
  return null;
}

// Generate one valid question from a template (retries; invalid ones are rejected)
export function make(T, k, L, accept = () => true, tries = 25) {
  for (let i = 0; i < tries; i++) {
    let q = null;
    try { q = build(T, k, L); } catch (e) { q = null; }
    if (!q) continue;
    if (validate(q, T)) continue;
    if (!accept(q)) continue;
    return q;
  }
  return null;
}
