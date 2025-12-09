import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMentorOverview, fetchMentorMentees } from '../lib/api-mentor';
import { useAuth } from '../lib/auth-context';
import { Users2, Smartphone, Zap, AlertTriangle, Search, ChevronRight } from 'lucide-react';
// Navbar dihapus
import MentorMenteeRadar from '../features/mentor/MentorMenteeRadar.jsx';

// ---------- filter options ----------
const STYLE_FILTER_OPTIONS = [
  { value: 'ALL',        label: 'Semua Kategori' },
  { value: 'CONSISTENT', label: 'Consistent Learner' },
  { value: 'FAST',       label: 'Fast Learner' },
  { value: 'REFLECTIVE', label: 'Reflective Learner' },
];

// ---------- helpers ----------
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const resolveAvatar = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${clean}`;
};

const initialsOf = (s) => {
  if (!s) return '??';
  const p = s.includes('@') ? s.split('@')[0] : s;
  const parts = p.replace(/[_\-\.]+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const styleLabel = (s) =>
  s === 'fast' ? 'Fast Learner' : s === 'reflective' ? 'Reflective Learner' : 'Consistent Learner';

// down FAST: biru, CONSISTENT: hijau, REFLECTIVE: merah muda
const styleBadgeClass = (s) => {
  if (s === 'fast') {
    return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700';
  }
  if (s === 'reflective') {
    return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700';
  }
  // default: CONSISTENT
  return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700';
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
    <div className={`rounded-2xl px-5 py-4 shadow-sm bg-gradient-to-r ${statCardClass(tone)} text-white dark:shadow-none`}>
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
      <div className="w-56 h-56 rounded-full overflow-hidden ring-4 ring-blue-200 dark:ring-blue-800">
        <img src={resolveAvatar(src)} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-56 h-56 rounded-full grid place-items-center text-5xl text-white font-semibold shadow
                    bg-gradient-to-br from-indigo-400 to-indigo-600 ring-4 ring-blue-200 dark:ring-blue-700">
      {initials}
    </div>
  );
}

function SmallAvatar({ name, email, src }) {
  const [broken, setBroken] = useState(false);
  const initials = initialsOf(name || email);
  const resolved = !broken ? resolveAvatar(src) : null;

  if (resolved) {
    return (
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
        <img
          src={resolved}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-lg grid place-items-center text-white font-semibold
                    bg-gradient-to-br from-emerald-400 to-green-600">
      {initials}
    </div>
  );
}

function Badge({ style }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${styleBadgeClass(style)}`}
    >
      {styleLabel(style)}
    </span>
  );
}

