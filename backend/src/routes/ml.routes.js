// backend/src/routes/ml.routes.js
import knex from '../db/knex.js';
import {
  myFeatures,
  userFeatures,
  dropoutRisk,
  learnerType,
} from '../controllers/ml.controller.js';

const mlRoutes = [
  {
    method: 'GET',
    path: '/ml/features',
    options: { auth: 'jwt' },
    handler: myFeatures,
  },
  {
    method: 'GET',
    path: '/ml/features/{mlUserId}',
    options: { auth: 'jwt' },
    handler: userFeatures,
  },
  {
    method: 'POST',
    path: '/ml/dropout-risk',
    options: { auth: 'jwt' },
    handler: dropoutRisk,
  },
  {
    method: 'GET',
    path: '/ml/learner-type',
    options: { auth: 'jwt' },
    handler: learnerType,
  },

  // NEW: GET /me/insights -> fitur + cluster milik user yang sedang login
  {
    method: 'GET',
    path: '/me/insights',
    options: { auth: 'jwt' },
    handler: async (req, h) => {
      const userId =
        req.auth?.credentials?.id || req.auth?.credentials?.userId;

      // ambil ml_user_id dari users
      const u = await knex('users')
        .select('ml_user_id', 'email', 'name')
        .where({ id: userId })
        .first();

      // kalau belum punya ml_user_id, balikin object kosong
      if (!u?.ml_user_id) {
        return h.response({}).code(200);
      }

      // fitur ML
      const f = await knex('ml_user_features')
        .where({ ml_user_id: u.ml_user_id })
        .first();

      // cluster / learner type
      const c = await knex('ml_learner_cluster')
        .where({ developer_id: u.ml_user_id })
        .first();

      // util
      const clamp = (x, lo = 0, hi = 1) =>
        Math.max(lo, Math.min(hi, Number(x) || 0));

      const existsColumn = async (table, column) => {
        const r = await knex('information_schema.columns')
          .where({ table_schema: 'public', table_name: table })
          .andWhere('column_name', column)
          .first();
        return !!r;
      };

      // normalisasi 'hari terakhir aktif' → hari
      const toDays = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) return null;

        // asumsi:
        // -  > 3650 && < 100000  => menit (± > ~2.5 hari, < ~69 hari)
        // -  >= 100000           => detik
        // -  lainnya              => sudah dalam hari
        if (n > 3650 && n < 100000) return Math.round(n / 1440); // menit → hari
        if (n >= 100000) return Math.round(n / 86400); // detik → hari
        return Math.round(n); // sudah satuan hari
      };

      // fallback perhitungan risiko (0..1) bila kolom tidak tersedia
      const riskFromFeatures = (feat = {}) => {
        const pass = clamp(feat.pass_rate);
        const avg = clamp((Number(feat.avg_exam_score) || 0) / 100);
        const rating = clamp(
          ((Number(feat.avg_submission_rating) || 1) - 1) / 4
        );
        const minutes = clamp((Number(feat.study_minutes) || 0) / 600); // cap 600m
        const tutorials = clamp(
          (Number(feat.tutorials_completed) || 0) / 300
        );
        const idleDays = toDays(feat.days_since_last_activity) ?? 0;
        const idle = clamp(idleDays / 30); // 30 hari = risiko penuh

        const lowPass = 1 - pass;
        const lowAvg = 1 - avg;
        const lowRating = 1 - rating;
        const lowMinutes = 1 - minutes;
        const lowTut = 1 - tutorials;

        const score =
          0.35 * idle +
          0.20 * lowPass +
          0.15 * lowAvg +
          0.15 * lowRating +
          0.10 * lowMinutes +
          0.05 * lowTut;

        return clamp(score);
      };

      // style
      const lt = String(c?.learner_type || '').toLowerCase();
      const style = lt.includes('fast')
        ? 'fast'
        : lt.includes('reflective')
        ? 'reflective'
        : 'consistent';

      // pastikan ada dropout_risk (ambil dari kolom bila ada, kalau tidak hitung)
      let dropout_risk = null;
      if (await existsColumn('ml_user_features', 'dropout_risk')) {
        dropout_risk = Number(f?.dropout_risk ?? 0);
      } else {
        dropout_risk = riskFromFeatures(f || {});
      }

      // rapikan days_since_last_activity ke satuan hari
      const normalizedIdle = toDays(f?.days_since_last_activity);

      return {
        ...(f || {}),
        days_since_last_activity:
          normalizedIdle ?? (f?.days_since_last_activity ?? null),
        style,
        learner_type_text: c?.learner_type || null,
        dropout_risk,
      };
    },
  },
];

export default mlRoutes;
