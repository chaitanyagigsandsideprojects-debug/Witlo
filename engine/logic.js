/* Logical reasoning templates — puzzles are solved by brute force so every
   question provably has exactly one answer. */
import { NAMES, MALE, FEMALE } from './core';

const Q = (o) => ({ cat: 'logic', fast: true, deep: false, lv: [1, 3], ...o });
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DIR8 = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
const CODE_WORDS = ['CAT', 'DOG', 'SUN', 'PEN', 'BOOK', 'MILK', 'TREE', 'FISH', 'STAR', 'LAMP', 'RAIN', 'KITE', 'BIRD', 'CAKE', 'GOLD', 'MANGO', 'TIGER', 'CHAI', 'ROAD', 'SHIP', 'PLANT', 'CLOUD', 'TRAIN', 'BRAIN', 'LIGHT', 'WATER', 'MUSIC', 'HOUSE', 'SMILE', 'PAPER', 'GLASS', 'RIVER', 'STONE', 'TABLE', 'NIGHT', 'DREAM', 'HEART', 'FROST', 'QUIZ', 'WITLO'];
const perms = (arr) => { if (arr.length <= 1) return [arr]; const out = []; arr.forEach((x, i) => perms([...arr.slice(0, i), ...arr.slice(i + 1)]).forEach((p) => out.push([x, ...p]))); return out; };
const ord = (n) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;

/* ---------- Linear arrangement / scheduling solver ---------- */
function linearPuzzle(k, n, style) {
  const ppl = k.pickN(NAMES, n); const sol = k.shuffle(ppl); const pos = (arr, x) => arr.indexOf(x);
  const day = style === 'days';
  const P = (x) => x; const where = (i) => (day ? DAYS[i] : `position ${i + 1}`);
  const gens = [
    () => { const x = k.pick(ppl); const i = pos(sol, x); return i === 0 || i === n - 1 ? [day ? `${x}'s class is on the first or last day.` : `${x} sits at one of the ends.`, (a) => [0, n - 1].includes(pos(a, x))] : [day ? `${x}'s class is neither on the first nor the last day.` : `${x} does not sit at either end.`, (a) => ![0, n - 1].includes(pos(a, x))]; },
    () => { const i = k.ri(0, n - 2); const x = sol[i], y = sol[i + 1]; return [day ? `${x}'s class is the day before ${y}'s.` : `${x} sits immediately to the left of ${y}.`, (a) => pos(a, y) - pos(a, x) === 1, `next:${x}`]; },
    () => { const [x, y] = k.pickN(ppl, 2); const d = Math.abs(pos(sol, x) - pos(sol, y)) - 1; return [day ? (d === 0 ? `${x}'s and ${y}'s classes are on consecutive days.` : `There ${d === 1 ? 'is exactly one day' : `are exactly ${d} days`} between ${x}'s and ${y}'s classes.`) : d === 0 ? `${x} and ${y} sit next to each other.` : `Exactly ${d} ${d === 1 ? 'person sits' : 'people sit'} between ${x} and ${y}.`, (a) => Math.abs(pos(a, x) - pos(a, y)) - 1 === d]; },
    () => { const [x, y] = k.pickN(ppl, 2); const before = pos(sol, x) < pos(sol, y); return [day ? `${x}'s class is ${before ? 'before' : 'after'} ${y}'s.` : `${x} sits somewhere to the ${before ? 'left' : 'right'} of ${y}.`, (a) => (pos(a, x) < pos(a, y)) === before]; },
    () => { const x = k.pick(ppl); const i = pos(sol, x); return [day ? `${x}'s class is on ${DAYS[i]}.` : `${x} sits ${i === 0 ? 'at the extreme left' : i === n - 1 ? 'at the extreme right' : `${ord(i + 1)} from the left`}.`, (a) => pos(a, x) === i, `pos:${i}`]; },
    () => { const [x, y] = k.pickN(ppl, 2); const adj = Math.abs(pos(sol, x) - pos(sol, y)) === 1; if (adj) return null; return [day ? `${x}'s and ${y}'s classes are not on consecutive days.` : `${x} does not sit next to ${y}.`, (a) => Math.abs(pos(a, x) - pos(a, y)) !== 1]; },
  ];
  const all = perms(ppl);
  // what we ask
  const qs = [
    () => { const m = Math.floor(n / 2); if (n % 2 === 0 || day) return null; return [`Who sits in the middle?`, (a) => a[m], `pos:${m}`, []]; },
    () => [day ? `Whose class is on ${DAYS[0]}?` : 'Who sits at the extreme left?', (a) => a[0], 'pos:0', []],
    () => [day ? `Whose class is on ${DAYS[n - 1]}?` : 'Who sits at the extreme right?', (a) => a[n - 1], `pos:${n - 1}`, []],
    () => { const x = k.pick(sol.slice(0, n - 1)); return [day ? `Whose class is the day after ${x}'s?` : `Who sits immediately to the right of ${x}?`, (a) => a[pos(a, x) + 1] || '—', `next:${x}`, [x]]; },
    () => { const i = k.ri(1, n - 2); return [day ? `Whose class is on ${DAYS[i]}?` : `Who sits ${ord(i + 1)} from the left?`, (a) => a[i], `pos:${i}`, []]; },
  ];
  let ask = null; for (let t = 0; t < 10 && !ask; t++) ask = k.pick(qs)();
  const clues = []; let live = all;
  for (let t = 0; t < 40; t++) {
    const answers = new Set(live.map(ask[1])); if (answers.size === 1 && live.length <= 3) break;
    const c = k.pick(gens)(); if (!c || (c[2] && [].concat(c[2]).includes(ask[2]))) continue; const next = live.filter(c[1]); if (next.length === live.length) continue;
    clues.push(c[0]); live = next;
  }
  const answers = new Set(live.map(ask[1])); if (answers.size !== 1 || clues.length < 3 || clues.length > (n + 2)) return null;
  const ans = [...answers][0]; if (ans === '—') return null;
  const names = [...ppl].sort().join(', '); const intro = day ? `${names} each have one class on a different day from ${DAYS[0]} to ${DAYS[n - 1]}.` : `${names} sit in a row, all facing north.`;
  return { prompt: ask[0], passage: `${intro}\n\n${clues.map((c) => `• ${c}`).join('\n')}`, ans, wrong: ppl.filter((x) => x !== ans && !(ask[3] || []).includes(x)), why: `${day ? 'Order' : 'Left to right'}: ${sol.map(P).join(', ')}`, steps: `Place the fixed facts first, then use the "next to" and "between" clues. Final ${day ? 'schedule' : 'row'}: ${sol.map((x, i) => (day ? `${DAYS[i].slice(0, 3)} ${x}` : x)).join(' · ')}.`, p: [style, ...sol, ask[0]], time: n * 18, bump: clues.length * 10 };
}

/* ---------- Circular arrangement ---------- */
function circularPuzzle(k, n) {
  const ppl = k.pickN(NAMES, n); const first = ppl[0];
  const all = perms(ppl.slice(1)).map((p) => [first, ...p]); const sol = k.pick(all);
  // positions clockwise; facing centre: left = clockwise (+1)
  const at = (a, x) => a.indexOf(x); const L = (a, x, s) => a[(at(a, x) + s + n) % n];
  const gens = [
    () => { const x = k.pick(ppl); return [`${L(sol, x, 1)} sits immediately to the left of ${x}.`, (a) => L(a, x, 1) === L(sol, x, 1), [`L1:${x}`, `R1:${L(sol, x, 1)}`]]; },
    () => { const x = k.pick(ppl); return [`${L(sol, x, -1)} sits immediately to the right of ${x}.`, (a) => L(a, x, -1) === L(sol, x, -1), [`R1:${x}`, `L1:${L(sol, x, -1)}`]]; },
    () => { const x = k.pick(ppl); return [`${L(sol, x, 2)} sits second to the left of ${x}.`, (a) => L(a, x, 2) === L(sol, x, 2), [`L2:${x}`, `R2:${L(sol, x, 2)}`]]; },
    () => { if (n % 2) return null; const x = k.pick(ppl); return [`${x} sits opposite ${L(sol, x, n / 2)}.`, (a) => L(a, x, n / 2) === L(sol, x, n / 2), [`O:${x}`, `O:${L(sol, x, n / 2)}`]]; },
    () => { const [x, y] = k.pickN(ppl, 2); const adj = L(sol, x, 1) === y || L(sol, x, -1) === y; return [`${x} ${adj ? 'is' : 'is not'} a neighbour of ${y}.`, (a) => (L(a, x, 1) === y || L(a, x, -1) === y) === adj]; },
  ];
  const qs = [
    () => { if (n % 2) return null; const x = k.pick(ppl); return [`Who sits opposite ${x}?`, (a) => L(a, x, n / 2), `O:${x}`, x]; },
    () => { const x = k.pick(ppl); return [`Who sits immediately to the right of ${x}?`, (a) => L(a, x, -1), `R1:${x}`, x]; },
    () => { const x = k.pick(ppl); return [`Who sits second to the left of ${x}?`, (a) => L(a, x, 2), `L2:${x}`, x]; },
  ];
  let ask = null; for (let t = 0; t < 10 && !ask; t++) ask = k.pick(qs)();
  const clues = []; let live = all;
  for (let t = 0; t < 40; t++) {
    if (new Set(live.map(ask[1])).size === 1 && live.length <= 2) break;
    const c = k.pick(gens)(); if (!c || (c[2] && [].concat(c[2]).includes(ask[2]))) continue; const next = live.filter(c[1]); if (next.length === live.length) continue; clues.push(c[0]); live = next;
  }
  const answers = new Set(live.map(ask[1])); if (answers.size !== 1 || clues.length < 3 || clues.length > n + 2) return null;
  const ans = [...answers][0];
  return { prompt: ask[0], passage: `${[...ppl].sort().join(', ')} sit around a round table, facing the centre.\n\n${clues.map((c) => `• ${c}`).join('\n')}`, ans, wrong: ppl.filter((x) => x !== ans && x !== ask[3]), why: `Clockwise: ${sol.join(' → ')}`, steps: `Facing the centre, your left is the clockwise direction. Fix one person, then place the rest clue by clue. Clockwise order: ${sol.join(' → ')}.`, p: ['circ', ...sol, ask[0]], time: n * 20, bump: clues.length * 10 };
}

