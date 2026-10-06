/* Emoji that look premium and consistent on Android (and web).
   `Text` here is a drop-in replacement for React Native's Text: emoji inside a string
   are drawn from bundled Fluent 3D artwork. On iPhone, ui/emoji.ios.js is used instead
   and Apple's own emoji are shown. */
import React, { memo } from 'react';
import { Text as RNText, StyleSheet, Image } from 'react-native';
import { EMOJI_IMG } from './emoji-assets';

const MAP = {};
Object.keys(EMOJI_IMG).forEach((k) => { MAP[k] = EMOJI_IMG[k]; MAP[k.replace(/️/g, '')] = EMOJI_IMG[k]; });
const KEYS = Object.keys(MAP).sort((a, b) => b.length - a.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp(`(${KEYS.map(esc).join('|')})️?`, 'g');

export const Emoji = memo(function Emoji({ ch, size = 20, style }) {
  const src = MAP[ch] || MAP[ch && ch.replace(/️/g, '')];
  if (!src) return <RNText style={{ fontSize: size * 0.85 }}>{ch}</RNText>;
  return <Image source={src} style={[{ width: size, height: size }, style]} resizeMode="contain" fadeDuration={0} />;
});

const cache = new Map();
function split(str) {
  if (cache.has(str)) return cache.get(str);
  const parts = []; let last = 0; let m; RE.lastIndex = 0;
  while ((m = RE.exec(str))) { if (m.index > last) parts.push(str.slice(last, m.index)); parts.push({ e: m[1] }); last = m.index + m[0].length; }
  if (last < str.length) parts.push(str.slice(last));
  const out = parts.some((p) => typeof p !== 'string') ? parts : null;
  if (cache.size > 2000) cache.clear();
  cache.set(str, out); return out;
}

function renderChildren(children, size) {
  return React.Children.map(children, (c, idx) => {
    if (typeof c !== 'string') return c;
    const parts = split(c); if (!parts) return c;
    return parts.map((p, i) => (typeof p === 'string' ? p : <Emoji key={`e${idx}-${i}`} ch={p.e} size={size} />));
  });
}

export function Text({ style, children, ...rest }) {
  const flat = StyleSheet.flatten(style) || {};
  const size = Math.round((flat.fontSize || 14) * 1.12);
  return <RNText style={style} {...rest}>{renderChildren(children, size)}</RNText>;
}

export function Icon({ e, size = 24, style }) { return <Emoji ch={e} size={size} style={style} />; }
