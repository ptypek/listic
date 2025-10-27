# API Endpoint Implementation Plan: POST /lists/generate-from-recipes

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie nowej listy zakupów poprzez przetwarzanie surowego tekstu z jednego lub więcej przepisów. Endpoint wykorzystuje zewnętrzną usługę AI (Openrouter.ai) do analizy przepisów, identyfikacji, kategoryzacji i agregacji składników, a następnie zapisuje wyniki jako nową listę zakupów w bazie danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/v1/lists/generate-from-recipes`
- **Parametry**: Brak parametrów URL.
- **Request Body**:
  ```json
  {
    "list_name": "string",
    "recipes": ["string"]
  }
  ```
  - `list_name`: Nazwa nowej listy zakupów.
  - `recipes`: Tablica ciągów znaków, gdzie każdy ciąg to jeden przepis.

## 3. Wykorzystywane typy
- **Command Model (Input)**: `GenerateListFromRecipesCommand`
  ```typescript
  export type GenerateListFromRecipesCommand = {
    list_name: string;
    recipes: string[];
  };
  ```
- **Validation Schema (Zod)**: `generateListFromRecipesSchema` (do utworzenia w `src/lib/validators/list.validator.ts`)
- **DTO (Output)**: `ShoppingListWithItemsDto`
  ```typescript
  export type ShoppingListWithItemsDto = ShoppingListDto & {
    items: ListItemDto[];
  };
  ```
- **AI Service Response (Intermediate)**: `AiServiceResponse`
  ```typescript
  export type AiServiceResponse = {
    items: AiGeneratedItem[];
  };
  ```

## 4. Szczegóły odpowiedzi
- **Success (201 Created)**: Zwraca pełny obiekt nowo utworzonej listy zakupów, włączając w to wszystkie jej pozycje.
  ```json
  {
    "id": "uuid-goes-here",
    "user_id": "user-uuid-goes-here",
    "name": "Dinner Party List",
    "created_at": "2025-10-27T10:00:00Z",
    "updated_at": "2025-10-27T10:00:00Z",
    "items": [
      {
        "id": "item-uuid-1",
        "list_id": "uuid-goes-here",
        "category_id": 1,
        "name": "flour",
        "quantity": 1.5,
        "unit": "cup",
        "is_checked": false,
        "source": "ai",
        "created_at": "2025-10-27T10:00:00Z",
        "updated_at": "2025-10-27T10:00:00Z"
      }
    ]
  }
  ```
- **Error**: Zwraca obiekt błędu z odpowiednim kodem statusu.
  ```json
  {
    "error": "Wiadomość o błędzie"
  }
  ```

## 5. Przepływ danych
1.  Żądanie `POST` trafia do endpointu Astro w `src/pages/api/v1/lists/generate-from-recipes.ts`.
2.  Middleware (`src/middleware/index.ts`) weryfikuje, czy użytkownik jest uwierzytelniony. Jeśli nie, zwraca `401 Unauthorized`.
3.  Handler endpointu (`POST`) waliduje ciało żądania przy użyciu schemy Zod `generateListFromRecipesSchema`. W przypadku błędu zwraca `400 Bad Request`.
4.  Handler wywołuje metodę `listService.generateListFromRecipes(data, locals.user.id)` przekazując zwalidowane dane oraz ID użytkownika z `Astro.locals`.
5.  Metoda w `ListService`:
    a. Konstruuje precyzyjny prompt dla modelu AI, zawierający przepisy oraz instrukcje dotyczące oczekiwanego formatu wyjściowego (JSON z `AiServiceResponse`).
    b. Wywołuje API Openrouter.ai z użyciem `fetch`, przekazując prompt i klucz API z `import.meta.env.OPENROUTER_API_KEY`.
    c. Obsługuje potencjalne błędy z AI API. Jeśli wywołanie się nie powiedzie, rzuca błąd, który zostanie złapany w handlerze i zwrócony jako `502 Bad Gateway`.
    d. Parsuje i waliduje odpowiedź JSON od AI. W przypadku niezgodności struktury rzuca błąd (`500 Internal Server Error`).
    e. Używa Supabase client (`locals.supabase`) do wykonania transakcji bazodanowej:
        i. Tworzy nowy wiersz w tabeli `shopping_lists` z `name` i `user_id`.
        ii. Dla każdego przedmiotu z odpowiedzi AI, tworzy nowy wiersz w tabeli `list_items`, ustawiając `list_id`, `name`, `quantity`, `unit`, `category_id` oraz `source` na `'ai'`.
    f. Pobiera z bazy danych nowo utworzoną listę wraz ze wszystkimi pozycjami.
    g. Zwraca pełny obiekt `ShoppingListWithItemsDto`.
6.  Handler endpointu otrzymuje obiekt listy i zwraca go do klienta z kodem statusu `201 Created`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint musi być chroniony i dostępny tylko dla zalogowanych użytkowników. Należy upewnić się, że middleware w `src/middleware/index.ts` obejmuje ścieżkę `/api/v1/lists/generate-from-recipes`.
- **Autoryzacja**: Dostęp do danych jest kontrolowany przez polityki RLS w PostgreSQL. Wszystkie operacje na bazie danych muszą być wykonywane w kontekście uwierzytelnionego użytkownika (`user_id`).
- **Walidacja danych wejściowych**: Użycie Zod do walidacji `list_name` i `recipes` zapobiega przetwarzaniu nieprawidłowych danych i potencjalnym błędom.
- **Zarządzanie kluczami API**: Klucz do Openrouter.ai musi być przechowywany w zmiennych środowiskowych (`.env`) jako `OPENROUTER_API_KEY` i nigdy nie może być ujawniony po stronie klienta.
- **Rate Limiting**: Należy rozważyć implementację mechanizmu ograniczania liczby żądań na poziomie middleware, aby zapobiec nadużyciom i nadmiernym kosztom związanym z usługą AI.

## 7. Obsługa błędów
- **400 Bad Request**: Zwracany, gdy ciało żądania nie przejdzie walidacji Zod (np. brak `list_name`, pusta tablica `recipes`).
- **401 Unauthorized**: Zwracany przez middleware, gdy użytkownik nie jest zalogowany.
- **500 Internal Server Error**: Zwracany w przypadku:
    - Błędu podczas transakcji z bazą danych Supabase.
    - Błędu parsowania odpowiedzi z usługi AI (gdy odpowiedź nie jest poprawnym JSON-em lub ma nieoczekiwaną strukturę).
    - Wystąpienia innego, nieprzewidzianego błędu po stronie serwera.
- **502 Bad Gateway**: Zwracany, gdy zewnętrzna usługa AI (Openrouter.ai) zwróci błąd (np. status 5xx, błąd sieci, timeout).

## 8. Rozważania dotyczące wydajności
- Głównym wąskim gardłem wydajnościowym będzie czas odpowiedzi zewnętrznego API AI. Operacja jest z natury asynchroniczna i może trwać kilka sekund.
- Klient powinien być przygotowany na oczekiwanie i wyświetlać odpowiedni stan ładowania (loading state).
- Transakcja bazodanowa (wstawianie listy i wielu pozycji) powinna być wydajna, ale jej czas wykonania jest pomijalny w porównaniu do wywołania AI.

## 9. Etapy wdrożenia
1.  **Walidator**: W pliku `src/lib/validators/list.validator.ts` dodać nową schemę `generateListFromRecipesSchema` używając Zod.
2.  **Zmienna środowiskowa**: Dodać `OPENROUTER_API_KEY` do pliku `.env.example` i `.env`.
3.  **Serwis**: W `src/services/list.service.ts` zaimplementować nową, asynchroniczną metodę `generateListFromRecipes(cmd: GenerateListFromRecipesCommand, userId: string, supabase: SupabaseClient)`.
    - Metoda ta będzie zawierać logikę komunikacji z AI i zapisu do bazy danych.
    - Należy starannie przygotować prompt systemowy, aby zapewnić spójne i poprawne wyniki od modelu językowego.
4.  **Endpoint API**: Utworzyć nowy plik `src/pages/api/v1/lists/generate-from-recipes.ts`.
    - Dodać `export const prerender = false;`.
    - Zaimplementować handler `export function POST({ request, locals })`, który będzie zarządzał całym procesem: walidacją, wywołaniem serwisu i obsługą błędów.
    - Upewnić się, że `locals.supabase` i `locals.user` są poprawnie przekazywane z middleware.
5.  **Middleware**: Sprawdzić plik `src/middleware/index.ts` i upewnić się, że nowa ścieżka API jest chroniona i wymaga uwierzytelnienia.
6.  **Testowanie**: Dokładnie przetestować endpoint pod kątem wszystkich scenariuszy sukcesu i błędów opisanych w sekcjach "Obsługa błędów" i "Szczegóły odpowiedzi".
