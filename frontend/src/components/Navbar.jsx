// frontend/src/components/Navbar.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap, Menu, X, Home, Info, LayoutDashboard, LogIn, LogOut
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

function NavItem({ to, children, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive ? "text-slate-900 bg-slate-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
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
  const navigate = useNavigate();
  const location = useLocation();

  // Fallback baca token/user dari localStorage kalau context belum siap
  const tokenLS = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userLS = typeof window !== "undefined" ? (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })() : null;

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
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold text-slate-900">EdulInsight</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          <NavItem to="/" icon={Home}>Home</NavItem>
          <NavItem to="/about" icon={Info}>About</NavItem>

          {/* Dashboard → otomatis sesuai role */}
          <NavItem to={dashboardPath} icon={LayoutDashboard}>Dashboard</NavItem>

          <div className="ml-2">
            {isAuth ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
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

        {/* Mobile controls (login pill di header, bukan di menu) */}
        <div className="flex items-center gap-2 md:hidden">
          {!isAuth && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center rounded-xl border border-slate-300 p-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="space-y-1 border-t px-4 pb-4 pt-2">
            <NavItem to="/" icon={Home}>Home</NavItem>
            <NavItem to="/about" icon={Info}>About</NavItem>
            {/* Dashboard → otomatis sesuai role */}
            <NavItem to={dashboardPath} icon={LayoutDashboard}>Dashboard</NavItem>

            {isAuth && (
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
