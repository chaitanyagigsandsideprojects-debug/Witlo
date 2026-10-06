/* Per-user question history + category performance.
   Stored on the device as one compact JSON blob. */
const DAY0 = Date.UTC(2026, 0, 1);
const today = () => Math.floor((Date.now() - DAY0) / 86400000);
const MAX = 15000; const NEAR_WINDOW = 500;

export class QHistory {
  constructor(data) {
    const d = data || {};
    this.seen = new Map(d.seen || []); // id -> [firstDay, lastDay, attempts, correct]
    this.near = d.near || []; // recent near-duplicate keys
    this.nearSet = new Set(this.near);
    this.cats = d.cats || {}; // cat -> { a, c, t, skill }
    this.subs = d.subs || {}; // "cat|sub" -> { a, c }
    this.total = d.total || 0;
  }
  has(id) { return this.seen.has(id); }
  nearSeen(near) { return this.nearSet.has(near); }
  // mark shown (call when a question is displayed)
  shown(q) {
    if (!this.seen.has(q.id)) this.seen.set(q.id, [today(), today(), 0, 0]);
    this.near.push(q.near); this.nearSet.add(q.near);
    if (this.near.length > NEAR_WINDOW) { const old = this.near.shift(); if (!this.near.includes(old)) this.nearSet.delete(old); }
  }
  // record an answer
  answer(q, ok, secs) {
    const r = this.seen.get(q.id) || [today(), today(), 0, 0]; r[1] = today(); r[2] += 1; if (ok) r[3] += 1; this.seen.set(q.id, r);
    const c = this.cats[q.cat] || (this.cats[q.cat] = { a: 0, c: 0, t: 0, skill: 300 }); c.a += 1; if (ok) c.c += 1; c.t += Math.min(secs, 300);
    const key = `${q.cat}|${q.sub}`; const s = this.subs[key] || (this.subs[key] = { a: 0, c: 0 }); s.a += 1; if (ok) s.c += 1;
    this.total += 1;
  }
  skill(cat) { return (this.cats[cat] && this.cats[cat].skill) || 300; }
  setSkill(cat, v) { const c = this.cats[cat] || (this.cats[cat] = { a: 0, c: 0, t: 0, skill: 300 }); c.skill = v; }
  acc(cat) { const c = this.cats[cat]; return c && c.a ? Math.round((100 * c.c) / c.a) : null; }
  /* Weak spot = the area with the lowest difficulty-adjusted skill.
     Skill works like a chess rating against question difficulty, so getting
     Hard questions wrong costs less than missing Easy ones, and lucky streaks
     on easy questions don't hide a weakness. Needs 8+ answers in an area. */
  weakInfo(keys) {
    const rated = keys.filter((k) => this.cats[k] && this.cats[k].a >= 8);
    if (rated.length >= 2) { const cat = [...rated].sort((a, b) => this.skill(a) - this.skill(b))[0]; return { cat, confident: true, n: this.cats[cat].a }; }
    const cat = [...keys].sort((a, b) => ((this.cats[a] && this.cats[a].a) || 0) - ((this.cats[b] && this.cats[b].a) || 0))[0];
    return { cat, confident: false, n: (this.cats[cat] && this.cats[cat].a) || 0 };
  }
  weakest(keys) { return this.weakInfo(keys).cat; }
  // weakest topic inside an area: Bayesian-smoothed accuracy (prior 70%) so 1 wrong answer out of 1 doesn't count as "0%"
  weakestSub(cat) {
    const list = Object.entries(this.subs).filter(([k, v]) => k.startsWith(`${cat}|`) && v.a >= 4).map(([k, v]) => [k.split('|')[1], (v.c + 2.8) / (v.a + 4)]);
    if (!list.length) return null; list.sort((a, b) => a[1] - b[1]); return list[0][1] < 0.66 ? list[0][0] : null;
  }
  // 0–100 mastery shown to players: skill mapped onto a friendly scale
  mastery(cat) { const c = this.cats[cat]; if (!c || c.a < 3) return null; return Math.round(Math.max(0, Math.min(100, (this.skill(cat) / 1000) * 100))); }
  toJSON() {
    let entries = [...this.seen.entries()];
    if (entries.length > MAX) entries = entries.sort((a, b) => a[1][1] - b[1][1]).slice(-MAX);
    return { seen: entries, near: this.near, cats: this.cats, subs: this.subs, total: this.total };
  }
}
