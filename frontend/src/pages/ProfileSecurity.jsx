// src/pages/ProfileSecurity.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera, Mail, IdCard, UserRound, ShieldCheck,
  Lock, Info, Save
} from "lucide-react";
import Card from "../components/ui/Card";
import { useAuth } from "../lib/auth-context";
import api, { publicUrl } from "../lib/api";
import { notify } from "../lib/notify"; // ⬅️ Sonner helper
import { formatMenteeCode } from "../lib/student-code";

function Field({ label, icon, children, error }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          {icon}
        </div>
        {children}
      </div>
      {error ? <p className="text-xs text-rose-600 mt-1">{error}</p> : null}
    </label>
  );
}

export default function ProfileSecurity() {
  const { user, ready } = useAuth();

  const profile = {
    name: user?.name ?? "—",
    email: user?.email ?? "—",
    role: user?.role === "student" ? "Siswa" : (user?.role ?? "Siswa"),
    studentCode: formatMenteeCode(user),
    avatar: user?.avatar_url
      ? publicUrl(user.avatar_url)
      : "/images/avatar/placeholder.jpg",
  };

  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});

  function validate() {
    const e = {};
    if (!form.current) e.current = "Masukkan password saat ini";
    if (!form.next) e.next = "Password baru wajib diisi";
    if (form.next && form.next.length < 8) e.next = "Minimal 8 karakter";
    if (form.next && form.current && form.next === form.current)
      e.next = "Password baru tidak boleh sama";
    if (form.confirm !== form.next) e.confirm = "Konfirmasi tidak sama";
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await notify.promise(
        api.patch("/me/password", {
          password_current: form.current,
          password_new: form.next,
        }),
        {
          loading: "Memperbarui password…",
          success: "Password berhasil diperbarui ",
          error: (error) =>
            error?.response?.data?.message || "Gagal update password",
        }
      );
      setForm({ current: "", next: "", confirm: "" });
      setErr({});
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container px-4 md:px-6 py-6">
        <h1 className="text-2xl font-semibold text-center text-slate-900 dark:text-slate-50 mb-6">
          Edit Profil
        </h1>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="w-44 h-44 rounded-full object-cover ring-4 ring-white shadow dark:ring-slate-800"
                  />
                  <button
                    type="button"
                    className="absolute right-2 bottom-2 grid place-items-center w-9 h-9 rounded-full bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    title="Ganti foto"
                    onClick={() => (window.location.href = "/profile")}
                  >
                    <Camera className="w-4 h-4 text-slate-700 dark:text-slate-100" />
                  </button>
                </div>

                <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {profile.name}
                </h2>
                <p className="text-slate-500 dark:text-slate-300">{profile.role}</p>

                <div className="w-full mt-4 space-y-2 text-left">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                    <IdCard className="w-4 h-4" />
                    <span className="text-sm">
                      {profile.studentCode}
                    </span>
                  </div>
                </div>

                <div className="w-full mt-6 space-y-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserRound className="w-4 h-4" /> Informasi Pribadi
                  </Link>
                  <Link
                    to="/profile/security"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100"
                  >
                    <ShieldCheck className="w-4 h-4" /> Keamanan
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Keamanan
              </h2>
              <p className="text-slate-500 dark:text-slate-300 mb-4">
                Update password untuk menjaga keamanan akun Anda.
              </p>

              <form
                onSubmit={onSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div className="md:col-span-2">
                  <Field
                    label="Password Saat Ini"
                    icon={<Lock className="w-4 h-4" />}
                    error={err.current}
                  >
                    <input
                      type="password"
                      autoComplete="current-password"
                      className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Masukkan password saat ini"
                      value={form.current}
                      onChange={(e) =>
                        setForm({ ...form, current: e.target.value })
                      }
                    />
                  </Field>
                </div>

                <Field
                  label="Password Baru"
                  icon={<Lock className="w-4 h-4" />}
                  error={err.next}
                >
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Minimal 8 karakter"
                    value={form.next}
                    onChange={(e) =>
                      setForm({ ...form, next: e.target.value })
                    }
                  />
                </Field>

                <Field
                  label="Konfirmasi Password Baru"
                  icon={<Lock className="w-4 h-4" />}
                  error={err.confirm}
                >
                  <input
                    type="password"
                    autoComplete="new-password"
                    className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ulangi Password Baru"
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                  />
                </Field>

                <div className="md:col-span-2">
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 p-4 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-100">
                    <p className="font-medium flex items-center gap-2">
                      <Info className="w-4 h-4" /> Tips Keamanan
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                      <li>
                        Gunakan kombinasi huruf besar, kecil, angka, dan simbol.
                      </li>
                      <li>
                        Minimal 8 karakter untuk keamanan yang lebih baik.
                      </li>
                      <li>
                        Jangan gunakan informasi pribadi yang mudah ditebak.
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 shadow"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
