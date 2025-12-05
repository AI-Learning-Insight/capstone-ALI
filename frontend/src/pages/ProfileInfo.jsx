import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Camera, Mail, IdCard, Phone, CalendarDays, MapPin,
  Info, UserRound, GraduationCap, Save
} from "lucide-react";
import Card from "../components/ui/Card.jsx";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";
import api, { publicUrl } from "../lib/api.js";
import { notify } from "../lib/notify"; // Sonner helper lama, masih dipakai di onSubmit
import { useAuth } from "../lib/auth-context";
import { formatMenteeCode } from "../lib/student-code";
import { toast } from "sonner";

/** Helper input + ikon */
function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative mt-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          {icon}
        </div>
        {children}
      </div>
    </label>
  );
}

// ---- helper: telepon hanya + dan digit (E.164 max 15 digit) ----
function sanitizePhone(v) {
  if (!v) return "";
  // buang semua kecuali + dan digit
  let s = v.replace(/[^\d+]/g, "");
  // pertahankan hanya + pertama di awal
  if (s.startsWith("+")) s = "+" + s.slice(1).replace(/\+/g, "");
  else s = s.replace(/\+/g, "");
  const prefix = s.startsWith("+") ? "+" : "";
  const digits = s.replace(/\D/g, "").slice(0, 15);
  return prefix + digits;
}
function allowPhoneKeys(e) {
  const allow = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End"];
  if (allow.includes(e.key)) return;
  if (
    e.key === "+" &&
    e.currentTarget.selectionStart === 0 &&
    !e.currentTarget.value.includes("+")
  ) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

export default function ProfileInfo() {
  const { user, refreshUser } = useAuth();   // -> sekarang ambil refreshUser juga

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: "" });
  const fileRef = useRef(null);

  const [me, setMe] = useState({
    id: "",
    ml_user_id: null,
    studentId: "",
    name: "",
    email: "",
    role: "Siswa",
    grade: "",
    phone: "",
    dob: "",
    address: "",
    bio: "",
    avatar_url: "/images/avatar/placeholder.jpg",
  });

  // ---- ambil profil dari /me ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/me");
        const u = res?.data?.data ?? null;
        if (!mounted || !u) return;

        setMe((s) => ({
          ...s,
          id: u.id ?? s.id,
          ml_user_id: u.ml_user_id ?? s.ml_user_id,
          studentId: u.ml_user_id ?? u.id ?? s.studentId,
          name: u.name ?? s.name,
          email: u.email ?? s.email,
          role: (u.role ?? s.role) || "Siswa",
          grade: u.grade ?? s.grade,
          phone: u.phone ?? s.phone,
          dob: u.dob ?? s.dob,
          address: u.address ?? s.address,
          bio: u.bio ?? s.bio,
          avatar_url: u.avatar_url ?? s.avatar_url,
        }));
      } catch (e) {
        console.warn("GET /me failed", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // mentee code: pakai user dari context dulu, fallback ke me
  const menteeCode = formatMenteeCode(user || me);

  // ---- upload avatar (versi baru sesuai instruksi) ----
  const handlePickAvatar = () => fileRef.current?.click();

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      toast.error("Silakan pilih file avatar terlebih dahulu");
      return;
    }

    const formData = new FormData();
    // down NAMA FIELD HARUS 'avatar' (cocok dengan backend)
    formData.append("avatar", file);

    try {
      await api.post("/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Avatar berhasil diperbarui");

      // refresh data user supaya foto baru langsung muncul
      if (typeof refreshUser === "function") {
        await refreshUser();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Gagal mengunggah avatar";
      toast.error(msg);
    } finally {
      // reset input supaya bisa pilih file yang sama lagi kalau mau
      event.target.value = "";
    }
  };

  // ---- sanitasi NISN: angka saja, max 10 ----
  function sanitizeNISN(v) {
    return (v || "").replace(/\D/g, "").slice(0, 10);
  }

  // ---- submit profil ----
  async function onSubmit(e) {
    e.preventDefault();

    if (me.phone && !/^\+?\d{6,15}$/.test(me.phone)) {
      setErrors((s) => ({ ...s, phone: "Nomor telepon tidak valid" }));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: me.name,
        phone: me.phone || undefined,
        dob: me.dob || undefined,
        address: me.address || undefined,
        bio: me.bio || undefined,
        grade: me.grade || undefined,
      };

      await notify.promise(api.patch("/me", payload), {
        loading: "Menyimpan perubahan...",
        success: "Perubahan disimpan",
        error: (err) =>
          err?.response?.data?.message || "Gagal menyimpan perubahan",
      });
    } finally {
      setLoading(false);
    }
  }

  // avatarSrc sekarang prioritaskan user.avatar_url (hasil refreshUser)
  const avatarBase =
    user?.avatar_url || me.avatar_url || "/images/avatar/placeholder.jpg";

  const avatarSrc = avatarBase?.startsWith("/uploads/")
    ? publicUrl(avatarBase)
    : avatarBase;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="container px-4 md:px-6 py-6">
        <h1 className="text-2xl font-semibold text-center text-slate-900 dark:text-slate-50 mb-6">
          Edit Profil
        </h1>

        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PROFILE CARD */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <Card>
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <img
                      src={avatarSrc}
                      alt="avatar"
                      className="w-44 h-44 rounded-full object-cover ring-4 ring-white shadow dark:ring-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      className="absolute right-2 bottom-2 grid place-items-center w-9 h-9 rounded-full bg-white shadow border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                      title="Ganti foto"
                    >
                      <Camera className="w-4 h-4 text-slate-700 dark:text-slate-100" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {me.name || "-"}
                  </h2>
                  <div className="mt-1">
                    <Badge intent="info">{me.role || "Siswa"}</Badge>
                  </div>

                  <div className="w-full mt-4 space-y-2 text-left">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm truncate">
                        {me.email || "-"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <IdCard className="w-4 h-4" />
                      <span className="text-sm">
                        {menteeCode}
                      </span>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="w-full mt-6 space-y-2">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100"
                    >
                      <UserRound className="w-4 h-4" /> Informasi Pribadi
                    </Link>
                    <Link
                      to="/profile/security"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Info className="w-4 h-4" /> Keamanan
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT FORM CARD */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <Card>
              <Section title="Informasi Pribadi" className="relative">
                <p className="text-slate-500 dark:text-slate-300 mb-4">
                  Update informasi dasar profil Anda
                </p>

                <form
                  onSubmit={onSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  {/* Nama & Email */}
                  <Field
                    label="Nama Lengkap"
                    icon={<UserRound className="w-4 h-4" />}
                  >
                    <input
                      className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={me.name}
                      onChange={(e) =>
                        setMe({ ...me, name: e.target.value })
                      }
                      placeholder="Nama lengkap"
                    />
                  </Field>
                  <Field label="Email" icon={<Mail className="w-4 h-4" />}>
                    <input
                      className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                      value={me.email}
                      disabled
                    />
                  </Field>

                  {/* Telepon & Tanggal lahir */}
                  <Field label="Nomor Telepon" icon={<Phone className="w-4 h-4" />}>
                    <input
                      inputMode="tel"
                      autoComplete="tel"
                      pattern="\+?\d{6,15}"
                      onKeyDown={allowPhoneKeys}
                      className={`block w-full pl-9 pr-3 py-2 rounded-lg border ${
                        errors.phone
                          ? "border-red-300 dark:border-red-400 focus:ring-red-500"
                          : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                      } bg-white dark:bg-slate-900 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2`}
                      value={me.phone}
                      onChange={(e) => {
                        const v = sanitizePhone(e.target.value);
                        setMe({ ...me, phone: v });
                        setErrors((s) => ({
                          ...s,
                          phone:
                            v && !/^\+?\d{6,15}$/.test(v)
                              ? "Nomor telepon tidak valid"
                              : "",
                        }));
                      }}
                      placeholder="+62 81234567890"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.phone}
                      </p>
                    )}
                  </Field>
                  <Field
                    label="Tanggal Lahir"
                    icon={<CalendarDays className="w-4 h-4" />}
                  >
                    <input
                      type="date"
                      className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={me.dob || ""}
                      onChange={(e) =>
                        setMe({ ...me, dob: e.target.value })
                      }
                      placeholder="yyyy-mm-dd"
                    />
                  </Field>

                  {/* Alamat */}
                  <div className="md:col-span-2">
                    <Field label="Alamat" icon={<MapPin className="w-4 h-4" />}>
                      <textarea
                        rows={3}
                        className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={me.address}
                        onChange={(e) =>
                          setMe({ ...me, address: e.target.value })
                        }
                        placeholder="Alamat lengkap"
                      />
                    </Field>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <Field label="Bio" icon={<Info className="w-4 h-4" />}>
                      <textarea
                        rows={3}
                        className="block w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-slate-50 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={me.bio}
                        onChange={(e) =>
                          setMe({ ...me, bio: e.target.value })
                        }
                        placeholder="Ceritakan tentang dirimu..."
                      />
                    </Field>
                  </div>

                  {/* Tombol simpan */}
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
              </Section>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
