// Witlo ads (Android / iOS).
// Uses Google AdMob through react-native-google-mobile-ads.
// In Expo Go the native ads module is not available, so everything here
// quietly does nothing and the game keeps working.
import { Platform } from 'react-native';

let G = null;
try {
  // eslint-disable-next-line global-require
  G = require('react-native-google-mobile-ads');
} catch (e) {
  G = null;
}

// ---- Replace these with your own AdMob ad unit IDs before release ----
// Until you do, Google's official test ads are shown (they earn nothing).
const AD_UNITS = {
  android: { interstitial: '', rewarded: '' },
  ios: { interstitial: '', rewarded: '' },
};

let ready = false;
let interstitial = null;
let rewarded = null;
let interLoaded = false;
let rewLoaded = false;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });

function unitId(kind) {
  const real = (AD_UNITS[Platform.OS] || {})[kind];
  if (!__DEV__ && real) return real;
  return kind === 'interstitial' ? G.TestIds.INTERSTITIAL : G.TestIds.REWARDED;
}

export const adsSupported = () => !!G;
export const adsReady = () => ready;
export const rewardedReady = () => ready && rewLoaded;
export function onAdsChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function initAds() {
  if (!G || ready) return;
  try {
    // Shows Google's consent form where the law requires it (e.g. EU/UK).
    let canRequest = true;
    try {
      const info = await G.AdsConsent.gatherConsent();
      if (info && info.canRequestAds === false) canRequest = false;
    } catch (e) { /* consent not required or unavailable */ }
    if (!canRequest) return;

    const mobileAds = G.default;
    // Witlo is for ages 14+, so keep ads suitable for teens.
    await mobileAds().setRequestConfiguration({ maxAdContentRating: G.MaxAdContentRating.T });
    await mobileAds().initialize();
    ready = true;

    interstitial = G.InterstitialAd.createForAdRequest(unitId('interstitial'));
    interstitial.addAdEventListener(G.AdEventType.LOADED, () => { interLoaded = true; });
    interstitial.addAdEventListener(G.AdEventType.CLOSED, () => { interLoaded = false; interstitial.load(); });
    interstitial.addAdEventListener(G.AdEventType.ERROR, () => {
      interLoaded = false;
      setTimeout(() => { try { interstitial.load(); } catch (e) { /* ignore */ } }, 30000);
    });
    interstitial.load();

    rewarded = G.RewardedAd.createForAdRequest(unitId('rewarded'));
    rewarded.addAdEventListener(G.RewardedAdEventType.LOADED, () => { rewLoaded = true; notify(); });
    rewarded.addAdEventListener(G.AdEventType.CLOSED, () => { rewLoaded = false; notify(); rewarded.load(); });
    rewarded.addAdEventListener(G.AdEventType.ERROR, () => {
      rewLoaded = false; notify();
      setTimeout(() => { try { rewarded.load(); } catch (e) { /* ignore */ } }, 30000);
    });
    rewarded.load();
    notify();
  } catch (e) {
    ready = false;
  }
}

// Resolves after the ad is closed (true) or right away if no ad was ready (false).
export function showInterstitial() {
  return new Promise((resolve) => {
    if (!ready || !interstitial || !interLoaded) { resolve(false); return; }
    const off = interstitial.addAdEventListener(G.AdEventType.CLOSED, () => { off(); resolve(true); });
    interstitial.show().catch(() => { off(); resolve(false); });
  });
}

// Resolves true only if the player watched long enough to earn the reward.
export function showRewarded() {
  return new Promise((resolve) => {
    if (!ready || !rewarded || !rewLoaded) { resolve(false); return; }
    let earned = false;
    const offEarn = rewarded.addAdEventListener(G.RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
    const offClose = rewarded.addAdEventListener(G.AdEventType.CLOSED, () => { offEarn(); offClose(); resolve(earned); });
    rewarded.show().catch(() => { offEarn(); offClose(); resolve(false); });
  });
}
