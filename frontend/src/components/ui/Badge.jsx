export default function Badge({ children, intent = "default" }) {
  const map = {
    default: "bg-slate-100 text-slate-700",
    info:    "bg-indigo-50 text-indigo-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger:  "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[intent]}`}>
      {children}
    </span>
  );
}
