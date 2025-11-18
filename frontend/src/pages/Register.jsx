import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { User, Mail, Lock } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { register } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const n = (name || '').trim();
    const em = (email || '').trim().toLowerCase();
    const pw = password || '';

    if (!n || !em || !pw) {
      setErr('Nama, email, dan password wajib diisi');
      return;
    }

    try {
      setLoading(true);
      await register(n, em, pw); // ⬅️ biarkan kontrak lama
      nav('/dashboard');
    } catch (e) {
      setErr(e?.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[85vh] grid place-items-center bg-no-repeat bg-cover"
      style={{ backgroundImage: 'url(/images/bg-login.jpg)' }}
    >
      <form onSubmit={submit} className="bg-white w-full max-w-md p-7 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-extrabold text-center mb-6">Daftar</h2>
        {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

        <label className="block text-sm">Nama Lengkap</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-3">
          <User size={16} className="text-gray-400" />
          <input
            type="text"
            name="name"
            required
            className="w-full outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Nama lengkap"
          />
        </div>

        <label className="block text-sm">Email</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-3">
          <Mail size={16} className="text-gray-400" />
          <input
            type="email"
            name="email"
            required
            className="w-full outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="email@contoh.com"
          />
        </div>

        <label className="block text-sm">Password</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-5">
          <Lock size={16} className="text-gray-400" />
          <input
            type="password"
            name="password"
            required
            className="w-full outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
          />
        </div>

        <button
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl shadow disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Memproses…' : 'Buat Akun'}
        </button>

        <p className="text-center text-sm mt-3">
          Sudah punya akun? <Link to="/login" className="text-blue-600">Masuk</Link>
        </p>
      </form>
    </div>
  );
}
