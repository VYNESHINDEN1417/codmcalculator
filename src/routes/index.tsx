import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
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
  { name: "STATIC-HV CORE OF FIRE", img: gun2.url },
  { name: "ISO HEMLOCK CORE OF THUNDER", img: gun3.url },
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
    <div className="text-center font-mono" aria-label="Current Philippine time">
      <div className="text-sm tabular-nums text-foreground">{time}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{date}</div>
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
    <div className="mx-auto w-full max-w-lg text-center" aria-label="Event countdown">
      <div className="text-[10px] text-muted-foreground sm:text-xs">
        EVENT ENDS · DEC 10, 2026 · 7:39 AM PHT
      </div>
      {c.ended && now ? (
        <div className="mt-4 font-mono text-4xl font-bold text-primary">EVENT EXPIRED</div>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2 font-mono">
          {cells.map(([l, v]) => (
            <div key={l} className="text-center">
              <div className="text-4xl font-bold tabular-nums text-primary sm:text-5xl">
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
      <Button
        onClick={convert}
        className="mt-6 h-auto w-full rounded-full bg-primary py-3 font-mono font-bold tracking-[0.3em] text-primary-foreground hover:opacity-90"
      >
        CONVERT
      </Button>
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
        </div>
      )}
    </section>
  );
}

function Index() {
  const [rotation, setRotation] = useState(0);
  const n = WEAPONS.length;
  const sel = ((rotation % n) + n) % n;
  const w = WEAPONS[sel];
  if (!w) return null;
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="flex flex-col items-center gap-8">
        <PhClock />
        <Countdown />
      </header>

      <section className="mt-16 text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-4xl" aria-live="polite">{w.name}</h1>
        <div className="weapon-carousel mt-8" aria-label="Featured weapons">
          {WEAPONS.map((weapon, i) => (
            <Button
              key={weapon.name}
              variant="ghost"
              onClick={() => {
                const offset = (i - sel + n) % n;
                if (offset === 1) setRotation((value) => value + 1);
                if (offset === 2) setRotation((value) => value - 1);
              }}
              aria-label={`Show ${weapon.name}`}
              aria-pressed={i === sel}
              className="weapon-orbit"
              style={{ "--orbit-angle": `${(rotation - i) * 120}deg` } as CSSProperties}
            >
              <img src={weapon.img} alt={weapon.name} className="h-full w-full object-contain" draggable={false} />
            </Button>
          ))}
        </div>
      </section>

      <div className="mt-20">
        <SigilCalc />
      </div>
    </main>
  );
}
