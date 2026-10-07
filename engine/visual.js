/* Visual & non-verbal templates. Figures are encoded as small specs
   ("shape:rotation:fill:count") that the app draws with SVG. */
const Q = (o) => ({ cat: 'visual', fast: true, deep: false, lv: [1, 3], ...o });
const ROT_SHAPES = ['arrow', 'flag', 'boot', 'key'];
const POLY = ['p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
// Canonical spec: rotations that look identical (e.g. a square turned 90°) map to the same string,
// so look-alike options get de-duplicated or rejected.
const spec = (s, r = 0, f = 'f', n = 1) => {
  let per = 360; if (s[0] === 'p') per = 360 / Number(s.slice(1)); else if (s === 'circle') per = 1; else if (s === 'star') per = 72;
  return `${s}:${(((r % per) + per) % per) % 360}:${f}:${n}`;
};
const MIRROR_WORDS = ['WITLO', 'BRAIN', 'LOGIC', 'QUIZ', 'RANK', 'FAST', 'DUEL', 'PUZZLE', 'GENIUS', 'SPRINT', 'FOCUS', 'CHAMP'];

function figSeries(k, L) {
  const rule = k.pick(L === 1 ? ['rot', 'count'] : L === 2 ? ['rot', 'count', 'sides', 'rotfill'] : ['rotfill', 'rotcount', 'sides', 'rot']);
  let seq = []; let why;
  if (rule === 'rot') { const s = k.pick(ROT_SHAPES); const st = k.pick([45, 90, -90, 135]); const r0 = 45 * k.ri(0, 7); seq = Array.from({ length: 5 }, (_, i) => spec(s, r0 + i * st, 'f', 1)); why = `turns ${Math.abs(st)}° ${st > 0 ? 'clockwise' : 'anticlockwise'} each step`; }
  else if (rule === 'count') { const s = k.pick(['p4', 'p3', 'p6', 'circle', 'star']); const c0 = 1; seq = Array.from({ length: 5 }, (_, i) => spec(s, 0, 'f', c0 + i)); why = 'one more shape each step'; }
  else if (rule === 'sides') { const i0 = k.ri(0, 1); seq = Array.from({ length: 5 }, (_, i) => spec(POLY[i0 + i], 0, 'o', 1)); why = 'one more side each step'; }
  else if (rule === 'rotfill') { const s = k.pick(ROT_SHAPES); const st = k.pick([90, -90, 45]); seq = Array.from({ length: 5 }, (_, i) => spec(s, i * st, i % 2 ? 'o' : 'f', 1)); why = `turns ${Math.abs(st)}° and switches filled/outline each step`; }
  else { const s = k.pick(ROT_SHAPES); seq = Array.from({ length: 5 }, (_, i) => spec(s, i * 90, 'f', i % 3 + 1)); why = 'turns 90° and the count cycles 1, 2, 3'; }
  const ans = seq[4]; const [s, r, f, n] = ans.split(':');
  const wrong = [spec(s, +r + 90, f, +n), spec(s, +r + 180, f, +n), spec(s, +r, f === 'f' ? 'o' : 'f', +n), spec(s, +r, f, +n + 1), spec(s, +r - 45, f, +n), spec(s, +r, f, Math.max(1, +n - 1))].filter((x) => x !== ans);
  return { prompt: 'Which figure comes next?', vis: { kind: 'figs', items: [...seq.slice(0, 4), '?'] }, ans, wrong, optKind: 'shape', why, p: [rule, ...seq] };
}
function figAnalogy(k) {
  const t = k.pick(['rot90', 'rot180', 'fill', 'count', 'sides']);
  const apply = (sp) => { const [s, r, f, n] = sp.split(':'); if (t === 'rot90') return spec(s, +r + 90, f, +n); if (t === 'rot180') return spec(s, +r + 180, f, +n); if (t === 'fill') return spec(s, +r, f === 'f' ? 'o' : 'f', +n); if (t === 'count') return spec(s, +r, f, +n + 1); const i = POLY.indexOf(s); return spec(POLY[i + 1], +r, f, +n); };
  const base = () => (t === 'sides' ? spec(POLY[k.ri(0, 3)], 0, k.pick(['f', 'o']), 1) : spec(k.pick(ROT_SHAPES), 45 * k.ri(0, 7), k.pick(['f', 'o']), t === 'count' ? k.ri(1, 2) : 1));
  const a = base(); let c = base(); if (c.split(':')[0] === a.split(':')[0]) c = base(); const ans = apply(c); if (ans === c) return null;
  const [s, r, f, n] = ans.split(':');
  const wrong = [c, spec(s, +r + 90, f, +n), spec(s, +r, f === 'f' ? 'o' : 'f', +n), spec(s, +r + 180, f, +n), spec(s, +r, f, +n + 1)].filter((x) => x !== ans);
  return { prompt: 'Figure 1 changes into Figure 2. Apply the same change to Figure 3.', vis: { kind: 'figana', items: [a, apply(a), c, '?'] }, ans, wrong, optKind: 'shape', why: { rot90: 'rotate 90° clockwise', rot180: 'rotate 180°', fill: 'switch between filled and outline', count: 'add one more', sides: 'add one side' }[t], p: [t, a, c] };
}
function figOdd(k, L) {
  const t = k.pick(L === 1 ? ['sides', 'fill'] : ['sides', 'mirror', 'fill']);
  let group; let odd; let why;
  if (t === 'sides') { const s = k.pick(POLY.slice(0, 4)); group = [0, 1, 2].map(() => spec(s, 15 * k.ri(0, 23), k.pick(['f', 'o']), 1)); odd = spec(POLY[POLY.indexOf(s) + 1], 15 * k.ri(0, 23), 'o', 1); why = 'the others have the same number of sides'; }
  else if (t === 'fill') { const s = k.pick(ROT_SHAPES); group = [0, 1, 2].map((i) => spec(s, 90 * i + 45 * k.ri(0, 1), 'f', 1)); odd = spec(s, 90 * k.ri(0, 3), 'o', 1); why = 'the others are filled'; }
  else { const s = k.pick(['flag', 'boot', 'key']); group = [0, 1, 2].map((i) => spec(s, 90 * i, 'f', 1)); odd = `${spec(s, 90 * k.ri(0, 3), 'f', 1)}:m`; why = 'the others are rotations of one figure; this one is flipped'; }
  if (new Set([...group, odd]).size < 4) return null;
  return { prompt: "Which figure doesn't belong?", ans: odd, opts: [...group, odd], optKind: 'shape', why, p: [t, ...group, odd] };
}

/* Dice: find the opposite face from several views (checked across all 15 possible dice) */
function pairings(xs) { if (!xs.length) return [[]]; const [a, ...rest] = xs; const out = []; rest.forEach((b) => pairings(rest.filter((x) => x !== b)).forEach((p) => out.push([[a, b], ...p]))); return out; }
const ALL_DICE = pairings([1, 2, 3, 4, 5, 6]);
function dice(k) {
  const die = k.pick(ALL_DICE); const opp = (d, x) => { const p = d.find((q) => q.includes(x)); return p[0] === x ? p[1] : p[0]; };
  const view = () => die.map((p) => k.pick(p)).sort(() => k.rand() - 0.5);
  for (let t = 0; t < 30; t++) {
    const views = [view(), view()]; if (k.chance(0.4)) views.push(view());
    const okDice = ALL_DICE.filter((d) => views.every((v) => v.every((x, i) => v.every((y, j) => i === j || opp(d, x) !== y))));
    const cands = [1, 2, 3, 4, 5, 6].filter((x) => new Set(okDice.map((d) => opp(d, x))).size === 1);
    if (!cands.length) continue; const f = k.pick(cands); const ans = opp(die, f);
    return { prompt: `These are different views of the same die. Which number is opposite ${f}?`, vis: { kind: 'dice', views }, ans, opts: [ans, ...k.pickN([1, 2, 3, 4, 5, 6].filter((x) => x !== ans && x !== f), 3)], why: `${ans} never appears next to ${f}, and every other number does`, steps: 'A number seen in the same view as another is adjacent to it, never opposite. List each number\'s neighbours; the one that never shares a view with it is opposite.', p: [...views.flat(), f], time: 40 };
  }
  return null;
}

export default [
  Q({ id: 'g.figseries', sub: 'Figure Series', time: 15, gen: figSeries }),
  Q({ id: 'g.figana', sub: 'Figure Analogy', lv: [2, 3], time: 18, gen: figAnalogy }),
  Q({ id: 'g.figodd', sub: 'Odd Figure Out', lv: [1, 3], time: 12, gen: figOdd }),
  Q({ id: 'g.mirror', sub: 'Mirror & Water Images', lv: [2, 3], time: 15, gen(k) {
    const water = k.chance(0.35); let w = k.pick(MIRROR_WORDS); if (k.chance(0.4)) w = `${w.slice(0, 3)}${k.ri(2, 9)}${k.ri(2, 9)}`;
    const ans = `${water ? 'my' : 'mx'}|${w}`;
    return { prompt: water ? 'Which is the water image (reflection below)?' : 'Which is the mirror image (mirror on the right)?', emph: w, ans, opts: [ans, `${water ? 'mx' : 'my'}|${w}`, `r180|${w}`, `rev|${w}`], optKind: 'fx', why: water ? 'a water image flips top to bottom' : 'a mirror flips left to right: order and letters reverse', p: [w, water] };
  } }),
  Q({ id: 'g.arrows', sub: 'Rotation', lv: [1, 2], time: 12, gen(k, L) {
    const s = k.pick(ROT_SHAPES); const r0 = 90 * k.ri(0, 3); let r = r0; const steps = [];
    for (let i = 0; i < L + 1; i++) { const t = k.pick(L >= 2 ? [90, 180, -90, 45] : [90, -90]); steps.push(t); r += t; }
    const txt = steps.map((t) => (t === 180 ? '180°' : `${Math.abs(t)}° ${t > 0 ? 'clockwise' : 'anticlockwise'}`)).join(', then ');
    const ans = spec(s, r, 'f', 1);
    return { prompt: `Rotate this figure ${txt}. What does it look like?`, vis: { kind: 'figs', items: [spec(s, r0, 'f', 1)] }, ans, wrong: [spec(s, r + 90, 'f', 1), spec(s, r + 180, 'f', 1), spec(s, r - 90, 'f', 1), spec(s, r + 45, 'f', 1), ...(s === 'arrow' ? [] : [`${spec(s, r, 'f', 1)}:m`])], optKind: 'shape', why: `net turn ${steps.reduce((a, b) => a + b, 0)}°`, p: [s, r0, ...steps] };
  } }),
  Q({ id: 'g.dice', sub: 'Cubes & Dice', lv: [3, 4], fast: false, deep: true, gen: dice }),
  Q({ id: 'g.cube', sub: 'Cubes & Dice', lv: [2, 4], time: 30, gen(k) {
    const n = k.ri(3, 7); const t = k.pick([3, 2, 1, 0]); const ans = t === 3 ? 8 : t === 2 ? 12 * (n - 2) : t === 1 ? 6 * (n - 2) ** 2 : (n - 2) ** 3;
    return { prompt: `A painted cube is cut into ${n}×${n}×${n} = ${n ** 3} small cubes. How many small cubes have ${t === 0 ? 'no painted face' : `exactly ${t} painted face${t > 1 ? 's' : ''}`}?`, ans, wrong: [8, 12 * (n - 2), 6 * (n - 2) ** 2, (n - 2) ** 3, 6 * n * n, 12 * n].filter((x) => x !== ans), why: { 3: 'Only the 8 corner cubes have 3 painted faces', 2: `Edge cubes (not corners): 12 edges × (${n} − 2) = ${ans}`, 1: `Face centres: 6 faces × (${n} − 2)² = 6 × ${(n - 2) ** 2} = ${ans}`, 0: `The hidden core: (${n} − 2)³ = ${ans}` }[t], p: [n, t] };
  } }),
  Q({ id: 'g.fold', sub: 'Paper Folding', lv: [1, 3], time: 15, gen(k, L) {
    const f = k.ri(1, L + 1); const h = k.ri(1, 2 + (L >= 3 ? 1 : 0)); const ans = h * 2 ** f;
    return { prompt: `A square paper is folded in half ${f} time${f > 1 ? 's' : ''}, then ${h} hole${h > 1 ? 's are' : ' is'} punched through all layers. How many holes when it's unfolded?`, ans, wrong: [h * f * 2, h + 2 ** f, h * 2 ** (f + 1), h * 2 ** (f - 1), 2 ** f].filter((x) => x !== ans), why: `Each fold doubles the layers: ${f} fold${f > 1 ? 's' : ''} → 2^${f} = ${2 ** f} layers; ${h} hole${h > 1 ? 's' : ''} × ${2 ** f} = ${ans}`, p: [f, h] };
  } }),
  Q({ id: 'g.squares', sub: 'Figure Counting', lv: [2, 3], time: 25, gen(k, L) {
    const n = k.ri(2, L >= 3 ? 5 : 4); const rect = L >= 3 && k.chance(0.5); const sq = (n * (n + 1) * (2 * n + 1)) / 6; const re = ((n * (n + 1)) / 2) ** 2; const ans = rect ? re : sq;
    return { prompt: `How many ${rect ? 'rectangles (including squares)' : 'squares of any size'} are in this ${n}×${n} grid?`, vis: { kind: 'gridlines', n }, ans, wrong: [n * n, rect ? sq : re, ans - n, ans + n, 2 * n * n].filter((x) => x !== ans), why: rect ? `Pick 2 of the ${n + 1} lines each way: ${n + 1}C2 = ${(n * (n + 1)) / 2}, so ${(n * (n + 1)) / 2} × ${(n * (n + 1)) / 2} = ${re}` : `${Array.from({ length: n }, (_, i) => `${n - i}×${n - i}: ${(i + 1) ** 2}`).join(', ')} → ${Array.from({ length: n }, (_, i) => (i + 1) ** 2).join(' + ')} = ${sq}`, p: [n, rect] };
  } }),
  Q({ id: 'g.matrix', sub: 'Matrix Puzzles', lv: [2, 3], time: 25, gen(k, L) {
    const rule = k.pick(L === 2 ? ['sum', 'diff'] : ['sum', 'prod', 'sqsum', 'colsum']); const rows = [];
    for (let i = 0; i < 3; i++) { const a = k.ri(2, 12), b = k.ri(2, 12); const c = rule === 'sum' ? a + b : rule === 'diff' ? Math.abs(a - b) : rule === 'prod' ? a * b : rule === 'sqsum' ? a * a + b : 0; rows.push([a, b, c]); }
    if (rule === 'colsum') { for (let i = 0; i < 3; i++) rows[i][2] = k.ri(2, 12); rows[2] = [rows[0][0] + rows[1][0], rows[0][1] + rows[1][1], rows[0][2] + rows[1][2]]; }
    const r = rule === 'colsum' ? 2 : k.ri(0, 2); const c = rule === 'colsum' ? k.ri(0, 2) : 2; const ans = rows[r][c];
    const grid = rows.map((row, i) => row.map((v, j) => (i === r && j === c ? '?' : String(v))));
    const R2 = rows[r]; const C2 = [rows[0][c], rows[1][c], rows[2][c]];
    const how = { sum: `${R2[0]} + ${R2[1]} = ${R2[2]}`, diff: `|${R2[0]} − ${R2[1]}| = ${R2[2]}`, prod: `${R2[0]} × ${R2[1]} = ${R2[2]}`, sqsum: `${R2[0]}² + ${R2[1]} = ${R2[2]}`, colsum: `${C2[0]} + ${C2[1]} = ${C2[2]}` }[rule];
    return { prompt: 'Find the missing number', vis: { kind: 'grid', grid, num: true }, ans, wrong: [ans + 1, ans - 1, ans + 2, ans * 2].filter((x) => x > 0), why: { sum: 'in each row, 1st + 2nd = 3rd', diff: 'in each row, 3rd = difference of the first two', prod: 'in each row, 1st × 2nd = 3rd', sqsum: 'in each row, 1st² + 2nd = 3rd', colsum: 'in each column, top + middle = bottom' }[rule] + `: ${how}`, p: [rule, ...rows.flat()] };
  } }),
  Q({ id: 'g.magic', sub: 'Matrix Puzzles', lv: [1, 2], time: 15, gen(k, L) {
    let m = [[2, 7, 6], [9, 5, 1], [4, 3, 8]]; const rot = (g) => g[0].map((_, i) => g.map((r) => r[i]).reverse()); for (let i = 0; i < k.ri(0, 3); i++) m = rot(m); if (k.chance(0.5)) m = m.map((r) => [...r].reverse());
    const add = L >= 2 ? k.ri(1, 15) : 0; const mul = L >= 2 && k.chance(0.4) ? 2 : 1; m = m.map((r) => r.map((v) => v * mul + add)); const S = 15 * mul + 3 * add; const r = k.ri(0, 2), c = k.ri(0, 2); const ans = m[r][c];
    return { prompt: `Every row and column adds up to ${S}. Find ?`, vis: { kind: 'grid', grid: m.map((row, i) => row.map((v, j) => (i === r && j === c ? '?' : String(v)))), num: true }, ans, wrong: [ans + 1, ans - 1, ans + 2, ans - 2], why: (() => { const o = m[r].filter((_, j) => j !== c); return `Row: ${S} − ${o[0]} − ${o[1]} = ${ans}`; })(), p: [...m.flat(), r, c] };
  } }),
  Q({ id: 'g.emoji', sub: 'Symbol Puzzles', lv: [1, 3], time: 15, gen(k, L) {
    const [x, y, z] = k.pickN(['🍎', '🍌', '🥥', '🍩', '🎈', '⭐', '🍕', '🌵', '🐟'], 3); const a = k.ri(2, 12); let b = k.ri(2, 12); if (b === a) b++; const c = k.ri(2, 12);
    if (L >= 3) { const lines = [`${x} + ${x} + ${x} = ${3 * a}`, `${x} × ${y} = ${a * b}`, `${y} − ${z} = ${b - c}`]; return { prompt: `Crack the code. What is ${x} + ${y} + ${z}?`, emph: lines.join('\n'), emphSmall: true, ans: a + b + c, wrong: [a + b, a + b + c + 1, a * b, a + b - c], why: `${x} = ${3 * a} ÷ 3 = ${a}; ${y} = ${a * b} ÷ ${a} = ${b}; ${z} = ${b} − ${b - c < 0 ? `(−${c - b})` : b - c} = ${c} → ${a} + ${b} + ${c} = ${a + b + c}`, p: [a, b, c, 3] }; }
    if (L === 2) { const lines = [`${x} + ${x} + ${x} = ${3 * a}`, `${x} + ${y} = ${a + b}`, `${y} + ${z} = ${b + c}`]; return { prompt: `Crack the code. What is ${z}?`, emph: lines.join('\n'), emphSmall: true, ans: c, wrong: [c + 1, c - 1, b, a].filter((v) => v > 0), why: `${x} = ${3 * a} ÷ 3 = ${a}; ${y} = ${a + b} − ${a} = ${b}; ${z} = ${b + c} − ${b} = ${c}`, p: [a, b, c, 2] }; }
    const lines = [`${x} + ${x} = ${2 * a}`, `${x} + ${y} = ${a + b}`]; return { prompt: `Crack the code. What is ${y}?`, emph: lines.join('\n'), emphSmall: true, ans: b, wrong: [b + 1, b - 1, a, a + b].filter((v) => v > 0), why: `${x} = ${2 * a} ÷ 2 = ${a}, so ${y} = ${a + b} − ${a} = ${b}`, p: [a, b, 1] };
  } }),
  Q({ id: 'g.pattern', sub: 'Pattern Completion', lv: [1, 3], time: 12, gen(k, L) {
    const set = k.shuffle(['🔺', '🔵', '🟩', '⭐', '💜', '🟧', '🔶', '⚪']); const len = L >= 2 ? k.pick([3, 4]) : 2; const cyc = set.slice(0, len); let seq; let why;
    if (L >= 3 && k.chance(0.5)) { seq = []; let n = 1; while (seq.length < 9) { for (let i = 0; i < n && seq.length < 9; i++) seq.push(cyc[0]); if (seq.length < 9) seq.push(cyc[1]); n++; } why = `one more ${cyc[0]} before each ${cyc[1]}`; }
    else { seq = Array.from({ length: 9 }, (_, i) => cyc[i % len]); why = `repeats every ${len}`; }
    const shown = L >= 2 ? 7 : 5; const ans = seq[shown];
    return { prompt: 'What comes next?', emph: `${seq.slice(0, shown).join(' ')}  ?`, ans, opts: [ans, ...[...cyc.filter((x) => x !== ans), ...k.pickN(set.slice(len), 3)].slice(0, 3)], emoji: true, why, p: seq.slice(0, shown + 1) };
  } }),
  Q({ id: 'g.count', sub: 'Visual Counting', lv: [1, 2], time: 12, gen(k, L) {
    const [target, ...fill] = k.pick([['🍎', '🍐', '🍊'], ['⭐', '✨', '🌙'], ['🐱', '🐶', '🐭'], ['🌸', '🌼', '🍀'], ['🚗', '🚕', '🚙'], ['🦉', '🐧', '🐦']]); const rows = L >= 2 ? 5 : 4; const n = k.ri(3, L >= 2 ? 11 : 7);
    const cells = k.shuffle([...Array(n).fill(target), ...Array.from({ length: rows * 5 - n }, () => k.pick(fill))]); const grid = []; for (let r = 0; r < rows; r++) grid.push(cells.slice(r * 5, r * 5 + 5));
    return { prompt: `How many ${target} can you spot?`, vis: { kind: 'grid', grid }, ans: n, wrong: [n + 1, n - 1, n + 2].filter((v) => v > 0), why: `${grid.map((row, i) => `row ${i + 1}: ${row.filter((x) => x === target).length}`).join(', ')} → ${n}`, p: cells };
  } }),
];
