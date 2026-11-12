"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "pl", label: "Polski" },
  { code: "de", label: "Deutsch" },
  { code: "en", label: "English" },
] as const;

/**
 * Zakładki wersji językowych. Wszystkie panele są w DOM (ukryte),
 * więc formularz wysyła pola wszystkich języków naraz.
 */
export function LocaleTabs({
  render,
  filled,
  errored,
}: {
  render: (locale: "pl" | "de" | "en") => React.ReactNode;
  filled: Record<string, boolean>;
  errored?: Record<string, boolean>;
}) {
  const [active, setActive] = useState<string>(LOCALES.find((l) => errored?.[l.code])?.code ?? "pl");
  return (
    <div>
      <div className="mb-4 flex gap-1 border-b" role="tablist">
        {LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="tab"
            aria-selected={active === l.code}
            onClick={() => setActive(l.code)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-semibold",
              active === l.code ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {l.label}
            <span
              className={cn("size-2 rounded-full", errored?.[l.code] ? "bg-destructive" : filled[l.code] ? "bg-emerald-500" : "bg-muted-foreground/30")}
            />
          </button>
        ))}
      </div>
      {LOCALES.map((l) => (
        <div key={l.code} hidden={active !== l.code} role="tabpanel">
          {render(l.code)}
        </div>
      ))}
    </div>
  );
}
