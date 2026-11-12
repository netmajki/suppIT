import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Poppins } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/theme-provider";
import "../globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin", "latin-ext"], weight: ["500", "700"], variable: "--font-poppins" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: { default: t("title"), template: "%s · suppIT.me" },
    description: t("description"),
    icons: { icon: "/brand/suppit-icon.png", apple: "/brand/suppit-icon.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
