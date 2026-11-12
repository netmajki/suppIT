# suppIT.me

Serwis i wsparcie IT — strona publiczna, panel admina i panel klienta.

**Rynek:** głównie Niemcy (domyślny język DE, waluta EUR, telefony +49), wersja PL dla Polonii, EN dodatkowo.

**Stack:** Next.js 15 (App Router) + TypeScript · Tailwind CSS 4 + komponenty w stylu shadcn/ui · next-intl (PL/DE/EN) · PostgreSQL + Prisma 6 · Auth.js v5 (role: admin, pracownik, klient) · Docker Compose + Caddy.

## Status etapów

| Etap | Zakres | Status |
|---|---|---|
| 1 | Szkielet, baza, logowanie, języki | ✅ |
| 2 | Klienci i zlecenia, statusy, powiadomienia | ✅ |
| 3 | Kalendarz, magazyn, zamówienia części | ✅ |
| 4 | Strona publiczna, artykuły, promocje | ✅ |
| 5 | Ustawienia, panel klienta, szlify, wdrożenie | ✅ |

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

## Strona publiczna

Podstrony (każda w `/pl`, `/de`, `/en`): `/` start, `/services`, `/about`, `/repair` (formularz zgłoszenia), `/contact`, `/articles` + `/articles/[slug]` (baza wiedzy), `/partners`, `/promotions`.

- **Zgłoszenie naprawy** tworzy zlecenie (źródło „Formularz WWW”, znacznik WWW na liście) i dopasowuje istniejącego klienta po e-mailu lub telefonie albo zakłada nowego. Klient dostaje e-mail z numerem zgłoszenia, firma — powiadomienie na adres z ustawień. Kod rabatowy jest sprawdzany (aktywny, w terminie, limit użyć) i zliczany.
- **Kontakt**: wiadomości trafiają do panelu (`/admin/messages`, licznik nieobsłużonych w menu) i na e-mail firmy.
- Ochrona formularzy: pole-pułapka dla botów + limit 5 zgłoszeń / 10 min z jednego IP.
- **Artykuły** (Markdown, osobna treść i adres dla każdego języka), **promocje** (kod, % lub kwota, daty, limit użyć, treść w 3 językach — brak tłumaczenia → wersja PL), **partnerzy** (logo, link, kolejność) — zarządzane w panelu admina.

## Powiadomienia

Po zmianie statusu zlecenia klient dostaje powiadomienie kanałami włączonymi w jego kartotece (e-mail i/lub WhatsApp), w swoim języku. Każda próba trafia do historii na stronie zlecenia (wysłano / błąd + powód).

