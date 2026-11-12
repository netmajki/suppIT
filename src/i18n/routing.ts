import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "de", "en"],
  defaultLocale: "pl",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];
