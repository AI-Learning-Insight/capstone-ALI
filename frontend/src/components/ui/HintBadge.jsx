// src/components/ui/HintBadge.jsx
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";

export default function HintBadge({ title, children }) {
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    translateX: "-50%", // default: center
    placement: "bottom", // "bottom" | "top"
  });

  // Hitung posisi tooltip relatif ke icon & viewport
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 8; // jarak vertikal dari icon
    const edgePadding = 16; // jarak aman dari sisi layar
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    // Default: di bawah + center
    let top = rect.bottom + margin;
    let left = rect.left + rect.width / 2;
    let translateX = "-50%";
    let placement = "bottom";

    const distanceLeft = rect.left;
    const distanceRight = viewportWidth - rect.right;
    const minSafeDistance = 80; // kira-kira jarak aman sebelum kita geser alignment

    // Kalau icon terlalu dekat sisi kiri, align ke kiri layar
    if (distanceLeft < minSafeDistance) {
      left = edgePadding;
      translateX = "0"; // left aligned
    }
    // Kalau icon terlalu dekat sisi kanan, align ke kanan layar
    else if (distanceRight < minSafeDistance) {
      left = viewportWidth - edgePadding;
      translateX = "-100%"; // right aligned
    }

    // Perkiraan tinggi tooltip untuk cek cukup tidak ruang di bawah
    const approxTooltipHeight = 140; // px (bisa di-tweak kalau perlu)
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Kalau bawah sempit tapi atas cukup, taruh di atas icon
    if (spaceBelow < approxTooltipHeight && spaceAbove > approxTooltipHeight) {
      placement = "top";
      top = rect.top - margin; // nanti ditarik ke atas dengan translateY(-100%)
    }

    setCoords({ top, left, translateX, placement });
  }, []);

  useEffect(() => {
    if (!open) return;

    // hitung posisi pertama kali tooltip dibuka
    updatePosition();

    // update posisi saat scroll / resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  const tooltip =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              top: coords.top,
              left: coords.left,
              transform: `translateX(${coords.translateX}) ${
                coords.placement === "top" ? "translateY(-100%)" : ""
              }`,
            }}
          >
            <div
              className="
                w-64
                max-w-[calc(100vw-2rem)]
                sm:max-w-xs
                rounded-xl bg-slate-900 text-white text-xs shadow-xl p-3
                whitespace-normal break-words
              "
            >
              {title && <p className="font-semibold mb-1">{title}</p>}
              <p className="leading-snug text-slate-100">{children}</p>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div
      className="inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        ref={triggerRef}
        // Supaya di mobile bisa tap untuk buka/tutup
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100"
        aria-label={title || "Info"}
      >
        <AlertCircle className="w-3 h-3" />
      </button>

      {tooltip}
    </div>
  );
}