/* ---------- Two-attribute distribution ---------- */
function distribution(k) {
  const n = 4; const ppl = k.pickN(NAMES, n);
  const [aName, aVals] = k.pick([['colour', ['Red', 'Blue', 'Green', 'Yellow', 'White']], ['city', ['Pune', 'Delhi', 'Goa', 'Jaipur', 'Kochi']], ['sport', ['Cricket', 'Tennis', 'Chess', 'Hockey', 'Football']]]);
  const [bName, bVals] = k.pick([['fruit', ['Mango', 'Apple', 'Banana', 'Grapes', 'Guava']], ['drink', ['Tea', 'Coffee', 'Lassi', 'Juice', 'Soda']], ['pet', ['Cat', 'Dog', 'Parrot', 'Rabbit', 'Fish']]]);
  const av = k.pickN(aVals, n), bv = k.pickN(bVals, n);
  const PA = perms(av), PB = perms(bv); const all = []; PA.forEach((x) => PB.forEach((y) => all.push([x, y])));
  const sol = [k.pick(PA), k.pick(PB)];
  const gens = [
    () => { const i = k.ri(0, n - 1); return [`${ppl[i]} likes ${sol[0][i]}.`, (s) => s[0][i] === sol[0][i], [`a:${sol[0][i]}`]]; },
    () => { const i = k.ri(0, n - 1); return [`${ppl[i]}'s favourite ${bName} is ${sol[1][i]}.`, (s) => s[1][i] === sol[1][i], [`pb:${i}`]]; },
    () => { const i = k.ri(0, n - 1); const v = k.pick(av.filter((x) => x !== sol[0][i])); return [`${ppl[i]} does not like ${v}.`, (s) => s[0][i] !== v]; },
    () => { const i = k.ri(0, n - 1); const v = k.pick(bv.filter((x) => x !== sol[1][i])); return [`${ppl[i]}'s favourite ${bName} is not ${v}.`, (s) => s[1][i] !== v]; },
    () => { const i = k.ri(0, n - 1); return [`The person who likes ${sol[0][i]} has ${sol[1][i]} as their favourite ${bName}.`, (s) => s[1][s[0].indexOf(sol[0][i])] === sol[1][i], [`ab:${sol[0][i]}`]]; },
    () => { const i = k.ri(0, n - 1); const j = (i + k.ri(1, n - 1)) % n; return [`The ${sol[1][i]} fan does not like ${sol[0][j]}.`, (s) => s[0][s[1].indexOf(sol[1][i])] !== sol[0][j]]; },
  ];
  const qs = [
    () => { const v = k.pick(av); return [`Who likes ${v}?`, (s) => ppl[s[0].indexOf(v)], ppl, `a:${v}`]; },
    () => { const i = k.ri(0, n - 1); return [`What is ${ppl[i]}'s favourite ${bName}?`, (s) => s[1][i], bv, `pb:${i}`]; },
    () => { const v = k.pick(av); return [`The person who likes ${v} has which favourite ${bName}?`, (s) => s[1][s[0].indexOf(v)], bv, `ab:${v}`]; },
  ];
  const ask = k.pick(qs)(); const clues = []; let live = all;
  for (let t = 0; t < 60; t++) {
    if (new Set(live.map(ask[1])).size === 1 && live.length <= 4) break;
    const c = k.pick(gens)(); if (c[2] && [].concat(c[2]).includes(ask[3])) continue; const next = live.filter(c[1]); if (next.length === live.length) continue; clues.push(c[0]); live = next;
  }
  const answers = new Set(live.map(ask[1])); if (answers.size !== 1 || clues.length < 4 || clues.length > 8) return null;
  const ans = [...answers][0];
  return { prompt: ask[0], passage: `${ppl.join(', ')} each like a different ${aName} (${av.join(', ')}) and have a different favourite ${bName} (${bv.join(', ')}).\n\n${clues.map((c) => `• ${c}`).join('\n')}`, ans, wrong: ask[2].filter((x) => x !== ans), why: ppl.map((p, i) => `${p}: ${sol[0][i]}, ${sol[1][i]}`).join(' · '), steps: `Draw a grid of people × ${aName} × ${bName}; tick definite facts, cross out the "not" clues, and link the "person who likes…" clues.\n${ppl.map((p, i) => `${p} → ${sol[0][i]}, ${sol[1][i]}`).join('\n')}`, p: ['dist', ...sol[0], ...sol[1], ask[0]], time: 150, bump: clues.length * 8 };
}

/* ---------- Syllogisms (checked against every Venn model) ---------- */
const TERMS = ['pens', 'books', 'chairs', 'lamps', 'cups', 'bags', 'kites', 'clocks', 'rings', 'shoes', 'phones', 'trees', 'birds', 'stars', 'cars', 'boxes', 'roses', 'tigers', 'doctors', 'singers', 'poets', 'coins', 'shirts', 'apples'];
function sylModels(nTerms) {
  const R = (1 << nTerms) - 1; const models = [];
  for (let m = 1; m < 1 << R; m++) { const regions = []; for (let r = 0; r < R; r++) if (m & (1 << r)) regions.push(r + 1); let ok = true; for (let t = 0; t < nTerms; t++) if (!regions.some((g) => g & (1 << t))) ok = false; if (ok) models.push(regions); }
  return models;
}
const MODELS = { 3: sylModels(3) };
function sylTrue(regs, [type, a, b]) {
  const A = (g) => g & (1 << a), B = (g) => g & (1 << b);
  if (type === 'all') return regs.every((g) => !A(g) || B(g));
  if (type === 'some') return regs.some((g) => A(g) && B(g));
  if (type === 'no') return !regs.some((g) => A(g) && B(g));
  return regs.some((g) => A(g) && !B(g)); // some-not
}
const sylText = ([type, a, b], T) => {
  if (type === 'all') return `All ${T[a]} are ${T[b]}.`;
  if (type === 'some') return `Some ${T[a]} are ${T[b]}.`;
  if (type === 'no') return `No ${T[a]} are ${T[b]}.`;
  return `Some ${T[a]} are not ${T[b]}.`;
};
function syllogism(k, L) {
  const T = k.pickN(TERMS, 3); const models = MODELS[3];
  const st = (a, b) => [k.pick(['all', 'all', 'some', 'no', 'somenot']), a, b];
  const prem = [st(0, 1), st(1, 2)]; if (k.chance(0.3)) prem[1] = st(2, 1);
  const valid = models.filter((m) => prem.every((p) => sylTrue(m, p))); if (!valid.length) return null;
  const conc = () => { const pair = k.pick([[0, 2], [2, 0], [0, 1], [1, 2], [2, 1], [1, 0]]); return [k.pick(['all', 'some', 'no', 'somenot']), pair[0], pair[1]]; };
  if (L <= 2) {
    const c = conc(); const always = valid.every((m) => sylTrue(m, c)); const never = valid.every((m) => !sylTrue(m, c));
    const ans = always ? 'Definitely true' : never ? 'Definitely false' : "Can't say";
    return { prompt: `Statements:\n${prem.map((p) => sylText(p, T)).join('\n')}\n\nIs this true?\n“${sylText(c, T).replace(/\.$/, '')}”`, ans, opts: ['Definitely true', 'Definitely false', "Can't say"], keepOrder: true, why: always ? 'it holds in every possible diagram' : never ? 'it fails in every possible diagram' : 'some diagrams allow it, others don\'t', p: [...T, JSON.stringify(prem), JSON.stringify(c)], time: 25, words: true };
  }
  const c1 = conc(); const c2 = conc(); if (JSON.stringify(c1) === JSON.stringify(c2)) return null;
  const f1 = valid.every((m) => sylTrue(m, c1)), f2 = valid.every((m) => sylTrue(m, c2));
  const sameTerms = new Set([c1[1], c1[2]]).size === 2 && [c1[1], c1[2]].sort().join() === [c2[1], c2[2]].sort().join();
  const either = !f1 && !f2 && sameTerms && valid.every((m) => sylTrue(m, c1) || sylTrue(m, c2));
  const ans = f1 && f2 ? 'Both follow' : f1 ? 'Only I follows' : f2 ? 'Only II follows' : either ? 'Either I or II follows' : 'Neither follows';
  return { prompt: 'Which conclusion(s) follow?', passage: `Statements:\n${prem.map((p) => sylText(p, T)).join('\n')}\n\nConclusions:\nI. ${sylText(c1, T)}\nII. ${sylText(c2, T)}`, ans, opts: ['Only I follows', 'Only II follows', 'Both follow', 'Neither follows', 'Either I or II follows'], keepOrder: true, why: `I ${f1 ? 'always holds' : 'not certain'}; II ${f2 ? 'always holds' : 'not certain'}${either ? ', but one of them must be true' : ''}`, steps: 'Draw the smallest Venn diagram the statements allow, then try to break each conclusion with another valid diagram. A conclusion follows only if no valid diagram breaks it. "Either I or II" applies when neither is certain but they cover every case between the same two terms.', p: [...T, JSON.stringify(prem), JSON.stringify(c1), JSON.stringify(c2)], time: 60, words: true };
}