function ProbRow({ pf, pc, pr }) {
  const has = [pf, pc, pr].some(v => v != null);
  if (!has) return null;

  return (
    <div className="mt-2">
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 inline-block" style={{ width: barWidth(pc) }} />
        <div className="h-full bg-violet-500 inline-block" style={{ width: barWidth(pf) }} />
        <div className="h-full bg-rose-500 inline-block" style={{ width: barWidth(pr) }} />
      </div>
      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
        {pc != null && (
          <span>
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1" />
            Consistent {pctOf(pc)}
          </span>
        )}
        {pf != null && (
          <span>
            <span className="inline-block w-2 h-2 bg-violet-500 rounded-full mr-1" />
            Fast {pctOf(pf)}
          </span>
        )}
        {pr != null && (
          <span>
            <span className="inline-block w-2 h-2 bg-rose-500 rounded-full mr-1" />
            Reflective {pctOf(pr)}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm
                    backdrop-blur dark:bg-slate-900/60 dark:border-slate-700/70">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
        {value ?? '-'}
      </div>
    </div>
  );
}

function MenteeRow({ data }) {
  const [open, setOpen] = useState(false);
  const fmtInt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return Math.round(n);
  };
  const fmtOne = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return n.toFixed(1);
  };
  const fmtPct = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return `${Math.round(n * 100)}%`;
  };
  const fmtDays = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '-';
    return `${Math.max(0, Math.round(n))} hari`;
  };

  return (
    <div className="w-full rounded-2xl border bg-white hover:shadow transition px-4 py-3
                    border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
      <div className="flex flex-wrap items-start gap-3">
        <SmallAvatar name={data.name} email={data.email} src={data.avatar} />
        <div className="flex-1 min-w-[180px]">
          <div className="text-[15px] font-semibold leading-tight">{data.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{data.email}</div>
          <div className="mt-1 sm:hidden">
            <Badge style={data.style} />
          </div>
        </div>
        <div className="hidden sm:block">
          <Badge style={data.style} />
        </div>
        <button
          className="ml-auto sm:ml-3 shrink-0 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 self-start"
          onClick={() => setOpen(v => !v)}
        >
          {open ? 'Tutup' : 'Lihat'}
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <div className="mt-3 h-[1px] w-full bg-slate-100 dark:bg-slate-800" />

      {false && (
        <ProbRow
          pf={data.prob_fast}
          pc={data.prob_consistent}
          pr={data.prob_reflective}
        />
      )}

      {open && (
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <MetricTile label="Total Submissions"   value={fmtInt(data.total_submissions)} />
          <MetricTile label="Pass Rate"           value={fmtPct(data.pass_rate)} />
          <MetricTile label="Avg Score"           value={fmtOne(data.avg_exam_score)} />
          <MetricTile label="Avg Study Duration"  value={fmtOne(data.avg_study_duration)} />
          <MetricTile label="Avg Completion Rate" value={fmtOne(data.avg_completion_rating)} />
          <MetricTile label="Avg Rating"          value={fmtOne(data.avg_submission_rating)} />
          <MetricTile label="Study Minutes"       value={fmtOne(data.study_minutes)} />
          <MetricTile label="Tutorials"           value={fmtInt(data.tutorials_completed)} />
          <MetricTile label="Tracking Events"     value={fmtInt(data.total_tracking_events)} />
          <MetricTile label="Last Active"         value={fmtDays(data.days_since_last_activity)} />
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
  const [allMentees, setAllMentees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('ALL');

  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [o, mentees] = await Promise.all([
          fetchMentorOverview(),
          (async () => {
            let combined = [];
            let currentPage = 1;

            while (true) {
              const res = await fetchMentorMentees({ page: currentPage });

              const items = Array.isArray(res)
                ? res
                : (res?.items ?? res?.data ?? []);

              combined = combined.concat(items || []);

              const meta = res?.pagination ?? res?.meta;

              if (!meta) break;

              let totalPages = meta.totalPages || meta.pageCount || meta.pages;

              if (!totalPages) {
                const total = meta.total ?? meta.totalItems;
                const perPage = meta.perPage ?? meta.limit ?? meta.pageSize;
                if (total && perPage) {
                  totalPages = Math.ceil(total / perPage);
                } else {
                  break;
                }
              }

              if (currentPage >= totalPages) break;

              currentPage += 1;
            }

            return combined;
          })(),
        ]);

        setOverview(o);
        setAllMentees(mentees);
        setPage(1);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const radarStats = useMemo(
    () => ({
      totalMentee: overview?.total ?? 0,
      consistentCount: overview?.consistent ?? 0,
      fastCount: overview?.fast ?? 0,
      reflectiveCount: overview?.reflective ?? 0,
    }),
    [overview]
  );

  const filteredMentees = useMemo(() => {
    return allMentees
      .filter((m) => {
        if (styleFilter === 'ALL') return true;
        const dominant = (m.style || '').toString().toUpperCase();
        return dominant === styleFilter;
      })
      .filter((m) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        return (
          (m.name || '').toLowerCase().includes(q) ||
          (m.email || '').toLowerCase().includes(q) ||
          (m.student_code || '').toLowerCase().includes(q)
        );
      });
  }, [allMentees, styleFilter, search]);

  useEffect(() => {
    setPage(1);
  }, [styleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMentees.length / PER_PAGE));

  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredMentees.slice(start, start + PER_PAGE);
  }, [filteredMentees, page]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Navbar global ada di layout, jadi tidak dipanggil di sini */}

      <div className="px-6 py-5">
        <div className="mb-4 text-center lg:text-left">
          <h1 className="text-xl font-semibold">
            Welcome,{' '}
            <span className="text-indigo-600 dark:text-indigo-400">{mentor.name}</span>!{' '}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl border-2 border-blue-300 bg-white p-5 shadow-sm
                            dark:bg-slate-900 dark:border-blue-800">
              <div className="flex flex-col items-center gap-4">
                <BigAvatar name={mentor.name} email={mentor.email} src={mentor.avatar} />
                <div className="text-center">
                  <div className="text-lg font-bold">{mentor.name}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{mentor.email}</div>
                </div>
                <Link
                  to="/mentor/profile"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2"
                >
                  Edit Profile
                </Link>
              </div>
            </div>

            <MentorMenteeRadar stats={radarStats} />
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
              <StatCard icon={Users2} label="Jumlah Mentee" value={overview?.total ?? 0} tone="blue" />
              <StatCard
                icon={Smartphone}
                label="Jumlah Mentee Consistent Learner"
                value={`${overview?.consistent ?? 0} | ${(() => {
                  const t = overview?.total ?? 0; const c = overview?.consistent ?? 0;
                  return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
                })()}`}
                tone="green"
              />
              <StatCard
                icon={Zap}
                label="Jumlah Mentee Fast Learner"
                value={`${overview?.fast ?? 0} | ${(() => {
                  const t = overview?.total ?? 0; const c = overview?.fast ?? 0;
                  return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
                })()}`}
                tone="purple"
              />
              <StatCard
                icon={AlertTriangle}
                label="Jumlah Mentee Reflective Learner"
                value={`${overview?.reflective ?? 0} | ${(() => {
                  const t = overview?.total ?? 0; const c = overview?.reflective ?? 0;
                  return t > 0 ? `${Math.round((c / t) * 100)}%` : '0%';
                })()}`}
                tone="red"
              />
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm
                            border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-emerald-600">Student</span> Mentee Profile
              </div>

              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Search Mentee..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm
                               bg-white border-slate-200 text-slate-900
                               focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100
                               dark:placeholder-slate-500"
                  />
                </div>

                <div className="sm:w-[200px]">
                  <select
                    value={styleFilter}
                    onChange={(e) => setStyleFilter(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-slate-700 border-slate-200
                               focus:outline-none focus:ring-2 focus:ring-indigo-500
                               dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  >
                    {STYLE_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="rounded-xl border bg-slate-50 p-4 dark:bg-slate-800 dark:border-slate-700">
                    Memuat...
                  </div>
                ) : pageItems.length > 0 ? (
                  pageItems.map((it, idx) => (
                    <MenteeRow key={`${it.ml_user_id ?? it.id ?? idx}`} data={it} />
                  ))
                ) : (
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-500
                                  dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">
                    Tidak ada data.
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                <button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50
                             dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Hal {page} / {totalPages}
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50 disabled:opacity-50
                             dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
