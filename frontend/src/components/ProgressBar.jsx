export default function ProgressBar({ label, percent, color = "indigo" }) {
  const bar = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    slate: "bg-slate-300",
  }[color] || "bg-indigo-500";

  return (
    <div className="py-2">
      {label ? (
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-700 font-medium">{label}</span>
          <span className="text-slate-500">{percent}% selesai</span>
        </div>
      ) : null}
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
