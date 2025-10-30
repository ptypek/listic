# API Endpoint Implementation Plan: GET /categories

## 1. Przegląd punktu końcowego

Ten punkt końcowy jest odpowiedzialny za dostarczanie listy predefiniowanych kategorii produktów. Jest to publicznie dostępny zasób, który nie wymaga uwierzytelniania i służy jako statyczna tabela przeglądowa dla aplikacji klienckiej.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/categories`
- **Parametry**:
  - **Wymagane**: Brak
  - **Opcjonalne**: Brak
- **Request Body**: Brak

## 3. Wykorzystywane typy

### DTO

- **CategoryDTO**: Reprezentuje pojedynczą kategorię w odpowiedzi API.
  ```typescript
  interface CategoryDTO {
    id: number;
    name: string;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Success (200 OK)**: Zwraca tablicę obiektów `CategoryDTO`.
  ```json
  [
    { "id": 1, "name": "Nabiał" },
    { "id": 2, "name": "Warzywa" },
    { "id": 3, "name": "Mięso" },
    { "id": 4, "name": "Suche" },
    { "id": 5, "name": "Owoce" },
    { "id": 6, "name": "Ryby" },
    { "id": 7, "name": "Przyprawy" },
    { "id": 8, "name": "Inne" }
  ]
  ```
- **Error (500 Internal Server Error)**: Zwracany w przypadku problemów z serwerem lub bazą danych.
  ```json
  {
    "error": "Internal Server Error",
    "message": "An unexpected error occurred."
  }
  ```

## 5. Przepływ danych

1. Klient wysyła żądanie `GET` na adres `/api/v1/categories`.
2. Router Astro przechwytuje żądanie i kieruje je do odpowiedniego handlera w `src/pages/api/v1/categories/index.ts`.
3. Handler wywołuje metodę `getCategories()` z `category.service.ts`.
4. Metoda `getCategories()` wykonuje zapytanie do tabeli `categories` w bazie danych Supabase, aby pobrać wszystkie rekordy.
5. Serwis zwraca listę kategorii do handlera.
6. Handler serializuje dane do formatu JSON i wysyła odpowiedź HTTP ze statusem `200 OK`.
7. W przypadku błędu na którymkolwiek etapie po stronie serwera, handler przechwytuje wyjątek, loguje go i zwraca odpowiedź ze statusem `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Punkt końcowy jest publiczny i nie wymaga uwierzytelniania ani autoryzacji.
- **Walidacja danych**: Brak walidacji po stronie serwera, ponieważ żądanie nie przyjmuje żadnych danych wejściowych.
- **Ochrona przed atakami**: Dane są pobierane z bazy danych jako statyczna lista, co eliminuje ryzyko ataków typu SQL Injection poprzez parametry. Potencjalnym ryzykiem jest atak DoS, który w razie potrzeby można ograniczyć za pomocą mechanizmu rate limiting na poziomie infrastruktury.

## 7. Rozważania dotyczące wydajności

- **Zapytanie do bazy danych**: Zapytanie jest proste (`SELECT * FROM categories`) i operuje na małym, statycznym zbiorze danych (8 rekordów), więc jego wpływ na wydajność jest znikomy.
- **Buforowanie (Caching)**: Ze względu na statyczny charakter danych, można zaimplementować buforowanie po stronie serwera (np. w pamięci) lub na poziomie HTTP (za pomocą nagłówków `Cache-Control`), aby zminimalizować liczbę zapytań do bazy danych i przyspieszyć czas odpowiedzi. Na początkowym etapie nie jest to konieczne.

## 8. Etapy wdrożenia

1. **Migracja bazy danych**:
   - Utwórz nowy plik migracji SQL w `supabase/migrations/`.
   - W pliku migracji zdefiniuj tabelę `categories` z kolumnami `id` (primary key) i `name` (text, not null).
   - Dodaj 8 predefiniowanych rekordów kategorii do tabeli `categories` za pomocą polecenia `INSERT`.
2. **Aktualizacja typów Supabase**:
   - Uruchom komendę `npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > src/db/database.types.ts`, aby zaktualizować definicje typów TypeScript na podstawie nowego schematu bazy danych.
3. **Utworzenie serwisu**:
   - Stwórz nowy plik `src/services/category.service.ts`.
   - Zaimplementuj w nim funkcję `getCategories()`, która używa klienta Supabase do pobrania wszystkich rekordów z tabeli `categories`.
4. **Utworzenie punktu końcowego API**:
   - Stwórz plik `src/pages/api/v1/categories/index.ts`.
   - Zaimplementuj handler dla metody `GET`.
   - W handlerze zaimportuj i wywołaj funkcję `getCategories()` z serwisu.
   - Zwróć pobrane dane jako odpowiedź JSON ze statusem `200 OK`.
   - Dodaj obsługę błędów `try...catch` do zwracania odpowiedzi `500 Internal Server Error` w przypadku niepowodzenia.
