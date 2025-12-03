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

// Link dashboard modul (fallback ke FE dev jika tidak ada env).
const DASHBOARD_URL =
  process.env.DASHBOARD_URL ||
  process.env.PUBLIC_BASE_URL ||
  process.env.APP_BASE_URL ||
  'http://localhost:5173/dashboard';

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
      COALESCE(lc.learner_type, 'Learner') AS learner_type
    FROM users u
    LEFT JOIN ml_learner_cluster lc ON lc.developer_id = u.ml_user_id
    WHERE u.ml_user_id IS NOT NULL
      AND u.email IS NOT NULL AND u.email <> ''
      ${filterSql}
    ORDER BY u.email
  `;

  const { rows } = await pool.query(query, params);
  return rows;
}

const SUBJECT = 'Saatnya Naik Level! Ayo Selesaikan Modulmu 🔥';

function buildBody(name, learnerType) {
  const safeName = name || 'teman';
  const label = learnerType || 'Learner';
  return [
    `Hi ${safeName},`,
    `Kami ingin mengingatkan bahwa saat ini status belajarmu masih berada di tahap ${label}.`,
    'Kamu bisa naik level lebih cepat dengan melanjutkan dan menyelesaikan modul-modul yang tersedia.',
    'Ayo lanjutkan belajarmu hari ini dan tingkatkan progresmu!',
    `Klik modul yang belum selesai di sini: ${DASHBOARD_URL}`,
    'Semangat terus — setiap langkah kecil membawa kamu lebih dekat ke level berikutnya! 💪',
  ].join('\n');
}

async function sendEmail(to, subject, text) {
  const info = await transporter.sendMail({
    from: emailConfig.auth.user,
    to,
    subject,
    text,
    html: text.split('\n').map((p) => `<p>${p}</p>`).join(''),
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
          const body = buildBody(row.name, row.learner_type);
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
