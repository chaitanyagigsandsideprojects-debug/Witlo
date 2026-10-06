// Web preview: no reminders.
export const remindersSupported = () => false;
export async function askReminderPermission() { return false; }
export async function scheduleReminders() {}
export async function cancelReminders() {}
