// frontend/src/features/dashboard/LearningInsightsCard.jsx
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../lib/api';
import HintBadge from '../../components/ui/HintBadge.jsx';

const fmtInt = (v) => (v == null ? '-' : Number(v).toLocaleString('id-ID'));
const fmt1 = (v) => (v == null ? '-' : Number(v).toFixed(1));

// --- Tile dengan tinggi konsisten: label(h-9) + value(h-6) + helper(h-8)
function StatTile({ label, value, helper, hint, tone = 'default' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'warn'
      ? 'text-amber-600 dark:text-amber-400'
      : tone === 'bad'
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-slate-900 dark:text-slate-50';

  return (
    <div className="relative rounded-2xl border bg-white px-4 py-4 shadow-sm h-full dark:bg-slate-900 dark:border-slate-800 flex flex-col items-center justify-center text-center gap-1.5">
      {hint ? (
        <div className="absolute top-2 right-2">
          <HintBadge title={hint.title}>{hint.body}</HintBadge>
        </div>
      ) : null}

      <div className="text-[12px] leading-tight text-slate-500 dark:text-slate-300 px-6">
        {label}
      </div>

      <div className={`text-lg font-semibold leading-tight whitespace-nowrap tabular-nums ${toneClass}`}>
        {value}
      </div>

      <div className="text-[11px] leading-snug text-slate-500 dark:text-slate-300 px-4">
        {helper ?? '\u00A0'}
      </div>
    </div>
  );
}

export default function LearningInsightsCard({
  feat: featProp,
  hint: cardHint,
  metricHints = {},
}) {
  const [feat, setFeat] = useState(featProp);
  const [loading, setLoading] = useState(!featProp);

  useEffect(() => {
    if (featProp) {
      setFeat(featProp);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/me/insights');
        setFeat(data || {});
      } finally {
        setLoading(false);
      }
    })();
  }, [featProp]);

  const style = (feat?.style || '').toLowerCase();
  const defaultHints = {
    totalSubmissions: {
      title: 'Total Submissions',
      body: 'Jumlah seluruh tugas yang sudah dikumpulkan. Tips: cek ulang instruksi, kirim sebelum deadline, dan revisi jika ada feedback.',
    },
    totalTrackingEvents: {
      title: 'Total Tracking Events',
      body: 'Total interaksi konten (membuka/melihat modul). Tips: buat jadwal belajar rutin supaya interaksi merata tiap minggu.',
    },
  };
  const hints = { ...defaultHints, ...(metricHints || {}) };

  const learnerTypeText =
    feat?.learner_type_text ||
    (style === 'fast'
      ? 'Fast Learner'
      : style === 'reflective'
      ? 'Reflective Learner'
      : style
      ? 'Consistent Learner'
      : '-');

  const avgExamScore = feat?.avg_exam_score != null ? Number(feat.avg_exam_score) : null;
  let examTone = 'default';
  if (avgExamScore != null) {
    if (avgExamScore >= 80) examTone = 'good';
    else if (avgExamScore < 60) examTone = 'bad';
    else examTone = 'warn';
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-card dark:bg-slate-900 dark:border-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h3 className="font-display text-sm md:text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Learning Insights
          </h3>
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Ringkasan pola belajar berdasarkan aktivitasmu.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Hint di pojok kanan atas */}
          {cardHint && (
            <HintBadge title={cardHint.title}>{cardHint.body}</HintBadge>
          )}

          {/* Badge Sparkles tetap ditampilkan kalau tidak loading */}
          {!loading && (
            <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-300">
              <Sparkles size={14} />
              <span className="whitespace-nowrap">
                {learnerTypeText !== '-' ? learnerTypeText : 'No insight yet'}
              </span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        // Skeleton: 1 kolom (mobile), 2 (sm), 3 (md+)
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[112px] rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 animate-pulse"
            />
          ))}
        </div>
      ) : (
        // Grid statistik utama: ujian & aktivitas
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[118px]">
          <StatTile
            label="Avg Study Duration"
            value={fmt1(feat?.avg_study_duration ?? feat?.study_minutes)}
            helper="Rata-rata menit belajar"
            hint={hints.studyMinutes}
          />
          <StatTile
            label="Avg Completion Rating"
            value={fmt1(feat?.avg_completion_rating ?? feat?.avg_submission_rating)}
            helper="Rata-rata nilai submission"
            hint={hints.avgSubmissionRating}
          />
          <StatTile
            label="Avg Exam Score"
            value={fmt1(feat?.avg_exam_score)}
            helper="Rata-rata nilai ujian"
            hint={hints.avgExamScore}
            tone={examTone}
          />
          <StatTile
            label="Total Submissions"
            value={fmtInt(feat?.total_submissions)}
            helper="Total pengumpulan tugas"
            hint={hints.totalSubmissions}
          />
          <StatTile
            label="Total Tracking Events"
            value={fmtInt(feat?.total_tracking_events)}
            helper="Total interaksi konten"
            hint={hints.totalTrackingEvents}
          />
          <StatTile
            label="Tutorials Completed"
            value={fmtInt(feat?.tutorials_completed ?? feat?.enrollments_count)}
            helper="Materi selesai dipelajari"
            hint={hints.tutorialsCompleted}
          />
        </div>
      )}
    </div>
  );
}
