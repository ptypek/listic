# API Endpoint Implementation Plan: GET /lists/{listId}

## 1. Przegląd punktu końcowego
Ten punkt końcowy REST API służy do pobierania pojedynczej listy zakupów wraz ze wszystkimi jej pozycjami. Dostęp jest ograniczony do uwierzytelnionego użytkownika, który jest właścicielem listy. Zapewnia to prywatność i bezpieczeństwo danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/lists/{listId}`
- **Parametry**:
  - **Wymagane**:
    - `listId` (path parameter): Identyfikator UUID listy zakupów, która ma zostać pobrana.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **`GetListParams`** (Zod Schema): Do walidacji parametru `listId`.
  ```typescript
  // src/lib/validators/list.validator.ts
  import { z } from 'zod';
  export const getListValidator = z.object({
    listId: z.string().uuid(),
  });
  ```
- **`ListWithItems`** (DTO): Obiekt odpowiedzi zawierający dane listy i zagnieżdżoną tablicę pozycji.
  ```typescript
  // src/types.ts
  import { Tables } from './db/database.types';
  
  export type ListItem = Tables<'list_items'>;
  export type List = Tables<'lists'>;
  
  export type ListWithItems = List & {
    items: ListItem[];
  };
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt JSON `ListWithItems`.
  ```json
  {
    "id": "uuid-goes-here",
    "user_id": "user-uuid-goes-here",
    "name": "Weekly Groceries",
    "created_at": "2025-10-26T10:00:00Z",
    "updated_at": "2025-10-26T12:00:00Z",
    "items": [
      {
        "id": "item-uuid-1",
        "list_id": "uuid-goes-here",
        "category_id": 1,
        "name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "is_checked": false,
        "source": "manual",
        "created_at": "2025-10-26T10:05:00Z",
        "updated_at": "2025-10-26T11:30:00Z"
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `listId` nie jest prawidłowym UUID.
  - `401 Unauthorized`: Jeśli użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Jeśli lista nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: W przypadku problemów z bazą danych lub innych błędów serwera.

## 5. Przepływ danych
1.  Żądanie `GET` trafia do pliku dynamicznej trasy Astro: `src/pages/api/v1/lists/[listId].ts`.
2.  Middleware (`src/middleware/index.ts`) weryfikuje sesję użytkownika. Jeśli sesja jest nieprawidłowa, zwraca `401 Unauthorized`.
3.  Handler API wyodrębnia `listId` z `Astro.params`.
4.  Parametr `listId` jest walidowany przy użyciu schematu `getListValidator` z biblioteki Zod. W przypadku błędu zwracany jest status `400 Bad Request`.
5.  Handler wywołuje metodę `getListById(listId, userId)` z serwisu `src/services/list.service.ts`, przekazując zweryfikowany `listId` oraz `userId` pobrany z `Astro.locals.session`.
6.  Metoda `getListById` wykonuje zapytanie do Supabase, aby pobrać listę i zagnieżdżone pozycje (`items`):
    ```sql
    SELECT *, items:list_items(*) 
    FROM lists 
    WHERE id = {listId} AND user_id = {userId}
    LIMIT 1;
    ```
7.  Jeśli zapytanie zwróci dane, serwis mapuje je na obiekt `ListWithItems` i zwraca do handlera.
8.  Jeśli zapytanie nie zwróci danych (lista nie istnieje lub należy do innego użytkownika), serwis zwraca `null`.
9.  Handler API sprawdza wynik z serwisu:
    - Jeśli otrzymał obiekt `ListWithItems`, zwraca go w odpowiedzi z kodem `200 OK`.
    - Jeśli otrzymał `null`, zwraca odpowiedź z kodem `404 Not Found`.
10. W przypadku błędu bazy danych, serwis przechwytuje wyjątek, loguje go, a handler zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Middleware Astro jest odpowiedzialne za weryfikację tokenu JWT i zapewnienie, że tylko uwierzytelnieni użytkownicy mogą uzyskać dostęp do tego endpointu.
- **Autoryzacja**: Kluczowym mechanizmem autoryzacji jest filtrowanie zapytań do bazy danych po `user_id` zalogowanego użytkownika. Zapytanie musi zawierać klauzulę `WHERE user_id = {session.user.id}`, aby zapobiec wyciekowi danych i atakom typu IDOR.
- **Walidacja wejścia**: Walidacja `listId` jako UUID chroni bazę danych przed nieprawidłowymi formatami zapytań.

## 7. Obsługa błędów
- **Błąd walidacji (400)**: Zwracany, gdy `listId` nie jest prawidłowym UUID. Odpowiedź będzie zawierać komunikat błędu z Zod.
- **Brak autoryzacji (401)**: Zwracany przez middleware, gdy brak jest ważnej sesji użytkownika.
- **Nie znaleziono zasobu (404)**: Zwracany, gdy lista o podanym `listId` nie istnieje lub nie należy do danego użytkownika. Odpowiedź jest celowo taka sama w obu przypadkach, aby nie ujawniać informacji o istnieniu zasobów.
- **Błąd serwera (500)**: Wszelkie błędy podczas wykonywania zapytania do bazy danych lub inne nieprzewidziane wyjątki będą przechwytywane, logowane i zwracany będzie ogólny błąd serwera.

## 8. Rozważania dotyczące wydajności
- **Zapytanie do bazy danych**: Użycie jednego zapytania do pobrania zarówno listy, jak i jej pozycji (zagnieżdżenie) jest wydajniejsze niż wykonywanie dwóch oddzielnych zapytań.
- **Indeksowanie**: Tabela `lists` musi mieć indeks na kolumnach `id` i `user_id`. Tabela `list_items` musi mieć indeks na `list_id`. Supabase domyślnie tworzy indeksy dla kluczy głównych i obcych, co powinno być wystarczające.

## 9. Etapy wdrożenia
1.  **Aktualizacja walidatora**: Dodać `getListValidator` do pliku `src/lib/validators/list.validator.ts`.
2.  **Utworzenie pliku trasy API**: Stworzyć nowy plik `src/pages/api/v1/lists/[listId].ts`.
3.  **Implementacja handlera API**:
    - W pliku `[listId].ts` zaimplementować `GET` handler.
    - Dodać logikę do odczytu `listId` z `Astro.params`.
    - Zintegrować walidację `listId` za pomocą Zod.
    - Dodać obsługę sesji użytkownika z `Astro.locals`.
    - Zaimplementować wywołanie do `list.service`.
    - Dodać obsługę odpowiedzi sukcesu (200) i błędów (404, 500).
4.  **Rozbudowa serwisu `list.service`**:
    - W pliku `src/services/list.service.ts` dodać nową metodę asynchroniczną `getListById(listId: string, userId: string): Promise<ListWithItems | null>`.
    - Zaimplementować w niej zapytanie do Supabase, używając `.select()` z zagnieżdżeniem i filtrowaniem po `id` oraz `user_id`.
    - Dodać obsługę błędów zapytania do bazy danych.
5.  **Testowanie**:
    - Dodać testy jednostkowe dla nowej metody w serwisie `list.service`.
    - Dodać testy integracyjne dla endpointu `GET /api/v1/lists/{listId}`, obejmujące przypadki sukcesu, braku autoryzacji, nieznalezionego zasobu i nieprawidłowego ID.
6.  **Dokumentacja**: Zaktualizować dokumentację API (np. w Postmanie lub Swaggerze), jeśli projekt takiej używa.
