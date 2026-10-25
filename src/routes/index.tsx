import { createFileRoute } from "@tanstack/react-router";
import { BoosterHelp } from "@/components/booster-help";
import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SigilTasks } from "@/components/sigil-tasks";
import { type TaskPlan } from "@/lib/sigil-tasks";
import gun1 from "@/assets/gun1.png";
import gun2 from "@/assets/gun2.png";
import gun3 from "@/assets/gun3.png";
import { countdownParts, formatManila } from "@/lib/ph-time";
import { acquisitionPhrase, BOOSTER_SIGILS, calcSigils, parseSigils, STATUS_LABEL, TARGET_SIGILS, WEEKLY_SIGILS } from "@/lib/sigils";

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
  { name: "BAL27 CORE OF REASON", img: gun1 },
  { name: "STATIC-HV CORE OF FIRE", img: gun2 },
  { name: "ISO HEMLOCK CORE OF THUNDER", img: gun3 },
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
  const { date } = now ? formatManila(new Date(now)) : { date: "—" };
  return (
    <div className="text-center font-mono" aria-label="Current Philippine date">
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
        EVENT ENDS · DEC 10, 2026 · 8:00 AM PHT
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

function SigilCalc({ onWarningChange }: { onWarningChange: (visible: boolean) => void }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<ReturnType<typeof calcSigils> | null>(null);
  const [booster, setBooster] = useState(false);
  const [taskPlan, setTaskPlan] = useState<TaskPlan>();
  const calculate = (withBooster = booster, withPlan = taskPlan, quiet = false) => {
    const p = parseSigils(raw);
    if ("error" in p) {
      if (quiet) return;
      setError(p.error);
      setRes(null);
      return;
    }
    if (!Number.isSafeInteger(p.value + (withBooster ? BOOSTER_SIGILS : 0))) {
      setError("That number is too large.");
      setRes(null);
      onWarningChange(false);
      return;
    }
    setError(null);
    const result = calcSigils(p.value, Date.now(), undefined, withBooster, withPlan);
    setRes(result);
    onWarningChange(result.status === "NOT ON TRACK");
  };
  const rows = res
    ? ([
        ["AVAILABLE SIGILS PER WEEK", `${WEEKLY_SIGILS} / week`],
      ] as const)
    : [];
  return (
    <section className="mx-auto max-w-md text-center">
      <h2 aria-live="polite" className={`font-mono text-sm font-bold ${res ? (res.status === "NOT ON TRACK" ? "text-destructive" : "text-live") : "text-muted-foreground"}`}>
        EVENT STATUS: {res ? STATUS_LABEL[res.status] : "—"}
      </h2>
      <p
        aria-live="polite"
        className={`mt-1 font-mono text-xs font-bold sm:text-sm ${
          res ? (res.status === "NOT ON TRACK" ? "text-destructive" : "text-live") : "text-muted-foreground"
        }`}
      >
        SIGILS MO SA DEC 10: {res ? res.deadlineProjection : "—"}
      </p>
      {res?.status === "ON TRACK" && (
        <p className="mt-1 font-mono text-xs font-bold uppercase text-live sm:text-sm" aria-live="polite">
          {acquisitionPhrase(res.projectedAtMs)}
        </p>
      )}
      <div className="mt-4 flex items-center justify-center gap-1 font-mono text-xs font-bold text-foreground">
        <Checkbox
          id="sigil-booster"
          checked={booster}
          onCheckedChange={(checked) => {
            const enabled = checked === true;
            setBooster(enabled);
            if (res) calculate(enabled);
          }}
        />
        <label htmlFor="sigil-booster" className="cursor-pointer">50 SIGIL BOOSTER</label>
        <BoosterHelp />
      </div>
      <SigilTasks plan={taskPlan} onChange={(plan) => {
        setTaskPlan(plan);
        calculate(booster, plan, true);
      }} />
      <label className="mt-3 block font-mono text-xs tracking-[0.2em] text-muted-foreground" htmlFor="sigils">
        CURRENT SIGILS
      </label>
      <input
        id="sigils"
        inputMode="numeric"
        placeholder="Type mo dito Sigils mo"
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setRes(null);
          setError(null);
          onWarningChange(false);
        }}
        onKeyDown={(e) => e.key === "Enter" && calculate()}
        className="mt-1 w-full border-0 border-b border-border bg-transparent py-1 text-center font-mono text-3xl text-foreground outline-none placeholder:text-xl placeholder:text-muted-foreground focus:border-primary"
      />
      <Button
        onClick={() => calculate()}
        className="calculate-btn mt-3 h-auto w-full rounded-full bg-primary py-2 font-mono font-bold tracking-[0.3em] text-primary-foreground hover:opacity-90"
      >
        CALCULATE
      </Button>
      {error && <p className="mt-4 font-mono text-sm text-destructive">{error}</p>}
      {res && (
        <div className="mt-3">
          <p className={`font-mono text-xl font-bold sm:text-2xl ${res.status === "NOT ON TRACK" ? "text-destructive" : "text-live"}`}>
            {res.status === "MYTHIC UNLOCKED"
              ? "MYTHIC UNLOCKED"
              : res.status === "NOT ON TRACK"
                ? `${res.deadlineProjection} lang ang aabutin ng sigil mo sa Deadline`
                : `${res.weeksRequired} WEEK${res.weeksRequired === 1 ? "" : "S"} LEFT TO GRIND`}
          </p>
          <div role="progressbar" aria-label="Sigil progress" aria-valuemin={0} aria-valuemax={TARGET_SIGILS} aria-valuenow={Math.min(res.current, TARGET_SIGILS)} className="mx-auto mt-2 h-1 w-full bg-muted">
            <div className="h-1 bg-primary" style={{ width: `${Math.min(100, (res.current / TARGET_SIGILS) * 100)}%` }} />
          </div>
          <dl className="mt-3 space-y-1 font-mono text-xs sm:text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}

export function Index() {
  const [rotation, setRotation] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const n = WEAPONS.length;
  const sel = ((rotation % n) + n) % n;
  const w = WEAPONS[sel];
  if (!w) return null;
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-4">
      <header className="flex flex-col items-center gap-3">
        <PhClock />
        <Countdown />
      </header>

      <section className="mt-4 text-center">
        <h1 className="text-xl font-bold text-foreground sm:text-3xl" aria-live="polite">{w.name}</h1>
        <div className="weapon-carousel mt-2" aria-label="Featured weapons">
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
          {showWarning && (
            <p role="alert" className="carousel-warning pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 text-center text-3xl font-black leading-tight text-destructive sm:text-5xl">
              Sorry par, di ka aabot
            </p>
          )}
        </div>
      </section>

      <div className="mt-4">
        <SigilCalc onWarningChange={setShowWarning} />
      </div>

      <footer className="mt-6 pt-1 pb-1 text-center font-mono text-xs tracking-[0.2em] text-muted-foreground">
        VYNESHINDEN/TIMOTHY LOMIBAO
      </footer>
    </main>
  );
}
