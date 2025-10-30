# API Endpoint Implementation Plan: DELETE /lists/{listId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy jest odpowiedzialny za trwałe usunięcie listy zakupów na podstawie jej identyfikatora (`listId`). Usunięcie obejmuje samą listę oraz wszystkie powiązane z nią pozycje (dzięki mechanizmowi `CASCADE DELETE` w bazie danych). Dostęp do tego punktu końcowego jest ograniczony tylko do uwierzytelnionych użytkowników, którzy są właścicielami danej listy.

## 2. Szczegóły żądania
- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/v1/lists/{listId}`
- **Parametry:**
  - **Wymagane:**
    - `listId` (parametr ścieżki): Unikalny identyfikator (UUID) listy zakupów do usunięcia.
  - **Opcjonalne:** Brak.
- **Request Body:** Brak.

## 3. Wykorzystywane typy
- Do walidacji parametru `listId` zostanie użyty `z.string().uuid()` z biblioteki Zod, zgodnie z istniejącymi walidatorami w projekcie.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu:**
  - **Kod stanu:** `204 No Content`
  - **Treść:** Brak.
- **Odpowiedzi błędów:**
  - **Kod stanu:** `400 Bad Request`
    - **Treść:** `{ "error": "Invalid list ID format" }`
  - **Kod stanu:** `401 Unauthorized`
    - **Treść:** `{ "error": "User is not authenticated" }`
  - **Kod stanu:** `404 Not Found`
    - **Treść:** `{ "error": "List not found or user does not have access" }`
  - **Kod stanu:** `500 Internal Server Error`
    - **Treść:** `{ "error": "An internal server error occurred" }`

## 5. Przepływ danych
1. Klient wysyła żądanie `DELETE` na adres `/api/v1/lists/{listId}`.
2. Handler API w Astro (`src/pages/api/v1/lists/[listId].ts`) odbiera żądanie.
3. Handler sprawdza, czy użytkownik jest uwierzytelniony, analizując `Astro.locals.session`. Jeśli nie, zwraca `401`.
4. Handler wyodrębnia `listId` z parametrów URL i waliduje jego format (UUID). Jeśli jest nieprawidłowy, zwraca `400`.
5. Handler wywołuje metodę `deleteList(listId, userId)` z serwisu `ListService` (`src/services/list.service.ts`), przekazując `listId` oraz ID użytkownika z sesji.
6. Metoda `deleteList` w `ListService` wykonuje następujące kroki:
   a. Używa klienta Supabase, aby najpierw pobrać listę o zadanym `listId`.
   b. Sprawdza, czy lista istnieje i czy jej `user_id` jest zgodny z `userId` przekazanym do metody. Jeśli warunki nie są spełnione, zgłasza błąd "Not Found".
   c. Jeśli autoryzacja przebiegnie pomyślnie, wykonuje operację `DELETE` na tabeli `lists` w bazie danych Supabase, używając `listId`.
7. Jeśli operacja w serwisie zakończy się sukcesem, handler API zwraca odpowiedź `204 No Content`.
8. W przypadku błędu (np. "Not Found" z serwisu lub błąd bazy danych), handler API zwraca odpowiedni kod stanu błędu (`404` lub `500`) wraz z komunikatem JSON.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie:** Każde żądanie do tego punktu końcowego musi być uwierzytelnione. Handler API musi odrzucić żądania bez aktywnej sesji użytkownika (`Astro.locals.session`).
- **Autoryzacja:** Kluczowym mechanizmem zabezpieczającym jest weryfikacja własności listy. Serwis `ListService` musi bezwzględnie upewnić się, że użytkownik próbujący usunąć listę jest jej właścicielem. Zapobiega to atakom typu IDOR (Insecure Direct Object Reference).
- **Walidacja danych wejściowych:** Parametr `listId` musi być walidowany jako UUID, aby zapobiec próbom wstrzyknięcia złośliwych danych lub nieoczekiwanym błędom w zapytaniach do bazy danych.

## 7. Obsługa błędów
- **Brak uwierzytelnienia:** Zwracany jest status `401 Unauthorized`.
- **Nieprawidłowy format `listId`:** Zwracany jest status `400 Bad Request`.
- **Lista nie istnieje lub brak uprawnień:** Zwracany jest status `404 Not Found`. Jest to celowe działanie, aby nie ujawniać informacji o istnieniu zasobu, do którego użytkownik i tak nie ma dostępu.
- **Błędy serwera/bazy danych:** Wszelkie nieoczekiwane błędy podczas interakcji z bazą danych (np. problemy z połączeniem) będą skutkować odpowiedzią `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności
- Operacja usuwania jest oparta o klucz główny (`id`), co zapewnia wysoką wydajność po stronie bazy danych.
- Kaskadowe usuwanie (`ON DELETE CASCADE`) dla powiązanych pozycji (`list_items`) jest wydajne, ale w przypadku list z bardzo dużą liczbą pozycji (tysiące) może zająć więcej czasu. Dla typowych zastosowań aplikacji nie przewiduje się problemów z wydajnością.
- Zapytanie weryfikujące własność listy przed usunięciem jest również szybkie, ponieważ wykorzystuje indeksowane kolumny (`id` i `user_id`).

## 9. Etapy wdrożenia
1. **Aktualizacja serwisu `ListService`:**
   - Otwórz plik `src/services/list.service.ts`.
   - Dodaj nową metodę asynchroniczną `deleteList(listId: string, userId: string): Promise<void>`.
   - Wewnątrz metody, użyj klienta Supabase, aby najpierw znaleźć listę (`select`) z warunkiem `where('id', listId).where('user_id', userId)`.
   - Jeśli zapytanie nie zwróci żadnego rekordu, rzuć błąd (np. `throw new Error('Not Found')`).
   - Jeśli rekord zostanie znaleziony, wykonaj operację `delete()` na tabeli `lists` z warunkiem `where('id', listId)`.
   - Obsłuż potencjalne błędy zwracane przez klienta Supabase.

2. **Implementacja handlera API:**
   - Otwórz plik `src/pages/api/v1/lists/[listId].ts`.
   - Dodaj eksportowaną funkcję asynchroniczną o nazwie `DELETE`, która przyjmuje `APIContext` jako argument.
   - Sprawdź, czy `context.locals.session.user` istnieje. Jeśli nie, zwróć odpowiedź `401`.
   - Wyodrębnij `listId` z `context.params`.
   - Użyj Zod, aby sprawdzić, czy `listId` jest poprawnym UUID. Jeśli nie, zwróć odpowiedź `400`.
   - Wywołaj `listService.deleteList(listId, context.locals.session.user.id)` w bloku `try...catch`.
   - W bloku `try`, po pomyślnym wywołaniu serwisu, zwróć `new Response(null, { status: 204 })`.
   - W bloku `catch`, sprawdź typ błędu. Jeśli jest to błąd "Not Found" z serwisu, zwróć odpowiedź `404`. W przeciwnym razie zwróć `500`.
