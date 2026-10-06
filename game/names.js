/* Username checks that work without a server.
   (Real "is this name taken?" needs the online backend; until then we block
   offensive names, reserved words and look-alikes of Witlo's AI rivals.) */
const RESERVED = ['admin', 'administrator', 'witlo', 'wit', 'support', 'moderator', 'mod', 'official', 'loganapps', 'logan_apps', 'staff', 'team', 'system', 'root', 'null', 'undefined', 'help', 'google', 'android', 'apple'];
// Kept short and to the point; matched as substrings after removing digits, _ and .
const BLOCK = ['fuck', 'fuk', 'shit', 'bitch', 'bastard', 'cunt', 'dick', 'pussy', 'whore', 'slut', 'rape', 'nigg', 'fag', 'porn', 'sex', 'nazi', 'hitler', 'chutiya', 'chutia', 'madarchod', 'behenchod', 'bhenchod', 'bhosdi', 'bhosad', 'gaand', 'gandu', 'lund', 'randi', 'harami', 'kutta', 'kutti', 'mc', 'bc', 'bsdk', 'lavde', 'lawde', 'loda', 'lauda', 'chod'];
const SHORT_BLOCK = new Set(['mc', 'bc']); // only blocked as the whole name or as a separate part

export function checkUsername(raw, takenNames = []) {
  const name = (raw || '').trim();
  if (!name) return { ok: false, msg: '3–15 letters, numbers, _ or .' };
  if (!/^[A-Za-z0-9_.]{3,15}$/.test(name)) return { ok: false, msg: 'Use 3–15 letters, numbers, _ or . (no spaces)' };
  if (/^[._]|[._]$/.test(name) || /[._]{2}/.test(name)) return { ok: false, msg: "Don't start or end with . or _, or repeat them" };
  if (/^\d+$/.test(name)) return { ok: false, msg: 'Add at least one letter' };
  const low = name.toLowerCase(); const flat = low.replace(/[0-9_.]/g, '');
  const parts = low.split(/[._0-9]+/).filter(Boolean);
  if (BLOCK.some((w) => (SHORT_BLOCK.has(w) ? parts.includes(w) || flat === w : flat.includes(w)))) return { ok: false, msg: "That name isn't allowed. Try another." };
  if (RESERVED.includes(low) || RESERVED.includes(flat)) return { ok: false, msg: 'That name is reserved. Try another.' };
  if (takenNames.some((t) => t.toLowerCase() === low)) return { ok: false, msg: 'That name is taken. Try another.' };
  return { ok: true, msg: 'Looks great!' };
}
