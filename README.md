# suppIT.me

Serwis i wsparcie IT — strona publiczna, panel admina i panel klienta.

**Stack:** Next.js 15 (App Router) + TypeScript · Tailwind CSS 4 + komponenty w stylu shadcn/ui · next-intl (PL/DE/EN) · PostgreSQL + Prisma 6 · Auth.js v5 (role: admin, pracownik, klient) · Docker Compose + Caddy.

## Status etapów

| Etap | Zakres | Status |
|---|---|---|
| 1 | Szkielet, baza, logowanie, języki | ✅ |
| 2 | Klienci i zlecenia, statusy, powiadomienia | ✅ |
| 3 | Kalendarz, magazyn, zamówienia części | ✅ |
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

## Kalendarz, magazyn, części

- **Kalendarz** (`/admin/calendar`, FullCalendar): pokazuje terminy wizyt (`scheduledAt`) i terminy zakończenia (`dueAt`) zleceń prosto z tabeli `Order` oraz własne wydarzenia (`CalendarEvent`, opcjonalnie powiązane ze zleceniem). Przeciągnięcie terminu zlecenia zmienia datę w zleceniu. Dane: `GET /api/calendar?start&end[&mine=1]`.
- **Magazyn** (`/admin/inventory`): zakładki „Stan firmy” (ilość, stan minimalny, ceny, wartość magazynu, alert niskiego stanu) i „Sprzęt klienta” (powiązany z klientem i zleceniem). Szybka korekta ilości ±1.
- **Zamówienia części** (`/admin/part-orders`): statusy Do zamówienia → Zamówione → W drodze → Odebrane / Anulowane, dostawca, link, nr przesyłki, przewidywana dostawa (opóźnione na czerwono). Odebranie części dodaje ją do stanu firmy (powiązaną ze zleceniem).

## Powiadomienia

Po zmianie statusu zlecenia klient dostaje powiadomienie kanałami włączonymi w jego kartotece (e-mail i/lub WhatsApp), w swoim języku. Każda próba trafia do historii na stronie zlecenia (wysłano / błąd + powód).

- **E-mail:** SMTP (`SMTP_*`) lub Resend (`RESEND_API_KEY`), nadawca `EMAIL_FROM`.
- **WhatsApp — Meta Cloud API (domyślnie):** `META_WA_PHONE_NUMBER_ID`, `META_WA_ACCESS_TOKEN`. Wiadomości wysyłane z inicjatywy firmy poza 24-h oknem rozmowy wymagają **zatwierdzonego szablonu** w Meta Business — ustaw `META_WA_TEMPLATE_NAME`. Szablon powinien mieć 4 parametry treści: `{{1}}` klient, `{{2}}` nr zlecenia, `{{3}}` status, `{{4}}` uwagi, i istnieć w językach `pl`, `de`, `en`.
- **WhatsApp — Twilio:** `WHATSAPP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (+ opcjonalnie `TWILIO_CONTENT_SID` dla szablonu).
- Treści domyślne: `src/lib/notifications/templates.ts`. Własne szablony per status/kanał/język można zapisać w tabeli `NotificationTemplate` (edytor w Ustawieniach — etap 5).

Konfiguracja jest czytana najpierw z tabeli `Setting`, potem ze zmiennych środowiskowych.

## Wdrożenie (VPS)

```bash
cp .env.example .env   # ustaw DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET, SEED_ADMIN_PASSWORD
docker compose up -d --build
```

Serwis `migrate` wykonuje migracje i seed, `caddy` wystawia HTTPS (Let's Encrypt) dla `DOMAIN`.
