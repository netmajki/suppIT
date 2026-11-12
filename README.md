# suppIT.me

Serwis i wsparcie IT — strona publiczna, panel admina i panel klienta.

**Stack:** Next.js 15 (App Router) + TypeScript · Tailwind CSS 4 + komponenty w stylu shadcn/ui · next-intl (PL/DE/EN) · PostgreSQL + Prisma 6 · Auth.js v5 (role: admin, pracownik, klient) · Docker Compose + Caddy.

## Status etapów

| Etap | Zakres | Status |
|---|---|---|
| 1 | Szkielet, baza, logowanie, języki | ✅ |
| 2 | Klienci i zlecenia, statusy, powiadomienia | ⏳ |
| 3 | Kalendarz, magazyn, zamówienia części | ⏳ |
| 4 | Strona publiczna, artykuły, promocje | ⏳ |
| 5 | Ustawienia, panel klienta, szlify, wdrożenie | ⏳ |

Schemat bazy (`prisma/schema.prisma`) zawiera już modele dla wszystkich etapów.

## Uruchomienie lokalne

Wymagania: Node.js 22+, PostgreSQL 16 (lub Docker).

```bash
cp .env.example .env          # uzupełnij AUTH_SECRET i SEED_ADMIN_PASSWORD
docker compose -f docker-compose.dev.yml up -d   # baza (jeśli nie masz lokalnego Postgresa)
npm install
npm run db:migrate            # migracje
npm run db:seed               # konto admina + domyślne ustawienia
npm run dev                   # http://localhost:3000
```

Logowanie: `/pl/login` — dane admina z `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Struktura

```
messages/{pl,de,en}.json     tłumaczenia
prisma/                      schemat, migracje, seed
src/app/[locale]/(public)    strona publiczna
src/app/[locale]/login       logowanie
src/app/[locale]/admin       panel admina/pracownika (ADMIN, EMPLOYEE)
src/app/[locale]/panel       panel klienta (CLIENT)
src/auth.ts, auth.config.ts  Auth.js (Credentials + JWT, rola w sesji)
src/middleware.ts            języki + ochrona tras wg roli
src/lib/settings.ts          ustawienia firmy z bazy (tabela Setting)
```

## Branding

Kolory i typografia zdefiniowane jako tokeny w `src/app/globals.css` (niebieski `#1E63D6`, grafit `#3A4552`, szarości `#667180` / `#8792A2`; tryb ciemny — granatowe tło, jasnoszary tekst). Fonty: Poppins (nagłówki), Inter (tekst).
Pliki logo (`suppit-logo-horizontal.svg`, `suppit-icon.png`) wrzuć do `public/brand/` — do tego czasu `src/components/logo.tsx` renderuje znak słowny.

## Wdrożenie (VPS)

```bash
cp .env.example .env   # ustaw DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET, SEED_ADMIN_PASSWORD
docker compose up -d --build
```

Serwis `migrate` wykonuje migracje i seed, `caddy` wystawia HTTPS (Let's Encrypt) dla `DOMAIN`.
