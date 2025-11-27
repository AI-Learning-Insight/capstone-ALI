// frontend/src/features/dashboard/LearningInsightsCard.jsx
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../../lib/api';
import HintBadge from '../../components/ui/HintBadge.jsx';

const fmtInt = (v) => (v == null ? '-' : Number(v).toLocaleString('id-ID'));
const fmtPct = (v) => (v == null ? '-' : `${Math.round(Number(v) * 100)}%`);
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
    <div className="relative rounded-xl border bg-white px-3 py-2 shadow-sm h-full dark:bg-slate-900 dark:border-slate-800">
      {/* Hint badge di sudut kanan atas */}
      {hint ? (
        <div className="absolute top-1.5 right-1.5">
          <HintBadge title={hint.title}>{hint.body}</HintBadge>
        </div>
      ) : null}

      {/* Label */}
      <div className="h-9 text-[11px] leading-tight text-slate-500 dark:text-slate-300 flex items-center justify-center text-center px-1 pr-6">
        <span>{label}</span>
      </div>

      {/* Value */}
      <div className="h-6 flex items-center justify-center">
        <div
          className={`text-base font-semibold leading-none whitespace-nowrap tabular-nums ${toneClass}`}
        >
          {value}
        </div>
      </div>

      {/* Helper - bisa 2 baris, tidak memotong kata */}
      <div className="h-8 text-[11px] leading-snug text-slate-500 dark:text-slate-300 text-center px-2 overflow-hidden">
        <span className="block">{helper ?? '\u00A0'}</span>
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
  const hints = metricHints || {};

  const learnerTypeText =
    feat?.learner_type_text ||
    (style === 'fast'
      ? 'Fast Learner'
      : style === 'reflective'
      ? 'Reflective Learner'
      : style
      ? 'Consistent Learner'
      : '-');

  const dropoutRaw = feat?.dropout_risk;
  const dropoutPct =
    dropoutRaw != null ? Math.round(Number(dropoutRaw) * 100) : null;

  let dropoutTone = 'default';
  let dropoutHint = '';
  if (dropoutPct != null) {
    if (dropoutPct < 35) {
      dropoutTone = 'good';
      dropoutHint = 'Low risk (aman)';
    } else if (dropoutPct < 70) {
      dropoutTone = 'warn';
      dropoutHint = 'Medium risk (perlu dijaga)';
    } else {
      dropoutTone = 'bad';
      dropoutHint = 'High risk (butuh perhatian)';
    }
  }

  const passRatePct =
    feat?.pass_rate != null ? Math.round(Number(feat.pass_rate) * 100) : null;

  let passTone = 'default';
  if (passRatePct != null) {
    if (passRatePct >= 80) passTone = 'good';
    else if (passRatePct < 60) passTone = 'bad';
    else passTone = 'warn';
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-card dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-start justify-between mb-3 gap-2">
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
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-[112px] rounded-xl border bg-slate-50 dark:bg-slate-800 dark:border-slate-700 animate-pulse"
            />
          ))}
        </div>
      ) : (
        // Grid statistik utama: ujian & aktivitas
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 auto-rows-[112px]">
          {/* Performa ujian */}
          <StatTile
            label="Exams Taken"
            value={fmtInt(feat?.exams_taken)}
            helper="Total ujian diikuti"
            hint={hints.examsTaken}
          />

          {/* Detail nilai & aktivitas */}
          <StatTile
            label="Avg Exam Score"
            value={fmt1(feat?.avg_exam_score)}
            helper="Rata-rata nilai ujian"
            hint={hints.avgExamScore}
            tone={passTone}
          />
          <StatTile
            label="Study Minutes"
            value={fmtInt(feat?.study_minutes)}
            helper="Total menit belajar"
            hint={hints.studyMinutes}
          />
          <StatTile
            label="Avg Submission Rating"
            value={fmt1(feat?.avg_submission_rating)}
            helper="Kualitas tugas"
            hint={hints.avgSubmissionRating}
          />
          <StatTile
            label="Tutorials Completed"
            value={fmtInt(feat?.tutorials_completed)}
            helper="Materi selesai dipelajari"
            hint={hints.tutorialsCompleted}
          />
          <StatTile
            label="Last Activity (days)"
            value={fmtInt(feat?.days_since_last_activity)}
            helper="Sejak terakhir aktif"
            hint={hints.lastActivityDays}
            tone={dropoutTone}
          />
        </div>
      )}
    </div>
  );
}
