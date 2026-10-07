/* Per-user question history + category performance + concept mastery.
   Stored on the device as one compact JSON blob. */
import { taxoOf } from './taxonomy';
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
    this.concepts = d.concepts || {}; // tid -> { a, c, e (recent accuracy 0–1), first, last (days) }
    this.recent = d.recent || []; // last 60 answers: { t, s (skill), r (archetype), f (family), c (cat), u (sub), ok, d (difficulty), x (secs) }
    this.snaps = d.snaps || {}; // day -> { cat: skill } at the start of that day (for "this week" growth)
    this.sessions = d.sessions || []; // last 30 sessions' variety metrics (internal)
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
    const day = today();
    if (!this.snaps[day]) { this.snaps[day] = Object.fromEntries(Object.entries(this.cats).map(([k, v]) => [k, v.skill])); const days = Object.keys(this.snaps).map(Number).sort((a, b) => a - b); while (days.length > 35) delete this.snaps[days.shift()]; }
    const tx = taxoOf(q.tid);
    const cn = this.concepts[q.tid] || (this.concepts[q.tid] = { a: 0, c: 0, e: 0.6, first: day, last: day });
    cn.a += 1; if (ok) cn.c += 1; cn.e = cn.e * 0.7 + (ok ? 0.3 : 0); cn.last = day;
    this.recent.push({ t: q.tid, s: tx.skill, r: tx.arch, f: tx.family, c: q.cat, u: q.sub, ok, d: q.diff, x: Math.round(secs * 10) / 10 }); if (this.recent.length > 60) this.recent.shift();
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
  /* Concept mastery: new → discovered → learning → developing → mastered (→ rusty if untouched for 10+ days) */
  conceptState(tid) {
    const c = this.concepts[tid]; if (!c || !c.a) return 'new';
    if (c.a < 3) return 'discovered';
    if (c.e < 0.55) return 'learning';
    if (c.e < 0.8 || c.a < 6) return 'developing';
    return today() - c.last > 10 ? 'rusty' : 'mastered';
  }
  explored() { return Object.keys(this.concepts).length; }
  masteredCount() { return Object.keys(this.concepts).filter((t) => this.conceptState(t) === 'mastered').length; }
  newThisWeek() { const d = today(); return Object.values(this.concepts).filter((c) => d - c.first < 7).length; }
  // skill a week ago (or the oldest snapshot within the week) for "this week" deltas
  weekAgo(cat) { const d = today(); const days = Object.keys(this.snaps).map(Number).filter((x) => d - x <= 7).sort((a, b) => a - b); for (const x of days) { const v = this.snaps[x][cat]; if (v != null) return v; } return null; }
  // the thinking skill you're best at (recent accuracy, needs 8+ answers)
  strongestSkill() {
    const by = {}; this.recent.forEach((e) => { const b = by[e.s] || (by[e.s] = { a: 0, c: 0 }); b.a += 1; if (e.ok) b.c += 1; });
    const list = Object.entries(by).filter(([, v]) => v.a >= 6).map(([k, v]) => [k, (v.c + 1) / (v.a + 2)]).sort((a, b) => b[1] - a[1]);
    return list.length ? list[0][0] : null;
  }
  logSession(m) { this.sessions.push(m); if (this.sessions.length > 30) this.sessions.shift(); }
  toJSON() {
    let entries = [...this.seen.entries()];
    if (entries.length > MAX) entries = entries.sort((a, b) => a[1][1] - b[1][1]).slice(-MAX);
    return { seen: entries, near: this.near, cats: this.cats, subs: this.subs, total: this.total, concepts: this.concepts, recent: this.recent, snaps: this.snaps, sessions: this.sessions };
  }
}
