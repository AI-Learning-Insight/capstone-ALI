// backend/src/services/ml.service.js
import axios from 'axios';
import knex from '../db/knex.js';

// ==== HTTP Client ke layanan ML eksternal (Colab/Cloud Run) ====
const {
  ML_BASE_URL = '',
  ML_API_KEY = '',
  ML_TIMEOUT_MS = '5000',
} = process.env;

export const mlClient = ML_BASE_URL
  ? axios.create({
      baseURL: ML_BASE_URL,
      timeout: Number(ML_TIMEOUT_MS || 5000),
      headers: ML_API_KEY ? { 'x-api-key': ML_API_KEY } : {},
    })
  : null;

// ==== Fitur data warehouse (fitur belajar) ====
export async function findMlUserIdByEmail(email) {
  if (!email) return null;
  const row = await knex('ml_users').select('id').where({ email }).first();
  return row?.id ?? null;
}

export async function getFeaturesByMlUserId(mlUserId) {
  return knex('ml_user_features').where({ ml_user_id: mlUserId }).first();
}

export async function getFeaturesByAppUserId(appUserId) {
  const u = await knex('users').select('email', 'ml_user_id').where({ id: appUserId }).first();
  if (!u) return null;

  let mlId = u.ml_user_id;
  if (!mlId) {
    mlId = await findMlUserIdByEmail(u.email);
    if (mlId) await knex('users').update({ ml_user_id: mlId }).where({ id: appUserId });
  }
  if (!mlId) return null;

  return getFeaturesByMlUserId(mlId);
}

// --- di dekat fungsi getFeaturesByAppUserId ---
export async function getLearnerClusterByMlUserId(mlUserId) {
  if (!mlUserId) return null;
  const row = await knex('ml_learner_cluster')
    .select('*')
    .where({ developer_id: mlUserId })
    .first();
  if (!row) return null;

  const lt = (row.learner_type || '').toLowerCase();
  const learning_style =
    lt.includes('fast') ? 'fast' :
    lt.includes('reflective') ? 'reflective' :
    'consistent';

  return { ...row, learning_style };
}

// ==== Baseline risiko dropout (rule-based lokal) ====
export function baselineDropoutRisk(feat) {
  if (!feat) return { risk_score: 0.5, factors: [] };
  const days = Number(feat.days_since_last_activity || 0);
  const passRate = Number(feat.pass_rate || 0);
  const study = Number(feat.study_minutes || 0);

  let score = 0.3 + Math.min(days / 90, 1) * 0.4 - passRate * 0.2 - Math.min(study / 600, 1) * 0.2;
  score = Math.max(0, Math.min(1, score));

  const factors = [];
  if (days > 14) factors.push({ key: 'inactivity_days', value: days });
  if (passRate < 0.5) factors.push({ key: 'low_pass_rate', value: passRate });
  if (study < 120) factors.push({ key: 'low_study_minutes', value: study });

  return { risk_score: Number(score.toFixed(3)), factors };
}
