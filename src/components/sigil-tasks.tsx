import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { remainingTaskWeeks, SIGIL_TASKS, taskReward, taskWeekLabel, type TaskPlan } from "@/lib/sigil-tasks";

export function SigilTasks({ plan, onChange }: { plan: TaskPlan | undefined; onChange: (plan: TaskPlan) => void }) {
  const [open, setOpen] = useState(false);
  const [week, setWeek] = useState(0);
  const [furthestWeek, setFurthestWeek] = useState(0);
  const selections = plan?.selections ?? [];
  const selected = selections[week] ?? [];
  const total = selections.reduce((sum, selection) => sum + taskReward(selection), 0);
  const finalWeek = week === selections.length - 1;

  function openTasks() {
    if (!plan) {
      const startsAtMs = Date.now();
      onChange({ startsAtMs, selections: Array.from({ length: remainingTaskWeeks(startsAtMs) }, () => []) });
    }
    setWeek(0);
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openTasks} className="mt-2 h-8 w-full gap-2 font-mono text-xs font-bold">
        <ListChecks className="size-4" /> SIGIL TASKS
        {plan && <span className="ml-auto tabular-nums">+{total}</span>}
      </Button>
      <Dialog.Root open={open} onOpenChange={(value) => { if (value) setOpen(true); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-border bg-background text-foreground"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
          >
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
              <Dialog.Title className="flex items-center gap-2 font-mono text-lg font-bold text-primary"><ListChecks className="size-5" /> SIGIL TASKS</Dialog.Title>
              <Dialog.Description className="sr-only">Weekly sigil task selections until December 10, 2026.</Dialog.Description>
              {plan && selections.length > 0 && <div className="mt-2 flex flex-wrap items-center justify-between gap-1 font-mono text-xs">
                <span className="font-bold">WEEK {week + 1} / {selections.length}</span>
                <span className="text-muted-foreground">{taskWeekLabel(plan.startsAtMs, week)} · PHT</span>
              </div>}
              {furthestWeek > 0 && <div className="mt-2 flex flex-wrap gap-1" aria-label="Answered weeks">
                {selections.slice(0, furthestWeek + 1).map((_, index) => <Button key={index} size="sm" variant={week === index ? "default" : "outline"} className="size-7 p-0 font-mono text-xs" aria-label={`Edit week ${index + 1}`} onClick={() => setWeek(index)}>{index + 1}</Button>)}
              </div>}
            </div>
            <div className="min-h-0 overflow-y-auto px-4 sm:px-6">
              {selections.length === 0 ? <p className="py-8 text-center font-mono text-sm">WALA NANG FULL WEEK BAGO ANG DEADLINE.</p> : <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead className="sticky top-0 z-10 bg-background font-mono text-[10px] text-muted-foreground"><tr><th className="py-2 font-normal">TASK</th><th className="py-2 text-right font-normal">SIGILS</th><th className="w-10"><span className="sr-only">Selected</span></th></tr></thead>
                <tbody>{SIGIL_TASKS.map((task, index) => <tr key={task.name} className="border-t border-border">
                  <td className="py-2.5 pr-2"><label htmlFor={`task-${index}`} className="cursor-pointer leading-snug">{task.name}</label></td>
                  <td className="pr-2 text-right font-mono font-bold tabular-nums text-primary">{task.sigils}</td>
                  <td className="text-right"><Checkbox id={`task-${index}`} checked={selected.includes(index)} onCheckedChange={(checked) => {
                    if (!plan) return;
                    const next = checked === true ? [...selected, index] : selected.filter((value) => value !== index);
                    onChange({ ...plan, selections: selections.map((value, i) => i === week ? next : value) });
                  }} /></td>
                </tr>)}</tbody>
              </table>}
            </div>
            <div className="shrink-0 border-t border-border px-4 py-3 sm:px-6">
              <div className="mb-3 flex justify-between gap-2 font-mono text-xs"><span>THIS WEEK <strong className="text-primary">+{taskReward(selected)}</strong></span><span>TOTAL <strong className="text-primary">+{total}</strong></span></div>
              <div className="flex gap-2">
                {week > 0 && <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setWeek((value) => value - 1)}><ArrowLeft className="size-4" /></Button>}
                <Button className="flex-1 font-mono font-bold" onClick={() => {
                  if (finalWeek || selections.length === 0) setOpen(false);
                  else { setWeek((value) => value + 1); setFurthestWeek((value) => Math.max(value, week + 1)); }
                }}>{finalWeek || selections.length === 0 ? "OKAY" : "NEXT"}</Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}