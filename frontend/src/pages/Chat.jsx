import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  Loader2,
  Plus,
  Search,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import {
  fetchChatMessages,
  fetchChatThreads,
  searchChatPartners,
  sendChatMessage,
  startChatWithUser,
} from "../lib/api-chat";
import { publicUrl } from "../lib/api";
import { notify } from "../lib/notify";

const fallbackAvatar =
  "https://api.dicebear.com/7.x/thumbs/svg?seed=study&backgroundColor=4c6fff,5dd8ff";

const initialsOf = (name = "") => {
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
};

function Avatar({ src, name, size = "md" }) {
  const [broken, setBroken] = useState(false);
  const resolved = !broken && src ? publicUrl(src) : null;
  const cls =
    size === "lg"
      ? "w-12 h-12"
      : size === "sm"
        ? "w-8 h-8"
        : "w-10 h-10";

  if (resolved) {
    return (
      <img
        src={resolved}
        alt={name}
        className={`${cls} rounded-xl object-cover border border-slate-200 dark:border-slate-700`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <div
      className={`${cls} rounded-xl grid place-items-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-semibold`}
    >
      {initialsOf(name)}
    </div>
  );
}

function ThreadItem({ thread, active, onClick }) {
  const counterpart = thread.counterpart || {};
  const unread = thread.unread_count || 0;
  const last = thread.last_message;
  const snippet = last?.body
    ? last.body.length > 40
      ? `${last.body.slice(0, 40)}…`
      : last.body
    : "Belum ada pesan";
  const timeLabel = last?.created_at
    ? `${formatDate(last.created_at)} ${formatTime(last.created_at)}`
    : "";

  return (
    <button
      onClick={onClick}
      className={[
        "w-full rounded-xl border px-3 py-3 text-left transition",
        active
          ? "border-indigo-400 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-900/30"
          : "border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-slate-700",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <Avatar src={counterpart.avatar_url} name={counterpart.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {counterpart.name || counterpart.email || "Pengguna"}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {counterpart.email || "-"}
          </div>
        </div>
        {unread > 0 && (
          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </div>
      <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span className="truncate">{snippet}</span>
        <span className="shrink-0">{timeLabel}</span>
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} px-1`}>
      <div
        className={[
          "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
          isMine
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-50",
        ].join(" ")}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{msg.body}</div>
        <div
          className={`mt-1 text-[11px] ${
            isMine ? "text-indigo-100/80" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {formatDate(msg.created_at)} • {formatTime(msg.created_at)}
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeId, setActiveId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composer, setComposer] = useState("");

  const [partners, setPartners] = useState([]);
  const [partnerQuery, setPartnerQuery] = useState("");
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);

  const bottomRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((t) => String(t.id) === String(activeId)) || null,
    [threads, activeId],
  );

  const loadThreads = async (silent = false) => {
    if (!silent) setLoadingThreads(true);
    try {
      const data = await fetchChatThreads();
      setThreads(data || []);
      if (!activeId && data?.length) {
        setActiveId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      notify.error("Gagal memuat percakapan");
    } finally {
      if (!silent) setLoadingThreads(false);
    }
  };

  const loadMessages = async (threadId, { silent = false } = {}) => {
    if (!threadId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const data = await fetchChatMessages(threadId, { limit: 120 });
      setMessages(data || []);
      // set unread thread ini ke 0 (server sudah tandai read)
      setThreads((prev) =>
        prev.map((t) =>
          String(t.id) === String(threadId) ? { ...t, unread_count: 0 } : t
        )
      );
    } catch (err) {
      console.error(err);
      notify.error("Gagal memuat pesan");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const refreshPartners = async (queryText = "") => {
    setLoadingPartners(true);
    try {
      const res = await searchChatPartners(queryText);
      setPartners(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPartners(false);
    }
  };

  useEffect(() => {
    loadThreads();
    refreshPartners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => loadThreads(true), 12000);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    loadMessages(activeId);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return undefined;
    const handle = setInterval(() => loadMessages(activeId, { silent: true }), 6000);
    return () => clearInterval(handle);
  }, [activeId]);

  useEffect(() => {
    if (!partnerQuery.trim()) {
      refreshPartners("");
      return undefined;
    }
    const handle = setTimeout(() => refreshPartners(partnerQuery), 350);
    return () => clearTimeout(handle);
  }, [partnerQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setActiveAndEnsure = (threadId) => {
    setActiveId(threadId);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = composer.trim();
    if (!text || !activeId) return;

    setComposer("");
    try {
      const msg = await sendChatMessage(activeId, text);
      setMessages((prev) => [...prev, msg]);
      setThreads((prev) => {
        const remaining = prev.filter((t) => String(t.id) !== String(activeId));
        const current =
          prev.find((t) => String(t.id) === String(activeId)) || activeThread || {};
        const updated = {
          ...current,
          last_message: msg,
          last_message_at: msg?.created_at,
        };
        return [updated, ...remaining];
      });
    } catch (err) {
      console.error(err);
      notify.error("Gagal mengirim pesan");
      setComposer(text);
    }
  };

  const handleStartChat = async (partnerId) => {
    setCreatingThread(true);
    try {
      const t = await startChatWithUser(partnerId);
      if (!t?.id) {
        notify.error("Tidak bisa membuat percakapan baru");
        return;
      }

      setThreads((prev) => {
        const exists = prev.find((p) => String(p.id) === String(t.id));
        if (exists) return prev;
        return [t, ...prev];
      });
      setActiveId(t.id);
    } catch (err) {
      console.error(err);
      notify.error("Gagal memulai chat");
    } finally {
      setCreatingThread(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-400 font-semibold">
              Chat Mentor & Mentee
            </p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Ruang Percakapan
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kirim pesan singkat antara mentor dan mentee. Data disimpan aman di server.
            </p>
          </div>
          <button
            onClick={loadThreads}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Muat ulang
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-semibold">Percakapan</span>
                </div>
                {loadingThreads && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>

              {threads.length === 0 && !loadingThreads ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Belum ada percakapan. Mulai chat baru dengan {user?.role === "mentor" ? "mentee" : "mentor"}.
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {threads.map((t) => (
                    <ThreadItem
                      key={t.id}
                      thread={t}
                      active={String(t.id) === String(activeId)}
                      onClick={() => setActiveAndEnsure(t.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Mulai Chat Baru</span>
                {loadingPartners && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-800">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={partnerQuery}
                  onChange={(e) => setPartnerQuery(e.target.value)}
                  placeholder="Cari nama atau email..."
                  className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                {partners.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Tidak ada kandidat yang cocok.
                  </div>
                ) : (
                  partners.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Avatar src={p.avatar_url || fallbackAvatar} name={p.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {p.name || p.email}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {p.email}
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartChat(p.id)}
                        disabled={creatingThread}
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        Mulai
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <Avatar
                  src={activeThread?.counterpart?.avatar_url || fallbackAvatar}
                  name={activeThread?.counterpart?.name}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeThread?.counterpart?.name || "Pilih percakapan"}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {activeThread?.counterpart?.email || ""}
                  </div>
                </div>
                {loadingMessages && <Loader2 className="h-5 w-5 animate-spin text-slate-500" />}
              </div>

              <div className="h-[520px] overflow-y-auto bg-slate-50/60 px-4 py-3 dark:bg-slate-950/40">
                {!activeThread ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    Pilih percakapan atau mulai chat baru.
                  </div>
                ) : messages.length === 0 && !loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                    Belum ada pesan. Mulai percakapan pertama!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <MessageBubble
                        key={m.id}
                        msg={m}
                        isMine={String(m.sender_id) === String(user?.id)}
                      />
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSend} className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                  <textarea
                    rows={2}
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    placeholder="Tulis pesan..."
                    className="flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none dark:text-slate-50"
                    disabled={!activeThread}
                  />
                  <button
                    type="submit"
                    disabled={!composer.trim() || !activeThread}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    aria-label="Kirim pesan"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
