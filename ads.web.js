// Web preview: no ads.
export const adsSupported = () => false;
export const adsReady = () => false;
export const rewardedReady = () => false;
export const onAdsChange = () => () => {};
export async function initAds() {}
export async function showInterstitial() { return false; }
export async function showRewarded() { return false; }
