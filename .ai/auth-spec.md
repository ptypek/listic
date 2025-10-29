# Specyfikacja Techniczna: Moduł Autentykacji Użytkownika

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i plan implementacji funkcjonalności autentykacji (rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła) w aplikacji Listic. Specyfikacja bazuje na wymaganiach US-001, US-002, US-003, US-004 z pliku `prd.md` oraz na zdefiniowanym stosie technologicznym (`tech-stack.MD`), który obejmuje Astro, React, TypeScript, Supabase (Auth, DB) i Tailwind CSS.

Konfiguracja Astro (`astro.config.mjs`) wskazuje na tryb renderowania `hybrid` lub `server`, co umożliwia realizację logiki po stronie serwera, kluczowej dla bezpiecznej autentykacji.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Nowe Strony (Astro)

Wprowadzone zostaną nowe strony w katalogu `src/pages/` w celu obsługi przepływów autentykacji. Będą to strony Astro (`.astro`), które osadzą w sobie interaktywne komponenty React.

- **`src/pages/login.astro`**: Strona logowania.
- **`src/pages/register.astro`**: Strona rejestracji.
- **`src/pages/forgot-password.astro`**: Strona do inicjowania procesu odzyskiwania hasła.
- **`src/pages/reset-password.astro`**: Strona, na którą użytkownik jest przekierowywany z linku w mailu, aby ustawić nowe hasło. Strona będzie zawierała logikę po stronie klienta do obsługi tokenu z URL.
- **`src/pages/auth/callback.astro`**: Strona do obsługi przekierowań zwrotnych od Supabase, np. po udanej autentykacji przez dostawców OAuth lub po potwierdzeniu maila.

### 2.2. Nowe Komponenty (React)

Interaktywne formularze zostaną zaimplementowane jako komponenty React (`.tsx`) i umieszczone w nowym katalogu `src/components/features/auth/`.

- **`src/components/features/auth/LoginForm.tsx`**:
  - Odpowiedzialność: Zarządzanie stanem formularza logowania (email, hasło), walidacja po stronie klienta, obsługa stanu ładowania i błędów, wywołanie endpointu API `POST /api/v1/auth/login`.
- **`src/components/features/auth/RegisterForm.tsx`**:
  - Odpowiedzialność: Zarządzanie stanem formularza rejestracji (email, hasło, powtórz hasło), walidacja client-side, wywołanie API `POST /api/v1/auth/register`.
- **`src/components/features/auth/ForgotPasswordForm.tsx`**:
  - Odpowiedzialność: Formularz z polem na email, wywołujący API `POST /api/v1/auth/forgot-password`.
- **`src/components/features/auth/ResetPasswordForm.tsx`**:
  - Odpowiedzialność: Formularz z polem na nowe hasło, który będzie aktywny na stronie `reset-password.astro`. Komponent odczyta token z fragmentu URL (`#access_token`), uwierzytelni sesję klienta Supabase i wywoła API `POST /api/v1/auth/reset-password`.

### 2.3. Modyfikacja Istniejących Komponentów i Layoutów

- **`src/layouts/Layout.astro`**:
  - **Cel modyfikacji**: Warunkowe renderowanie interfejsu w zależności od stanu zalogowania użytkownika.
  - **Logika**: Layout będzie pobierał informację o sesji użytkownika z `Astro.locals.session` (dostarczone przez middleware).
  - **Tryb `non-auth` (gość)**: W nagłówku strony wyświetlane będą przyciski "Zaloguj się" i "Zarejestruj się", kierujące do `/login` i `/register`.
  - **Tryb `auth` (zalogowany)**: Zamiast przycisków logowania, wyświetlany będzie awatar użytkownika (`<Avatar />`) z menu dropdown, zawierającym link do panelu użytkownika (w przyszłości) oraz przycisk "Wyloguj".
- **`src/pages/index.astro`**:
  - **Cel modyfikacji**: Ograniczenie dostępu do funkcjonalności generowania list tylko dla zalogowanych użytkowników.
  - **Logika**: Strona sprawdzi `Astro.locals.session`. Jeśli sesja nie istnieje, komponent `GenerateListFeature` zostanie ukryty lub zastąpiony przez komponent zachęcający do logowania/rejestracji.

### 2.4. Walidacja i Obsługa Błędów

- **Walidacja Client-Side (w komponentach React)**: Natychmiastowa informacja zwrotna dla użytkownika (np. "Hasła nie są zgodne", "Niepoprawny format emaila") przy użyciu biblioteki `zod` i hooka `react-hook-form`.
- **Komunikaty z API**: Komponenty będą przygotowane na odbieranie i wyświetlanie błędów zwróconych przez backend (np. "Użytkownik o tym adresie email już istnieje", "Nieprawidłowe dane logowania").

