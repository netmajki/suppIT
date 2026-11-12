"use server";

import { z } from "zod";
import type { Locale } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { formToObject, zodErrors, type FormState } from "@/lib/form";
import { ForbiddenError, requireStaff } from "@/lib/guards";
import { SLUG_RE, slugify } from "@/lib/slug";
import { checkbox, intField, optDate, optStr } from "@/lib/zod-helpers";

const LOCALES: Locale[] = ["pl", "de", "en"];

function fail(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ForbiddenError) return { message: "forbidden", values };
  console.error(e);
  return { message: "generic", values };
}

const revalidatePublic = () => revalidatePath("/[locale]", "layout");

// ───────────── Artykuły ─────────────

const articleBase = z.object({
  category: optStr(100),
  coverImage: z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().regex(/^(https?:\/\/|\/uploads\/)\S+$/, "invalidUrl").max(1000).optional()),
  published: checkbox,
});

type Tr = { locale: Locale; title: string; slug: string; excerpt: string | null; content: string };

function parseTranslations(values: Record<string, string>) {
  const errors: Record<string, string> = {};
  const list: Tr[] = [];
  for (const l of LOCALES) {
    const title = (values[`title_${l}`] ?? "").trim();
    const content = (values[`content_${l}`] ?? "").trim();
    const excerpt = (values[`excerpt_${l}`] ?? "").trim();
    let slug = (values[`slug_${l}`] ?? "").trim();
    if (!title && !content) continue;
    if (!title) errors[`title_${l}`] = "required";
    if (!content) errors[`content_${l}`] = "required";
    if (!slug) slug = slugify(title);
    if (slug && !SLUG_RE.test(slug)) errors[`slug_${l}`] = "invalidSlug";
    if (title.length > 200) errors[`title_${l}`] = "required";
    list.push({ locale: l, title, slug, excerpt: excerpt || null, content });
  }
  if (list.length === 0) errors._ = "translationRequired";
  return { list, errors };
}

async function slugConflicts(list: Tr[], articleId?: string) {
  const errors: Record<string, string> = {};
  for (const tr of list) {
    const other = await db.articleTranslation.findUnique({ where: { locale_slug: { locale: tr.locale, slug: tr.slug } } });
    if (other && other.articleId !== articleId) errors[`slug_${tr.locale}`] = "slugTaken";
  }
  return errors;
}

async function saveArticle(id: string | null, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const base = articleBase.safeParse(values);
    const { list, errors } = parseTranslations(values);
    const allErrors = { ...(base.success ? {} : zodErrors(base.error)), ...errors };
    if (Object.keys(allErrors).length) return { errors: allErrors, values, message: allErrors._ };
    const conflicts = await slugConflicts(list, id ?? undefined);
    if (Object.keys(conflicts).length) return { errors: conflicts, values };

    const b = base.data!;
    await db.$transaction(async (tx) => {
      const existing = id ? await tx.article.findUnique({ where: { id } }) : null;
      const data = {
        category: b.category ?? null,
        coverImage: b.coverImage ?? null,
        published: b.published,
        publishedAt: b.published ? (existing?.publishedAt ?? new Date()) : null,
      };
      const article = id ? await tx.article.update({ where: { id }, data }) : await tx.article.create({ data });
      for (const tr of list) {
        await tx.articleTranslation.upsert({
          where: { articleId_locale: { articleId: article.id, locale: tr.locale } },
          create: { ...tr, articleId: article.id },
          update: tr,
        });
      }
      await tx.articleTranslation.deleteMany({
        where: { articleId: article.id, locale: { notIn: list.map((t) => t.locale) } },
      });
    });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePublic();
  redirect({ href: "/admin/articles", locale: await getLocale() });
  return {};
}

export async function createArticle(_prev: FormState, fd: FormData) {
  return saveArticle(null, fd);
}
export async function updateArticle(id: string, _prev: FormState, fd: FormData) {
  return saveArticle(id, fd);
}
export async function deleteArticle(id: string) {
  await requireStaff();
  await db.article.delete({ where: { id } });
  revalidatePublic();
  redirect({ href: "/admin/articles", locale: await getLocale() });
}

// ───────────── Promocje ─────────────

const promoSchema = z.object({
  code: z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim().toUpperCase()) : v),
    z.string().regex(/^[A-Z0-9_-]{3,40}$/, "invalidSlug").optional(),
  ),
  discountType: z.enum(["PERCENT", "FIXED"]),
  value: z.preprocess(
    (v) => (typeof v === "string" ? v.replace(",", ".").replace(/\s/g, "") : v),
    z.coerce.number({ error: "invalidNumber" }).positive("invalidNumber").max(1_000_000, "invalidNumber"),
  ),
  validFrom: optDate,
  validTo: optDate,
  active: checkbox,
  maxUses: z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.number({ error: "invalidNumber" }).int("invalidNumber").min(1, "invalidNumber").optional()),
});