/* ---------- Data sufficiency (checked by enumeration) ---------- */
function dataSuff(k) {
  const x = k.ri(1, 15), y = k.ri(1, 15);
  const pool = [
    [`x + y = ${x + y}`, (a, b) => a + b === x + y], [`x − y = ${x - y}`, (a, b) => a - b === x - y], [`xy = ${x * y}`, (a, b) => a * b === x * y],
    [`x = ${x - y >= 0 ? `y + ${x - y}` : `y − ${y - x}`}`, (a, b) => a - b === x - y], [`2x + y = ${2 * x + y}`, (a, b) => 2 * a + b === 2 * x + y],
    [`x is ${x % 2 ? 'odd' : 'even'}`, (a) => a % 2 === x % 2], [`x > ${Math.max(0, x - k.ri(1, 3))}`, (a) => a > Math.max(0, x - 0)], [`y = ${y}`, (a, b) => b === y], [`x² = ${x * x}`, (a) => a * a === x * x], [`x is a multiple of ${[2, 3, 5].find((d) => x % d === 0) || 1}`, (a) => a % ([2, 3, 5].find((d) => x % d === 0) || 1) === 0],
  ];
  // fix "x >" clue closure to use the same bound as its text
  const gt = Math.max(0, x - k.ri(1, 3)); pool[6] = [`x > ${gt}`, (a) => a > gt];
  const [s1, s2] = k.pickN(pool, 2); const target = k.pick(['x', 'x + y', 'Is x > y?']);
  const val = (a, b) => (target === 'x' ? a : target === 'x + y' ? a + b : a > b);
  const dom = []; for (let a = 1; a <= 15; a++) for (let b = 1; b <= 15; b++) dom.push([a, b]);
  const suff = (f) => { const s = dom.filter(([a, b]) => f(a, b)); return s.length > 0 && new Set(s.map(([a, b]) => val(a, b))).size === 1; };
  const one = suff(s1[1]), two = suff(s2[1]), both = suff((a, b) => s1[1](a, b) && s2[1](a, b));
  const ans = one && two ? 'Either alone is sufficient' : one ? 'Statement I alone is sufficient' : two ? 'Statement II alone is sufficient' : both ? 'Both together are needed' : 'Both together are not sufficient';
  return { prompt: target.startsWith('Is') ? target : `What is the value of ${target}?`, passage: `x and y are whole numbers from 1 to 15.\n\nI. ${s1[0]}\nII. ${s2[0]}`, ans, opts: ['Statement I alone is sufficient', 'Statement II alone is sufficient', 'Either alone is sufficient', 'Both together are needed', 'Both together are not sufficient'], keepOrder: true, why: `I ${one ? 'fixes' : "doesn't fix"} it; II ${two ? 'fixes' : "doesn't fix"} it${!one && !two ? `; together they ${both ? 'do' : "still don't"}` : ''}`, steps: 'Test each statement alone: can it give only one answer? If neither can, combine them. You never need the actual value, only whether it is pinned down.', p: [s1[0], s2[0], target], time: 70, words: true };
}

/* ---------- Blood relations (family tree) ---------- */
function family(k) {
  const males = k.shuffle(MALE), females = k.shuffle(FEMALE); let mi = 0, fi = 0; const P = [];
  const add = (g) => { const p = { id: P.length, g, name: g === 'm' ? males[mi++] : females[fi++], par: [], sp: null }; P.push(p); return p; };
  const gf = add('m'), gm = add('f'); gf.sp = gm.id; gm.sp = gf.id;
  const kids = Array.from({ length: k.ri(2, 3) }, () => add(k.chance(0.5) ? 'm' : 'f')); kids.forEach((c) => { c.par = [gf.id, gm.id]; });
  kids.forEach((c) => { if (k.chance(0.8)) { const s = add(c.g === 'm' ? 'f' : 'm'); s.sp = c.id; c.sp = s.id; Array.from({ length: k.ri(1, 2) }, () => add(k.chance(0.5) ? 'm' : 'f')).forEach((gc) => { gc.par = [c.id, s.id]; }); } });
  return P;
}
function relation(P, x, y) {
  const X = P[x], Y = P[y]; const m = X.g === 'm'; const w = (a, b) => (m ? a : b);
  const parentsOf = (p) => p.par; const sib = (a, b) => a.id !== b.id && a.par.length && a.par[0] === b.par[0];
  if (X.sp === y) return w('husband', 'wife');
  if (Y.par.includes(x)) return w('father', 'mother');
  if (X.par.includes(y)) return w('son', 'daughter');
  if (sib(X, Y)) return w('brother', 'sister');
  if (Y.par.some((p) => P[p].par.includes(x))) return w('grandfather', 'grandmother');
  if (X.par.some((p) => P[p].par.includes(y))) return w('grandson', 'granddaughter');
  if (Y.par.some((p) => sib(X, P[p]) || (X.sp !== null && sib(P[X.sp], P[p])))) return w('uncle', 'aunt');
  if (X.par.some((p) => sib(Y, P[p]) || (Y.sp !== null && sib(P[Y.sp], P[p])))) return w('nephew', 'niece');
  if (X.par.some((p) => Y.par.some((q) => sib(P[p], P[q])))) return 'cousin';
  if (Y.sp !== null && P[Y.sp].par.includes(x)) return w('father-in-law', 'mother-in-law');
  if (X.sp !== null && P[X.sp].par.includes(y)) return w('son-in-law', 'daughter-in-law');
  if ((Y.sp !== null && sib(X, P[Y.sp])) || (X.sp !== null && sib(P[X.sp], Y))) return w('brother-in-law', 'sister-in-law');
  return null;
}
const BASIC = new Set(['husband', 'wife', 'father', 'mother', 'son', 'daughter', 'brother', 'sister']);
function bloodPuzzle(k, L) {
  const P = family(k); const hops = L <= 2 ? 2 : 3;
  // random walk along basic links
  for (let tries = 0; tries < 60; tries++) {
    const path = [k.ri(0, P.length - 1)];
    for (let h = 0; h < hops; h++) {
      const cur = P[path[path.length - 1]]; const nb = P.filter((p) => !path.includes(p.id) && BASIC.has(relation(P, cur.id, p.id) || '')); if (!nb.length) break; path.push(k.pick(nb).id);
    }
    if (path.length !== hops + 1) continue;
    const x = path[0], y = path[path.length - 1]; const ans = relation(P, x, y); if (!ans || BASIC.has(ans) && L >= 3 && k.chance(0.6)) continue;
    const stmts = []; for (let i = 0; i < path.length - 1; i++) stmts.push(`${P[path[i]].name} is the ${relation(P, path[i], path[i + 1])} of ${P[path[i + 1]].name}.`);
    const m = P[x].g === 'm';
    const pool = m ? ['father', 'brother', 'uncle', 'son', 'grandson', 'nephew', 'cousin', 'grandfather', 'husband', 'father-in-law', 'son-in-law', 'brother-in-law'] : ['mother', 'sister', 'aunt', 'daughter', 'granddaughter', 'niece', 'cousin', 'grandmother', 'wife', 'mother-in-law', 'daughter-in-law', 'sister-in-law'];
    return { prompt: `How is ${P[x].name} related to ${P[y].name}?`, passage: stmts.join('\n'), ans, wrong: pool.filter((r) => r !== ans), why: stmts.map((s) => s.replace(/\.$/, '')).join(' → ').slice(0, 140), steps: `Follow the chain one link at a time:\n${stmts.join('\n')}\nSo ${P[x].name} is ${P[y].name}'s ${ans}.`, p: [path.map((i) => P[i].name).join('>'), ans], time: hops * 15, words: true };
  }
  return null;
}

