/* Drawn visuals for questions: figures, charts, tables, dice, grids */
import React from 'react';
import { View } from 'react-native';
import { Text } from './emoji';
import Svg, { G, Path, Polygon, Rect, Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

const SERIES = ['#FF7A45', '#5B7CFA', '#23B26D', '#F06FB1', '#FFB400', '#9B7BFF', '#2EC4D6', '#8D6E63'];

/* ---------------- Figures ---------------- */
function polyPoints(n, r = 38) {
  const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); } return pts.join(' ');
}
const STAR = (() => { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 17 : 40; const a = -Math.PI / 2 + (Math.PI * i) / 5; pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`); } return pts.join(' '); })();

function Shape({ s, fill, stroke }) {
  const p = { fill, stroke, strokeWidth: 6, strokeLinejoin: 'round' };
  if (s === 'arrow') return <Polygon points="50,8 84,46 63,46 63,92 37,92 37,46 16,46" {...p} />;
  if (s === 'flag') return <Path d="M20 8 H34 V14 L86 32 L34 50 V92 H20 Z" {...p} />;
  if (s === 'boot') return <Path d="M30 8 H54 V62 H86 V92 H30 Z" {...p} />;
  if (s === 'key') return <G><Circle cx="36" cy="28" r="18" {...p} /><Rect x="31" y="46" width="10" height="46" fill={stroke} /><Rect x="41" y="70" width="18" height="8" fill={stroke} /><Rect x="41" y="83" width="12" height="8" fill={stroke} /></G>;
  if (s === 'circle') return <Circle cx="50" cy="50" r="36" {...p} />;
  if (s === 'star') return <Polygon points={STAR} {...p} />;
  if (s && s[0] === 'p') return <Polygon points={polyPoints(Number(s.slice(1)))} {...p} />;
  return null;
}

export function Figure({ spec, size = 64, color = '#2B2140', soft = '#FFFFFF' }) {
  if (!spec || spec === '?') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.5, fontWeight: '800', color }}>?</Text>
      </View>
    );
  }
  const [s, r, f, n, m] = spec.split(':'); const count = Number(n) || 1; const mir = m === 'm';
  const fill = f === 'f' ? color : soft; const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3; const rows = Math.ceil(count / cols); const cell = 100 / Math.max(cols, rows);
  const items = Array.from({ length: count }, (_, i) => ({ x: (i % cols) * cell + (100 - cols * cell) / 2, y: Math.floor(i / cols) * cell + (100 - rows * cell) / 2 }));
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {items.map((it, i) => (
        <G key={i} transform={`translate(${it.x} ${it.y}) scale(${cell / 100})`}>
          <G transform={`rotate(${Number(r) || 0} 50 50)`}>
            <G transform={mir ? 'translate(100 0) scale(-1 1)' : undefined}>
              <Shape s={s} fill={fill} stroke={color} />
            </G>
          </G>
        </G>
      ))}
    </Svg>
  );
}

// Text drawn mirrored / flipped for mirror- and water-image options
export function FxText({ value, style }) {
  const [fx, w] = value.split('|');
  const t = fx === 'mx' ? [{ scaleX: -1 }] : fx === 'my' ? [{ scaleY: -1 }] : fx === 'r180' ? [{ rotate: '180deg' }] : [];
  return <Text style={[style, { transform: t }]}>{fx === 'rev' ? [...w].reverse().join('') : w}</Text>;
}

/* ---------------- Charts ---------------- */
function niceMax(v) { const p = 10 ** Math.floor(Math.log10(v || 1)); return Math.ceil(v / p) * p; }

function BarChart({ vis, C, width }) {
  const series = vis.series || [{ name: '', values: vis.values }]; const n = vis.labels.length; const H = 150; const top = 16; const bottom = 26; const left = 6;
  const max = niceMax(Math.max(...series.flatMap((x) => x.values))); const groupW = (width - left * 2) / n; const barW = Math.min(30, (groupW - 10) / series.length);
  return (
    <View>
      <Svg width={width} height={H + top + bottom}>
        {[0.25, 0.5, 0.75, 1].map((f) => <Line key={f} x1={0} x2={width} y1={top + H - H * f} y2={top + H - H * f} stroke={C.line} strokeWidth={1} />)}
        {vis.labels.map((lab, i) => (
          <G key={lab}>
            {series.map((sr, j) => {
              const v = sr.values[i]; const h = (v / max) * H; const x = left + i * groupW + (groupW - barW * series.length) / 2 + j * barW;
              return (
                <G key={j}>
                  <Rect x={x + 1} y={top + H - h} width={barW - 2} height={h} rx={4} fill={SERIES[j]} />
                  <SvgText fontFamily="Baloo2_600SemiBold" x={x + barW / 2} y={top + H - h - 4} fontSize={series.length > 1 ? 9 : 11} fontWeight="700" fill={C.ink} textAnchor="middle">{v}</SvgText>
                </G>
              );
            })}
            <SvgText fontFamily="Baloo2_600SemiBold" x={left + i * groupW + groupW / 2} y={top + H + 16} fontSize={11} fill={C.muted} textAnchor="middle">{lab}</SvgText>
          </G>
        ))}
      </Svg>
      {series.length > 1 && <Legend items={series.map((x, j) => [x.name, SERIES[j]])} C={C} />}
    </View>
  );
}

function LineChart({ vis, C, width }) {
  const H = 150; const top = 18; const bottom = 26; const pad = 22; const n = vis.labels.length;
  const all = vis.series.flatMap((x) => x.values); const max = niceMax(Math.max(...all)); const min = Math.max(0, Math.floor((Math.min(...all) * 0.75) / 10) * 10);
  const X = (i) => pad + (i * (width - 2 * pad)) / (n - 1); const Y = (v) => top + H - ((v - min) / (max - min)) * H;
  return (
    <View>
      <Svg width={width} height={H + top + bottom}>
        {[0.25, 0.5, 0.75, 1].map((f) => <Line key={f} x1={0} x2={width} y1={top + H - H * f} y2={top + H - H * f} stroke={C.line} strokeWidth={1} />)}
        {vis.series.map((sr, j) => (
          <G key={sr.name}>
            <Polyline points={sr.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" stroke={SERIES[j]} strokeWidth={3} strokeLinejoin="round" />
            {sr.values.map((v, i) => (
              <G key={i}>
                <Circle cx={X(i)} cy={Y(v)} r={4} fill={SERIES[j]} />
                <SvgText fontFamily="Baloo2_600SemiBold" x={X(i)} y={Y(v) + (j === 0 ? -8 : 15)} fontSize={10} fontWeight="700" fill={C.ink} textAnchor="middle">{v}</SvgText>
              </G>
            ))}
          </G>
        ))}
        {vis.labels.map((lab, i) => <SvgText fontFamily="Baloo2_600SemiBold" key={lab} x={X(i)} y={top + H + 18} fontSize={11} fill={C.muted} textAnchor="middle">{lab}</SvgText>)}
      </Svg>
      <Legend items={vis.series.map((x, j) => [x.name, SERIES[j]])} C={C} />
    </View>
  );
}

function PieChart({ vis, C, width }) {
  const R = Math.min(70, width / 4); const cx = R + 4, cy = R + 4; let a0 = -Math.PI / 2;
  const arcs = vis.values.map((v, i) => {
    const a1 = a0 + (v / 100) * 2 * Math.PI; const large = a1 - a0 > Math.PI ? 1 : 0;
    const d = `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`;
    const mid = (a0 + a1) / 2; const out = { d, color: SERIES[i % SERIES.length], lx: cx + R * 0.62 * Math.cos(mid), ly: cy + R * 0.62 * Math.sin(mid), v }; a0 = a1; return out;
  });
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Svg width={2 * R + 8} height={2 * R + 8}>
        {arcs.map((a, i) => <Path key={i} d={a.d} fill={a.color} stroke={C.card} strokeWidth={2} />)}
        {arcs.map((a, i) => (a.v >= 8 ? <SvgText fontFamily="Baloo2_600SemiBold" key={`t${i}`} x={a.lx} y={a.ly + 4} fontSize={11} fontWeight="800" fill="#FFFFFF" textAnchor="middle">{a.v}%</SvgText> : null))}
      </Svg>
      <View style={{ flex: 1, gap: 3 }}>
        {vis.labels.map((l, i) => (
          <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: SERIES[i % SERIES.length] }} />
            <Text style={{ color: C.ink, fontSize: 13, flex: 1 }} numberOfLines={1}>{l}</Text>
            <Text style={{ color: C.ink, fontSize: 13, fontWeight: '700' }}>{vis.values[i]}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ items, C }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 2 }}>
      {items.map(([name, color]) => (
        <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color }} />
          <Text style={{ color: C.muted, fontSize: 12 }}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function Table({ vis, C }) {
  return (
    <View style={{ borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.line }}>
      <View style={{ flexDirection: 'row', backgroundColor: C.accentSoft }}>
        {vis.head.map((h) => <Text key={h} style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 6, fontSize: 12, fontWeight: '800', color: C.ink, textAlign: 'center' }} numberOfLines={1}>{h}</Text>)}
      </View>
      {vis.rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', backgroundColor: i % 2 ? C.bg : C.card }}>
          {r.map((c, j) => <Text key={j} style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 6, fontSize: 13, color: c === '?' ? C.accent : C.ink, fontWeight: j === 0 || c === '?' ? '800' : '500', textAlign: 'center' }}>{c}</Text>)}
        </View>
      ))}
    </View>
  );
}

function Die({ v, C, size = 86 }) {
  // isometric cube: top, left and right faces
  const s = size; const h = s / 2;
  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      <Polygon points="50,6 92,28 50,50 8,28" fill={C.card} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="8,28 50,50 50,96 8,74" fill={C.accentSoft} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <Polygon points="92,28 50,50 50,96 92,74" fill={C.rivalSoft} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
      <SvgText fontFamily="Baloo2_600SemiBold" x={50} y={34} fontSize={17} fontWeight="800" fill={C.ink} textAnchor="middle">{v[0]}</SvgText>
      <SvgText fontFamily="Baloo2_600SemiBold" x={29} y={70} fontSize={17} fontWeight="800" fill={C.ink} textAnchor="middle">{v[1]}</SvgText>
      <SvgText fontFamily="Baloo2_600SemiBold" x={71} y={70} fontSize={17} fontWeight="800" fill={C.ink} textAnchor="middle">{v[2]}</SvgText>
    </Svg>
  );
}

function GridLines({ n, C, size = 150 }) {
  const step = 100 / n; const lines = [];
  for (let i = 0; i <= n; i++) { lines.push(<Line key={`h${i}`} x1={0} x2={100} y1={i * step} y2={i * step} stroke={C.ink} strokeWidth={1.6} />); lines.push(<Line key={`v${i}`} y1={0} y2={100} x1={i * step} x2={i * step} stroke={C.ink} strokeWidth={1.6} />); }
  return <Svg width={size} height={size} viewBox="-2 -2 104 104">{lines}</Svg>;
}

/* ---------------- Visual block for a question ---------------- */
export function QuestionVisual({ vis, C, width, s }) {
  if (!vis) return null;
  const w = Math.max(220, width);
  if (vis.kind === 'bar') return <View style={{ gap: 2 }}>{vis.title ? <Text style={s.visTitle}>{vis.title}</Text> : null}<BarChart vis={vis} C={C} width={w} /></View>;
  if (vis.kind === 'line') return <View style={{ gap: 2 }}>{vis.title ? <Text style={s.visTitle}>{vis.title}</Text> : null}<LineChart vis={vis} C={C} width={w} /></View>;
  if (vis.kind === 'pie') return <View style={{ gap: 6 }}>{vis.title ? <Text style={s.visTitle}>{vis.title}</Text> : null}<PieChart vis={vis} C={C} width={w} /></View>;
  if (vis.kind === 'table') return <View style={{ gap: 6 }}>{vis.title ? <Text style={s.visTitle}>{vis.title}</Text> : null}<Table vis={vis} C={C} /></View>;
  if (vis.kind === 'dice') return <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>{vis.views.map((v, i) => <Die key={i} v={v} C={C} />)}</View>;
  if (vis.kind === 'gridlines') return <View style={{ alignItems: 'center' }}><GridLines n={vis.n} C={C} /></View>;
  if (vis.kind === 'figs' || vis.kind === 'figana') {
    const n = vis.items.length + (vis.kind === 'figana' ? 1.6 : 0); const fs = vis.items.length === 1 ? 84 : Math.min(58, Math.floor((w - 8) / n - 16));
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        {vis.items.map((it, i) => (
          <React.Fragment key={i}>
            {vis.kind === 'figana' && i === 2 ? <Text style={{ color: C.muted, fontSize: 16, fontWeight: '800' }}>::</Text> : null}
            <View style={{ padding: 4, borderRadius: 12, backgroundColor: it === '?' ? C.accentSoft : C.bg, borderWidth: it === '?' ? 2 : 0, borderColor: C.accent }}>
              <Figure spec={it} size={fs} color={it === '?' ? C.accent : C.ink} soft={C.bg} />
            </View>
            {vis.kind === 'figana' && (i === 0 || i === 2) ? <Text style={{ color: C.muted, fontSize: 14, fontWeight: '800' }}>→</Text> : null}
          </React.Fragment>
        ))}
      </View>
    );
  }
  if (vis.kind === 'grid') {
    const cols = vis.grid[0].length; const cell = vis.num ? 56 : Math.min(44, (w - 10) / cols - 6);
    return (
      <View style={{ alignSelf: 'center', gap: 6 }}>
        {vis.grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 6 }}>
            {row.map((c, j) => (
              <View key={j} style={{ width: cell, height: cell, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c === '?' ? C.accentSoft : C.bg, borderWidth: vis.num ? 2 : 0, borderColor: c === '?' ? C.accent : C.line }}>
                <Text style={{ fontSize: vis.num ? 22 : cell * 0.6, fontWeight: '800', color: c === '?' ? C.accent : C.ink }}>{c}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
  return null;
}
