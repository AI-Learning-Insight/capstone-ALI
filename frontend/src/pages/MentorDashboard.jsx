import { useEffect, useMemo, useState } from 'react';
import { fetchMentorOverview, fetchMentorMentees } from '../lib/api-mentor';
import { useAuth } from '../lib/auth-context';
import { Users2, Smartphone, Zap, AlertTriangle, Search } from 'lucide-react';

// ---------- helpers ----------
const resolveAvatar = (url) => {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `${import.meta.env.VITE_API_URL}${url}`;
};

const initialsOf = (nameOrEmail) => {
  const s = (nameOrEmail || '').trim();
  if (!s) return '??';
  const p = s.includes('@') ? s.split('@')[0] : s;
  const parts = p.replace(/[_\-\.]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const styleLabel = (s) =>
  s === 'fast' ? 'Fast Learner' : s === 'reflective' ? 'Reflective Learner' : 'Consistent Learner';

const styleBadgeClass = (s) => {
  if (s === 'fast') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (s === 'reflective') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const pctOf = (v) => {
  if (v == null) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return `${Math.round(n * 100)}%`;
};

const barWidth = (v) => {
  if (v == null) return '0%';
  const n = Math.max(0, Math.min(1, Number(v)));
  return `${n * 100}%`;
};

const statCardClass = (tone) => {
  switch (tone) {
    case 'blue': return 'from-sky-500 to-blue-600';
    case 'green': return 'from-emerald-500 to-green-600';
    case 'purple': return 'from-fuchsia-500 to-purple-600';
    case 'red': return 'from-rose-500 to-red-600';
    default: return 'from-slate-200 to-slate-300';
  }
};

// ---------- small UI ----------
function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className={`rounded-2xl px-5 py-4 shadow-sm bg-gradient-to-r ${statCardClass(tone)} text-white`}>
      <div className="flex items-center gap-2 text-[13px] opacity-90">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <div className="text-3xl font-bold leading-tight mt-1">{value}</div>
    </div>
  );
}

function BigAvatar({ name, email, src }) {
  const initials = initialsOf(name || email);
  if (src) {
    return (
      <div className="w-56 h-56 rounded-full overflow-hidden ring-4 ring-blue-200">
        <img src={resolveAvatar(src)} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-56 h-56 rounded-full grid place-items-center text-5xl text-white font-semibold shadow
                    bg-gradient-to-br from-indigo-400 to-indigo-600 ring-4 ring-blue-200">
      {initials}
    </div>
  );
}

function SmallAvatar({ name, email, src }) {
  const initials = initialsOf(name || email);
  if (src) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200">
        <img src={resolveAvatar(src)} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  // avatar inisial dengan gradien
  return (
    <div className="w-12 h-12 rounded-lg grid place-items-center text-white font-semibold
                    bg-gradient-to-br from-emerald-400 to-green-600">
      {initials}
    </div>
  );
}

function Badge({ style }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${styleBadgeClass(style)}`}>
      {styleLabel(style)}
    </span>
  );
}

function ProbRow({ pf, pc, pr }) {
  const has = [pf, pc, pr].some(v => v != null);
  if (!has) return null;

  return (
    <div className="mt-2">
      {/* bar gabungan */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full bg-emerald-500 inline-block" style={{ width: barWidth(pc) }} />
        <div className="h-full bg-violet-500 inline-block" style={{ width: barWidth(pf) }} />
        <div className="h-full bg-rose-500 inline-block" style={{ width: barWidth(pr) }} />
      </div>
      {/* legenda angka */}
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600">
        {pc != null && <span><span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1" />Consistent {pctOf(pc)}</span>}
        {pf != null && <span><span className="inline-block w-2 h-2 bg-violet-500 rounded-full mr-1" />Fast {pctOf(pf)}</span>}
        {pr != null && <span><span className="inline-block w-2 h-2 bg-rose-500 rounded-full mr-1" />Reflective {pctOf(pr)}</span>}
      </div>
    </div>
  );
}

// --- tambahkan helper kecil untuk tile metrik ---
function MetricTile({ label, value }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-sm font-semibold">{value ?? '-'}</div>
    </div>
  );
}

// --- GANTI seluruh komponen MenteeRow lama dengan ini ---
function MenteeRow({ data }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full rounded-xl border bg-white hover:shadow transition px-4 py-3">
      {/* header baris */}
      <div className="flex items-center gap-3">
        <SmallAvatar name={data.name} email={data.email} src={data.avatar} />
        <div className="flex-1">
          <div className="text-[15px] font-semibold leading-tight">{data.name}</div>
          <div className="text-xs text-slate-500">{data.email}</div>
        </div>
        <div className="hidden sm:block">
          <Badge style={data.style} />
        </div>
        <button
          className="ml-3 text-xs font-medium text-slate-600 hover:text-slate-900"
          onClick={() => setOpen(v => !v)}
        >
          {open ? 'Tutup ↑' : 'Lihat →'}
        </button>
      </div>

      {/* garis tipis pemisah */}
      <div className="mt-3 h-[1px] w-full bg-slate-100" />

      {/* bar & angka probabilitas (jika backend kirim / fallback aktif) */}
      <ProbRow pf={data.prob_fast} pc={data.prob_consistent} pr={data.prob_reflective} />

      {/* detail metrik: tampil saat terbuka */}
      {open && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <MetricTile label="Exams Taken"   value={Number(data.exams_taken ?? 0)} />
          <MetricTile label="Pass Rate"     value={`${Math.round(Number(data.pass_rate ?? 0) * 100)}%`} />
          <MetricTile label="Avg Score"     value={Number(data.avg_exam_score ?? 0).toFixed(1)} />
          <MetricTile label="Study Minutes" value={Number(data.study_minutes ?? 0)} />
          <MetricTile label="Avg Rating"    value={Number(data.avg_submission_rating ?? 0).toFixed(1)} />
          <MetricTile label="Tutorials"     value={Number(data.tutorials_completed ?? 0)} />
        </div>
      )}
    </div>
  );
}

// ---------- PAGE ----------
export default function MentorDashboard() {
  const { user } = useAuth();
  const mentor = {
    name: user?.name ?? 'Mentor',
    email: user?.email ?? '-',
    avatar: user?.avatar_url || user?.avatar || null,
  };

  const [overview, setOverview] = useState(null);
  const [list, setList] = useState({ items: [], pagination: { page: 1, limit: 10, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [style, setStyle] = useState('');
  const [page, setPage] = useState(1);

  const limit = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [o, l] = await Promise.all([
          fetchMentorOverview(),
          fetchMentorMentees({ page, limit, search: q, style: style || undefined }),
        ]);
        setOverview(o);
        setList(l);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, q, style]); // eslint-disable-line react-hooks/exhaustive-deps

  const pages = useMemo(() => {
    const total = list?.pagination?.total ?? 0;
    return Math.max(1, Math.ceil(total / limit));
  }, [list, limit]);

  return (
    <div className="px-6 py-5">
      {/* Greeting */}
      <div className="mb-4 text-center lg:text-left">
        <h1 className="text-xl font-semibold">
          Welcome, Mentor <span className="text-indigo-600">{mentor.name}</span>! <span>👩‍🏫</span>
        </h1>
      </div>

      {/* Layout 2 kolom seperti mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT: profil mentor */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border-2 border-blue-300 bg-white p-5 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <BigAvatar name={mentor.name} email={mentor.email} src={mentor.avatar} />
              <div className="text-center">
                <div className="text-lg font-bold">{mentor.name}</div>
                <div className="text-sm text-slate-600 mt-1">{mentor.email}</div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2">
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: stats + list mentee */}
        <div className="lg:col-span-3">
          {/* stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
            <StatCard icon={Users2} label="Jumlah Mentee" value={overview?.total ?? 0} tone="blue" />
            <StatCard
              icon={Smartphone}
              label="Jumlah Mentee Consistent Learner"
              value={`${overview?.consistent ?? 0} • ${(() => {
                const t = overview?.total ?? 0; const c = overview?.consistent ?? 0;
                return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
              })()}`}
              tone="green"
            />
            <StatCard
              icon={Zap}
              label="Jumlah Mentee Fast Learner"
              value={`${overview?.fast ?? 0} • ${(() => {
                const t = overview?.total ?? 0; const c = overview?.fast ?? 0;
                return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
              })()}`}
              tone="purple"
            />
            <StatCard
              icon={AlertTriangle}
              label="Jumlah Mentee Reflective Learner"
              value={`${overview?.reflective ?? 0} • ${(() => {
                const t = overview?.total ?? 0; const c = overview?.reflective ?? 0;
                return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
              })()}`}
              tone="red"
            />
          </div>

          {/* list + filter */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <span className="text-emerald-600">🧑‍🎓</span> Mentee Profile
            </div>

            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border pl-9 pr-3 py-2"
                  placeholder="Search Mentee..."
                  value={q}
                  onChange={(e) => { setPage(1); setQ(e.target.value); }}
                />
              </div>
              <select
                className="rounded-lg border px-3 py-2"
                value={style}
                onChange={(e) => { setPage(1); setStyle(e.target.value); }}
              >
                <option value="">Semua Kategori</option>
                <option value="consistent">Consistent Learner</option>
                <option value="fast">Fast Learner</option>
                <option value="reflective">Reflective Learner</option>
              </select>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="rounded-xl border bg-slate-50 p-4">Memuat…</div>
              ) : (list.items ?? []).length > 0 ? (
                list.items.map((it, idx) => (
                  <MenteeRow key={`${it.ml_user_id}-${idx}`} data={it} />
                ))
              ) : (
                <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500">
                  Tidak ada data.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <div className="text-sm text-slate-600">
                Hal {page} / {Math.max(1, Math.ceil((list?.pagination?.total ?? 0) / limit))}
              </div>
              <button
                className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
                disabled={page >= Math.max(1, Math.ceil((list?.pagination?.total ?? 0) / limit))}
                onClick={() => setPage((p) => p + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
