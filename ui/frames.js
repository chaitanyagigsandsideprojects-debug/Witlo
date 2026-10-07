/* =========================================================
   Avatar frames
   Rank frames are earned automatically (Bronze → Grandmaster) and always reflect the real rank.
   Cosmetic frames are optional, purely visual, and never touch scoring, rank or matchmaking.
   To add a frame later: drop a square transparent image in assets/frames and add one entry below.
   `inner` = radius of the frame's hole as a fraction of the image size (the avatar sits inside it).
   ========================================================= */
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, Animated, Easing, AccessibilityInfo } from 'react-native';
import { Avatar } from './parts';

export const RANK_FRAMES = {
  Bronze: { id: 'bronze', name: 'Bronze', src: require('../assets/frames/bronze.webp'), inner: 0.3125, color: '#B87B4B', anim: 'sparkle' },
  Silver: { id: 'silver', name: 'Silver', src: require('../assets/frames/silver.webp'), inner: 0.3112, color: '#A9B4C2', anim: 'sparkle' },
  Gold: { id: 'gold', name: 'Gold', src: require('../assets/frames/gold.webp'), inner: 0.3195, color: '#F2B43A', anim: 'sparkle' },
  Platinum: { id: 'platinum', name: 'Platinum', src: require('../assets/frames/platinum.webp'), inner: 0.3122, color: '#4FC7C9', anim: 'sparkle' },
  Diamond: { id: 'diamond', name: 'Diamond', src: require('../assets/frames/diamond.webp'), inner: 0.2926, color: '#5B8BFF', anim: 'sparkle' },
  Master: { id: 'master', name: 'Master', src: require('../assets/frames/master.webp'), inner: 0.29, color: '#9B5CF6', anim: 'sparkle' },
  Grandmaster: { id: 'grandmaster', name: 'Grandmaster', src: require('../assets/frames/grandmaster.webp'), inner: 0.287, color: '#F0603A', anim: 'blaze' },
};

// type: 'cosmetic' · rarity: Common | Rare | Epic | Legendary · price: set later when a store exists
// unlock: placeholder milestone until pricing/store mechanics are decided
export const COSMETIC_FRAMES = [
  { id: 'inferno', name: 'Inferno', type: 'cosmetic', rarity: 'Epic', src: require('../assets/frames/inferno.webp'), inner: 0.2659, color: '#FF6A2B', anim: 'ember', price: null, unlock: { kind: 'streak', n: 7, text: 'Reach a 7-day streak' } },
  { id: 'frost', name: 'Frost', type: 'cosmetic', rarity: 'Rare', src: require('../assets/frames/frost.webp'), inner: 0.2599, color: '#7FC8FF', anim: 'frost', price: null, unlock: { kind: 'wins', n: 10, text: 'Win 10 Blitz duels' } },
  { id: 'sakura', name: 'Sakura', type: 'cosmetic', rarity: 'Rare', src: require('../assets/frames/sakura.webp'), inner: 0.2649, color: '#FF8FB8', anim: 'petal', price: null, unlock: { kind: 'level', n: 5, text: 'Reach level 5' } },
  { id: 'arcade', name: 'Arcade', type: 'cosmetic', rarity: 'Epic', src: require('../assets/frames/arcade.webp'), inner: 0.2733, color: '#B45CFF', anim: 'pixel', price: null, unlock: { kind: 'answered', n: 300, text: 'Answer 300 questions' } },
];
export const COSMETIC_BY_ID = Object.fromEntries(COSMETIC_FRAMES.map((f) => [f.id, f]));

// stats = { streakBest, wins, level, answered }; owned = profile.frames (purchases/gifts later)
export function frameOwned(f, stats, owned = {}) {
  if (owned && owned[f.id]) return true;
  const u = f.unlock; if (!u) return false;
  const v = { streak: stats.streakBest, wins: stats.wins, level: stats.level, answered: stats.answered }[u.kind] || 0;
  return v >= u.n;
}
export function unlockProgress(f, stats) {
  const u = f.unlock; if (!u) return null;
  const v = { streak: stats.streakBest, wins: stats.wins, level: stats.level, answered: stats.answered }[u.kind] || 0;
  return { have: Math.min(v, u.n), need: u.n };
}

// Which frame to draw: an equipped cosmetic wins; otherwise the player's real rank frame.
export function frameFor(rankName, cosmeticId) {
  return (cosmeticId && COSMETIC_BY_ID[cosmeticId]) || RANK_FRAMES[rankName] || RANK_FRAMES.Bronze;
}

/* ---- motion preferences ---- */
let reduceMotion = false;
try {
  AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion = !!v; }).catch(() => {});
  AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { reduceMotion = !!v; });
} catch (e) { /* not supported */ }

// Reveals already played this session: a key plays once, never again on re-renders or scrolling.
const PLAYED = new Set();

