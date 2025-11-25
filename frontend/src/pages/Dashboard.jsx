import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Clock3,
  Target,
  CalendarClock,
  Mail,
  IdCard,
  PencilLine,
  AlertCircle,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import Card from "../components/ui/Card.jsx";
import Section from "../components/ui/Section.jsx";
import Badge from "../components/ui/Badge.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { useAuth } from "../lib/auth-context";
import api, { publicUrl } from "../lib/api.js";
import LearningInsightsCard from "../features/dashboard/LearningInsightsCard";
import { formatMenteeCode } from "../lib/student-code";

// --- Hints / Tips untuk klasifikasi ---

const LEARNER_TYPE_HINTS = {
  CONSISTENT: {
    title: "Apa itu Consistent Learner?",
    body:
      "Kamu belajar dengan ritme yang stabil dari hari ke hari. Ini bagus untuk progres jangka panjang. Tips: pertahankan jadwal belajar mingguan, gunakan to-do list modul, dan jangan menumpuk tugas di akhir.",
  },
  FAST: {
    title: "Apa itu Fast Learner?",
    body:
      "Kamu cepat menyelesaikan materi. Hati-hati jangan hanya mengejar kecepatan. Tips: luangkan waktu review ringkas setelah belajar, buat catatan singkat, dan cek kembali soal yang pernah salah.",
  },
  REFLECTIVE: {
    title: "Apa itu Reflective Learner?",
    body:
      "Kamu suka merenungkan materi dan butuh waktu lebih lama. Ini bagus untuk pemahaman dalam. Tips: tetap pasang batas waktu belajar, pecah materi besar jadi bagian kecil, dan gunakan ringkasan di akhir sesi.",
  },
};

const STYLE_HINTS = {
  CONSISTENT: {
    title: "Style: Consistent",
    body:
      "Pola belajarmu stabil dari hari ke hari. Tips: simpan jam belajar favorit (misal malam/jam tertentu) dan jaga lingkungan belajar bebas distraksi.",
  },
  FAST: {
    title: "Style: Fast",
    body:
      "Kamu cenderung belajar dalam sprint singkat namun intens. Tips: sisipkan jeda istirahat (5–10 menit) dan sesi review mingguan agar materi tidak cepat lupa.",
  },
  REFLECTIVE: {
    title: "Style: Reflective",
    body:
      "Kamu lebih nyaman jika punya waktu mencerna materi. Tips: setelah menonton video/ membaca modul, tulis 3 poin utama dan 1 pertanyaan yang masih mengganjal.",
  },
};

const PASS_RATE_HINTS = {
  HIGH: {
    title: "Pass Rate Tinggi",
    body:
      "Persentase lulus ujianmu sudah baik. Pertahankan pola belajar yang sekarang. Tips: fokus meningkatkan nilai di mapel yang masih lemah dan coba beberapa soal tingkat lanjut.",
  },
  MEDIUM: {
    title: "Pass Rate Sedang",
    body:
      "Sebagian besar ujian sudah lulus, tapi masih ada ruang perbaikan. Tips: review kembali kuis yang nilainya rendah, cari pola kesalahan, dan minta bantuan mentor untuk topik yang sulit.",
  },
  LOW: {
    title: "Pass Rate Rendah",
    body:
      "Banyak ujian yang belum lulus. Jangan patah semangat. Tips: mulai dari modul dasar, kerjakan latihan sedikit-sedikit tapi rutin, dan manfaatkan sesi mentoring atau diskusi kelas.",
  },
};

const DROPOUT_HINTS = {
  LOW: {
    title: "Dropout Risk Rendah",
    body:
      "Risiko berhenti program rendah. Tetap jaga ritme belajar dan jangan menunda tugas. Tips: pasang target mingguan kecil (misal 2 modul selesai).",
  },
  MEDIUM: {
    title: "Dropout Risk Sedang",
    body:
      "Aktivitas belajar mulai naik-turun. Tips: pilih waktu belajar yang realistis, kurangi distraksi (game/medsos saat belajar), dan gunakan to-do list di dashboard.",
  },
  HIGH: {
    title: "Dropout Risk Tinggi",
    body:
      "Aktivitas belajarmu menurun cukup jauh. Tips: segera hubungi mentor, buat rencana belajar sederhana 1 minggu ke depan, dan mulai dari tugas yang paling mudah dulu agar momentum kembali.",
  },
};

