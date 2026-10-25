import * as Dialog from "@radix-ui/react-dialog";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SigilTaskHelp() {
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <Button variant="ghost" size="icon" aria-label="Para saan tong sigil tasks?" title="Para saan tong sigil tasks?" className="size-8 shrink-0 text-primary"><CircleHelp /></Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-5 text-foreground">
        <Dialog.Title className="pr-8 text-sm text-primary">PARA SAAN TONG SIGIL TASKS?</Dialog.Title>
        <Dialog.Description asChild><div className="mt-4 space-y-4 text-sm leading-relaxed">
          <p>-Para ma customized mo kung anong tasks lang talaga kaya mong gawin.</p>
          <p>Pwedeng hindi mo na to gawin, kahit type sigils ka na lang direkta, par</p>
        </div></Dialog.Description>
        <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close help" className="absolute right-2 top-2"><X /></Button></Dialog.Close>
        <Dialog.Close asChild><Button className="mt-5 w-full">OKAY</Button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}