const PARTICLE = {
  sparkle: { colors: ['#FFFFFF', '#FFE7A3', '#FFFFFF'], shape: 'diamond', drift: 0 },
  blaze: { colors: ['#FFF3B0', '#FFB347', '#FF6A3D'], shape: 'diamond', drift: -0.15 },
  ember: { colors: ['#FFD166', '#FF8C42', '#FF4D2E'], shape: 'dot', drift: -0.35 },
  frost: { colors: ['#FFFFFF', '#CDEBFF', '#9FD4FF'], shape: 'diamond', drift: 0 },
  petal: { colors: ['#FFD1E1', '#FF9EC1', '#FFC2D6'], shape: 'petal', drift: 0.3 },
  pixel: { colors: ['#7CF6FF', '#FF5CF0', '#FFE45C'], shape: 'square', drift: 0 },
};
const ANGLES = [-80, -20, 35, 100, 160, 215];

/**
 * The single avatar used everywhere: avatar + rank frame (or equipped cosmetic frame).
 * size     – diameter of the avatar's footprint in the layout (the frame art extends a little beyond it)
 * rank     – tier name ('Gold', …) · frame – equipped cosmetic id or null
 * reveal   – a stable key; when given, the 2-second frame reveal plays once for that key
 */
export function RankedAvatar({ i, photo, size = 44, rank = 'Bronze', frame = null, reveal = null, plain = false }) {
  const f = frameFor(rank, frame);
  const play = !!reveal && !reduceMotion && !PLAYED.has(reveal);
  const anim = useRef(new Animated.Value(play ? 0 : 1)).current;
  const [fx, setFx] = useState(play);
  useEffect(() => {
    if (!play) return undefined;
    PLAYED.add(reveal);
    const a = Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start(() => setFx(false));
    return () => a.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Tiny avatars (tab bar, in-game score pills): the art would be unreadable, so a thin ring in the frame's colour.
  if (plain || size < 40) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: f.color, alignItems: 'center', justifyContent: 'center' }}>
        <Avatar i={i} photo={photo} size={size - 5} />
      </View>
    );
  }
  const av = Math.round(size * 0.84); // the face
  const F = Math.round((av / (2 * f.inner)) * 1.06); // frame art so its hole hugs the face
  const off = (size - F) / 2;
  const frameOpacity = anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] });
  const frameScale = anim.interpolate({ inputRange: [0, 0.15, 0.3, 1], outputRange: [0.86, 1.04, 1, 1] });
  const sweep = anim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: ['-30deg', '-30deg', '330deg', '330deg'] });
  const sweepOp = anim.interpolate({ inputRange: [0, 0.15, 0.25, 0.75, 0.9], outputRange: [0, 0, 1, 1, 0], extrapolate: 'clamp' });
  const P = PARTICLE[f.anim] || PARTICLE.sparkle;
  const R = F * 0.42;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Avatar i={i} photo={photo} size={av} />
      <Animated.Image source={f.src} style={{ position: 'absolute', left: off, top: off, width: F, height: F, opacity: frameOpacity, transform: [{ scale: frameScale }] }} resizeMode="contain" fadeDuration={0} />
      {fx ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: off, top: off, width: F, height: F }}>
          {/* a glint that travels once around the ring */}
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: F, height: F, opacity: sweepOp, transform: [{ rotate: sweep }] }}>
            <View style={{ position: 'absolute', left: F / 2 - 5, top: F / 2 - R - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF', shadowColor: P.colors[1], shadowOpacity: 1, shadowRadius: 6, elevation: 4 }} />
          </Animated.View>
          {ANGLES.map((deg, n) => {
            const t0 = 0.2 + n * 0.08; const t1 = Math.min(1, t0 + 0.38);
            const rad = (deg * Math.PI) / 180; const x = F / 2 + Math.cos(rad) * R; const y = F / 2 + Math.sin(rad) * R;
            const o = anim.interpolate({ inputRange: [0, t0, t0 + 0.08, t1], outputRange: [0, 0, 1, 0], extrapolate: 'clamp' });
            const out = anim.interpolate({ inputRange: [t0, t1], outputRange: [0, F * 0.09], extrapolate: 'clamp' });
            const dy = anim.interpolate({ inputRange: [t0, t1], outputRange: [0, F * P.drift * 0.25], extrapolate: 'clamp' });
            const sc = anim.interpolate({ inputRange: [t0, t0 + 0.1, t1], outputRange: [0.3, 1, 0.5], extrapolate: 'clamp' });
            const d = 5 + (n % 3) * 2;
            const shape = P.shape === 'dot' ? { borderRadius: d / 2 } : P.shape === 'petal' ? { borderRadius: d, borderTopLeftRadius: 1, width: d * 1.4 } : P.shape === 'square' ? { borderRadius: 1 } : { borderRadius: 1, transform: [{ rotate: '45deg' }] };
            return (
              <Animated.View key={deg} style={{ position: 'absolute', left: x - d / 2, top: y - d / 2, opacity: o, transform: [{ translateX: Animated.multiply(out, Math.cos(rad)) }, { translateY: Animated.add(Animated.multiply(out, Math.sin(rad)), dy) }, { scale: sc }] }}>
                <View style={[{ width: d, height: d, backgroundColor: P.colors[n % P.colors.length] }, shape]} />
              </Animated.View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

// Full-size preview of a frame on the player's own avatar (Frame Collection)
export function FramePreview({ i, photo, f, size = 120, reveal }) {
  return <RankedAvatar i={i} photo={photo} size={size} rank={f.type === 'cosmetic' ? 'Bronze' : f.name} frame={f.type === 'cosmetic' ? f.id : null} reveal={reveal} />;
}
