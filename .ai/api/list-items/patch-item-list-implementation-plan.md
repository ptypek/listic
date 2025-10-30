# API Endpoint Implementation Plan: PATCH /list-items/{itemId}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom aktualizację poszczególnych pozycji na ich listach zakupów. Obsługuje częściowe aktualizacje, co oznacza, że klienci mogą wysyłać tylko te pola, które chcą zmienić (np. tylko zaktualizować status `is_checked` lub zmienić `quantity`).

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/v1/list-items/{itemId}`
- **Parametry:**
  - **Wymagane (w ścieżce):**
    - `itemId` (UUID): Unikalny identyfikator pozycji na liście do zaktualizowania.
  - **Opcjonalne (w ciele żądania):**
    - `name` (string): Nowa nazwa produktu.
    - `quantity` (number): Nowa ilość produktu.
    - `unit` (string): Nowa jednostka miary (np. "kg", "szt").
    - `is_checked` (boolean): Nowy status zaznaczenia pozycji.
- **Request Body (JSON):**
  ```json
  {
    "name": "Dojrzałe pomidory",
    "quantity": 6,
    "unit": "szt",
    "is_checked": true
  }
  ```

## 3. Wykorzystywane typy

- **Command Model:** `UpdateListItemCommand` (z `src/types.ts`) - Ten typ, pochodzący z `TablesUpdate<'list_items'>`, będzie używany do przekazywania danych z walidatora do warstwy serwisowej. Jego opcjonalne pola idealnie pasują do metody `PATCH`.
- **DTO (Data Transfer Object):** `ListItemDto` (z `src/types.ts`) - Ten typ, reprezentujący wiersz w tabeli `list_items`, będzie używany jako struktura danych odpowiedzi.
- **Walidator Zod:** `updateListItemSchema` (do utworzenia w `src/lib/validators/list.validator.ts`) - Schemat Zod do walidacji opcjonalnych pól w ciele żądania.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):**
  - Zwraca pełny obiekt zaktualizowanej pozycji na liście (`ListItemDto`).
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "list_id": "f0e9d8c7-b6a5-4321-fedc-ba9876543210",
    "category_id": 2,
    "name": "Dojrzałe pomidory",
    "quantity": 6,
    "unit": "szt",
    "is_checked": true,
    "source": "manual",
    "created_at": "2025-10-26T18:42:26.123Z",
    "updated_at": "2025-10-30T10:00:00.000Z"
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Ciało żądania nie przeszło walidacji (np. `quantity` nie jest liczbą).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Pozycja o podanym `itemId` nie istnieje lub użytkownik nie ma do niej dostępu.
  - `500 Internal Server Error`: Wystąpił nieoczekiwany błąd serwera (np. błąd bazy danych).

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do punktu końcowego Astro `/api/v1/list-items/[itemId].ts`.
2.  Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika z Supabase. Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized`.
3.  Handler punktu końcowego pobiera `itemId` z parametrów ścieżki i ciało żądania.
4.  Ciało żądania jest walidowane przy użyciu schemy `updateListItemSchema` z Zod. W przypadku niepowodzenia walidacji, zwracany jest błąd `400 Bad Request`.
5.  Handler wywołuje funkcję `listService.updateListItem(itemId, validatedData, user.id)`.
6.  Funkcja `updateListItem` w `src/services/list.service.ts` wykonuje zapytanie `UPDATE` do tabeli `list_items` w Supabase, używając `itemId` w klauzuli `WHERE`.
7.  Polityka RLS (Row Level Security) w PostgreSQL automatycznie zapewnia, że operacja `UPDATE` powiedzie się tylko wtedy, gdy pozycja należy do listy, której właścicielem jest uwierzytelniony użytkownik (`auth.uid()`).
8.  Jeśli zapytanie `UPDATE` nie zmodyfikuje żadnego wiersza (co oznacza, że `itemId` nie istnieje lub RLS zablokował operację), serwis zgłasza błąd "Not Found".
9.  Jeśli aktualizacja się powiedzie, serwis zwraca zaktualizowany obiekt pozycji.
10. Handler punktu końcowego otrzymuje zaktualizowaną pozycję i wysyła ją jako odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do punktu końcowego jest chroniony przez middleware, który sprawdza poprawność sesji użytkownika Supabase.
- **Autoryzacja:** Wykorzystana zostanie polityka RLS zdefiniowana w `db-plan.MD` dla tabeli `list_items`. Gwarantuje ona, że użytkownicy mogą modyfikować tylko te pozycje, które znajdują się na ich własnych listach zakupów. Zapytanie w warstwie serwisowej będzie polegać na tej polityce, eliminując potrzebę dodatkowych, ręcznych sprawdzeń uprawnień w kodzie aplikacji.
- **Walidacja danych wejściowych:** Wszystkie dane pochodzące od klienta będą rygorystycznie walidowane za pomocą Zod, aby zapobiec błędom i potencjalnym atakom (np. SQL Injection, chociaż Supabase client SDK w dużym stopniu przed tym chroni).

