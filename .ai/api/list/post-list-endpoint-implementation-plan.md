# API Endpoint Implementation Plan: POST /api/v1/lists

## 1. Przegląd punktu końcowego

Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom tworzenia nowej, pustej listy zakupów. Endpoint przyjmuje nazwę listy w ciele żądania, tworzy odpowiedni wpis w tabeli `shopping_lists` w bazie danych i zwraca pełny obiekt nowo utworzonej listy.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/v1/lists`
- **Ciało żądania (Request Body):**
  - **Typ zawartości:** `application/json`
  - **Struktura:**
    ```json
    {
      "name": "Moja nowa lista"
    }
    ```
- **Parametry:**
  - **Wymagane:**
    - `name` (w ciele żądania): `string`, musi zawierać co najmniej 1 znak.
  - **Opcjonalne:** Brak.

## 3. Wykorzystywane typy

- **Model polecenia (wejście):** `CreateShoppingListCommand` (`Pick<TablesInsert<'shopping_lists'>, 'name'>`) z `src/types.ts`.
- **DTO (wyjście):** `ShoppingListDto` (`Tables<'shopping_lists'>`) z `src/types.ts`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):**
  - Zwraca nowo utworzony obiekt listy zakupów.
  - **Struktura:**
    ```json
    {
      "id": "c3e4b5a6-1d2f-3c4b-5a6d-7e8f9a0b1c2d",
      "user_id": "a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
      "name": "Moja nowa lista",
      "created_at": "2023-10-27T10:00:00Z",
      "updated_at": "2023-10-27T10:00:00Z"
    }
    ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Gdy dane wejściowe są nieprawidłowe (np. brak pola `name` lub jest ono puste).
  - `401 Unauthorized`: Gdy użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: W przypadku nieoczekiwanego błędu serwera lub bazy danych.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do endpointu Astro `src/pages/api/v1/lists/index.ts`.
2.  Middleware Astro weryfikuje token JWT użytkownika. Jeśli jest nieprawidłowy, zwraca `401`. Jeśli jest prawidłowy, dane użytkownika i instancja Supabase są dostępne w `context.locals`.
3.  Handler `POST` odczytuje ciało żądania.
4.  Schemat `zod` waliduje ciało żądania. W przypadku błędu walidacji, zwracany jest błąd `400`.
5.  Z `context.locals.user` pobierane jest `id` zalogowanego użytkownika.
6.  Wywoływana jest metoda `.insert()` klienta Supabase w celu dodania nowego wiersza do tabeli `shopping_lists`. Wstawiany obiekt zawiera `name` z żądania oraz `user_id` zalogowanego użytkownika.
7.  Jeśli operacja wstawiania do bazy danych zakończy się błędem, jest on przechwytywany i zwracany jest błąd `500`.
8.  Jeśli operacja się powiedzie, baza danych zwraca nowo utworzony rekord (dzięki `.select().single()`).
9.  Endpoint zwraca odpowiedź `201 Created` z danymi nowej listy w formacie `ShoppingListDto`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint musi być chroniony i dostępny wyłącznie dla zalogowanych użytkowników. Zostanie to zapewnione przez middleware Astro, które sprawdzi obecność i ważność tokena JWT w nagłówku `Authorization`.
- **Autoryzacja:** Logika endpointu musi zapewnić, że `user_id` dla nowej listy jest pobierane z sesji zalogowanego użytkownika (`context.locals.user.id`), a nie z ciała żądania. Zapobiega to podszywaniu się pod innych użytkowników. Zasady RLS na tabeli `shopping_lists` dodatkowo to zabezpieczają.
- **Walidacja danych wejściowych:** Użycie biblioteki `zod` do walidacji pola `name` zapobiegnie wstawianiu do bazy danych nieprawidłowych lub pustych wartości.
- **Ochrona przed SQL Injection:** Użycie klienta `supabase-js` zapewnia parametryzację zapytań, co jest standardową i skuteczną ochroną przed atakami typu SQL Injection.

## 7. Rozważania dotyczące wydajności

- Operacja polega na pojedynczym zapytaniu `INSERT` do bazy danych, które jest bardzo szybkie i wydajne.
- Wąskie gardła wydajnościowe nie są przewidywane dla tego konkretnego punktu końcowego przy normalnym obciążeniu.
- Indeks na kluczu podstawowym `id` oraz na kluczu obcym `user_id` (który jest tworzony automatycznie) zapewnia optymalną wydajność operacji na tabeli `shopping_lists`.

## 8. Etapy wdrożenia

1.  **Utworzenie pliku endpointu:** Stwórz plik `src/pages/api/v1/lists/index.ts`.
2.  **Dodanie boilerplate'u:** W pliku `index.ts` dodaj podstawową strukturę endpointu Astro, w tym `export const prerender = false;` oraz handler dla metody `POST`.

    ```typescript
    import type { APIRoute } from "astro";

    export const POST: APIRoute = async ({ request, locals }) => {
      // ... implementacja
    };
    ```

3.  **Implementacja logiki uwierzytelniania:** W handlerze `POST` dodaj sprawdzenie, czy `locals.user` istnieje. Jeśli nie, zwróć odpowiedź `401 Unauthorized`.
4.  **Zdefiniowanie schematu walidacji:** Stwórz schemat `zod` do walidacji ciała żądania.

    ```typescript
    import { z } from "zod";

    const CreateListSchema = z.object({
      name: z.string({ required_error: "Name is required." }).min(1, { message: "Name cannot be empty." }),
    });
    ```

5.  **Implementacja walidacji:** W handlerze `POST` odczytaj ciało żądania, a następnie użyj `CreateListSchema.safeParse()` do jego walidacji. W przypadku błędu zwróć odpowiedź `400 Bad Request` z informacjami o błędach.
6.  **Implementacja logiki biznesowej:**
    - Pobierz `supabase` z `locals`.
    - Pobierz `user.id` z `locals`.
    - Wywołaj `supabase.from('shopping_lists').insert({ name: validatedData.name, user_id: user.id }).select().single()`.
7.  **Obsługa błędów bazy danych:** Opakuj wywołanie Supabase w blok `try...catch` lub sprawdź pole `error` w odpowiedzi od Supabase. W przypadku błędu, zaloguj go i zwróć `500 Internal Server Error`.
8.  **Zwrócenie odpowiedzi sukcesu:** Jeśli operacja się powiedzie, zwróć odpowiedź `201 Created` z danymi nowej listy (`data`) w ciele odpowiedzi.
9.  **Dodanie testów (opcjonalnie):** Utwórz testy integracyjne, które sprawdzą wszystkie scenariusze: pomyślne utworzenie, brak uwierzytelnienia, nieprawidłowe dane wejściowe.
