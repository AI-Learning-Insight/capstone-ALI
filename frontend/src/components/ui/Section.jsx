// components/ui/Section.jsx
export default function Section({ title, action, children, className = "" }) {
  return (
    <section className={`p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-2">
          {title && (
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </h2>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
