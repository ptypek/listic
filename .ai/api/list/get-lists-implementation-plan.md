# API Endpoint Implementation Plan: GET /lists

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za pobieranie wszystkich list zakupów powiązanych z uwierzytelnionym użytkownikiem. Umożliwia sortowanie wyników na podstawie określonych pól i w określonym porządku.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/lists`
- **Parametry**:
  - **Wymagane**: Brak. Uwierzytelnianie jest obsługiwane przez middleware.
  - **Opcjonalne**:
    - `sort` (string): Pole do sortowania. Dozwolone wartości: `created_at`, `name`, `updated_at`. Domyślnie: `created_at`.
    - `order` (string): Kierunek sortowania. Dozwolone wartości: `asc`, `desc`. Domyślnie: `desc`.
- **Request Body**: Brak.

## 3. Wykorzystywane typy

- **`GetListsQueryDto` (Zod Schema)**: Do walidacji i parsowania parametrów zapytania `sort` i `order`.

  ```typescript
  import { z } from "zod";

  export const GetListsQueryDto = z.object({
    sort: z.enum(["created_at", "name", "updated_at"]).optional().default("created_at"),
    order: z.enum(["asc", "desc"]).optional().default("desc"),
  });
  ```

- **`ShoppingListDto` (Type)**: Istniejący typ w `src/types.ts` do reprezentowania pojedynczej listy zakupów w odpowiedzi.
  ```typescript
  export type ShoppingListDto = Tables<"shopping_lists">;
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca tablicę obiektów `ShoppingListDto`. Tablica może być pusta, jeśli użytkownik nie ma żadnych list.
  ```json
  [
    {
      "id": "uuid-goes-here",
      "user_id": "auth-user-uuid",
      "name": "Weekly Groceries",
      "created_at": "2025-10-26T10:00:00Z",
      "updated_at": "2025-10-26T12:00:00Z"
    }
  ]
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli parametry `sort` lub `order` są nieprawidłowe.
  - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony (obsługiwane przez middleware).
  - `500 Internal Server Error`: W przypadku błędów po stronie serwera, np. problemów z bazą danych.

## 5. Przepływ danych

1. Żądanie `GET /api/v1/lists` trafia do serwera Astro.
2. Middleware (`src/middleware/index.ts`) weryfikuje token uwierzytelniający użytkownika. Jeśli jest nieprawidłowy, zwraca `401 Unauthorized`. W przeciwnym razie, dołącza sesję użytkownika do `Astro.locals`.
3. Handler API w `src/pages/api/v1/lists/index.ts` zostaje wywołany.
4. Handler używa schemy `GetListsQueryDto` (Zod) do walidacji i sparsowania parametrów `sort` i `order` z `Astro.url.searchParams`.
5. Jeśli walidacja nie powiedzie się, handler zwraca odpowiedź `400 Bad Request`.
6. Handler wywołuje metodę `getLists(userId, query)` z `ListService`, przekazując ID uwierzytelnionego użytkownika (z `Astro.locals.session`) oraz zwalidowane parametry zapytania.
7. `ListService` używa klienta Supabase do wykonania zapytania do tabeli `shopping_lists`. Zapytanie filtruje listy po `user_id` i stosuje klauzulę `orderBy` zgodnie z parametrami `sort` i `order`.
8. Baza danych (dzięki RLS) dodatkowo zapewnia, że zapytanie zwróci tylko te wiersze, które należą do `auth.uid()`.
9. `ListService` zwraca tablicę list zakupów do handlera API.
10. Handler API serializuje wynik do formatu JSON i zwraca go z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wszystkie żądania do tego punktu końcowego muszą być uwierzytelnione. Middleware jest odpowiedzialne za weryfikację sesji Supabase.
- **Autoryzacja**: Dostęp do danych jest ograniczony na dwóch poziomach:
  1. **RLS (Row-Level Security)**: Włączone dla tabeli `shopping_lists` w PostgreSQL, co gwarantuje, że użytkownicy mogą odpytywać tylko własne dane na poziomie bazy danych.
  2. **Logika serwisowa**: Zapytanie w `ListService` będzie jawnie zawierać warunek `where('user_id', '=', userId)`, co stanowi dodatkową warstwę ochrony (defense in depth).
- **Walidacja danych wejściowych**: Użycie Zod do walidacji parametrów `sort` i `order` zapobiega atakom typu SQL Injection poprzez ograniczenie dozwolonych wartości do predefiniowanej listy nazw kolumn i kierunków sortowania.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Jeśli `GetListsQueryDto.safeParse` zwróci błąd, serwer odpowie kodem 400 i komunikatem zawierającym szczegóły błędu walidacji.
- **Brak uwierzytelnienia (401)**: Obsługiwane globalnie przez middleware.
- **Błąd serwera (500)**: Każdy nieoczekiwany błąd podczas interakcji z bazą danych lub w logice serwisu zostanie przechwycony w bloku `try...catch`. Błąd zostanie zalogowany na konsoli serwera, a do klienta zostanie wysłana generyczna odpowiedź `500 Internal Server Error`.

## 8. Wydajność

- **Indeksowanie**: Kolumna `user_id` w tabeli `shopping_lists` powinna być zindeksowana (`idx_shopping_lists_user_id`), aby zapewnić szybkie wyszukiwanie list dla danego użytkownika. Plan bazy danych (`db-plan.MD`) już to przewiduje.
- **Paginacja**: Obecna specyfikacja nie wymaga paginacji. Jeśli użytkownicy zaczną tworzyć bardzo dużą liczbę list, w przyszłości można dodać parametry `page` i `limit`, aby zoptymalizować wydajność i zmniejszyć obciążenie.

## 9. Etapy wdrożenia

1. **Aktualizacja walidatorów**:
   - W pliku `src/lib/validators/list.validator.ts` (lub nowym, jeśli nie istnieje) utwórz i wyeksportuj schemę Zod `GetListsQueryDto`.
2. **Aktualizacja serwisu**:
   - W pliku `src/services/list.service.ts` dodaj nową metodę asynchroniczną `getLists`.
   - Metoda powinna przyjmować `supabase: SupabaseClient`, `userId: string` oraz `query: z.infer<typeof GetListsQueryDto>` jako argumenty.
   - Wewnątrz metody, zbuduj zapytanie Supabase do tabeli `shopping_lists`, używając `.select('*')`, `.eq('user_id', userId)` oraz `.order(query.sort, { ascending: query.order === 'asc' })`.
   - Zwróć `{ data, error }` z zapytania.
3. **Implementacja punktu końcowego API**:
   - W pliku `src/pages/api/v1/lists/index.ts` zaimplementuj handler `GET`.
   - Ustaw `export const prerender = false;`.
   - Pobierz sesję użytkownika z `Astro.locals.session`. Jeśli jej nie ma, zwróć `401`.
   - Użyj `GetListsQueryDto.safeParse` do walidacji parametrów z `Astro.url.searchParams`. W przypadku błędu zwróć `400`.
   - Wywołaj nową metodę `listService.getLists` z klientem Supabase (`Astro.locals.supabase`), ID użytkownika i zwalidowanymi danymi.
   - Sprawdź, czy wystąpił błąd podczas wywołania serwisu. Jeśli tak, zaloguj go i zwróć `500`.
   - Jeśli wszystko się powiedzie, zwróć pobrane dane z kodem statusu `200 OK`.
4. **Testowanie**:
   - Dodaj testy jednostkowe dla `ListService`, mockując klienta Supabase, aby zweryfikować poprawność budowania zapytania.
   - Dodaj testy integracyjne dla punktu końcowego API, aby sprawdzić pełny przepływ, w tym walidację, autoryzację i obsługę błędów.
