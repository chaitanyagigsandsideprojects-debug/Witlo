/* Witlo's subtle UI sounds. Small original clips (assets/sounds), played quietly and mixed with
   whatever else is playing (music, podcasts keep going). On iPhone they respect the silent switch.
   The player can turn them off in Profile. Everything fails silently: sound is never essential. */
let A = null;
try { A = require('expo-audio'); } catch (e) { A = null; }

const FILES = {
  tap: require('../assets/sounds/tap.wav'),
  correct: require('../assets/sounds/correct.wav'),
  combo: require('../assets/sounds/combo.wav'),
  wrong: require('../assets/sounds/wrong.wav'),
  tick: require('../assets/sounds/tick.wav'),
  start: require('../assets/sounds/start.wav'),
  win: require('../assets/sounds/win.wav'),
  lose: require('../assets/sounds/lose.wav'),
  reward: require('../assets/sounds/reward.wav'),
  match: require('../assets/sounds/match.wav'),
  level: require('../assets/sounds/level.wav'),
  pop: require('../assets/sounds/pop.wav'),
};
const MUSIC = require('../assets/sounds/music.mp3');
// Per-sound loudness: taps barely there, results a little fuller.
const VOL = { tap: 0.4, tick: 0.5, correct: 0.65, combo: 0.65, wrong: 0.55, start: 0.6, win: 0.75, lose: 0.6, reward: 0.6, match: 0.6, level: 0.7, pop: 0.5 };
const MUSIC_VOL = 0.22;

let enabled = true;
let musicOn = true; let music = null; let musicWanted = false; let fadeTimer = null;
let ready = false;
const players = {};
const lastAt = {};
// play() returns a promise on some platforms (web blocks audio until the first tap): never let it throw
const safePlay = (p) => { try { const r = p.play(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignore */ } };

export function setSoundEnabled(on) { enabled = !!on; }
export function soundEnabled() { return enabled; }

export async function initSounds() {
  if (!A || ready) return;
  ready = true;
  try { await A.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }); } catch (e) { /* older platforms */ }
  try { music = A.createAudioPlayer(MUSIC); music.loop = true; music.volume = 0; } catch (e) { music = null; }
  if (musicWanted) startMusic();
  Object.keys(FILES).forEach((k) => {
    try { const p = A.createAudioPlayer(FILES[k]); p.volume = VOL[k] || 0.5; players[k] = p; } catch (e) { /* skip this sound */ }
  });
}

export function playSound(name) {
  if (!enabled || !ready) return;
  const p = players[name]; if (!p) return;
  const now = Date.now();
  if (lastAt[name] && now - lastAt[name] < 45) return; // no machine-gun repeats
  lastAt[name] = now;
  try {
    if (p.currentTime > 0 || p.playing) {
      const r = p.seekTo(0);
      if (r && r.then) r.then(() => safePlay(p)).catch(() => {}); else safePlay(p);
    } else safePlay(p);
  } catch (e) { /* ignore */ }
}

/* Calm menu music: plays on menus only, fades in and out, never during a game. */
function fadeTo(target, ms, then) {
  if (!music) return; clearInterval(fadeTimer);
  const from = music.volume || 0; const steps = Math.max(1, Math.round(ms / 50)); let i = 0;
  fadeTimer = setInterval(() => {
    i += 1; try { music.volume = from + ((target - from) * i) / steps; } catch (e) { /* ignore */ }
    if (i >= steps) { clearInterval(fadeTimer); if (then) then(); }
  }, 50);
}
function startMusic() {
  if (!music || !musicOn) return;
  try { if (!music.playing) safePlay(music); fadeTo(MUSIC_VOL, 900); } catch (e) { /* ignore */ }
}
export function setMusic(wanted) {
  musicWanted = wanted;
  if (!ready || !music) return;
  if (wanted && musicOn) startMusic();
  else fadeTo(0, 500, () => { try { music.pause(); } catch (e) { /* ignore */ } });
}
export function setMusicEnabled(on) { musicOn = !!on; setMusic(musicWanted); }
