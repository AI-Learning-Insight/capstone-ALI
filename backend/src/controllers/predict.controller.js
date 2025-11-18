// backend/src/controllers/predict.controller.js
import { saveRecommendation } from '../services/recommendation.service.js';
import { mlClient } from '../services/ml.service.js';

export const predict = async (request, h) => {
  const { scores, psych, learning_style } = request.payload;
  let result;

  // Jika ML aktif, gunakan endpoint Colab khusus (misal /predict)
  if (mlClient.enabled) {
    try {
      result = await mlClient.examPassProb({
        // contoh: mapping sederhana; sesuaikan bila model mengharuskan struktur lain
        userId: request.auth.credentials.id,
        examModuleId: 'major-track', // placeholder; ganti jika ML butuh modul spesifik
      });

      // Konversi PASS/FAIL ke track IPA/IPS (contoh sementara)
      const track = result?.label === 'PASS' ? 'IPA' : 'IPS';
      const confidence = Number(result?.prob ?? 0);
      const explanations = (result?.topFeatures ?? []).map((f) => ({
        feature: f.name,
        contribution: f.contrib,
      }));

      const programs = track === 'IPA'
        ? ['Teknik Informatika', 'Teknik Elektro', 'Kedokteran']
        : ['Manajemen', 'Akuntansi', 'Ilmu Komunikasi'];

      const rec = await saveRecommendation(request.auth.credentials.id, {
        track,
        top_programs: programs,
        confidence,
        explanations,
      });

      return h.response({ status: 'ok', data: { ...rec } });
    } catch (e) {
      // fallback ke heuristik jika ML error
    }
  }

  // Fallback heuristik lama
  const ipaScore = (scores?.math || 0) + (scores?.biology || 0) + (psych?.analytical || 0) * 5;
  const ipsScore = (scores?.history || 0) + (scores?.economics || 0) + (psych?.openness || 0) * 5;
  const track = ipaScore >= ipsScore ? 'IPA' : 'IPS';
  const margin = Math.abs(ipaScore - ipsScore);
  const confidence = Math.min(0.95, Math.max(0.55, margin / 100));

  const programs = track === 'IPA'
    ? ['Teknik Informatika', 'Teknik Elektro', 'Kedokteran']
    : ['Manajemen', 'Akuntansi', 'Ilmu Komunikasi'];

  const explanations = [
    { feature: 'learning_style', contribution: learning_style },
    { feature: 'math', contribution: scores?.math },
    { feature: 'economics', contribution: scores?.economics },
  ];

  const rec = await saveRecommendation(request.auth.credentials.id, {
    track,
    top_programs: programs,
    confidence,
    explanations,
  });

  return h.response({ status: 'ok', data: { ...rec } });
};
