export default function Section({ title, action, children, className = "" }) {
  return (
    <div className={`p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
