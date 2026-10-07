// Witlo daily reminders (local notifications, no server needed).
// Reminders are rescheduled every time the player finishes a game,
// so they only fire on days the player hasn't shown up.
import { Platform } from 'react-native';
import { MOTIVATION } from './game/motivation';

let N = null;
try {
  // eslint-disable-next-line global-require
  N = require('expo-notifications');
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  N = null;
}

const CHANNEL = 'reminders';

export const remindersSupported = () => !!N;

export async function askReminderPermission() {
  if (!N) return false;
  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL, {
        name: 'Daily reminders',
        importance: N.AndroidImportance.DEFAULT,
      });
    }
    const res = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    const ok = res.granted || (res.ios && res.ios.status === N.IosAuthorizationStatus.PROVISIONAL);
    return !!ok;
  } catch (e) {
    return false;
  }
}

export async function cancelReminders() {
  if (!N) return;
  try { await N.cancelAllScheduledNotificationsAsync(); } catch (e) { /* ignore */ }
}

// name: username; streak: current streak; playedToday: boolean;
// pb: best Blitz score (optional); improving: a category name the player is getting better at (optional)
export async function scheduleReminders({ name, streak, playedToday, pb, improving, motivation = true }) {
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    const third = improving
      ? { title: `📈 You've been improving at ${improving}`, body: "Ready for today's challenge?" }
      : pb ? { title: `🏆 Your best Blitz is ${pb}`, body: 'Think today is the day you beat it?' }
        : { title: '⚡ Rivals are online', body: 'One 60-second Blitz. Just one.' };
    const messages = streak > 0
      ? [
        { title: `🔥 Your ${streak}-day streak is waiting`, body: `${name}, one quick game keeps it alive.` },
        { title: '📅 Your Daily 5 is waiting', body: 'Five fresh questions, the same for everyone today.' },
        third,
      ]
      : [
        { title: '📅 Your Daily 5 is waiting', body: `${name}, five quick questions. Start a streak today!` },
        third,
        { title: '🦉 Wit saved you a puzzle', body: 'Your brain gym is open. One round?' },
      ];
    let slot = 0;
    for (let d = playedToday ? 1 : 0; d <= 3 && slot < messages.length; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      date.setHours(20, 0, 0, 0); // 8 pm local time
      if (date <= now) continue;
      const content = { ...messages[slot], sound: false };
      await N.scheduleNotificationAsync({
        content,
        trigger: Platform.OS === 'android'
          ? { type: N.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL }
          : { type: N.SchedulableTriggerInputTypes.DATE, date },
      });
      slot += 1;
    }
    // Daily motivation: one warm line each morning for the next week (a different one every day)
    if (motivation) {
      const dayNo = Math.floor(Date.now() / 864e5);
      for (let d = 0; d < 7; d++) {
        const date = new Date(now); date.setDate(now.getDate() + d); date.setHours(8, 45, 0, 0);
        if (date <= now) continue;
        const [title, body] = MOTIVATION.daily[(dayNo + d) % MOTIVATION.daily.length];
        await N.scheduleNotificationAsync({
          content: { title, body, sound: false },
          trigger: Platform.OS === 'android' ? { type: N.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL } : { type: N.SchedulableTriggerInputTypes.DATE, date },
        });
      }
    }
  } catch (e) {
    /* reminders are optional */
  }
}
