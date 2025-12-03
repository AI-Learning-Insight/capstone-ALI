import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function App() {
  return (
    <div>
      <Navbar />
      <Outlet />
      <footer className="text-center text-xs py-6 border-t border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        &copy; {new Date().getFullYear()} EdulInsight
      </footer>
    </div>
  );
}
