import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

function AuthShell({ title, children }) {
  return (
    <div className="min-h-[85vh] grid place-items-center bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7">
        <h2 className="text-2xl font-extrabold text-center mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();
  const { login } = useAuth();

  const redirectByRole = (role) => {
    const target = role === 'mentor' ? '/mentor' : '/dashboard';
    nav(target, { replace: true });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setErr('');
    setLoading(true);
    try {
      // login() sekarang sudah:
      // - simpan token
      // - panggil /me dan set user di context
      const res = await login(email, password);

      // ambil role dari response / user
      const role =
        res?.user?.role ||
        res?.data?.user?.role ||
        res?.role ||
        res?.data?.role ||
        'student';

      toast.success('Berhasil login');
      redirectByRole(role);
    } catch (e) {
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        'Terjadi kesalahan saat memproses login. Silakan coba kembali.';
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Selamat Datang!">
      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Email</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Mail size={16} className="text-gray-400" />
          <input
            type="email"
            required
            autoComplete="email"
            className="w-full outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@domain.com"
          />
        </div>

        <label className="block text-sm">Kata Sandi</label>
        <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
          <Lock size={16} className="text-gray-400" />
          <input
            type="password"
            required
            autoComplete="current-password"
            className="w-full outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl shadow disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>

        <p className="text-center text-sm">
          Belum punya akun?{' '}
          <Link to="/register" className="text-blue-600">
            Daftar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
