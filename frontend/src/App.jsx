import { Outlet, Link } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div>
      <Navbar />
      <Outlet />
      <footer className="text-center text-xs py-6 border-t border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        &copy; {new Date().getFullYear()} EdulInsight |{" "}
        <Link
          to="/about"
          className="text-blue-600 hover:text-blue-700 dark:text-emerald-300 dark:hover:text-emerald-200"
        >
          About
        </Link>
      </footer>
    </div>
  );
}
