// frontend/src/components/ui/StatCard.jsx
import Card from "./Card.jsx";
import HintBadge from "./HintBadge.jsx";

const schemes = {
  indigo: {
    dot: "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-100",
    pill: "text-indigo-700 dark:text-indigo-200",
  },
  purple: {
    dot: "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/20 dark:border-violet-500/30 dark:text-violet-100",
    pill: "text-violet-700 dark:text-violet-200",
  },
  green: {
    dot: "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30 dark:text-emerald-100",
    pill: "text-emerald-700 dark:text-emerald-200",
  },
  orange: {
    dot: "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/25 dark:border-amber-500/30 dark:text-amber-100",
    pill: "text-amber-700 dark:text-amber-200",
  },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "indigo",
  hint,              // -> prop baru
}) {
  const c = schemes[tone] ?? schemes.indigo;

  return (
    <Card className="bg-white/90 border-slate-100 shadow-sm dark:bg-slate-900/80 dark:border-slate-700/70">
      <div className="p-4">
        {/* Baris atas: icon + teks di kiri, hint di kanan */}
        <div className="flex items-start justify-between gap-3">
          {/* Kiri: icon + teks */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon bulat */}
            <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${c.dot}`}>
              {Icon ? <Icon className="w-4 h-4" /> : null}
            </div>

            {/* Teks */}
            <div className="min-w-0 flex-1">
              {/* Label kecil di atas */}
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                {label}
              </p>

              {/* Value utama, bisa 2 baris */}
              <p className="mt-1 text-lg font-semibold leading-snug whitespace-normal break-words text-slate-900 dark:text-slate-50">
                {value}
              </p>

              {/* Helper text di bawah, lebih kecil */}
              {helper && (
                <p className={`mt-1 text-[11px] leading-snug ${c.pill}`}>
                  {helper}
                </p>
              )}
            </div>
          </div>

          {/* Kanan: Hint badge (opsional) */}
          {hint && (
            <div className="shrink-0">
              <HintBadge title={hint.title}>
                {hint.body}
              </HintBadge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
