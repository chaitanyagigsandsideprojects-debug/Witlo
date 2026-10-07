/* Quantitative aptitude templates */
import { NAMES } from './core';

const Q = (o) => ({ cat: 'quant', fast: true, deep: false, lv: [1, 3], ...o });
const ITEMS = ['phone', 'laptop', 'watch', 'bicycle', 'jacket', 'mixer', 'speaker', 'backpack', 'sofa', 'fridge', 'scooter', 'camera', 'kurta', 'TV', 'printer'];
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [15, 20, 25], [10, 24, 26], [20, 21, 29], [9, 40, 41], [12, 35, 37], [18, 24, 30], [16, 30, 34], [21, 28, 35]];
// pairs (a, b) whose combined work time ab/(a+b) is a whole number
const WORK_PAIRS = []; for (let a = 2; a <= 72; a++) for (let b = a + 1; b <= 90; b++) if ((a * b) % (a + b) === 0) WORK_PAIRS.push([a, b, (a * b) / (a + b)]);
const PIPE_PAIRS = []; for (let a = 2; a <= 40; a++) for (let b = a + 1; b <= 60; b++) if ((a * b) % (b - a) === 0 && (a * b) / (b - a) <= 120) PIPE_PAIRS.push([a, b, (a * b) / (b - a)]);
const AVG_SPEED = []; for (let x = 10; x <= 90; x += 2) for (let y = x + 4; y <= 120; y += 2) if ((2 * x * y) % (x + y) === 0) AVG_SPEED.push([x, y, (2 * x * y) / (x + y)]);
const PRIMES = [2, 3, 5, 7, 11, 13];

