// src/components/ui/HintBadge.jsx
import { AlertCircle } from "lucide-react";

export default function HintBadge({ title, children }) {
  return (
    <div className="relative inline-flex items-center group">
      <button
        type="button"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
        aria-label={title || "Info"}
      >
        <AlertCircle className="w-3 h-3" />
      </button>

      {/* Tooltip */}
      <div
        className="
          absolute z-30 top-full mt-2
          right-0           /* anchor ke kanan, bukan center */
          hidden group-hover:block
        "
      >
        <div
          className="
            w-64 
            max-w-[calc(100vw-3rem)]   /* biar muat di layar kecil */
            rounded-xl bg-slate-900 text-white text-xs shadow-xl p-3
          "
        >
          {title && <p className="font-semibold mb-1">{title}</p>}
          <p className="leading-snug text-slate-100">{children}</p>
        </div>
      </div>
    </div>
  );
}
