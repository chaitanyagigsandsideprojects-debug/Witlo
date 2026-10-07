import React, { useEffect, useMemo, useRef } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';
import { Text } from './emoji';
import * as Haptics from 'expo-haptics';
import { CONFETTI } from './theme';
import { playSound } from './sound';

export const AVATARS = [
  { e: '🐯', bg: '#FFE1C7' }, { e: '🦚', bg: '#D5F2EA' }, { e: '🐘', bg: '#E3E4F7' }, { e: '🦁', bg: '#FFEBC2' },
  { e: '🐒', bg: '#F4E0D2' }, { e: '🐼', bg: '#E9E9EE' }, { e: '🦉', bg: '#EFE3FF' }, { e: '🐢', bg: '#DDF2D8' },
  { e: '🦋', bg: '#DDEBFF' }, { e: '🐨', bg: '#E4ECEF' }, { e: '🐰', bg: '#FFE3EC' }, { e: '🦊', bg: '#FFE0D1' },
];

// Illustrated avatars use ids 100+; the player's own photo uses id -1
export const CHARACTERS = [
  { id: 100, name: 'Samoyed', src: require('../assets/avatars/samoyed.webp') }, { id: 101, name: 'Shiba', src: require('../assets/avatars/shiba.webp') },
  { id: 102, name: 'Frog', src: require('../assets/avatars/frog.webp') }, { id: 103, name: 'Cat', src: require('../assets/avatars/cat.webp') },
  { id: 104, name: 'Duck', src: require('../assets/avatars/duck.webp') }, { id: 105, name: 'Otter', src: require('../assets/avatars/otter.webp') },
  { id: 106, name: 'Panda', src: require('../assets/avatars/panda.webp') }, { id: 107, name: 'Bunny', src: require('../assets/avatars/bunny.webp') },
  { id: 108, name: 'Penguin', src: require('../assets/avatars/penguin.webp') }, { id: 109, name: 'Bear', src: require('../assets/avatars/bear.webp') },
  { id: 110, name: 'Shark', src: require('../assets/avatars/shark.webp') }, { id: 111, name: 'Fox', src: require('../assets/avatars/fox.webp') },
];

