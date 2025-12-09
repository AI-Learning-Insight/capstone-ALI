import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

function AuthShell({ title, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col dark:bg-slate-950 dark:text-slate-50">
      {/* Kalau mau Navbar di login, bisa taruh di sini */}
      {/* <Navbar /> */}

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-7 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-2xl font-extrabold text-center mb-6">
            {title}
          </h2>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await login(email, password);

      const role =
        res?.user?.role ||
        res?.data?.user?.role ||
        res?.role ||
        res?.data?.role ||
        'student';

      toast.success('Berhasil login');
      redirectByRole(role);
    } catch (e) {
      const status = e?.response?.status;
      const backendMsg = e?.response?.data?.message || '';
      const isAuthFail =
        status === 400 ||
        status === 401 ||
        /invalid request payload input/i.test(backendMsg);

      const msg = isAuthFail
        ? 'Email atau kata sandi salah'
        : backendMsg || 'Email atau kata sandi salah';
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Selamat Datang!">
      {err && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">
          {err}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">
            Email
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <Mail size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              type="email"
              required
              autoComplete="email"
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@domain.com"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm mb-1 text-slate-700 dark:text-slate-200">
            Kata Sandi
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <Lock size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder-slate-400 dark:text-slate-100 dark:placeholder-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-slate-500 hover:text-slate-700 focus:outline-none"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Tombol submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </AuthShell>
  );
}
