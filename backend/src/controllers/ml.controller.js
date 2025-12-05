import Boom from '@hapi/boom';
import {
  getFeaturesByAppUserId,
  getFeaturesByMlUserId,
  baselineDropoutRisk,
  getLearnerClusterByMlUserId,
} from '../services/ml.service.js';

export async function myFeatures(req, h) {
  const uid = req.auth?.credentials?.id;
  const feat = await getFeaturesByAppUserId(uid);
  if (!feat) throw Boom.notFound('Learning features not found for current user');
  return h.response({ status: 'ok', data: feat });
}

// Admin/by id (opsional)
export async function userFeatures(req, h) {
  const mlId = Number(req.params.mlUserId);
  const feat = await getFeaturesByMlUserId(mlId);
  if (!feat) throw Boom.notFound('Learning features not found for ml_user_id');
  return h.response({ status: 'ok', data: feat });
}

export async function dropoutRisk(req, h) {
  // Bisa diganti panggil Colab/ML API eksternal
  const uid = req.auth?.credentials?.id;
  const feat = await getFeaturesByAppUserId(uid);
  if (!feat) throw Boom.notFound('Learning features not found');
  const res = baselineDropoutRisk(feat);
  return h.response({ status: 'ok', data: res });
}

// === Learner Type (berdasarkan tabel ml_learner_cluster) ===
export async function learnerType(req, h) {
  const uid = req.auth?.credentials?.id;
  const feat = await getFeaturesByAppUserId(uid); // berisi ml_user_id bila link sukses
  if (!feat?.ml_user_id) throw Boom.notFound('User belum tertaut ke data ML');

  const row = await getLearnerClusterByMlUserId(feat.ml_user_id);
  if (!row) throw Boom.notFound('Learner type belum tersedia untuk user ini');

  const data = {
    learner_type: row.learner_type,     // e.g. "Consistent Learner"
    learning_style: row.learning_style, // "fast|consistent|reflective"
    cluster: row.cluster,
  };
  return h.response({ status: 'ok', data });
}
