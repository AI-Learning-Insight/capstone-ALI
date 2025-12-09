import 'dotenv/config';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';

// Gunakan DATABASE_URL yang sama dengan backend (default ke service db di Docker Compose).
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5434/ali',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const emailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
};

const transporter = nodemailer.createTransport(emailConfig);
const RECIPIENT_LIMIT = Number(process.env.BOT_RECIPIENT_LIMIT || 10);
const FILTER_LEARNER_TYPE = process.env.BOT_LEARNER_TYPE; // opsional filter cluster, mis. "Fast Learner"

// Base URL FE (hindari localhost untuk email publik)
const BASE_WEB_URL = (() => {
  const candidates = [
    process.env.PUBLIC_BASE_URL,
    process.env.FRONTEND_BASE_URL,
    process.env.APP_BASE_URL,
    'https://capstone-ali-peach.vercel.app',
  ].filter(Boolean);

  const nonLocal = candidates.find(
    (u) => !/localhost|127\.0\.0\.1/i.test(u || '')
  );
  return nonLocal || 'https://capstone-ali-peach.vercel.app';
})();

// Link dashboard (tidak pakai modul/localhost)
const DASHBOARD_URL = `${BASE_WEB_URL.replace(/\/+$/, '')}/dashboard`;

// Link logo publik
const LOGO_URL =
  process.env.LOGO_URL ||
  `${BASE_WEB_URL.replace(/\/+$/, '')}/logo-edulinsight.png`;

async function fetchRecipients() {
  const params = [];
  let filterSql = '';

  if (FILTER_LEARNER_TYPE) {
    params.push(FILTER_LEARNER_TYPE);
    filterSql = `AND lc.learner_type = $${params.length}`;
  }

  const query = `
    SELECT
      COALESCE(u.name, u.email)            AS name,
      u.email,
      COALESCE(lc.learner_type, 'Learner') AS learner_type,
      COALESCE(uf.study_minutes, 0)                      AS avg_time_to_complete,
      COALESCE(uf.tutorials_completed, uf.enrollments_count, 0) AS total_completed_modules,
      COALESCE(uf.avg_submission_rating, 0)              AS avg_submission_rating,
      COALESCE(uf.avg_exam_score, 0)                     AS avg_exam_score,
      COALESCE(uf.pass_rate, 0)                          AS exam_pass_rate,
      COALESCE(uf.days_since_last_activity, 0)           AS active_days
    FROM users u
    LEFT JOIN ml_learner_cluster lc ON lc.developer_id = u.ml_user_id
    LEFT JOIN ml_user_features uf   ON uf.ml_user_id  = u.ml_user_id
    WHERE u.ml_user_id IS NOT NULL
      AND u.email IS NOT NULL AND u.email <> ''
      ${filterSql}
    ORDER BY u.email
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

const SUBJECT = 'Saatnya Naik Level! Ayo Selesaikan Modulmu';

function suggestionCopy(row) {
  const type = (row.learner_type || '').toUpperCase();
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const avgTimeRaw = toNum(row.avg_time_to_complete);
  const avgTimeHours =
    avgTimeRaw != null && avgTimeRaw > 30 ? avgTimeRaw / 60 : avgTimeRaw;

  const totalModules = toNum(row.total_completed_modules);
  const avgSubmission = toNum(row.avg_submission_rating);
  const avgExam = toNum(row.avg_exam_score);
  const passRate = toNum(row.exam_pass_rate); // 0-1
  const activeDays = toNum(row.active_days);

  const fmt = (v, d = 2) => (v == null ? '-' : Number(v).toFixed(d));
  const fmtInt = (v) => (v == null ? '-' : Math.round(v));

  if (type.includes('FAST')) {
    let text = `Kamu adalah Fast Learner karena kamu menunjukkan kecepatan luar biasa dalam menyelesaikan modul (rata-rata waktu untuk menyelesaikan: ${fmt(avgTimeHours)} jam) dan telah menyelesaikan sejumlah besar modul (${fmtInt(totalModules)} modul).`;
    if ((avgSubmission != null && avgSubmission < 2.0) || (avgExam != null && avgExam < 70.0)) {
      text += ` Namun, perlu diperhatikan bahwa rata-rata nilai submissionmu (${fmt(avgSubmission)}) dan skor ujianmu (${fmt(avgExam)}) cenderung lebih rendah. Hal ini menunjukkan kecepatan mungkin mengorbankan pemahaman mendalam. Saran: Coba luangkan lebih banyak waktu untuk memahami materi sebelum melangkah ke modul berikutnya dan manfaatkan fitur review untuk memperkuat konsep.`;
    } else {
      text += ' Kecepatanmu ini sangat baik! Saran: Terus pertahankan ritme belajarmu dan coba tantang dirimu dengan modul-modul yang lebih kompleks.';
    }
    return text;
  }

  if (type.includes('CONSISTENT')) {
    let text = `Kamu adalah Consistent Learner karena kamu aktif belajar secara teratur (aktif selama ${fmtInt(activeDays)} hari), menyelesaikan modul dalam jumlah yang baik (${fmtInt(totalModules)} modul), dan menunjukkan performa yang solid dalam submission (rata-rata rating: ${fmt(avgSubmission)}) serta ujian (rata-rata skor: ${fmt(avgExam)}).`;
    if ((avgExam != null && avgExam >= 85.0) && (passRate != null && passRate >= 0.9)) {
      text += ' Performa belajarmu sangat impresif! Saran: Kamu bisa mencoba menjadi mentor atau berbagi pengetahuan dengan sesama pembelajar untuk memperdalam pemahamanmu.';
    } else {
      text += ' Kamu memiliki keseimbangan yang baik antara menyelesaikan modul dan memahami materi. Saran: Terus pertahankan pola belajarmu ini! Jika ada modul yang terasa lebih sulit, jangan ragu untuk mengulanginya atau mencari sumber belajar tambahan.';
    }
    return text;
  }

  if (type.includes('REFLECTIVE')) {
    let text = `Kamu adalah Reflective Learner karena aktivitas belajarmu masih terbatas. Data menunjukkan kamu baru sedikit menyelesaikan modul (${fmtInt(totalModules)} modul) dan belum banyak berinteraksi dengan fitur submission atau ujian.`;
    text += ' Ini bisa berarti kamu masih dalam tahap awal eksplorasi atau membutuhkan dorongan untuk memulai. Saran: Jangan ragu untuk mencoba modul-modul awal yang paling menarik minatmu. Fokus pada satu modul hingga selesai untuk mendapatkan momentum. Jika kamu merasa kesulitan, ada banyak sumber daya dan komunitas yang siap membantumu!';
    return text;
  }

  return 'Terus lanjutkan progres belajarmu dan manfaatkan modul-modul yang tersedia untuk naik level berikutnya.';
}

function buildEmail(row) {
  const safeName = row.name || 'teman';
  const label = row.learner_type || 'Learner';
  const suggestion = suggestionCopy(row);

  const lines = [
    `Hi ${safeName},`,
    `Saat ini status belajarmu berada di tahap ${label}.`,
    suggestion,
    'Ayo lanjutkan belajarmu hari ini dan tingkatkan progresmu!',
    `Cek progres belajarmu di dashboard: ${DASHBOARD_URL}`,
    'Semangat terus - setiap langkah kecil membawa kamu lebih dekat ke level berikutnya!',
  ];

  const text = lines.join('\n');

  const html = `
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="font-family:'Segoe UI',Arial,sans-serif;background:#f6f7fb;padding:24px;color:#0f172a;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="620" style="max-width:620px;background:#ffffff;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
          <tr>
            <td align="left" style="padding-bottom:16px;">
              <img src="${LOGO_URL}" alt="EdulInsight" style="height:120px; width:auto; display:block;" />
            </td>
          </tr>
          <tr>
            <td style="font-size:16px;font-weight:600;color:#0f172a;padding-bottom:12px;">Hi ${safeName}👋,</td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#0f172a;line-height:1.6;padding-bottom:12px;">
              Saat ini status belajarmu berada di tahap <strong>${label}</strong>.
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#0f172a;line-height:1.6;padding-bottom:16px;">
              ${suggestion}
            </td>
          </tr>
          <tr>
            <td style="font-size:14px;color:#0f172a;line-height:1.6;padding-bottom:20px;">
              Ayo lanjutkan belajarmu hari ini dan tingkatkan progresmu!
            </td>
          </tr>
          <tr>
            <td align="left" style="padding-bottom:18px;">
              <a href="${DASHBOARD_URL}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:14px;">Buka Dashboard</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#475569;line-height:1.6;">
              Semangat terus - setiap langkah kecil membawa kamu lebih dekat ke level berikutnya!🔥🔥🔥
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  return { text, html };
}

