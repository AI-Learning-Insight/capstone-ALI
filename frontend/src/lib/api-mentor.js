import api from './api';

export async function fetchMentorOverview() {
  const r = await api.get('/mentor/overview');
  return r.data?.data;
}

export async function fetchMentorMentees(params = {}) {
  const r = await api.get('/mentor/mentees', { params });
  return r.data?.data; // { items, pagination }
}