export default [
  // ---------------- Arithmetic speed ----------------
  Q({ id: 'q.mental', sub: 'Mental math', lv: [1, 2], time: 8, gen(k, L) {
    const t = k.pick(L === 1 ? ['mul', 'add', 'sq'] : ['mul', 'sq', 'x25', 'x11', 'div']);
    if (t === 'add') { const a = k.ri(120, 899), b = k.ri(120, 899); return { prompt: 'Quick! Work it out', emph: `${a} + ${b}`, ans: a + b, wrong: [a + b + 10, a + b - 10, a + b + 100], step: 10, why: `${a} + ${b} = ${k.fmtIN(a + b)}`, p: [t, a, b] }; }
    if (t === 'mul') { const a = k.ri(12, L === 1 ? 19 : 39), b = k.ri(3, 9); return { prompt: 'Quick! Work it out', emph: `${a} × ${b}`, ans: a * b, wrong: [a * b + b, a * b - b, a * (b + 1)], step: b, why: `${a} × ${b} = ${a * b}`, p: [t, a, b] }; }
    if (t === 'sq') { const a = k.ri(L === 1 ? 11 : 21, L === 1 ? 25 : 59); return { prompt: 'Square it', emph: `${a}²`, ans: a * a, wrong: [a * a + 10, a * a - 10, a * (a + 1)], step: 10, why: `${a} × ${a} = ${k.fmtIN(a * a)}`, p: [t, a] }; }
    if (t === 'x25') { const a = 4 * k.ri(5, 60); return { prompt: 'Shortcut time', emph: `${a} × 25`, ans: a * 25, wrong: [a * 25 + 100, a * 25 - 100, a * 20], step: 50, why: `× 25 = × 100 ÷ 4 → ${k.fmtIN(a * 100)} ÷ 4 = ${k.fmtIN(a * 25)}`, p: [t, a] }; }
    if (t === 'x11') { const a = k.ri(12, 98); return { prompt: 'Shortcut time', emph: `${a} × 11`, ans: a * 11, wrong: [a * 11 + 10, a * 11 - 10, a * 10 + 11], step: 10, why: `${a} × 10 + ${a} = ${a * 10} + ${a} = ${k.fmtIN(a * 11)}`, p: [t, a] }; }
    const b = k.ri(6, 19), c = k.ri(12, 49); return { prompt: 'Quick! Work it out', emph: `${b * c} ÷ ${b}`, ans: c, wrong: [c + 1, c - 1, c + 2], why: `${b} × ${c} = ${b * c}, so ${b * c} ÷ ${b} = ${c}`, p: [t, b, c] };
  } }),
  Q({ id: 'q.approx', sub: 'Approximation', lv: [2, 3], time: 15, gen(k, L) {
    const p = k.pick([10, 20, 25, 30, 40, 50, 60, 75]); const base = 100 * k.ri(3, 30); const n = base + k.pick([1, -1, 2, -2]);
    const pp = p + k.pick([0.2, -0.2, 0.1, -0.1]); const ans = (p * base) / 100;
    return { prompt: `Closest value of ${pp}% of ${n}?`, ans, wrong: [ans * 2, ans / 2, ans + base / 10, ans - base / 10].filter(Number.isInteger), step: Math.max(5, ans / 5), why: `≈ ${p}% of ${base} = ${ans}`, p: [p, n, pp] };
  } }),
  Q({ id: 'q.fraction', sub: 'Fractions', lv: [2, 3], time: 20, gen(k) {
    const fr = new Set(); while (fr.size < 4) { const d = k.ri(3, 13); const n = k.ri(1, d - 1); if (k.gcd(n, d) === 1) fr.add(`${n}/${d}`); }
    const list = [...fr]; const val = (s) => { const [a, b] = s.split('/').map(Number); return a / b; };
    const vals = list.map(val); if (new Set(vals.map((v) => v.toFixed(6))).size < 4) return null;
    const big = k.chance(0.5); const ans = list[vals.indexOf(big ? Math.max(...vals) : Math.min(...vals))];
    return { prompt: `Which fraction is the ${big ? 'largest' : 'smallest'}?`, ans, opts: list, why: list.map((s) => `${s}≈${val(s).toFixed(2)}`).join(', '), p: list };
  } }),

  // ---------------- Percentages ----------------
  Q({ id: 'q.pct.of', sub: 'Percentages', lv: [1, 2], time: 10, gen(k, L) {
    let p, b, a; do { p = k.pick(L === 1 ? [10, 20, 25, 50, 5] : [12, 15, 30, 35, 40, 45, 60, 75, 80, 120, 150]); b = k.pick([40, 60, 80, 120, 160, 200, 240, 300, 360, 400, 480, 640, 720, 800, 1200, 2500]); a = (p * b) / 100; } while (!Number.isInteger(a));
    return { prompt: 'What is', emph: `${p}% of ${b}`, ans: a, wrong: [a * 10, (p * b) / 1000, b - a, a + p], why: `${p}/100 × ${b} = ${a}`, p: [p, b] };
  } }),
  Q({ id: 'q.pct.what', sub: 'Percentages', lv: [1, 2], time: 12, gen(k) {
    let p, b, a; do { p = k.pick([5, 10, 20, 25, 30, 40, 50, 60, 75, 80, 125, 150]); b = k.pick([40, 80, 120, 160, 200, 240, 400, 600, 800]); a = (p * b) / 100; } while (!Number.isInteger(a));
    return { prompt: `${a} is what percent of ${b}?`, ans: p, post: '%', wrong: [100 - p, p / 2, p * 2, p + 10], step: 5, why: `${a} ÷ ${b} × 100 = ${p}%`, p: [a, b] };
  } }),
  Q({ id: 'q.pct.change', sub: 'Percentages', lv: [1, 3], time: 15, gen(k, L) {
    const up = k.chance(0.5); let p, b, n; do { p = k.pick([5, 8, 10, 12, 15, 20, 25, 30, 40]); b = 50 * k.ri(4, 400); n = b + ((up ? 1 : -1) * p * b) / 100; } while (!Number.isInteger(n));
    const it = k.pick(ITEMS);
    return { prompt: `A ${it} costs ₹${k.fmtIN(b)}. Its price ${up ? 'rises' : 'falls'} by ${p}%. New price?`, ans: n, pre: '₹', wrong: [b + ((up ? -1 : 1) * p * b) / 100, (p * b) / 100, b + (up ? p : -p)], step: Math.max(10, (p * b) / 400), why: `${p}% of ${k.fmtIN(b)} = ${k.fmtIN((p * b) / 100)} → ${k.fmtIN(b)} ${up ? '+' : '−'} ${k.fmtIN((p * b) / 100)} = ₹${k.fmtIN(n)}`, steps: `Shortcut: multiply by ${up ? (100 + p) / 100 : (100 - p) / 100} directly → ${k.fmtIN(b)} × ${up ? (100 + p) / 100 : (100 - p) / 100} = ₹${k.fmtIN(n)}.`, p: [up, p, b] };
  } }),
  Q({ id: 'q.pct.succ', sub: 'Percentages', lv: [2, 3], time: 25, gen(k) {
    const a = k.pick([10, 20, 25, 30, 40, 50]); const b = k.pick([10, 20, 25, 30, 40, 50]); const s1 = k.chance(0.5) ? 1 : -1; const s2 = k.chance(0.6) ? -1 : 1;
    const net = s1 * a + s2 * b + (s1 * a * s2 * b) / 100; if (!Number.isInteger(net * 10)) return null;
    const word = (s) => (s > 0 ? 'increased' : 'decreased');
    return { prompt: `A price is ${word(s1)} by ${a}% and then ${word(s2)} by ${b}%. Net change?`, ans: net, post: '%', wrong: [s1 * a + s2 * b, net + 5, -net, net - 5], step: 2, why: `${k.sn(s1 * a)} ${s2 > 0 ? '+' : '−'} ${b} + (${k.pn(s1 * a)} × ${k.pn(s2 * b)})/100 = ${k.sn(net)}%${net > 0 ? ' (an increase)' : net < 0 ? ' (a decrease)' : ''}`, steps: 'Successive change formula: a + b + ab/100 (use negative values for decreases).', p: [s1 * a, s2 * b] };
  } }),
  Q({ id: 'q.pct.rev', sub: 'Percentages', lv: [2, 3], time: 25, gen(k) {
    const p = k.pick([10, 20, 25, 50, 60]); const orig = 20 * k.ri(5, 100); const now = orig * (1 + p / 100); if (!Number.isInteger(now)) return null;
    return { prompt: `After a ${p}% increase, a salary is ₹${k.fmtIN(now)}. What was it before?`, ans: orig, pre: '₹', wrong: [now - (p * now) / 100, now - p * 10, Math.round(now * 0.9)].filter(Number.isInteger), step: Math.max(20, orig / 10), why: `${k.fmtIN(now)} ÷ ${1 + p / 100} = ${k.fmtIN(orig)}`, steps: `Original × ${(100 + p) / 100} = ${now}, so original = ${now} × 100/${100 + p}.`, p: [p, orig] };
  } }),
  Q({ id: 'q.pct.pop', sub: 'Percentages', lv: [3, 3], deep: true, time: 40, gen(k) {
    const r = k.pick([10, 20]); const P = 1000 * k.ri(10, 90); const ans = P * (1 + r / 100) ** 2;
    return { prompt: `A town's population of ${k.fmtIN(P)} grows ${r}% every year. Population after 2 years?`, ans: Math.round(ans), wrong: [P + (2 * r * P) / 100, Math.round(ans) + 1000, Math.round(ans) - 1000], step: 1000, why: `${k.fmtIN(P)} × ${(1 + r / 100).toFixed(1)}² = ${k.fmtIN(Math.round(ans))}`, steps: 'Growth compounds: multiply by (1 + r/100) once for each year.', p: [r, P] };
  } }),

  // ---------------- Profit, loss, discount ----------------
  Q({ id: 'q.pl.sp', sub: 'Profit & Loss', lv: [1, 2], time: 15, gen(k, L) {
    const loss = L >= 2 && k.chance(0.4); let cp, p, sp; do { cp = 50 * k.ri(4, 200); p = k.pick([5, 10, 12, 15, 20, 25, 30, 40, 50]); sp = cp + ((loss ? -1 : 1) * cp * p) / 100; } while (!Number.isInteger(sp));
    return { prompt: `Bought for ₹${k.fmtIN(cp)}, sold at a ${p}% ${loss ? 'loss' : 'profit'}. Selling price?`, ans: sp, pre: '₹', wrong: [cp - ((loss ? -1 : 1) * cp * p) / 100, (cp * p) / 100, cp + (loss ? -p : p)], step: Math.max(10, (cp * p) / 300), why: `${p}% of ${k.fmtIN(cp)} = ${k.fmtIN((cp * p) / 100)} → ${k.fmtIN(cp)} ${loss ? '−' : '+'} ${k.fmtIN((cp * p) / 100)} = ₹${k.fmtIN(sp)}`, p: [loss, cp, p] };
  } }),
  Q({ id: 'q.pl.pct', sub: 'Profit & Loss', lv: [2, 2], time: 18, gen(k) {
    const loss = k.chance(0.4); let cp, p, sp; do { cp = 25 * k.ri(4, 200); p = k.pick([5, 10, 12.5, 15, 20, 25, 30, 40]); sp = cp + ((loss ? -1 : 1) * cp * p) / 100; } while (!Number.isInteger(sp));
    return { prompt: `Bought for ₹${k.fmtIN(cp)}, sold for ₹${k.fmtIN(sp)}. ${loss ? 'Loss' : 'Profit'} percent?`, ans: p, post: '%', wrong: [Math.round((Math.abs(sp - cp) / sp) * 1000) / 10, p + 5, p * 2], step: 5, why: `${loss ? 'Loss' : 'Profit'} = ${k.fmtIN(Math.abs(sp - cp))}; ${k.fmtIN(Math.abs(sp - cp))} ÷ ${k.fmtIN(cp)} × 100 = ${p}% (always on cost price)`, p: [loss, cp, p] };
  } }),
  Q({ id: 'q.pl.cp', sub: 'Profit & Loss', lv: [2, 3], time: 25, gen(k) {
    const p = k.pick([10, 20, 25, 50]); const cp = 40 * k.ri(5, 150); const sp = cp * (1 + p / 100);
    return { prompt: `By selling a ${k.pick(ITEMS)} for ₹${k.fmtIN(sp)}, a dealer gains ${p}%. Cost price?`, ans: cp, pre: '₹', wrong: [sp - (sp * p) / 100, sp - p * 10, cp + 40].filter(Number.isInteger), step: Math.max(20, cp / 10), why: `${k.fmtIN(sp)} × 100/${100 + p} = ₹${k.fmtIN(cp)}`, steps: 'Profit % is on cost price, so CP = SP × 100/(100 + profit%). Taking p% of SP is the common trap.', p: [p, cp] };
  } }),
  Q({ id: 'q.disc', sub: 'Discounts', lv: [1, 2], time: 12, gen(k) {
    let mp, d, sp; do { mp = 100 * k.ri(2, 600); d = k.pick([5, 10, 12, 15, 20, 25, 30, 40, 50, 60]); sp = mp - (mp * d) / 100; } while (!Number.isInteger(sp));
    return { prompt: `A ${k.pick(ITEMS)} marked ₹${k.fmtIN(mp)} has ${d}% off. You pay?`, ans: sp, pre: '₹', wrong: [(mp * d) / 100, mp - d * 10, mp + (mp * d) / 100], step: Math.max(10, mp / 50), why: `${d}% of ${k.fmtIN(mp)} = ${k.fmtIN((mp * d) / 100)} off → ${k.fmtIN(mp)} − ${k.fmtIN((mp * d) / 100)} = ₹${k.fmtIN(sp)}`, p: [mp, d] };
  } }),
  Q({ id: 'q.disc.succ', sub: 'Discounts', lv: [2, 3], time: 22, gen(k) {
    const a = k.pick([10, 20, 25, 30, 40, 50]), b = k.pick([10, 20, 25, 40, 50]); const eq = a + b - (a * b) / 100;
    return { prompt: `Two successive discounts of ${a}% and ${b}% equal a single discount of`, ans: eq, post: '%', wrong: [a + b, eq + 5, eq - 5, (a * b) / 10], step: 2, why: `${a} + ${b} − (${a} × ${b})/100 = ${eq}%`, steps: `Check with ₹100: after ${a}% off → ${100 - a}; after ${b}% more off → ${(100 - a) * (100 - b) / 100}. Total off = ${eq}.`, p: [a, b] };
  } }),
  Q({ id: 'q.disc.markup', sub: 'Discounts', lv: [3, 4], deep: true, time: 40, gen(k) {
    const m = k.pick([20, 25, 30, 40, 50, 60]); const d = k.pick([10, 20, 25]); const net = m - d - (m * d) / 100; if (!Number.isInteger(net * 10) || net <= 0) return null;
    return { prompt: `A shop marks goods ${m}% above cost, then gives a ${d}% discount. Profit percent?`, ans: net, post: '%', wrong: [m - d, net + 5, net - 2], step: 2, why: `${(1 + m / 100).toFixed(2)} × ${(1 - d / 100).toFixed(2)} = ${(1 + net / 100).toFixed(3).replace(/0$/, '')} → ${net}% profit`, steps: `Take cost = 100. Marked = ${100 + m}. After ${d}% off: ${100 + m} × ${(100 - d) / 100} = ${100 + net}. Profit = ${net}%.`, p: [m, d] };
  } }),

  // ---------------- Ratio, averages, mixtures ----------------
  Q({ id: 'q.ratio.share', sub: 'Ratio & Proportion', lv: [1, 2], time: 15, gen(k) {
    const a = k.ri(1, 7); let b = k.ri(1, 8); if (b === a) b++; const u = 10 * k.ri(2, 90); const tot = u * (a + b); const [x, y] = k.pickN(NAMES, 2); const first = k.chance(0.5); const ans = (first ? a : b) * u;
    return { prompt: `₹${k.fmtIN(tot)} is split between ${x} and ${y} in the ratio ${a}:${b}. ${first ? x : y} gets?`, ans, pre: '₹', wrong: [(first ? b : a) * u, tot / 2, ans + u], step: u, why: `${a} + ${b} = ${a + b} parts; ${k.fmtIN(tot)} ÷ ${a + b} = ${k.fmtIN(u)} per part → ${first ? x : y} gets ${first ? a : b} × ${k.fmtIN(u)} = ₹${k.fmtIN(ans)}`, p: [a, b, u, first] };
  } }),
  Q({ id: 'q.ratio.comb', sub: 'Ratio & Proportion', lv: [2, 3], time: 25, gen(k) {
    const a = k.ri(1, 9), b = k.ri(1, 9), c = k.ri(1, 9), d = k.ri(1, 9); if (a === b || c === d || k.gcd(a, b) !== 1 || k.gcd(c, d) !== 1) return null; const A = a * c, C = b * d; const g = k.gcd(A, C); if (A / g === C / g) return null;
    const ans = `${A / g}:${C / g}`;
    return { prompt: `A:B = ${a}:${b} and B:C = ${c}:${d}. Find A:C.`, ans, wrong: [`${a}:${d}`, `${C / g}:${A / g}`, `${a * d}:${b * c}`, `${a + c}:${b + d}`].filter((x) => x !== ans), why: `A:C = (${a} × ${c}) : (${b} × ${d}) = ${A}:${C}${g > 1 ? ` = ${ans}` : ''}`, steps: `Make B the same in both ratios: A:B = ${a * c}:${b * c} and B:C = ${b * c}:${b * d}, so A:C = ${A}:${C}${g > 1 ? ` = ${ans}` : ''}.`, p: [a, b, c, d] };
  } }),
  Q({ id: 'q.ratio.add', sub: 'Ratio & Proportion', lv: [3, 3], deep: true, time: 40, gen(k) {
    const p = k.ri(1, 5); const q = p + k.ri(1, 4); if (k.gcd(p, q) !== 1) return null; const x = k.ri(2, 15); const m = k.ri(2, 6); const A = p * m * 2 - x, B = q * m * 2 - x; if (A <= 0 || B <= 0 || A === B) return null;
    return { prompt: `What number must be added to both ${A} and ${B} so that they are in the ratio ${p}:${q}?`, ans: x, wrong: [x + 1, x - 1, x + 2, 2 * x], step: 1, why: `(${A} + ${x}) : (${B} + ${x}) = ${A + x}:${B + x} = ${p}:${q}`, steps: `Solve (${A}+x)/(${B}+x) = ${p}/${q}: ${q}(${A}+x) = ${p}(${B}+x) → x = ${x}.`, p: [A, B, p, q] };
  } }),
  Q({ id: 'q.avg', sub: 'Averages', lv: [1, 2], time: 15, gen(k, L) {
    const n = L === 1 ? 3 : k.pick([4, 5]); const avg = k.ri(10, 90); const nums = []; let rest = 0;
    for (let i = 0; i < n - 1; i++) { const v = avg + k.ri(-12, 12); nums.push(v); rest += v - avg; } nums.push(avg - rest); if (nums.some((x) => x <= 0)) return null;
    const sum = nums.reduce((a, b) => a + b, 0);
    return { prompt: 'Average of', emph: nums.join(', '), ans: avg, wrong: [avg + 1, avg - 1, Math.round(sum / (n + 1))], step: 2, why: `Sum = ${sum}; ${sum} ÷ ${n} = ${avg}`, p: nums };
  } }),
  Q({ id: 'q.avg.new', sub: 'Averages', lv: [2, 3], time: 30, gen(k) {
    const n = k.ri(5, 30); const a = k.ri(20, 60); const b = a + k.pick([1, 2, 3, -1, -2]); const x = b * (n + 1) - a * n; if (x <= 0) return null;
    const what = k.pick([['students', 'marks', 'student', 100], ['players', 'age', 'player', 45], ['workers', 'daily wage (₹)', 'worker', a * 3]]); if (x > what[3] || (what[2] === 'player' && (a > 35 || x < 14))) return null;
    return { prompt: `The average ${what[1]} of ${n} ${what[0]} is ${a}. A new ${what[2]} joins and the average becomes ${b}. The new ${what[2]}'s ${what[1]}?`, ans: x, wrong: [b, a + (b - a) * n, x + (b - a)], step: 2, why: `New total ${b} × ${n + 1} = ${b * (n + 1)}; old total ${a} × ${n} = ${a * n}; ${b * (n + 1)} − ${a * n} = ${x}`, steps: `New total − old total = ${b * (n + 1)} − ${a * n} = ${x}.`, p: [n, a, b] };
  } }),
  Q({ id: 'q.mix.allig', sub: 'Mixtures & Alligation', lv: [3, 3], deep: true, time: 45, gen(k) {
    const c1 = 10 * k.ri(4, 15); const c2 = c1 + 10 * k.ri(2, 8); const m = c1 + 10 * k.ri(1, (c2 - c1) / 10 - 1); const r1 = c2 - m, r2 = m - c1; const g = k.gcd(r1, r2);
    const ans = `${r1 / g}:${r2 / g}`; const it = k.pick(['rice', 'tea', 'sugar', 'dal', 'coffee']);
    return { prompt: `In what ratio must ${it} at ₹${c1}/kg be mixed with ${it} at ₹${c2}/kg to get a mix worth ₹${m}/kg?`, ans, wrong: [`${r2 / g}:${r1 / g}`, `${c1 / 10}:${c2 / 10}`, `${r1 / g + 1}:${r2 / g}`, '1:1'].filter((x) => x !== ans), why: `(${c2} − ${m}) : (${m} − ${c1}) = ${r1}:${r2}${g > 1 ? ` = ${ans}` : ''}`, steps: 'Alligation: cheaper : dearer = (dearer − mean) : (mean − cheaper).', p: [c1, c2, m] };
  } }),
  Q({ id: 'q.mix.water', sub: 'Mixtures & Alligation', lv: [3, 4], deep: true, time: 60, gen(k) {
    const a = k.ri(2, 7), b = k.ri(1, 4); if (k.gcd(a, b) !== 1) return null; const u = k.ri(3, 12); const tot = (a + b) * u; const nb = b + k.ri(1, 3); if (k.gcd(a, nb) !== 1) return null; const add = (a * u * nb) / a - b * u; if (!Number.isInteger(add) || add <= 0) return null;
    return { prompt: `${tot} litres of a mixture has milk and water in the ratio ${a}:${b}. How much water must be added to make it ${a}:${nb}?`, ans: add, post: ' L', wrong: [add + u, add - 1, (nb - b) * 2, tot / (a + b)].filter((v) => v > 0), step: Math.max(1, u / 2), why: `Milk ${a * u} L stays; water must be ${nb * u} L → add ${add} L`, steps: `Milk = ${a * u} L, water = ${b * u} L. For ${a}:${nb}, water = ${a * u} × ${nb}/${a} = ${nb * u} L. Add ${nb * u} − ${b * u} = ${add} L.`, p: [a, b, u, nb] };
  } }),

  // ---------------- Interest ----------------
  Q({ id: 'q.si', sub: 'Simple Interest', lv: [1, 2], time: 15, gen(k) {
    let P, R, T, si; do { P = 500 * k.ri(2, 80); R = k.ri(3, 15); T = k.ri(1, 6); si = (P * R * T) / 100; } while (!Number.isInteger(si));
    return { prompt: `₹${k.fmtIN(P)} at ${R}% simple interest for ${T} year${T > 1 ? 's' : ''}. Interest?`, ans: si, pre: '₹', wrong: [P + si, (P * R) / 100, si + (P * R) / 100], step: Math.max(10, si / 10), why: `${k.fmtIN(P)} × ${R} × ${T} ÷ 100 = ${k.fmtIN(si)}`, p: [P, R, T] };
  } }),
  Q({ id: 'q.si.rate', sub: 'Simple Interest', lv: [2, 3], time: 25, gen(k) {
    const R = k.ri(4, 20); const T = k.ri(2, 8); const P = 1000 * k.ri(1, 50); const si = (P * R * T) / 100;
    return { prompt: `A sum of ₹${k.fmtIN(P)} earns ₹${k.fmtIN(si)} simple interest in ${T} years. Rate per year?`, ans: R, post: '%', wrong: [R * T, R + 1, R - 1, R + 2].filter((v) => v > 0), step: 1, why: `${k.fmtIN(si)} × 100 ÷ (${k.fmtIN(P)} × ${T}) = ${R}%`, p: [P, R, T] };
  } }),
  Q({ id: 'q.ci', sub: 'Compound Interest', lv: [2, 3], time: 30, gen(k) {
    const R = k.pick([5, 10, 20, 15]); const P = (R === 15 ? 400 : 100) * k.ri(10, 150); const T = 2; const A = P * (1 + R / 100) ** T; if (!k.isInt(A)) return null; const ci = Math.round(A - P);
    const askAmt = k.chance(0.4);
    return { prompt: `₹${k.fmtIN(P)} at ${R}% compound interest (yearly) for 2 years. ${askAmt ? 'Total amount' : 'Interest earned'}?`, ans: askAmt ? Math.round(A) : ci, pre: '₹', wrong: askAmt ? [P + (2 * P * R) / 100, Math.round(A) + 100, Math.round(A) - 50] : [(2 * P * R) / 100, ci + (P * R * R) / 10000 + 10, Math.round(A)], step: Math.max(10, ci / 10), why: `${k.fmtIN(P)} × ${(1 + R / 100).toFixed(2)}² = ${k.fmtIN(Math.round(A))}`, steps: `Year 1: ${k.fmtIN(P)} → ${k.fmtIN(P * (1 + R / 100))}. Year 2: → ${k.fmtIN(Math.round(A))}. Interest = ${k.fmtIN(ci)}.`, p: [P, R, askAmt] };
  } }),
  Q({ id: 'q.ci.diff', sub: 'Compound Interest', lv: [3, 4], deep: true, time: 45, gen(k) {
    const R = k.pick([5, 10, 4, 8, 20]); const P = 100 * k.ri(10, 200); const d = (P * R * R) / 10000; if (!Number.isInteger(d)) return null;
    return { prompt: `Difference between compound and simple interest on ₹${k.fmtIN(P)} for 2 years at ${R}% per year?`, ans: d, pre: '₹', wrong: [(P * R) / 100, 2 * d, d + 10, (P * R * 2) / 100], step: Math.max(2, d / 4), why: `P × (R/100)² = ${k.fmtIN(P)} × (${R}/100)² = ${d}`, steps: 'For 2 years, CI − SI = P(R/100)², the interest earned on the first year\'s interest.', p: [P, R] };
  } }),

  // ---------------- Time & work, pipes ----------------
  Q({ id: 'q.work.tog', sub: 'Time & Work', lv: [2, 3], time: 22, gen(k, L) {
    const pool = WORK_PAIRS.filter(([a, b]) => (L === 2 ? b <= 30 : b > 12)); const [a, b, t] = k.pick(pool); const [x, y] = k.pickN(NAMES, 2);
    return { prompt: `${x} can finish a job in ${a} days and ${y} in ${b} days. Working together?`, ans: t, post: ' days', wrong: [(a + b) / 2, a + b, t + 1, t - 1].filter((v) => v > 0 && Number.isInteger(v)), step: 1, why: `1/${a} + 1/${b} = 1/${t} of the job per day → ${t} days`, steps: `Per day they do 1/${a} + 1/${b} = ${(a + b) / k.gcd(a + b, a * b)}/${(a * b) / k.gcd(a + b, a * b)} of the job, so ${t} days.`, p: [a, b] };
  } }),
  Q({ id: 'q.work.alone', sub: 'Time & Work', lv: [3, 3], deep: true, time: 40, gen(k) {
    const [a, b, t] = k.pick(WORK_PAIRS.filter((x) => x[1] <= 60)); const [x, y] = k.pickN(NAMES, 2);
    return { prompt: `${x} and ${y} together finish a job in ${t} days. ${x} alone takes ${a} days. How long would ${y} take alone?`, ans: b, post: ' days', wrong: [a - t, a + t, b + t, 2 * t].filter((v) => v > 1), step: 2, why: `${y} per day = 1/${t} − 1/${a} = 1/${b} → ${b} days`, steps: `Together they do 1/${t} per day; ${x} alone does 1/${a}. What's left is ${y}'s share: 1/${t} − 1/${a} = 1/${b}.`, p: [a, t] };
  } }),
  Q({ id: 'q.work.eff', sub: 'Time & Work', lv: [3, 4], deep: true, time: 50, gen(k) {
    const m = k.ri(2, 4); const t = m * k.ri(1, 5); const b = t * (m + 1); const a = b / m; const [x, y] = k.pickN(NAMES, 2);
    return { prompt: `${x} is ${m} times as efficient as ${y}. Together they finish a job in ${t} days. How many days would ${y} take alone?`, ans: b, post: ' days', wrong: [a, t * m, b + t, b - 1], step: 2, why: `${y} = 1 part, ${x} = ${m} parts, together ${m + 1} parts → ${y} alone takes ${t} × ${m + 1} = ${b} days`, p: [m, t] };
  } }),
  Q({ id: 'q.pipes', sub: 'Pipes & Cisterns', lv: [2, 3], time: 30, gen(k, L) {
    if (L === 2) { const [a, b, t] = k.pick(WORK_PAIRS.filter((x) => x[1] <= 40)); return { prompt: `Pipe A fills a tank in ${a} hours, pipe B in ${b} hours. Both open together?`, ans: t, post: ' h', wrong: [(a + b) / 2, a + b, t + 1, b - a].filter((v) => v > 0 && Number.isInteger(v)), step: 1, why: `1/${a} + 1/${b} = 1/${t} of the tank per hour → ${t} h`, p: ['f', a, b] }; }
    const [a, b, t] = k.pick(PIPE_PAIRS);
    return { prompt: `A pipe fills a tank in ${a} hours; a leak empties it in ${b} hours. With both working, the tank fills in?`, ans: t, post: ' h', wrong: [b - a, (a * b) / (a + b), t + a, t - 1].filter((v) => v > 0 && Number.isInteger(v)), step: 2, why: `Fill 1/${a} − leak 1/${b} = 1/${t} per hour → ${t} h`, p: ['l', a, b] };
  } }),

  // ---------------- Speed, trains, boats, races ----------------
  Q({ id: 'q.tsd', sub: 'Time, Speed & Distance', lv: [1, 2], time: 12, gen(k, L) {
    const [who, sp] = k.pick([['A train', [40, 45, 50, 60, 72, 80, 90, 120]], ['A car', [30, 40, 50, 60, 70, 80]], ['A bus', [30, 35, 40, 45, 50]], ['A cyclist', [10, 12, 15, 18, 20]]]);
    const v = k.pick(sp); const h = k.ri(2, 9); const d = v * h; const t = L === 1 ? 'dist' : k.pick(['dist', 'time', 'speed']);
    if (t === 'dist') return { prompt: `${who} goes at ${v} km/h for ${h} hours. Distance?`, ans: d, post: ' km', wrong: [v + h, d + v, d - v], step: v, why: `${v} × ${h} = ${d} km`, p: [t, v, h] };
    if (t === 'time') return { prompt: `${who} covers ${d} km at ${v} km/h. Time taken?`, ans: h, post: ' h', wrong: [h + 1, h - 1, h + 2].filter((x) => x > 0), why: `${d} ÷ ${v} = ${h} h`, p: [t, v, h] };
    return { prompt: `${who} covers ${d} km in ${h} hours. Speed?`, ans: v, post: ' km/h', wrong: [v + 5, v - 5, v + 10], step: 5, why: `${d} ÷ ${h} = ${v} km/h`, p: [t, v, h] };
  } }),
  Q({ id: 'q.tsd.units', sub: 'Time, Speed & Distance', lv: [1, 2], time: 10, gen(k) {
    const toMs = k.chance(0.5); const kmh = 18 * k.ri(1, 8);
    if (toMs) return { prompt: 'Convert to metres per second', emph: `${kmh} km/h`, ans: (kmh * 5) / 18, post: ' m/s', wrong: [(kmh * 18) / 5, kmh / 3.6 + 5, kmh / 2], step: 5, why: `${kmh} × 5/18 = ${(kmh * 5) / 18} m/s`, p: [1, kmh] };
    return { prompt: 'Convert to km per hour', emph: `${(kmh * 5) / 18} m/s`, ans: kmh, post: ' km/h', wrong: [(kmh * 25) / 324 * 18, kmh + 18, kmh / 2].map(Math.round), step: 18, why: `${(kmh * 5) / 18} × 18/5 = ${kmh} km/h`, p: [0, kmh] };
  } }),
  Q({ id: 'q.tsd.avg', sub: 'Time, Speed & Distance', lv: [2, 3], time: 30, gen(k) {
    const [x, y, a] = k.pick(AVG_SPEED);
    return { prompt: `You drive to a town at ${x} km/h and return the same way at ${y} km/h. Average speed for the trip?`, ans: a, post: ' km/h', wrong: [(x + y) / 2, a + 2, a - 2].filter(Number.isInteger), step: 2, why: `2 × ${x} × ${y} ÷ (${x} + ${y}) = ${k.fmtIN(2 * x * y)} ÷ ${x + y} = ${a} km/h`, steps: 'Same distance both ways → average speed = 2xy/(x+y), not the simple average.', p: [x, y] };
  } }),
  Q({ id: 'q.train.pole', sub: 'Trains', lv: [2, 3], time: 25, gen(k, L) {
    const v = 18 * k.ri(2, 6); const ms = (v * 5) / 18; const t = k.ri(6, 20); const len = ms * t; const plat = L >= 3 ? 50 * k.ri(2, 8) : 0; const tt = (len + plat) / ms; if (!Number.isInteger(tt)) return null;
    if (!plat) return { prompt: `A ${len} m long train runs at ${v} km/h. Time to cross a pole?`, ans: t, post: ' s', wrong: [Math.round(len / v), t + 2, t * 2].filter((x) => x > 0), step: 1, why: `${v} km/h = ${ms} m/s; ${len} ÷ ${ms} = ${t} s`, p: [v, t] };
    return { prompt: `A ${len} m train at ${v} km/h crosses a ${plat} m platform in how long?`, ans: tt, post: ' s', wrong: [t, tt + 5, Math.round(plat / ms)], step: 2, why: `(${len} + ${plat}) ÷ ${ms} = ${tt} s`, steps: 'Crossing a platform means covering train length + platform length.', p: [v, t, plat] };
  } }),
  Q({ id: 'q.train.rel', sub: 'Trains', lv: [3, 4], deep: true, time: 50, gen(k) {
    const v1 = 18 * k.ri(2, 5), v2 = 18 * k.ri(1, 4); const opp = k.chance(0.6); const rel = opp ? v1 + v2 : v1 - v2; if (rel <= 0) return null; const ms = (rel * 5) / 18; const t = k.ri(6, 24); const total = ms * t; const l1 = 10 * k.ri(5, Math.floor(total / 10) - 3); const l2 = total - l1; if (l2 < 50) return null;
    return { prompt: `Trains of ${l1} m and ${l2} m run ${opp ? 'towards each other' : 'in the same direction'} at ${v1} and ${v2} km/h. Time to cross each other completely?`, ans: t, post: ' s', wrong: [Math.round(total / (((opp ? v1 - v2 : v1 + v2) * 5) / 18)) || t + 7, t + 3, t * 2].filter((x) => x > 0), step: 2, why: `Relative speed ${rel} km/h = ${ms} m/s; (${l1} + ${l2}) ÷ ${ms} = ${t} s`, steps: `${opp ? 'Opposite directions: add speeds' : 'Same direction: subtract speeds'} → ${rel} km/h. Distance = sum of lengths = ${total} m.`, p: [v1, v2, opp, l1, t] };
  } }),
  Q({ id: 'q.boat', sub: 'Boats & Streams', lv: [2, 3], time: 30, gen(k) {
    const b = k.ri(6, 20), s = k.ri(1, 5); if (s >= b) return null; const askBoat = k.chance(0.5);
    return { prompt: `A boat goes ${b + s} km/h downstream and ${b - s} km/h upstream. Speed of the ${askBoat ? 'boat in still water' : 'stream'}?`, ans: askBoat ? b : s, post: ' km/h', wrong: (askBoat ? [s, b + s, b - s, b + 1] : [b, 2 * s, s + 1, s + 2]).filter((v) => v > 0), why: askBoat ? `(${b + s} + ${b - s}) ÷ 2 = ${b}` : `(${b + s} − ${b - s}) ÷ 2 = ${s}`, p: [b, s, askBoat] };
  } }),
  Q({ id: 'q.race', sub: 'Races', lv: [3, 4], deep: true, time: 45, gen(k) {
    const x = k.pick([5, 10, 20, 25, 4, 8]), y = k.pick([5, 10, 20, 25, 4, 8]); const c = 100 - ((100 - x) * (100 - y)) / 100; if (!k.isInt(c)) return null;
    return { prompt: `In a 100 m race, A beats B by ${x} m and B beats C by ${y} m. By how much does A beat C?`, ans: c, post: ' m', wrong: [x + y, c + 1, c - 1, Math.abs(x - y) || x + 3], step: 1, why: `When A runs 100, C runs ${100 - x} × ${(100 - y) / 100} = ${100 - c} → A wins by ${c} m`, steps: `B runs ${100 - x} m while A runs 100. C runs ${(100 - y) / 100} of B's distance → ${100 - c} m. A wins by ${c} m.`, p: [x, y] };
  } }),

  // ---------------- Ages ----------------
  Q({ id: 'q.ages', sub: 'Ages', lv: [1, 2], time: 18, gen(k, L) {
    if (L >= 2 && k.chance(0.5)) { const s = k.ri(4, 15); const m = k.pick([2, 3, 4]); const sum = s * (m + 1); return { prompt: `A mother is ${m} times as old as her son. Their ages add up to ${sum}. Son's age?`, ans: s, wrong: [s * m, sum / m, s + 2].filter(Number.isInteger), why: `Son = 1 part, mother = ${m} parts: ${sum} ÷ ${m + 1} = ${s}`, p: ['m', s, m] }; }
    const b = k.ri(6, 40); const d = k.ri(2, 15); const sum = 2 * b + d; const [x, y] = k.pickN(NAMES, 2);
    return { prompt: `${x} is ${d} years older than ${y}. Together they are ${sum}. How old is ${y}?`, ans: b, wrong: [b + d, sum / 2, b - 1].filter(Number.isInteger), why: `(${sum} − ${d}) ÷ 2 = ${b}`, p: ['d', b, d] };
  } }),
  Q({ id: 'q.ages.ratio', sub: 'Ages', lv: [3, 4], deep: true, time: 50, gen(k) {
    const a = k.ri(2, 7), b = k.ri(1, 6); if (a <= b || k.gcd(a, b) !== 1) return null; const u = k.ri(3, 9); const n = k.ri(2, 12); const A = a * u + n, B = b * u + n; const g = k.gcd(A, B);
    if (A / g === a) return null; const [x, y] = k.pickN(NAMES, 2);
    return { prompt: `The ages of ${x} and ${y} are in the ratio ${a}:${b}. After ${n} years the ratio will be ${A / g}:${B / g}. ${x}'s present age?`, ans: a * u, wrong: [b * u, a * u + n, a * (u + 1), A], step: a, why: `(${a}x + ${n}) : (${b}x + ${n}) = ${A / g}:${B / g} → x = ${u}, so ${x} = ${a} × ${u} = ${a * u}`, steps: `Cross-multiply: ${B / g}(${a}x + ${n}) = ${A / g}(${b}x + ${n}) → x = ${u}. Present ages: ${a * u} and ${b * u}.`, p: [a, b, u, n] };
  } }),

  // ---------------- Number system ----------------
  Q({ id: 'q.num.unit', sub: 'Number System', lv: [2, 3], time: 20, gen(k) {
    const base = k.ri(2, 99); const e = k.ri(10, 300); const d = base % 10; if ([0, 1, 5, 6].includes(d) && k.chance(0.7)) return null; let r = 1; for (let i = 0; i < ((e - 1) % 4) + 1 + 4; i++) r = (r * d) % 10; // cyclicity
    let x = 1; for (let i = 0; i < e; i++) x = (x * d) % 10;
    const opts = [x, ...k.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((v) => v !== x)).slice(0, 3)];
    return { prompt: 'Unit digit of', emph: `${base}^${e}`, ans: x, opts, why: (() => { const cyc = []; let v = d; for (let i = 0; i < 4; i++) { cyc.push(v); v = (v * d) % 10; } const pos = ((e - 1) % 4) + 1; return `Unit digits of ${d}¹, ${d}², ${d}³, ${d}⁴: ${cyc.join(', ')} (repeats every 4). ${e} mod 4 = ${e % 4} → use ${d}^${pos} → ${x}`; })(), p: [base, e] };
  } }),
  Q({ id: 'q.num.rem', sub: 'Remainders', lv: [2, 4], time: 30, gen(k, L) {
    if (L === 2) { const d = k.ri(6, 19); const q = k.ri(20, 400); const r = k.ri(0, d - 1); const n = d * q + r; return { prompt: `Remainder when ${n} is divided by ${d}?`, ans: r, opts: [r, ...k.shuffle([...Array(d).keys()].filter((v) => v !== r)).slice(0, 3)], why: `${d} × ${q} = ${d * q}; ${n} − ${d * q} = ${r}`, p: [n, d] }; }
    const b = k.pick([2, 3, 4, 5, 7]); const m = k.pick([5, 7, 9, 11, 13]); if (b % m === 0) return null; const e = k.ri(20, 200); let r = 1; for (let i = 0; i < e; i++) r = (r * b) % m;
    return { prompt: `Remainder when ${b}^${e} is divided by ${m}?`, ans: r, opts: [r, ...k.shuffle([...Array(m).keys()].filter((v) => v !== r)).slice(0, 3)], why: (() => { const cyc = []; let v = b % m; do { cyc.push(v); v = (v * b) % m; } while (v !== b % m && cyc.length < m + 1); const c = cyc.length; const pos = ((e - 1) % c) + 1; return `${b}¹, ${b}², … mod ${m}: ${cyc.join(', ')} (cycle of ${c}). ${e} = ${c} × ${Math.floor((e - 1) / c)} + ${pos} → position ${pos} → ${r}`; })(), steps: `Write out ${b}¹, ${b}², ${b}³ … mod ${m} until it returns to 1, then use ${e} mod (cycle length).`, p: [b, e, m] };
  } }),
  Q({ id: 'q.num.div', sub: 'Divisibility', lv: [2, 3], time: 20, gen(k) {
    const d = k.pick([3, 4, 6, 8, 9, 11, 12]); const ok = d * k.ri(1000, 9999); const bad = []; while (bad.length < 3) { const v = k.ri(10000, 99999); if (v % d && !bad.includes(v)) bad.push(v); }
    const ds = String(ok).split('').map(Number); const sum = ds.reduce((a, b) => a + b, 0);
    const odd = ds.filter((_, i) => i % 2 === 0); const even = ds.filter((_, i) => i % 2 === 1);
    const last = (n) => String(ok).slice(-n);
    const why = {
      3: `${k.fmtIN(ok)}: digit sum ${ds.join(' + ')} = ${sum}, divisible by 3`,
      9: `${k.fmtIN(ok)}: digit sum ${ds.join(' + ')} = ${sum}, divisible by 9`,
      4: `${k.fmtIN(ok)}: last two digits ${last(2)} are divisible by 4`,
      8: `${k.fmtIN(ok)}: last three digits ${last(3)} are divisible by 8`,
      6: `${k.fmtIN(ok)} is even and its digit sum ${sum} is divisible by 3`,
      12: `${k.fmtIN(ok)}: last two digits ${last(2)} divisible by 4 and digit sum ${sum} divisible by 3`,
      11: `${k.fmtIN(ok)}: (${odd.join(' + ')}) − (${even.join(' + ')}) = ${odd.reduce((a, b) => a + b, 0) - even.reduce((a, b) => a + b, 0)}, divisible by 11`,
    }[d];
    return { prompt: `Which number is divisible by ${d}?`, ans: ok, opts: [ok, ...bad], why, p: [d, ok, ...bad] };
  } }),
  Q({ id: 'q.num.hcf', sub: 'HCF & LCM', lv: [1, 2], time: 18, gen(k, L) {
    const g = k.ri(2, 24); let a = k.ri(2, 12), b = k.ri(2, 12); if (k.gcd(a, b) !== 1 || a === b) return null; const A = g * a, B = g * b; const hcf = k.chance(0.5);
    const ans = hcf ? g : (A * B) / g;
    return { prompt: `${hcf ? 'HCF' : 'LCM'} of ${A} and ${B}?`, ans, wrong: hcf ? [g * 2, Math.min(a, b), g + 1, A - B > 0 ? A - B : B - A].filter((v) => v !== g) : [A * B, ans / 2, ans + A], step: hcf ? 1 : g, why: `${A} = ${g} × ${a}, ${B} = ${g} × ${b} → ${hcf ? `HCF = ${g}` : `LCM = ${g} × ${a} × ${b} = ${k.fmtIN(ans)}`}`, p: [A, B, hcf] };
  } }),
  Q({ id: 'q.num.bells', sub: 'HCF & LCM', lv: [2, 3], time: 25, gen(k) {
    const xs = k.pickN([4, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30], 3).sort((a, b) => a - b); const L = xs.reduce((a, b) => k.lcm(a, b)); if (L > 360) return null;
    return { prompt: `Three bells ring every ${xs.join(', ')} minutes. They ring together now. Minutes until they next ring together?`, ans: L, post: ' min', wrong: [xs[0] * xs[1] * xs[2], L / 2, xs[2] * 2, L + xs[0]].filter(Number.isInteger), step: xs[0], why: `LCM(${xs.join(', ')}) = ${L}`, p: xs };
  } }),
  Q({ id: 'q.num.factors', sub: 'Factors', lv: [3, 4], deep: true, time: 40, gen(k) {
    const ps = k.pickN(PRIMES.slice(0, 4), k.pick([2, 3])).sort((a, b) => a - b); const es = ps.map(() => k.ri(1, 4)); const N = ps.reduce((a, p, i) => a * p ** es[i], 1); if (N > 50000) return null; const ans = es.reduce((a, e) => a * (e + 1), 1);
    return { prompt: `How many factors (divisors) does ${k.fmtIN(N)} have?`, ans, wrong: [es.reduce((a, e) => a + e + 1, 0), ans - 2, ans + 2, es.reduce((a, e) => a * e, 1)].filter((v) => v > 0), step: 2, why: `${k.fmtIN(N)} = ${ps.map((p, i) => `${p}^${es[i]}`).join(' × ')} → ${es.map((e) => `(${e} + 1)`).join(' × ')} = ${ans}`, steps: 'Write N as a product of prime powers; the number of factors is the product of (each power + 1).', p: [N] };
  } }),
  Q({ id: 'q.num.zeros', sub: 'Number System', lv: [3, 3], time: 30, gen(k) {
    const n = k.ri(25, 600); let z = 0; for (let p = 5; p <= n; p *= 5) z += Math.floor(n / p);
    return { prompt: `How many zeros are at the end of ${n}! ?`, ans: z, wrong: [Math.floor(n / 5), Math.floor(n / 10), z + 1, z - 1].filter((v) => v !== z && v >= 0), why: `${[5, 25, 125, 625].filter((p) => p <= n).map((p) => `⌊${n}/${p}⌋`).join(' + ')} = ${[5, 25, 125, 625].filter((p) => p <= n).map((p) => Math.floor(n / p)).join(' + ')} = ${z}`, steps: 'Each trailing zero needs a 5×2 pair; count the factors of 5.', p: [n] };
  } }),
  Q({ id: 'q.num.sumn', sub: 'Sequences & Series', lv: [2, 2], time: 18, gen(k) {
    const t = k.pick(['nat', 'odd', 'even']); const n = k.ri(10, 60);
    const ans = t === 'nat' ? (n * (n + 1)) / 2 : t === 'odd' ? n * n : n * (n + 1);
    return { prompt: `Sum of the first ${n} ${t === 'nat' ? 'natural numbers' : t === 'odd' ? 'odd numbers' : 'even numbers'}?`, ans, wrong: [n * n, (n * (n + 1)) / 2, n * (n + 1), ans + n].filter((v) => v !== ans), step: n, why: t === 'nat' ? `n(n + 1)/2 = ${n} × ${n + 1} ÷ 2 = ${k.fmtIN(ans)}` : t === 'odd' ? `First n odd numbers add to n²: ${n}² = ${k.fmtIN(ans)}` : `First n even numbers add to n(n + 1): ${n} × ${n + 1} = ${k.fmtIN(ans)}`, p: [t, n] };
  } }),

  // ---------------- Algebra ----------------
  Q({ id: 'q.alg.lin', sub: 'Linear Equations', lv: [1, 2], time: 15, gen(k, L) {
    const x = k.ri(-9, 20); const a = k.ri(2, 9); const b = k.ri(-30, 30); const c = a * x + b; if (x === 0) return null;
    return { prompt: 'Solve for x', emph: `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${c}`, ans: x, wrong: [(c + b) / a, x + 1, -x, x - 1].filter(Number.isInteger), why: `${a}x = ${c - b} → x = ${x}`, p: [a, b, x] };
  } }),
  Q({ id: 'q.alg.sys', sub: 'Linear Equations', lv: [2, 3], time: 25, gen(k) {
    const x = k.ri(2, 30), y = k.ri(1, 25); if (x === y) return null; const t = k.pick(['x', 'xy', 'x2']);
    const ans = t === 'x' ? x : t === 'xy' ? x * y : x * x - y * y;
    return { prompt: `x + y = ${x + y} and x − y = ${k.sn(x - y)}. Find ${t === 'x' ? 'x' : t === 'xy' ? 'xy' : 'x² − y²'}.`, ans, wrong: [y, x + y, ans + x, Math.abs(ans - y)].filter((v) => v !== ans), step: Math.max(1, Math.round(ans / 10)), why: t === 'x2' ? `x² − y² = (x + y)(x − y) = ${x + y} × ${k.sn(x - y)} = ${k.sn(ans)}` : `Add the equations: 2x = ${2 * x} → x = ${x}, y = ${y}${t === 'xy' ? ` → xy = ${x * y}` : ''}`, steps: t === 'x2' ? `Shortcut: no need to find x and y. (x + y)(x − y) = x² − y².` : `x = (sum + difference) ÷ 2 = (${x + y} + ${k.sn(x - y)}) ÷ 2 = ${x}; y = ${x + y} − ${x} = ${y}.`, p: [x, y, t] };
  } }),
  Q({ id: 'q.alg.quad', sub: 'Quadratic Equations', lv: [2, 4], time: 35, gen(k, L) {
    const r1 = k.ri(-9, 12), r2 = k.ri(-9, 12); if (r1 === r2 || !r1 || !r2) return null; const S = r1 + r2, P = r1 * r2; const t = L === 2 ? 'big' : k.pick(['sq', 'big', 'sum']);
    const ans = t === 'big' ? Math.max(r1, r2) : t === 'sum' ? S : r1 * r1 + r2 * r2;
    const eq = `x² ${S > 0 ? '−' : '+'} ${Math.abs(S)}x ${P < 0 ? '−' : '+'} ${Math.abs(P)} = 0`.replace(' 1x', ' x').replace('+ 0x ', '');
    return { prompt: t === 'big' ? 'Larger root of' : t === 'sum' ? 'Sum of the roots of' : 'Sum of the squares of the roots of', emph: eq, ans, wrong: t === 'big' ? [Math.min(r1, r2), -Math.max(r1, r2), S].filter((v) => v !== ans) : t === 'sum' ? [-S, P, S + 1] : [S * S, S * S + 2 * P, ans + 2], step: 2, why: t === 'sum' ? `Sum of roots = −(coefficient of x) = ${k.sn(S)} (roots ${k.sn(r1)} and ${k.sn(r2)})` : t === 'big' ? `Factorise: roots ${k.sn(r1)} and ${k.sn(r2)} → larger is ${k.sn(Math.max(r1, r2))}` : `${k.pn(r1)}² + ${k.pn(r2)}² = ${r1 * r1} + ${r2 * r2} = ${ans}`, steps: `Find two numbers with sum ${k.sn(S)} and product ${k.sn(P)}: ${k.sn(r1)} and ${k.sn(r2)}.${t === 'sq' ? ` Shortcut: r₁² + r₂² = (sum)² − 2 × product = ${S * S} − ${k.pn(2 * P)} = ${ans}.` : ''}`, p: [r1 < r2 ? r1 : r2, r1 < r2 ? r2 : r1, t] };
  } }),
  Q({ id: 'q.alg.ineq', sub: 'Inequalities', lv: [2, 3], time: 22, gen(k) {
    const a = k.ri(2, 9); const b = k.ri(-20, 20); const c = k.ri(-10, 60); const x = Math.floor((c - b) / a) + 1;
    return { prompt: 'Smallest integer x such that', emph: `${a}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} > ${c}`, ans: x, wrong: [x - 1, x + 1, Math.ceil((c + b) / a)].filter((v) => v !== x), why: `${a}x > ${c - b} → x > ${((c - b) / a).toFixed(2).replace(/\.?0+$/, '')} → smallest integer is ${x}`, p: [a, b, c] };
  } }),
  Q({ id: 'q.alg.func', sub: 'Functions', lv: [2, 3], time: 25, gen(k, L) {
    const a = k.ri(1, 5), b = k.ri(-9, 9), c = k.ri(2, 6), d = k.ri(-5, 9); const f = (x) => a * x * x + b; const g = (x) => c * x + d; const v = k.ri(-3, 4);
    if (L === 2) return { prompt: `f(x) = ${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}. Find f(${k.sn(v)}).`, ans: f(v), wrong: [a * v * 2 + b, f(v) + 2 * b, f(-v) + 1, a * v + b], step: 3, why: `${a === 1 ? '' : `${a} × `}${k.pn(v)}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${a * v * v} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${k.sn(f(v))}`, p: [a, b, v] };
    return { prompt: `f(x) = ${a === 1 ? '' : a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)} and g(x) = ${c}x ${d < 0 ? '−' : '+'} ${Math.abs(d)}. Find f(g(${k.sn(v)})).`, ans: f(g(v)), wrong: [g(f(v)), f(v) + g(v), f(g(v)) + a], step: 5, why: `g(${k.sn(v)}) = ${c} × ${k.pn(v)} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${k.sn(g(v))}; f(${k.sn(g(v))}) = ${a === 1 ? '' : `${a} × `}${k.pn(g(v))}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${k.sn(f(g(v)))}`, p: [a, b, c, d, v] };
  } }),
  Q({ id: 'q.log', sub: 'Logarithms', lv: [2, 3], time: 22, gen(k, L) {
    const SUB = { 2: '₂', 3: '₃', 5: '₅', 10: '₁₀' };
    const b = k.pick([2, 3, 5, 10]); const e1 = k.ri(1, b === 2 ? 8 : 4);
    if (L === 2) return { prompt: 'Evaluate', emph: `log${SUB[b]}(${k.fmtIN(b ** e1)})`, ans: e1, wrong: [e1 + 1, e1 - 1, e1 * 2, e1 + 2].filter((v) => v > 0 && v !== e1), why: `${k.fmtIN(b ** e1)} = ${b}^${e1}, so log${SUB[b]}(${k.fmtIN(b ** e1)}) = ${e1}`, p: [b, e1] };
    const c = k.pick([2, 3]); const e2 = k.ri(1, 4); const ans = e1 + e2;
    return { prompt: 'Evaluate', emph: `log${SUB[b]}(${k.fmtIN(b ** e1)}) + log${SUB[c]}(${c ** e2})`, ans, wrong: [e1 * e2, ans + 1, ans - 1], why: `${k.fmtIN(b ** e1)} = ${b}^${e1} and ${c ** e2} = ${c}^${e2} → ${e1} + ${e2} = ${ans}`, p: [b, e1, c, e2] };
  } }),

  // ---------------- AP / GP ----------------
  Q({ id: 'q.ap.nth', sub: 'AP & GP', lv: [1, 2], time: 18, gen(k) {
    const a = k.ri(-10, 30), d = k.ri(2, 12) * (k.chance(0.2) ? -1 : 1), n = k.ri(8, 60);
    return { prompt: `${k.ord(n)} term of the AP: ${a}, ${a + d}, ${a + 2 * d}, …?`, ans: a + (n - 1) * d, wrong: [a + n * d, a + (n - 2) * d, n * d], step: Math.abs(d), why: `a + (n − 1)d = ${k.sn(a)} + ${n - 1} × ${k.pn(d)} = ${k.sn(a + (n - 1) * d)}`, p: [a, d, n] };
  } }),
  Q({ id: 'q.ap.sum', sub: 'AP & GP', lv: [2, 3], time: 30, gen(k) {
    const a = k.ri(1, 20), d = k.ri(1, 9), n = k.ri(6, 30); const S = (n * (2 * a + (n - 1) * d)) / 2;
    return { prompt: `Sum of the first ${n} terms of ${a}, ${a + d}, ${a + 2 * d}, …?`, ans: S, wrong: [n * (a + (n - 1) * d), S + a, (n * (2 * a + n * d)) / 2].filter(Number.isInteger), step: n, why: `${n}/2 × (2 × ${a} + ${n - 1} × ${d}) = ${n}/2 × ${2 * a + (n - 1) * d} = ${k.fmtIN(S)}`, p: [a, d, n] };
  } }),
  Q({ id: 'q.gp', sub: 'AP & GP', lv: [2, 3], time: 22, gen(k) {
    const a = k.ri(1, 6), r = k.pick([2, 3]), n = k.ri(5, r === 2 ? 11 : 7);
    return { prompt: `${k.ord(n)} term of the GP: ${a}, ${a * r}, ${a * r * r}, …?`, ans: a * r ** (n - 1), wrong: [a * r ** n, a * r ** (n - 2), a * r * (n - 1)], step: a, why: `a × r^(n−1) = ${a === 1 ? '' : `${a} × `}${r}^${n - 1} = ${k.fmtIN(a * r ** (n - 1))}`, p: [a, r, n] };
  } }),

  // ---------------- Geometry & mensuration ----------------
  Q({ id: 'q.geo.ang', sub: 'Geometry', lv: [1, 2], time: 15, gen(k, L) {
    if (L === 2 && k.chance(0.5)) { const n = k.pick([5, 6, 8, 9, 10, 12]); const each = 180 - 360 / n; const name = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' }[n]; return { prompt: `Each interior angle of a regular ${name}?`, ans: each, post: '°', wrong: [360 / n, (n - 2) * 180, each - 10, each + 15], step: 10, why: `180 − 360/${n} = ${each}°`, p: ['poly', n] }; }
    const a = k.ri(25, 100), b = k.ri(20, 150 - a); return { prompt: `Two angles of a triangle are ${a}° and ${b}°. The third angle?`, ans: 180 - a - b, post: '°', wrong: [360 - a - b, 90 - Math.abs(a - b) > 0 ? 90 - Math.abs(a - b) : 45, 180 - a - b + 10], step: 5, why: `180 − ${a} − ${b} = ${180 - a - b}°`, p: ['tri', a, b] };
  } }),
  Q({ id: 'q.geo.pyth', sub: 'Geometry', lv: [1, 3], time: 18, gen(k) {
    const [a, b, c] = k.pick(TRIPLES); const m = k.pick([1, 1, 2, 3]); const askHyp = k.chance(0.6);
    if (askHyp) return { prompt: `A right triangle has legs ${a * m} and ${b * m}. Hypotenuse?`, ans: c * m, wrong: [(a + b) * m, c * m + 1, c * m - 2], step: m, why: `√(${a * m}² + ${b * m}²) = √(${(a * m) ** 2} + ${(b * m) ** 2}) = √${(c * m) ** 2} = ${c * m}`, p: [a, b, m, 1] };
    return { prompt: `A ${c * m} m ladder leans on a wall with its foot ${a * m} m from the wall. How high does it reach?`, ans: b * m, post: ' m', wrong: [c * m - a * m, b * m + 1, c * m], step: m, why: `√(${c * m}² − ${a * m}²) = √(${(c * m) ** 2} − ${(a * m) ** 2}) = √${(b * m) ** 2} = ${b * m} m`, p: [a, b, m, 0] };
  } }),
  Q({ id: 'q.mens.rect', sub: 'Mensuration', lv: [1, 2], time: 18, gen(k, L) {
    const l = k.ri(4, 40), w = k.ri(3, l); if (L === 1) { const area = k.chance(0.5); return { prompt: `A rectangle is ${l} m by ${w} m. ${area ? 'Area' : 'Perimeter'}?`, ans: area ? l * w : 2 * (l + w), post: area ? ' m²' : ' m', wrong: area ? [2 * (l + w), l * w + l, (l + w) * 2 + 4] : [l * w, l + w, 2 * l + w], step: 2, why: area ? `${l} × ${w} = ${l * w} m²` : `2 × (${l} + ${w}) = ${2 * (l + w)} m`, p: [l, w, area] }; }
    return { prompt: `A rectangle has perimeter ${2 * (l + w)} m and length ${l} m. Its area?`, ans: l * w, post: ' m²', wrong: [(l + w) * l, l * (2 * (l + w) - l), l * w + w], step: l, why: `Length + width = ${2 * (l + w)} ÷ 2 = ${l + w}, so width = ${w}; area = ${l} × ${w} = ${l * w} m²`, p: [l, w] };
  } }),
  Q({ id: 'q.mens.circle', sub: 'Mensuration', lv: [2, 3], time: 22, gen(k) {
    const r = 7 * k.ri(1, 6); const area = k.chance(0.5); const ans = area ? (22 / 7) * r * r : 2 * (22 / 7) * r;
    return { prompt: `A circle has radius ${r} cm. Its ${area ? 'area' : 'circumference'}? (π = 22/7)`, ans, post: area ? ' cm²' : ' cm', wrong: area ? [2 * (22 / 7) * r, (22 / 7) * r * r * 2, ans + 22] : [(22 / 7) * r * r, (22 / 7) * r, ans + 22], step: 22, why: area ? `22/7 × ${r} × ${r} = ${k.fmtIN(ans)} cm²` : `2 × 22/7 × ${r} = ${k.fmtIN(ans)} cm`, p: [r, area] };
  } }),
  Q({ id: 'q.mens.solid', sub: 'Mensuration', lv: [2, 3], time: 28, gen(k, L) {
    const t = k.pick(L === 2 ? ['cubeV', 'cuboidV', 'cubeS'] : ['cuboidS', 'cylV', 'cubeS']);
    if (t === 'cubeV') { const a = k.ri(3, 15); return { prompt: `Volume of a cube with side ${a} cm?`, ans: a ** 3, post: ' cm³', wrong: [6 * a * a, a * a, a ** 3 + a], step: a, why: `${a} × ${a} × ${a} = ${k.fmtIN(a ** 3)} cm³`, p: [t, a] }; }
    if (t === 'cubeS') { const a = k.ri(3, 20); return { prompt: `Total surface area of a cube with side ${a} cm?`, ans: 6 * a * a, post: ' cm²', wrong: [4 * a * a, a ** 3, 6 * a], step: a, why: `6 faces × ${a}² = 6 × ${a * a} = ${k.fmtIN(6 * a * a)} cm²`, p: [t, a] }; }
    const l = k.ri(4, 20), b = k.ri(3, 15), h = k.ri(2, 12);
    if (t === 'cuboidV') return { prompt: `Volume of a ${l} × ${b} × ${h} cm box?`, ans: l * b * h, post: ' cm³', wrong: [2 * (l * b + b * h + h * l), l * b + h, l * b * h + l], step: l, why: `${l} × ${b} × ${h} = ${k.fmtIN(l * b * h)} cm³`, p: [t, l, b, h] };
    if (t === 'cuboidS') return { prompt: `Total surface area of a ${l} × ${b} × ${h} cm box?`, ans: 2 * (l * b + b * h + h * l), post: ' cm²', wrong: [l * b * h, l * b + b * h + h * l, 2 * (l * b + b * h)], step: 2 * l, why: `2(${l * b} + ${b * h} + ${h * l}) = ${k.fmtIN(2 * (l * b + b * h + h * l))} cm²`, steps: '2(lb + bh + hl): each pair of opposite faces counted twice.', p: [t, l, b, h] };
    const r = 7 * k.ri(1, 3); return { prompt: `Volume of a cylinder with radius ${r} cm and height ${h} cm? (π = 22/7)`, ans: (22 / 7) * r * r * h, post: ' cm³', wrong: [2 * (22 / 7) * r * h, (22 / 7) * r * h * 2 * r + 22, (22 / 7) * r * r], step: 22 * h, why: `πr²h = 22/7 × ${r}² × ${h} = ${k.fmtIN((22 / 7) * r * r * h)} cm³`, p: [t, r, h] };
  } }),
  Q({ id: 'q.coord', sub: 'Coordinate Geometry', lv: [2, 3], time: 25, gen(k, L) {
    const x1 = k.ri(-6, 6), y1 = k.ri(-6, 6); const t = L === 2 ? k.pick(['mid', 'dist']) : k.pick(['dist', 'slope']);
    if (t === 'dist') { const [a, b, c] = k.pick(TRIPLES.slice(0, 6)); const x2 = x1 + (k.chance(0.5) ? a : -a), y2 = y1 + (k.chance(0.5) ? b : -b); return { prompt: `Distance between (${x1}, ${y1}) and (${x2}, ${y2})?`, ans: c, wrong: [a + b, c + 1, Math.abs(x2 + y2 - x1 - y1) || c + 2], why: `Δx = ${a}, Δy = ${b} → √(${a}² + ${b}²) = √${c * c} = ${c}`, p: [t, x1, y1, x2, y2] }; }
    if (t === 'mid') { const x2 = x1 + 2 * k.ri(1, 6), y2 = y1 + 2 * k.ri(-5, 5); const ans = `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`; return { prompt: `Midpoint of (${x1}, ${y1}) and (${x2}, ${y2})?`, ans, wrong: [`(${x2 - x1}, ${y2 - y1})`, `(${(x1 + x2) / 2}, ${(y1 - y2) / 2})`, `(${x1 + x2}, ${y1 + y2})`, `(${(y1 + y2) / 2}, ${(x1 + x2) / 2})`, `(${(x1 + x2) / 2 + 1}, ${(y1 + y2) / 2})`, `(${(x1 + x2) / 2}, ${(y1 + y2) / 2 - 1})`].filter((v) => v !== ans), why: `((${k.sn(x1)} + ${k.pn(x2)}) ÷ 2, (${k.sn(y1)} + ${k.pn(y2)}) ÷ 2) = ${ans}`, p: [t, x1, y1, x2, y2] }; }
    const dx = k.ri(1, 6), m = k.ri(-4, 4); if (!m) return null; const x2 = x1 + dx, y2 = y1 + m * dx; return { prompt: `Slope of the line through (${k.sn(x1)}, ${k.sn(y1)}) and (${k.sn(x2)}, ${k.sn(y2)})?`, ans: m, wrong: [-m, m + 1, dx, 1 / m].filter(Number.isInteger), why: `rise ${k.sn(y2 - y1)} ÷ run ${dx} = ${k.sn(m)}`, p: [t, x1, y1, dx, m] };
  } }),

  // ---------------- P&C, probability, sets, stats ----------------
  Q({ id: 'q.pnc.arr', sub: 'Permutations & Combinations', lv: [2, 3], time: 25, gen(k, L) {
    const words = L === 2 ? ['MANGO', 'TIGER', 'PLANT', 'CHAIR', 'BRICK', 'NIGHT', 'STORM', 'CRANE', 'DELHI', 'QUEST'] : ['APPLE', 'BANANA', 'LETTER', 'COFFEE', 'PEPPER', 'TATTOO', 'BALLOON', 'SUCCESS', 'GOOGLE', 'COOKIE', 'KITTEN', 'RABBIT'];
    const w = k.pick(words); const cnt = {}; [...w].forEach((c) => { cnt[c] = (cnt[c] || 0) + 1; }); const ans = Object.values(cnt).reduce((a, v) => a / k.fact(v), k.fact(w.length));
    return { prompt: `In how many ways can the letters of ${w} be arranged?`, ans, wrong: [k.fact(w.length), ans * 2, ans / 2, k.fact(w.length - 1)].filter((v) => Number.isInteger(v) && v !== ans), step: 10, why: `${w.length}!${Object.values(cnt).filter((v) => v > 1).map((v) => ` ÷ ${v}!`).join('')} = ${k.fmtIN(ans)}`, p: [w] };
  } }),
  Q({ id: 'q.pnc.comm', sub: 'Permutations & Combinations', lv: [2, 4], time: 35, deep: true, gen(k, L) {
    if (L === 2) { const n = k.ri(5, 12), r = k.ri(2, 4); return { prompt: `In how many ways can ${r} people be chosen from ${n}?`, ans: k.nCr(n, r), wrong: [k.nCr(n, r) * k.fact(r), n * r, k.nCr(n, r - 1)].filter((v) => v !== k.nCr(n, r)), step: 5, why: `${n}C${r} = ${Array.from({ length: r }, (_, i) => n - i).join(' × ')} ÷ ${r}! = ${k.nCr(n, r)}`, p: [n, r] }; }
    const m = k.ri(4, 8), w = k.ri(3, 7), a = k.ri(1, 3), b = k.ri(1, 3); const ans = k.nCr(m, a) * k.nCr(w, b);
    return { prompt: `A committee of ${a} men and ${b} women is formed from ${m} men and ${w} women. How many ways?`, ans, wrong: [k.nCr(m + w, a + b), k.nCr(m, a) + k.nCr(w, b), ans * 2], step: 10, why: `${m}C${a} × ${w}C${b} = ${k.nCr(m, a)} × ${k.nCr(w, b)} = ${ans}`, steps: 'Choose men and women independently, then multiply (AND → ×).', p: [m, w, a, b] };
  } }),
  Q({ id: 'q.prob.dice', sub: 'Probability', lv: [2, 3], time: 30, gen(k) {
    const t = k.pick(['sum', 'sumgt', 'double']); let fav = 0; let s = k.ri(3, 11);
    for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) { if (t === 'sum' && i + j === s) fav++; if (t === 'sumgt' && i + j > s) fav++; if (t === 'double' && i === j) fav++; }
    const ans = k.frac(fav, 36); const wrongs = [k.frac(fav, 12), k.frac(Math.max(1, fav - 1), 36), k.frac(fav + 1, 36), k.frac(36 - fav, 36), k.frac(fav, 6)].filter((v) => v !== ans);
    return { prompt: t === 'double' ? 'Two dice are rolled. Probability of a double?' : `Two dice are rolled. Probability the sum is ${t === 'sum' ? `exactly ${s}` : `greater than ${s}`}?`, ans, wrong: wrongs, why: `${fav} favourable out of 36 = ${fav}/36${ans !== `${fav}/36` ? ` = ${ans}` : ''}`, p: [t, t === 'double' ? 0 : s] };
  } }),
  Q({ id: 'q.prob.balls', sub: 'Probability', lv: [3, 4], deep: true, time: 45, gen(k) {
    const r = k.ri(2, 7), b = k.ri(2, 7), g = k.ri(0, 4); const n = r + b + g; const t = k.pick(['both', 'diff']); const cols = g ? `${r} red, ${b} blue and ${g} green` : `${r} red and ${b} blue`;
    const fav = t === 'both' ? k.nCr(r, 2) : r * b; const ans = k.frac(fav, k.nCr(n, 2));
    return { prompt: `A bag has ${cols} balls. Two are drawn at random. Probability that ${t === 'both' ? 'both are red' : 'one is red and one is blue'}?`, ans, wrong: [k.frac(r * r, n * n), k.frac(r, n), k.frac(fav, n * (n - 1)), k.frac(fav + 1, k.nCr(n, 2))].filter((v) => v !== ans), why: `${fav} favourable ÷ ${n}C2 (${k.nCr(n, 2)}) = ${ans}`, steps: `Total pairs = ${n}C2 = ${k.nCr(n, 2)}. Favourable = ${t === 'both' ? `${r}C2 = ${fav}` : `${r} × ${b} = ${fav}`}.`, p: [r, b, g, t] };
  } }),
  Q({ id: 'q.prob.coins', sub: 'Probability', lv: [2, 3], time: 25, gen(k) {
    const n = k.pick([2, 3, 4]); const atl = k.ri(1, n); let fav = 0; for (let x = atl; x <= n; x++) fav += k.nCr(n, x); const tot = 2 ** n; const ans = k.frac(fav, tot);
    return { prompt: `${n} coins are tossed. Probability of at least ${atl} head${atl > 1 ? 's' : ''}?`, ans, wrong: [k.frac(k.nCr(n, atl), tot), k.frac(tot - fav || 1, tot), k.frac(atl, n), k.frac(fav, tot * 2)].filter((v) => v !== ans), why: `${tot} outcomes; ${atl}+ heads in ${Array.from({ length: n - atl + 1 }, (_, i) => `${n}C${atl + i}`).join(' + ')} = ${fav} → ${fav}/${tot}${ans !== `${fav}/${tot}` ? ` = ${ans}` : ''}`, p: [n, atl] };
  } }),
  Q({ id: 'q.sets', sub: 'Set Theory', lv: [2, 3], time: 30, gen(k) {
    const both = k.ri(3, 30), onlyA = k.ri(5, 40), onlyB = k.ri(5, 40), none = k.ri(0, 25); const tot = both + onlyA + onlyB + none; const [A, B] = k.pick([['tea', 'coffee'], ['cricket', 'football'], ['Hindi', 'English'], ['Instagram', 'YouTube']]);
    const t = k.pick(['onlyA', 'none', 'either']); const ans = t === 'onlyA' ? onlyA : t === 'none' ? none : onlyA + onlyB + both; if (t === 'none' && !none) return null;
    const given = t === 'none' ? `${onlyA + both} like ${A}, ${onlyB + both} like ${B} and ${both} like both` : `${onlyA + both} like ${A}, ${onlyB + both} like ${B} and ${both} like both`;
    return { prompt: `Of ${tot} people, ${given}. How many like ${t === 'onlyA' ? `only ${A}` : t === 'none' ? 'neither' : `${A} or ${B}`}?`, ans, wrong: [onlyA + both, tot - onlyA - onlyB, onlyA + onlyB + 2 * both, ans + both].filter((v) => v !== ans && v >= 0), step: 2, why: t === 'onlyA' ? `${onlyA + both} − ${both} = ${onlyA}` : t === 'none' ? `${tot} − (${onlyA + both} + ${onlyB + both} − ${both}) = ${none}` : `${onlyA + both} + ${onlyB + both} − ${both} = ${onlyA + onlyB + both}`, p: [onlyA, onlyB, both, none, t] };
  } }),
  Q({ id: 'q.stats', sub: 'Basic Statistics', lv: [1, 2], time: 18, gen(k, L) {
    const n = L === 1 ? 5 : 6; const xs = Array.from({ length: n }, () => k.ri(1, 40)); const sorted = [...xs].sort((a, b) => a - b); const t = k.pick(['median', 'range', 'mode']);
    if (t === 'mode') { const m = xs[0]; xs[2] = m; xs[4] = m; if (new Set(xs).size < n - 2) return null; const s2 = [...xs].sort((a, b) => a - b); return { prompt: 'Mode of', emph: xs.join(', '), ans: m, opts: [m, ...k.shuffle([...new Set(xs)].filter((v) => v !== m)).slice(0, 3)], why: `${m} appears most often`, p: [t, ...xs], _: s2 }; }
    if (t === 'range') return { prompt: 'Range of', emph: xs.join(', '), ans: sorted[n - 1] - sorted[0], wrong: [sorted[n - 1], sorted[n - 1] + sorted[0], sorted[n - 2] - sorted[0]], why: `max − min = ${sorted[n - 1]} − ${sorted[0]} = ${sorted[n - 1] - sorted[0]}`, p: [t, ...xs] };
    const med = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2; return { prompt: 'Median of', emph: xs.join(', '), ans: med, wrong: [xs[(n - 1) >> 1], Math.round(xs.reduce((a, b) => a + b, 0) / n), sorted[n >> 1] + 1], why: `Sorted: ${sorted.join(', ')} → ${n % 2 ? `middle value ${med}` : `(${sorted[n / 2 - 1]} + ${sorted[n / 2]}) ÷ 2 = ${med}`}`, p: [t, ...xs] };
  } }),
  // ---------------- Bank & SSC favourites ----------------
  Q({ id: 'q.simplify', sub: 'Simplification', lv: [1, 3], time: 18, gen(k, L) {
    const t = k.pick(L === 1 ? ['bodmas'] : L === 2 ? ['bodmas', 'pctfrac'] : ['pctfrac', 'bodmas2']);
    if (t === 'bodmas') {
      const a = k.ri(10, 60), b = k.ri(2, 9), c = k.ri(2, 9), d = k.ri(2, 9), e = d * k.ri(2, 12); const ans = a + b * c - e / d; if (ans <= 0) return null;
      return { prompt: 'Simplify', emph: `${a} + ${b} × ${c} − ${e} ÷ ${d}`, ans, wrong: [((a + b) * c - e) / d, (a + b) * c - e / d, a + b * c - e + d, ans + d].filter(Number.isInteger), step: 2, why: `× and ÷ first: ${b} × ${c} = ${b * c}, ${e} ÷ ${d} = ${e / d} → ${a} + ${b * c} − ${e / d} = ${ans}`, steps: 'BODMAS: Brackets, Of, then ÷ and × from left to right, then + and −. Working left to right without the rule is the trap.', p: [t, a, b, c, d, e] };
    }
    if (t === 'bodmas2') {
      const a = k.ri(2, 9), b = k.ri(2, 9), c = k.ri(3, 15), d = k.ri(2, 6); const ans = (a + b) ** 2 - c * d; if (ans <= 0) return null;
      return { prompt: 'Simplify', emph: `(${a} + ${b})² − ${c} × ${d}`, ans, wrong: [a * a + b * b - c * d, ((a + b) ** 2 - c) * d, (a + b) * 2 - c * d, ans + d].filter((v) => v > 0), step: 3, why: `Brackets first: (${a + b})² = ${(a + b) ** 2}; then ${c} × ${d} = ${c * d} → ${(a + b) ** 2} − ${c * d} = ${ans}`, p: [t, a, b, c, d] };
    }
    const F = [[12.5, 1, 8], [25, 1, 4], [37.5, 3, 8], [62.5, 5, 8], [75, 3, 4], [20, 1, 5], [40, 2, 5], [60, 3, 5]];
    const [pp, n1, d1] = k.pick(F); const X = d1 * k.ri(4, 40); const n2 = k.ri(1, 4), d2 = k.pick([3, 5, 6, 7, 9].filter((x) => x > n2 && k.gcd(n2, x) === 1)); const Y = d2 * k.ri(3, 30);
    const A = (X * n1) / d1, B = (Y * n2) / d2; const ans = A + B;
    return { prompt: 'Simplify', emph: `${pp}% of ${X} + ${n2}/${d2} of ${Y}`, ans, wrong: [A + Y / d2, (pp * X) / 10 + B, ans + n2, A * B > 0 && A * B < 10000 ? A + B * 2 : ans - n2].filter((v) => Number.isInteger(v) && v > 0), step: Math.max(2, Math.round(ans / 15)), why: `${pp}% = ${n1}/${d1} → ${X} × ${n1}/${d1} = ${A}; ${Y} × ${n2}/${d2} = ${B}; ${A} + ${B} = ${ans}`, p: [t, pp, X, n2, d2, Y] };
  } }),
  Q({ id: 'q.pct.frac', sub: 'Percentages', lv: [1, 3], time: 12, gen(k, L) {
    const F = L === 1 ? [['12.5%', 1, 8], ['25%', 1, 4], ['20%', 1, 5], ['50%', 1, 2]] : [['12.5%', 1, 8], ['37.5%', 3, 8], ['62.5%', 5, 8], ['87.5%', 7, 8], ['16⅔%', 1, 6], ['33⅓%', 1, 3], ['66⅔%', 2, 3], ['83⅓%', 5, 6], ['11⅑%', 1, 9], ['14²⁄₇%', 1, 7]];
    const [disp, n, d] = k.pick(F); const X = d * k.ri(L === 1 ? 4 : 6, L >= 3 ? 150 : 60); const ans = (X * n) / d;
    return { prompt: 'Quick! What is', emph: `${disp} of ${k.fmtIN(X)}`, ans, wrong: [ans + X / d, ans - X / d, Math.round(X * n / (d + 1)), ans * 2].filter((v) => v > 0 && Number.isInteger(v)), step: X / d, why: `${disp} = ${n}/${d} → ${k.fmtIN(X)} ÷ ${d}${n > 1 ? ` × ${n}` : ''} = ${k.fmtIN(ans)}`, p: [disp, X] };
  } }),
  Q({ id: 'q.roots', sub: 'Squares & Roots', lv: [1, 3], time: 15, gen(k, L) {
    if (L >= 3 && k.chance(0.5)) {
      const n = k.ri(11, 39); const N = n ** 3; const last = { 0: 0, 1: 1, 2: 8, 3: 7, 4: 4, 5: 5, 6: 6, 7: 3, 8: 2, 9: 9 }[N % 10]; const lead = Math.floor(N / 1000);
      return { prompt: 'Cube root of', emph: k.fmtIN(N), ans: n, wrong: [n + 1, n - 1, n + 10, n - 10].filter((v) => v > 0), step: 1, why: `Ends in ${N % 10} → root ends in ${last}; ${k.fmtIN(lead)} (thousands) lies between ${Math.floor(n / 10)}³ = ${Math.floor(n / 10) ** 3} and ${Math.floor(n / 10) + 1}³ = ${(Math.floor(n / 10) + 1) ** 3} → ${n}`, steps: 'Cube roots of perfect cubes: the last digit tells the last digit (2 and 8 swap, 3 and 7 swap, others stay the same), the thousands tell the tens digit.', p: ['cube', n] };
    }
    const n = k.ri(L === 1 ? 11 : 21, L === 1 ? 30 : 99); if (n % 10 === 0) return null; const N = n * n; const t = Math.floor(n / 10);
    const ends = { 1: [1, 9], 4: [2, 8], 9: [3, 7], 6: [4, 6], 5: [5], 0: [0] }[N % 10];
    const other = ends.find((e) => e !== n % 10);
    return { prompt: 'Square root of', emph: k.fmtIN(N), ans: n, wrong: [other != null ? t * 10 + other : n + 2, n + 1, n - 1, n + 10].filter((v) => v > 0 && v !== n), step: 1, why: ends.length === 1 ? `Ends in 5 → root ends in 5; ${k.fmtIN(N)} lies between ${t * 10}² and ${t + 1}0² → ${n}` : `Ends in ${N % 10} → root ends in ${ends.join(' or ')}; ${k.fmtIN(N)} lies between ${t * 10}² = ${k.fmtIN(t * t * 100)} and ${t + 1}0² = ${k.fmtIN((t + 1) * (t + 1) * 100)}, so ${t}${ends[0]} or ${t}${ends[1]}; ${t}5² = ${k.fmtIN((t * 10 + 5) ** 2)} is ${N > (t * 10 + 5) ** 2 ? 'smaller' : 'bigger'}, so ${n}`, steps: `Check: ${n} × ${n} = ${k.fmtIN(N)}.`, p: ['sq', n] };
  } }),
  Q({ id: 'q.indices', sub: 'Indices', lv: [2, 3], time: 20, gen(k, L) {
    const b = k.pick([2, 3, 5]);
    if (L === 2 || k.chance(0.5)) {
      const e = k.ri(b === 2 ? 4 : 2, b === 2 ? 9 : b === 3 ? 6 : 4); const c = k.ri(1, e - 1); const x = e - c;
      return { prompt: `If ${b}^(x+${c}) = ${k.fmtIN(b ** e)}, find x.`, ans: x, wrong: [e, x + 1, x - 1, e + c].filter((v) => v > 0 && v !== x), step: 1, why: `${k.fmtIN(b ** e)} = ${b}^${e}, so x + ${c} = ${e} → x = ${x}`, p: ['solve', b, e, c] };
    }
    const m = k.ri(2, 7), n = k.ri(2, 7); const r = k.ri(1, b === 2 ? 6 : 3); const q = m + n - r; if (q < 1) return null;
    return { prompt: 'Simplify', emph: `${b}^${m} × ${b}^${n} ÷ ${b}^${q}`, ans: b ** r, wrong: [b ** (r + 1), b ** (m * n - q) > 0 && b ** (m * n - q) < 1e6 ? b ** (m * n - q) : b ** r + b, r, b * r].filter((v) => v !== b ** r), step: b, why: `Same base: add then subtract powers → ${b}^(${m}+${n}−${q}) = ${b}^${r} = ${b ** r}`, p: ['simp', b, m, n, q] };
  } }),
  Q({ id: 'q.quad.compare', sub: 'Quadratic Comparison', lv: [3, 4], fast: false, deep: true, time: 50, gen(k) {
    const R = () => k.ri(-9, 12);
    const eq = (v, r1, r2) => { const S = r1 + r2, P = r1 * r2; return `${v}² ${S > 0 ? '−' : '+'} ${Math.abs(S)}${v} ${P < 0 ? '−' : '+'} ${Math.abs(P)} = 0`.replace(` 1${v}`, ` ${v}`).replace(` + 0${v}`, '').replace(` − 0${v}`, '').replace(' + 0 = 0', ' = 0'); };
    const x1 = R(), x2 = R(); if (x1 === x2 || !x1 || !x2) return null;
    const mode = k.pick(['gt', 'lt', 'ge', 'le', 'none']); const lo = Math.min(x1, x2), hi = Math.max(x1, x2); let y1, y2;
    if (mode === 'gt') { y1 = lo - k.ri(1, 5); y2 = y1 - k.ri(1, 6); } else if (mode === 'lt') { y1 = hi + k.ri(1, 5); y2 = y1 + k.ri(1, 6); }
    else if (mode === 'ge') { y1 = lo; y2 = lo - k.ri(1, 6); } else if (mode === 'le') { y1 = hi; y2 = hi + k.ri(1, 6); } else { y1 = lo + 1 <= hi - 1 ? k.ri(lo + 1, hi - 1) : lo - 1; y2 = k.chance(0.5) ? hi + k.ri(1, 4) : lo - k.ri(1, 4); }
    if (!y1 || !y2 || y1 === y2 || Math.abs(y1) > 15 || Math.abs(y2) > 15) return null;
    const X = [x1, x2], Y = [y1, y2]; const pairs = X.flatMap((a) => Y.map((b) => a - b));
    const ans = pairs.every((d) => d > 0) ? 'x > y' : pairs.every((d) => d >= 0) ? 'x ≥ y' : pairs.every((d) => d < 0) ? 'x < y' : pairs.every((d) => d <= 0) ? 'x ≤ y' : 'x = y or no relation';
    return { prompt: 'Compare x and y', passage: `I. ${eq('x', x1, x2)}\nII. ${eq('y', y1, y2)}`, ans, opts: ['x > y', 'x ≥ y', 'x < y', 'x ≤ y', 'x = y or no relation'], keepOrder: true, why: `x = ${k.sn(lo)}, ${k.sn(hi)}; y = ${k.sn(Math.min(y1, y2))}, ${k.sn(Math.max(y1, y2))} → ${ans === 'x = y or no relation' ? 'the roots overlap, so no single relation holds' : `every x is ${ans.slice(2, 3) === '>' ? 'greater than' : ans.slice(2, 3) === '≥' ? 'greater than or equal to' : ans.slice(2, 3) === '<' ? 'less than' : 'less than or equal to'} every y`}`, steps: 'Factorise each equation: find two numbers with the right sum and product. Then compare every value of x with every value of y. One equal pair makes it ≥ or ≤; any overlap means no relation.', p: [x1, x2, y1, y2] };
  } }),
  Q({ id: 'q.partner', sub: 'Partnership', lv: [2, 3], time: 30, gen(k, L) {
    const [x, y] = k.pickN(NAMES, 2); const P1 = 1000 * k.ri(2, 20), P2 = 1000 * k.ri(2, 20); const t1 = L === 2 ? 12 : k.pick([12, 8, 6, 9, 10]), t2 = L === 2 ? 12 : k.pick([12, 6, 4, 8, 3]);
    const a = P1 * t1, b = P2 * t2; const g = k.gcd(a, b); const ra = a / g, rb = b / g; if (ra + rb > 40 || ra === rb) return null; const unit = 100 * k.ri(2, 60); const T = unit * (ra + rb); const ans = ra * unit;
    const time = t1 === 12 && t2 === 12 ? '' : ` ${x} stays ${t1} months and ${y} ${t2} months.`;
    return { prompt: `${x} invests ₹${k.fmtIN(P1)} and ${y} invests ₹${k.fmtIN(P2)} in a business.${time} Out of a profit of ₹${k.fmtIN(T)}, ${x}'s share?`, ans, pre: '₹', wrong: [rb * unit, Math.round((T * P1) / (P1 + P2)), T / 2, ans + unit].filter((v) => Number.isInteger(v) && v !== ans), step: unit, why: `Ratio = ${k.fmtIN(P1)}×${t1} : ${k.fmtIN(P2)}×${t2} = ${ra}:${rb}; ${k.fmtIN(T)} ÷ ${ra + rb} = ${k.fmtIN(unit)} → ${x}: ${ra} × ${k.fmtIN(unit)} = ₹${k.fmtIN(ans)}`, p: [P1, P2, t1, t2, unit] };
  } }),
  Q({ id: 'q.prob.cards', sub: 'Probability', lv: [2, 3], time: 22, gen(k) {
    const E = [['a king', 4, '4 kings'], ['a red card', 26, '26 red cards'], ['a face card (J, Q, K)', 12, '3 face cards × 4 suits = 12'], ['a red face card', 6, '3 × 2 red suits = 6'], ['a heart or a king', 16, '13 hearts + 3 other kings = 16'], ['a black ace', 2, 'ace of spades and ace of clubs = 2'], ['a spade', 13, '13 spades'], ['not a heart', 39, '52 − 13 hearts = 39'], ['a number card (2 to 10) of clubs', 9, '2 to 10 = 9 cards'], ['a queen or a jack', 8, '4 queens + 4 jacks = 8']];
    const [ev, fav, how] = k.pick(E); const ans = k.frac(fav, 52);
    const wrongs = E.map((e) => k.frac(e[1], 52)).filter((v) => v !== ans); wrongs.push(k.frac(fav, 13), k.frac(Math.max(1, fav - 1), 52), k.frac(fav + 4, 52));
    return { prompt: `One card is drawn from a well-shuffled pack of 52. Probability of ${ev}?`, ans, wrong: [...new Set(wrongs)].filter((v) => v !== ans), why: `${how} → ${fav}/52${ans !== `${fav}/52` ? ` = ${ans}` : ''}`, p: [ev] };
  } }),
  Q({ id: 'q.mens.more', sub: 'Mensuration', lv: [2, 3], time: 28, gen(k, L) {
    const t = k.pick(L === 2 ? ['tri', 'sphereS'] : ['cone', 'sphereS', 'tri']);
    if (t === 'tri') { const b = 2 * k.ri(3, 20), h = k.ri(3, 25); return { prompt: `A triangle has base ${b} cm and height ${h} cm. Its area?`, ans: (b * h) / 2, post: ' cm²', wrong: [b * h, b + h, (b * h) / 2 + h], step: h, why: `½ × ${b} × ${h} = ${(b * h) / 2} cm²`, p: [t, b, h] }; }
    if (t === 'sphereS') { const r = 7 * k.ri(1, 3); const ans = 4 * (22 / 7) * r * r; return { prompt: `Surface area of a sphere of radius ${r} cm? (π = 22/7)`, ans, post: ' cm²', wrong: [ans / 2, ans / 4, (4 / 3) * (22 / 7) * r ** 3 < 1e6 ? Math.round((4 / 3) * (22 / 7) * r ** 3) : ans * 2, ans + 22].filter((v) => Number.isInteger(v)), step: 22, why: `4πr² = 4 × 22/7 × ${r} × ${r} = ${k.fmtIN(ans)} cm²`, p: [t, r] }; }
    const r = 7 * k.ri(1, 2), h = 3 * k.ri(2, 8); const ans = (22 / 7) * r * r * h / 3;
    return { prompt: `Volume of a cone with radius ${r} cm and height ${h} cm? (π = 22/7)`, ans, post: ' cm³', wrong: [ans * 3, ans / 2 * 3 > 0 ? (22 / 7) * r * h : ans + 22, ans + 154].filter((v) => Number.isInteger(v)), step: 22, why: `⅓πr²h = ⅓ × 22/7 × ${r}² × ${h} = ${k.fmtIN(ans)} cm³`, steps: 'A cone holds exactly one third of the cylinder with the same base and height.', p: [t, r, h] };
  } }),
  // ---------------- Different ways of thinking (experience variety) ----------------
  Q({ id: 'q.pct.trap', sub: 'Percentages', lv: [2, 3], time: 22, gen(k, L) {
    const t = k.pick(L === 2 ? ['updown', 'back'] : ['updown', 'back', 'twoyears']);
    if (t === 'updown') {
      const a = k.pick([10, 20, 30, 40, 50]); const it = k.pick(ITEMS); const loss = (a * a) / 100;
      return { prompt: `A ${it}'s price goes up ${a}% and then comes down ${a}%. Which is true?`, ans: `It ends ${loss}% lower`, opts: [`It ends ${loss}% lower`, 'It is back to the original', `It ends ${loss}% higher`, `It ends ${a}% lower`], why: `Take 100: +${a}% → ${100 + a}; −${a}% of ${100 + a} = ${((100 + a) * a) / 100} → ${100 - loss}. The fall is taken on a bigger number, so it ends ${loss}% lower`, steps: `Shortcut: up a% then down a% always ends a²/100 % lower: ${a}²/100 = ${loss}%.`, p: [t, a] };
    }
    if (t === 'back') {
      const [a, b, bs] = k.pick([[20, 25, '25%'], [25, 100 / 3, '33⅓%'], [50, 100, '100%'], [40, 200 / 3, '66⅔%'], [10, 100 / 9, '11⅑%']]);
      const wrong = [`${a}%`, `${a + 5}%`, `${Math.round(b + 10)}%`, `${Math.round(a / 2)}%`].filter((x) => x !== bs);
      return { prompt: `A salary is cut by ${a}%. By what percent must it now rise to get back to the original?`, ans: bs, opts: [bs, ...wrong.slice(0, 3)], why: `Take 100 → cut to ${100 - a}. To get back, it must gain ${a} on ${100 - a}: ${a}/${100 - a} = ${bs}`, steps: `The rise is measured on the smaller, reduced amount, so it is always more than ${a}%.`, p: [t, a] };
    }
    const r = k.pick([10, 20, 5]); const tot = Math.round(((1 + r / 100) ** 2 - 1) * 10000) / 100;
    return { prompt: `A town grows ${r}% every year. Over 2 years, how much does it grow in total?`, ans: `${tot}%`, opts: [`${tot}%`, `${2 * r}%`, `${r * r}%`, `${tot + r}%`], why: `Year 2 grows on the bigger number: ${r} + ${r} + (${r} × ${r})/100 = ${tot}%, not ${2 * r}%`, p: [t, r] };
  } }),
  Q({ id: 'q.spot.step', sub: 'Profit & Loss', lv: [2, 3], time: 30, gen(k) {
    const t = k.pick(['cp', 'avg']); const bad = k.ri(0, 3); // 0 = no mistake, else the wrong step
    if (t === 'cp') {
      const p = k.pick([10, 20, 25, 50]); const cp = 40 * k.ri(5, 60); const sp = (cp * (100 + p)) / 100; const [x] = k.pickN(NAMES, 1);
      const wrongCp = Math.round(sp - (sp * p) / 100);
      const steps = [
        bad === 1 ? `Step 1: Profit is ${p}% of the selling price.` : `Step 1: Profit is ${p}% of the cost price.`,
        bad === 2 ? `Step 2: So SP = CP × ${(100 - p) / 100}.` : `Step 2: So SP = CP × ${(100 + p) / 100}.`,
        bad === 3 ? `Step 3: CP = ${k.fmtIN(sp)} − ${p}% of ${k.fmtIN(sp)} = ₹${k.fmtIN(wrongCp)}.` : `Step 3: CP = ${k.fmtIN(sp)} ÷ ${(100 + p) / 100} = ₹${k.fmtIN(cp)}.`,
      ];
      if (bad === 3 && wrongCp === cp) return null;
      const ans = bad ? `Step ${bad}` : 'No mistake';
      const fix = { 0: `Every step is right: CP = ${k.fmtIN(sp)} ÷ ${(100 + p) / 100} = ₹${k.fmtIN(cp)}`, 1: `Profit % is always on the cost price, not the selling price`, 2: `A profit means SP is bigger: SP = CP × ${(100 + p) / 100}`, 3: `Taking ${p}% off the SP is the classic trap: CP = ${k.fmtIN(sp)} ÷ ${(100 + p) / 100} = ₹${k.fmtIN(cp)}` }[bad];
      return { prompt: `${x} solved this: "A shop sells a fan for ₹${k.fmtIN(sp)} at a ${p}% profit. Find the cost price." Which step has the mistake?`, passage: steps.join('\n'), ans, opts: ['Step 1', 'Step 2', 'Step 3', 'No mistake'], keepOrder: true, why: fix, p: [t, p, cp, bad] };
    }
    const n = k.ri(4, 8); const a = k.ri(15, 40); const b = a - k.ri(1, 4); const tot = n * a; const nt = (n - 1) * b; const rem = tot - nt; if (rem <= 0) return null;
    const steps = [
      bad === 1 ? `Step 1: Total of ${n} numbers = ${n} + ${a} = ${n + a}.` : `Step 1: Total of ${n} numbers = ${n} × ${a} = ${tot}.`,
      bad === 2 ? `Step 2: Total of the remaining ${n - 1} = ${n} × ${b} = ${n * b}.` : `Step 2: Total of the remaining ${n - 1} = ${n - 1} × ${b} = ${nt}.`,
      bad === 3 ? `Step 3: Removed number = ${a} − ${b} = ${a - b}.` : `Step 3: Removed number = ${tot} − ${nt} = ${rem}.`,
    ];
    const ans = bad ? `Step ${bad}` : 'No mistake';
    const fix = { 0: `All correct: ${tot} − ${nt} = ${rem}`, 1: `Total = average × count = ${n} × ${a} = ${tot}`, 2: `Only ${n - 1} numbers remain: ${n - 1} × ${b} = ${nt}`, 3: `Subtract totals, not averages: ${tot} − ${nt} = ${rem}` }[bad];
    return { prompt: `The average of ${n} numbers is ${a}. One number is removed and the average becomes ${b}. Which step of this solution has the mistake?`, passage: steps.join('\n'), ans, opts: ['Step 1', 'Step 2', 'Step 3', 'No mistake'], keepOrder: true, why: fix, p: [t, n, a, b, bad] };
  } }),
  Q({ id: 'q.trick', sub: 'Mental math', lv: [1, 3], time: 12, gen(k, L) {
    const t = k.pick(L === 1 ? ['sq5', 'x5'] : L === 2 ? ['sq5', 'near', 'x99'] : ['near', 'x99', 'sqnear']);
    if (t === 'sq5') { const n = k.ri(2, 12); const a = 10 * n + 5; return { prompt: 'Quick trick!', emph: `${a}²`, ans: a * a, wrong: [a * a + 100, a * a - 100, n * (n + 1) * 10 + 25], step: 100, why: `Ends in 5: ${n} × ${n + 1} = ${n * (n + 1)}, then write 25 → ${k.fmtIN(a * a)}`, p: [t, n] }; }
    if (t === 'x5') { const a = 2 * k.ri(11, 249); return { prompt: 'Quick trick!', emph: `${a} × 5`, ans: a * 5, wrong: [a * 5 + 10, a * 5 - 10, a * 50], step: 10, why: `× 5 = × 10 ÷ 2: ${a * 10} ÷ 2 = ${k.fmtIN(a * 5)}`, p: [t, a] }; }
    if (t === 'near') { const m = 10 * k.ri(3, 9); const d = k.ri(1, 4); return { prompt: 'Quick trick!', emph: `${m - d} × ${m + d}`, ans: m * m - d * d, wrong: [m * m, m * m + d * d, m * m - 2 * d], step: d, why: `(${m} − ${d})(${m} + ${d}) = ${m}² − ${d}² = ${m * m} − ${d * d} = ${k.fmtIN(m * m - d * d)}`, p: [t, m, d] }; }
    if (t === 'x99') { const a = k.ri(12, 89); const z = k.pick([9, 99]); return { prompt: 'Quick trick!', emph: `${a} × ${z}`, ans: a * z, wrong: [a * z + a, a * z - a, a * (z + 1)], step: a, why: `× ${z} = × ${z + 1} − once: ${k.fmtIN(a * (z + 1))} − ${a} = ${k.fmtIN(a * z)}`, p: [t, a, z] }; }
    const b = k.pick([100, 50]); const d = k.ri(1, 4) * k.pick([1, -1]); const n = b + d;
    return { prompt: 'Quick trick!', emph: `${n}²`, ans: n * n, wrong: [n * n + 2 * Math.abs(d), b * b + d * d, n * n - 100], step: 2 * Math.abs(d), why: `(${b} ${d > 0 ? '+' : '−'} ${Math.abs(d)})² = ${k.fmtIN(b * b)} ${d > 0 ? '+' : '−'} ${2 * b * Math.abs(d)} + ${d * d} = ${k.fmtIN(n * n)}`, p: [t, n] };
  } }),
  Q({ id: 'q.compare.vals', sub: 'Simplification', lv: [2, 3], time: 22, gen(k, L) {
    const F = [[12.5, 1, 8], [25, 1, 4], [37.5, 3, 8], [20, 1, 5], [40, 2, 5], [75, 3, 4], [60, 3, 5]];
    const items = []; const seen = new Set();
    let guard = 0;
    while (items.length < 4 && guard++ < 40) {
      const kind = k.pick(['pct', 'frac', 'mul']); let text; let val;
      if (kind === 'pct') { const [pp, n1, d1] = k.pick(F); const X = d1 * k.ri(10, 60); text = `${pp}% of ${X}`; val = (X * n1) / d1; }
      else if (kind === 'frac') { const d = k.pick([3, 4, 5, 6, 7, 9]); const n = k.ri(1, d - 1); if (k.gcd(n, d) !== 1) continue; const X = d * k.ri(10, 50); text = `${n}/${d} of ${X}`; val = (X * n) / d; }
      else { const a = k.ri(12, 48), b = k.ri(3, 9); text = `${a} × ${b}`; val = a * b; }
      if (seen.has(val) || items.some((x) => Math.abs(x.val - val) < 4)) continue; seen.add(val); items.push({ text, val });
    }
    if (items.length < 4) return null;
    const big = L >= 3 ? k.chance(0.5) : true; const sorted = [...items].sort((a, b) => b.val - a.val); const ans = (big ? sorted[0] : sorted[3]).text;
    return { prompt: `Which is the ${big ? 'largest' : 'smallest'}?`, ans, opts: items.map((x) => x.text), why: `${sorted.map((x) => `${x.text} = ${x.val}`).join(', ')} → ${ans}`, steps: 'Turn percentages into fractions (37.5% = 3/8, 60% = 3/5) and estimate before calculating exactly.', p: items.map((x) => x.text) };
  } }),
  Q({ id: 'q.prob.intuition', sub: 'Probability', lv: [2, 4], time: 25, gen(k) {
    const B = [
      ['A fair coin lands heads 5 times in a row. Probability the next toss is heads?', '1/2', ['1/32', '1/64', 'Less than 1/2'], 'Coins have no memory: every toss is still 1/2. Expecting a "correction" is the gambler\'s fallacy'],
      ['A family has two children. The older one is a boy. Probability both are boys?', '1/2', ['1/3', '1/4', '2/3'], 'Only the younger child is unknown: boy or girl, 1/2'],
      ['A family has two children and at least one is a boy. Probability both are boys?', '1/3', ['1/2', '1/4', '2/3'], 'Possible families: BB, BG, GB (GG is ruled out). Only 1 of these 3 is BB'],
      ['Two dice are rolled. Which total is most likely?', '7', ['12', '6', 'All totals are equally likely'], '7 can be made 6 ways (1+6, 2+5, 3+4 and reversed): more than any other total'],
      ['A die is rolled twice. Probability of at least one six?', '11/36', ['1/3', '1/6', '1/36'], 'Use 1 − P(no six) = 1 − (5/6)² = 1 − 25/36 = 11/36. Adding 1/6 + 1/6 counts double six twice'],
      ['You pick 1 of 3 boxes; one hides a prize. The host opens an empty box you didn\'t pick and offers a switch. Chance of winning if you switch?', '2/3', ['1/2', '1/3', 'It makes no difference'], 'Your first pick is right only 1/3 of the time; switching wins the other 2/3'],
      ['In a group of 23 people, roughly what is the chance that two share a birthday?', 'About 50%', ['About 6%', 'About 23%', 'Almost 0%'], 'There are 253 possible pairs among 23 people, so a shared birthday is surprisingly likely: about 50%'],
      ['Three coins are tossed. Probability of getting exactly 2 heads?', '3/8', ['2/3', '1/2', '1/4'], 'HHT, HTH, THH: 3 of the 8 equally likely outcomes'],
    ];
    const [q, a, w, why] = k.pick(B);
    return { prompt: q, ans: a, opts: [a, ...w], why, p: [q] };
  } }),
];
