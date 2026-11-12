/**
 * Normalizuje numer telefonu do formatu E.164 (+491511234567).
 * - "+49 151 …", "0049 151 …" → międzynarodowy
 * - "0151 …" (format krajowy z zerem) → kierunkowy domyślny (z ustawień, domyślnie 49 = Niemcy)
 * Numer bez prefiksu i bez wiodącego zera jest odrzucany (niejednoznaczny).
 * Zwraca null, jeśli numer jest nieprawidłowy.
 */
export function normalizePhone(raw: string | null | undefined, defaultCountryCode = "49"): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[\s\-().\/]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  else if (s.startsWith("0")) s = `+${defaultCountryCode}${s.slice(1)}`;
  if (!s.startsWith("+")) return null;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
}

/** Link wa.me do rozmowy WhatsApp. */
export const whatsappLink = (e164: string) => `https://wa.me/${e164.replace(/^\+/, "")}`;