async function sendEmail(to, subject, content) {
  const info = await transporter.sendMail({
    from: emailConfig.auth.user,
    to,
    subject,
    text: content.text,
    html: content.html,
  });

  console.log(`Email sent to ${to}: ${info.messageId}`);
}

async function runEmailBot() {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Starting email bot`);

  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    console.warn('Email bot skipped: set GMAIL_USER & GMAIL_APP_PASSWORD first.');
    return;
  }

  try {
    const candidates = await fetchRecipients();
    if (!candidates.length) {
      console.log('No recipients found for current criteria.');
      return;
    }

    // Rotasi: geser offset berdasarkan epoch/5 menit agar limit kecil tetap berganti penerima.
    const offset =
      Math.floor(Date.now() / (5 * 60 * 1000)) % Math.max(candidates.length, 1);
    const rotated = candidates
      .slice(offset)
      .concat(candidates.slice(0, offset))
      .slice(0, RECIPIENT_LIMIT);

    await Promise.all(
      rotated.map(async (row) => {
        try {
          const body = buildEmail(row);
          await sendEmail(row.email, SUBJECT, body);
          console.log(`Email sent for ${row.email}`);
        } catch (error) {
          console.error(`Failed sending email to ${row.email}: ${error.message}`);
        }
      }),
    );

    console.log(`[${ts}] Email bot completed`);
  } catch (error) {
    console.error(`[${ts}] Email bot error:`, error);
  }
}

runEmailBot();

const FIVE_MINUTES = 5 * 60 * 1000;
setInterval(runEmailBot, FIVE_MINUTES);

process.on('SIGINT', () => {
  console.log('Shutting down email bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down email bot...');
  process.exit(0);
});