/* ---------- Conditional logic bank ---------- */
const CONDS = [
  ['If it rains, the match is cancelled.', ['It rained.', 'It did not rain.'], ['The match was cancelled.', 'The match was not cancelled.']],
  ['If Riya studies, she passes the test.', ['Riya studied.', 'Riya did not study.'], ['Riya passed.', 'Riya did not pass.']],
  ['If the alarm rings, Om wakes up.', ['The alarm rang.', 'The alarm did not ring.'], ['Om woke up.', 'Om did not wake up.']],
  ['If the shop is open, its lights are on.', ['The shop is open.', 'The shop is closed.'], ['The lights are on.', 'The lights are off.']],
  ['Whenever the server is down, the app shows an error.', ['The server was down.', 'The server was not down.'], ['The app showed an error.', 'The app showed no error.']],
  ['If a number ends in 0, it is divisible by 5.', ['The number ends in 0.', 'The number does not end in 0.'], ['It is divisible by 5.', 'It is not divisible by 5.']],
  ['If Kabir drinks coffee at night, he can\'t sleep.', ['Kabir drank coffee at night.', 'Kabir did not drink coffee at night.'], ['Kabir could not sleep.', 'Kabir slept.']],
  ['If the train is late, Meera takes a cab.', ['The train was late.', 'The train was on time.'], ['Meera took a cab.', 'Meera did not take a cab.']],
  ['All members who pay the fee get a badge.', ['Neha paid the fee.', 'Neha did not pay the fee.'], ['Neha got a badge.', 'Neha did not get a badge.']],
  ['If the milk is left out, it turns sour.', ['The milk was left out.', 'The milk was not left out.'], ['The milk turned sour.', 'The milk did not turn sour.']],
  ['If the team wins today, it reaches the final.', ['The team won today.', 'The team lost today.'], ['The team reached the final.', 'The team did not reach the final.']],
  ['If the password is wrong, the door stays locked.', ['The password was wrong.', 'The password was right.'], ['The door stayed locked.', 'The door opened.']],
  ['If the plant gets no water, it wilts.', ['The plant got no water.', 'The plant was watered.'], ['The plant wilted.', 'The plant did not wilt.']],
  ['If Dev is in Mumbai, he is in India.', ['Dev is in Mumbai.', 'Dev is not in Mumbai.'], ['Dev is in India.', 'Dev is not in India.']],
];

/* ---------- Critical reasoning bank (statements & conclusions / assumptions / arguments / cause–effect) ---------- */
const CR = [
  ['Statements & Conclusions', 'Statement: "Our café sold out of cold coffee every afternoon this week."', 'Which conclusion follows best?', ['Cold coffee is in demand in the afternoons.', 'The café makes too little hot coffee.', 'Cold coffee is the cheapest item.', 'The café will close next week.'], 'Selling out repeatedly points to demand; the rest are not supported.'],
  ['Statements & Assumptions', 'Statement: "Book your tickets online to skip the queue at the counter."', 'What is assumed?', ['Booking online is faster than waiting at the counter.', 'Nobody uses the counter.', 'Online tickets are cheaper.', 'The counter will shut down soon.'], 'The advice only makes sense if online booking saves time.'],
  ['Statements & Arguments', 'Should mobile phones be banned in classrooms?', 'Which is the strongest argument?', ['Yes, phones distract students during lessons.', 'No, phones are expensive.', 'Yes, everyone else does it.', 'No, students like phones.'], 'A strong argument links directly to learning; the others are weak or irrelevant.'],
  ['Cause & Effect', 'Event I: Onion prices doubled this month.\nEvent II: Heavy rains damaged crops in major growing regions.', 'How are they related?', ['II is the cause and I is the effect.', 'I is the cause and II is the effect.', 'Both are independent.', 'Both are effects of a common cause.'], 'Crop damage cuts supply, which pushes up prices.'],
  ['Statements & Conclusions', 'Statement: "Every employee who completed the training got a certificate. Arjun got no certificate."', 'Which conclusion follows?', ['Arjun did not complete the training.', 'Arjun failed the training.', 'Arjun is not an employee.', 'The training was optional.'], 'If completing → certificate, then no certificate → not completed. (He may or may not be an employee; that isn\'t certain.)'],
  ['Statements & Assumptions', 'Statement: "Add this course to your résumé. Recruiters notice it."', 'What is assumed?', ['Recruiters value this course.', 'The course is free.', 'Everyone has a résumé.', 'Recruiters read every line.'], 'The advice relies on the course being valued by recruiters.'],
  ['Cause & Effect', 'Event I: The city opened three new metro lines.\nEvent II: Daily car traffic on major roads fell by 15%.', 'How are they related?', ['I is the cause and II is the effect.', 'II is the cause and I is the effect.', 'Both are independent.', 'Both are effects of a common cause.'], 'More metro options move commuters out of cars.'],
  ['Statements & Arguments', 'Should all schools teach basic coding?', 'Which is the strongest argument?', ['Yes, it builds problem-solving skills useful in many careers.', 'No, computers are noisy.', 'Yes, coding is fashionable.', 'No, some teachers dislike it.'], 'Only the first gives a relevant, substantial reason.'],
  ['Strengthen / Weaken', 'Claim: "Our new app design increased sign-ups, because sign-ups rose 20% the week it launched."', 'Which statement weakens the claim most?', ['A big advertising campaign also ran that same week.', 'The new design uses brighter colours.', 'Users like modern designs.', 'Sign-ups usually rise slowly.'], 'Another cause in the same week could explain the rise.'],
  ['Strengthen / Weaken', 'Claim: "Short daily practice improves test scores more than one long weekly session."', 'Which statement strengthens the claim most?', ['In a study, students practising 15 minutes daily outscored those doing 2 hours weekly.', 'Many students prefer weekends.', 'Tests are getting harder.', 'Long sessions feel productive.'], 'Direct comparative evidence supports the claim.'],
  ['Statements & Conclusions', 'Statement: "Only students who scored above 80% can join the robotics club. Sana joined the robotics club."', 'Which conclusion follows?', ['Sana scored above 80%.', 'Sana is good at robotics.', 'Sana scored exactly 80%.', 'All students above 80% joined.'], '"Only those above 80% can join" means every member scored above 80%.'],
  ['Statements & Assumptions', 'Statement: "Carry an umbrella; the forecast says rain."', 'What is assumed?', ['The forecast is reasonably reliable.', 'It always rains in the evening.', 'Umbrellas are cheap.', 'Nobody owns a raincoat.'], 'Acting on a forecast assumes it can be trusted.'],
  ['Cause & Effect', 'Event I: The company cut its prices by 30%.\nEvent II: A rival launched a cheaper product last month.', 'How are they related?', ['II is the cause and I is the effect.', 'I is the cause and II is the effect.', 'Both are independent.', 'Both are effects of a common cause.'], 'Cutting prices is a response to cheaper competition.'],
  ['Strengthen / Weaken', 'Claim: "Working from home makes our team less productive."', 'Which statement weakens the claim most?', ['The team completed more tasks per week while working from home.', 'Offices have better coffee.', 'Some people like offices.', 'Home internet can be slow.'], 'Higher output directly contradicts the claim.'],
  ['Statements & Conclusions', 'Statement: "No vegetarian at the party ate the kebabs. Rohan ate the kebabs."', 'Which conclusion follows?', ['Rohan is not a vegetarian.', 'Rohan likes kebabs most.', 'All non-vegetarians ate kebabs.', 'Rohan was not at the party.'], 'If he were vegetarian he couldn\'t have eaten them.'],
  ['Statements & Arguments', 'Should cities make public transport free?', 'Which is the strongest argument against?', ['Without fares, the system may lack money for upkeep and expansion.', 'Buses are sometimes crowded.', 'Some people prefer bikes.', 'Free things are boring.'], 'Funding is a direct, serious consequence.'],
];