// --- Hints khusus metrik Learning Insights (per-metrik) ---

const LEARNING_INSIGHT_HINTS = {
  examsTaken: {
    title: "Exams Taken",
    body:
      "Semakin banyak ujian yang kamu ikuti, semakin banyak latihan yang kamu dapat. Tips: ikut semua kuis yang tersedia dan catat jenis soal yang sering membuatmu salah.",
  },
  avgExamScore: {
    title: "Avg Exam Score",
    body:
      "Nilai rata-rata ujian menunjukkan seberapa kuat pemahamanmu secara umum. Tips: identifikasi mapel dengan nilai rendah, lalu fokus review materi dan latihan soal di area itu.",
  },
  studyMinutes: {
    title: "Study Minutes",
    body:
      "Total menit belajar menggambarkan seberapa sering dan lama kamu aktif. Tips: targetkan minimal 30–45 menit belajar fokus per hari atau 3–4 sesi per minggu.",
  },
  avgSubmissionRating: {
    title: "Avg Submission Rating",
    body:
      "Kualitas tugas menunjukkan seberapa rapi dan tuntas kamu mengerjakan. Tips: baca kembali instruksi sebelum submit, cek ulang jawaban, dan perbaiki berdasarkan feedback mentor.",
  },
  tutorialsCompleted: {
    title: "Tutorials Completed",
    body:
      "Semakin banyak modul yang selesai, semakin lengkap fondasi pemahamanmu. Tips: buat to-do list modul yang ingin diselesaikan minggu ini dan selesaikan sedikit demi sedikit.",
  },
  lastActivityDays: {
    title: "Last Activity (days)",
    body:
      "Semakin besar angkanya, semakin lama kamu tidak aktif. Tips: usahakan kembali login dan belajar minimal seminggu sekali agar ritme belajar tidak hilang.",
  },
};

const MOCK = {
  kpi: [
    {
      icon: Flame,
      label: "Hari Streak",
      value: "7 Hari",
      helper: "Belajar Konsisten",
      tone: "indigo",
    },
    {
      icon: Clock3,
      label: "Jam Minggu Ini",
      value: "23",
      helper: "Target ≥ 25 Jam",
      tone: "green",
    },
    {
      icon: Target,
      label: "Rata-rata Quiz",
      value: "92%",
      helper: "Naik 5% Bulan ini",
      tone: "purple",
    },
    {
      icon: CalendarClock,
      label: "Deadline Dekat",
      value: "3",
      helper: "2 Hari Lagi",
      tone: "orange",
    },
  ],
  progress: [
    { label: "Matematika", percent: 100, color: "emerald", score: 98 },
    { label: "Biologi", percent: 87, color: "indigo", score: 87 },
    { label: "Fisika", percent: 41, color: "amber", score: 78 },
    { label: "Bahasa Indonesia", percent: 0, color: "slate", score: 0 },
  ],
  todos: [
    {
      id: 1,
      title: "Kerjakan PR Matematika Hal 72",
      subject: "Matematika",
      date: "10 Oktober 2025",
      status: "Penting",
    },
    {
      id: 2,
      title: "Kerjakan PR Matematika Hal 72",
      subject: "Matematika",
      date: "10 Oktober 2025",
      status: "Penting",
    },
    {
      id: 3,
      title: "Kerjakan PR Matematika Hal 72",
      subject: "Matematika",
      date: "10 Oktober 2025",
      status: "Sedang",
    },
    {
      id: 4,
      title: "Kerjakan PR Matematika Hal 72",
      subject: "Matematika",
      date: "10 Oktober 2025",
      status: "Aman",
    },
  ],
  rekom: [
    {
      id: 1,
      major: "Desain Komunikasi Visual",
      campus: "Rosalia Academy",
      match: 95,
      faktor: [
        "Nilai Matematika (A)",
        "Kecepatan belajar (2-4x/minggu)",
        "Konsistensi (B)",
      ],
    },
    {
      id: 2,
      major: "Desain Komunikasi Visual",
      campus: "Rosalia Academy",
      match: 95,
      faktor: [
        "Nilai Matematika (A)",
        "Kecepatan belajar (2-4x/minggu)",
        "Konsistensi (B)",
      ],
    },
    {
      id: 3,
      major: "Desain Komunikasi Visual",
      campus: "Rosalia Academy",
      match: 95,
      faktor: [
        "Nilai Matematika (A)",
        "Kecepatan belajar (2-4x/minggu)",
        "Konsistensi (B)",
      ],
    },
  ],
  materi: [
    { id: 1, title: "Alkena", subject: "Kimia", date: "18 Oktober 2025" },
  ],
};

