/* Data interpretation templates — data is generated, every answer is computed from it */
const Q = (o) => ({ cat: 'di', fast: false, deep: true, lv: [2, 3], ...o });
const STORES = ['Pune', 'Delhi', 'Goa', 'Jaipur', 'Kochi', 'Indore', 'Surat', 'Mysuru', 'Nagpur', 'Bhopal'];
const PRODUCTS = ['Phones', 'Laptops', 'Tablets', 'Watches', 'Speakers', 'Cameras', 'Earbuds'];
const BUDGET = ['Rent', 'Food', 'Travel', 'Savings', 'Fun', 'Bills', 'Shopping', 'Health'];
const YEARS = (k, n) => { const s = k.ri(2016, 2025 - n); return Array.from({ length: n }, (_, i) => String(s + i)); };
const sum = (a) => a.reduce((x, y) => x + y, 0);

export default [
  Q({ id: 'd.bar.quick', sub: 'Bar Graphs', lv: [1, 2], fast: true, deep: false, time: 18, gen(k, L) {
    const labels = k.pickN(STORES, 5); const unit = k.pick([10, 5, 20]); const values = k.pickN(Array.from({ length: 17 }, (_, i) => unit * (i + 2)), 5);
    const t = k.pick(L === 1 ? ['max', 'diff2'] : ['range', 'total', 'second', 'diff2']); const s = [...values].sort((a, b) => b - a);
    const vis = { kind: 'bar', title: `Orders per day by city`, labels, values };
    if (t === 'max') { const ans = labels[values.indexOf(s[0])]; return { prompt: 'Which city has the most orders?', ans, wrong: labels, vis, why: `${ans}: ${s[0]}`, p: [t, ...values, ...labels] }; }
    if (t === 'second') { const ans = labels[values.indexOf(s[1])]; return { prompt: 'Which city is second highest?', ans, wrong: labels, vis, why: `${ans}: ${s[1]}`, p: [t, ...values, ...labels] }; }
    if (t === 'range') return { prompt: 'Highest minus lowest?', ans: s[0] - s[4], wrong: [s[0] - s[3], s[1] - s[4], s[0]], step: unit, vis, why: `${s[0]} − ${s[4]}`, p: [t, ...values] };
    if (t === 'total') return { prompt: 'Total orders across all five cities?', ans: sum(values), wrong: [sum(values) + unit, sum(values) - unit, sum(values) - s[4]], step: unit, vis, why: values.join(' + '), p: [t, ...values] };
    const [i, j] = k.pickN([0, 1, 2, 3, 4], 2); if (values[i] === values[j]) return null; const ans = Math.abs(values[i] - values[j]);
    return { prompt: `How many more orders does ${values[i] > values[j] ? labels[i] : labels[j]} get than ${values[i] > values[j] ? labels[j] : labels[i]}?`, ans, wrong: [ans + unit, Math.abs(ans - unit) || 2 * unit, values[i] + values[j]], step: unit, vis, why: `${Math.max(values[i], values[j])} − ${Math.min(values[i], values[j])}`, p: [t, ...values, i, j] };
  } }),
  Q({ id: 'd.bar.pct', sub: 'Bar Graphs', lv: [2, 3], fast: true, time: 35, gen(k) {
    const years = YEARS(k, 5); const vals = [50 * k.ri(4, 16)]; for (let i = 1; i < 5; i++) { const p = k.pick([-20, -10, 10, 20, 25, 50, -25]); const v = vals[i - 1] * (1 + p / 100); vals.push(Number.isInteger(v) ? v : vals[i - 1] + 50); }
    const i = k.ri(0, 3); const j = k.ri(i + 1, 4); const ch = ((vals[j] - vals[i]) / vals[i]) * 100; if (!Number.isInteger(ch * 2)) return null;
    return { prompt: `Percent change in revenue from ${years[i]} to ${years[j]}?`, ans: ch, post: '%', wrong: [((vals[j] - vals[i]) / vals[j]) * 100, ch + 10, -ch, ch - 5].map((x) => Math.round(x * 10) / 10), step: 5, vis: { kind: 'bar', title: 'Revenue (₹ lakh)', labels: years, values: vals }, why: `(${vals[j]} − ${vals[i]}) ÷ ${vals[i]} × 100`, steps: 'Percent change is always measured against the starting (earlier) value.', p: [...vals, i, j] };
  } }),
  Q({ id: 'd.table', sub: 'Tables', lv: [2, 4], time: 60, gen(k, L) {
    const years = YEARS(k, 4); const prods = k.pickN(PRODUCTS, 3); const grid = years.map(() => prods.map(() => 10 * k.ri(5, 60)));
    const vis = { kind: 'table', title: 'Units sold (thousands)', head: ['Year', ...prods], rows: years.map((y, i) => [y, ...grid[i]]) };
    const t = k.pick(L === 2 ? ['colsum', 'yearmax', 'avg'] : L === 3 ? ['ratio', 'pctshare', 'avg', 'yearmax'] : ['growthmax', 'ratio', 'pctshare']);
    const col = k.ri(0, 2);
    if (t === 'colsum') { const ans = sum(grid.map((r) => r[col])); return { prompt: `Total ${prods[col]} sold over the four years?`, ans, wrong: [ans + 10, ans - 10, sum(grid[0])], step: 10, vis, why: grid.map((r) => r[col]).join(' + '), p: [t, col, ...grid.flat()] }; }
    if (t === 'yearmax') { const tots = grid.map(sum); const ans = years[tots.indexOf(Math.max(...tots))]; if (tots.filter((x) => x === Math.max(...tots)).length > 1) return null; return { prompt: 'In which year were total units sold the highest?', ans, wrong: years, vis, why: years.map((y, i) => `${y}: ${tots[i]}`).join(', '), p: [t, ...grid.flat()] }; }
    if (t === 'avg') { const v = grid.map((r) => r[col]); const ans = sum(v) / 4; if (!Number.isInteger(ans * 2)) return null; return { prompt: `Average yearly sales of ${prods[col]}?`, ans, wrong: [ans + 5, ans - 5, sum(v) / 3].map((x) => Math.round(x * 10) / 10), step: 5, vis, why: `${sum(v)} ÷ 4`, p: [t, col, ...grid.flat()] }; }
    if (t === 'ratio') { const [a, b] = k.pickN([0, 1, 2], 2); const A2 = sum(grid.map((r) => r[a])), B = sum(grid.map((r) => r[b])); const g = gcdf(A2, B); const ans = `${A2 / g}:${B / g}`; if (A2 / g > 99 || B / g > 99) return null; return { prompt: `Ratio of total ${prods[a]} to total ${prods[b]} sold?`, ans, wrong: [`${B / g}:${A2 / g}`, `${A2 / g + 1}:${B / g}`, `${A2 / g}:${B / g + 1}`], vis, why: `${A2} : ${B} = ${ans}`, p: [t, a, b, ...grid.flat()] }; }
    if (t === 'pctshare') { const yi = k.ri(0, 3); const tot = sum(grid[yi]); const share = (grid[yi][col] / tot) * 100; const ans = Math.round(share); return { prompt: `In ${years[yi]}, ${prods[col]} were about what percent of all units sold?`, ans, post: '%', wrong: [ans + 7, ans - 6, Math.round((grid[yi][col] / sum(grid.map((r) => r[col]))) * 100), ans + 13].filter((x) => x > 0 && x < 100), step: 4, vis, why: `${grid[yi][col]} ÷ ${tot} × 100 ≈ ${share.toFixed(1)}%`, p: [t, yi, col, ...grid.flat()], bump: 40 }; }
    const g = prods.map((_, c) => (grid[3][c] - grid[0][c]) / grid[0][c]); const best = g.indexOf(Math.max(...g)); if (g.filter((x) => Math.abs(x - g[best]) < 0.02).length > 1) return null;
    return { prompt: `Which product grew the most in percentage terms from ${years[0]} to ${years[3]}?`, ans: prods[best], wrong: prods, vis, why: prods.map((p, c) => `${p}: ${(g[c] * 100).toFixed(0)}%`).join(', '), steps: 'Compare growth relative to each product\'s own starting value, not the absolute increase.', p: [t, ...grid.flat()], bump: 60 };
  } }),
  Q({ id: 'd.line', sub: 'Line Graphs', lv: [2, 3], fast: true, time: 30, gen(k, L) {
    const years = YEARS(k, 5); const inc = years.map(() => 5 * k.ri(8, 24)); const exp = inc.map((v) => v - 5 * k.ri(1, 7)); const save = inc.map((v, i) => v - exp[i]);
    const vis = { kind: 'line', title: 'Family budget (₹ thousand)', labels: years, series: [{ name: 'Income', values: inc }, { name: 'Spending', values: exp }] };
    const t = k.pick(L === 2 ? ['saveyear', 'gap'] : ['savemax', 'avginc', 'saveyear']);
    if (t === 'gap' || t === 'saveyear') { const i = k.ri(0, 4); return { prompt: `How much was saved in ${years[i]}? (income − spending)`, ans: save[i], post: 'k', pre: '₹', wrong: [save[i] + 5, save[i] - 5 || save[i] + 10, inc[i]], step: 5, vis, why: `${inc[i]} − ${exp[i]}`, p: [t, i, ...inc, ...exp] }; }
    if (t === 'savemax') { const m = Math.max(...save); if (save.filter((x) => x === m).length > 1) return null; const ans = years[save.indexOf(m)]; return { prompt: 'In which year were savings the highest?', ans, wrong: years, vis, why: years.map((y, i) => `${y}: ${save[i]}`).join(', '), p: [t, ...inc, ...exp] }; }
    const ans = sum(inc) / 5; return { prompt: 'Average yearly income over the five years?', ans, pre: '₹', post: 'k', wrong: [ans + 5, ans - 5, sum(exp) / 5], step: 5, vis, why: `${sum(inc)} ÷ 5`, p: [t, ...inc] };
  } }),
  Q({ id: 'd.pie', sub: 'Pie Charts', lv: [2, 3], fast: true, time: 28, gen(k, L) {
    const labels = k.pickN(BUDGET, 6); const units = labels.map(() => 1); for (let u = 6; u < 20; u++) units[k.ri(0, 5)] += 1; const pcts = units.map((x) => 5 * x);
    const total = 1000 * k.pick([20, 40, 50, 60, 80, 100, 120]); const vis = { kind: 'pie', title: `Monthly spend · total ₹${k.fmtIN(total)}`, labels, values: pcts };
    const t = k.pick(L === 2 ? ['amt', 'angle'] : ['diff', 'angle', 'amt']); const [i, j] = k.pickN([0, 1, 2, 3, 4], 2);
    if (t === 'amt') { const ans = (pcts[i] * total) / 100; return { prompt: `How much goes to ${labels[i]}?`, ans, pre: '₹', wrong: [(pcts[j] * total) / 100, ans + total / 20, ans * 2], step: total / 20, vis, why: `${pcts[i]}% of ₹${k.fmtIN(total)}`, p: [t, i, total, ...pcts] }; }
    if (t === 'angle') { const ans = pcts[i] * 3.6; return { prompt: `Central angle of the ${labels[i]} slice?`, ans, post: '°', wrong: [pcts[i] * 3, pcts[i] * 4, ans + 18], step: 18, vis, why: `${pcts[i]}% × 360° = ${ans}°`, p: [t, i, ...pcts] }; }
    if (pcts[i] === pcts[j]) return null; const ans = (Math.abs(pcts[i] - pcts[j]) * total) / 100;
    return { prompt: `Difference between ${labels[i]} and ${labels[j]} spending?`, ans, pre: '₹', wrong: [ans + total / 20, ((pcts[i] + pcts[j]) * total) / 100, Math.abs(pcts[i] - pcts[j]) * 100], step: total / 20, vis, why: `${Math.abs(pcts[i] - pcts[j])}% of ₹${k.fmtIN(total)}`, p: [t, i, j, total, ...pcts] };
  } }),
  Q({ id: 'd.caselet', sub: 'Caselets', lv: [3, 4], time: 80, gen(k, L) {
    const N = 100 * k.ri(6, 30); const g = k.pick([30, 40, 45, 50, 55, 60]); const sg = k.pick([20, 25, 30, 40, 50]); const sb = k.pick([20, 30, 40, 50, 60]); const G = (N * g) / 100, B = N - G; const SG = (G * sg) / 100, SB = (B * sb) / 100; if (![G, SG, SB].every(Number.isInteger)) return null;
    const t = k.pick(L === 3 ? ['sci', 'boysnot'] : ['sciPct', 'ratio']);
    const passage = `A college has ${k.fmtIN(N)} students, of whom ${g}% are girls. ${sg}% of the girls and ${sb}% of the boys study Science. Everyone else studies Commerce.`;
    if (t === 'sci') return { prompt: 'How many students study Science?', passage, ans: SG + SB, wrong: [((sg + sb) / 2 / 100) * N, SG + SB + 20, SG * 2, N - SG - SB], step: 10, why: `${SG} girls + ${SB} boys`, steps: `Girls = ${G}, boys = ${B}. Science girls = ${sg}% of ${G} = ${SG}; Science boys = ${sb}% of ${B} = ${SB}. Total = ${SG + SB}.`, p: [t, N, g, sg, sb] };
    if (t === 'boysnot') return { prompt: 'How many boys study Commerce?', passage, ans: B - SB, wrong: [SB, G - SG, B - SB + 10, B], step: 10, why: `${B} boys − ${SB} in Science`, p: [t, N, g, sg, sb] };
    if (t === 'ratio') { const gg = gcdf(SG, SB); if (!gg) return null; const ans = `${SG / gg}:${SB / gg}`; return { prompt: 'Ratio of Science girls to Science boys?', passage, ans, wrong: [`${SB / gg}:${SG / gg}`, `${sg}:${sb}`, `${g}:${100 - g}`, `${SG / gg + 1}:${SB / gg}`, `${SG / gg}:${SB / gg + 1}`].filter((x) => x !== ans), why: `${SG} : ${SB}`, p: [t, N, g, sg, sb] }; }
    const pct = ((SG + SB) / N) * 100; if (!Number.isInteger(pct * 2)) return null;
    return { prompt: 'What percent of all students study Science?', passage, ans: pct, post: '%', wrong: [(sg + sb) / 2, pct + 5, pct - 5], step: 2.5, why: `(${SG} + ${SB}) ÷ ${N} × 100`, steps: 'Weighted average: the girls\' and boys\' percentages weigh by their group sizes, so the simple average is a trap.', p: [t, N, g, sg, sb] };
  } }),
  Q({ id: 'd.missing', sub: 'Missing Data', lv: [3, 4], time: 60, gen(k) {
    const labels = k.pickN(STORES, 4); const vals = labels.map(() => 10 * k.ri(8, 60)); const tot = sum(vals); const mi = k.ri(0, 3); const shown = vals.map((v, i) => (i === mi ? '?' : v));
    const avg = tot / 4; if (!Number.isInteger(avg)) return null;
    const vis = { kind: 'table', title: 'Monthly deliveries', head: ['City', 'Deliveries'], rows: [...labels.map((l, i) => [l, shown[i]]), ['Average', avg]] };
    return { prompt: `The average for the four cities is shown. Deliveries in ${labels[mi]}?`, ans: vals[mi], wrong: [avg, tot - avg * 3, vals[mi] + 10, vals[mi] - 10].filter((x) => x > 0), step: 10, vis, why: `${avg} × 4 − (others) = ${vals[mi]}`, steps: `Total = average × 4 = ${tot}. Subtract the three known values.`, p: [mi, ...vals] };
  } }),
  Q({ id: 'd.compare', sub: 'Comparative DI', lv: [3, 4], time: 60, gen(k) {
    const years = YEARS(k, 4); const a = years.map(() => 10 * k.ri(4, 20)); const b = years.map(() => 10 * k.ri(4, 20)); const [na, nb] = k.pickN(['Brand A', 'Brand B', 'Brand X', 'Brand Y'], 2);
    const vis = { kind: 'bar', title: 'Sales (₹ crore)', labels: years, series: [{ name: na, values: a }, { name: nb, values: b }] };
    const t = k.pick(['count', 'ratio']);
    if (t === 'count') { const ans = a.filter((v, i) => v > b[i]).length; return { prompt: `In how many years did ${na} outsell ${nb}?`, ans, opts: [0, 1, 2, 3, 4], vis, why: years.map((y, i) => `${y}: ${a[i]} vs ${b[i]}`).join(', '), p: [t, ...a, ...b] }; }
    const A2 = sum(a), B = sum(b); const g = gcdf(A2, B); const ans = `${A2 / g}:${B / g}`; if (A2 / g > 60 || A2 === B) return null;
    return { prompt: `Ratio of ${na}'s total sales to ${nb}'s?`, ans, wrong: [`${B / g}:${A2 / g}`, `${A2 / g + 1}:${B / g}`, `${a[0] / gcdf(a[0], b[0])}:${b[0] / gcdf(a[0], b[0])}`].filter((x) => x !== ans), vis, why: `${A2} : ${B}`, p: [t, ...a, ...b] };
  } }),
  Q({ id: 'd.multi', sub: 'Multi-step DI', lv: [4, 4], time: 100, gen(k) {
    const labels = k.pickN(BUDGET.filter((x) => x !== 'Savings'), 4); const pcts = labels.map(() => 5 * k.ri(3, 6)); const save = 100 - sum(pcts); if (save < 5) return null; labels.push('Savings'); pcts.push(save);
    const inc = 10000 * k.ri(4, 15); const r = k.pick([10, 20, 25]); const i = k.ri(0, 3);
    const next = (inc * (1 + r / 100) * pcts[i]) / 100; if (!Number.isInteger(next)) return null;
    return { prompt: `Next year income rises ${r}% and the share for each item stays the same. How much more will go to ${labels[i]}?`, ans: next - (inc * pcts[i]) / 100, pre: '₹', wrong: [next, (inc * r) / 100, ((inc * r) / 100) * (pcts[4] / 100)], step: 500, vis: { kind: 'pie', title: `Income ₹${k.fmtIN(inc)} / month`, labels, values: pcts }, why: `${pcts[i]}% of the extra ₹${k.fmtIN((inc * r) / 100)}`, steps: `Extra income = ${r}% of ${inc} = ${(inc * r) / 100}. ${labels[i]} keeps a ${pcts[i]}% share of it.`, p: [inc, r, i, ...pcts] };
  } }),
];
function gcdf(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
