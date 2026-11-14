import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const SUPABASE_URL = "https://bmeddjzihcvraqmhkxen.supabase.co";
const SUPABASE_KEY = "sb_publishable_Y5Vkz3pQPuihk6qXt2w2bA_BOPEJJpm";
const SESSION_KEY = "codm_calculator_analytics_session";
const OWNER_VISITOR_KEY = "codm_calculator_owner_visitor";
const VISITOR_ID_KEY = "codm_analytics_visitor";

type AuthSession = { access_token: string; refresh_token: string; expires_at?: number };
type Visit = {
  visited_at: string;
  visitor_id: string;
  session_id: string | null;
  page_path: string;
  traffic_source: string;
  search_engine: string | null;
  device_type: string | null;
  bot_type?: string | null;
};
type AnalyticsEvent = {
  occurred_at: string;
  visitor_id: string;
  session_id: string | null;
  event_name: string;
  weapon: string | null;
  event_data?: Record<string, unknown> | null;
};
type AnalyticsPayload = {
  totalViews: number;
  totalEvents: number;
  visits: Visit[];
  events: AnalyticsEvent[];
  truncated: boolean;
};

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function readSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? (JSON.parse(value) as AuthSession) : null;
  } catch {
    return null;
  }
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) throw new Error("Your session expired. Please sign in again.");
  const data = await response.json();
  const next = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at };
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return next;
}