export default [
  // ---------------- Series ----------------
  Q({ id: 'l.series.num', sub: 'Number Series', lv: [1, 4], time: 15, gen(k, L) {
    const kinds = ['arith', 'geo', 'gap']; if (L >= 2) kinds.push('sq', 'alt', 'x2c', 'cube'); if (L >= 3) kinds.push('fib', 'sqc', 'mulinc', 'twoser'); if (L >= 4) kinds.push('xnplus', 'diff2', 'prime');
    const kd = k.pick(kinds); let t = []; let why;
    if (kd === 'arith') { const a = k.ri(2, 60), s = k.ri(2, 9 + 4 * L) * (k.chance(0.25) ? -1 : 1); const b = s < 0 ? a + 120 : a; for (let i = 0; i < 6; i++) t.push(b + i * s); why = `${s > 0 ? '+' : '−'}${Math.abs(s)} each time`; }
    else if (kd === 'geo') { const a = k.ri(1, 7), r = k.pick(L > 1 ? [2, 3, 4] : [2, 3]); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * r); why = `×${r} each time`; }
    else if (kd === 'gap') { const a = k.ri(1, 30), s = k.ri(1, 4); let g = k.ri(1, 6); t = [a]; for (let i = 1; i < 6; i++) { t.push(t[i - 1] + g); g += s; } why = `the gap grows by ${s}`; }
    else if (kd === 'sq') { const n = k.ri(1, 12); for (let i = 0; i < 6; i++) t.push((n + i) ** 2); why = 'consecutive squares'; }
    else if (kd === 'sqc') { const n = k.ri(2, 10), c = k.pick([1, -1, 2, 3, -2]); for (let i = 0; i < 6; i++) t.push((n + i) ** 2 + c); why = `squares ${c > 0 ? '+' : '−'} ${Math.abs(c)}`; }
    else if (kd === 'cube') { const n = k.ri(1, 5); for (let i = 0; i < 6; i++) t.push((n + i) ** 3); why = 'consecutive cubes'; }
    else if (kd === 'alt') { const a = k.ri(10, 50), up = k.ri(3, 11), dn = k.ri(1, up - 1); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + (i % 2 ? up : -dn)); why = `+${up}, −${dn} repeating`; }
    else if (kd === 'x2c') { const a = k.ri(1, 8), m = k.pick([2, 3]), c = k.pick([1, 2, 3, -1]); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * m + c); why = `×${m} then ${c > 0 ? '+' : '−'}${Math.abs(c)}`; }
    else if (kd === 'fib') { const a = k.ri(1, 7), b = k.ri(2, 11); t = [a, b]; for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]); t = t.slice(1, 7); why = 'each = sum of the previous two'; }
    else if (kd === 'mulinc') { const a = k.ri(1, 5); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * (i + 1)); why = '×2, ×3, ×4, …'; }
    else if (kd === 'twoser') { const a = k.ri(1, 20), b = k.ri(30, 60), s1 = k.ri(2, 6), s2 = -k.ri(2, 6); t = [a, b, a + s1, b + s2, a + 2 * s1, b + 2 * s2]; why = `two series interleaved: ${s1 > 0 ? '+' : ''}${s1} and ${s2}`; }
    else if (kd === 'xnplus') { const a = k.ri(1, 4); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * 2 + i); why = '×2 + 1, ×2 + 2, ×2 + 3, …'; }
    else if (kd === 'diff2') { const a = k.ri(2, 10); let d = k.ri(1, 3); const r = 2; t = [a]; for (let i = 1; i < 6; i++) { t.push(t[i - 1] + d); d *= r; } why = 'gaps double each time'; }
    else { const P = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61]; const s = k.ri(0, P.length - 6); t = P.slice(s, s + 6); why = 'consecutive primes'; }
    const ans = t[5]; if (Math.abs(ans) > 99999) return null;
    const P5 = t[4]; const dlt = t[5] - t[4];
    const last = {
      arith: `${P5} ${dlt > 0 ? '+' : '−'} ${Math.abs(dlt)} = ${ans}`, geo: `${P5} × ${t[5] / t[4]} = ${ans}`, gap: `gaps ${t.slice(1).map((v, i) => v - t[i]).join(', ')} → ${P5} + ${dlt} = ${ans}`,
      sq: `next is ${Math.round(Math.sqrt(ans))}² = ${ans}`, cube: `next is ${Math.round(Math.cbrt(ans))}³ = ${ans}`, alt: `${P5} + ${dlt} = ${ans}`, x2c: `${P5} × ${(why.match(/×(\d)/) || [])[1]} ${why.includes('+') ? '+' : '−'} ${Math.abs(ans - P5 * Number((why.match(/×(\d)/) || [])[1]))} = ${ans}`,
      fib: `${t[3]} + ${t[4]} = ${ans}`, mulinc: `${P5} × 6 = ${ans}`, twoser: `second series ${t[1]}, ${t[3]} → ${ans}`, xnplus: `${P5} × 2 + 5 = ${ans}`, diff2: `${P5} + ${dlt} = ${ans}`, sqc: `${why.replace('squares', `${Math.round(Math.sqrt(ans - Number(why.replace(/[^0-9]/g, '')) * (why.includes('−') ? -1 : 1)))}²`)} = ${ans}`,
    }[kd] || `next is ${ans}`;
    why = `${why}: ${last}`;
    return { prompt: 'What comes next?', emph: `${t.slice(0, 5).join(', ')}, ?`, ans, wrong: [ans + (t[5] - t[4]), t[4] + (t[4] - t[3]), ans + 1, ans - 1, ans + 2], step: Math.max(2, Math.round(Math.abs(t[5] - t[4]) / 3)), why, p: [kd, ...t], bump: kinds.indexOf(kd) * 12 };
  } }),
  Q({ id: 'l.series.wrong', sub: 'Number Series', lv: [2, 3], time: 30, gen(k) {
    const a = k.ri(2, 20), kd = k.pick(['add', 'mul', 'sq']); let t = [];
    if (kd === 'add') { const s = k.ri(3, 12); for (let i = 0; i < 6; i++) t.push(a + i * s); } else if (kd === 'mul') { const r = k.pick([2, 3]); t = [a]; for (let i = 1; i < 6; i++) t.push(t[i - 1] * r); } else { for (let i = 0; i < 6; i++) t.push((a + i) ** 2); }
    const i = k.ri(1, 5); const bad = t[i] + k.pick([1, 2, -1, -2, 3]); const shown = [...t]; shown[i] = bad; if (new Set(shown).size < 6) return null;
    return { prompt: 'Which number is wrong in the series?', emph: shown.join(', '), ans: bad, opts: [bad, ...k.pickN(shown.filter((_, j) => j !== i), 3)], why: `${kd === 'add' ? `+${t[1] - t[0]} each time` : kd === 'mul' ? `×${t[1] / t[0]} each time` : 'consecutive squares'}, so ${bad} should be ${t[i]}`, p: [kd, ...shown] };
  } }),
  Q({ id: 'l.series.letter', sub: 'Alphabet Series', lv: [1, 3], time: 15, gen(k, L) {
    const kd = k.pick(L >= 3 ? ['fwd', 'back', 'alt', 'grow'] : L === 2 ? ['fwd', 'back', 'alt'] : ['fwd']);
    let steps; let why;
    if (kd === 'fwd') { const s = k.ri(2, 5); steps = Array(5).fill(s); why = `+${s} letters each time`; }
    else if (kd === 'back') { const s = -k.ri(1, 4); steps = Array(5).fill(s); why = `back ${-s} each time`; }
    else if (kd === 'alt') { const a = k.ri(1, 2), b = a + k.ri(1, 2); steps = [a, b, a, b, a]; why = `+${a}, +${b} alternating`; }
    else { steps = [1, 2, 3, 4, 5]; why = 'gaps grow: +1, +2, +3, …'; }
    const total = steps.reduce((x, y) => x + y, 0); const start = total > 0 ? k.ri(0, 25 - total) : k.ri(-total, 25);
    const idx = [start]; steps.forEach((s) => idx.push(idx[idx.length - 1] + s)); const t = idx.map((i) => A[i]); const ans = t[5];
    const opts = new Set([ans]); [1, -1, 2, -2, 3, -3].forEach((o) => { const c = A[idx[5] + o]; if (c && opts.size < 4) opts.add(c); });
    return { prompt: 'What comes next?', emph: `${t.slice(0, 5).join(', ')}, ?`, ans, opts: [...opts], why: `${why}: ${t[4]} (${idx[4] + 1}) ${steps[4] > 0 ? '+' : '−'} ${Math.abs(steps[4])} → ${ans} (${idx[5] + 1})`, p: [kd, ...t] };
  } }),
  Q({ id: 'l.series.alnum', sub: 'Alphanumeric Series', lv: [2, 3], time: 20, gen(k) {
    const ls = k.ri(1, 3), ns = k.ri(2, 5); const l0 = k.ri(1, 24 - 5 * ls), n0 = k.ri(1, 9);
    const t = Array.from({ length: 6 }, (_, i) => `${A[l0 + i * ls]}${n0 + i * ns}`); const ans = t[5];
    return { prompt: 'What comes next?', emph: `${t.slice(0, 5).join(', ')}, ?`, ans, wrong: [`${A[l0 + 5 * ls + 1]}${n0 + 5 * ns}`, `${A[l0 + 5 * ls]}${n0 + 5 * ns + 1}`, `${A[l0 + 5 * ls - 1]}${n0 + 5 * ns}`, `${A[l0 + 5 * ls]}${n0 + 4 * ns}`], why: `letters +${ls} (${A[l0 + 4 * ls]} → ${A[l0 + 5 * ls]}), numbers +${ns} (${n0 + 4 * ns} → ${n0 + 5 * ns}) → ${ans}`, p: [l0, ls, n0, ns] };
  } }),
  Q({ id: 'l.analogy.num', sub: 'Number Analogy', lv: [1, 3], time: 15, gen(k, L) {
    const kd = k.pick(L >= 2 ? ['sq', 'cube', 'mul', 'sqp', 'sqm'] : ['sq', 'mul', 'add']); const f = { sq: (x) => x * x, cube: (x) => x ** 3, sqp: (x) => x * x + 1, sqm: (x) => x * x - x };
    let a = k.ri(2, 9), b = k.ri(3, 12); if (b === a) b++; let fn; let why; if (kd === 'cube') { a = k.ri(2, 5); b = k.ri(3, 7); if (a === b) b++; }
    if (kd === 'mul') { const m = k.ri(3, 9); fn = (x) => x * m; why = `× ${m}`; } else if (kd === 'add') { const m = k.ri(5, 25); fn = (x) => x + m; why = `+ ${m}`; } else { fn = f[kd]; why = { sq: 'square', cube: 'cube', sqp: 'square + 1', sqm: 'n² − n' }[kd]; }
    return { prompt: 'Find the missing number', emph: `${a} : ${fn(a)} :: ${b} : ?`, ans: fn(b), wrong: [fn(b) + 1, fn(b) - b, fn(b + 1), b * a], step: Math.max(2, Math.round(fn(b) / 10)), why: { sq: `${a}² = ${fn(a)}, so ${b}² = ${fn(b)}`, cube: `${a}³ = ${fn(a)}, so ${b}³ = ${fn(b)}`, sqp: `${a}² + 1 = ${fn(a)}, so ${b}² + 1 = ${fn(b)}`, sqm: `${a}² − ${a} = ${fn(a)}, so ${b}² − ${b} = ${fn(b)}` }[kd] || `${a} ${why} = ${fn(a)}, so ${b} ${why} = ${fn(b)}`, p: [kd, a, b, fn(a)] };
  } }),
  Q({ id: 'l.odd.num', sub: 'Odd One Out', lv: [1, 3], time: 15, gen(k, L) {
    const kd = k.pick(L >= 2 ? ['mult', 'sq', 'prime', 'cube', 'digsum'] : ['mult', 'sq', 'even']); let group = []; let odd; let why;
    if (kd === 'mult') { const m = k.pick([3, 4, 6, 7, 8, 9, 11, 13]); while (group.length < 3) { const v = m * k.ri(3, 15); if (!group.includes(v)) group.push(v); } do { odd = k.ri(12, 190); } while (odd % m === 0); why = `the rest are multiples of ${m}`; }
    else if (kd === 'sq') { group = k.pickN([16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225], 3); do { odd = k.ri(20, 230); } while (Number.isInteger(Math.sqrt(odd))); why = 'the rest are perfect squares'; }
    else if (kd === 'prime') { group = k.pickN([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97], 3); odd = k.pick([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93]); why = `the rest are prime; ${odd} isn't`; }
    else if (kd === 'cube') { group = k.pickN([8, 27, 64, 125, 216, 343, 512, 729], 3); odd = k.pick([36, 49, 100, 81, 144, 200, 256]); why = 'the rest are perfect cubes'; }
    else if (kd === 'digsum') { const s = k.ri(8, 14); const mk = () => { for (;;) { const a = k.ri(1, 9), b = s - a; if (b >= 0 && b <= 9) return 10 * a + b; } }; while (group.length < 3) { const v = mk(); if (!group.includes(v)) group.push(v); } do { odd = k.ri(19, 98); } while ((odd % 10) + Math.floor(odd / 10) === s); why = `the rest have digit sum ${s}`; }
    else { while (group.length < 3) { const v = 2 * k.ri(5, 60); if (!group.includes(v)) group.push(v); } odd = 2 * k.ri(5, 60) + 1; why = 'the rest are even'; }
    return { prompt: "Which one doesn't belong?", ans: odd, opts: [...group, odd], why, p: [kd, ...group.sort(), odd] };
  } }),

  // ---------------- Coding–decoding ----------------
  Q({ id: 'l.code', sub: 'Coding-Decoding', lv: [1, 4], time: 22, gen(k, L) {
    const kd = k.pick(L === 1 ? ['shift'] : L === 2 ? ['shift', 'rev', 'opp'] : ['shift', 'revshift', 'opp', 'num', 'pos']);
    const [w1, w2] = k.pickN(CODE_WORDS, 2); const sh = (w, s) => [...w].map((c) => A[(A.indexOf(c) + s + 26) % 26]).join('');
    if (kd === 'num' || kd === 'pos') {
      const val = (w) => (kd === 'num' ? [...w].reduce((a, c) => a + A.indexOf(c) + 1, 0) : [...w].map((c) => A.indexOf(c) + 1).join(''));
      const ans = val(w2); const wrong = kd === 'num' ? [ans + 1, ans - 1, ans + 2, val(w2.slice(1))] : [[...w2].map((c) => A.indexOf(c) + 2).join(''), [...w2].reverse().map((c) => A.indexOf(c) + 1).join(''), [...w2].map((c) => 26 - A.indexOf(c)).join('')];
      return { prompt: `If ${w1} = ${val(w1)}, then ${w2} = ?`, ans: kd === 'num' ? ans : String(ans), wrong: wrong.map(kd === 'num' ? Number : String), why: kd === 'num' ? `Add letter positions: ${[...w2].map((c) => `${c}${A.indexOf(c) + 1}`).join(' + ')} = ${ans}` : `Each letter → its position: ${[...w2].map((c) => `${c}=${A.indexOf(c) + 1}`).join(', ')} → ${ans}`, p: [kd, w1, w2] };
    }
    const s = kd === 'rev' ? 0 : k.chance(0.3) ? -k.ri(1, 3) : k.ri(1, 4);
    const enc = (w) => (kd === 'shift' ? sh(w, s) : kd === 'rev' ? [...w].reverse().join('') : kd === 'revshift' ? sh([...w].reverse().join(''), s) : [...w].map((c) => A[25 - A.indexOf(c)]).join(''));
    const ans = enc(w2); const wrong = [sh(w2, s + 1), sh(w2, s - 1 || -1), [...ans].reverse().join(''), sh(w2, -s), [...w2].reverse().join(''), sh(w2, 2)].filter((x) => x !== ans);
    const why = `${{ shift: `Each letter moves ${s > 0 ? '+' : '−'}${Math.abs(s)} (${w1[0]} → ${enc(w1)[0]})`, rev: `The letters are written in reverse (${w1} → ${enc(w1)})`, revshift: `Reverse the word, then move each letter ${s > 0 ? '+' : '−'}${Math.abs(s)}`, opp: `Each letter → its opposite in the alphabet: A = Z, B = Y … (${w1[0]} → ${enc(w1)[0]})` }[kd]}, so ${w2} → ${ans}`;
    return { prompt: `If ${w1} is coded as ${enc(w1)}, how is ${w2} coded?`, ans, wrong, why, p: [kd, s, w1, w2], words: true };
  } }),

  // ---------------- Blood relations ----------------
  Q({ id: 'l.blood', sub: 'Blood Relations', lv: [2, 4], deep: true, time: 40, gen: bloodPuzzle }),

  // ---------------- Directions ----------------
  Q({ id: 'l.dir.turn', sub: 'Direction Sense', lv: [1, 2], time: 15, gen(k, L) {
    const D4 = ['North', 'East', 'South', 'West']; let f = k.ri(0, 3); const start = D4[f]; const moves = []; const who = k.pick(NAMES);
    for (let i = 0; i < 2 + L; i++) { const m = k.pick(L >= 2 ? ['right', 'left', 'around'] : ['right', 'left']); moves.push(m); f = (f + (m === 'right' ? 1 : m === 'left' ? 3 : 2)) % 4; }
    return { prompt: `${who} faces ${start}, then ${moves.map((m) => (m === 'around' ? 'turns around' : `turns ${m}`)).join(', then ')}. Which way now?`, ans: D4[f], opts: D4, why: (() => { let g = D4.indexOf(start); const path = [start]; moves.forEach((m) => { g = (g + (m === 'right' ? 1 : m === 'left' ? 3 : 2)) % 4; path.push(D4[g]); }); return path.join(' → '); })(), steps: 'Right turn = 90° clockwise, left = 90° anticlockwise, turning around = 180°.', p: [start, ...moves], words: true };
  } }),
  Q({ id: 'l.dir.dist', sub: 'Direction Sense', lv: [2, 3], time: 35, gen(k, L) {
    const T = k.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]); const sx = k.chance(0.5) ? 1 : -1, sy = k.chance(0.5) ? 1 : -1; const dx = sx * T[0], dy = sy * T[1];
    const who = k.pick(NAMES); const legs = [];
    if (L === 2) { legs.push([dy > 0 ? 'North' : 'South', Math.abs(dy)], [dx > 0 ? 'East' : 'West', Math.abs(dx)]); } else { const extra = k.ri(2, 6); legs.push([dy > 0 ? 'North' : 'South', Math.abs(dy) + extra], [dx > 0 ? 'East' : 'West', Math.abs(dx)], [dy > 0 ? 'South' : 'North', extra]); }
    const dirIdx = (Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) / 45) % 8); const ang = (Math.atan2(dx, dy) * 180) / Math.PI; const dir = DIR8[(Math.round(((ang + 360) % 360) / 45) % 8)];
    const askDir = k.chance(0.4);
    if (askDir) { const ans = `${T[2]} km ${dir}`; return { prompt: `${who} walks ${legs.map(([d, n]) => `${n} km ${d}`).join(', then ')}. Where is ${who} now from the start?`, ans, wrong: [`${T[2]} km ${DIR8[(DIR8.indexOf(dir) + 2) % 8]}`, `${T[0] + T[1]} km ${dir}`, `${T[2]} km ${DIR8[(DIR8.indexOf(dir) + 4) % 8]}`, `${T[2] + 1} km ${dir}`], why: `net ${Math.abs(dx)} km ${dx > 0 ? 'E' : 'W'}, ${Math.abs(dy)} km ${dy > 0 ? 'N' : 'S'} → √(${T[0]}² + ${T[1]}²) = ${T[2]}`, p: [dx, dy, legs.length, 'd'], words: true, _: dirIdx }; }
    return { prompt: `${who} walks ${legs.map(([d, n]) => `${n} km ${d}`).join(', then ')}. How far is ${who} from the start?`, ans: T[2], post: ' km', wrong: [T[0] + T[1], legs.reduce((a, [, n]) => a + n, 0), T[2] + 1], why: `Net ${Math.abs(dx)} km ${dx > 0 ? 'East' : 'West'} and ${Math.abs(dy)} km ${dy > 0 ? 'North' : 'South'} → √(${T[0]}² + ${T[1]}²) = ${T[2]} km`, p: [dx, dy, legs.length] };
  } }),

  // ---------------- Ranking & order ----------------
  Q({ id: 'l.rank.pos', sub: 'Ranking', lv: [1, 2], time: 15, gen(k, L) {
    const who = k.pick(NAMES); if (L === 1 || k.chance(0.5)) { const a = k.ri(3, 30), b = k.ri(3, 30); return { prompt: `${who} is ${ord(a)} from the left and ${ord(b)} from the right in a row. How many people are in the row?`, ans: a + b - 1, wrong: [a + b, a + b + 1, a + b - 2], why: `${a} + ${b} − 1 = ${a + b - 1} (${who} is counted in both)`, p: ['row', a, b] }; }
    const n = k.ri(20, 60), r = k.ri(3, n - 3); return { prompt: `In a class of ${n}, ${who} ranks ${ord(r)} from the top. Rank from the bottom?`, ans: n - r + 1, wrong: [n - r, n - r + 2, r + 1], why: `${n} − ${r} + 1 = ${n - r + 1}`, p: ['class', n, r] };
  } }),
  Q({ id: 'l.rank.order', sub: 'Ranking', lv: [1, 3], time: 20, gen(k, L) {
    const n = L >= 3 ? 5 : 4; const ppl = k.pickN(NAMES, n); const [more, less, top, bottom] = k.pick([['taller', 'shorter', 'tallest', 'shortest'], ['older', 'younger', 'oldest', 'youngest'], ['richer', 'poorer', 'richest', 'poorest'], ['faster', 'slower', 'fastest', 'slowest'], ['heavier', 'lighter', 'heaviest', 'lightest']]);
    const facts = []; for (let i = 0; i < n - 1; i++) facts.push(k.chance(0.5) ? `${ppl[i]} is ${more} than ${ppl[i + 1]}` : `${ppl[i + 1]} is ${less} than ${ppl[i]}`);
    const t = k.pick(L >= 2 ? ['top', 'bottom', 'second'] : ['top', 'bottom']); const ans = t === 'top' ? ppl[0] : t === 'bottom' ? ppl[n - 1] : ppl[1];
    return { prompt: `${k.shuffle(facts).join('. ')}.\nWho is ${t === 'top' ? `the ${top}` : t === 'bottom' ? `the ${bottom}` : `second ${top}`}?`, ans, wrong: ppl.filter((x) => x !== ans), why: `Chain the facts: ${ppl.join(' > ')} (each ${more} than the next) → ${ans}`, p: [...ppl, t], words: true };
  } }),

  // ---------------- Arrangements, scheduling, distribution ----------------
  Q({ id: 'l.seat.linear', sub: 'Linear Arrangement', lv: [3, 4], fast: false, deep: true, gen: (k, L) => linearPuzzle(k, L >= 4 ? 6 : 5, 'row') }),
  Q({ id: 'l.seat.circular', sub: 'Circular Arrangement', lv: [3, 4], fast: false, deep: true, gen: (k, L) => circularPuzzle(k, L >= 4 ? 6 : 5) }),
  Q({ id: 'l.schedule', sub: 'Scheduling', lv: [3, 4], fast: false, deep: true, gen: (k, L) => linearPuzzle(k, L >= 4 ? 6 : 5, 'days') }),
  Q({ id: 'l.distribution', sub: 'Distribution Puzzles', lv: [4, 4], fast: false, deep: true, gen: (k) => distribution(k) }),
  Q({ id: 'l.select', sub: 'Selection & Grouping', lv: [3, 4], fast: false, deep: true, gen(k) {
    const ppl = k.pickN(NAMES, 6); const [a, b, c, d, e] = ppl; const cons = [];
    const types = k.shuffle([
      [`${a} and ${b} cannot both be chosen.`, (s) => !(s.includes(a) && s.includes(b))],
      [`If ${c} is chosen, ${d} must also be chosen.`, (s) => !s.includes(c) || s.includes(d)],
      [`At least one of ${e} and ${a} must be chosen.`, (s) => s.includes(e) || s.includes(a)],
      [`${d} and ${e} cannot both be chosen.`, (s) => !(s.includes(d) && s.includes(e))],
      [`If ${b} is chosen, ${c} cannot be chosen.`, (s) => !s.includes(b) || !s.includes(c)],
    ]).slice(0, k.ri(3, 4));
    types.forEach((t) => cons.push(t));
    const teams = []; for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) for (let l = j + 1; l < 6; l++) teams.push([ppl[i], ppl[j], ppl[l]]);
    const ok = teams.filter((t) => cons.every((c2) => c2[1](t))); const bad = teams.filter((t) => !cons.every((c2) => c2[1](t)));
    if (!ok.length || bad.length < 3) return null; const right = k.pick(ok).join(', '); const wrongs = k.pickN(bad, 3).map((t) => t.join(', '));
    return { prompt: 'Which team of 3 is possible?', passage: `A team of 3 is picked from ${ppl.join(', ')}.\n\n${cons.map((c2) => `• ${c2[0]}`).join('\n')}`, ans: right, opts: [right, ...wrongs], why: `${right} satisfies every rule; each other team breaks at least one`, steps: 'Check each option against every rule; reject it at the first rule it breaks.', p: [ppl.join(), cons.map((x) => x[0]).join(), right], time: 90, words: true };
  } }),

  // ---------------- Syllogism, DS, deductions ----------------
  Q({ id: 'l.syl.quick', sub: 'Syllogisms', lv: [2, 2], time: 25, gen: (k) => syllogism(k, 2) }),
  Q({ id: 'l.syl', sub: 'Syllogisms', lv: [3, 4], fast: false, deep: true, gen: (k) => syllogism(k, 3) }),
  Q({ id: 'l.ds', sub: 'Data Sufficiency', lv: [3, 4], fast: false, deep: true, gen: dataSuff }),
  Q({ id: 'l.cond', sub: 'Conditional Logic', lv: [2, 3], time: 25, gen(k) {
    const [rule, Pp, Qq] = k.pick(CONDS); const form = k.pick(['mp', 'mt', 'ac', 'da']);
    const fact = { mp: Pp[0], mt: Qq[1], ac: Qq[0], da: Pp[1] }[form]; const ans = { mp: Qq[0], mt: Pp[1], ac: 'Cannot be determined', da: 'Cannot be determined' }[form];
    const opts = form === 'mp' || form === 'da' ? [Qq[0], Qq[1], Pp[1], 'Cannot be determined'] : [Pp[0], Pp[1], Qq[1], 'Cannot be determined'];
    const why = { mp: 'the "if" part happened, so the result follows', mt: 'the result didn\'t happen, so the cause couldn\'t have', ac: 'the result could have other causes', da: 'the result could still happen another way' }[form];
    return { prompt: `${rule}\n${fact}\n\nWhat must be true?`, ans, opts: [...new Set(opts)], why, p: [rule, form], words: true };
  } }),
  Q({ id: 'l.critical', sub: 'Critical Reasoning', lv: [2, 3], fast: false, deep: true, time: 50, gen(k) {
    const [sub, stem, ask, opts, why] = k.pick(CR);
    return { prompt: ask, passage: `${sub}\n\n${stem}`, ans: opts[0], opts, why, p: [stem], words: true };
  } }),

  // ---------------- Clocks & calendars ----------------
  Q({ id: 'l.clock', sub: 'Clocks', lv: [1, 3], time: 20, gen(k, L) {
    const h = k.ri(1, 12); const m = L === 1 ? 0 : L === 2 ? k.pick([0, 30]) : 2 * k.ri(1, 29); let a = Math.abs(30 * h - 5.5 * m); a = Math.min(a, 360 - a);
    return { prompt: 'Angle between the clock hands at', emph: `${h}:${String(m).padStart(2, '0')}`, ans: a, post: '°', wrong: [Math.abs(30 * h - 6 * m) % 360, a + 30, a - 15, 180 - a].filter((v) => v >= 0 && v <= 180), step: 15, why: `|30 × ${h} − 5.5 × ${m}| = |${30 * h} − ${5.5 * m}| = ${Math.abs(30 * h - 5.5 * m)}°${Math.abs(30 * h - 5.5 * m) > 180 ? ` → smaller angle 360 − ${Math.abs(30 * h - 5.5 * m)} = ${a}°` : ''}`, steps: 'Hour hand: 30° per hour + 0.5° per minute. Minute hand: 6° per minute. Subtract and take the smaller angle.', p: [h, m] };
  } }),
  Q({ id: 'l.clock.mirror', sub: 'Clocks', lv: [2, 3], time: 25, gen(k) {
    const h = k.ri(1, 11), m = 5 * k.ri(1, 11); let tot = 12 * 60 - (h * 60 + m); const rh = Math.floor(tot / 60) || 12, rm = tot % 60; const f = (a, b) => `${a}:${String(b).padStart(2, '0')}`;
    const ans = f(rh, rm);
    return { prompt: 'A clock seen in a mirror shows this time. What is the actual time?', emph: f(h, m), ans, wrong: [f(12 - h, m), f(rh, (60 - rm) % 60), f(h, 60 - m), f((rh % 12) + 1, rm), f(rh, (rm + 30) % 60), f(((rh + 10) % 12) + 1, rm)].filter((x) => x !== ans), why: `12:00 − ${f(h, m)} = ${ans}`, p: [h, m] };
  } }),
  Q({ id: 'l.calendar', sub: 'Calendars', lv: [1, 3], time: 20, gen(k, L) {
    if (L <= 2) { const t = k.ri(0, 6); const n = L === 1 ? k.ri(2, 20) : k.ri(30, 400); return { prompt: `Today is ${DAYS[t]}. What day will it be after ${n} days?`, ans: DAYS[(t + n) % 7], wrong: DAYS, why: `${n} = 7 × ${Math.floor(n / 7)} + ${n % 7} → ${n % 7} day${n % 7 === 1 ? '' : 's'} after ${DAYS[t]} is ${DAYS[(t + n) % 7]}`, p: [t, n], words: true }; }
    const y = k.ri(2001, 2031); const m = k.ri(1, 11); const d = k.ri(1, 28); const d0 = new Date(Date.UTC(y, 0, 1)); const d1 = new Date(Date.UTC(y, m, d)); const w0 = (d0.getUTCDay() + 6) % 7, w1 = (d1.getUTCDay() + 6) % 7; const diff = Math.round((d1 - d0) / 86400000);
    return { prompt: `1 January ${y} was a ${DAYS[w0]}. What day was ${d} ${MONTHS[m]} ${y}?`, ans: DAYS[w1], wrong: DAYS, why: `${diff} days later; ${diff} mod 7 = ${diff % 7} → ${diff % 7} day${diff % 7 === 1 ? '' : 's'} after ${DAYS[w0]} is ${DAYS[w1]}`, steps: `Count days from 1 Jan to ${d} ${MONTHS[m]} (${y % 4 === 0 ? 'leap year: Feb has 29' : 'Feb has 28'}): ${diff}. ${diff} mod 7 = ${diff % 7}, so move ${diff % 7} days ahead of ${DAYS[w0]}.`, p: [y, m, d], words: true };
  } }),
  // ---------------- Coded inequalities (bank exams) ----------------
  Q({ id: 'l.ineq', sub: 'Coded Inequalities', lv: [2, 4], time: 35, gen(k, L) {
    const n = L >= 4 ? 6 : 5; const letters = k.pickN('ABCDEFGHJKLMNPQRSTUVWXYZ'.split(''), n);
    const signs = Array.from({ length: n - 1 }, () => k.pick(['>', '≥', '=', '<', '≤', '>', '<']));
    if (signs.every((x) => x === '=')) return null;
    // relation between positions i < j: '>', '≥', '=', '<', '≤' or null (no relation)
    const rel = (i, j) => { const seg = signs.slice(i, j); const up = seg.some((x) => x === '>' || x === '≥'); const dn = seg.some((x) => x === '<' || x === '≤'); if (up && dn) return null; if (!up && !dn) return '='; if (up) return seg.includes('>') ? '>' : '≥'; return seg.includes('<') ? '<' : '≤'; };
    const flip = { '>': '<', '<': '>', '≥': '≤', '≤': '≥', '=': '=' };
    const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) pairs.push([i, j]);
    // a conclusion "X op Y" that clearly follows or clearly doesn't (never the debatable '≥' after a strict '>')
    const concl = (i, j, wantTrue) => {
      const r = rel(i, j); const swap = k.chance(0.5); const X = swap ? letters[j] : letters[i], Y = swap ? letters[i] : letters[j]; const R = r && swap ? flip[r] : r;
      if (wantTrue) { if (!R) return null; return { text: `${X} ${R} ${Y}`, ok: true, X, Y, R }; }
      const choices = R == null ? ['>', '<', '=', '≥', '≤'] : { '>': ['<', '=', '≤'], '<': ['>', '=', '≥'], '=': ['>', '<'], '≥': ['<', '≤', '>', '='], '≤': ['>', '≥', '<', '='] }[R];
      return { text: `${X} ${k.pick(choices)} ${Y}`, ok: false, X, Y, R };
    };
    const [p1, p2] = k.pickN(pairs, 2); if (!p1 || !p2) return null;
    let c1, c2, either = false;
    const ge = pairs.filter(([i, j]) => rel(i, j) === '≥' || rel(i, j) === '≤');
    if (ge.length && k.chance(0.22)) { // complementary pair: X > Y and X = Y when only X ≥ Y is known
      const [i, j] = k.pick(ge); const r = rel(i, j); const X = r === '≥' ? letters[i] : letters[j], Y = r === '≥' ? letters[j] : letters[i];
      c1 = { text: `${X} > ${Y}`, ok: false }; c2 = { text: `${X} = ${Y}`, ok: false }; if (k.chance(0.5)) [c1, c2] = [c2, c1]; either = true;
    } else { c1 = concl(p1[0], p1[1], k.chance(0.5)); c2 = concl(p2[0], p2[1], k.chance(0.5)); }
    if (!c1 || !c2) return null;
    const ans = either ? 'Either I or II follows' : c1.ok && c2.ok ? 'Both follow' : c1.ok ? 'Only I follows' : c2.ok ? 'Only II follows' : 'Neither follows';
    const chain = letters.map((x, i) => (i ? `${signs[i - 1]} ${x}` : x)).join(' ');
    const ex = (c) => { const [X, , Y] = c.text.split(' '); const i = letters.indexOf(X), j = letters.indexOf(Y); const r = i < j ? rel(i, j) : rel(j, i) && flip[rel(j, i)]; return `${X} ${r || '?'} ${Y}${r ? '' : ' (signs point both ways: no relation)'}`; };
    return { prompt: 'Which conclusion(s) follow?', passage: `Statement: ${chain}\n\nConclusions:\nI. ${c1.text}\nII. ${c2.text}`, ans, opts: ['Only I follows', 'Only II follows', 'Either I or II follows', 'Neither follows', 'Both follow'], keepOrder: true, why: either ? `${ex(c1).replace(/ \(.*/, '')} is all we know, so exactly one of "${c1.text}" and "${c2.text}" must be true → Either` : `From the chain: I → ${ex(c1)}; II → ${ex(c2)} → ${ans}`, steps: 'Read the signs between the two letters. All pointing the same way: the strongest sign wins (any > makes it >). Signs pointing both ways (> and <): no relation. When only ≥ is known, "X > Y" and "X = Y" together make an Either pair.', p: [chain, c1.text, c2.text] };
  } }),
];
