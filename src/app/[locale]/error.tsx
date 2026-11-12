"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Strona błędu (bez tłumaczeń — działa także, gdy zawiedzie ładowanie komunikatów)
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="grid min-h-[60dvh] place-items-center p-6 text-center">
      <div className="space-y-4">
        <h2>Ups…</h2>
        <p className="text-muted-foreground">Es ist ein Fehler aufgetreten. / Wystąpił błąd. / Something went wrong.</p>
        {error.digest && <p className="font-mono text-xs text-muted-foreground">{error.digest}</p>}
        <Button onClick={reset}>↻</Button>
      </div>
    </main>
  );
}
