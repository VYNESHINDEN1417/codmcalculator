import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import gun1 from "@/assets/gun1.png.asset.json";
import gun2 from "@/assets/gun2.png.asset.json";
import gun3 from "@/assets/gun3.png.asset.json";
import { countdownParts, formatManila } from "@/lib/ph-time";
import { calcSigils, parseSigils, TARGET_SIGILS, WEEKLY_SIGILS } from "@/lib/sigils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Weapon Event — Countdown & Sigil Calculator" },
      { name: "description", content: "Featured weapons, live Philippine time, event countdown and sigil calculator." },
      { property: "og:title", content: "Weapon Event — Countdown & Sigil Calculator" },
      { property: "og:description", content: "Featured weapons, live Philippine time, event countdown and sigil calculator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const WEAPONS = [
  { name: "BAL27 CORE OF REASON", img: gun1.url },
  { name: "ISO HEMLOCK CORE OF THUNDER", img: gun2.url },
  { name: "STATIC CORE OF FIRE", img: gun3.url },
];

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function PhClock() {
  const now = useNow();
  const { time, date } = now ? formatManila(new Date(now)) : { time: "--:--:-- --", date: "—" };
  return (
    <div className="font-mono">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
        </span>
        PHILIPPINE STANDARD TIME
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{time}</div>
      <div className="text-xs tracking-widest text-muted-foreground">{date}</div>
    </div>
  );
}

function Countdown() {
  const now = useNow();
  const c = countdownParts(now ?? 0);
  const cells = [
    ["DAYS", c.days],
    ["HRS", c.hours],
    ["MIN", c.minutes],
    ["SEC", c.seconds],
  ] as const;
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
        EVENT ENDS · DEC 10, 2026 · 7:39 AM PHT
      </div>
      {c.ended && now ? (
        <div className="mt-2 font-mono text-2xl font-bold text-primary">EVENT EXPIRED</div>
      ) : (
        <div className="mt-1 grid grid-cols-4 gap-2 font-mono">
          {cells.map(([l, v]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-bold tabular-nums text-primary">
                {now ? String(v).padStart(2, "0") : "--"}
              </div>
              <div className="text-[10px] text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SigilCalc() {
  const [raw, setRaw] = useState("260");
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<ReturnType<typeof calcSigils> | null>(null);
  const convert = () => {
    const p = parseSigils(raw);
    if ("error" in p) {
      setError(p.error);
      setRes(null);
      return;
    }
    setError(null);
    setRes(calcSigils(p.value, Date.now()));
  };
  const rows = res
    ? ([
        ["CURRENT SIGILS", res.current],
        ["REMAINING SIGILS", res.remaining],
        ["WEEKLY GRIND", `${WEEKLY_SIGILS} / week`],
        ["WEEKS REQUIRED", res.weeksRequired],
        ["PROJECTED TOTAL", res.projected],
        ["EVENT STATUS", res.status],
      ] as const)
    : [];
  return (
    <section className="mx-auto max-w-md text-center">
      <h2 className="font-mono text-xs tracking-[0.3em] text-muted-foreground">MYTHIC SIGIL CALCULATOR</h2>
      <label className="mt-6 block font-mono text-xs tracking-[0.2em] text-muted-foreground" htmlFor="sigils">
        CURRENT SIGILS
      </label>
      <input
        id="sigils"
        inputMode="numeric"
        placeholder="Enter your current sigils"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && convert()}
        className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-center font-mono text-4xl text-foreground outline-none focus:border-primary"
      />
      <button
        onClick={convert}
        className="mt-6 w-full rounded-full bg-primary py-3 font-mono font-bold tracking-[0.3em] text-primary-foreground hover:opacity-90"
      >
        CONVERT
      </button>
      {error && <p className="mt-4 font-mono text-sm text-destructive">{error}</p>}
      {res && (
        <div className="mt-10">
          <p className="font-mono text-3xl font-bold text-primary">
            {res.status === "MYTHIC UNLOCKED"
              ? "MYTHIC UNLOCKED"
              : `${res.weeksRequired} WEEK${res.weeksRequired === 1 ? "" : "S"} LEFT TO GRIND`}
          </p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            {res.current} / {TARGET_SIGILS} · {res.remaining} to go
          </p>
          <div className="mx-auto mt-3 h-1 w-full bg-muted">
            <div className="h-1 bg-primary" style={{ width: `${Math.min(100, (res.current / TARGET_SIGILS) * 100)}%` }} />
          </div>
          <dl className="mt-8 space-y-3 font-mono text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className={k === "EVENT STATUS" ? (res.status === "NOT ON TRACK" ? "text-destructive" : "text-live") : "text-foreground"}>{v}</dd>
              </div>
            ))}
          </dl>
          {res.status !== "MYTHIC UNLOCKED" && (
            <p className="mt-6 text-xs text-muted-foreground">
              About {res.opportunities} weekly grind{res.opportunities === 1 ? "" : "s"} left before the deadline. Estimate only, game reset times may vary.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function Index() {
  const [sel, setSel] = useState(0);
  const n = WEAPONS.length;
  const prev = (sel + n - 1) % n;
  const next = (sel + 1) % n;
  const w = WEAPONS[sel]!;
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <h1 className="font-mono text-xl font-bold tracking-[0.3em] text-foreground">ARSENAL EVENT</h1>
        <div className="flex flex-wrap gap-10">
          <PhClock />
          <Countdown />
        </div>
      </header>

      <section className="mt-16 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-primary">FEATURED MYTHIC</p>
        <h2 className="mt-2 text-3xl font-bold tracking-wide text-foreground md:text-4xl">{w.name}</h2>
        <div className="relative mt-8 flex items-center justify-center">
          {[prev, next].map((i, side) => (
            <button
              key={side}
              onClick={() => setSel(i)}
              aria-label={`Show ${WEAPONS[i]!.name}`}
              className={`absolute top-1/2 w-1/4 -translate-y-1/2 opacity-40 blur-[3px] transition hover:opacity-70 hover:blur-[1px] ${side === 0 ? "left-0" : "right-0"}`}
            >
              <img src={WEAPONS[i]!.img} alt="" className="w-full" />
            </button>
          ))}
          <img key={sel} src={w.img} alt={w.name} className="relative z-10 w-3/5 animate-in fade-in zoom-in-95 duration-500" />
        </div>
        <div className="mt-6 flex justify-center gap-2">
          {WEAPONS.map((x, i) => (
            <button key={x.name} onClick={() => setSel(i)} aria-label={x.name} className={`h-1.5 rounded-full transition-all ${i === sel ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground"}`} />
          ))}
        </div>
      </section>

      <div className="mt-20">
        <SigilCalc />
      </div>
    </main>
  );
}
