import { cache } from "react";
import { db } from "@/lib/db";

export type CompanySettings = {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
};

const fallback: CompanySettings = {
  name: "suppIT.me",
  email: "kontakt@suppit.me",
  phone: "+48 000 000 000",
  address: "",
  currency: "PLN",
};

/** Dane firmy z tabeli Setting (edytowalne w panelu → Ustawienia). */
export const getCompanySettings = cache(async (): Promise<CompanySettings> => {
  try {
    const rows = await db.setting.findMany({ where: { key: { startsWith: "company." } } });
    const map = Object.fromEntries(rows.map((r) => [r.key.replace("company.", ""), r.value]));
    return { ...fallback, ...(map as Partial<CompanySettings>) };
  } catch {
    return fallback;
  }
});
