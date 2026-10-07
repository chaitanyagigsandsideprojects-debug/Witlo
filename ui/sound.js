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
};
// Per-sound loudness: taps barely there, results a little fuller.
const VOL = { tap: 0.35, tick: 0.45, correct: 0.6, combo: 0.6, wrong: 0.55, start: 0.55, win: 0.7, lose: 0.6, reward: 0.6, match: 0.6 };

let enabled = true;
let ready = false;
const players = {};
const lastAt = {};

export function setSoundEnabled(on) { enabled = !!on; }
export function soundEnabled() { return enabled; }

export async function initSounds() {
  if (!A || ready) return;
  ready = true;
  try { await A.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }); } catch (e) { /* older platforms */ }
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
      if (r && r.then) r.then(() => p.play()).catch(() => {}); else p.play();
    } else p.play();
  } catch (e) { /* ignore */ }
}
