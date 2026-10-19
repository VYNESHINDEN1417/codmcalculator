import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import gun1 from "@/assets/gun1.png.asset.json";
import gun2 from "@/assets/gun2.png.asset.json";
import gun3 from "@/assets/gun3.png.asset.json";
import { countdownParts, formatManila } from "@/lib/ph-time";

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
  { name: "Azure Tempest", img: gun1.url, tag: "Lightning" },
  { name: "Inferno Fang", img: gun2.url, tag: "Fire" },
  { name: "Void Reaper", img: gun3.url, tag: "Void" },
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
    <div className="rounded-lg border border-border bg-card px-4 py-3 font-mono">
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
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
        EVENT ENDS · DEC 10, 2026 · 7:39 AM PHT
      </div>
      {c.ended && now ? (
        <div className="mt-2 font-mono text-2xl font-bold text-primary">EVENT ENDED</div>
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
  const [have, setHave] = useState(0);
  const [cost, setCost] = useState(60);
  const [target, setTarget] = useState(10);
  const need = Math.max(0, cost * target - have);
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-mono text-sm tracking-[0.2em] text-muted-foreground">SIGIL CALCULATOR</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Sigils owned", have, setHave],
            ["Sigils per draw", cost, setCost],
            ["Draws wanted", target, setTarget],
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="text-xs text-muted-foreground">
            {label}
            <input
              type="number"
              min={0}
              value={val}
              onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 font-mono text-foreground">
        Draws affordable now: <b className="text-primary">{cost ? Math.floor(have / cost) : 0}</b> · Sigils still needed:{" "}
        <b className="text-primary">{need}</b>
      </div>
    </section>
  );
}

function Index() {
  const [sel, setSel] = useState(0);
  const w = WEAPONS[sel];
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <h1 className="font-mono text-xl font-bold tracking-[0.3em] text-foreground">ARSENAL EVENT</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          <PhClock />
          <Countdown />
        </div>
      </header>

      <section className="mt-10 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-primary">FEATURED · {w.tag.toUpperCase()}</p>
        <h2 className="mt-2 text-4xl font-bold text-foreground">{w.name}</h2>
        <img src={w.img} alt={w.name} className="mx-auto mt-6 w-full max-w-3xl drop-shadow-[0_0_40px_var(--primary)]" />
        <div className="mt-6 flex justify-center gap-3">
          {WEAPONS.map((x, i) => (
            <button
              key={x.name}
              onClick={() => setSel(i)}
              className={`rounded-md border px-3 py-2 ${i === sel ? "border-primary" : "border-border"} bg-card`}
            >
              <img src={x.img} alt={x.name} className="h-10 w-24 object-contain" />
            </button>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <SigilCalc />
      </div>
    </main>
  );
}
