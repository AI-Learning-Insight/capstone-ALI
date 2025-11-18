// src/lib/student-code.js

const TRACK_PREFIX = {
  ANDROID: 'AND',
  WEB: 'WEB',
  CLOUD: 'CLD',
};

// Ambil ID mentee dari object user / profil
export function getRawMenteeId(userOrId) {
  if (!userOrId) return null;

  if (typeof userOrId === 'object') {
    return (
      userOrId.ml_user_id ??     // ID dari tabel ml_users (utama)
      userOrId.studentId ??      // kalau kamu simpan di state FE
      userOrId.id ??             // fallback ke users.id
      userOrId.nisn ??           // fallback terakhir (kalau masih ada)
      null
    );
  }

  return userOrId;
}

// Ambil prefix kelas (AND / WEB / CLD / default)
export function getMenteePrefix(userOrId, { defaultPrefix = 'ML' } = {}) {
  if (!userOrId) return defaultPrefix;

  if (typeof userOrId === 'object') {
    const u = userOrId;

    if (u.class_prefix) return u.class_prefix;

    if (u.class_track) {
      const key = String(u.class_track).toUpperCase();
      if (TRACK_PREFIX[key]) return TRACK_PREFIX[key];
    }
  }

  return defaultPrefix;
}

// Format final: "<PREFIX>-<ID>" atau "—" kalau belum ada
export function formatMenteeCode(userOrId, opts = {}) {
  const { defaultPrefix = 'ML' } = opts;

  if (!userOrId) return '—';

  if (typeof userOrId === 'object' && userOrId.class_code) {
    return userOrId.class_code;
  }

  const rawId = getRawMenteeId(userOrId);
  if (!rawId) return '—';

  const prefix = getMenteePrefix(userOrId, { defaultPrefix });
  if (!prefix) return String(rawId);

  return `${prefix}-${rawId}`;
}
