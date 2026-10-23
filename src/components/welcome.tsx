import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import music from "@/assets/honkai-music.mp3";

const UID = "6957634743378640897";
export const WELCOME_WAIT_SECONDS = 5;

export function Welcome() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(WELCOME_WAIT_SECONDS);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [playError, setPlayError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setOpen(true);
    const readyAt = Date.now() + WELCOME_WAIT_SECONDS * 1000;
    const timer = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) clearInterval(timer);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  async function copyUid() {
    try {
      await navigator.clipboard.writeText(UID);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  function startMusic() {
    if (remaining > 0) return;
    const player = audio.current;
    if (!player) return;
    void player.play().then(() => {
      setPlayError(false);
      setOpen(false);
    }).catch(() => setPlayError(true));
  }

  return (
    <>
      <audio ref={audio} src={music} loop preload="auto" />
      <DialogPrimitive.Root open={open}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 text-center font-mono sm:p-8"
            onEscapeKeyDown={(event) => event.preventDefault()}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <DialogPrimitive.Title className="text-xl font-bold leading-snug sm:text-2xl">
              WELCOME SA WEBSITE KO, PARE
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">CODM at Facebook ni Timothy Lomibao</DialogPrimitive.Description>
            <Button variant="ghost" onClick={copyUid} className="mt-6 h-auto w-full flex-wrap gap-2 whitespace-normal px-0 py-2 text-sm font-bold text-foreground hover:bg-transparent hover:text-foreground">
              <span>CODM UID:</span>
              <span className="welcome-neon break-all text-live">{UID}</span>
              {copied ? <Check className="size-4 text-live" /> : <Copy className="size-4 text-live" />}
            </Button>
            {copied && <p role="status" className="text-xs text-live">UID COPIED</p>}
            {copyError && <p role="status" className="text-xs text-destructive">Hindi makopya. Subukan ulit.</p>}
            <p className="mt-4 text-sm font-bold">
              FB: <Button asChild variant="link" className="welcome-neon h-auto whitespace-normal p-0 text-sm font-bold text-live">
                <a href="https://www.facebook.com/share/1DqPN5cNxD/" target="_blank" rel="noopener noreferrer">TIMOHY JOSEPH LOMIBAO</a>
              </Button>
            </p>
            <div className="mt-8 flex min-h-11 items-center justify-center">
              {remaining > 0 ? (
                <p role="timer" className="text-2xl font-bold tabular-nums text-muted-foreground">{remaining}s</p>
              ) : (
                <Button onClick={startMusic} className="w-full font-bold">OKAY</Button>
              )}
            </div>
            {playError && <p role="alert" className="mt-3 text-xs text-destructive">Hindi tumugtog ang music. Pindutin ulit ang OKAY.</p>}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}