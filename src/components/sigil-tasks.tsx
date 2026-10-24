import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, Copy, ClipboardPaste, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { remainingTaskWeeks, SIGIL_TASKS, taskReward, type TaskPlan } from "@/lib/sigil-tasks";

export const TASK_INTRO_WAIT_SECONDS = 20;

export function SigilTasks({ plan, onChange }: { plan: TaskPlan | undefined; onChange: (plan: TaskPlan) => void }) {
  const [open, setOpen] = useState(false);
  const [intro, setIntro] = useState(true);
  const [remaining, setRemaining] = useState(TASK_INTRO_WAIT_SECONDS);
  const [copied, setCopied] = useState<{ week: number; selection: number[] } | null>(null);
  const [week, setWeek] = useState(0);
  const [furthestWeek, setFurthestWeek] = useState(0);
  const selections = plan?.selections ?? [];
  const selected = selections[week] ?? [];
  const total = selections.reduce((sum, selection) => sum + taskReward(selection), 0);
  const finalWeek = week === selections.length - 1;

  useEffect(() => {
    if (!open || !intro) return;
    const readyAt = Date.now() + TASK_INTRO_WAIT_SECONDS * 1000;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, [open, intro]);

  function openTasks() {
    if (!plan) {
      const startsAtMs = Date.now();
      onChange({ startsAtMs, selections: Array.from({ length: remainingTaskWeeks(startsAtMs) }, () => []) });
    }
    setWeek(0);
    setFurthestWeek(0);
    setIntro(true);
    setRemaining(TASK_INTRO_WAIT_SECONDS);
    setCopied(null);
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openTasks} className="mt-2 h-8 max-w-full gap-2 font-mono text-xs font-bold">
        <ListChecks className="size-4" /> SIGIL TASKS
        <span className="font-normal text-foreground">OPTIONAL LANG</span>
        {plan && <span className="ml-auto tabular-nums">+{total}</span>}
      </Button>
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground"
             onEscapeKeyDown={(event) => event.preventDefault()}
             onPointerDownOutside={(event) => event.preventDefault()}
             onInteractOutside={(event) => event.preventDefault()}
          >
            {intro ? <div className="overflow-y-auto p-5 font-mono sm:p-6">
              <Dialog.Title className="text-sm font-bold text-primary">SIGIL TASKS</Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-4 space-y-4 text-sm leading-relaxed">
                  <p>Dito mo pwede piliin ang mga tasks na kaya mong gawin, ang point nito is para ma calculate yung mismong mga tasks na ginagawa mo, mas accurate ang projection dahil mismong mga tasks na kaya mo lang gawin ang i ca-calculate.</p>
                  <p>Kasi kung type sigil ka lang tapos calculate, complete tasks ang projected sayo ng website. Check mo lang ang tasks na kaya mo gawin, par</p>
                  <p>Click mo copy paste para paste paste na lang sa ibang week.</p>
                </div>
              </Dialog.Description>
              <div className="mt-5 flex h-10 items-center justify-center">
                {remaining > 0 ? <p role="timer" className="text-xl font-bold tabular-nums text-primary">{remaining}s</p> : <Button className="w-full font-bold" onClick={() => setIntro(false)}>OKAY</Button>}
              </div>
            </div> : <>
            <div className="shrink-0 border-b border-border px-4 py-2 sm:px-6">
              <Dialog.Title className="font-mono text-sm font-bold text-primary">Check mo ang task na kaya mong gawin weekly, par</Dialog.Title>
              <Dialog.Description className="sr-only">Optional weekly sigil task selections until December 10, 2026.</Dialog.Description>
              {plan && selections.length > 0 && <div className="mt-1 font-mono text-xs">
                <span className="font-bold">WEEK {week + 1} / {selections.length}</span>
              </div>}
              {furthestWeek > 0 && <div className="mt-2 flex flex-wrap gap-1" aria-label="Answered weeks">
                {selections.slice(0, furthestWeek + 1).map((_, index) => <Button key={index} size="sm" variant={week === index ? "default" : "outline"} className="size-7 p-0 font-mono text-xs" aria-label={`Edit week ${index + 1}`} onClick={() => setWeek(index)}>{index + 1}</Button>)}
              </div>}
            </div>
            <div className="min-h-0 overflow-y-auto px-4 sm:px-6">
              {selections.length === 0 ? <p className="py-8 text-center font-mono text-sm">WALA NANG FULL WEEK BAGO ANG DEADLINE.</p> : <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10 bg-background font-mono text-[10px] text-muted-foreground"><tr><th className="py-1 font-normal">TASK</th><th className="py-1 text-right font-normal">SIGILS</th><th className="w-10"><span className="sr-only">Selected</span></th></tr></thead>
                <tbody>{SIGIL_TASKS.map((task, index) => <tr key={task.name} className="border-t border-border">
                  <td className="py-1.5 pr-2"><label htmlFor={`task-${index}`} className="cursor-pointer leading-tight">{task.name}</label></td>
                  <td className="pr-2 text-right font-mono font-bold tabular-nums text-primary">{task.sigils}</td>
                  <td className="text-right"><Checkbox id={`task-${index}`} checked={selected.includes(index)} onCheckedChange={(checked) => {
                    if (!plan) return;
                    const next = checked === true ? [...selected, index] : selected.filter((value) => value !== index);
                    onChange({ ...plan, selections: selections.map((value, i) => i === week ? next : value) });
                  }} /></td>
                </tr>)}</tbody>
              </table>}
            </div>
            <div className="shrink-0 border-t border-border px-4 py-2 sm:px-6">
              <div className="mb-2 flex justify-between gap-2 font-mono text-xs"><span>THIS WEEK <strong className="text-primary">+{taskReward(selected)}</strong></span><span>TOTAL <strong className="text-primary">+{total}</strong></span></div>
              <div className="flex gap-2">
                {week > 0 && <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setWeek((value) => value - 1)}><ArrowLeft className="size-4" /></Button>}
                 {selections.length > 0 && <Button variant="outline" className="w-28 shrink-0 gap-2 font-mono text-xs font-bold" onClick={() => {
                   if (copied && copied.week !== week) {
                     if (!plan) return;
                     onChange({ ...plan, selections: selections.map((value, i) => i === week ? [...copied.selection] : value) });
                   } else setCopied({ week, selection: [...selected] });
                 }}>
                   {copied && copied.week !== week ? <><ClipboardPaste className="size-4" /> PASTE</> : <><Copy className="size-4" /> COPY</>}
                 </Button>}
                 <Button className="min-w-0 flex-1 font-mono font-bold" onClick={() => {
                   if ((finalWeek && furthestWeek >= selections.length - 1) || selections.length === 0) setOpen(false);
                  else { setWeek((value) => value + 1); setFurthestWeek((value) => Math.max(value, week + 1)); }
                }}>{finalWeek || selections.length === 0 ? "OKAY" : "NEXT"}</Button>
              </div>
            </>}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}