async function savePromotion(id: string | null, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = promoSchema.safeParse(values);
    const errors: Record<string, string> = parsed.success ? {} : zodErrors(parsed.error);
    if (parsed.success && parsed.data.discountType === "PERCENT" && parsed.data.value > 100) errors.value = "invalidNumber";
    if (parsed.success && parsed.data.validFrom && parsed.data.validTo && parsed.data.validTo < parsed.data.validFrom) errors.validTo = "endBeforeStart";
    const trs = LOCALES.map((l) => ({
      locale: l,
      title: (values[`title_${l}`] ?? "").trim(),
      description: (values[`description_${l}`] ?? "").trim() || null,
    })).filter((t) => t.title);
    if (trs.length === 0) errors._ = "translationRequired";
    if (Object.keys(errors).length || !parsed.success) return { errors, values, message: errors._ };

    const d = parsed.data;
    if (d.code) {
      const other = await db.promotion.findUnique({ where: { code: d.code } });
      if (other && other.id !== id) return { errors: { code: "codeTaken" }, values };
    }
    // Data "do" z pola date → koniec dnia
    const validTo = d.validTo ? new Date(d.validTo.getFullYear(), d.validTo.getMonth(), d.validTo.getDate(), 23, 59, 59) : null;
    const data = {
      code: d.code ?? null,
      discountType: d.discountType,
      value: d.value,
      validFrom: d.validFrom ?? null,
      validTo,
      active: d.active,
      maxUses: d.maxUses ?? null,
    };
    await db.$transaction(async (tx) => {
      const promo = id ? await tx.promotion.update({ where: { id }, data }) : await tx.promotion.create({ data });
      for (const tr of trs) {
        await tx.promotionTranslation.upsert({
          where: { promotionId_locale: { promotionId: promo.id, locale: tr.locale } },
          create: { ...tr, promotionId: promo.id },
          update: tr,
        });
      }
      await tx.promotionTranslation.deleteMany({ where: { promotionId: promo.id, locale: { notIn: trs.map((t) => t.locale) } } });
    });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePublic();
  redirect({ href: "/admin/promotions", locale: await getLocale() });
  return {};
}

export async function createPromotion(_prev: FormState, fd: FormData) {
  return savePromotion(null, fd);
}
export async function updatePromotion(id: string, _prev: FormState, fd: FormData) {
  return savePromotion(id, fd);
}
export async function deletePromotion(id: string) {
  await requireStaff();
  await db.promotion.delete({ where: { id } });
  revalidatePublic();
  redirect({ href: "/admin/promotions", locale: await getLocale() });
}

// ───────────── Partnerzy ─────────────

const urlOpt = z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().url("invalidUrl").max(1000).optional());
const imageUrlOpt = z.preprocess((v) => (v === "" ? undefined : v), z.string().trim().regex(/^(https?:\/\/|\/uploads\/)\S+$/, "invalidUrl").max(1000).optional());
const partnerSchema = z.object({
  name: z.string({ error: "required" }).trim().min(1, "required").max(200),
  url: urlOpt,
  logoUrl: imageUrlOpt,
  sortOrder: intField(0),
  active: checkbox,
});

async function savePartner(id: string | null, fd: FormData): Promise<FormState> {
  const values = formToObject(fd);
  try {
    await requireStaff();
    const parsed = partnerSchema.safeParse(values);
    if (!parsed.success) return { errors: zodErrors(parsed.error), values };
    const d = parsed.data;
    const data = { name: d.name, url: d.url ?? null, logoUrl: d.logoUrl ?? null, sortOrder: d.sortOrder, active: d.active };
    if (id) await db.partner.update({ where: { id }, data });
    else await db.partner.create({ data });
  } catch (e) {
    return fail(e, values);
  }
  revalidatePublic();
  redirect({ href: "/admin/partners", locale: await getLocale() });
  return {};
}

export async function createPartner(_prev: FormState, fd: FormData) {
  return savePartner(null, fd);
}
export async function updatePartner(id: string, _prev: FormState, fd: FormData) {
  return savePartner(id, fd);
}
export async function deletePartner(id: string) {
  await requireStaff();
  await db.partner.delete({ where: { id } });
  revalidatePublic();
  redirect({ href: "/admin/partners", locale: await getLocale() });
}

// ───────────── Wiadomości kontaktowe ─────────────

export async function setMessageHandled(id: string, handled: boolean) {
  await requireStaff();
  await db.contactMessage.update({ where: { id }, data: { handled } });
  revalidatePath("/[locale]/admin/messages", "page");
}

export async function deleteMessage(id: string) {
  await requireStaff();
  await db.contactMessage.delete({ where: { id } });
  revalidatePath("/[locale]/admin/messages", "page");
}