## 7. Obsługa błędów

- **Błąd walidacji (400):** Zod zwróci szczegółowe informacje o błędach, które zostaną zalogowane po stronie serwera, a klient otrzyma generyczną odpowiedź `400 Bad Request`.
- **Brak autoryzacji (401):** Middleware zwróci odpowiedź `401`, jeśli `Astro.locals.user` jest `null`.
- **Nie znaleziono zasobu (404):** Jeśli `listService.updateListItem` zgłosi błąd "Not Found" (ponieważ operacja `UPDATE` nie wpłynęła na żaden wiersz), handler zwróci `404 Not Found`.
- **Błąd serwera (500):** Wszelkie inne, nieoczekiwane błędy (np. problemy z połączeniem z bazą danych) zostaną przechwycone w bloku `try...catch`, zalogowane, a klient otrzyma odpowiedź `500 Internal Server Error`.

## 8. Rozważania dotyczące wydajności

- Operacja `UPDATE` na pojedynczym wierszu przy użyciu klucza głównego (`id`) jest wysoce wydajna, ponieważ kolumna ta jest domyślnie indeksowana.
- Polityki RLS mogą wprowadzić niewielki narzut na zapytania, ale jest on zazwyczaj minimalny i akceptowalny w zamian za gwarancje bezpieczeństwa.

## 9. Etapy wdrożenia

1.  **Utworzenie pliku punktu końcowego:** Stwórz nowy plik `src/pages/api/v1/list-items/[itemId].ts`.
2.  **Definicja walidatora:** W pliku `src/lib/validators/list.validator.ts` dodaj nowy eksport `updateListItemSchema`, używając `zod`. Wszystkie pola powinny być opcjonalne (`.optional()`).
    ```typescript
    export const updateListItemSchema = z.object({
      name: z.string().min(1).optional(),
      quantity: z.number().positive().optional(),
      unit: z.string().min(1).optional(),
      is_checked: z.boolean().optional(),
    });
    ```
3.  **Implementacja logiki serwisowej:** W pliku `src/services/list.service.ts` dodaj nową metodę `updateListItem`.
    - Metoda powinna przyjmować `itemId: string` i `data: UpdateListItemCommand`.
    - Wykona zapytanie `supabase.from('list_items').update(data).eq('id', itemId).select().single()`.
    - RLS zajmie się autoryzacją. Jeśli `error` zostanie zwrócony (szczególnie błąd P0001 lub podobny wskazujący na brak wiersza), rzuć wyjątek, który zostanie zmapowany na 404.
4.  **Implementacja handlera `PATCH`:** W pliku `[itemId].ts` zaimplementuj `export const PATCH: APIRoute = async ({ params, request, locals }) => { ... }`.
    - Sprawdź, czy `locals.user` istnieje.
    - Pobierz `itemId` z `params`.
    - Zwaliduj ciało żądania za pomocą `updateListItemSchema`.
    - Wywołaj `listService.updateListItem`.
    - Obsłuż potencjalne błędy i zwróć odpowiednie kody statusu.
    - W przypadku sukcesu, zwróć zaktualizowany obiekt z kodem `200 OK`.
