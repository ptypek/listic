# API Endpoint Implementation Plan: PATCH /lists/{listId}

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom aktualizację nazwy istniejącej listy zakupów. Użytkownik musi być właścicielem listy, aby móc ją zmodyfikować.

## 2. Szczegóły żądania

- **Metoda HTTP**: `PATCH`
- **Struktura URL**: `/api/v1/lists/{listId}`
- **Parametry**:
  - **Wymagane**:
    - `listId` (parametr ścieżki): Unikalny identyfikator (UUID) listy zakupów do zaktualizowania.
- **Request Body**:
  ```json
  {
    "name": "Nowa nazwa listy"
  }
  ```

  - `name` (string, wymagane): Nowa nazwa dla listy. Nie może być pustym ciągiem znaków.

## 3. Wykorzystywane typy

- **Command Model**: `UpdateShoppingListCommand` (z `src/types.ts`)
  ```typescript
  export type UpdateShoppingListCommand = Pick<TablesUpdate<"shopping_lists">, "name">;
  ```
- **Validation Schema**: `UpdateListValidator` (nowy, do utworzenia w `src/lib/validators/list.validator.ts`)

  ```typescript
  import { z } from "zod";

  export const UpdateListValidator = z.object({
    name: z.string().min(1, { message: "Nazwa listy nie może być pusta." }),
  });
  ```

- **View Model**: `ShoppingListDto` (z `src/types.ts`)

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK)**: Zwraca pełny obiekt zaktualizowanej listy zakupów.
  ```json
  {
    "id": "uuid-of-the-list",
    "user_id": "auth-user-uuid",
    "name": "Nowa nazwa listy",
    "created_at": "2025-10-26T10:00:00Z",
    "updated_at": "2025-10-29T15:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe dane wejściowe (np. pusta nazwa, nieprawidłowy format `listId`).
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Lista o podanym `listId` nie istnieje lub nie należy do uwierzytelnionego użytkownika.
  - `500 Internal Server Error`: Wystąpił błąd serwera.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do punktu końcowego `src/pages/api/v1/lists/[listId].ts`.
2.  Handler API pobiera `listId` z parametrów URL oraz treść żądania.
3.  **Uwierzytelnianie**: Handler wywołuje `Astro.locals.supabase.auth.getUser()`, aby sprawdzić, czy użytkownik jest zalogowany. W przypadku braku sesji zwraca `401`.
4.  **Walidacja**: Handler używa `UpdateListValidator` (Zod) do walidacji treści żądania. Jeśli walidacja się nie powiedzie, zwraca `400`. Sprawdza również, czy `listId` jest poprawnym UUID.
5.  **Wywołanie serwisu**: Handler wywołuje nową metodę `updateList` w `src/services/list.service.ts`, przekazując `listId`, zwalidowane dane (`name`) oraz `userId` zalogowanego użytkownika.
6.  **Logika biznesowa (Serwis)**: Metoda `updateList` konstruuje i wykonuje zapytanie do Supabase, aby zaktualizować listę w tabeli `shopping_lists`. Zapytanie zawiera klauzulę `WHERE`, która dopasowuje zarówno `id` listy, jak i `user_id`, co gwarantuje, że użytkownicy mogą modyfikować tylko własne listy.
7.  **Obsługa odpowiedzi z bazy danych**:
    - Jeśli zapytanie zaktualizuje jeden wiersz, serwis zwraca zaktualizowany obiekt listy.
    - Jeśli zapytanie nie zaktualizuje żadnego wiersza (co oznacza, że lista nie istnieje lub użytkownik nie jest jej właścicielem), serwis zwraca `null`.
8.  **Zwrócenie odpowiedzi**:
    - Jeśli serwis zwróci zaktualizowaną listę, handler API wysyła odpowiedź `200 OK` z obiektem listy.
    - Jeśli serwis zwróci `null`, handler API wysyła odpowiedź `404 Not Found`.
    - W przypadku innych błędów (np. błąd bazy danych), handler przechwytuje wyjątek i zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Punkt końcowy musi być chroniony i dostępny tylko dla zalogowanych użytkowników. Zostanie to zrealizowane poprzez sprawdzenie sesji użytkownika za pomocą `Astro.locals`.
- **Autoryzacja**: Kluczowym wymogiem jest uniemożliwienie użytkownikowi modyfikacji list, których nie jest właścicielem. Zostanie to osiągnięte poprzez filtrowanie zapytań do bazy danych po `user_id` zalogowanego użytkownika, co jest zgodne z polityką RLS (Row Level Security) zdefiniowaną w schemacie bazy danych.
- **Walidacja danych wejściowych**: Wszystkie dane wejściowe (`listId`, `name`) będą ściśle walidowane, aby zapobiec atakom typu SQL Injection, XSS i innym. Użycie Zod i ORM Supabase zapewnia odpowiednią ochronę.

## 7. Rozważania dotyczące wydajności

- Zapytanie aktualizujące będzie używać klucza podstawowego (`id`) i indeksowanego klucza obcego (`user_id`), co zapewnia wysoką wydajność operacji na bazie danych.
- Obciążenie punktu końcowego jest minimalne, więc nie przewiduje się problemów z wydajnością.

## 8. Etapy wdrożenia

1.  **Utworzenie walidatora**: W pliku `src/lib/validators/list.validator.ts` dodaj `UpdateListValidator` używając `zod` do walidacji pola `name`.
2.  **Rozszerzenie serwisu**: W pliku `src/services/list.service.ts` zaimplementuj nową metodę asynchroniczną `updateList(listId: string, data: UpdateShoppingListCommand, userId: string)`. Metoda ta powinna:
    - Wykonać zapytanie `update` do Supabase na tabeli `shopping_lists`.
    - Użyć `.eq('id', listId)` i `.eq('user_id', userId)` w zapytaniu.
    - Użyć `.select().single()` aby od razu zwrócić zaktualizowany wiersz.
    - Zwrócić zaktualizowany obiekt listy lub `null`, jeśli wystąpi błąd lub wiersz nie zostanie znaleziony.
3.  **Utworzenie pliku endpointu**: Stwórz nowy plik `src/pages/api/v1/lists/[listId].ts`.
4.  **Implementacja handlera PATCH**: W nowo utworzonym pliku:
    - Dodaj `export const prerender = false;`.
    - Zaimplementuj funkcję `export async function PATCH({ params, request, locals }: APIContext)`.
    - Pobierz i zweryfikuj sesję użytkownika.
    - Pobierz `listId` z `params` i sprawdź, czy jest to prawidłowy UUID.
    - Pobierz i zwaliduj ciało żądania za pomocą `UpdateListValidator`.
    - Wywołaj metodę `listService.updateList`.
    - Zwróć odpowiednią odpowiedź (`200`, `400`, `401`, `404`) w zależności od wyniku operacji.
    - Dodaj obsługę błędów `try...catch` dla nieoczekiwanych wyjątków, zwracając `500`.