export const haptic = (kind) => {
  try {
    if (kind === 'tap') Haptics.selectionAsync();
    else if (kind === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (kind === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (kind === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (kind === 'error') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) { /* no haptics on this device */ }
};

// A button is drawn in three layers: the press area (size/position), a shadow layer that scales on press,
// and a content layer that clips rounded corners. Keeping shadow and clipping on separate layers matters:
// on some Android phones one view that clips, casts a shadow and animates can stop drawing its contents.
const PRESS_KEYS = ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth', 'position', 'top', 'left', 'right', 'bottom', 'zIndex',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical'];
const SHADOW_KEYS = ['shadowColor', 'shadowOpacity', 'shadowRadius', 'shadowOffset', 'elevation', 'height', 'minHeight', 'maxHeight'];
const RADII = ['borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius'];
function splitStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const press = {}; const shade = {}; const inner = {};
  Object.keys(flat).forEach((k) => {
    if (PRESS_KEYS.includes(k)) press[k] = flat[k];
    else if (SHADOW_KEYS.includes(k)) shade[k] = flat[k];
    else inner[k] = flat[k];
  });
  RADII.forEach((k) => { if (flat[k] != null) shade[k] = flat[k]; });
  // Android only draws a shadow for a view with a background, so the shadow layer gets the same colour.
  if (shade.elevation && flat.backgroundColor) shade.backgroundColor = flat.backgroundColor;
  if (press.width != null) shade.width = '100%';
  if (press.flex != null || press.flexGrow != null) shade.flexGrow = 1;
  if (shade.height != null || shade.minHeight != null || shade.flexGrow) inner.flexGrow = 1;
  return { press, shade, inner };
}

// Every tappable thing: a soft press-in, then a gentle settle (no jarring bounce)
export function Bouncy({ onPress, onPressIn, style, children, disabled, instant, haptics = true, sound = 'tap', accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    if (disabled) return;
    if (haptics) haptic('tap');
    if (sound) playSound(sound);
    Animated.timing(scale, { toValue: 0.965, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    if (instant && onPress) onPress();
    if (onPressIn) onPressIn();
  };
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 5 }).start();
  const { press, shade, inner } = splitStyle(style);
  return (
    <Pressable style={press} onPressIn={pressIn} onPressOut={pressOut} onPress={instant || disabled ? undefined : onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Animated.View style={[shade, { transform: [{ scale }] }, disabled && { opacity: 0.45 }]}>
        <View style={inner}>{children}</View>
      </Animated.View>
    </Pressable>
  );
}

export function Avatar({ i, size = 44, ring, photo }) {
  const box = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: ring ? 3 : 0, borderColor: ring || 'transparent' };
  if (i === -1 && photo) return <View style={box}><Image source={{ uri: photo }} style={{ width: size, height: size }} /></View>;
  if (i >= 100) { const ch = CHARACTERS[(i - 100) % CHARACTERS.length]; return <View style={box}><Image source={ch.src} style={{ width: size, height: size }} /></View>; }
  const a = AVATARS[Math.max(0, i || 0) % AVATARS.length];
  return <View style={[box, { backgroundColor: a.bg }]}><Text style={{ fontSize: size * 0.55 }}>{a.e}</Text></View>;
}

// Wit, the mascot. One illustration per mood.
export const WIT_ART = {
  happy: require('../assets/wit/happy.webp'), think: require('../assets/wit/confused.webp'), party: require('../assets/wit/trophy.webp'),
  proud: require('../assets/wit/correct.webp'), lose: require('../assets/wit/oof.webp'), wow: require('../assets/wit/wow.webp'), loading: require('../assets/wit/crunch.webp'),
};
const RATIO = { happy: 306 / 360, think: 329 / 360, party: 299 / 360, proud: 301 / 360, lose: 287 / 360, wow: 300 / 360, loading: 242 / 360 };
export function WitArt({ mood = 'happy', size = 72, style }) {
  const m = WIT_ART[mood] ? mood : 'happy';
  return <Image source={WIT_ART[m]} style={[{ width: size, height: size * RATIO[m] }, style]} resizeMode="contain" accessibilityIgnoresInvertColors />;
}

export function Wit({ s, text, mood = 'happy' }) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start(); return () => loop.stop();
  }, [bob]);
  return (
    <View style={s.witRow}>
      <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }] }}><WitArt mood={mood} size={70} /></Animated.View>
      <View style={s.bubble}><Text style={s.bubbleText}>{text}</Text></View>
    </View>
  );
}

// Short in-game reaction from Wit: pops in, then fades away
export function WitPop({ pop, s }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pop) return;
    a.setValue(0);
    Animated.sequence([
      Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 12 }),
      Animated.delay(850),
      Animated.timing(a, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [pop && pop.key]);
  if (!pop) return null;
  return (
    <Animated.View pointerEvents="none" style={[s.witPop, { opacity: a, transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }, { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
      <WitArt mood={pop.mood || 'happy'} size={30} />
      <Text style={s.witPopText}>{pop.text}</Text>
    </Animated.View>
  );
}

export function Confetti({ fire, count = 46 }) {
  const { width, height } = Dimensions.get('window');
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({
    key: i, x: Math.random() * width, drift: (Math.random() - 0.5) * 160, size: 6 + Math.random() * 8,
    color: CONFETTI[i % CONFETTI.length], delay: Math.random() * 250, spin: 360 + Math.random() * 720,
    round: Math.random() < 0.35, anim: new Animated.Value(0),
  })), [fire, count, width]);
  useEffect(() => {
    if (!fire) return;
    Animated.parallel(pieces.map((p) => Animated.timing(p.anim, { toValue: 1, duration: 1700 + Math.random() * 900, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true }))).start();
  }, [fire, pieces]);
  if (!fire) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Animated.View key={p.key} style={{
          position: 'absolute', left: p.x, top: -20, width: p.size, height: p.round ? p.size : p.size * 1.6, backgroundColor: p.color, borderRadius: p.round ? p.size : 2,
          opacity: p.anim.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.9] }) },
            { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
            { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
          ],
        }} />
      ))}
    </View>
  );
}

export function Stat({ s, value, label, color }) {
  return (<View style={s.stat}><Text style={[s.statValue, color && { color }]}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>);
}
