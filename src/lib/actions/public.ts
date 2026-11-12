"use server";

import { z } from "zod";
import { after } from "next/server";
import type { Locale } from "@prisma/client";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { formatOrderNumber } from "@/lib/order-meta";
import { normalizePhone } from "@/lib/phone";
import { describeDiscount, findValidPromo } from "@/lib/promo";
import { isRateLimited } from "@/lib/rate-limit";
import { getCompanySettings } from "@/lib/settings";
import { checkbox, optStr } from "@/lib/zod-helpers";
import { sendAdminEmail, sendRepairConfirmation } from "@/lib/notifications/direct";

const localeSchema = z.enum(["pl", "de", "en"]).catch("pl");
const consent = z.preprocess((v) => v === "on", z.literal(true, { error: "consentRequired" }));
const requiredPhone = z
  .string({ error: "required" })
  .trim()
  .min(1, "required")
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: "custom", message: "invalidPhone" });
      return z.NEVER;
    }
    return n;
  });

const repairSchema = z.object({
  name: z.string({ error: "required" }).trim().min(2, "required").max(200),
  email: z.string({ error: "required" }).trim().toLowerCase().min(1, "required").email("invalidEmail").max(200),
  phone: requiredPhone,
  whatsappOptIn: checkbox,
  type: z.enum(["SERVICE", "PURCHASE", "WEBSITE"]).catch("SERVICE"),
  deviceType: optStr(100),
  deviceBrand: optStr(100),
  deviceModel: optStr(100),
  description: z.string({ error: "required" }).trim().min(5, "required").max(5000),
  promoCode: optStr(50),
  consent,
  locale: localeSchema,
});

/** Pole-pułapka dla botów: prawdziwy użytkownik go nie widzi i nie wypełnia. */
const isBot = (values: Record<string, string>) => !!values.website;

export async function submitRepairRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  if (isBot(values)) return { ok: true, message: "#00000" };
  if (await isRateLimited("repair", 5)) return { message: "tooMany", values };

  const parsed = repairSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;

  try {
    let promo = null;
    if (d.promoCode) {
      promo = await findValidPromo(d.promoCode);
      if (!promo) return { errors: { promoCode: "invalidPromo" }, values };
    }

    // Dopasowanie istniejącego klienta po e-mailu lub telefonie
    let client = await db.client.findFirst({
      where: { OR: [{ email: { equals: d.email, mode: "insensitive" } }, { phone: d.phone }, { whatsapp: d.phone }] },
      orderBy: { createdAt: "asc" },
    });
    if (!client) {
      client = await db.client.create({
        data: {
          name: d.name,
          email: d.email,
          phone: d.phone,
          whatsapp: d.whatsappOptIn ? d.phone : null,
          notifyEmail: true,
          notifyWhatsapp: d.whatsappOptIn,
          locale: d.locale as Locale,
        },
      });
    } else if (d.whatsappOptIn && !client.notifyWhatsapp) {
      client = await db.client.update({
        where: { id: client.id },
        data: { notifyWhatsapp: true, whatsapp: client.whatsapp ?? d.phone, email: client.email ?? d.email },
      });
    }

    const typeLabel = { SERVICE: "Serwis", PURCHASE: "Zakup", WEBSITE: "WWW" }[d.type];
    const device = [d.deviceType, d.deviceBrand, d.deviceModel].filter(Boolean).join(" ");
    const order = await db.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          clientId: client.id,
          type: d.type,
          source: "PUBLIC_FORM",
          title: (device || d.description).slice(0, 120),
          description: d.description,
          deviceType: d.deviceType ?? null,
          deviceBrand: d.deviceBrand ?? null,
          deviceModel: d.deviceModel ?? null,
          promoCode: promo?.code ?? null,
          statusHistory: { create: { toStatus: "NEW", visibleToClient: true } },
        },
      });
      if (promo) await tx.promotion.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
      return o;
    });

    const number = formatOrderNumber(order.number);
    const appUrl = (process.env.APP_URL ?? "").replace(/\/$/, "");
    after(async () => {
      await sendRepairConfirmation({ orderId: order.id, email: d.email, name: d.name, number, locale: d.locale as Locale });
      await sendAdminEmail(
        `Nowe zgłoszenie ${number} (${typeLabel}) — ${d.name}`,
        [
          `Klient: ${d.name}`,
          `E-mail: ${d.email}`,
          `Telefon: ${d.phone}${d.whatsappOptIn ? " (WhatsApp ✓)" : ""}`,
          device ? `Urządzenie: ${device}` : null,
          promo ? `Kod rabatowy: ${promo.code}` : null,
          "",
          d.description,
          "",
          `${appUrl}/pl/admin/orders/${order.id}`,
        ]
          .filter((l) => l !== null)
          .join("\n"),
        d.email,
      );
    });

    const company = await getCompanySettings();
    return {
      ok: true,
      message: number,
      values: promo ? { promo: describeDiscount(promo, d.locale, company.currency) } : undefined,
    };
  } catch (e) {
    console.error(e);
    return { message: "generic", values };
  }
}

const contactSchema = z.object({
  name: z.string({ error: "required" }).trim().min(2, "required").max(200),
  email: z.string({ error: "required" }).trim().toLowerCase().min(1, "required").email("invalidEmail").max(200),
  phone: optStr(50),
  message: z.string({ error: "required" }).trim().min(5, "required").max(5000),
  consent,
});

export async function submitContactMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  if (isBot(values)) return { ok: true };
  if (await isRateLimited("contact", 5)) return { message: "tooMany", values };
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return { errors: zodErrors(parsed.error), values };
  const d = parsed.data;
  try {
    await db.contactMessage.create({ data: { name: d.name, email: d.email, phone: d.phone ?? null, message: d.message } });
    after(() =>
      sendAdminEmail(
        `Wiadomość z formularza — ${d.name}`,
        `Od: ${d.name} <${d.email}>${d.phone ? `\nTelefon: ${d.phone}` : ""}\n\n${d.message}`,
        d.email,
      ),
    );
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { message: "generic", values };
  }
}
