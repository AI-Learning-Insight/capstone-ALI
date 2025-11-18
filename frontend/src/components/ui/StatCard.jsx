import Card from "./Card.jsx";

const schemes = {
  indigo: { dot: "bg-indigo-100 text-indigo-600", pill: "text-indigo-600" },
  purple: { dot: "bg-violet-100 text-violet-600", pill: "text-violet-600" },
  green:  { dot: "bg-emerald-100 text-emerald-600", pill: "text-emerald-600" },
  orange: { dot: "bg-amber-100 text-amber-600", pill: "text-amber-600" },
};

export default function StatCard({ icon: Icon, label, value, helper, tone = "indigo" }) {
  const c = schemes[tone] ?? schemes.indigo;

  return (
    <Card>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon bulat */}
          <div className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${c.dot}`}>
            {Icon ? <Icon className="w-4 h-4" /> : null}
          </div>

          {/* Teks */}
          <div className="min-w-0 flex-1">
            {/* Label kecil di atas */}
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {label}
            </p>

            {/* Value utama, bisa 2 baris */}
            <p className="mt-1 text-lg font-semibold text-slate-900 leading-snug whitespace-normal break-words">
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
      </div>
    </Card>
  );
}
