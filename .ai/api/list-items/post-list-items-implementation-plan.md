# API Endpoint Implementation Plan: POST /api/v1/list-items

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom ręczne dodawanie nowych pozycji do istniejącej listy zakupów. Po pomyślnym dodaniu, zwraca pełny obiekt nowo utworzonej pozycji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/v1/list-items`
- **Parametry**: Brak parametrów URL.
- **Request Body**: Ciało żądania musi być w formacie `application/json` i zawierać następujące pola:
  ```json
  {
    "list_id": "string (uuid)",
    "category_id": "number (integer)",
    "name": "string",
    "quantity": "number (optional, default: 1)",
    "unit": "string (optional, default: 'szt')"
  }
  ```

  - **Wymagane**: `list_id`, `category_id`, `name`
  - **Opcjonalne**: `quantity`, `unit`

## 3. Wykorzystywane typy

- **Command Model (Request)**: `AddListItemCommand` z `src/types.ts` posłuży do typowania danych wejściowych.
- **DTO (Response)**: `ListItemDto` z `src/types.ts` zostanie użyty do typowania danych w odpowiedzi na sukces.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (`201 Created`)**: Zwraca obiekt nowo utworzonej pozycji na liście.
  ```json
  {
    "id": "new-item-uuid",
    "list_id": "shopping-list-uuid",
    "category_id": 2,
    "name": "Tomatoes",
    "quantity": 5,
    "unit": "pcs",
    "is_checked": false,
    "source": "manual",
    "created_at": "2025-10-26T15:00:00Z",
    "updated_at": "2025-10-26T15:00:00Z"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Nieprawidłowe lub brakujące dane w ciele żądania.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `404 Not Found`: Podana lista (`list_id`) lub kategoria (`category_id`) nie istnieje.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do handlera API w pliku `src/pages/api/v1/list-items.ts`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje token JWT użytkownika i udostępnia sesję w `context.locals`. Jeśli użytkownik nie jest zalogowany, żądanie jest odrzucane.
3.  Handler API waliduje ciało żądania przy użyciu dedykowanego schematu `zod` z `src/lib/validators/list.validator.ts`. W przypadku błędu zwraca `400`.
4.  Handler wywołuje metodę `addListItem(command, userId)` z serwisu `src/services/list.service.ts`, przekazując zwalidowane dane oraz ID użytkownika z sesji.
5.  Metoda `addListItem` w serwisie wykonuje następujące operacje:
    a. Sprawdza, czy `category_id` istnieje w tabeli `categories`. Jeśli nie, rzuca błąd `NotFound`.
    b. Sprawdza, czy `list_id` istnieje w tabeli `shopping_lists` ORAZ czy należy do uwierzytelnionego użytkownika. Jeśli nie, rzuca błąd `NotFound`.
    c. Wykonuje operację `INSERT` na tabeli `list_items`, ustawiając `source` na `'manual'`.
    d. Zwraca nowo utworzony wiersz z bazy danych.
6.  Handler API odbiera dane z serwisu, tworzy odpowiedź `201 Created` z obiektem `ListItemDto` i wysyła ją do klienta.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do endpointu jest ograniczony do uwierzytelnionych użytkowników poprzez middleware Astro, które weryfikuje sesję Supabase.
- **Autoryzacja**: Autoryzacja jest zapewniona na dwóch poziomach:
  1.  **Warstwa aplikacji**: Serwis `list.service.ts` jawnie sprawdza, czy lista zakupów należy do zalogowanego użytkownika przed dodaniem do niej pozycji.
  2.  **Warstwa bazy danych**: Polityki Row Level Security (RLS) w PostgreSQL zapewniają, że operacje zapisu na tabeli `list_items` mogą być wykonywane tylko w kontekście list należących do danego `auth.uid()`.
- **Walidacja danych**: Użycie `zod` do walidacji ciała żądania chroni przed nieprawidłowymi danymi i potencjalnymi atakami (np. NoSQL/SQL injection, chociaż Supabase Client już parametryzuje zapytania).

## 7. Obsługa błędów

| Kod statusu | Przyczyna błędu                                                    | Sposób obsługi                                                                           |
| :---------- | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `400`       | Błąd walidacji `zod` (brakujące pole, zły typ danych).             | Handler API zwraca odpowiedź z komunikatem o błędzie z `zod`.                            |
| `401`       | Brak lub nieprawidłowy token sesji.                                | Middleware Astro automatycznie zwróci odpowiedź `401`.                                   |
| `404`       | `list_id` nie istnieje lub nie należy do użytkownika.              | Serwis rzuca dedykowany błąd, który handler API mapuje na `404`.                         |
| `404`       | `category_id` nie istnieje.                                        | Serwis rzuca dedykowany błąd, który handler API mapuje na `404`.                         |
| `500`       | Błąd połączenia z bazą danych lub inny nieoczekiwany błąd serwera. | Handler API przechwytuje błąd, loguje go do konsoli i zwraca generyczną odpowiedź `500`. |

## 8. Rozważania dotyczące wydajności

- Operacja polega na dwóch prostych zapytaniach `SELECT` (sprawdzenie kategorii i listy) oraz jednym `INSERT`.
- Istniejące indeksy na kluczach obcych (`list_id`, `category_id`) zapewnią wysoką wydajność zapytań.
- Przy oczekiwanym obciążeniu, nie przewiduje się problemów z wydajnością.

## 9. Etapy wdrożenia

1.  **Walidator**: W pliku `src/lib/validators/list.validator.ts` dodać nowy eksportowany schemat `zod` o nazwie `addListItemSchema`, który będzie walidował ciało żądania zgodnie z `AddListItemCommand`.
2.  **Serwis**: W pliku `src/services/list.service.ts` zaimplementować nową metodę `async addListItem(command: AddListItemCommand, userId: string): Promise<ListItemDto>`. Metoda ta powinna zawierać logikę weryfikacji istnienia kategorii, listy (wraz z jej własnością) oraz wstawienia nowego rekordu do bazy danych.
3.  **Endpoint API**: Utworzyć nowy plik `src/pages/api/v1/list-items.ts`.
4.  **Implementacja handlera**: W nowo utworzonym pliku zaimplementować `POST` handler, który:
    a. Sprawdza uwierzytelnienie użytkownika.
    b. Waliduje ciało żądania za pomocą `addListItemSchema`.
    c. Wywołuje metodę `listService.addListItem`.
    d. Obsługuje potencjalne błędy (np. `NotFound`) i mapuje je na odpowiednie kody statusu HTTP.
    e. Zwraca odpowiedź `201 Created` z danymi otrzymanymi z serwisu w przypadku sukcesu.