- **E-mail:** SMTP (`SMTP_*`) lub Resend (`RESEND_API_KEY`), nadawca `EMAIL_FROM`.
- **WhatsApp — Meta Cloud API (domyślnie):** `META_WA_PHONE_NUMBER_ID`, `META_WA_ACCESS_TOKEN`. Wiadomości wysyłane z inicjatywy firmy poza 24-h oknem rozmowy wymagają **zatwierdzonego szablonu** w Meta Business — ustaw `META_WA_TEMPLATE_NAME`. Szablon powinien mieć 4 parametry treści: `{{1}}` klient, `{{2}}` nr zlecenia, `{{3}}` status, `{{4}}` uwagi, i istnieć w językach `pl`, `de`, `en`.
- **WhatsApp — Twilio:** `WHATSAPP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (+ opcjonalnie `TWILIO_CONTENT_SID` dla szablonu).
- Treści domyślne: `src/lib/notifications/templates.ts`. Własne szablony per status/kanał/język można zapisać w tabeli `NotificationTemplate` (edytor w Ustawieniach — etap 5).

Konfiguracja jest czytana najpierw z tabeli `Setting`, potem ze zmiennych środowiskowych.

## Ustawienia (panel → Ustawienia, tylko administrator)

- **Firma**: nazwa, e-mail, telefon, adres, domyślny kierunkowy (49), waluta, domyślny motyw, logo (wgrywane do `UPLOAD_DIR`).
- **Powiadomienia**: dostawca e-mail (SMTP / Resend) i WhatsApp (Meta Cloud API / Twilio), e-mail do powiadomień o zgłoszeniach, przyciski „Wyślij test”. Hasła i tokeny są szyfrowane (AES-256-GCM, klucz z `AUTH_SECRET` — po zmianie `AUTH_SECRET` trzeba je wpisać ponownie).
- **Szablony**: treść powiadomień dla każdego statusu × kanał × język; puste = domyślny; można wyłączyć powiadomienie dla statusu.
- **Impressum i prywatność**: treść w Markdown (DE wiążąca, PL/EN opcjonalne → fallback DE), strony `/impressum` i `/datenschutz` linkowane w stopce.
- **Użytkownicy**: administratorzy i pracownicy, zaproszenia e-mailem, dezaktywacja (ostatniego admina nie da się usunąć).
- **Moje konto**: zmiana hasła (dostępne też dla pracowników).

## Panel klienta (`/panel`)

Lista zleceń, szczegóły z paskiem postępu i historią (tylko wpisy oznaczone „widoczne dla klienta”), ustawienia powiadomień (e-mail / WhatsApp, język) i zmiana hasła.
Konto klienta powstaje automatycznie przy zgłoszeniu przez formularz (link do ustawienia hasła w e-mailu potwierdzającym, ważny 7 dni) albo z karty klienta w panelu („Wyślij zaproszenie”). „Passwort vergessen?” na stronie logowania wysyła link resetu (2 h, jednorazowy).

## Specyfika Niemiec — do zrobienia przed startem

- **Impressum** i **Datenschutzerklärung** są obowiązkowe — uzupełnij w Ustawieniach (najlepiej tekst z generatora, np. e-recht24, albo od prawnika). Wspomnij w polityce o: hostingu (VPS), wysyłce e-mail (dostawca SMTP/Resend), WhatsApp (Meta/Twilio), formularzach.
- **Cookies**: strona używa tylko niezbędnych cookies (sesja logowania, wybrany język) i localStorage dla motywu — baner zgody nie jest wymagany, dopóki nie dodasz analityki/marketingu.
- **Fonty** są serwowane lokalnie (next/font) — brak zapytań do Google Fonts.
- Zgody w formularzach linkują do `/datenschutz`.

## Wdrożenie (VPS)

1. **Serwer**: VPS z Docker + Docker Compose (np. Ubuntu 24.04, 2 GB RAM). Rekordy DNS `A` (i `AAAA`) dla `suppit.me` i `www.suppit.me` → IP serwera; porty 80 i 443 otwarte.
2. **Kod i konfiguracja**:
   ```bash
   git clone <repo> /opt/suppit && cd /opt/suppit
   cp .env.example .env
   ```
   W `.env` ustaw co najmniej: `DOMAIN`, `POSTGRES_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.
3. **Start**:
   ```bash
   docker compose up -d --build
   ```
   Serwis `migrate` wykona migracje i seed (konto admina), `caddy` pobierze certyfikat HTTPS.
4. **Pierwsze kroki** w `https://suppit.me/pl/login`: zmień hasło (Ustawienia → Moje konto), uzupełnij dane firmy, Impressum i Datenschutz, skonfiguruj e-mail i WhatsApp (przycisk „Wyślij test”).
5. **Kopie zapasowe**: `./scripts/backup.sh` (baza + wgrane pliki → `backups/`, 14 ostatnich). Dodaj do crona:
   `15 3 * * * cd /opt/suppit && ./scripts/backup.sh >> backups/backup.log 2>&1`.
   Przywracanie: `./scripts/restore.sh backups/db-….sql.gz`. Kopiuj `backups/` także poza serwer.
6. **Aktualizacja**: `git pull && docker compose up -d --build`.

Healthcheck: `GET /api/health`. Wgrane pliki: wolumen `uploads`, baza: wolumen `pgdata`.
