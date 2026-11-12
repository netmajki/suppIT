/**
 * Normalizuje numer telefonu do formatu E.164 (+48123456789).
 * Numer 9-cyfrowy bez prefiksu traktowany jest jako polski.
 * Zwraca null, jeśli numer jest nieprawidłowy.
 */
export function normalizePhone(raw: string | null | undefined, defaultCountryCode = "48"): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[\s\-().]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    if (/^\d{9}$/.test(s)) s = `+${defaultCountryCode}${s}`;
    else s = `+${s}`;
  }
  return /^\+\d{8,15}$/.test(s) ? s : null;
}

/** Link wa.me do rozmowy WhatsApp. */
export const whatsappLink = (e164: string) => `https://wa.me/${e164.replace(/^\+/, "")}`;