async function loadAnalytics(session: AuthSession) {
  let active = session;
  if (active.expires_at && active.expires_at * 1000 < Date.now() + 30_000) {
    active = await refreshSession(active);
  }
  const request = () => fetch(`${SUPABASE_URL}/functions/v1/codm-calculator-dashboard`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${active.access_token}` },
    cache: "no-store",
  });
  let response = await request();
  if (response.status === 401) {
    active = await refreshSession(active);
    response = await request();
  }
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to load calculator analytics.");
  }
  return { data: (await response.json()) as AnalyticsPayload, session: active };
}

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tabular-nums sm:text-4xl">{value.toLocaleString()}</p>
      <p className="mt-2 text-[11px] text-slate-500">{note}</p>
    </div>
  );
}

function AnalyticsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [payload, setPayload] = useState<AnalyticsPayload | null>(null);
  const [range, setRange] = useState<1 | 7 | 30 | 0>(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [ownerVisitorId, setOwnerVisitorId] = useState<string | null>(null);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || data.message || data.error_description || "Sign-in failed.");
      const next = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at };
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      const ownerId = localStorage.getItem(VISITOR_ID_KEY) || crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, ownerId);
      localStorage.setItem(OWNER_VISITOR_KEY, ownerId);
      setOwnerVisitorId(ownerId);
      setPassword("");
      setSession(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    if (session) {
      void fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}` },
      }).catch(() => undefined);
    }
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setPayload(null);
    setError("");
  }

  useEffect(() => {
    const saved = readSession();
    if (saved) {
      setSession(saved);
      const ownerId = localStorage.getItem(VISITOR_ID_KEY) || crypto.randomUUID();
      localStorage.setItem(VISITOR_ID_KEY, ownerId);
      localStorage.setItem(OWNER_VISITOR_KEY, ownerId);
      setOwnerVisitorId(ownerId);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setBusy(true);
    setError("");
    loadAnalytics(session)
      .then(({ data, session: active }) => {
        if (cancelled) return;
        localStorage.setItem(SESSION_KEY, JSON.stringify(active));
        setSession(active);
        setPayload(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Unable to load analytics.");
        if (err instanceof Error && err.message.toLowerCase().includes("session")) {
          localStorage.removeItem(SESSION_KEY);
          setSession(null);
        }
      })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const visits = payload?.visits ?? [];
  const events = payload?.events ?? [];
  const cutoff = useMemo(() => {
    if (!range) return 0;
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    if (range !== 1) date.setDate(date.getDate() - range);
    return date.getTime();
  }, [range]);
  const filteredVisits = useMemo(() => visits.filter((row) => {
    const time = new Date(row.visited_at).getTime();
    return time >= cutoff && time <= Date.now();
  }), [visits, cutoff]);
  const filteredEvents = useMemo(() => events.filter((row) => {
    const time = new Date(row.occurred_at).getTime();
    return time >= cutoff && time <= Date.now();
  }), [events, cutoff]);
  const recentVisits = [...filteredVisits].sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()).slice(0, 15);

  const uniqueVisitors = new Set(filteredVisits.map((row) => row.visitor_id)).size;
  const sessions = new Set(filteredVisits.map((row) => row.session_id).filter(Boolean)).size;
  const calculations = filteredEvents.filter((row) => row.event_name === "calculate").length;
  const weaponSelections = filteredEvents.filter((row) => row.event_name === "weapon_select").length;
  const musicToggles = filteredEvents.filter((row) => row.event_name === "music_toggle").length;
  const shares = filteredEvents.filter((row) => row.event_name === "share").length;

  const sources = Object.entries(filteredVisits.reduce<Record<string, number>>((acc, row) => {
    const key = row.traffic_source || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const devices = Object.entries(filteredVisits.reduce<Record<string, number>>((acc, row) => {
    const key = row.device_type || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]);
  const weapons = Object.entries(filteredEvents.filter((row) => row.event_name === "weapon_select" && row.weapon).reduce<Record<string, number>>((acc, row) => {
    const key = row.weapon as string;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const dayCount = range === 1 ? 24 : range === 7 ? 7 : 14;
  const chartBars = Array.from({ length: dayCount }, (_, index) => {
    if (range === 1) {
      const hour = new Date();
      hour.setHours(index, 0, 0, 0);
      const end = new Date(hour);
      end.setHours(index + 1, 0, 0, 0);
      return {
        key: String(index),
        label: hour.toLocaleTimeString("en", { hour: "numeric", hour12: true }),
        count: filteredVisits.filter((row) => {
          const time = new Date(row.visited_at).getTime();
          return time >= hour.getTime() && time < end.getTime();
        }).length,
      };
    }
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (dayCount - 1 - index));
    const key = date.toLocaleDateString("en-CA");
    return {
      key,
      label: date.toLocaleDateString("en", { weekday: "short" }),
      count: filteredVisits.filter((row) => {
        const visitDate = new Date(row.visited_at);
        return visitDate.getFullYear() === date.getFullYear() && visitDate.getMonth() === date.getMonth() && visitDate.getDate() === date.getDate();
      }).length,
    };
  });
  const maxBar = Math.max(1, ...chartBars.map((bar) => bar.count));

  if (!loaded) return <div className="min-h-screen bg-[#080a0f]" />;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a0f] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#11151d] p-7 shadow-2xl sm:p-9">
          <p className="text-xs font-bold tracking-[0.35em] text-[#FF7300]">CODM CALCULATOR / PRIVATE</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Analytics access</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in with your authorized dashboard account.</p>
          <form onSubmit={signIn} className="mt-8 space-y-4">
            <label className="block text-sm text-slate-300">Email
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#090c12] px-4 py-3 text-white outline-none transition focus:border-[#FF7300]" />
            </label>
            <label className="block text-sm text-slate-300">Password
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#090c12] px-4 py-3 text-white outline-none transition focus:border-[#FF7300]" />
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-[#FF7300] px-4 py-3 font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60">{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-500">Private dashboard · Authorized account only</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080a0f] px-4 py-6 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold tracking-[0.32em] text-[#FF7300]">CODM CALCULATOR / CONTROL ROOM</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Calculator analytics</h1>
            <p className="mt-1 text-sm text-slate-400">Traffic, visitors and how people use the calculator.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">PRIVATE ACCESS</span>
            <button onClick={signOut} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Sign out</button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">{busy ? "Refreshing data…" : "Analytics overview"}</p>
          <div className="flex rounded-lg border border-white/10 bg-[#11151d] p-1">
            {([1, 7, 30, 0] as const).map((value) => (
              <button key={value} onClick={() => setRange(value)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${range === value ? "bg-[#FF7300] text-slate-950" : "text-slate-400 hover:text-white"}`}>{value === 1 ? "24 hours" : value === 0 ? "All" : `${value} days`}</button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</p>}

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Page views" value={range === 0 && !payload?.truncated ? payload?.totalViews ?? 0 : filteredVisits.length} note={range === 0 && payload?.truncated ? "Latest 5,000 records" : "Recorded page loads"} />
          <StatCard label="Unique visitors" value={uniqueVisitors} note="Anonymous browser IDs" />
          <StatCard label="Sessions" value={sessions} note="Browsing sessions" />
          <StatCard label="Interactions" value={range === 0 && !payload?.truncated ? payload?.totalEvents ?? 0 : filteredEvents.length} note="Tracked calculator actions" />
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Calculations" value={calculations} note="Calculate button used" />
          <StatCard label="Weapon selections" value={weaponSelections} note="Carousel selections" />
          <StatCard label="Music toggles" value={musicToggles} note="Background music control" />
          <StatCard label="Shares" value={shares} note="Share actions recorded" />
        </section>

        <section className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Traffic over time</h2><span className="text-xs text-slate-500">{range === 1 ? "Hourly views" : "Daily views"}</span></div>
            {range === 1 && <p className="mt-3 text-[11px] text-slate-500">Today · 12 AM to 11 PM</p>}
            <div className={`mt-5 flex h-48 items-end gap-1 overflow-x-auto pb-1 sm:gap-2 ${range === 1 ? "min-w-0" : ""}`}>
              {chartBars.map((bar) => {
                const height = bar.count ? Math.max(5, (bar.count / maxBar) * 78) : 1;
                return (
                  <div key={bar.key} className={`flex h-full flex-col items-center ${range === 1 ? "w-9 shrink-0" : "min-w-0 flex-1"}`}>
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      {bar.count > 0 && <span className="absolute text-[9px] tabular-nums text-slate-400" style={{ bottom: `calc(${height}% + 4px)` }}>{bar.count}</span>}
                      <div className="w-full max-w-8 rounded-t-sm bg-[#FF7300]/80" style={{ height: `${height}%` }} />
                    </div>
                    <span className="mt-2 h-3 whitespace-nowrap text-[9px] text-slate-500">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Traffic sources</h2>
            <div className="mt-5 space-y-4">
              {sources.length ? sources.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="capitalize text-slate-300">{name}</span><span className="tabular-nums text-slate-400">{count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7300]" style={{ width: `${(count / Math.max(1, filteredVisits.length)) * 100}%` }} /></div>
                </div>
              )) : <p className="text-sm text-slate-500">No traffic data for this period yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Most selected weapons</h2>
            <div className="mt-4 divide-y divide-white/5">
              {weapons.length ? weapons.map(([weapon, count]) => (
                <div key={weapon} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="truncate text-slate-300">{weapon}</span><span className="shrink-0 tabular-nums text-slate-400">{count} selections</span></div>
              )) : <p className="py-4 text-sm text-slate-500">No weapon selections recorded yet.</p>}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
            <h2 className="font-semibold">Devices</h2>
            <div className="mt-4 space-y-4">
              {devices.length ? devices.map(([name, count]) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="capitalize text-slate-300">{name}</span><span className="tabular-nums text-slate-400">{count}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7300]" style={{ width: `${(count / Math.max(1, filteredVisits.length)) * 100}%` }} /></div>
                </div>
              )) : <p className="text-sm text-slate-500">No device data yet.</p>}
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Recent visitors</h2><span className="text-[11px] text-slate-500"><span className="font-semibold text-amber-300">OWNER</span> = your browser</span></div>
          <div className="mt-4 divide-y divide-white/5">
            {recentVisits.length ? recentVisits.map((row, index) => {
              const isOwner = Boolean(ownerVisitorId && row.visitor_id === ownerVisitorId);
              return (
                <div key={`${row.visited_at}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${isOwner ? "text-amber-300" : "text-slate-300"}`}>{isOwner ? "OWNER · You" : `Visitor · ${row.visitor_id.slice(0, 8)}`}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{row.page_path || "/"} · {row.traffic_source || "unknown"} · {row.device_type || "unknown"}</p>
                  </div>
                  <time className={`shrink-0 text-[11px] ${isOwner ? "text-amber-300/80" : "text-slate-500"}`}>{new Date(row.visited_at).toLocaleString()}</time>
                </div>
              );
            }) : <p className="py-4 text-sm text-slate-500">No visits recorded in this period yet.</p>}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-white/10 bg-[#11151d] p-4 sm:p-5">
          <h2 className="font-semibold">Recent activity</h2>
          <div className="mt-4 divide-y divide-white/5">
            {filteredEvents.slice(0, 10).length ? filteredEvents.slice(0, 10).map((row, index) => (
              <div key={`${row.occurred_at}-${index}`} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0"><p className="truncate capitalize text-slate-300">{row.event_name.replaceAll("_", " ")}</p><p className="mt-1 truncate text-[11px] text-slate-500">{row.weapon || "Calculator interaction"}</p></div>
                <time className="shrink-0 text-[11px] text-slate-500">{new Date(row.occurred_at).toLocaleString()}</time>
              </div>
            )) : <p className="py-4 text-sm text-slate-500">No interactions recorded in this period yet.</p>}
          </div>
        </section>
        {payload?.truncated && <p className="mt-5 text-center text-xs text-amber-300/80">Showing the latest 5,000 visits and interactions. Older records are not included in the breakdowns.</p>}
        <footer className="mt-8 border-t border-white/10 pt-4 text-center text-[11px] text-slate-600">CODM CALCULATOR · PRIVATE ANALYTICS · No raw IP addresses are collected</footer>
      </div>
    </main>
  );
}
