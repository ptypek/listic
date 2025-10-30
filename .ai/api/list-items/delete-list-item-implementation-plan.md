# API Endpoint Implementation Plan: DELETE /list-items/{itemId}

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za trwałe usunięcie pojedynczej pozycji (`list_item`) z listy zakupów. Operacja jest dostępna tylko dla uwierzytelnionego użytkownika, który jest właścicielem listy zawierającej daną pozycję. Usunięcie pozycji jest ostateczne.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/v1/list-items/{itemId}`
- **Parametry:**
  - **Wymagane:**
    - `itemId` (parametr ścieżki): Identyfikator UUID pozycji na liście, która ma zostać usunięta.
  - **Opcjonalne:** Brak
- **Request Body:** Brak

## 3. Wykorzystywane typy

Implementacja nie wymaga tworzenia nowych typów DTO ani Command Models. Będziemy operować na typach podstawowych (string dla `itemId`) oraz istniejących typach sesji użytkownika.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu:**
  - **Kod stanu:** `204 No Content`
  - **Ciało odpowiedzi:** Brak
- **Odpowiedzi błędów:**
  - **Kod stanu:** `400 Bad Request` (gdy `itemId` nie jest prawidłowym UUID)
  - **Kod stanu:** `401 Unauthorized` (gdy użytkownik nie jest zalogowany)
  - **Kod stanu:** `404 Not Found` (gdy pozycja o podanym `itemId` nie istnieje lub użytkownik nie ma do niej dostępu)
  - **Kod stanu:** `500 Internal Server Error` (w przypadku nieoczekiwanych błędów serwera)

## 5. Przepływ danych

1.  Żądanie `DELETE` trafia do handlera API w Astro pod adresem `src/pages/api/v1/list-items/[itemId].ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje istnienie aktywnej sesji użytkownika. Jeśli sesja nie istnieje, zwraca `401 Unauthorized`.
3.  Handler API wyodrębnia `itemId` z parametrów ścieżki (`Astro.params`).
4.  `itemId` jest walidowany przy użyciu `zod`, aby upewnić się, że jest to prawidłowy UUID. W przypadku błędu walidacji zwracany jest `400 Bad Request`.
5.  Handler wywołuje metodę serwisową, np. `listService.deleteListItem(itemId, userId)`, przekazując `itemId` oraz ID zalogowanego użytkownika pobrane z `Astro.locals.session.user.id`.
6.  Metoda serwisowa konstruuje i wykonuje zapytanie `DELETE` do tabeli `list_items` przy użyciu klienta Supabase.
7.  Zapytanie `DELETE` musi zawierać warunek `WHERE` filtrujący zarówno po `id` pozycji, jak i po `user_id` właściciela listy, do której pozycja należy. Jest to zgodne z polityką RLS zdefiniowaną w `db-plan.MD` i stanowi dodatkową warstwę zabezpieczeń na poziomie aplikacji.
8.  Serwis analizuje wynik operacji `delete`:
    - Jeśli operacja zakończyła się sukcesem i usunięto jeden wiersz (`count === 1`), oznacza to, że pozycja istniała i należała do użytkownika. Serwis kończy działanie.
    - Jeśli operacja zakończyła się sukcesem, ale nie usunięto żadnego wiersza (`count === 0`), oznacza to, że pozycja o danym `itemId` nie istnieje lub nie należy do tego użytkownika. W takim przypadku serwis rzuca błąd, który handler API mapuje na `404 Not Found`.
9.  Handler API zwraca odpowiedni kod stanu HTTP do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Dostęp do punktu końcowego musi być chroniony. Middleware Astro jest odpowiedzialne za weryfikację tokenu sesji i odrzucenie żądań od nieuwierzytelnionych użytkowników.
- **Autoryzacja:** Kluczowym wymogiem jest zapewnienie, że użytkownik może usunąć tylko te pozycje, które należą do jego list zakupów. Zostanie to osiągnięte poprzez:
  1.  **Politykę RLS (Row Level Security) w PostgreSQL:** Zdefiniowana polityka na tabeli `list_items` automatycznie filtruje operacje, zezwalając na dostęp tylko do wierszy powiązanych z `user_id` zalogowanego użytkownika.
  2.  **Jawną weryfikację w zapytaniu:** Zapytanie `DELETE` w warstwie serwisowej będzie jawnie zawierać warunek sprawdzający `user_id`, co zapobiega próbom usunięcia cudzych zasobów i pozwala na zwrócenie precyzyjnego błędu `404`.
- **Walidacja danych wejściowych:** Parametr `itemId` musi być walidowany jako UUID, aby zapobiec błędom zapytań do bazy danych i potencjalnym atakom (np. SQL Injection, chociaż Supabase ORM temu przeciwdziała).

## 7. Rozważania dotyczące wydajności

- Operacja `DELETE` na tabeli `list_items` będzie wykonywana z użyciem klucza głównego (`id`), który jest domyślnie indeksowany.
- Zapytanie będzie również filtrować po `user_id` powiązanym przez tabelę `shopping_lists`. Indeksy na kluczach obcych (`list_items.list_id` i `shopping_lists.user_id`) zapewnią wysoką wydajność tej operacji.
- Przy normalnym obciążeniu nie przewiduje się żadnych wąskich gardeł wydajnościowych.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku handlera API:**
    - Stwórz nowy plik: `src/pages/api/v1/list-items/[itemId].ts`.
2.  **Implementacja handlera `DELETE`:**
    - W pliku `[itemId].ts` zaimplementuj `export async function DELETE({ params, locals }: APIContext)`.
    - Pobierz `session` z `locals`. Jeśli `!session`, zwróć `401`.
    - Zwaliduj `params.itemId` przy użyciu `zod.string().uuid()`. W razie błędu zwróć `400`.
3.  **Rozszerzenie serwisu `ListService`:**
    - W pliku `src/services/list.service.ts` dodaj nową metodę asynchroniczną `deleteListItem`.
    - Metoda powinna przyjmować `itemId: string` i `userId: string`.
4.  **Implementacja logiki usuwania w serwisie:**
    - W `deleteListItem` użyj klienta Supabase (`this.supabase`), aby wykonać zapytanie `delete()` na tabeli `list_items`.
    - Zapytanie musi znaleźć listę (`shopping_lists`) należącą do `userId`, a następnie usunąć `list_item` o podanym `itemId` należący do tej listy.
    - **Przykład zapytania:**

      ```typescript
      // Logika do weryfikacji, czy item należy do usera
      const { data: itemData, error: selectError } = await this.supabase
        .from("list_items")
        .select("*, shopping_lists(user_id)")
        .eq("id", itemId)
        .single();

      if (selectError || !itemData || itemData.shopping_lists.user_id !== userId) {
        // Rzuć błąd, który zostanie zmapowany na 404
        throw new Error("Item not found or access denied");
      }

      const { error: deleteError } = await this.supabase.from("list_items").delete().eq("id", itemId);

      if (deleteError) {
        // Rzuć błąd, który zostanie zmapowany na 500
        throw new Error("Failed to delete item");
      }
      ```

5.  **Połączenie handlera z serwisem:**
    - W handlerze `DELETE` wywołaj `listService.deleteListItem` w bloku `try...catch`.
    - W przypadku sukcesu zwróć `new Response(null, { status: 204 })`.
    - W bloku `catch` obsłuż błędy rzucone przez serwis i zwróć odpowiednie kody stanu (`404` lub `500`).