## 3. Logika Backendowa (Astro API & Middleware)

### 3.1. Middleware Autentykacji

- **Plik**: `src/middleware/index.ts`
- **Cel**: Przechwytywanie każdego żądania do serwera, weryfikacja tokenów sesji Supabase (przechowywanych w cookies) i udostępnianie danych sesji w kontekście Astro.
- **Implementacja**:
  1. Na każde żądanie, middleware utworzy serwerowego klienta Supabase z użyciem `cookies` z obiektu `Astro.request`.
  2. Wywoła `supabase.auth.getSession()` w celu pobrania i zweryfikowania sesji.
  3. Wynik (sesja i dane użytkownika lub `null`) zostanie przypisany do `context.locals.session` i `context.locals.user`.
  4. `context.next()` przekaże sterowanie do odpowiedniej strony lub endpointu API.

### 3.2. Nowe Endpointy API

Endpointy zostaną umieszczone w `src/pages/api/v1/auth/`. Będą to pliki `.ts` eksportujące funkcje obsługujące metody HTTP (np. `export const POST: APIRoute = ...`).

- **`POST /api/v1/auth/login`**:
  - Przyjmuje: `email`, `password`.
  - Logika: Waliduje dane wejściowe, wywołuje `supabase.auth.signInWithPassword()`. W przypadku sukcesu, Supabase automatycznie dołączy do odpowiedzi nagłówki `Set-Cookie` z tokenami sesji.
  - Zwraca: 200 OK lub błąd 401/400.
- **`POST /api/v1/auth/register`**:
  - Przyjmuje: `email`, `password`.
  - Logika: Waliduje dane, wywołuje `supabase.auth.signUp()`. Supabase domyślnie wyśle email z linkiem potwierdzającym.
  - Zwraca: 201 Created lub błąd 400/409.
- **`POST /api/v1/auth/logout`**:
  - Logika: Wywołuje `supabase.auth.signOut()`. Supabase dołączy nagłówki `Set-Cookie` czyszczące tokeny.
  - Zwraca: 200 OK.
- **`POST /api/v1/auth/forgot-password`**:
  - Przyjmuje: `email`.
  - Logika: Wywołuje `supabase.auth.resetPasswordForEmail()`, podając URL do strony resetowania hasła w naszej aplikacji.
  - Zwraca: 200 OK (nawet jeśli użytkownik nie istnieje, aby nie ujawniać informacji).
- **`POST /api/v1/auth/reset-password`**:
  - Logika: Ten endpoint będzie wywoływany z sesją uwierzytelnioną przez token z linku. Przyjmuje nowe hasło i wywołuje `supabase.auth.updateUser()` w celu jego zmiany.
  - Zwraca: 200 OK lub błąd 400/401.

### 3.3. Modele Danych i Walidacja (Zod)

W pliku `src/lib/validators/auth.validator.ts` zostaną zdefiniowane schematy walidacji dla danych wejściowych, analogicznie do istniejącego `list.validator.ts`.

- `LoginSchema = z.object({ email: z.string().email(), password: z.string().min(8) })`
- `RegisterSchema = z.object({ email: z.string().email(), password: z.string().min(8) })`

Endpointy API będą używać tych schematów do walidacji `request.body`.

## 4. System Autentykacji (Supabase)

- **Konfiguracja Klienta Supabase**: Istniejący plik `src/db/supabase.client.ts` będzie wykorzystywany do tworzenia instancji klienta Supabase. Należy upewnić się, że zmienne środowiskowe `SUPABASE_URL` i `SUPABASE_KEY` są poprawnie skonfigurowane w pliku `.env` (na podstawie `.env.example`).
- **Przepływ Logowania/Rejestracji**: Będzie oparty o "Server-Side Auth with PKCE", gdzie formularze React komunikują się z naszymi endpointami API w Astro, a te z kolei bezpiecznie komunikują się z Supabase Auth po stronie serwera. Taki model chroni przed atakami XSS i jest rekomendowany dla aplikacji SSR.
- **Email Templates**: W panelu Supabase (w sekcji Auth -> Email Templates) należy dostosować szablony maili (potwierdzenie rejestracji, reset hasła), aby pasowały do identyfikacji wizualnej aplikacji i zawierały poprawne linki zwrotne.
- **Polityki RLS**: Po wdrożeniu autentykacji, należy zaktualizować polityki Row Level Security w bazie danych Supabase. Dostęp do tabel (np. `lists`) powinien być ograniczony tak, aby użytkownik mógł odczytywać i modyfikować tylko własne zasoby. Polityki będą bazować na funkcji `auth.uid()` w celu identyfikacji zalogowanego użytkownika.
