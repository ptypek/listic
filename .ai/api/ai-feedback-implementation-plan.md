# API Endpoint Implementation Plan: POST /ai-feedback

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom zgłaszanie, że produkt wygenerowany przez AI na liście zakupów jest nieprawidłowy. Zgłoszenie jest logowane w bazie danych w celu przyszłej analizy i ulepszania modelu AI. Endpoint nie modyfikuje samego produktu, a jedynie rejestruje informację zwrotną.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/v1/ai-feedback`
- **Parametry**:
  - **Wymagane**: Brak parametrów URL.
  - **Opcjonalne**: Brak.
- **Request Body**:
  ```json
  {
    "list_item_id": "string (uuid)"
  }
  ```

  - `list_item_id`: Identyfikator UUID produktu z tabeli `list_items`, który jest zgłaszany jako nieprawidłowy.

## 3. Wykorzystywane typy

- **Command Model**: `CreateAiFeedbackCommand`
  ```typescript
  // src/types.ts
  export type CreateAiFeedbackCommand = Pick<TablesInsert<"ai_feedback_log">, "list_item_id">;
  ```
- **Walidator Zod**: `AiFeedbackValidator`

  ```typescript
  // src/lib/validators/ai-feedback.validator.ts
  import { z } from "zod";

  export const AiFeedbackValidator = z.object({
    list_item_id: z.string().uuid({ message: "Identyfikator produktu jest nieprawidłowy." }),
  });
  ```

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (202 Accepted)**: Wskazuje, że żądanie zostało przyjęte do przetworzenia.
  ```json
  {
    "message": "Feedback received. Thank you!"
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Ciało żądania nie przeszło walidacji.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `404 Not Found`: Produkt o podanym `list_item_id` nie istnieje.
  - `500 Internal Server Error`: Wystąpił błąd serwera podczas przetwarzania żądania.

## 5. Przepływ danych

1.  Klient wysyła żądanie `POST` na adres `/api/v1/ai-feedback` z `list_item_id` w ciele.
2.  Middleware Astro (`src/middleware/index.ts`) przechwytuje żądanie i weryfikuje sesję użytkownika za pomocą `context.locals.supabase.auth`. Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized`.
3.  Handler w `src/pages/api/v1/ai-feedback.ts` jest wywoływany.
4.  Handler waliduje ciało żądania przy użyciu `AiFeedbackValidator`. W przypadku błędu zwraca `400 Bad Request`.
5.  Handler wywołuje metodę `logFeedback` z nowego serwisu `AiFeedbackService`, przekazując `list_item_id` oraz `user_id` z sesji.
6.  `AiFeedbackService.logFeedback` wykonuje następujące operacje:
    a. Sprawdza, czy produkt o podanym `list_item_id` istnieje w tabeli `list_items`. Jeśli nie, zwraca błąd, który handler mapuje na `404 Not Found`.
    b. Wstawia nowy rekord do tabeli `ai_feedback_log` zawierający `user_id` i `list_item_id`.
7.  Jeśli operacja w serwisie zakończy się sukcesem, handler zwraca odpowiedź `202 Accepted`. W przeciwnym razie zwraca `500 Internal Server Error`.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp do punktu końcowego jest ograniczony wyłącznie do uwierzytelnionych użytkowników. Mechanizm sesji Supabase i middleware Astro zapewniają ochronę.
- **Walidacja danych wejściowych**: Wszystkie dane wejściowe są walidowane za pomocą `zod`, aby upewnić się, że `list_item_id` jest w oczekiwanym formacie (UUID), co zapobiega błędom i potencjalnym atakom.
- **Autoryzacja**: Zgodnie ze specyfikacją, każdy uwierzytelniony użytkownik może zgłosić dowolny `list_item_id`. Nie jest sprawdzane, czy użytkownik jest właścicielem listy, na której znajduje się produkt. Jest to zgodne z celem zbierania jak największej ilości danych zwrotnych.
- **Ochrona przed nadużyciami**: W przyszłości można rozważyć wprowadzenie mechanizmu rate-limiting, aby zapobiec masowemu wysyłaniu zgłoszeń przez jednego użytkownika.

## 7. Obsługa błędów

- **Błąd walidacji (400)**: Zwracany, gdy `list_item_id` brakuje lub ma nieprawidłowy format.
- **Brak uwierzytelnienia (401)**: Zwracany przez middleware, gdy brak aktywnej sesji użytkownika.
- **Nie znaleziono zasobu (404)**: Zwracany, gdy w bazie danych nie ma produktu o podanym `list_item_id`.
- **Błąd serwera (500)**: Zwracany w przypadku niepowodzenia zapisu do bazy danych lub innego nieoczekiwanego błędu po stronie serwera. Błędy te powinny być logowane.

## 8. Rozważania dotyczące wydajności

- Operacja polega na prostym zapytaniu `SELECT` i `INSERT`, które są wysoce zoptymalizowane w PostgreSQL. Nie przewiduje się problemów z wydajnością.
- Użycie odpowiedzi `202 Accepted` informuje klienta, że serwer przyjął żądanie, ale nie musi czekać na zakończenie wszystkich operacji (chociaż w tym przypadku są one synchroniczne i szybkie).

## 9. Etapy wdrożenia

1.  **Aktualizacja schematu bazy danych**: Upewnić się, że tabela `ai_feedback_log` istnieje w bazie danych zgodnie z `db-plan.MD`. Jeśli nie, utworzyć odpowiednią migrację Supabase.
2.  **Utworzenie walidatora**: Stworzyć plik `src/lib/validators/ai-feedback.validator.ts` i zdefiniować w nim schemat `AiFeedbackValidator` za pomocą `zod`.
3.  **Utworzenie serwisu**: Stworzyć plik `src/services/ai-feedback.service.ts`.
4.  **Implementacja logiki serwisu**: W `ai-feedback.service.ts` zaimplementować metodę `logFeedback(command, userId)`, która sprawdzi istnienie `list_item` i zapisze zgłoszenie w tabeli `ai_feedback_log`.
5.  **Utworzenie pliku endpointu**: Stworzyć plik `src/pages/api/v1/ai-feedback.ts`.
6.  **Implementacja handlera endpointu**: W pliku endpointu zaimplementować handler `POST`, który:
    - Pobiera `supabase` i `session` z `context.locals`.
    - Sprawdza uwierzytelnienie.
    - Waliduje ciało żądania.
    - Wywołuje serwis `AiFeedbackService`.
    - Zwraca odpowiednie odpowiedzi HTTP (`202`, `400`, `404`, `500`).
