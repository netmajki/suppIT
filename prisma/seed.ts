import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "kontakt@suppit.me";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("Ustaw SEED_ADMIN_PASSWORD w .env");

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Administrator",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  // Domyślne ustawienia firmy (edytowalne później w panelu → Ustawienia)
  const defaults: Record<string, unknown> = {
    "company.name": "suppIT.me",
    "company.email": "kontakt@suppit.me",
    "company.phone": "+48 000 000 000",
    "company.address": "",
    "company.currency": "PLN",
    "whatsapp.provider": "meta",
    "theme.default": "system",
  };
  for (const [key, value] of Object.entries(defaults)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }

  console.log(`Seed OK — admin: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
