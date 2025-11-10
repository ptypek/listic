# API Endpoint Implementation Plan: DELETE /user

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia uwierzytelnionemu użytkownikowi trwałe usunięcie swojego konta oraz wszystkich powiązanych z nim danych. Operacja jest nieodwracalna i wymaga, aby użytkownik był zalogowany.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/v1/user`
- **Parametry**:
  - **Wymagane**: Brak. Identyfikator użytkownika jest pobierany z aktywnej sesji.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **DTOs**: Brak.
- **Command Models**: Brak.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu**:
  - **Kod stanu**: `204 No Content`
  - **Treść**: Brak.
- **Odpowiedzi błędów**:
  - **Kod stanu**: `401 Unauthorized`
    - **Treść**: `{ "error": "Unauthorized" }`
    - **Warunek**: Użytkownik nie jest uwierzytelniony.
  - **Kod stanu**: `500 Internal Server Error`
    - **Treść**: `{ "error": "Failed to delete user account" }`
    - **Warunek**: Wystąpił błąd po stronie serwera podczas próby usunięcia konta.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie `DELETE` na adres `/api/v1/user`.
2. Middleware (`src/middleware/index.ts`) przechwytuje żądanie, weryfikuje token sesji i dołącza informacje o użytkowniku do `Astro.locals`. Jeśli sesja jest nieprawidłowa, middleware zwraca `401 Unauthorized`.
3. Handler API w pliku `src/pages/api/v1/user/index.ts` (nowy plik) odbiera żądanie.
4. Handler wywołuje metodę `deleteUser` z nowego serwisu `UserService`, przekazując `userId` pobrany z `Astro.locals.session.user.id`.
5. Metoda `UserService.deleteUser` wywołuje funkcję administracyjną Supabase (`supabase.auth.admin.deleteUser(userId)`) w celu usunięcia użytkownika z systemu `auth.users`.
6. Baza danych Supabase, dzięki skonfigurowanym kluczom obcym z `ON DELETE CASCADE` (dla tabel `profiles`, `lists` itp.), automatycznie usuwa wszystkie dane powiązane z usuwanym użytkownikiem.
7. Jeśli operacja w Supabase zakończy się sukcesem, `UserService` zwraca pomyślną odpowiedź.
8. Handler API zwraca do klienta odpowiedź z kodem stanu `204 No Content`.
9. W przypadku błędu w `UserService` (np. błąd komunikacji z Supabase), zgłaszany jest wyjątek.
10. Handler API przechwytuje wyjątek, loguje szczegóły błędu i zwraca odpowiedź z kodem `500 Internal Server Error`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp do tego punktu końcowego musi być chroniony i dozwolony tylko dla uwierzytelnionych użytkowników. Zostanie to zapewnione przez globalne middleware, które weryfikuje sesję Supabase.
- **Autoryzacja**: Użytkownik może usunąć tylko i wyłącznie własne konto. Identyfikator użytkownika do usunięcia będzie pobierany bezpośrednio z obiektu sesji (`Astro.locals.session.user.id`), a nie z parametrów żądania, co zapobiega próbom usunięcia kont innych użytkowników.
- **Klucze serwisowe**: Operacja usunięcia użytkownika wymaga uprawnień administracyjnych. Serwis `UserService` musi używać klienta Supabase zainicjowanego z kluczem `service_role`, który jest bezpiecznie przechowywany w zmiennych środowiskowych (`SUPABASE_SERVICE_ROLE_KEY`).

## 7. Obsługa błędów
- **Brak uwierzytelnienia (`401 Unauthorized`)**: Obsługiwane przez middleware. Jeśli `Astro.locals.session` jest `null`, żądanie jest odrzucane.
- **Błąd serwera (`500 Internal Server Error`)**:
  - **Scenariusz**: Wywołanie `supabase.auth.admin.deleteUser()` kończy się niepowodzeniem.
  - **Obsługa**: Handler API opakowuje wywołanie serwisu w blok `try...catch`. W przypadku błędu, szczegółowe informacje o błędzie z Supabase są logowane na serwerze, a klient otrzymuje generyczną odpowiedź błędu 500.

## 8. Rozważania dotyczące wydajności
- Operacja usunięcia użytkownika jest operacją destrukcyjną i rzadko wykonywaną, więc nie przewiduje się znaczących problemów z wydajnością.
- Wydajność zależy głównie od szybkości odpowiedzi API Supabase oraz efektywności kaskadowego usuwania danych w bazie PostgreSQL. Należy upewnić się, że wszystkie powiązane tabele mają odpowiednie indeksy na kluczach obcych, aby operacje `CASCADE DELETE` były szybkie.

## 9. Etapy wdrożenia
1. **Utworzenie serwisu użytkownika**:
   - Utwórz nowy plik `src/services/user.service.ts`.
   - W pliku zdefiniuj klasę `UserService`.
   - Zaimplementuj metodę `async deleteUser(userId: string): Promise<void>`, która używa `supabase.auth.admin.deleteUser(userId)`. Upewnij się, że klient Supabase jest inicjowany z kluczem `service_role`.
2. **Utworzenie pliku endpointu**:
   - Utwórz nowy plik `src/pages/api/v1/user/index.ts`.
3. **Implementacja handlera `DELETE`**:
   - W pliku `src/pages/api/v1/user/index.ts` zaimplementuj handler dla metody `DELETE`.
   - Pobierz `userId` z `Astro.locals.session.user.id`.
   - Zaimplementuj blok `try...catch`.
   - W bloku `try` wywołaj `UserService.deleteUser(userId)`.
   - Po pomyślnym wykonaniu zwróć `new Response(null, { status: 204 })`.
   - W bloku `catch` zaloguj błąd i zwróć `new Response(JSON.stringify({ error: 'Failed to delete user account' }), { status: 500 })`.
4. **Weryfikacja kaskadowego usuwania**:
   - Sprawdź pliki migracji (`supabase/migrations/*.sql`), aby upewnić się, że wszystkie tabele zawierające `user_id` (np. `profiles`, `lists`) mają zdefiniowany klucz obcy z `ON DELETE CASCADE` w odniesieniu do tabeli `auth.users`.
5. **Testowanie (manualne)**:
   - Utwórz testowego użytkownika.
   - Utwórz dla niego dane (np. listę zakupów).
   - Wyślij uwierzytelnione żądanie `DELETE` do `/api/v1/user`.
   - Sprawdź, czy odpowiedź ma status `204`.
   - Sprawdź w panelu Supabase, czy użytkownik został usunięty z `auth.users`.
   - Sprawdź, czy wszystkie powiązane dane (profil, listy) również zostały usunięte.
   - Spróbuj wysłać żądanie bez uwierzytelnienia i zweryfikuj, czy otrzymujesz status `401`.
