// frontend/src/components/Navbar.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/theme-context"; // TAMBAH INI

function NavItem({ to, children, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "text-slate-900 bg-slate-100 dark:text-slate-100 dark:bg-slate-800"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
        ].join(" ")
      }
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </NavLink>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth?.() || {}; // aman kalau hook berbeda
  const { theme, toggleTheme } = useTheme(); // AMBIL TEMA & TOGGLE
  const navigate = useNavigate();
  const location = useLocation();

  // Fallback baca token/user dari localStorage kalau context belum siap
  const tokenLS =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userLS =
    typeof window !== "undefined"
      ? (() => {
          try {
            return JSON.parse(localStorage.getItem("user"));
          } catch {
            return null;
          }
        })()
      : null;

  const isAuth = !!(user || tokenLS);
  const role = user?.role ?? userLS?.role ?? null;

  const dashboardPath = useMemo(
    () => (role === "mentor" ? "/mentor" : "/dashboard"),
    [role]
  );

  useEffect(() => setOpen(false), [location.pathname]);

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      {/* HAPUS max-w-7xl & mx-auto supaya full width */}
      <nav className="flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to={isAuth ? dashboardPath : "/"}
          className="flex items-center gap-2"
        >
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            EdulInsight
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-2 md:flex">
          {isAuth && (
            <NavItem to={dashboardPath} icon={LayoutDashboard}>
              Dashboard
            </NavItem>
          )}

          {/* Toggle tema (desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <div className="ml-2">
            {isAuth ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Toggle tema (mobile) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {!isAuth && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-600"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}

          {isAuth && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center rounded-xl border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus:ring-slate-600"
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {open && isAuth && (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-slate-200 bg-white px-4 pb-4 pt-2 dark:border-slate-800 dark:bg-slate-900">
            <NavItem to={dashboardPath} icon={LayoutDashboard}>
              Dashboard
            </NavItem>

            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-slate-600"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
