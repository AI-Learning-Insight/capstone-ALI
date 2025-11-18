import { Outlet, Link } from 'react-router-dom';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div>
      <Navbar />
      <Outlet />
      <footer className="text-center text-xs text-gray-500 py-6">
        © {new Date().getFullYear()} Edulnsight • <Link to="/about" className="text-blue-600">About</Link>
      </footer>
    </div>
  );
}
