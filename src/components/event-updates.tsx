import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import loginEvent from "@/assets/login-event.webp";

export function EventUpdates({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Dialog.Root open={open}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md" />
      <Dialog.Content
        className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background p-5 text-center text-foreground sm:p-6"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <Dialog.Title className="text-xl font-bold text-primary">PAG BABAGO</Dialog.Title>
        <Dialog.Description asChild>
          <div className="mt-4 space-y-4 text-sm leading-relaxed">
            <p>Honkai play matches task ay wala na</p>
            <p>Bagong login event para sa free 70 sigils, check nyo lang sa special events and login lang kayo araw araw : &gt;</p>
          </div>
        </Dialog.Description>
        <img src={loginEvent} alt="Mythic Boost daily login sigil rewards in Special Events" className="mt-4 h-auto w-full rounded" />
        <Button onClick={onClose} className="mt-5 w-full font-bold">OKAY</Button>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}