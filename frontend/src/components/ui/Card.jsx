export default function Card({ className = "", children }) {
  return (
    <div
      className={`
        rounded-2xl shadow-sm
        border border-slate-100
        bg-white
        dark:bg-slate-900 dark:border-slate-800
        ${className}
      `}
    >
      {children}
    </div>
  );
}
