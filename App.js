import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  View, Pressable, StyleSheet, StatusBar, ScrollView, TextInput, Share, Linking,
  useColorScheme, useWindowDimensions, Animated, Easing, KeyboardAvoidingView, Platform, BackHandler,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { captureRef } from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import { initAds, showInterstitial, showRewarded, rewardedReady, adsSupported, onAdsChange } from './ads';
import { askReminderPermission, scheduleReminders, cancelReminders, remindersSupported } from './reminders';
import { CATS, CAT_KEYS, LEVELS, seeded, nextExperience, dailyFive, updateSkill, sessionMetrics, SKILLS, TEMPLATES } from './engine';
import { QHistory } from './engine/history';
import { TIERS, tierOf, tierProgress, levelOf, missionsFor, advanceMissions, ACHIEVEMENTS, checkAchievements, xpFor, WIT } from './game/progress';
import { INFO } from './game/info';
import { checkUsername } from './game/names';
import { PALETTE, F, makeStyles } from './ui/theme';
import { Bouncy, Avatar, Wit, WitArt, WitPop, Confetti, Stat, haptic, AVATARS, CHARACTERS } from './ui/parts';
import { QuestionVisual, Figure, FxText } from './ui/visuals';
import { Text, Icon } from './ui/emoji';
import { RankedAvatar, RANK_FRAMES, COSMETIC_FRAMES, COSMETIC_BY_ID, frameOwned, unlockProgress } from './ui/frames';
import { initSounds, playSound, setSoundEnabled } from './ui/sound';

/* =========================================================
   WITLO · a 60-second sport for your brain · v5
   ========================================================= */
try { SplashScreen.preventAutoHideAsync(); } catch (e) { /* splash is optional */ }

// Set this before launch: feedback emails go here (left empty → players share feedback via the share sheet)
const SUPPORT_EMAIL = '';
const BRAND_YELLOW = '#FED602';
const GRAD = ['#FF9A4A', '#FF5E62'];
const GRAD_DEEP = ['#4B3AA8', '#2A2063'];
const EASE = Easing.bezier(0.22, 1, 0.36, 1); // smooth "ease-out-quint"
// Android: some phones stop drawing the contents of shadowed views while a parent fades in
// (blank buttons). On Android, pages and questions slide in without fading.
const FADE = Platform.OS !== 'android';
const Glow = ({ colors = GRAD }) => <LinearGradient pointerEvents="none" colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />;

const RIVALS = [
  ['chai_champ', 100], ['Rahul_07', 111], ['PriyaThinks', 107], ['desi_topper', 109], ['Arjun.exe', 101], ['bindaas_Neha', 104],
  ['ManMohan99', 106], ['samosa_sensei', 102], ['Ishita_speaks', 103], ['jugaad_king', 110], ['Tanvi_tez', 105], ['golgappa_guru', 108],
  ['Kabir.k', 3], ['meera_mindful', 8], ['pune_ka_pro', 1], ['Aditya_in_zone', 5],
];
const REACTIONS = ['😂', '🔥', '😮', '👏', '😤'];
const REPLY = { '😂': ['😂', '😤'], '🔥': ['😤', '🔥'], '😮': ['😎', '😂'], '👏': ['🙏', '👏'], '😤': ['😂', '😎'] };
const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const daySeed = () => Number(dayKey().replace(/-/g, ''));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

