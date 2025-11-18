import api from './api';

export async function fetchMyFeatures() {
  const r = await api.get('/ml/features');
  return r.data?.data;
}

export async function fetchDropoutRisk() {
  const r = await api.post('/ml/dropout-risk', {});
  return r.data?.data; // { risk_score, factors }
}

export async function fetchLearnerType() {
  const r = await api.get('/ml/learner-type');
  return r.data?.data; // { learner_type, learning_style, cluster }
}
