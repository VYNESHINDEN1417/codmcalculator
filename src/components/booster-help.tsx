import * as Dialog from "@radix-ui/react-dialog";
import { CircleHelp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import mythicBoost from "@/assets/mythic-boost.jpg";
import loginEvent from "@/assets/login-event.webp";

export function BoosterHelp({ newBooster = false, disabled = false }: { newBooster?: boolean; disabled?: boolean }) {
  const label = newBooster ? "70 free sigils info" : "Saan ito makikita sa game?";
  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <Button variant="ghost" size="icon" disabled={disabled} aria-label={label} title={label} className={`size-8 shrink-0 ${disabled ? "text-muted-foreground" : "text-primary"}`}><CircleHelp /></Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-background p-5 text-foreground">
        <Dialog.Title className="pr-8 text-sm font-bold text-primary">SAAN ITO MA KIKITA SA GAME?</Dialog.Title>
        <Dialog.Description asChild><div className="mt-4 space-y-4 text-sm leading-relaxed">
          {newBooster ? <p className="break-words text-foreground">Lobby/events/special events/70 free sigils</p> : <>
            <p className="text-foreground">Sa lower left side sa homescreen, click mo EVENTS, then events ulit, and lastly SPECIAL EVENTS.</p>
            <p>Hanapin mo lang dyan itong picture</p>
          </>}
        </div></Dialog.Description>
        <img src={newBooster ? loginEvent : mythicBoost} alt={newBooster ? "70 free sigils login event sa Special Events" : "Mythic Boost sa Special Events"} className="mt-4 w-full rounded" />
        <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close help" className="absolute right-2 top-2"><X /></Button></Dialog.Close>
        <Dialog.Close asChild><Button className="mt-5 w-full">OKAY</Button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
