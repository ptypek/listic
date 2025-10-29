# API Endpoint Implementation Plan: User Login

## 1. Przegląd punktu końcowego
Ten punkt końcowy obsługuje proces uwierzytelniania użytkownika. Przyjmuje e-mail i hasło, weryfikuje je za pomocą usługi Supabase Auth i w przypadku powodzenia zwraca dane sesji użytkownika, w tym token JWT.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/v1/auth/login`
- **Parametry:** Brak parametrów URL.
- **Request Body:** Ciało żądania musi być obiektem JSON zgodnym ze strukturą `LoginUserDto`.
  ```json
  {
    "email": "user@example.com",
    "password": "user_password"
  }
  ```

## 3. Wykorzystywane typy
- **`LoginUserSchema` (Zod Schema):** Do walidacji danych wejściowych.
  ```typescript
  // src/lib/validators/auth.validator.ts
  import { z } from 'zod';

  export const LoginUserSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  });
  ```
- **`LoginUserDto` (TypeScript Type):** Typ generowany na podstawie schematu Zod.
  ```typescript
  export type LoginUserDto = z.infer<typeof LoginUserSchema>;
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK):** Zwraca obiekt sesji z Supabase, zawierający dane użytkownika i tokeny.
  ```json
  {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      ...
    },
    "session": {
      "access_token": "jwt-access-token",
      "refresh_token": "jwt-refresh-token",
      ...
    }
  }
  ```
- **Odpowiedzi błędów:**
  - **400 Bad Request:** Nieprawidłowe dane wejściowe.
  - **401 Unauthorized:** Błędne dane uwierzytelniające.
  - **500 Internal Server Error:** Wewnętrzny błąd serwera.

## 5. Przepływ danych
1. Klient wysyła żądanie `POST` na adres `/api/v1/auth/login` z e-mailem i hasłem w ciele żądania.
2. Handler trasy API w Astro (`src/pages/api/v1/auth/login.ts`) odbiera żądanie.
3. Dane wejściowe są walidowane za pomocą `LoginUserSchema`. Jeśli walidacja nie powiedzie się, zwracany jest błąd 400.
4. Wywoływana jest metoda `login` z `AuthService`, przekazując zwalidowane dane.
5. `AuthService` używa klienta Supabase (`supabase.auth.signInWithPassword`) do uwierzytelnienia użytkownika.
6. Jeśli uwierzytelnianie w Supabase się powiedzie, zwracane są dane sesji.
7. Handler trasy API zwraca dane sesji do klienta z kodem statusu 200.
8. W przypadku błędu uwierzytelniania (np. nieprawidłowe hasło), Supabase zwraca błąd, który jest przechwytywany, a API odpowiada kodem 401.
9. W przypadku nieoczekiwanego błędu (np. problem z usługą Supabase), błąd jest logowany, a API odpowiada kodem 500.

## 6. Względy bezpieczeństwa
- **Komunikacja:** Cała komunikacja musi odbywać się przez HTTPS, aby chronić dane uwierzytelniające podczas przesyłania.
- **Walidacja danych wejściowych:** Rygorystyczna walidacja za pomocą Zod zapobiega przetwarzaniu nieprawidłowych danych i potencjalnym atakom.
- **Ochrona przed Brute-Force:** Wykorzystanie wbudowanej w Supabase ochrony przed atakami siłowymi (blokowanie po wielu nieudanych próbach).
- **Obsługa tokenów JWT:** Tokeny JWT powinny być bezpiecznie przechowywane po stronie klienta (np. w `HttpOnly` cookies lub bezpiecznym magazynie przeglądarki) i dołączane do każdego żądania do chronionych zasobów.

## 7. Obsługa błędów
- **Błąd walidacji (400):** Zwracany, gdy `email` ma nieprawidłowy format lub `password` jest puste. Odpowiedź będzie zawierać szczegółowy opis błędu.
- **Błąd uwierzytelniania (401):** Zwracany przez Supabase, gdy kombinacja e-maila i hasła jest nieprawidłowa.
- **Błąd serwera (500):** W przypadku problemów z połączeniem z Supabase lub innych nieoczekiwanych błędów serwera. Szczegóły błędu zostaną zarejestrowane w tabeli `errors` w bazie danych.

## 8. Rozważania dotyczące wydajności
- Wydajność punktu końcowego jest w dużej mierze zależna od czasu odpowiedzi usługi uwierzytelniania Supabase.
- Walidacja po stronie serwera jest szybka i ma znikomy wpływ na ogólny czas odpowiedzi.
- Należy monitorować czas odpowiedzi Supabase, aby zapewnić optymalne działanie.

## 9. Etapy wdrożenia
1. **Utworzenie katalogów:** Stwórz niezbędne foldery, jeśli nie istnieją: `src/services`, `src/lib/validators`.
2. **Definicja walidatora:** W pliku `src/lib/validators/auth.validator.ts` zdefiniuj schemat `LoginUserSchema` przy użyciu biblioteki Zod.
3. **Implementacja serwisu:** Stwórz plik `src/services/auth.service.ts` i zaimplementuj w nim klasę `AuthService` z metodą `login(dto: LoginUserDto)`. Metoda ta powinna wywoływać `supabase.auth.signInWithPassword`.
4. **Implementacja punktu końcowego API:** Stwórz plik `src/pages/api/v1/auth/login.ts`.
   - Zaimplementuj handler dla metody `POST`.
   - W handlerze, odczytaj ciało żądania.
   - Przeprowadź walidację przy użyciu `LoginUserSchema`.
   - Wywołaj metodę `authService.login`.
   - Zaimplementuj obsługę błędów (walidacyjnych, autoryzacyjnych, serwera).
   - Zwróć odpowiednią odpowiedź HTTP (200, 400, 401, 500).
5. **Konfiguracja klienta Supabase:** Upewnij się, że klient Supabase jest poprawnie zainicjowany i dostępny dla serwisu i punktu końcowego API.
6. **Testowanie:**
   - Napisz testy jednostkowe dla `AuthService`, mockując klienta Supabase.
   - Napisz testy integracyjne dla punktu końcowego `/api/v1/auth/login`, aby zweryfikować cały przepływ, włączając walidację i obsługę błędów.