const STREAK_STEPS = [
  { day: 1, name: 'Spark', icon: '✨' }, { day: 3, name: 'Kindle', icon: '🕯️' }, { day: 5, name: 'Blaze', icon: '🔥' },
  { day: 7, name: 'Rocket', icon: '🚀' }, { day: 10, name: 'Wizard', icon: '🧙' }, { day: 21, name: 'Sage', icon: '🦉' }, { day: 30, name: 'Legend', icon: '🏆' },
];
function streakTitle(days) { let cur = null; let next = STREAK_STEPS[0]; STREAK_STEPS.forEach((x, i) => { if (days >= x.day) { cur = x; next = STREAK_STEPS[i + 1] || null; } }); return { cur, next }; }
const streakBonus = (streak) => 10 + 2 * Math.min(streak, 10); // XP for showing up
function aiBoard(cat) {
  const ci = cat ? CAT_KEYS.indexOf(cat) + 1 : 0; const r = seeded(daySeed() * 7 + 3 + ci * 101);
  return RIVALS.slice(0, 12).map(([name, av]) => ({ name, av, score: cat ? 3 + Math.floor(r() * 18) : 6 + Math.floor(r() * 11) })).sort((a, b) => b.score - a.score);
}
// AI challengers get a steady rank from their name (they are disclosed as AI everywhere)
function aiRating(name) { let h = 7; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 100003; return 1000 + (h % 860); }
const rankName = (score) => tierOf(score).tier.name;
function greeting(name) {
  const h = new Date().getHours();
  const hi = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${hi}, ${name}! Ready to sharpen up?`;
}

const DEFAULT_PROFILE = {
  score: 1000, best: 0, played: 0, wins: 0, streak: 0, last: null, daily: null,
  terms: false, theme: null, todayBest: null, name: '', avatar: 100, photo: null,
  freezes: 0, gamesSinceAd: 0, remindersOn: false, remindersAsked: false,
  xp: 0, missions: null, ach: {}, pb: {}, winStreak: 0, lossStreak: 0, lastRival: null,
  sessions: 0, lastAdAt: 0, askedAt: 0, rated: false, feedback: [], today: null, rushBest: {}, survivalBest: 0, doubles: null,
  sound: true, recent: [], sinceChallenge: 0, frame: null, frames: {},
};
// Never trust stored data blindly: fall back to defaults on anything malformed
function sanitizeProfile(raw) {
  const p = { ...DEFAULT_PROFILE, ...(raw && typeof raw === 'object' ? raw : {}) };
  ['score', 'best', 'played', 'wins', 'streak', 'freezes', 'gamesSinceAd', 'xp', 'winStreak', 'lossStreak', 'sessions', 'lastAdAt', 'askedAt', 'survivalBest'].forEach((k) => { p[k] = Math.max(0, num(p[k], DEFAULT_PROFILE[k])); });
  p.score = Math.max(1000, Math.min(4000, p.score)); p.freezes = Math.min(2, p.freezes);
  if (typeof p.name !== 'string' || !/^[A-Za-z0-9_.]{0,15}$/.test(p.name)) p.name = '';
  if (typeof p.avatar !== 'number') p.avatar = 100;
  if (p.photo && (typeof p.photo !== 'string' || !p.photo.startsWith('data:image/') || p.photo.length > 400000)) { p.photo = null; if (p.avatar === -1) p.avatar = 100; }
  if (p.avatar === -1 && !p.photo) p.avatar = 100;
  ['ach', 'pb', 'rushBest'].forEach((k) => { if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) p[k] = {}; });
  if (!Array.isArray(p.feedback)) p.feedback = [];
  if (p.missions && !Array.isArray(p.missions)) p.missions = null;
  if (p.theme !== 'dark' && p.theme !== 'light') p.theme = null;
  p.sound = p.sound !== false;
  p.recent = Array.isArray(p.recent) ? p.recent.filter((x) => x && typeof x.me === 'number').slice(-8) : [];
  p.sinceChallenge = Math.max(0, num(p.sinceChallenge, 0));
  if (!p.frames || typeof p.frames !== 'object' || Array.isArray(p.frames)) p.frames = {};
  if (typeof p.frame !== 'string') p.frame = null;
  return p;
}
const MAX_FREEZES = 2;
const AD_EVERY = 3; // a full-screen ad at most once every 3 games …
const AD_GAP_MS = 3 * 60 * 1000; // … and never twice within 3 minutes
const STORE_KEY = 'witlo_profile_v1';
const BRAIN_KEY = 'witlo_brain_v1';

function dayGap(aKey, bKey) {
  if (!aKey || !bKey) return Infinity;
  const p = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  return Math.round((p(bKey) - p(aKey)) / 86400000);
}
function liveStreak(P) {
  if (!P.streak || !P.last) return 0;
  const missed = dayGap(P.last, dayKey()) - 1;
  if (missed <= 0) return P.streak;
  return missed <= (P.freezes || 0) ? P.streak : 0;
}
const todayMissions = (P) => (P.missions && P.missions[0] && P.missions[0].day === dayKey() ? P.missions : missionsFor(dayKey(), daySeed()));
const LONG_MODES = { 5: { n: 5, mins: 10, title: 'Long 5', sub: '5 deep questions · about 10 min' }, 10: { n: 10, mins: 20, title: 'Long 10', sub: '10 deep questions · about 20 min' } };
const MODE_LABEL = { blitz: 'BLITZ DUEL', daily: 'DAILY 5', long: 'LONG MODE', train: 'TRAINING', rush: 'CATEGORY RUSH', survival: 'SURVIVAL' };
const SURVIVAL_SECS = 20;

/* Duel pacing. Rivals are tuned to YOUR recent Blitz scores, so a duel is usually close.
   After 2 losses in a row: a confidence game you should win. After 1 loss: a slightly easier rival.
   Every 4–5 games (when you're doing fine): a clearly labelled tough rival, a real challenge. */
function planDuel(P) {
  const recent = (P.recent || []).slice(-5);
  const expected = recent.length ? Math.max(5, recent.reduce((a, x) => a + x.me, 0) / recent.length) : 7;
  const loss = P.lossStreak || 0; const wins = P.winStreak || 0;
  let type = 'even';
  if ((P.played || 0) < 2 || loss >= 2) type = 'comeback';
  else if (loss === 1) type = 'easy';
  else if ((P.sinceChallenge || 0) >= 4 || wins >= 3) type = 'challenge';
  const T = {
    comeback: { factor: 0.68, dAdj: -130, rating: -60, label: null },
    easy: { factor: 0.85, dAdj: -60, rating: -25, label: null },
    even: { factor: 0.98, dAdj: 0, rating: 0, label: null },
    challenge: { factor: 1.13, dAdj: 70, rating: 70, label: 'Tough rival' },
  }[type];
  return { type, ...T, target: Math.max(3, expected * T.factor) };
}

/* ---------------- One reviewed mistake (tap to see how) ---------------- */
function MistakeRow({ m, s, C }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => setOpen((o) => !o)} style={s.mistake} accessibilityRole="button" accessibilityLabel="Show how to solve it">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={[s.typeChip, { alignSelf: 'flex-start' }]} numberOfLines={1}>{CATS[m.cat].icon} {m.sub}</Text>
        <View style={{ flex: 1 }} /><Text style={[s.small, { color: C.accent }]}>{open ? 'Hide' : 'How?'}</Text>
      </View>
      <Text style={s.mistakeQ} numberOfLines={open ? 6 : 2}>{m.prompt}{m.emph ? ` ${m.emph.replace(/\n/g, '  ')}` : ''}</Text>
      {m.ans ? <Text style={s.small}>{m.mine ? <Text style={{ color: C.bad }}>You: {m.mine}  ·  </Text> : null}<Text style={{ color: C.good, fontFamily: F.x }}>Answer: {m.ans}</Text></Text> : null}
      {open ? (
        <View style={{ gap: 6 }}>
          <Text style={s.fbText}>{m.why}</Text>
          {m.steps ? <Text style={s.fbText}>{m.steps}</Text> : null}
          {m.tip ? <Text style={s.fbText}><Text style={{ fontFamily: F.x }}>💡 Exam shortcut: </Text>{m.tip}</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/* ---------------- Clock (re-renders itself only) ---------------- */
function Clock({ gRef, onTimeUp, s, C }) {
  const [, tick] = useReducer((x) => x + 1, 0);
  const lastSec = useRef(null); const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const id = setInterval(() => {
      const g = gRef.current; if (!g || !g.running || g.paused || (g.locked && g.kind === 'survival')) return;
      if (g.endAt && Date.now() >= g.endAt) { onTimeUp(); return; }
      if (g.endAt) {
        const left = Math.ceil((g.endAt - Date.now()) / 1000);
        if (left <= 5 && left !== lastSec.current) { // strong final countdown
          lastSec.current = left; haptic('light'); playSound('tick'); pulse.setValue(1.3);
          Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 12 }).start();
        }
      }
      tick();
    }, 200);
    return () => clearInterval(id);
  }, [gRef, onTimeUp]);
  const g = gRef.current; if (!g) return null;
  const now = g.paused ? g.pausedAt : Date.now();
  const span = g.kind === 'survival' ? SURVIVAL_SECS : 60;
  const left = g.endAt ? Math.max(0, (g.endAt - now) / 1000) : null;
  const el = (now - g.startAt) / 1000;
  const low = left !== null && left <= (g.kind === 'survival' ? 5 : 10); const over = g.target && el > g.target;
  const label = g.endAt ? `${Math.ceil(left)}s` : g.target ? `${mmss(el)} / ${mmss(g.target)}` : `${el.toFixed(0)}s`;
  const progress = g.endAt ? left / span : g.qi / g.total;
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Animated.View style={[s.clock, low && { borderColor: C.bad, backgroundColor: C.badSoft }, { transform: [{ scale: pulse }] }]}>
        <Text style={[s.clockText, (low || over) && { color: C.bad }]}>⏱ {label}</Text>
      </Animated.View>
      <View style={s.bar}><View style={[s.barFill, { width: `${clamp(progress, 0, 1) * 100}%` }, low && { backgroundColor: C.bad }, g.paced && { backgroundColor: C.rival }]} /></View>
    </View>
  );
}

/* ---------------- Smooth entrance for sheets and dialogs ---------------- */
function Appear({ children, style, from = 28, fade = FADE }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 280, easing: EASE, useNativeDriver: true }).start(); }, [a]);
  return <Animated.View style={[style, { opacity: fade ? a : 1, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>{children}</Animated.View>;
}
function Backdrop({ children, style, onPress }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 220, easing: EASE, useNativeDriver: true }).start(); }, [a]);
  const Wrap = onPress ? Pressable : View;
  // only the dim layer fades; the sheet above it never sits inside a fading view (see FADE)
  const { backgroundColor, ...rest } = StyleSheet.flatten(style) || {};
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor, opacity: a }]} />
      <Wrap style={[StyleSheet.absoluteFill, rest]} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={onPress ? 'Close' : undefined}>{children}</Wrap>
    </View>
  );
}

/* ---------------- 3 · 2 · 1 · GO! pop ---------------- */
function CountPop({ label, s }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(a, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 16 }).start(); }, [a]);
  return <Animated.View style={{ transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) }], opacity: a }}><Text style={s.countdown}>{label}</Text></Animated.View>;
}

/* ---------------- Floating reaction (rises and fades) ---------------- */
function FloatReact({ e, side }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [a]);
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -8, [side]: '18%', opacity: a.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [10, -46] }) }, { scale: a.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.4, 1.25, 1] }) }] }}>
      <Icon e={e} size={34} />
    </Animated.View>
  );
}

/* ---------------- Splash: Wit pops in, wordmark fades in, then hand over (~1.3s) ---------------- */
function Splash({ onDone }) {
  const pop = useRef(new Animated.Value(0)).current; const bob = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current; const out = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 14 }),
      Animated.parallel([
        Animated.sequence([Animated.timing(bob, { toValue: 1, duration: 160, useNativeDriver: true }), Animated.timing(bob, { toValue: 0, duration: 180, useNativeDriver: true })]),
        Animated.timing(word, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(260),
      Animated.timing(out, { toValue: 0, duration: 260, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: BRAND_YELLOW, alignItems: 'center', justifyContent: 'center', opacity: out, zIndex: 50 }]}>
      <Animated.View style={{ transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }, { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) }], opacity: pop.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }) }}>
        <WitArt mood="happy" size={200} />
      </Animated.View>
      <Animated.View style={{ opacity: word, transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }], marginTop: 6 }}>
        <Wordmark size={58} />
      </Animated.View>
    </Animated.View>
  );
}
// "witlo" in cream with a dark outline, matching the logo
function Wordmark({ size = 58 }) {
  const base = { fontFamily: F.x, fontSize: size, lineHeight: size * 1.25 };
  const o = Math.max(2, Math.round(size / 18)); const offs = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]];
  return (
    <View>
      {offs.map(([x, y], i) => <Text key={i} style={[base, { color: '#1B1730', position: 'absolute', left: x, top: y }]}>witlo</Text>)}
      <Text style={[base, { color: '#FFF6E2' }]}>witlo</Text>
    </View>
  );
}

/* ---------------- Crash guard: a broken screen never takes the whole app down ---------------- */
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FFF8F1', gap: 12 }}>
        <WitArt mood="think" size={150} />
        <Text style={{ fontFamily: F.x, fontSize: 22, color: '#2B2140', textAlign: 'center' }}>Oops, Wit tripped over something.</Text>
        <Text style={{ fontFamily: F.m, fontSize: 15, color: '#7B7093', textAlign: 'center' }}>Your progress is safe. Tap below to get back in.</Text>
        <Pressable onPress={() => this.setState({ err: null })} style={{ backgroundColor: '#FF7A45', borderRadius: 18, paddingVertical: 13, paddingHorizontal: 28 }} accessibilityRole="button">
          <Text style={{ fontFamily: F.x, fontSize: 17, color: '#FFFFFF' }}>Back to Witlo</Text>
        </Pressable>
      </View>
    );
  }
}

export default function Root() {
  return <SafeAreaProvider><ErrorBoundary><App /></ErrorBoundary></SafeAreaProvider>;
}

/* =========================================================
   App
   ========================================================= */
function App() {
  const [fontsLoaded] = useFonts({
    Baloo2_500Medium: require('./assets/fonts/Baloo2-500Medium.ttf'), Baloo2_600SemiBold: require('./assets/fonts/Baloo2-600SemiBold.ttf'),
    Baloo2_700Bold: require('./assets/fonts/Baloo2-700Bold.ttf'), Baloo2_800ExtraBold: require('./assets/fonts/Baloo2-800ExtraBold.ttf'),
  });
  const insets = useSafeAreaInsets();
  const system = useColorScheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [splash, setSplash] = useState(true);
  const profileRef = useRef(DEFAULT_PROFILE);
  const histRef = useRef(new QHistory());
  const mode = profile.theme || (system === 'dark' ? 'dark' : 'light');
  const C = PALETTE[mode];
  const s = useMemo(() => makeStyles(C), [C]);
  const contentW = Math.min(480, winW) - 32;

  const [screen, setScreen] = useState('home'); // home | train | board | me | longpick | rushpick | match | game | result | setup
  const [quitAsk, setQuitAsk] = useState(false);
  const [agree, setAgree] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState(100);
  const [draftPhoto, setDraftPhoto] = useState(null);
  const [avTab, setAvTab] = useState('characters');
  const [photoMsg, setPhotoMsg] = useState('');
  const [celebrate, setCelebrate] = useState(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [shareState, setShareState] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const [info, setInfo] = useState(null);
  const [boardCat, setBoardCat] = useState(null);
  const [match, setMatch] = useState(null);
  const [ask, setAsk] = useState(null); // rating / feedback prompt: 'rate' | 'feedback' | 'thanks'
  const [framePick, setFramePick] = useState(null); // frame being previewed in the collection: 'r:Gold' | 'c:inferno'
  const visitRef = useRef(0); // counts page visits so frame reveals play once per visit, never on re-renders
  const [fbText, setFbText] = useState('');
  const [doubleState, setDoubleState] = useState('');
  const [hint, setHint] = useState(false);
  const [, setAdTick] = useState(0);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const gameRef = useRef(null);
  const botRef = useRef(null);
  const timersRef = useRef([]);
  const cardRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollInfo = useRef({ y: 0, h: 0, ch: 0, lastMove: Date.now(), shownAt: Date.now() });
  const celebratedRef = useRef(null);
  const finishRef = useRef(() => {});
  const askedThisSession = useRef(false);
  const matchRef = useRef(null);
  const [, force] = useReducer((x) => x + 1, 0);

  const barAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1000)).current;
  const [shownScore, setShownScore] = useState(1000);
  const trophyAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;
  const pageAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); if (timersRef.current.length > 60) timersRef.current = timersRef.current.slice(-40); return id; };
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); clearTimeout(botRef.current); }, []);

  // Smooth page transitions + reset the scroll prompt for the new page
  useEffect(() => {
    visitRef.current += 1; if (screen !== 'frames') setFramePick(null);
    pageAnim.setValue(0);
    Animated.timing(pageAnim, { toValue: 1, duration: 300, easing: EASE, useNativeDriver: true }).start();
    if (scrollRef.current && scrollRef.current.scrollTo) scrollRef.current.scrollTo({ y: 0, animated: false });
    scrollInfo.current = { ...scrollInfo.current, y: 0, lastMove: Date.now(), shownAt: Date.now() }; setHint(false);
  }, [screen]);

  // "Scroll for more": shows when a page continues below the fold and the player has been still for 5 s
  useEffect(() => {
    const id = setInterval(() => {
      const si = scrollInfo.current; const now = Date.now();
      const more = si.ch - (si.y + si.h) > 60;
      const wait = screen === 'result' ? 1800 : 5000;
      const g = gameRef.current; const racing = screen === 'game' && g && !g.paced;
      const should = !!(more && !racing && now - si.lastMove > wait && now - si.shownAt > wait && !quitAsk && !info && !ask && !splash);
      setHint((h) => (h === should ? h : should));
    }, 700);
    return () => clearInterval(id);
  }, [screen, quitAsk, info, ask, splash]);
  useEffect(() => {
    if (!hint) { hintAnim.setValue(0); return undefined; }
    const loop = Animated.loop(Animated.sequence([Animated.timing(hintAnim, { toValue: 1, duration: 520, useNativeDriver: true }), Animated.timing(hintAnim, { toValue: 0, duration: 520, useNativeDriver: true })]));
    loop.start(); return () => loop.stop();
  }, [hint]);

  // Android back button: never drops you out of a game by accident.
  const backRef = useRef(() => false);
  backRef.current = () => {
    if (splash) return true;
    if (info) { setInfo(null); return true; }
    if (ask) { setAsk(null); return true; }
    if (framePick) { setFramePick(null); return true; }
    if (screen === 'game') { if (quitAsk) keepPlaying(); else askQuit(); return true; }
    if (screen === 'match') { cancelMatch(); return true; }
    if (screen === 'result') { goHomeAfterGame(); return true; }
    if (screen === 'frames') { setScreen('me'); return true; }
    if (screen === 'setup' && profileRef.current.name) { setScreen('me'); return true; }
    if (screen !== 'home' && profileRef.current.terms && profileRef.current.name) { setScreen('home'); return true; }
    return false; // on Home: let Android close the app as usual
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => backRef.current());
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORE_KEY), AsyncStorage.getItem(BRAIN_KEY)])
      .then(([v, brain]) => {
        let p = sanitizeProfile(null);
        try { if (v) p = sanitizeProfile(JSON.parse(v)); } catch (e) { p = sanitizeProfile(null); }
        p = { ...p, sessions: (p.sessions || 0) + 1 };
        setSoundEnabled(p.sound !== false);
        profileRef.current = p; setProfile(p); scoreAnim.setValue(p.score); setShownScore(p.score); barAnim.setValue(tierProgress(p.score));
        AsyncStorage.setItem(STORE_KEY, JSON.stringify(p)).catch(() => {});
        try { if (brain) histRef.current = new QHistory(JSON.parse(brain)); } catch (e) { histRef.current = new QHistory(); }
      })
      .catch(() => {})
      .finally(() => { setLoaded(true); reschedule(profileRef.current); });
    try { initAds(); } catch (e) { /* ads are optional */ }
    try { initSounds(); } catch (e) { /* sounds are optional */ }
    AsyncStorage.removeItem('witlo_seen_v1').catch(() => {});
  }, []);
  useEffect(() => { if (loaded && fontsLoaded) SplashScreen.hideAsync().catch(() => {}); }, [loaded, fontsLoaded]);
  useEffect(() => onAdsChange(() => setAdTick((t) => t + 1)), []);
  useEffect(() => { const id = scoreAnim.addListener(({ value }) => setShownScore(Math.round(value))); return () => scoreAnim.removeListener(id); }, [scoreAnim]);

  const saveProfile = (p) => { profileRef.current = p; setProfile(p); AsyncStorage.setItem(STORE_KEY, JSON.stringify(p)).catch(() => {}); };
  const saveBrain = () => { try { AsyncStorage.setItem(BRAIN_KEY, JSON.stringify(histRef.current.toJSON())).catch(() => {}); } catch (e) { /* ignore */ } };

  function improvingCat() {
    const H = histRef.current; const best = CAT_KEYS.filter((k) => H.cats[k] && H.cats[k].a >= 10).sort((a, b) => H.skill(b) - H.skill(a))[0];
    return best ? CATS[best].name : null;
  }
  function reschedule(P) {
    try { if (P.remindersOn) scheduleReminders({ name: P.name, streak: liveStreak(P), playedToday: P.last === dayKey(), pb: P.pb && P.pb.blitz, improving: improvingCat() }); } catch (e) { /* optional */ }
  }

  // Rating / feedback: after a win or every 5th session, at most once a week, never mid-game
  function maybeAsk(afterWin) {
    const P = profileRef.current; if (askedThisSession.current || P.played + (P.daily ? 1 : 0) < 3) return;
    const since = Date.now() - (P.askedAt || 0);
    if (P.rated && since < 60 * 864e5) return;
    if (since < 7 * 864e5) return;
    if (!(afterWin || P.sessions % 5 === 0)) return;
    askedThisSession.current = true; later(() => setAsk('rate'), 700);
  }
  async function rateYes() {
    saveProfile({ ...profileRef.current, askedAt: Date.now(), rated: true }); setAsk('thanks');
    try { const SR = require('expo-store-review'); if (await SR.hasAction()) await SR.requestReview(); } catch (e) { /* store review unavailable */ }
  }
  async function sendFeedback() {
    const text = fbText.trim().slice(0, 1000); const P = profileRef.current;
    saveProfile({ ...P, askedAt: Date.now(), feedback: [...(P.feedback || []).slice(-9), { at: Date.now(), text }] });
    setAsk('thanks'); setFbText('');
    if (!text) return;
    const body = `${text}\n\n— Witlo ${Platform.OS}, level ${levelOf(P.xp).lv}`;
    try {
      if (SUPPORT_EMAIL) await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Witlo feedback')}&body=${encodeURIComponent(body)}`);
      else await Share.share({ message: `Witlo feedback: ${body}` });
    } catch (e) { /* user cancelled */ }
  }

  async function goHomeAfterGame() {
    const P = profileRef.current; const g = gameRef.current; const won = g && g.result && g.result.out === 1;
    if ((P.gamesSinceAd || 0) >= AD_EVERY && Date.now() - (P.lastAdAt || 0) > AD_GAP_MS) {
      let shown = false; try { shown = await showInterstitial(); } catch (e) { shown = false; }
      if (shown) saveProfile({ ...profileRef.current, gamesSinceAd: 0, lastAdAt: Date.now() });
    }
    setScreen('home'); maybeAsk(won);
  }
  async function earnFreeze() {
    const P = profileRef.current;
    if ((P.freezes || 0) >= MAX_FREEZES || freezeBusy) return;
    setFreezeBusy(true);
    let ok = false;
    try { ok = adsSupported() ? await showRewarded() : __DEV__; } catch (e) { ok = false; }
    setFreezeBusy(false);
    if (ok) { saveProfile({ ...profileRef.current, freezes: Math.min(MAX_FREEZES, (profileRef.current.freezes || 0) + 1) }); haptic('success'); playSound('reward'); setConfettiKey((k) => k + 1); }
  }
  // Optional rewarded ad on the result screen: double this game's XP (max 5 a day)
  async function doubleXp() {
    const g = gameRef.current; if (!g || !g.result || g.result.doubled || doubleState === 'busy') return;
    const P = profileRef.current; const d = P.doubles && P.doubles.day === dayKey() ? P.doubles.n : 0; if (d >= 5) return;
    setDoubleState('busy');
    let ok = false; try { ok = adsSupported() ? await showRewarded() : __DEV__; } catch (e) { ok = false; }
    if (!ok) { setDoubleState('fail'); return; }
    const extra = g.result.xpGame; g.result.doubled = true; g.result.xpGain += extra; g.result.xpTo += extra;
    saveProfile({ ...profileRef.current, xp: (profileRef.current.xp || 0) + extra, doubles: { day: dayKey(), n: d + 1 } });
    setDoubleState('done'); haptic('success'); playSound('reward'); setConfettiKey((k) => k + 1);
    Animated.timing(xpAnim, { toValue: levelOf(g.result.xpTo).frac, duration: 700, useNativeDriver: false }).start();
  }
  async function turnOnReminders() {
    let granted = false; try { granted = await askReminderPermission(); } catch (e) { granted = false; }
    const p = { ...profileRef.current, remindersAsked: true, remindersOn: granted };
    saveProfile(p); if (granted) reschedule(p);
  }

  // Photo avatar: picked, cropped square, shrunk to 256 px and stored on the phone only
  async function pickPhoto() {
    setPhotoMsg('');
    try {
      const IP = require('expo-image-picker'); const IM = require('expo-image-manipulator');
      const res = await IP.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (res.canceled || !res.assets || !res.assets[0]) return;
      const a = res.assets[0]; if (a.type && a.type !== 'image') { setPhotoMsg('Please pick a photo.'); return; }
      const side = Math.min(a.width || 256, a.height || 256);
      const actions = [];
      if (a.width && a.height && a.width !== a.height) actions.push({ crop: { originX: Math.floor((a.width - side) / 2), originY: Math.floor((a.height - side) / 2), width: side, height: side } });
      actions.push({ resize: { width: 256, height: 256 } });
      const out = await IM.manipulateAsync(a.uri, actions, { compress: 0.7, format: IM.SaveFormat.JPEG, base64: true });
      if (!out.base64 || out.base64.length > 300000) { setPhotoMsg("That photo couldn't be used. Try another."); return; }
      setDraftPhoto(`data:image/jpeg;base64,${out.base64}`); setDraftAvatar(-1); haptic('success');
    } catch (e) { setPhotoMsg("Couldn't open your photos. Check Witlo's photo permission in Settings."); }
  }

  // Home: count the rating up and fill the rank bar after a duel
  useEffect(() => {
    if (screen !== 'home' || !celebrate || celebratedRef.current === celebrate) return undefined;
    celebratedRef.current = celebrate;
    const { from, to } = celebrate;
    scoreAnim.setValue(from); barAnim.setValue(tierProgress(from));
    const crossed = tierOf(to).index !== tierOf(from).index;
    const t = setTimeout(() => {
      if (to > from) { setConfettiKey((k) => k + 1); haptic('success'); }
      Animated.parallel([
        Animated.timing(scoreAnim, { toValue: to, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        crossed
          ? Animated.sequence([
            Animated.timing(barAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
            Animated.timing(barAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
            Animated.timing(barAnim, { toValue: tierProgress(to), duration: 700, useNativeDriver: false }),
          ])
          : Animated.timing(barAnim, { toValue: tierProgress(to), duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      ]).start();
    }, 350);
    return () => clearTimeout(t);
  }, [screen, celebrate]);

  /* ---------------- Questions ---------------- */
  function makeQuestion(g) {
    let q;
    if (g.kind === 'daily') q = g.dailyQs[g.qi];
    else {
      const H = histRef.current;
      // Adaptive: your skill in that area, warmed up at the start, nudged by recent form; Survival climbs every 5 right
      const ramp = g.kind === 'blitz' || g.kind === 'rush' ? (g.qi < 3 ? -110 : g.qi < 8 ? 0 : 90) : g.kind === 'long' ? 160 : g.kind === 'survival' ? -120 + Math.floor(g.correct / 5) * 90 : 0;
      const formAdj = g.kind === 'blitz' || g.kind === 'rush' ? clamp(g.correct - (g.answered - g.correct) * 2, -4, 6) * 12 : 0;
      q = nextExperience({
        mode: g.kind, history: H, log: g.log, cat: g.tids ? null : g.cat || null, sub: g.tids ? null : g.sub || null, tids: g.tids, recentTids: g.recentTids,
        diff: (cat) => clamp(H.skill(cat) + ramp + g.dOffset + formAdj, 40, 980),
      });
    }
    g.recentTids.push(q.tid);
    histRef.current.shown(q);
    q.anims = q.opts.map(() => ({ scale: new Animated.Value(1), shake: new Animated.Value(0) }));
    q.enter = new Animated.Value(0);
    Animated.timing(q.enter, { toValue: 1, duration: 260, easing: EASE, useNativeDriver: true }).start();
    if (g.kind === 'survival') g.endAt = Date.now() + SURVIVAL_SECS * 1000;
    return q;
  }

  /* ---------------- Matchmaking: search → versus → 3·2·1 ---------------- */
  function findMatch(opts = {}) {
    const P = profileRef.current; const plan = planDuel(P);
    let rival;
    const rematch = !!(opts.rematch && P.lastRival);
    if (rematch) rival = { ...P.lastRival, plan };
    else {
      const last = opts.avoid || (P.lastRival && P.lastRival.name); const pool = RIVALS.filter(([n]) => n !== last);
      const [name, av] = pick(pool);
      rival = { name, av, plan, score: Math.max(1000, P.score + plan.rating + Math.round((Math.random() - 0.5) * 50)) };
    }
    const m = { phase: rematch ? 'ask' : 'search', rival, count: 3, spin: 0, key: Date.now(), note: opts.note || null };
    matchRef.current = m.key; setMatch(m); setScreen('match'); haptic('tap');
    const step = (fn, at) => later(() => { if (matchRef.current !== m.key) return; fn(); }, at);
    const upd = (patch) => setMatch((x) => (x && x.key === m.key ? { ...x, ...patch } : x));
    let t = 0;
    if (rematch) {
      // The rival has to accept. Most do; sometimes they're busy and you get a new rival instead.
      const accepts = Math.random() < 0.85;
      t += 1400 + Math.random() * 1600;
      if (!accepts) {
        step(() => { haptic('light'); upd({ phase: 'declined' }); }, t);
        step(() => { if (matchRef.current !== m.key) return; findMatch({ avoid: rival.name, note: `${rival.name} couldn't play. Here's a new rival!` }); }, t + 1700);
        return;
      }
      step(() => { haptic('heavy'); playSound('match'); upd({ phase: 'vs', note: `${rival.name} accepted your rematch! 🔥` }); }, t);
    } else {
      for (let i = 1; i <= 8; i++) step(() => upd({ spin: i }), (t += 160));
      step(() => { haptic('heavy'); playSound('match'); upd({ phase: 'vs' }); }, (t += 220));
    }
    step(() => { playSound('tick'); upd({ phase: 'count', count: 3 }); }, (t += 1100));
    [2, 1].forEach((n) => step(() => { haptic('light'); playSound('tick'); upd({ count: n }); }, (t += 520)));
    step(() => { haptic('medium'); playSound('start'); upd({ count: 0 }); }, (t += 520));
    step(() => { if (matchRef.current !== m.key) return; matchRef.current = null; setMatch(null); startGame('blitz', { rival }); }, (t += 380));
  }
  function cancelMatch() { matchRef.current = null; timersRef.current.forEach(clearTimeout); timersRef.current = []; setMatch(null); setScreen('home'); }

  /* ---------------- Game flow ---------------- */
  // kind: blitz | daily | long | train | rush | survival;  opts: { rival, rematch, n, cat, sub }
  function startGame(kind, opts = {}) {
    if (kind === 'blitz' && !opts.rival) { findMatch(opts); return; }
    const P = profileRef.current; const H = histRef.current; const now = Date.now();
    const rival = opts.rival || null;
    const plan = (rival && rival.plan) || planDuel(P);
    const rivalAcc = 0.86;
    const paced = kind === 'long' || kind === 'train';
    let cat = opts.cat || null; let sub = opts.sub || null;
    if (kind === 'train' && !cat) { cat = H.weakest(CAT_KEYS); sub = H.weakestSub(cat); }
    const g = {
      kind, paced, cat, sub, total: kind === 'daily' ? 5 : kind === 'long' ? opts.n || 5 : kind === 'train' ? (opts.tids ? Math.min(8, Math.max(4, opts.tids.length * 2)) : 8) : 0, lives: kind === 'survival' ? 3 : 0,
      mistakes: [], tids: opts.tids || null, review: !!opts.review, log: [], discovered: [], masteredNow: [],
      skill0: Object.fromEntries(CAT_KEYS.map((k) => [k, H.cats[k] && H.cats[k].a >= 3 ? Math.round(H.skill(k) / 10) : null])),
      qi: 0, me: 0, rv: 0, answered: 0, correct: 0, combo: 0, maxCombo: 0, times: [], marks: [], catStats: {}, fastCount: 0, under2: 0, fastest: null, points: 0,
      locked: false, running: true, paused: false, picked: null, feedback: null, recentTids: [], wit: null, reacts: [], lastReact: 0,
      // the rival answers at a pace that lands near plan.target right answers in 60 s (see planDuel)
      plan: kind === 'blitz' ? plan : null,
      dOffset: kind === 'blitz' ? plan.dAdj : 0,
      rivalAcc, rivalGap: clamp((60 * rivalAcc) / plan.target, 2.2, 14),
      rival: rival && rival.name, rivalAv: rival && rival.av, rivalScore: rival && rival.score, lossStreakBefore: P.lossStreak || 0,
      startAt: now, endAt: kind === 'blitz' || kind === 'rush' ? now + 60000 : null, target: kind === 'long' ? LONG_MODES[opts.n || 5].mins * 60 : null, qStart: now,
      dailyQs: kind === 'daily' ? dailyFive(daySeed()) : null,
      plus: new Animated.Value(0), rivalPop: new Animated.Value(1),
    };
    g.q = makeQuestion(g);
    gameRef.current = g;
    clearTimeout(botRef.current);
    if (kind === 'blitz') runRival();
    setQuitAsk(false); setShareState(''); setCelebrate(null); setShowSteps(false); setDoubleState('');
    setScreen('game');
  }

  function rivalReact(e, delay) {
    later(() => { const g = gameRef.current; if (!g || !g.running || g.kind !== 'blitz') return; g.reacts = [...g.reacts.slice(-5), { who: 'rv', e, key: `${Date.now()}r` }]; force(); }, delay);
  }
  function sendReact(e) {
    const g = gameRef.current; if (!g || !g.running || Date.now() - g.lastReact < 900) return;
    g.lastReact = Date.now(); haptic('tap');
    g.reacts = [...g.reacts.slice(-5), { who: 'me', e, key: `${Date.now()}m` }]; force();
    if (Math.random() < 0.6) rivalReact(pick(REPLY[e] || ['😂']), 700 + Math.random() * 900);
  }

  function runRival() {
    const gap = (gameRef.current && gameRef.current.rivalGap) || 6.6;
    botRef.current = setTimeout(() => {
      const g = gameRef.current; if (!g || !g.running) return;
      // gentle rubber band: confidence games never run away from you; even duels stay within reach
      const t = g.plan ? g.plan.type : 'even';
      const lead = g.rv - g.me; const ease = (t === 'comeback' && lead >= 1) || (t === 'easy' && lead >= 3) || (t === 'even' && lead >= 4);
      if (!g.paused && !ease && Math.random() < g.rivalAcc) {
        g.rv += 1; g.rivalPop.setValue(1.25);
        Animated.spring(g.rivalPop, { toValue: 1, useNativeDriver: true, bounciness: 14 }).start();
        if (g.rv - g.me === 3 && Math.random() < 0.6) rivalReact('😎', 300);
        force();
      }
      runRival();
    }, gap * (0.75 + Math.random() * 0.5) * 1000);
  }

  // onPressIn answers instantly on phones; onPress is the fallback for web. `shown` guards against
  // a late release landing on the next question. i = -1 means the survival timer ran out.
  function answer(i, shown) {
    const g = gameRef.current;
    if (!g || !g.running || g.locked || g.paused || (shown && shown !== g.q)) return;
    g.locked = true;
    const q = g.q; const ok = i >= 0 && q.opts[i] === q.ans; const secs = (Date.now() - g.qStart) / 1000;
    const H = histRef.current; const before = H.conceptState(q.tid); H.answer(q, ok, secs);
    const after = H.conceptState(q.tid);
    if (before === 'new' && q.concept && !g.discovered.includes(q.concept)) g.discovered.push(q.concept);
    if (after === 'mastered' && before !== 'mastered' && q.concept) g.masteredNow.push(q.concept);
    g.log.push({ tid: q.tid, ok, secs, time: q.time, diff: q.diff, skill: q.skill, arch: q.arch, family: q.family, cat: q.cat, sub: q.sub, aha: q.aha, intent: q.intent }); H.setSkill(q.cat, updateSkill(H.skill(q.cat), q, ok, secs, (H.cats[q.cat] && H.cats[q.cat].a) || 0));
    const cs = g.catStats[q.cat] || (g.catStats[q.cat] = { a: 0, c: 0 }); cs.a += 1;
    g.answered += 1; g.times.push(secs); g.picked = i;
    const prevCombo = g.combo;
    let line = null; let mood = 'proud';
    if (ok) {
      g.correct += 1; g.me += 1; g.combo += 1; cs.c += 1; g.maxCombo = Math.max(g.maxCombo, g.combo);
      if (secs < 3) g.fastCount += 1; if (secs < 2) g.under2 += 1; g.fastest = g.fastest == null ? secs : Math.min(g.fastest, secs);
      if (g.paced) g.points += 10 * q.level;
      haptic(g.combo >= 3 ? 'medium' : 'success'); playSound(g.combo >= 3 ? 'combo' : 'correct');
      Animated.sequence([
        Animated.timing(q.anims[i].scale, { toValue: 1.04, duration: 120, easing: EASE, useNativeDriver: true }),
        Animated.spring(q.anims[i].scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 6 }),
      ]).start();
      g.plus.setValue(0);
      Animated.timing(g.plus, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      if (g.combo === 10) { line = pick(WIT.combo10); mood = 'wow'; } else if (g.combo === 5) { line = pick(WIT.combo5); mood = 'party'; if (g.kind === 'blitz' && Math.random() < 0.6) rivalReact('😮', 500); } else if (g.combo === 3) line = pick(WIT.combo3);
      else if (secs < 2.5 && !g.paced && Math.random() < 0.6) { line = pick(WIT.fast); mood = 'wow'; } else if (Math.random() < 0.15) line = pick(WIT.correct);
    } else {
      g.combo = 0; mood = 'think';
      if (g.kind === 'survival') g.lives -= 1;
      haptic('error'); playSound('wrong');
      if (i >= 0) { const sh = q.anims[i].shake; Animated.sequence([10, -10, 7, -7, 3, 0].map((v) => Animated.timing(sh, { toValue: v, duration: 45, useNativeDriver: true }))).start(); }
      if (i < 0) line = "Time's up!"; else if (prevCombo >= 3) line = pick(WIT.broke); else if (Math.random() < 0.35) line = pick(WIT.wrong);
    }
    if (line) g.wit = { text: line, key: Date.now(), mood };
    if (g.kind === 'daily') g.marks.push(ok ? '🟩' : '🟥');
    if (!ok && g.mistakes.length < 12) g.mistakes.push({ tid: q.tid, cat: q.cat, sub: q.sub, prompt: q.prompt, emph: q.optKind ? null : q.emph, passage: q.passage, ans: q.optKind ? null : q.ans, mine: i >= 0 && !q.optKind ? q.opts[i] : null, why: q.why, steps: q.steps, tip: q.tip, vis: !!q.vis });
    const whyHasAns = q.why.toLowerCase().includes(String(q.ans).toLowerCase());
    g.feedback = { ok, fast: ok && secs < 3, text: ok ? (g.combo >= 3 ? `🔥 ${g.combo} COMBO · ${q.why}` : q.aha ? `⚡ Quick trick: ${q.why}` : `Nice! ${q.why}`) : (i < 0 ? `⏱ Time's up · ${q.optKind ? q.why : `Answer: ${q.ans}`}` : q.optKind || whyHasAns ? `✕ ${q.why}` : `Answer: ${q.ans} · ${q.why}`) };
    g.qi += 1;
    force();
    if (g.paced) return; // paced modes wait for "Next"
    later(() => {
      if (!g.running) return;
      g.locked = false; g.picked = null; g.feedback = null;
      if ((g.kind === 'daily' && g.qi >= 5) || (g.kind === 'survival' && g.lives <= 0)) { finish(); return; }
      g.q = makeQuestion(g); g.qStart = Date.now(); force();
    }, ok ? 420 : g.kind === 'survival' ? 1700 : 1350);
  }

  function nextPaced() {
    const g = gameRef.current; if (!g || !g.running) return;
    if (g.qi >= g.total) { finish(); return; }
    g.locked = false; g.picked = null; g.feedback = null; setShowSteps(false);
    g.q = makeQuestion(g); g.qStart = Date.now(); force();
    if (scrollRef.current && scrollRef.current.scrollTo) scrollRef.current.scrollTo({ y: 0, animated: true });
  }

  function askQuit() { const g = gameRef.current; if (!g) return; g.paused = true; g.pausedAt = Date.now(); setQuitAsk(true); }
  function keepPlaying() { const g = gameRef.current; if (!g) return; const d = Date.now() - g.pausedAt; if (g.endAt) g.endAt += d; g.startAt += d; g.qStart += d; g.paused = false; setQuitAsk(false); }
  function leaveGame() {
    const g = gameRef.current; setQuitAsk(false);
    if (g && g.kind === 'blitz') { finish(true); return; }
    if (g && (g.kind === 'survival' || g.kind === 'rush') && g.answered > 0) { finish(); return; }
    if (g) { g.running = false; clearTimeout(botRef.current); saveBrain(); }
    setScreen('home');
  }
  function onTimeUpImpl() {
    const g = gameRef.current; if (!g || !g.running) return;
    if (g.kind === 'survival') { if (!g.locked) answer(-1); return; }
    finish();
  }

  function finish(forfeit = false) {
    const g = gameRef.current;
    if (!g || !g.running) return;
    g.running = false; clearTimeout(botRef.current);
    const H = histRef.current;
    const P = { ...profileRef.current, pb: { ...(profileRef.current.pb || {}) }, ach: { ...(profileRef.current.ach || {}) }, rushBest: { ...(profileRef.current.rushBest || {}) } };
    const from = P.score; const today = dayKey(); const tierBefore = tierOf(from).index; const lvBefore = levelOf(P.xp).lv;
    // streak (Streak Freezes cover missed days)
    let bonus = 0; let frozeUsed = 0;
    if (P.last !== today) {
      const missed = dayGap(P.last, today) - 1;
      if (P.last && missed <= 0) P.streak += 1;
      else if (P.last && P.streak > 0 && missed <= (P.freezes || 0)) { frozeUsed = missed; P.freezes -= missed; P.streak += 1; }
      else P.streak = 1;
      P.last = today; bonus = streakBonus(P.streak);
    }
    P.gamesSinceAd = (P.gamesSinceAd || 0) + 1;
    // today's correct answers per subject (subject leaderboards)
    const td = P.today && P.today.day === today ? { ...P.today, cats: { ...P.today.cats } } : { day: today, cats: {} };
    Object.entries(g.catStats).forEach(([k, v]) => { td.cats[k] = (td.cats[k] || 0) + v.c; }); P.today = td;
    const acc = g.answered ? Math.round((100 * g.correct) / g.answered) : 0;
    const avg = g.times.length ? g.times.reduce((a, b) => a + b, 0) / g.times.length : 0;
    const elapsed = (Date.now() - g.startAt) / 1000;
    let out = null; let delta = 0;
    if (g.kind === 'blitz') {
      // Rating moves only with wins and losses (Elo vs the rival)
      const exp = 1 / (1 + Math.pow(10, (g.rivalScore - P.score) / 400));
      out = forfeit ? 0 : g.me > g.rv ? 1 : g.me === g.rv ? 0.5 : 0;
      delta = Math.round(32 * (out - exp));
      P.score = Math.max(1000, P.score + delta); delta = P.score - from;
      P.played += 1; if (out === 1) P.wins += 1; P.best = Math.max(P.best, g.me);
      if (out === 1) { P.winStreak = (P.winStreak || 0) + 1; P.lossStreak = 0; } else if (out === 0) { P.lossStreak = (P.lossStreak || 0) + 1; P.winStreak = 0; }
      P.todayBest = { day: today, score: Math.max(g.me, P.todayBest && P.todayBest.day === today ? P.todayBest.score : 0) };
      P.lastRival = { name: g.rival, av: g.rivalAv, score: g.rivalScore };
      if (!forfeit) P.recent = [...(P.recent || []), { me: g.me, out }].slice(-8);
      P.sinceChallenge = g.plan && g.plan.type === 'challenge' ? 0 : (P.sinceChallenge || 0) + 1;
    }
    if (g.kind === 'daily') P.daily = { day: today, correct: g.correct, time: elapsed.toFixed(1), marks: g.marks };
    const finished = g.paced ? g.qi >= g.total : true;
    const ev = { kind: g.kind, win: out === 1, correct: g.correct, answered: g.answered, total: g.total, finished, maxCombo: g.maxCombo, fastCount: g.fastCount, under2: g.under2, catCorrect: Object.fromEntries(Object.entries(g.catStats).map(([k, v]) => [k, v.c])) };
    // Personal bests. Only this mode's main score can be a "NEW PERSONAL BEST" (the big banner),
    // and only when it is strictly higher than every earlier score. Smaller records (longest combo,
    // fastest answer, highest rating) are listed quietly as "records". Day streaks are not records here.
    let mainPb = null; const records = [];
    const beat = (key, val, lower = false) => {
      if (val == null) return false; const old = P.pb[key];
      const better = old == null || (lower ? val < old - 0.15 : val > old);
      if (better) P.pb[key] = lower && old != null ? Math.min(old, val) : val;
      return better && old != null && (lower || val > 0);
    };
    if (g.kind === 'blitz' && !forfeit && beat('blitz', g.me)) mainPb = `Best Blitz score: ${g.me} (was ${profileRef.current.pb.blitz})`;
    if (g.kind === 'long' && finished && beat('long', g.points)) mainPb = `Best Long score: ${g.points}`;
    if (g.kind === 'survival') { if (P.survivalBest && g.correct > P.survivalBest) mainPb = `Survival: ${g.correct} questions (was ${P.survivalBest})`; P.survivalBest = Math.max(P.survivalBest || 0, g.correct); }
    if (g.kind === 'rush') { const old = P.rushBest[g.cat]; if (old != null && g.correct > old) mainPb = `${CATS[g.cat].name} Rush: ${g.correct} (was ${old})`; P.rushBest[g.cat] = Math.max(old || 0, g.correct); }
    if (beat('combo', g.maxCombo || null)) records.push(`Longest combo ${g.maxCombo}`);
    if (g.fastest != null && beat('fastest', Math.round(g.fastest * 10) / 10, true)) records.push(`Fastest answer ${g.fastest.toFixed(1)}s`);
    if (g.kind === 'blitz' && out === 1 && beat('rating', P.score)) records.push(`Highest rating ${P.score}`);
    P.pb.streak = Math.max(P.pb.streak || 0, P.streak);
    const pbs = mainPb ? [mainPb] : [];
    // XP, missions, achievements
    const missions = advanceMissions(todayMissions(P), ev); P.missions = missions.list;
    const totals = { correct: CAT_KEYS.reduce((a, k) => a + ((H.cats[k] && H.cats[k].c) || 0), 0), quant: (H.cats.quant && H.cats.quant.c) || 0, logic: (H.cats.logic && H.cats.logic.c) || 0 };
    const achs = checkAchievements(P.ach, { ev, profile: P, totals, hour: new Date().getHours(), lossStreakBefore: g.lossStreakBefore });
    achs.forEach((a) => { P.ach[a.id] = today; });
    const xpGame = forfeit ? Math.round(xpFor(ev) / 2) : xpFor(ev); const xpMissions = missions.gained.reduce((a, m) => a + m.xp, 0);
    const xpGain = xpGame + bonus + xpMissions; const xpFrom = P.xp || 0; P.xp = xpFrom + xpGain;
    const lvAfter = levelOf(P.xp);
    const tierUp = tierOf(P.score).index > tierBefore;
    const cats = Object.entries(g.catStats).map(([k, v]) => ({ cat: k, ...v }));
    const metrics = sessionMetrics(g.log); if (metrics) H.logSession({ ...metrics, kind: g.kind, day: today });
    const growth = [];
    cats.forEach(({ cat }) => { const b = g.skill0[cat]; const a = H.cats[cat] && H.cats[cat].a >= 3 ? Math.round(H.skill(cat) / 10) : null; if (a != null && b != null && a > b) growth.push(`${CATS[cat].icon} ${CATS[cat].name} skill ${b} → ${a}`); });
    g.discovered.slice(0, 3).forEach((c) => growth.push(`✨ New concept: ${c}`));
    g.masteredNow.slice(0, 2).forEach((c) => growth.push(`🏅 Mastered: ${c}`));
    if (metrics && metrics.n >= 6) growth.push(`🧠 ${metrics.skills} kinds of thinking · ${metrics.concepts} concepts this game`);
    // Wit's verdict
    let title; let wit; let mood = 'happy';
    if (g.kind === 'blitz') {
      title = forfeit ? 'You left the duel' : out === 1 ? 'Victory!' : out === 0.5 ? "It's a tie!" : 'So close!';
      wit = forfeit ? 'Everyone needs a break. Come back stronger!' : out === 1 ? pick(WIT.win) : out === 0.5 ? 'Perfectly matched. Rematch?' : pick(WIT.lose);
      mood = out === 1 ? 'party' : out === 0.5 ? 'wow' : 'lose';
    } else if (g.kind === 'daily') {
      title = g.correct === 5 ? 'Perfect Daily 5!' : 'Daily 5 done'; wit = g.correct === 5 ? 'Flawless! Share it and flex a little.' : `${g.correct}/5 today. Tomorrow brings a new set!`; mood = g.correct === 5 ? 'party' : g.correct >= 3 ? 'happy' : 'lose';
    } else if (g.kind === 'long') {
      title = finished ? 'Deep dive complete' : 'Deep dive paused'; wit = acc >= 80 ? 'That was serious thinking. Proud of you.' : 'Long questions build real skill. Every one counts.'; mood = acc >= 80 ? 'proud' : 'think';
    } else if (g.kind === 'survival') {
      title = g.correct ? `You survived ${g.correct} question${g.correct === 1 ? '' : 's'}` : 'Tough start!'; wit = g.correct >= 15 ? 'Unbreakable! That was a serious run.' : 'Three lives, one goal: go further next time.'; mood = g.correct >= 15 ? 'party' : 'happy';
    } else if (g.kind === 'rush') {
      title = `${CATS[g.cat].name} Rush: ${g.correct}`; wit = acc >= 80 ? `${CATS[g.cat].name} on fire!` : 'Speed comes with reps. Run it back?'; mood = acc >= 80 ? 'party' : 'happy';
    } else {
      title = g.review ? 'Mistake review done' : `${CATS[g.cat].name} training done`; wit = acc >= 75 ? `Strong work. ${CATS[g.cat].name} is getting sharper.` : 'This is exactly how weak spots become strengths.'; mood = 'proud';
    }
    if (tierUp) { wit = `${pick(WIT.promo)} Welcome to ${tierOf(P.score).tier.name} ${tierOf(P.score).tier.icon}`; mood = 'party'; }
    else if (pbs.length && (g.kind === 'blitz' || g.kind === 'survival' || g.kind === 'rush')) wit = `${pick(WIT.pb)} ${wit}`;
    if (frozeUsed) wit = `🧊 Your Streak Freeze saved your ${P.streak - 1}-day streak! ${wit}`;
    const r = {
      key: Date.now(), rivalScore: g.rivalScore, kind: g.kind, out, forfeit, acc, avg, me: g.me, rv: g.rv, rival: g.rival, rivalAv: g.rivalAv, correct: g.correct, answered: g.answered, total: g.total,
      time: elapsed.toFixed(1), marks: g.marks, points: g.points, finished, cat: g.cat, title, wit, mood,
      score: P.score, delta, streak: P.streak, xpGain, xpGame, xpFrom, xpTo: P.xp, levelUp: lvAfter.lv > lvBefore ? lvAfter.lv : null,
      tierUp, pbs, records, achs, missions: missions.gained, cats, bonus, mistakes: g.mistakes, review: g.review, growth,
    };
    g.result = r; saveProfile(P); saveBrain(); reschedule(P);
    setCelebrate(g.kind === 'blitz' ? { from, to: P.score } : null);
    trophyAnim.setValue(0); xpAnim.setValue(levelOf(xpFrom).frac); setScreen('result');
    const big = out === 1 || tierUp || g.masteredNow.length > 0 || (g.kind === 'daily' && g.correct === 5) || r.levelUp || achs.length || pbs.length;
    later(() => playSound(out === 1 || tierUp ? 'win' : g.kind === 'blitz' && !forfeit && out === 0 ? 'lose' : big ? 'reward' : 'correct'), 250);
    if (big) { setConfettiKey((k) => k + 1); haptic('success'); later(() => haptic('heavy'), 180); Animated.spring(trophyAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }).start(); }
    else Animated.timing(trophyAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    later(() => Animated.timing(xpAnim, { toValue: r.levelUp ? 1 : lvAfter.frac, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(), 500);
  }
  finishRef.current = finish;
  const timeUpRef = useRef(null); timeUpRef.current = onTimeUpImpl;
  const onTimeUp = useRef(() => timeUpRef.current()).current;

  async function shareImage() {
    try {
      setShareState('Preparing your card…');
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) { await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Witlo result', UTI: 'public.png' }); setShareState(''); }
      else setShareState('Sharing is not available on this device.');
    } catch (e) { setShareState("Couldn't create the image. Try again."); }
  }
  async function shareText(r) {
    const msg = r.kind === 'daily'
      ? `I scored ${r.correct}/5 on Witlo Daily 5 ${r.marks.join('')} in ${r.time}s. Can you beat me? 🦉`
      : r.kind === 'blitz' ? `I scored ${r.me} in a 60-second Witlo Blitz${r.out === 1 ? ` and beat ${r.rival}` : ''}. Can you beat me? 🦉`
        : r.kind === 'survival' ? `I survived ${r.correct} questions in Witlo Survival. Can you go further? 🦉`
          : r.kind === 'rush' ? `I got ${r.correct} ${CATS[r.cat].name} questions right in 60 seconds on Witlo. Your turn! 🦉`
            : `I just finished a Witlo ${r.kind === 'long' ? 'Long Mode' : 'training'} session: ${r.correct}/${r.answered} right. 🦉`;
    try { await Share.share({ message: msg }); } catch (e) { /* cancelled */ }
  }
  const toggleTheme = () => saveProfile({ ...profileRef.current, theme: mode === 'dark' ? 'light' : 'dark' });

  /* ---------------- Render ---------------- */
  if (!loaded || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: BRAND_YELLOW }} />;
  const bar = <StatusBar barStyle={splash ? 'dark-content' : mode === 'dark' ? 'light-content' : 'dark-content'} />;
  const H = histRef.current;
  const safe = [s.safe, { paddingTop: insets.top }];
  const SplashLayer = splash ? <Splash onDone={() => setSplash(false)} /> : null;
  const ThemeBtn = (
    <Bouncy onPress={toggleTheme} style={s.iconBtn} accessibilityLabel={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
      <Text style={s.iconBtnText}>{mode === 'dark' ? '☀️' : '🌙'}</Text>
    </Bouncy>
  );
  const Logo = ({ big }) => (
    <View style={s.brandRow}>
      <WitArt mood="happy" size={big ? 52 : 38} />
      <Text style={big ? s.logo : s.logoSmall}>witlo<Text style={{ color: C.accent }}>.</Text></Text>
    </View>
  );
  const InfoBtn = ({ k }) => (
    <Pressable onPress={() => { haptic('tap'); setInfo(k); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="What does this mean?">
      <Text style={s.infoDot}>i</Text>
    </Pressable>
  );

  // ----- Terms (first launch) -----
  if (!profile.terms) {
    return (
      <View style={safe}>{bar}
        <View style={[s.wrap, { flex: 1, paddingBottom: insets.bottom + 12 }]}>
          <View style={s.top}><Logo big />{ThemeBtn}</View>
          <Wit s={s} text="Hoo! I'm Wit. Quick rules first, then we play." />
          <View style={[s.card, { flex: 1, padding: 0 }]}>
            <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
              {TERMS.map(([h, b]) => (<View key={h} style={{ gap: 2 }}><Text style={s.termsH}>{h}</Text><Text style={s.termsB}>{b}</Text></View>))}
            </ScrollView>
          </View>
          <Pressable onPress={() => { haptic('tap'); setAgree(!agree); }} style={s.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: agree }}>
            <View style={[s.checkbox, agree && { backgroundColor: C.accent, borderColor: C.accent }]}>{agree ? <Text style={{ color: C.accentInk, fontFamily: F.x }}>✓</Text> : null}</View>
            <Text style={s.checkText}>I am 14 or older and I agree to the Terms of Use.</Text>
          </Pressable>
          <Bouncy disabled={!agree} onPress={() => { haptic('success'); saveProfile({ ...profileRef.current, terms: true }); setDraftName(''); setDraftAvatar(100 + Math.floor(Math.random() * 12)); setScreen('setup'); }} style={s.btn}>
            <Text style={s.btnText}>Agree and continue</Text>
          </Bouncy>
        </View>
        {SplashLayer}
      </View>
    );
  }

  // ----- Username & avatar -----
  const needsSetup = !profile.name;
  if (needsSetup || screen === 'setup') {
    const clean = draftName.trim();
    const check = checkUsername(clean, RIVALS.map((x) => x[0]));
    const valid = check.ok && (draftAvatar !== -1 || !!draftPhoto);
    return (
      <View style={safe}>{bar}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={[s.wrap, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
            <View style={s.top}><Logo big />{ThemeBtn}</View>
            <Wit s={s} text={needsSetup ? 'What should your rivals call you?' : 'Fresh look? Pick a new name or avatar.'} />
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Avatar i={draftAvatar} photo={draftPhoto} size={96} ring={C.accent} />
              <Text style={s.h2}>{clean || 'your_name'}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.label}>USERNAME</Text>
              <TextInput value={draftName} onChangeText={(t) => setDraftName(t.replace(/\s/g, ''))} placeholder="e.g. chai_lover" placeholderTextColor={C.muted} autoCapitalize="none" autoCorrect={false} maxLength={15} style={s.input} returnKeyType="done" />
              <Text style={[s.small, clean && { color: check.ok ? C.good : C.bad }]}>{clean ? check.msg : '3–15 letters, numbers, _ or .'}</Text>
            </View>
            <View style={s.card}>
              <Text style={s.label}>PICK YOUR AVATAR</Text>
              <View style={s.avTabs}>
                {[['characters', 'Characters'], ['emoji', 'Emoji'], ['photo', 'My photo']].map(([k, l]) => (
                  <Bouncy key={k} onPress={() => setAvTab(k)} style={[s.subTab, avTab === k && { borderColor: C.accent, backgroundColor: C.accentSoft }]}><Text style={s.subTabText}>{l}</Text></Bouncy>
                ))}
              </View>
              {avTab === 'photo' ? (
                <View style={{ alignItems: 'center', gap: 10 }}>
                  {draftPhoto ? <Bouncy onPress={() => setDraftAvatar(-1)}><Avatar i={-1} photo={draftPhoto} size={84} ring={draftAvatar === -1 ? C.accent : null} /></Bouncy> : null}
                  <Bouncy onPress={pickPhoto} style={[s.btnGhost, { paddingHorizontal: 22 }]}><Text style={s.btnGhostText}>📷 {draftPhoto ? 'Choose another photo' : 'Upload a photo'}</Text></Bouncy>
                  <Text style={[s.small, { textAlign: 'center' }]}>{photoMsg || 'Your photo stays on your phone. It is cropped square and shrunk to a small size.'}</Text>
                </View>
              ) : (
                <View style={s.avGrid}>
                  {(avTab === 'characters' ? CHARACTERS.map((c) => c.id) : AVATARS.map((_, i) => i)).map((id) => (
                    <Bouncy key={id} onPress={() => setDraftAvatar(id)} style={s.avCell} accessibilityLabel={`Avatar ${id}`}>
                      <Avatar i={id} size={58} ring={draftAvatar === id ? C.accent : null} />
                    </Bouncy>
                  ))}
                </View>
              )}
            </View>
            <Bouncy disabled={!valid} onPress={() => { haptic('success'); saveProfile({ ...profileRef.current, name: clean, avatar: draftAvatar, photo: draftAvatar === -1 ? draftPhoto : profileRef.current.photo }); setScreen(needsSetup ? 'home' : 'me'); }} style={s.btn}>
              <Text style={s.btnText}>{needsSetup ? "Let's play" : 'Save'}</Text>
            </Bouncy>
            {!needsSetup && <Bouncy onPress={() => setScreen('me')} style={s.btnGhost}><Text style={s.btnGhostText}>Cancel</Text></Bouncy>}
          </ScrollView>
        </KeyboardAvoidingView>
        {SplashLayer}
      </View>
    );
  }

  const lvl = levelOf(profile.xp);
  const myRankName = rankName(profile.score); const visit = visitRef.current;
  const frameStats = { streakBest: Math.max((profile.pb && profile.pb.streak) || 0, profile.streak || 0), wins: profile.wins || 0, level: lvl.lv, answered: histRef.current.total || 0 };
  const myFrame = profile.frame && COSMETIC_BY_ID[profile.frame] && frameOwned(COSMETIC_BY_ID[profile.frame], frameStats, profile.frames) ? profile.frame : null;
  const me = (size, reveal = null, plain = false) => <RankedAvatar i={profile.avatar} photo={profile.photo} size={size} rank={myRankName} frame={myFrame} reveal={reveal} plain={plain} />;
  const TopBar = (
    <View style={s.top}>
      <Logo />
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Bouncy onPress={() => setInfo('streak')} style={s.pill} accessibilityLabel="Streak"><Text style={s.pillText}>🔥 {liveStreak(profile)}{profile.freezes ? `  🧊${profile.freezes}` : ''}</Text></Bouncy>
        {ThemeBtn}
      </View>
    </View>
  );
  const weak = H.weakInfo ? H.weakInfo(CAT_KEYS) : { cat: H.weakest(CAT_KEYS), confident: false, n: 0 };
  const weakCat = weak.cat; const weakSub = H.weakestSub(weakCat); const hasData = weak.confident;
  const dailyDone = profile.daily && profile.daily.day === dayKey();
  const CatBars = ({ rows, skill }) => (
    <View style={{ gap: 8 }}>
      {rows.map(({ cat, a, c }) => {
        const n = (H.cats[cat] && H.cats[cat].a) || 0;
        const pct = skill ? (n >= 3 ? Math.round(H.skill(cat) / 10) : null) : a ? Math.round((100 * c) / a) : null;
        return (
          <View key={cat} style={s.catRow}>
            <Text style={s.catName}>{CATS[cat].icon} {CATS[cat].name}</Text>
            <View style={s.catBar}><View style={[s.catFill, { width: `${pct || 0}%`, backgroundColor: CATS[cat].color }]} /></View>
            <Text style={s.catVal}>{pct == null ? '—' : skill ? pct : `${pct}%`}</Text>
          </View>
        );
      })}
    </View>
  );

  let body = null; let withTabs = true;

  // ----- Home -----
  if (screen === 'home') {
    const { tier, next } = tierOf(shownScore); const streakNow = liveStreak(profile); const st = streakTitle(streakNow);
    const playedToday = profile.last === dayKey(); const freezes = profile.freezes || 0;
    const freezeAvailable = adsSupported() ? rewardedReady() : __DEV__;
    const showReminderCard = remindersSupported() && !profile.remindersAsked && profile.played + (profile.daily ? 1 : 0) >= 1;
    const missions = todayMissions(profile);
    body = (
      <>
        {TopBar}
        {celebrate ? (
          <Wit s={s} mood={celebrate.to > celebrate.from ? 'party' : 'happy'} text={celebrate.to >= celebrate.from ? `${celebrate.to - celebrate.from > 0 ? `+${celebrate.to - celebrate.from} rating!` : 'Rating held.'}${tierOf(celebrate.to).index > tierOf(celebrate.from).index ? ` ${tierOf(celebrate.to).tier.icon} ${tierOf(celebrate.to).tier.name} unlocked!` : ' Keep the run going.'}` : `${celebrate.to - celebrate.from} rating. Shake it off and run it back!`} />
        ) : (<Wit s={s} text={greeting(profile.name)} />)}

        <Pressable onPress={() => setInfo('rank')} accessibilityRole="button" style={s.card}>
          <View style={s.rankRow}>
            <View style={s.badge}><Text style={{ fontSize: 30 }}>{tier.icon}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.label}>YOUR RANK</Text><Text style={s.tier}>{tier.name}</Text></View>
            <View style={{ alignItems: 'flex-end' }}><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Text style={s.label}>RATING</Text><InfoBtn k="rank" /></View><Text style={s.score}>{shownScore}</Text></View>
          </View>
          <View style={s.meter}><Animated.View style={[s.meterFill, { width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
          <Text style={s.small}>{next ? `${Math.max(0, next.min - shownScore)} rating to ${next.icon} ${next.name} · win duels to climb` : 'Top rank reached. Legendary!'}</Text>
          <Pressable onPress={() => setInfo('xp')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="button">
            <Text style={s.lvChip}>Lv {lvl.lv}</Text>
            <View style={s.xpMeter}><View style={[s.xpFill, { width: `${lvl.frac * 100}%` }]} /></View>
            <Text style={s.small}>{lvl.into}/{lvl.need} XP</Text>
            <InfoBtn k="xp" />
          </Pressable>
        </Pressable>

        <Bouncy onPress={() => startGame('blitz')} style={s.primary} accessibilityLabel="Play Blitz">
          <Glow />
          <Text style={{ fontSize: 36 }}>⚡</Text>
          <View style={{ flex: 1 }}><Text style={s.primaryTitle}>PLAY BLITZ</Text><Text style={s.primaryText}>60-second duel · win to climb</Text></View>
          <View style={s.playDot}><Text style={s.playDotText}>▶</Text></View>
        </Bouncy>

        <View style={s.threeCol}>
          <Bouncy onPress={() => startGame('daily')} style={[s.tile, { backgroundColor: C.lilac }]} accessibilityLabel="Daily 5">
            <Text style={s.tileIcon}>{dailyDone ? '✅' : '📅'}</Text>
            <Text style={s.tileTitle}>Daily 5</Text>
            <Text style={s.tileSub}>{dailyDone ? `${profile.daily.correct}/5 · ${profile.daily.time}s` : 'Same 5 for everyone'}</Text>
          </Bouncy>
          <Bouncy onPress={() => setScreen('longpick')} style={[s.tile, { backgroundColor: C.deepSoft }]} accessibilityLabel="Long Mode">
            <Text style={s.tileIcon}>🌊</Text>
            <Text style={s.tileTitle}>Long Mode</Text>
            <Text style={s.tileSub}>Got time? Go deep</Text>
          </Bouncy>
          <Bouncy onPress={() => startGame('train', { cat: weakCat, sub: weakSub })} style={[s.tile, { backgroundColor: C.mint }]} accessibilityLabel="Train my weakness">
            <Text style={s.tileIcon}>🎯</Text>
            <Text style={s.tileTitle}>Train</Text>
            <Text style={s.tileSub}>{hasData ? `Weak spot: ${CATS[weakCat].name}` : 'Fix your weak spot'}</Text>
          </Bouncy>
        </View>
        <View style={s.modeRow}>
          <Bouncy onPress={() => setScreen('rushpick')} style={s.modeMini} accessibilityLabel="Category Rush">
            <Text style={{ fontSize: 24 }}>🏃</Text><View style={{ flex: 1 }}><Text style={s.modeMiniTitle}>Category Rush</Text><Text style={s.tileSub}>60s · one subject</Text></View>
          </Bouncy>
          <Bouncy onPress={() => startGame('survival')} style={s.modeMini} accessibilityLabel="Survival">
            <Text style={{ fontSize: 24 }}>❤️</Text><View style={{ flex: 1 }}><Text style={s.modeMiniTitle}>Survival</Text><Text style={s.tileSub}>{profile.survivalBest ? `Best: ${profile.survivalBest}` : '3 lives · how far?'}</Text></View>
          </Bouncy>
        </View>

        <View style={s.card}>
          <View style={s.top}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Text style={s.label}>TODAY'S MISSIONS</Text><InfoBtn k="missions" /></View>
            <Text style={s.small}>{missions.filter((m) => m.done).length}/3 done</Text>
          </View>
          {missions.map((m) => (
            <View key={m.id} style={s.missionRow}>
              <View style={[s.missionDot, m.done && { backgroundColor: C.good, borderColor: C.good }]}><Text style={{ fontSize: 13, color: '#fff', fontFamily: F.x }}>{m.done ? '✓' : ''}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.missionText, m.done && { color: C.muted, textDecorationLine: 'line-through' }]}>{m.text}</Text>
                {m.goal > 1 && !m.done ? <View style={s.missionBar}><View style={[s.missionFill, { width: `${(100 * m.prog) / m.goal}%` }]} /></View> : null}
              </View>
              <Text style={s.missionXp}>{m.goal > 1 && !m.done ? `${m.prog}/${m.goal} · ` : ''}+{m.xp} XP</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Pressable onPress={() => setInfo('streak')} style={s.rankRow} accessibilityRole="button">
            <Text style={{ fontSize: 28 }}>{st.cur ? st.cur.icon : '🌱'}</Text>
            <View style={{ flex: 1 }}><View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Text style={s.label}>DAILY STREAK</Text><InfoBtn k="streak" /></View><Text style={s.tierSmall}>{streakNow} day{streakNow === 1 ? '' : 's'}{st.cur ? ` · ${st.cur.name}` : ''}</Text></View>
            <Bouncy onPress={() => setInfo('freeze')} style={s.freezeBadge} accessibilityLabel="Streak Freezes"><Text style={s.freezeText}>🧊 {freezes}/{MAX_FREEZES}</Text></Bouncy>
          </Pressable>
          <View style={s.ladder}>
            {STREAK_STEPS.map((x) => {
              const reached = streakNow >= x.day;
              return (
                <View key={x.day} style={s.step}>
                  <View style={[s.stepDot, reached && { backgroundColor: C.accentSoft, borderColor: C.accent }]}><View style={{ opacity: reached ? 1 : 0.35 }}><Text style={{ fontSize: 14 }}>{x.icon}</Text></View></View>
                  <Text style={[s.stepText, reached && { color: C.ink }]}>{x.day}d</Text>
                </View>
              );
            })}
          </View>
          <Text style={s.small}>
            {st.next ? `${st.next.day - streakNow} more day${st.next.day - streakNow === 1 ? '' : 's'} to ${st.next.icon} ${st.next.name}. ` : ''}
            {playedToday ? 'Played today ✓' : `Play today for +${streakBonus(streakNow + 1)} XP.`}
          </Text>
          {freezes < MAX_FREEZES ? (
            <Bouncy onPress={earnFreeze} disabled={!freezeAvailable || freezeBusy} style={s.freezeBtn} accessibilityLabel="Get a Streak Freeze">
              <Text style={{ fontSize: 22 }}>🧊</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.freezeTitle}>{freezeBusy ? 'Loading…' : 'Get a Streak Freeze'}</Text>
                <Text style={s.small}>{freezeAvailable ? 'Watch a short ad. Covers a day you miss.' : 'Getting one ready… check back in a moment.'}</Text>
              </View>
            </Bouncy>
          ) : <Text style={s.small}>🧊 Fully protected: 2 Streak Freezes cover missed days automatically.</Text>}
        </View>

        {showReminderCard && (
          <View style={[s.card, s.settingRow]}>
            <Text style={{ fontSize: 26 }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.freezeTitle}>Never lose your streak</Text>
              <Text style={s.small}>One gentle reminder at 8 pm, only on days you haven't played.</Text>
            </View>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Bouncy onPress={turnOnReminders} style={s.miniBtn}><Text style={s.miniBtnText}>Turn on</Text></Bouncy>
              <Pressable onPress={() => saveProfile({ ...profileRef.current, remindersAsked: true })} accessibilityRole="button" hitSlop={10}><Text style={s.small}>Not now</Text></Pressable>
            </View>
          </View>
        )}
      </>
    );
  }

  // ----- Matchmaking -----
  else if (screen === 'match' && match) {
    withTabs = false;
    const spinAv = RIVALS[(match.spin * 5) % RIVALS.length][1];
    body = (
      <View style={[s.matchWrap, { minHeight: winH - insets.top - 80 }]}>
        {match.phase === 'ask' || match.phase === 'declined' ? (
          <>
            <Text style={s.label}>REMATCH</Text>
            <WitArt mood={match.phase === 'declined' ? 'think' : 'loading'} size={200} />
            <Text style={s.matchTitle}>{match.phase === 'declined' ? `${match.rival.name} can't play right now` : `Waiting for ${match.rival.name} to accept…`}</Text>
            <Text style={s.small}>{match.phase === 'declined' ? 'Finding you a new rival…' : 'Asking for a rematch'}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {me(64)}
              <Text style={s.vsBig}>vs</Text>
              <View style={{ opacity: match.phase === 'declined' ? 0.4 : 0.85 }}><RankedAvatar i={match.rival.av} size={64} rank={rankName(match.rival.score)} /></View>
            </View>
          </>
        ) : match.phase === 'search' ? (
          <>
            <Text style={s.label}>BLITZ DUEL</Text>
            <WitArt mood="loading" size={230} />
            <Text style={s.matchTitle}>Finding a worthy rival…</Text>
            <Text style={s.small}>Matching around rating {profile.score - 60}–{profile.score + 60}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              {me(64)}
              <Text style={s.vsBig}>vs</Text>
              <View style={{ opacity: 0.85 }}><Avatar i={spinAv} size={64} ring={C.line} /></View>
            </View>
          </>
        ) : (
          <>
            <Text style={s.label}>RIVAL FOUND</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }}>
              <View style={{ alignItems: 'center', gap: 8, width: 124 }}>{me(86, `match-${match.key}-me`)}<Text style={s.who} numberOfLines={1}>@{profile.name}</Text><Text style={s.chip}>{tierOf(profile.score).tier.icon} {profile.score}</Text></View>
              <Text style={s.vsBig}>VS</Text>
              <View style={{ alignItems: 'center', gap: 8, width: 124 }}><RankedAvatar i={match.rival.av} size={86} rank={rankName(match.rival.score)} reveal={`match-${match.key}-rv`} /><Text style={s.who} numberOfLines={1}>{match.rival.name}</Text><Text style={[s.chip, { backgroundColor: C.rivalSoft }]}>{tierOf(match.rival.score).tier.icon} {match.rival.score}</Text></View>
            </View>
            {match.note ? <Text style={[s.small, { color: C.good, fontFamily: F.b }]}>{match.note}</Text> : null}
            {match.rival.plan && match.rival.plan.type === 'challenge' ? <Text style={[s.chip, { backgroundColor: C.badSoft, color: C.bad, marginTop: 4 }]}>⚠️ Tough rival · a win here is worth more</Text> : null}
            {match.phase === 'count' ? <CountPop key={match.count} s={s} label={match.count > 0 ? String(match.count) : 'GO!'} /> : <WitArt mood="wow" size={140} />}
            <Text style={s.small}>60 seconds · most right answers wins</Text>
          </>
        )}
        <Bouncy onPress={cancelMatch} style={[s.btnGhost, { paddingHorizontal: 26, marginTop: 8 }]}><Text style={s.btnGhostText}>Cancel</Text></Bouncy>
      </View>
    );
  }

  // ----- Long Mode picker -----
  else if (screen === 'longpick') {
    body = (
      <>
        <View style={s.top}>
          <Bouncy onPress={() => setScreen('home')} style={s.iconBtn} accessibilityLabel="Back"><Text style={s.iconBtnText}>←</Text></Bouncy>
          <Text style={s.h1}>Long Mode</Text>
          <InfoBtn k="long" />
        </View>
        <Wit s={s} mood="think" text="Got time? Go deep. No race, no clock pressure: hard puzzles, real reasoning, full solutions." />
        {[5, 10].map((n) => (
          <Bouncy key={n} onPress={() => startGame('long', { n })} style={s.modeCard} accessibilityLabel={LONG_MODES[n].title}>
            <Glow colors={GRAD_DEEP} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 34 }}>{n === 5 ? '🌊' : '🐋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.modeTitle}>{LONG_MODES[n].title}</Text>
                <Text style={s.modeText}>{LONG_MODES[n].sub}</Text>
              </View>
              <Text style={[s.modeTitle, { fontSize: 20 }]}>▶</Text>
            </View>
          </Bouncy>
        ))}
        <View style={s.card}>
          <Text style={s.label}>WHAT'S INSIDE</Text>
          <Text style={s.small}>Seating arrangements, puzzles, syllogisms, data sufficiency, caselets and multi-step DI, probability, algebra, reading comprehension and more. Hard and Expert level only.</Text>
          {profile.pb && profile.pb.long ? <Text style={s.chip}>🏅 Best Long score: {profile.pb.long}</Text> : null}
        </View>
      </>
    );
  }

  // ----- Category Rush picker -----
  else if (screen === 'rushpick') {
    body = (
      <>
        <View style={s.top}>
          <Bouncy onPress={() => setScreen('home')} style={s.iconBtn} accessibilityLabel="Back"><Text style={s.iconBtnText}>←</Text></Bouncy>
          <Text style={s.h1}>Category Rush</Text>
          <InfoBtn k="rush" />
        </View>
        <Wit s={s} mood="wow" text="60 seconds, one subject. How many can you get right?" />
        {CAT_KEYS.map((k) => (
          <Bouncy key={k} onPress={() => startGame('rush', { cat: k })} style={[s.modeMini, { flex: 0 }]} accessibilityLabel={`Rush ${CATS[k].long}`}>
            <Text style={{ fontSize: 26 }}>{CATS[k].icon}</Text>
            <View style={{ flex: 1 }}><Text style={s.modeMiniTitle}>{CATS[k].long}</Text><Text style={s.tileSub}>{profile.rushBest && profile.rushBest[k] ? `Your best: ${profile.rushBest[k]}` : 'No score yet'}</Text></View>
            <Text style={[s.modeMiniTitle, { color: C.accent }]}>▶</Text>
          </Bouncy>
        ))}
      </>
    );
  }

  // ----- Train (skill profile + weakness training) -----
  else if (screen === 'train') {
    const rows = CAT_KEYS.map((k) => ({ cat: k, a: (H.cats[k] && H.cats[k].a) || 0, c: (H.cats[k] && H.cats[k].c) || 0 }));
    body = (
      <>
        <View style={s.top}><Text style={s.h1}>Train</Text>{ThemeBtn}</View>
        <Wit s={s} mood="think" text={hasData ? `Your weak spot is ${CATS[weakCat].long}${weakSub ? `, especially ${weakSub}` : ''}. Let's fix it.` : `Answer at least 8 questions in two or more areas and I'll find your weak spot. Until then, try ${CATS[weakCat].long}: you've practised it least.`} />
        <View style={s.card}>
          <View style={s.top}><Text style={s.label}>YOUR BRAIN</Text><InfoBtn k="weak" /></View>
          <CatBars rows={rows} skill />
          {(() => {
            const strong = H.strongestSkill(); const focus = weakCat; const fv = H.cats[focus] && H.cats[focus].a >= 3 ? Math.round(H.skill(focus) / 10) : null;
            const week = CAT_KEYS.map((k) => { const w = H.weekAgo(k); const now = H.cats[k] && H.cats[k].a >= 3 ? H.skill(k) : null; return w != null && now != null ? [k, Math.round(now / 10) - Math.round(w / 10)] : null; }).filter((x) => x && x[1] > 0);
            return (
              <View style={{ gap: 4 }}>
                {strong ? <Text style={s.fbText}>💪 Strength: <Text style={{ fontFamily: F.x }}>{SKILLS[strong]}</Text></Text> : null}
                <Text style={s.fbText}>🎯 Current focus: <Text style={{ fontFamily: F.x }}>{CATS[focus].long}</Text></Text>
                {fv != null ? <Text style={s.fbText}>🏁 Next milestone: <Text style={{ fontFamily: F.x }}>reach {Math.min(100, (Math.floor(fv / 10) + 1) * 10)} in {CATS[focus].name}</Text></Text> : null}
                {week.length ? <Text style={s.fbText}>📈 This week: {week.map(([k, d]) => `${CATS[k].name} +${d}`).join(' · ')}</Text> : null}
                <Text style={s.fbText}>🧭 Explored {H.explored()} of {TEMPLATES.length} concepts · {H.newThisWeek()} new this week · {H.masteredCount()} mastered</Text>
              </View>
            );
          })()}
          <Text style={s.small}>{H.total} questions answered · skill rises faster with harder questions</Text>
        </View>
        <Bouncy onPress={() => startGame('train', { cat: weakCat, sub: weakSub })} style={[s.primary, { backgroundColor: CATS[weakCat].color }]} accessibilityLabel="Train weakness">
          <Text style={{ fontSize: 32 }}>🎯</Text>
          <View style={{ flex: 1 }}><Text style={s.primaryTitle}>TRAIN {CATS[weakCat].name.toUpperCase()}</Text><Text style={s.primaryText}>8 questions · full solutions · no timer</Text></View>
        </Bouncy>
        <Text style={s.label}>PRACTISE ANY AREA</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CAT_KEYS.map((k) => (
            <Bouncy key={k} onPress={() => startGame('train', { cat: k })} style={s.catChip} accessibilityLabel={`Practise ${CATS[k].long}`}>
              <Text style={{ fontSize: 18 }}>{CATS[k].icon}</Text><Text style={s.missionText}>{CATS[k].long}</Text>
            </Bouncy>
          ))}
        </View>
      </>
    );
  }

  // ----- Leaderboard (overall + by subject) -----
  else if (screen === 'board') {
    const today = dayKey(); const cat = boardCat;
    const board = aiBoard(cat);
    const mine = cat ? (profile.today && profile.today.day === today ? profile.today.cats[cat] || null : null) : profile.todayBest && profile.todayBest.day === today ? profile.todayBest.score : null;
    const rows = mine == null ? board : [...board, { name: profile.name, av: profile.avatar, photo: profile.photo, score: mine, me: true }].sort((a, b) => b.score - a.score || (a.me ? -1 : 1));
    const myRank = mine == null ? null : rows.findIndex((x) => x.me) + 1; const above = myRank && myRank > 1 ? rows[myRank - 2] : null;
    const what = cat ? `${CATS[cat].name} answers right today` : "today's best Blitz score";
    body = (
      <>
        {TopBar}
        <View style={s.top}><Text style={s.h1}>Leaderboard</Text><InfoBtn k="board" /></View>
        <View style={s.subTabs}>
          {[null, ...CAT_KEYS].map((k) => (
            <Bouncy key={k || 'all'} onPress={() => setBoardCat(k)} style={[s.subTab, boardCat === k && { borderColor: C.accent, backgroundColor: C.accentSoft }]}>
              <Text style={s.subTabText}>{k ? `${CATS[k].icon} ${CATS[k].name}` : '⚡ All'}</Text>
            </Bouncy>
          ))}
        </View>
        <Wit s={s} mood={myRank === 1 ? 'party' : 'happy'} text={mine == null ? (cat ? `Get ${CATS[cat].name} questions right in any mode to join this board. It resets at midnight.` : 'Play a Blitz to get on the board. It resets every midnight, so anyone can win!') : myRank === 1 ? "You're #1 today! Defend it till midnight 👑" : `You're #${myRank}. Get ${above.score - mine + 1} more to pass ${above.name}!`} />
        <View style={[s.card, { gap: 0, paddingVertical: 6 }]}>
          <Text style={[s.label, { paddingHorizontal: 8, paddingVertical: 6 }]}>RANKED BY {what.toUpperCase()}</Text>
          {rows.map((x, i) => (
            <View key={x.name + (x.me ? '_me' : '')} style={[s.boardRow, x.me && { backgroundColor: C.accentSoft }, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={s.boardRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</Text>
              {x.me ? me(44, `board-${visit}-me`) : <RankedAvatar i={x.av} size={44} rank={rankName(aiRating(x.name))} reveal={i < 3 ? `board-${visit}-${x.name}` : null} />}
              <Text style={[s.boardName, x.me && { fontFamily: F.x }]} numberOfLines={1}>{x.me ? `${x.name} (you)` : x.name} <Text style={s.small}>{tierOf(x.me ? profile.score : aiRating(x.name)).tier.icon}</Text></Text>
              <Text style={s.boardScore}>{x.score}</Text>
            </View>
          ))}
        </View>
        <Bouncy onPress={() => (cat ? startGame('rush', { cat }) : startGame('blitz'))} style={s.btn}><Text style={s.btnText}>{cat ? `🏃 ${CATS[cat].name} Rush` : '⚡ Play Blitz'}</Text></Bouncy>
        <Text style={s.foot}>Other players are Witlo's AI challengers until live matches launch.</Text>
      </>
    );
  }

  // ----- Frame collection -----
  else if (screen === 'frames') {
    withTabs = false;
    const curTier = tierOf(profile.score).index;
    const all = [...TIERS.map((t, ti) => ({ key: `r:${t.name}`, f: RANK_FRAMES[t.name], rank: true, ti, min: Math.max(1000, t.min) })), ...COSMETIC_FRAMES.map((f) => ({ key: `c:${f.id}`, f, rank: false }))];
    const status = (x) => {
      if (x.rank) return x.ti === curTier ? (myFrame ? 'Your rank' : 'Equipped') : x.ti < curTier ? 'Reached' : `Locked · ${x.min}+`;
      if (profile.frame === x.f.id && myFrame) return 'Equipped';
      return frameOwned(x.f, frameStats, profile.frames) ? 'Owned' : 'Locked';
    };
    const sel = all.find((x) => x.key === framePick) || all.find((x) => (myFrame ? x.key === `c:${myFrame}` : x.key === `r:${myRankName}`));
    const selOwned = sel.rank ? false : frameOwned(sel.f, frameStats, profile.frames);
    const prog = !sel.rank ? unlockProgress(sel.f, frameStats) : null;
    const tile = (x) => {
      const st = status(x); const on = sel.key === x.key; const locked = st.startsWith('Locked');
      return (
        <Pressable key={x.key} onPress={() => { haptic('tap'); playSound('tap'); setFramePick(x.key); }} style={[s.frameTile, on && { borderColor: C.accent, backgroundColor: C.accentSoft }]} accessibilityRole="button" accessibilityLabel={`${x.f.name} frame, ${st}`}>
          <View style={{ opacity: locked ? 0.45 : 1 }}>
            <RankedAvatar i={profile.avatar} photo={profile.photo} size={56} rank={x.rank ? x.f.name : 'Bronze'} frame={x.rank ? null : x.f.id} />
          </View>
          <Text style={s.frameName} numberOfLines={1}>{locked ? '🔒 ' : ''}{x.f.name}</Text>
          <Text style={[s.frameStatus, st.startsWith('Equipped') && { color: C.good }]} numberOfLines={1}>{x.rank ? st : `${x.f.rarity} · ${st}`}</Text>
        </Pressable>
      );
    };
    body = (
      <>
        <View style={s.top}>
          <Bouncy onPress={() => setScreen('me')} style={s.iconBtn} accessibilityLabel="Back"><Text style={s.iconBtnText}>←</Text></Bouncy>
          <Text style={[s.h1, { flex: 1, marginLeft: 12 }]}>Avatar frames</Text>
        </View>
        <View style={[s.card, { alignItems: 'center', gap: 10 }]}>
          <View style={{ marginVertical: 18 }}><RankedAvatar key={sel.key} i={profile.avatar} photo={profile.photo} size={120} rank={sel.rank ? sel.f.name : 'Bronze'} frame={sel.rank ? null : sel.f.id} reveal={`frames-${visit}-${sel.key}`} /></View>
          <Text style={s.h2}>{sel.f.name}{sel.rank ? ' rank frame' : ''}</Text>
          <Text style={[s.small, { textAlign: 'center' }]}>
            {sel.rank ? (sel.ti <= curTier ? 'Rank frames show your real rank and change automatically as you climb.' : `Unlocks automatically when your rating reaches ${sel.min}. Win Blitz duels to climb.`)
              : selOwned ? `${sel.f.rarity} cosmetic frame. Just for style: it never changes your rank, score or matchmaking.` : `${sel.f.rarity} · Unlock: ${sel.f.unlock.text}${prog ? ` (${prog.have}/${prog.need})` : ''}`}
          </Text>
          {!sel.rank && selOwned ? (
            profile.frame === sel.f.id
              ? <Bouncy onPress={() => saveProfile({ ...profileRef.current, frame: null })} style={[s.btnGhost, { paddingHorizontal: 22 }]}><Text style={s.btnGhostText}>Use my rank frame instead</Text></Bouncy>
              : <Bouncy onPress={() => { saveProfile({ ...profileRef.current, frame: sel.f.id }); playSound('reward'); haptic('success'); }} style={[s.btn, { paddingHorizontal: 30 }]}><Glow /><Text style={s.btnText}>Equip {sel.f.name}</Text></Bouncy>
          ) : null}
          {sel.rank && myFrame && sel.ti === curTier ? <Bouncy onPress={() => saveProfile({ ...profileRef.current, frame: null })} style={[s.btnGhost, { paddingHorizontal: 22 }]}><Text style={s.btnGhostText}>Show my rank frame</Text></Bouncy> : null}
        </View>
        <Text style={s.label}>RANK FRAMES · EARNED BY CLIMBING</Text>
        <View style={s.frameGrid}>{all.filter((x) => x.rank).map(tile)}</View>
        <Text style={s.label}>COSMETIC FRAMES · JUST FOR STYLE</Text>
        <View style={s.frameGrid}>{all.filter((x) => !x.rank).map(tile)}</View>
        <Text style={s.foot}>Cosmetic frames never affect rank, score or matchmaking. Your real rank always shows on your profile and next to your name.</Text>
      </>
    );
  }

  // ----- Profile -----
  else if (screen === 'me') {
    const { tier } = tierOf(profile.score); const streakNow = liveStreak(profile); const st = streakTitle(streakNow); const pb = profile.pb || {};
    const rows = CAT_KEYS.map((k) => ({ cat: k, a: (H.cats[k] && H.cats[k].a) || 0, c: (H.cats[k] && H.cats[k].c) || 0 }));
    body = (
      <>
        <View style={s.top}><Text style={s.h1}>Profile</Text>{ThemeBtn}</View>
        <View style={[s.card, { alignItems: 'center' }]}>
          <View style={{ marginVertical: 14 }}>{me(100, `me-${visit}`)}</View>
          <Text style={s.h2}>@{profile.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text style={s.chip} onPress={() => setInfo('rank')}>{tier.icon} {tier.name} · {profile.score}</Text>
            <Text style={s.chip} onPress={() => setInfo('xp')}>⭐ Level {lvl.lv}</Text>
            <Text style={s.chip} onPress={() => setInfo('streak')}>🔥 {streakNow} day{streakNow === 1 ? '' : 's'}{st.cur ? ` · ${st.cur.name}` : ''}</Text>
            <Text style={s.chip} onPress={() => setInfo('freeze')}>🧊 {profile.freezes || 0}</Text>
          </View>
          <Bouncy onPress={() => { setDraftName(profile.name); setDraftAvatar(profile.avatar); setDraftPhoto(profile.photo); setAvTab(profile.avatar === -1 ? 'photo' : profile.avatar >= 100 ? 'characters' : 'emoji'); setScreen('setup'); }} style={[s.btnGhost, { paddingHorizontal: 22 }]}>
            <Text style={s.btnGhostText}>✏️ Edit name & avatar</Text>
          </Bouncy>
          <Bouncy onPress={() => setScreen('frames')} style={[s.btnGhost, { paddingHorizontal: 22 }]} accessibilityLabel="Avatar frames">
            <Text style={s.btnGhostText}>🖼️ Avatar frames{myFrame ? ` · ${COSMETIC_BY_ID[myFrame].name}` : ''}</Text>
          </Bouncy>
        </View>
        <View style={[s.card, { flexDirection: 'row' }]}>
          <Stat s={s} value={profile.played} label="Duels" />
          <Stat s={s} value={profile.wins} label="Wins" />
          <Stat s={s} value={profile.played ? `${Math.round((100 * profile.wins) / profile.played)}%` : '—'} label="Win rate" />
          <Stat s={s} value={H.total} label="Solved" />
        </View>
        <View style={s.card}>
          <Text style={s.label}>PERSONAL BESTS</Text>
          <View style={{ flexDirection: 'row' }}>
            <Stat s={s} value={pb.blitz ?? '—'} label="Blitz" />
            <Stat s={s} value={pb.combo ?? '—'} label="Combo" />
            <Stat s={s} value={pb.fastest != null ? `${pb.fastest}s` : '—'} label="Fastest" />
            <Stat s={s} value={profile.survivalBest || '—'} label="Survival" />
          </View>
        </View>
        <View style={s.card}>
          <View style={s.top}><Text style={s.label}>ACCURACY BY AREA</Text><InfoBtn k="weak" /></View>
          <CatBars rows={rows} />
        </View>
        <View style={s.card}>
          <View style={s.top}><Text style={s.label}>ACHIEVEMENTS</Text><Text style={s.small}>{Object.keys(profile.ach || {}).length}/{ACHIEVEMENTS.length}</Text></View>
          <View style={s.achGrid}>
            {ACHIEVEMENTS.map((a) => {
              const got = profile.ach && profile.ach[a.id];
              return (
                <Pressable key={a.id} onPress={() => setInfo({ icon: a.icon, title: a.name, body: `${a.desc}.${got ? `\n\nUnlocked on ${got}.` : '\n\nNot unlocked yet.'}` })} style={[s.achCell, got && { backgroundColor: C.goldSoft }]} accessibilityRole="button">
                  <View style={{ opacity: got ? 1 : 0.25 }}><Text style={{ fontSize: 24 }}>{a.icon}</Text></View>
                  <Text style={[s.achName, !got && { color: C.muted }]}>{a.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <Bouncy onPress={toggleTheme} style={[s.card, s.settingRow]}>
          <Text style={s.settingText}>{mode === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'}</Text>
          <Text style={[s.small, { color: C.accent }]}>Switch</Text>
        </Bouncy>
        <Bouncy onPress={() => { const on = profile.sound === false; setSoundEnabled(on); saveProfile({ ...profileRef.current, sound: on }); if (on) later(() => playSound('correct'), 60); }} style={[s.card, s.settingRow]} sound={null} accessibilityLabel="Sound effects">
          <Text style={s.settingText}>{profile.sound === false ? '🔇 Sound effects off' : '🔊 Sound effects on'}</Text>
          <Text style={[s.small, { color: C.accent }]}>{profile.sound === false ? 'Turn on' : 'Turn off'}</Text>
        </Bouncy>
        {remindersSupported() && (
          <Bouncy onPress={() => { if (profile.remindersOn) { saveProfile({ ...profileRef.current, remindersOn: false }); cancelReminders(); } else turnOnReminders(); }} style={[s.card, s.settingRow]}>
            <Text style={s.settingText}>{profile.remindersOn ? '🔔 Daily reminders on' : '🔕 Daily reminders off'}</Text>
            <Text style={[s.small, { color: C.accent }]}>{profile.remindersOn ? 'Turn off' : 'Turn on'}</Text>
          </Bouncy>
        )}
        <Bouncy onPress={() => setAsk('feedback')} style={[s.card, s.settingRow]}>
          <Text style={s.settingText}>💬 Send feedback</Text>
          <Text style={[s.small, { color: C.accent }]}>Tell us</Text>
        </Bouncy>
        {Platform.OS !== 'ios' ? <Text style={s.foot}>Emoji art: Fluent Emoji by Microsoft (MIT)</Text> : null}
      </>
    );
  }

  // ----- Game -----
  else if (screen === 'game' && gameRef.current) {
    withTabs = false;
    const g = gameRef.current; const q = g.q;
    // Layout is decided by the question alone, so it never changes while you answer
    const twoCol = !!q.optKind || q.opts.every((o) => o.length <= 14);
    const optRows = []; if (twoCol) for (let r = 0; r < q.opts.length; r += 2) optRows.push([r, r + 1].filter((x) => x < q.opts.length)); else q.opts.forEach((_, i) => optRows.push([i]));
    const step = `${Math.min(g.qi + (g.feedback ? 0 : 1), g.total)}/${g.total}`;
    const head = g.kind === 'blitz' ? null : g.kind === 'daily' ? ['📅', 'Daily 5', C.lilac, step]
      : g.kind === 'long' ? ['🌊', LONG_MODES[g.total].title, C.deepSoft, step]
        : g.kind === 'train' ? (g.review ? ['🧠', 'Review', C.mint, step] : [CATS[g.cat].icon, `Train ${CATS[g.cat].name}`, C.mint, step])
          : g.kind === 'rush' ? [CATS[g.cat].icon, `${CATS[g.cat].name} Rush`, C.mint, profile.rushBest && profile.rushBest[g.cat] ? `Best ${profile.rushBest[g.cat]}` : '']
            : ['❤️', 'Survival', C.badSoft, `${'❤️'.repeat(Math.max(0, g.lives))}${'🖤'.repeat(Math.max(0, 3 - g.lives))}`];
    const renderOpt = (i) => {
      const v = q.opts[i]; const isAns = v === q.ans;
      const right = g.feedback && ((g.picked === i && g.feedback.ok) || (!g.feedback.ok && isAns));
      const wrong = g.feedback && g.picked === i && !g.feedback.ok;
      return (
        <Pressable key={`${g.qi}-${i}`} testID={`opt-${i}`} onPressIn={() => answer(i, q)} onPress={() => answer(i, q)} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={String(v)}>
          <Animated.View style={[s.opt, right && s.optRight, wrong && s.optWrong, q.optKind && { justifyContent: 'center', minHeight: 84 }, { transform: [{ scale: q.anims[i].scale }, { translateX: q.anims[i].shake }] }]}>
            <Text style={[s.optLetter, right && { color: C.good }, wrong && { color: C.bad }]}>{right ? '✓' : wrong ? '✕' : 'ABCDE'[i]}</Text>
            {q.optKind === 'shape' ? <View style={{ flex: 1, alignItems: 'center' }}><Figure spec={v} size={60} color={C.ink} soft={C.card} /></View>
              : q.optKind === 'fx' ? <View style={{ flex: 1, alignItems: 'center' }}><FxText value={v} style={[s.optText, { textAlign: 'center', flex: 0 }]} /></View>
                : <Text style={[s.optText, !twoCol && s.optWord, q.words && twoCol && { fontSize: 17, lineHeight: 23 }, q.emoji && s.optEmoji]} numberOfLines={twoCol ? 2 : 4}>{v}</Text>}
          </Animated.View>
        </Pressable>
      );
    };
    body = (
      <>
        <View style={s.gameTop}>
          <Bouncy onPress={askQuit} style={s.iconBtn} accessibilityLabel="Pause"><Text style={s.iconBtnText}>⏸</Text></Bouncy>
          <Clock gRef={gameRef} onTimeUp={onTimeUp} s={s} C={C} />
        </View>
        <View style={s.hud}>
          <View style={[s.player, { backgroundColor: C.accentSoft }]}>
            {me(34, null, true)}
            <View style={{ flex: 1 }}><Text style={s.who} numberOfLines={1}>{profile.name}</Text>{g.combo >= 2 ? <Text style={[s.small, { color: C.accent, fontFamily: F.x }]}>🔥 {g.combo} combo</Text> : null}</View>
            <View>
              <Text style={[s.hudScore, { color: C.accent }]}>{g.paced ? g.points : g.me}</Text>
              <Animated.View pointerEvents="none" style={{ position: 'absolute', right: 0, top: -6, opacity: g.plus.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }), transform: [{ translateY: g.plus.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }] }}><Text style={[s.plusOne, { position: 'relative', top: 0 }]}>{g.feedback && g.feedback.fast ? '⚡+1' : g.paced ? `+${10 * q.level}` : '+1'}</Text></Animated.View>
            </View>
            {g.reacts.filter((x) => x.who === 'me').slice(-2).map((x) => <FloatReact key={x.key} e={x.e} side="left" />)}
          </View>
          {head ? (
            <View style={[s.player, { backgroundColor: head[2] }]}>
              <Text style={{ fontSize: 20 }}>{head[0]}</Text><View style={{ flex: 1 }}><Text style={s.who} numberOfLines={1}>{head[1]}</Text></View>
              <Text style={[s.hudScore, { color: C.ink, fontSize: g.kind === 'survival' ? 15 : 20 }]}>{head[3]}</Text>
            </View>
          ) : (
            <View style={[s.player, { backgroundColor: C.rivalSoft }]}>
              <RankedAvatar i={g.rivalAv} size={34} rank={rankName(g.rivalScore || 1000)} plain />
              <View style={{ flex: 1 }}><Text style={s.who} numberOfLines={1}>{g.rival}</Text></View>
              <Animated.View style={{ transform: [{ scale: g.rivalPop }] }}><Text style={[s.hudScore, { color: C.rival }]}>{g.rv}</Text></Animated.View>
              {g.reacts.filter((x) => x.who === 'rv').slice(-2).map((x) => <FloatReact key={x.key} e={x.e} side="right" />)}
            </View>
          )}
        </View>
        {g.kind === 'blitz' ? (
          <View style={s.reactRow}>
            {REACTIONS.map((e) => <Pressable key={e} onPress={() => sendReact(e)} style={s.reactBtn} accessibilityRole="button" accessibilityLabel={`React ${e}`}><Icon e={e} size={20} /></Pressable>)}
          </View>
        ) : null}

        {q.passage ? (
          <Animated.View style={[s.passage, { opacity: FADE ? q.enter : 1 }]}>
            <Text style={s.passageText}>{q.passage}</Text>
          </Animated.View>
        ) : null}

        <View>
          <Animated.View style={[s.qCard, q.passage && { minHeight: 0 }, { opacity: FADE ? q.enter : 1, transform: [{ translateX: q.enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
            <View style={s.qTop}>
              <Text style={s.typeChip} numberOfLines={1}>{CATS[q.cat].icon} {q.sub}</Text>
              <Text style={s.levelChip}>{LEVELS[q.level]}</Text>
            </View>
            <Text style={s.prompt}>{q.prompt}</Text>
            {q.emph ? <Text style={[s.emph, q.emphSmall && s.emphSmall, q.emoji && s.emphEmoji]}>{q.emph}</Text> : null}
            {q.vis ? <QuestionVisual vis={q.vis} C={C} s={s} width={contentW - 36} /> : null}
          </Animated.View>
          <WitPop pop={g.wit} s={s} />
        </View>

        <Animated.View style={{ gap: 10, opacity: FADE ? q.enter : 1, transform: [{ translateY: q.enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          {optRows.map((r) => <View key={r.join()} style={{ flexDirection: 'row', gap: 10 }}>{r.map(renderOpt)}{r.length === 1 && twoCol ? <View style={{ flex: 1 }} /> : null}</View>)}
        </Animated.View>

        {g.paced && g.feedback ? (
          <View style={[s.fbCard, { borderColor: g.feedback.ok ? C.good : C.bad, backgroundColor: g.feedback.ok ? C.goodSoft : C.badSoft }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[s.fbTitle, { color: g.feedback.ok ? C.good : C.bad, flex: 1 }]}>{g.feedback.ok ? `✓ Correct · +${10 * q.level}` : '✕ Not this time'}</Text>
              {q.aha ? <Text style={[s.typeChip, { backgroundColor: C.rivalSoft, color: C.rival }]}>🧠 Insight</Text> : null}
            </View>
            {!g.feedback.ok ? <Text style={s.fbText}>Answer: <Text style={{ fontFamily: F.x }}>{q.optKind ? 'the highlighted option' : q.ans}</Text></Text> : null}
            <Text style={s.fbText}>{q.why}</Text>
            {q.steps ? (showSteps ? <Text style={s.fbText}>{q.steps}</Text> : (
              <Pressable onPress={() => setShowSteps(true)} accessibilityRole="button" hitSlop={8}><Text style={[s.fbText, { color: C.rival, fontFamily: F.b }]}>Show full solution ›</Text></Pressable>
            )) : null}
            {q.tip ? <Text style={s.fbText}><Text style={{ fontFamily: F.x }}>{q.aha ? '💡 Smart way: ' : '💡 Exam shortcut: '}</Text>{q.tip}</Text> : null}
          </View>
        ) : !g.paced ? (
          <Text style={[s.fb, g.feedback && { color: g.feedback.ok ? C.good : C.bad }]}>{g.feedback ? g.feedback.text : ' '}</Text>
        ) : null}
      </>
    );
  }

  // ----- Result -----
  else if (screen === 'result' && gameRef.current && gameRef.current.result) {
    withTabs = false;
    const r = gameRef.current.result; const win = r.out === 1; const { tier } = tierOf(r.score); const st = streakTitle(r.streak);
    const lvNow = levelOf(r.xpTo);
    const label = r.kind === 'daily' ? `DAILY 5 · ${dayKey()}` : r.kind === 'long' ? `LONG ${r.total}` : r.kind === 'train' || r.kind === 'rush' ? `${MODE_LABEL[r.kind]} · ${CATS[r.cat].name.toUpperCase()}` : MODE_LABEL[r.kind];
    const dailyLeft = !(profile.daily && profile.daily.day === dayKey());
    const doublesLeft = 5 - (profile.doubles && profile.doubles.day === dayKey() ? profile.doubles.n : 0);
    const canDouble = !r.doubled && doublesLeft > 0 && r.xpGame > 0 && (adsSupported() ? rewardedReady() : __DEV__);
    const again = r.kind === 'blitz' && !r.forfeit
      ? { label: `Rematch ${r.rival}`, go: () => startGame('blitz', { rematch: true }) }
      : r.kind === 'daily' ? { label: '▶ Play Blitz', go: () => startGame('blitz') }
        : { label: '▶ Play again', go: () => startGame(r.kind, r.kind === 'long' ? { n: r.total } : r.cat ? { cat: r.cat } : {}) };
    if (r.review) { again.label = '🎯 Train weak spot'; again.go = () => startGame('train', { cat: weakCat, sub: weakSub }); }
    body = (
      <>
        <View ref={cardRef} collapsable={false} style={[s.resultCard, (win || r.tierUp) && { borderColor: C.gold, borderWidth: 3 }]}>
          <View style={s.resultTop}>
            <Logo />
            <Text style={s.label}>{label}</Text>
          </View>
          <Animated.View style={{ alignItems: 'center', opacity: trophyAnim, transform: [{ scale: trophyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }] }}>
            <WitArt mood={r.mood} size={150} />
          </Animated.View>
          <Text style={[s.resTitle, (win || r.tierUp) && { color: C.gold }]}>{r.tierUp ? `Promoted to ${tier.name}!` : r.title}</Text>
          {r.kind === 'blitz' ? (
            <View style={s.versus}>
              <View style={s.vsSide}>{me(60, `res-${r.key}-me`)}<Text style={[s.vsScore, { color: C.accent }]}>{r.me}</Text><Text style={s.who} numberOfLines={1}>@{profile.name}</Text></View>
              <Text style={s.vsDash}>vs</Text>
              <View style={s.vsSide}><RankedAvatar i={r.rivalAv} size={60} rank={rankName(r.rivalScore || 1000)} reveal={`res-${r.key}-rv`} /><Text style={[s.vsScore, { color: C.rival }]}>{r.rv}</Text><Text style={s.who} numberOfLines={1}>{r.rival}</Text></View>
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 4 }}>
              {r.kind === 'daily' ? <Text style={s.marks}>{r.marks.join(' ')}</Text> : <Text style={[s.vsScore, { color: C.accent }]}>{r.kind === 'survival' || r.kind === 'rush' ? r.correct : `${r.correct}/${r.answered}`}</Text>}
              <Text style={s.small}>@{profile.name} · {r.kind === 'daily' ? `${r.correct}/5 in ${r.time}s` : r.kind === 'long' ? `${mmss(Number(r.time))} · ${r.points} depth points` : r.kind === 'survival' ? `${r.correct} survived` : r.kind === 'rush' ? 'right answers in 60s' : `${r.points} points`}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row' }}>
            <Stat s={s} value={`${r.correct}`} label="Correct" />
            <Stat s={s} value={`${r.acc}%`} label="Accuracy" />
            <Stat s={s} value={`${r.avg.toFixed(1)}s`} label="Per answer" />
          </View>
          <View style={s.resultFoot}>
            {r.kind === 'blitz' ? <Text style={[s.chip, { backgroundColor: r.delta > 0 ? C.goodSoft : r.delta < 0 ? C.badSoft : C.bg, color: r.delta > 0 ? C.good : r.delta < 0 ? C.bad : C.muted }]}>{r.delta === 0 ? 'Rating held' : `${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta)} Rating`}</Text> : null}
            <Text style={[s.chip, { backgroundColor: C.rivalSoft, color: C.rival }]}>+{r.xpGain} XP</Text>
            <Text style={s.chip}>{tier.icon} {r.score}</Text>
            <Text style={s.chip}>🔥 {r.streak}-day{st.cur ? ` ${st.cur.name}` : ''}</Text>
          </View>
          <Text style={s.cta}>Think you're sharper? Beat me on Witlo 🦉</Text>
        </View>

        <Wit s={s} mood={r.mood} text={r.wit} />
        <Bouncy onPress={again.go} style={s.btn}><Glow /><Text style={s.btnText}>{again.label}</Text></Bouncy>
        <Bouncy onPress={goHomeAfterGame} style={s.btnGhost} accessibilityLabel="Go home"><Text style={s.btnGhostText}>🏠 Home</Text></Bouncy>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {r.kind === 'blitz' ? <Bouncy onPress={() => startGame('blitz')} style={[s.btnGhost, { flex: 1 }]}><Text style={s.btnGhostText} numberOfLines={1}>🎲 New rival</Text></Bouncy> : null}
          {dailyLeft ? <Bouncy onPress={() => startGame('daily')} style={[s.btnGhost, { flex: 1 }]}><Text style={s.btnGhostText} numberOfLines={1}>📅 Daily 5</Text></Bouncy> : null}
          <Bouncy onPress={() => startGame('train', { cat: weakCat, sub: weakSub })} style={[s.btnGhost, { flex: 1 }]}><Text style={s.btnGhostText} numberOfLines={1}>🎯 {CATS[weakCat].name}</Text></Bouncy>
        </View>

        <View style={s.card}>
          <Pressable onPress={() => setInfo('xp')} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityRole="button">
            <Text style={s.lvChip}>Lv {lvNow.lv}</Text>
            <View style={s.xpMeter}><Animated.View style={[s.xpFill, { width: xpAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} /></View>
            <Text style={s.small}>+{r.xpGain} XP</Text>
          </Pressable>
          <Text style={s.small}>{`Game ${r.xpGame} XP`}{r.doubled ? ` · doubled +${r.xpGame}` : ''}{r.bonus ? ` · daily bonus +${r.bonus}` : ''}{r.missions.length ? ` · missions +${r.missions.reduce((a, m) => a + m.xp, 0)}` : ''}</Text>
          {canDouble || doubleState === 'busy' ? (
            <Bouncy onPress={doubleXp} disabled={doubleState === 'busy'} style={s.freezeBtn} accessibilityLabel="Double XP">
              <Text style={{ fontSize: 22 }}>🎁</Text>
              <View style={{ flex: 1 }}><Text style={s.freezeTitle}>{doubleState === 'busy' ? 'Loading…' : `Double it: +${r.xpGame} XP`}</Text><Text style={s.small}>Watch a short ad. Optional, {doublesLeft} left today.</Text></View>
            </Bouncy>
          ) : doubleState === 'fail' ? <Text style={s.small}>The ad didn't finish, so no bonus this time.</Text> : null}
          {r.levelUp ? <View style={[s.bigBadge, { borderColor: C.rival, backgroundColor: C.rivalSoft }]}><Text style={{ fontSize: 22 }}>⭐</Text><Text style={s.bigBadgeText}>LEVEL UP! You're now Level {r.levelUp}</Text></View> : null}
          {r.pbs.map((p) => <View key={p} style={[s.bigBadge, { borderColor: C.gold, backgroundColor: C.goldSoft }]}><Text style={{ fontSize: 22 }}>🏅</Text><View style={{ flex: 1 }}><Text style={[s.label, { color: C.ink }]}>NEW PERSONAL BEST</Text><Text style={s.bigBadgeText}>{p}</Text></View></View>)}
          {r.records && r.records.length ? <Text style={s.small}>📈 New record{r.records.length > 1 ? 's' : ''}: {r.records.join(' · ')}</Text> : null}
          {r.achs.map((a) => <View key={a.id} style={[s.bigBadge, { borderColor: C.accent, backgroundColor: C.accentSoft }]}><Text style={{ fontSize: 22 }}>{a.icon}</Text><View style={{ flex: 1 }}><Text style={[s.label, { color: C.ink }]}>ACHIEVEMENT UNLOCKED</Text><Text style={s.bigBadgeText}>{a.name} · {a.desc}</Text></View></View>)}
          {r.missions.map((m) => <View key={m.id} style={[s.bigBadge, { borderColor: C.good, backgroundColor: C.goodSoft }]}><Text style={{ fontSize: 22 }}>✅</Text><View style={{ flex: 1 }}><Text style={[s.label, { color: C.ink }]}>MISSION COMPLETE · +{m.xp} XP</Text><Text style={s.bigBadgeText}>{m.text}</Text></View></View>)}
        </View>

        {r.growth && r.growth.length ? (
          <View style={s.card}>
            <Text style={s.label}>YOUR GROWTH</Text>
            {r.growth.map((l) => <Text key={l} style={s.fbText}>{l}</Text>)}
          </View>
        ) : null}

        {r.mistakes && r.mistakes.length ? (
          <View style={s.card}>
            <View style={s.top}><Text style={s.label}>LEARN FROM THIS GAME</Text><Text style={s.small}>{r.mistakes.length} to review</Text></View>
            {r.mistakes.slice(0, 3).map((m, i) => <MistakeRow key={`${m.tid}-${i}`} m={m} s={s} C={C} />)}
            {r.mistakes.length > 3 ? <Text style={s.small}>+{r.mistakes.length - 3} more in the practice round</Text> : null}
            <Bouncy onPress={() => startGame('train', { tids: [...new Set(r.mistakes.map((m) => m.tid))], cat: r.mistakes[0].cat, review: true })} style={s.btnGhost} accessibilityLabel="Practise your mistakes">
              <Text style={s.btnGhostText}>🧠 Practise these with new numbers</Text>
            </Bouncy>
          </View>
        ) : null}

        {r.cats.length ? (
          <View style={s.card}>
            <Text style={s.label}>THIS GAME BY SUBJECT</Text>
            <CatBars rows={r.cats} />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Bouncy onPress={shareImage} style={[s.btnGhost, { flex: 1 }]}><Text style={s.btnGhostText} numberOfLines={1}>📤 Share</Text></Bouncy>
          <Bouncy onPress={() => shareText(r)} style={[s.btnGhost, { flex: 1 }]}><Text style={s.btnGhostText} numberOfLines={1}>💬 Challenge</Text></Bouncy>
        </View>
        {shareState ? <Text style={s.fb}>{shareState}</Text> : null}
      </>
    );
  } else { body = null; }

  const TABS = [['home', '🏠', 'Home'], ['train', '🎯', 'Train'], ['board', '🏅', 'Leaders'], ['me', null, 'Profile']];
  const tabOn = screen === 'longpick' || screen === 'rushpick' ? 'home' : screen;
  const infoData = info ? (typeof info === 'string' ? INFO[info] : info) : null;
  const gNow = gameRef.current;
  const stickyNext = screen === 'game' && gNow && gNow.paced && !!gNow.feedback;
  return (
    <View style={safe}>{bar}
      <ScrollView
        ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[s.wrap, !withTabs && { paddingBottom: insets.bottom + (stickyNext ? 110 : 28) }]} keyboardShouldPersistTaps="handled" scrollEventThrottle={64}
        onScroll={(e) => { const n = e.nativeEvent; scrollInfo.current = { ...scrollInfo.current, y: n.contentOffset.y, h: n.layoutMeasurement.height, ch: n.contentSize.height, lastMove: Date.now() }; if (hint) setHint(false); }}
        onLayout={(e) => { scrollInfo.current.h = e.nativeEvent.layout.height; }}
        onContentSizeChange={(w, h2) => { scrollInfo.current.ch = h2; }}
      >
        <Animated.View style={{ gap: 16, opacity: FADE ? pageAnim : 1, transform: [{ translateY: pageAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          {body}
        </Animated.View>
      </ScrollView>
      {hint ? (
        <Animated.View style={[s.hint, { bottom: (withTabs ? 86 + insets.bottom : stickyNext ? 96 + insets.bottom : 24 + insets.bottom), transform: [{ translateY: hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }) }] }]}>
          <Pressable onPress={() => { const si = scrollInfo.current; if (scrollRef.current) scrollRef.current.scrollTo({ y: si.y + si.h * 0.7, animated: true }); setHint(false); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel="Scroll down for more">
            <Text style={s.hintText}>Scroll for more</Text><Text style={[s.hintText, { fontSize: 16 }]}>⌄</Text>
          </Pressable>
        </Animated.View>
      ) : null}
      {stickyNext ? (
        <View style={[s.nextBar, { paddingBottom: Math.max(insets.bottom, 10) + 6 }]}>
          <Bouncy onPress={nextPaced} style={s.btn} accessibilityLabel="Next question"><Glow /><Text style={s.btnText}>{gNow.qi >= gNow.total ? 'See results' : 'Next question →'}</Text></Bouncy>
        </View>
      ) : null}
      {withTabs && (
        <View style={[s.tabsBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          {TABS.map(([key, icon, lab]) => {
            const on = tabOn === key;
            return (
              <Bouncy key={key} onPress={() => setScreen(key)} style={[s.tabBtn, on && { backgroundColor: C.accentSoft }]} accessibilityLabel={lab}>
                {icon ? <Text style={{ fontSize: 22 }}>{icon}</Text> : me(26, null, true)}
                <Text style={[s.tabLabel, on && { color: C.accent }]}>{lab}</Text>
              </Bouncy>
            );
          })}
        </View>
      )}
      {quitAsk && (
        <Backdrop style={s.modalBack}>
          <Appear style={s.modal}>
            <View style={{ alignItems: 'center' }}><WitArt mood="think" size={110} /></View>
            <Text style={[s.h2, { textAlign: 'center' }]}>Paused</Text>
            <Text style={[s.small, { textAlign: 'center', fontSize: 15 }]}>
              {gameRef.current && gameRef.current.kind === 'blitz' ? 'Leave this duel? Leaving counts as a loss.' : gameRef.current && gameRef.current.kind === 'daily' ? "Leave the Daily 5? Today's attempt won't be saved." : gameRef.current && (gameRef.current.kind === 'survival' || gameRef.current.kind === 'rush') ? 'Leave now? Your score so far will be saved.' : 'Leave now? Your answers so far still count towards your skill profile.'}
            </Text>
            <Bouncy onPress={keepPlaying} style={s.btn}><Text style={s.btnText}>Keep playing</Text></Bouncy>
            <Bouncy onPress={leaveGame} style={s.btnGhost}><Text style={[s.btnGhostText, { color: C.bad }]}>Leave</Text></Bouncy>
          </Appear>
        </Backdrop>
      )}
      {infoData && (
        <Backdrop style={s.sheetBack} onPress={() => setInfo(null)}>
          <Appear from={60} fade={false}><Pressable style={[s.sheet, { paddingBottom: insets.bottom + 22 }]} onPress={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Text style={{ fontSize: 30 }}>{infoData.icon}</Text><Text style={[s.sheetTitle, { flex: 1 }]}>{infoData.title}</Text></View>
            <Text style={s.sheetBody}>{infoData.body}</Text>
            <Bouncy onPress={() => setInfo(null)} style={s.btn}><Glow /><Text style={s.btnText}>Got it</Text></Bouncy>
          </Pressable></Appear>
        </Backdrop>
      )}
      {ask && (
        <Backdrop style={s.modalBack}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ width: '100%', alignItems: 'center' }}>
            <Appear style={s.modal}>
              {ask === 'rate' ? (
                <>
                  <View style={{ alignItems: 'center' }}><WitArt mood="wow" size={110} /></View>
                  <Text style={[s.h2, { textAlign: 'center' }]}>Enjoying Witlo?</Text>
                  <Text style={[s.small, { textAlign: 'center', fontSize: 15 }]}>Your answer helps a tiny team build a better game.</Text>
                  <Bouncy onPress={rateYes} style={s.btn}><Text style={s.btnText}>😍 Love it!</Text></Bouncy>
                  <Bouncy onPress={() => setAsk('feedback')} style={s.btnGhost}><Text style={s.btnGhostText}>🙂 It's okay</Text></Bouncy>
                  <Bouncy onPress={() => setAsk('feedback')} style={s.btnGhost}><Text style={s.btnGhostText}>😕 Not really</Text></Bouncy>
                  <Pressable onPress={() => { saveProfile({ ...profileRef.current, askedAt: Date.now() }); setAsk(null); }} hitSlop={10} accessibilityRole="button"><Text style={[s.small, { textAlign: 'center' }]}>Maybe later</Text></Pressable>
                </>
              ) : ask === 'feedback' ? (
                <>
                  <Text style={[s.h2, { textAlign: 'center' }]}>What should we improve?</Text>
                  <TextInput value={fbText} onChangeText={(t) => setFbText(t.slice(0, 1000))} multiline placeholder="Anything: a bug, a question that felt wrong, a feature you want…" placeholderTextColor={C.muted} style={s.feedbackInput} />
                  <Bouncy onPress={sendFeedback} style={s.btn}><Text style={s.btnText}>Send feedback</Text></Bouncy>
                  <Pressable onPress={() => { saveProfile({ ...profileRef.current, askedAt: Date.now() }); setAsk(null); setFbText(''); }} hitSlop={10} accessibilityRole="button"><Text style={[s.small, { textAlign: 'center' }]}>Cancel</Text></Pressable>
                </>
              ) : (
                <>
                  <View style={{ alignItems: 'center' }}><WitArt mood="proud" size={110} /></View>
                  <Text style={[s.h2, { textAlign: 'center' }]}>Thank you! 🙏</Text>
                  <Bouncy onPress={() => setAsk(null)} style={s.btn}><Text style={s.btnText}>Back to the game</Text></Bouncy>
                </>
              )}
            </Appear>
          </KeyboardAvoidingView>
        </Backdrop>
      )}
      <Confetti fire={confettiKey} />
      {SplashLayer}
    </View>
  );
}

// ---------------- Terms of Use (draft; have a lawyer review before launch) ----------------
const TERMS = [
  ['1. About Witlo', 'Witlo is a skill-based game of quick aptitude and reasoning puzzles, published by Logan Apps. It is for entertainment and practice only.'],
  ['2. Age', 'You must be 14 or older to use Witlo. If you are under 18, please use the app with the knowledge of a parent or guardian.'],
  ['3. No money, no gambling', 'Witlo never involves real money, betting or cash prizes. Ratings, XP, ranks, streaks and leaderboards have no monetary value and cannot be exchanged or sold.'],
  ['4. Rivals', "Until live matches launch, the rivals you duel, their reactions, and the players on the leaderboards are Witlo's AI challengers, tuned to match your level."],
  ['5. Your username and photo', 'Choose a username that is not offensive, hateful or pretending to be someone else. Do not use your full real name or personal details in it. If you add a photo avatar, it stays on your device.'],
  ['6. Not a test or assessment', 'Scores and ranks are a game measure only. They are not an IQ score, a professional or medical assessment, or a guarantee of success in any exam or job test.'],
  ['7. Your data', 'Your progress, question history, username and avatar are stored on your device. We do not ask for your contacts or location. Daily reminders, if you turn them on, are scheduled on your phone and can be switched off anytime in Profile. If ads are shown, our advertising partner (Google AdMob) may use your device advertising ID to show and measure ads, as described in our Privacy Policy.'],
  ['8. Ads and rewards', 'Witlo is free and may show ads between games, never during a question. You can choose to watch a short ad to earn a Streak Freeze or bonus XP, which have no monetary value. Ads come from third parties, and we are not responsible for their content.'],
  ['9. Play fair and look after yourself', 'Do not cheat, hack or misuse the app. Take regular breaks, and stop playing if you feel strain or discomfort.'],
  ['10. Content and ownership', 'The Witlo name, mascot, design and content belong to Logan Apps. You may share images of your own results. On Android, emoji graphics are Microsoft Fluent Emoji (MIT licence).'],
  ['11. No warranty', 'Witlo is provided "as is". We work to keep questions accurate but cannot guarantee the app will be error-free or always available. To the extent allowed by law, Logan Apps is not liable for any loss arising from use of the app.'],
  ['12. Changes and contact', 'We may update these terms and will ask you to accept important changes in the app. Questions? Contact Logan Apps at the support email on our store page.'],
];
