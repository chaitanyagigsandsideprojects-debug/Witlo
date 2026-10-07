# Witlo · project notes (read me first)

Witlo is a 60-second competitive aptitude game (Expo SDK 57 / React Native 0.86) by Logan Apps. Android-first, English, 14+, ads-funded.

## Build & release
- Every push to `main` builds a test APK on GitHub Actions (`.github/workflows/android-apk.yml`), installs it on an emulator, and publishes it under **Releases** as `Witlo-test-<run>.apk`. Put `[skip ci]` in a commit message to skip a build.
- The APK is signed with the standard debug key (installable over previous test builds). A Play Store release needs a real upload key + `.aab`.
- AdMob uses Google's **test** IDs (`app.json` → plugin and top-level `react-native-google-mobile-ads` key, which the library's Gradle script needs).

## Code map
- `App.js` – all screens and game flow (modes: Blitz, Daily 5, Long 5/10, Train, Category Rush, Survival).
- `engine/` – question engine: `core.js` (build/validate/fingerprint), `quant|logic|di|verbal|visual.js` (142 templates), `history.js` (seen questions, skills, concept mastery, growth snapshots), `taxonomy.js` (concept / thinking skill / archetype / family / aha per template), `director.js` (**Experience Director**: chooses what the player should experience next; Train transfer plan; Daily 5 sampler), `tips.js` (exam shortcut per topic), `index.js` (public API: `nextExperience`, `dailyFive`, `updateSkill`).
- `game/` – progression (ranks, XP, missions, achievements), info sheets, username rules.
- `ui/` – theme, shared parts (`Bouncy` buttons, avatars, Wit), `frames.js` (rank + cosmetic avatar frames, one-time reveal), `sound.js`, emoji rendering.

## Rules that must not change without the owner's say-so
Game modes, scoring (+1 per right answer in timed modes, 10 × level in Long/Train), timers (60 s Blitz/Rush, 20 s per question Survival), Elo rating (K 32, floor 1000), ranks (Silver 1100 … Grandmaster 1800). AI rivals must always be disclosed as AI challengers.

## Open items
Crash reporting, Firebase backend (Google sign-in, unique usernames, cloud save, real leaderboards/duels), real AdMob IDs + consent, support email + hosted privacy policy, release signing, more verbal content.
