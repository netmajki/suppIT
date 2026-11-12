"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Komunikat ogólny formularza (kod błędu z Errors.* lub sukces z podanej przestrzeni). */
export function FormAlert({ code, ok, ns = "Errors" }: { code?: string; ok?: boolean; ns?: string }) {
  const t = useTranslations();
  if (!code) return null;
  const key = `${ok ? ns : "Errors"}.${code}`;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {t.has(key) ? t(key) : code}
    </p>
  );
}
