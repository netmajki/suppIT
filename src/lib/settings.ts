import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { SETTINGS, type SettingDef, type SettingKey } from "@/lib/settings-registry";

/** Wszystkie ustawienia (wartości z bazy lub domyślne). Sekrety są odszyfrowane — nie wysyłaj ich do przeglądarki. */
export const getAllSettings = cache(async (): Promise<Record<SettingKey, string>> => {
  const out = Object.fromEntries(Object.entries(SETTINGS).map(([k, d]) => [k, d.default])) as Record<SettingKey, string>;
  try {
    const rows = await db.setting.findMany();
    for (const r of rows) {
      if (!(r.key in SETTINGS)) continue;
      const raw = typeof r.value === "string" ? r.value : r.value === null ? "" : String(r.value);
      out[r.key as SettingKey] = (SETTINGS[r.key as SettingKey] as SettingDef).secret ? decryptSecret(raw) : raw;
    }
  } catch {
    /* baza niedostępna (np. podczas budowania) — wartości domyślne */
  }
  return out;
});

export async function getSetting(key: SettingKey) {
  return (await getAllSettings())[key];
}

export type CompanySettings = {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  phoneCountryCode: string;
  logoUrl: string;
};

/** Dane firmy (edytowalne w panelu → Ustawienia). */
export const getCompanySettings = cache(async (): Promise<CompanySettings> => {
  const s = await getAllSettings();
  return {
    name: s["company.name"] || "suppIT.me",
    email: s["company.email"],
    phone: s["company.phone"],
    address: s["company.address"],
    currency: s["company.currency"] || "EUR",
    phoneCountryCode: s["company.phoneCountryCode"] || "49",
    logoUrl: s["company.logoUrl"],
  };
});
