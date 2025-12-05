import { db } from '../db/knex.js';
import { latestRecommendations } from '../services/recommendation.service.js';

// Hitung progress modul berdasarkan track (ANDROID / WEB / CLOUD) per mentee
async function getTrackModulesProgress(studentId) {
  // 1) Cari ml_user_id dari tabel users
  const user = await db('users')
    .select('ml_user_id')
    .where({ id: studentId })
    .first();

  if (!user || !user.ml_user_id) {
    return [];
  }

  const mlUserId = user.ml_user_id;

  // 2) Cari track utama mentee dari ml_user_class
  const cls = await db('ml_user_class')
    .select('class_track')
    .where({ ml_user_id: mlUserId })
    .first();

  const track = cls?.class_track;

  // 3) Ambil daftar modul di track tsb dari ml_complete + ml_journeys
  let rows = [];
  if (track) {
    rows = await db('ml_complete as c')
      .join('ml_journeys as j', 'j.id', 'c.journey_id')
      .select(
        'c.journey_id',
        'j.name',
        'j.class_track',
        'c.study_duration',
        'j.hours_to_study'
      )
      .where('c.user_id', mlUserId)
      .andWhere('j.class_track', track)
      .orderBy('c.study_duration', 'desc')
      .limit(4);
  }

  // Fallback: jika belum ada catatan completion, gunakan tracking (aktivitas tutorial)
  if (!rows.length) {
    const trackingRows = await db('ml_tracking as t')
      .join('ml_journeys as j', 'j.id', 't.journey_id')
      .select(
        't.journey_id',
        'j.name',
        'j.class_track',
        'j.class_prefix',
        'j.hours_to_study',
        db.raw('COUNT(*)::int as total_events'),
        db.raw(
          "SUM(CASE WHEN t.completed_at IS NOT NULL THEN 1 ELSE 0 END)::int as completed_events"
        )
      )
      .where('t.developer_id', mlUserId)
      .groupBy('t.journey_id', 'j.name', 'j.class_track', 'j.class_prefix', 'j.hours_to_study')
      .orderBy('total_events', 'desc')
      .limit(4);

    rows = trackingRows.map((r) => {
      const total = r.total_events ?? 0;
      const done = r.completed_events ?? 0;
      const percent =
        total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;

      return {
        journey_id: r.journey_id,
        name: r.name,
        class_track: r.class_track,
        class_prefix: r.class_prefix,
        study_duration: null,
        hours_to_study: r.hours_to_study ?? null,
        progress_percent: percent,
      };
    });
  }

  return rows.map((r) => {
    const duration = r.study_duration ?? 0; // jam belajar aktual
    const target = r.hours_to_study ?? 0; // estimasi jam yang disarankan

    let percent = r.progress_percent ?? 0;
    if (percent === 0 && target > 0) {
      percent = Math.round((duration / target) * 100);
      if (!Number.isFinite(percent)) percent = 0;
      if (percent > 100) percent = 100;
      if (percent < 0) percent = 0;
    }

    return {
      journey_id: r.journey_id,
      name: r.name,
      class_track: r.class_track, // ANDROID / WEB / CLOUD
      study_duration: r.study_duration, // jam belajar (bisa null)
      hours_to_study: target || null, // jam target
      progress_percent: percent, // 0-100 (bisa 0 jika belum ada completion)
    };
  });
}

export const overview = async (request, h) => {
  const student_id = request.auth.credentials.id;

  // Data lokal dashboard (nilai rapor, todo, rekomendasi, modul ML)
  const [subjects, todos, recs, modules] = await Promise.all([
    db('student_subject_progress').where({ student_id }).orderBy('subject'),
    db('todos').where({ student_id }).orderBy('created_at', 'desc').limit(5),
    latestRecommendations(student_id, 3),
    getTrackModulesProgress(student_id),
  ]);

  // materials_progress opsional, jadi kita bungkus try/catch
  let progressMaterials = [];
  try {
    progressMaterials = await db('materials_progress')
      .where({ student_id })
      .orderBy('completed_at', 'desc')
      .limit(5);
  } catch (e) {
    // abaikan kalau tabel belum ada
  }

  // Metrik headline (sementara masih statis; bisa disambung ML nanti)
  const metrics = {
    streak_days: 7,
    hours_this_week: 23,
    quiz_avg: 0.92,
    deadlines_soon: todos.filter((t) => t.status !== 'done').length,
  };

  const banner = {
    title: 'Kamu adalah Consistent Learner!',
    body:
      'Berdasarkan pola belajarmu, kamu menyelesaikan materi dengan konsisten setiap hari. ' +
      'Rata-rata kamu belajar 2-3 materi per hari dengan fokus sekitar 45 menit per materi. ' +
      'Pola belajar yang sangat baik untuk hasil jangka panjang!',
  };

  return h.response({
    status: 'ok',
    data: {
      metrics,
      banner,
      subjects,
      todos,
      recommendations: recs,
      materials: progressMaterials,
      // down inilah yang akan dipakai FE
      modules_progress: modules,
    },
  });
};
