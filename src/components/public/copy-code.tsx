"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";

export function CopyCode({ code }: { code: string }) {
  const t = useTranslations("PromotionsPage");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* schowek niedostępny */
        }
      }}
      className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/60 bg-accent px-3 py-1.5 font-mono font-semibold text-accent-foreground hover:bg-accent/70"
      aria-label={`${t("copy")} ${code}`}
    >
      {code}
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span className="sr-only" aria-live="polite">{copied ? t("copied") : ""}</span>
    </button>
  );
}
