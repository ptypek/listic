# API Endpoint Implementation Plan: GET /products/search

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia wyszukiwanie produktów w tabeli `popular_products`. Został zaprojektowany w celu zasilania komponentu autouzupełniania w interfejsie użytkownika, pozwalając użytkownikom na szybkie znajdowanie i dodawanie popularnych produktów do swoich list zakupów. Punkt końcowy wymaga uwierzytelnienia.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/products/search`
- **Parametry**:
  - **Wymagane**:
    - `q` (string): Wyszukiwana fraza do dopasowania nazw produktów. Musi mieć co najmniej 1 znak.
  - **Opcjonalne**: Brak
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **DTO**: `PopularProductDto`
  ```typescript
  // src/types.ts
  export type PopularProductDto = Pick<Tables<'popular_products'>, 'id' | 'name' | 'category_id'>;
  ```
- **Modele walidacji (Zod)**:
  ```typescript
  // src/pages/api/v1/products/search.ts
  import { z } from 'zod';

  const SearchQuerySchema = z.object({
    q: z.string().min(1, { message: "Query parameter 'q' is required and must not be empty." })
  });
  ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca tablicę obiektów `PopularProductDto`.
  ```json
  [
    { "id": "uuid-1", "name": "Milk", "category_id": 1 },
    { "id": "uuid-2", "name": "Millet", "category_id": 4 }
  ]
  ```
- **Odpowiedzi błędów**:
  - **400 Bad Request**: Gdy parametr `q` jest brakujący, pusty lub nie przejdzie walidacji.
    ```json
    { "error": "Query parameter 'q' is required and must not be empty." }
    ```
  - **401 Unauthorized**: Gdy użytkownik nie jest uwierzytelniony. Odpowiedź jest zarządzana przez middleware.
    ```json
    { "error": "User is not authenticated." }
    ```
  - **500 Internal Server Error**: W przypadku nieoczekiwanego błędu serwera.
    ```json
    { "error": "An internal server error occurred." }
    ```

## 5. Przepływ danych
1. Klient wysyła żądanie `GET` do `/api/v1/products/search?q=<termin>`.
2. Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje sesję użytkownika i wstrzykuje klienta Supabase do `context.locals`. Jeśli użytkownik nie jest uwierzytelniony, middleware zwraca błąd `401 Unauthorized`.
3. Handler API w `src/pages/api/v1/products/search.ts` otrzymuje żądanie.
4. Parametr zapytania `q` jest walidowany przy użyciu schematu Zod `SearchQuerySchema`. W przypadku niepowodzenia walidacji zwracany jest błąd `400 Bad Request`.
5. Handler wywołuje funkcję `searchPopularProducts` z nowo utworzonego serwisu `product.service.ts`, przekazując klienta Supabase i zweryfikowany termin wyszukiwania.
6. Funkcja `searchPopularProducts` wykonuje zapytanie do tabeli `popular_products` w bazie danych Supabase, używając metody `.ilike()` do wyszukiwania bez uwzględniania wielkości liter. Zapytanie jest ograniczone do 10 wyników w celu zapewnienia wydajności.
7. Serwis zwraca tablicę pasujących produktów (lub pustą tablicę) do handlera API.
8. Handler API serializuje wynik do formatu JSON i wysyła go z powrotem do klienta z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony do uwierzytelnionych użytkowników. Jest to egzekwowane zarówno przez politykę RLS w bazie danych PostgreSQL (`USING (auth.role() = 'authenticated')` na tabeli `popular_products`), jak i przez middleware Astro, który sprawdza aktywną sesję użytkownika.
- **Autoryzacja**: Każdy uwierzytelniony użytkownik ma uprawnienia do wyszukiwania produktów. Nie ma dodatkowej logiki autoryzacji opartej na rolach.
- **Walidacja danych wejściowych**: Parametr `q` jest rygorystycznie walidowany przy użyciu `zod`, aby zapobiec nieprawidłowym lub złośliwym danym wejściowym.
- **SQL Injection**: Ryzyko jest minimalizowane przez użycie metod z Supabase SDK (`.ilike()`), które parametryzują zapytania, zapobiegając atakom typu SQL injection.

## 7. Rozważania dotyczące wydajności
- **Zapytanie do bazy danych**: Aby zapewnić szybką odpowiedź, zapytanie do bazy danych jest ograniczone do maksymalnie 10 wyników za pomocą `.limit(10)`.
- **Indeksowanie**: Tabela `popular_products` powinna mieć indeks na kolumnie `name`, aby przyspieszyć operacje wyszukiwania tekstowego. Chociaż domyślnie nie jest to konieczne dla małych tabel, warto to rozważyć w przyszłości. Plan bazy danych (`db-plan.MD`) już zawiera indeksy dla kluczy obcych, co jest dobrą praktyką.
- **Rozmiar odpowiedzi**: Zwracany obiekt `PopularProductDto` zawiera tylko niezbędne pola (`id`, `name`, `category_id`), co minimalizuje rozmiar odpowiedzi.

## 8. Etapy wdrożenia
1. **Utworzenie pliku serwisu**:
   - Utwórz nowy plik `src/services/product.service.ts`.
   - Zaimplementuj w nim funkcję `searchPopularProducts(supabase: SupabaseClient, searchTerm: string): Promise<PopularProductDto[]>`.
   - Funkcja powinna używać `supabase.from('popular_products').select('id, name, category_id').ilike('name', `%${searchTerm}%').limit(10)` do pobierania danych.
   - Dodaj obsługę błędów na wypadek niepowodzenia zapytania do bazy danych.

2. **Utworzenie pliku endpointu API**:
   - Utwórz nowy plik `src/pages/api/v1/products/search.ts`.
   - Zgodnie z `astro.mdc`, dodaj `export const prerender = false;`.

3. **Implementacja handlera GET**:
   - W `src/pages/api/v1/products/search.ts` zaimplementuj handler `GET({ request, locals }: APIContext)`.
   - Pobierz klienta Supabase z `locals.supabase`.
   - Wyodrębnij parametr `q` z URL zapytania.

4. **Dodanie walidacji**:
   - Zdefiniuj schemat `SearchQuerySchema` przy użyciu `zod`.
   - Sparsuj i zwaliduj parametr `q`. W przypadku błędu zwróć odpowiedź `400 Bad Request` z odpowiednim komunikatem.

5. **Wywołanie serwisu i zwrócenie odpowiedzi**:
   - Wywołaj funkcję `searchPopularProducts` z serwisu `product.service.ts`.
   - Obsłuż potencjalne błędy zwrócone przez serwis i odpowiedz kodem `500 Internal Server Error`.
   - Jeśli wszystko pójdzie pomyślnie, zwróć pobrane dane z kodem statusu `200 OK`.

6. **Aktualizacja middleware (jeśli konieczne)**:
   - Sprawdź, czy ścieżka `/api/v1/products/search` jest chroniona przez middleware w `src/middleware/index.ts`. Jeśli nie, dodaj ją do chronionych ścieżek, aby zapewnić, że tylko uwierzytelnieni użytkownicy mogą uzyskać do niej dostęp.

7. **Dokumentacja (opcjonalnie)**:
   - Zaktualizuj dokumentację API (np. w Postmanie lub Swaggerze), aby odzwierciedlić nowy punkt końcowy, jego parametry i odpowiedzi.