// 🔹 Dummy progress khusus cohort ML
const ML_DUMMY_PROGRESS = [
  {
    label: "Pengantar Machine Learning",
    percent: 100,
    color: "emerald",
    score: 95,
  },
  {
    label: "Regresi & Klasifikasi",
    percent: 82,
    color: "indigo",
    score: 88,
  },
  {
    label: "Evaluasi Model & Metrics",
    percent: 40,
    color: "amber",
    score: 76,
  },
  {
    label: "Deployment & MLOps Dasar",
    percent: 0,
    color: "slate",
    score: 0,
  },
];

export default function Dashboard() {
  const { user, ready } = useAuth();

  // insights untuk KPI & LearningInsightsCard
  const [insights, setInsights] = useState(null);

  // ----- STATE TO-DO LIST -----
  const [todos, setTodos] = useState([]);
  const [todoForm, setTodoForm] = useState({
    journey_id: "",
    due_date: "",
  });
  const [addingTodo, setAddingTodo] = useState(false);

  // load to-do dari backend
  useEffect(() => {
    if (!ready) return;

    const loadTodos = async () => {
      try {
        const res = await api.get("/todos");
        setTodos(res.data?.data ?? []);
      } catch (err) {
        console.warn("GET /todos failed", err);
        toast.error("Gagal memuat daftar to-do.");
      }
    };

    loadTodos();
  }, [ready]);

  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/dashboard");
        if (!cancelled) {
          setDashData(res.data?.data ?? null);
        }
      } catch (err) {
        console.warn("GET /dashboard failed", err);
        toast.error("Gagal memuat data dashboard.");
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  // ambil /me/insights sekali di Dashboard
  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await api.get("/me/insights");
        if (!cancelled) {
          setInsights(res.data || null);
        }
      } catch (err) {
        console.warn("GET /me/insights failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready]);

  const Y = useMemo(() => {
    const modules = dashData?.modules_progress;

    if (!modules || modules.length === 0) {
      if (user?.ml_user_id && !user?.class_prefix) {
        return {
          ...MOCK,
          progress: ML_DUMMY_PROGRESS,
        };
      }
      return MOCK;
    }

    const mapped = modules.map((m) => ({
      label: m.name,
      percent: m.progress_percent ?? 0,
      color: "emerald",
      score: m.progress_percent ?? 0,
    }));

    return {
      ...MOCK,
      progress: mapped,
    };
  }, [dashData, user]);

  // daftar modul utk pilihan to-do (sesuai kelas)
  const modulesOptions = useMemo(() => {
    if (dashData?.modules_progress && dashData.modules_progress.length > 0) {
      return dashData.modules_progress;
    }
    if (user?.ml_user_id && !user?.class_prefix) {
      return ML_DUMMY_PROGRESS.map((m, idx) => ({
        journey_id: `ml-${idx + 1}`,
        name: m.label,
        class_track: "ML",
      }));
    }
    return [];
  }, [dashData, user]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!todoForm.journey_id) return;

    const selected = modulesOptions.find(
      (m) => String(m.journey_id) === String(todoForm.journey_id)
    );

    const title = selected ? `Belajar: ${selected.name}` : "Belajar modul";
    const subject = selected ? selected.name : "";

    try {
      await api.post("/todos", {
        title,
        subject,
        due_date: todoForm.due_date || null,
      });

      setTodoForm({ journey_id: "", due_date: "" });
      setAddingTodo(false);

      const res = await api.get("/todos");
      setTodos(res.data?.data ?? []);

      toast.success("To-do berhasil ditambahkan.");
    } catch (err) {
      console.warn("POST /todos failed", err);
      toast.error("Gagal menambahkan to-do.");
    }
  };

  const handleTodoStatusChange = async (id, status) => {
    try {
      await api.patch(`/todos/${id}/status`, { status });
      const res = await api.get("/todos");
      setTodos(res.data?.data ?? []);

      const statusText =
        status === "done"
          ? "diselesaikan"
          : status === "doing"
          ? "ditandai sedang dikerjakan"
          : "ditandai penting";

      toast.success(`To-do ${statusText}.`);
    } catch (err) {
      console.warn("PATCH /todos status failed", err);
      toast.error("Gagal mengubah status to-do.");
    }
  };

  // konfirmasi hapus pakai sonner
  const handleTodoDelete = (todo) => {
    toast.warning("Hapus to-do ini?", {
      description: todo.title || "Aksi ini tidak dapat dibatalkan.",
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            await api.delete(`/todos/${todo.id}`);
            const res = await api.get("/todos");
            setTodos(res.data?.data ?? []);
            toast.success("To-do berhasil dihapus.");
          } catch (err) {
            console.warn("DELETE /todos failed", err);
            toast.error("Gagal menghapus to-do.");
          }
        },
      },
    });
  };

  const prettyStatus = (status) => {
    if (status === "done") return "Aman";
    if (status === "doing") return "Sedang";
    return "Penting"; // pending
  };

  const badgeIntent = (status) => {
    if (status === "done") return "success";
    if (status === "doing") return "warning";
    return "danger"; // pending
  };

  // KPI cards dari insights + hint
  const kpiCards = useMemo(() => {
    const feat = insights || {};

    const styleRaw = feat.style || ""; // "consistent"
    const styleClean = styleRaw
      ? styleRaw.charAt(0).toUpperCase() + styleRaw.slice(1).toLowerCase()
      : "-";

    const learnerTypeText =
      feat.learner_type_text ||
      (styleRaw === "fast"
        ? "Fast Learner"
        : styleRaw === "reflective"
        ? "Reflective Learner"
        : styleRaw
        ? "Consistent Learner"
        : "-");

    // Bagi "Consistent Learner" jadi 2 baris:
    let learnerValue = learnerTypeText || "-";
    let learnerHelper = "";
    if (learnerTypeText && learnerTypeText.includes(" ")) {
      const parts = learnerTypeText.split(" ");
      learnerValue = parts.slice(0, -1).join(" ");
      learnerHelper = parts[parts.length - 1];
    }

    // Kode learner type (CONSISTENT / FAST / REFLECTIVE)
    let learnerTypeCode = feat.learner_type_code;
    if (!learnerTypeCode) {
      if (styleRaw) {
        learnerTypeCode = styleRaw.toUpperCase();
      } else if (learnerTypeText) {
        const upper = learnerTypeText.toUpperCase();
        if (upper.includes("FAST")) learnerTypeCode = "FAST";
        else if (upper.includes("REFLECTIVE")) learnerTypeCode = "REFLECTIVE";
        else if (upper.includes("CONSISTENT")) learnerTypeCode = "CONSISTENT";
      }
    }

    // Kode style
    let styleCode = feat.style_code;
    if (!styleCode && styleRaw) {
      styleCode = styleRaw.toUpperCase();
    }
    if (!styleCode && learnerTypeCode) {
      styleCode = learnerTypeCode;
    }

    // Pass rate (0–1) → %
    const passRaw = feat.pass_rate;
    const passPct =
      passRaw != null ? Math.round(Number(passRaw) * 100) : null;

    let passTone = "indigo";
    if (passPct != null) {
      if (passPct >= 80) passTone = "green";
      else if (passPct < 60) passTone = "orange";
      else passTone = "indigo";
    }

    // Level untuk hint
    let passLevel = null;
    if (passPct != null) {
      if (passPct >= 80) passLevel = "HIGH";
      else if (passPct >= 60) passLevel = "MEDIUM";
      else passLevel = "LOW";
    }

    // Dropout risk (0–1) → %
    const dropoutRaw = feat.dropout_risk;
    const dropoutPct =
      dropoutRaw != null ? Math.round(Number(dropoutRaw) * 100) : null;

    let dropoutTone = "indigo";
    let dropoutHelper = "Perkiraan risiko berhenti";
    let dropoutCode = null;

    if (dropoutPct != null) {
      if (dropoutPct < 35) {
        dropoutTone = "green";
        dropoutHelper = "Low risk (aman)";
        dropoutCode = "LOW";
      } else if (dropoutPct < 70) {
        dropoutTone = "orange";
        dropoutHelper = "Medium risk (perlu dijaga)";
        dropoutCode = "MEDIUM";
      } else {
        dropoutTone = "orange";
        dropoutHelper = "Medium–High risk (perlu dijaga)";
        dropoutCode = "HIGH";
      }
    }

    const learnerHint =
      learnerTypeCode ? LEARNER_TYPE_HINTS[learnerTypeCode] : undefined;
    const styleHint = styleCode ? STYLE_HINTS[styleCode] : undefined;
    const passHint = passLevel ? PASS_RATE_HINTS[passLevel] : undefined;
    const dropoutHint =
      dropoutCode ? DROPOUT_HINTS[dropoutCode] : undefined;

    return [
      {
        icon: Flame,
        label: "Learner Type",
        value: learnerValue,
        helper: learnerHelper,
        tone: "purple",
        hint: learnerHint,
      },
      {
        icon: Clock3,
        label: "Style",
        value: styleClean || "-",
        helper: "Pola dan tempo belajar",
        tone: "green",
        hint: styleHint,
      },
      {
        icon: Target,
        label: "Pass Rate",
        value: passPct != null ? `${passPct}%` : "-",
        helper: "Persentase ujian lulus",
        tone: passTone,
        hint: passHint,
      },
      {
        icon: AlertCircle,
        label: "Dropout Risk",
        value: dropoutPct != null ? `${dropoutPct}%` : "-",
        helper: dropoutHelper,
        tone: dropoutTone,
        hint: dropoutHint,
      },
    ];
  }, [insights]);

  if (!ready || dashLoading) return <div className="p-6">Loading...</div>;

  const profile = {
    name: user?.name ?? "Pengguna",
    email: user?.email ?? "-",
    role: user?.role === "student" ? "Siswa" : user?.role ?? "Siswa",
    studentId: user?.ml_user_id ?? user?.id ?? "-",
    avatar: user?.avatar_url
      ? publicUrl(user.avatar_url)
      : "/images/avatar/placeholder.jpg",
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full px-4 md:px-6 py-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
          Welcome,{" "}
          <span className="text-slate-700 dark:text-slate-200">
            {profile.name}!
          </span>
        </h1>

        {/* ====== LAYOUT BARU: 2 KOLOM ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KIRI: Profile + Learning Insights */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-slate-100 shadow dark:ring-slate-800"
                  />
                  <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-50">
                    {profile.name}
                  </h2>
                  <div className="mt-2">
                    <Badge intent="info">{profile.role}</Badge>
                  </div>

                  <div className="w-full mt-4 space-y-2 text-left">
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                      <IdCard className="w-4 h-4" />
                      <span className="text-sm">
                        {formatMenteeCode(user)}
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    role="button"
                  >
                    <PencilLine className="w-4 h-4" />
                    Edit Profile
                  </Link>
                </div>
              </div>
            </Card>

            <div className="mt-2">
              <LearningInsightsCard
                feat={insights}
                hint={LEARNING_INSIGHT_HINTS.studyMinutes}
              />
            </div>
          </div>

          {/* KANAN: KPI + Banner + Progress + To-do */}
          <div className="lg:col-span-2 space-y-4">
            {/* KPI cards dari insights */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {kpiCards.map((k) => (
                <StatCard
                  key={k.label}
                  icon={k.icon}
                  label={k.label}
                  value={k.value}
                  helper={k.helper}
                  tone={k.tone}
                  hint={k.hint}
                />
              ))}
            </div>

            {/* CoachBanner: banner ungu */}
            <Card className="bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-indigo-400/80" />
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, white 2px, transparent 2px), radial-gradient(circle at 60% 40%, white 2px, transparent 2px), radial-gradient(circle at 80% 70%, white 2px, transparent 2px)",
                    backgroundSize: "120px 120px",
                  }}
                />
                <div className="relative p-5 md:p-6 text-white">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                      <h4 className="font-semibold">
                        Kamu adalah Consistent Learner!
                      </h4>
                      <p className="mt-1 text-white/90">
                        Berdasarkan pola belajarmu, kamu menyelesaikan materi
                        dengan konsisten setiap hari. Rata-rata kamu belajar 2–3
                        materi per hari dengan fokus 45 menit per materi. Pola
                        belajar yang sangat baik untuk hasil jangka panjang!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Progress Belajar & To-do List */}
            <div className="grid grid-cols-12 gap-6">
              <Card className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <Section
                  title="Progress Belajar"
                  className="pb-4"
                >
                  <div className="space-y-4">
                    {Y.progress.map((p) => (
                      <div key={p.label} className="pb-1">
                        {/* Baris judul + skor */}
                        <div className="flex items-center justify-between mb-1">
                          {/* nama modul: lebih tebal & kontras */}
                          <span className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-50">
                            {p.label}
                          </span>

                          {/* skor: sedikit lebih terang di dark mode */}
                          <span className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-200">
                            {p.score}
                          </span>
                        </div>

                        {/* progress bar (pastikan ProgressBar juga punya dark:bg) */}
                        <ProgressBar
                          label=""
                          percent={p.percent}
                          color={p.color}
                        />

                        {/* keterangan persen */}
                        {p.percent === 0 ? (
                          <p className="text-xs mt-1 text-slate-500 dark:text-slate-300">
                            0% selesai
                          </p>
                        ) : p.percent < 100 ? (
                          <p className="text-xs mt-1 text-slate-500 dark:text-slate-300">
                            {p.percent}% selesai
                          </p>
                        ) : (
                          <p className="text-xs mt-1 font-medium text-emerald-600 dark:text-emerald-400">
                            100% selesai
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </Card>

              {/* To-do List */}
              <Card className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <Section
                  title={
                    <div className="inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />{" "}
                      To-do List
                    </div>
                  }
                  action={
                    <button
                      type="button"
                      onClick={() => setAddingTodo((v) => !v)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                      <Plus className="w-4 h-4" />
                      {addingTodo ? "Batal" : "Tambah"}
                    </button>
                  }
                >
                  <div className="space-y-3">
                    {addingTodo && (
                      <form
                        onSubmit={handleAddTodo}
                        className="p-3 rounded-xl border border-dashed border-indigo-200 space-y-3 bg-indigo-50/40 dark:border-indigo-500/60 dark:bg-slate-900"
                      >
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">
                            Pilih Modul
                          </label>
                          <select
                            className="w-full rounded-lg border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                            value={todoForm.journey_id}
                            onChange={(e) =>
                              setTodoForm((f) => ({
                                ...f,
                                journey_id: e.target.value,
                              }))
                            }
                            required
                          >
                            <option value="">
                              Pilih modul sesuai kelasmu
                            </option>
                            {modulesOptions.map((m) => (
                              <option
                                key={m.journey_id}
                                value={m.journey_id}
                              >
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1 dark:text-slate-200">
                              Target Selesai (opsional)
                            </label>
                            <input
                              type="date"
                              className="w-full rounded-lg border-slate-200 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                              value={todoForm.due_date}
                              onChange={(e) =>
                                setTodoForm((f) => ({
                                  ...f,
                                  due_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Simpan
                          </button>
                        </div>
                      </form>
                    )}

                    {todos.map((t) => {
                      const dueLabel = t.due_date
                        ? new Date(t.due_date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Tanpa tanggal";

                      const isDone = t.status === "done";
                      const statusLabel = prettyStatus(t.status);
                      const intent = badgeIntent(t.status);
                      const nextStatus = isDone ? "pending" : "done";

                      return (
                        <div
                          key={t.id}
                          className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleTodoStatusChange(t.id, nextStatus)
                            }
                            className="pt-0.5"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-100">
                              {t.title}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-300">
                              {t.subject || "Modul"} • {dueLabel}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <Badge intent={intent}>{statusLabel}</Badge>
                            <button
                              type="button"
                              onClick={() => handleTodoDelete(t)}
                              className="text-xs text-slate-400 hover:text-rose-500 inline-flex items-center gap-1 dark:text-slate-400 dark:hover:text-rose-400"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {todos.length === 0 && !addingTodo && (
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Belum ada to-do. Tambahkan modul yang ingin kamu
                        selesaikan minggu ini.
                      </p>
                    )}
                  </div>
                </Section>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
