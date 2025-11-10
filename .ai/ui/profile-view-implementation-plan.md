# Plan implementacji widoku Profilu Użytkownika

## 1. Przegląd

Widok profilu użytkownika, dostępny pod ścieżką `/profile`, stanowi centrum zarządzania kontem. Umożliwia użytkownikowi przegląd podstawowych informacji o jego koncie, zmianę hasła oraz trwałe usunięcie konta wraz ze wszystkimi powiązanymi danymi. Implementacja widoku kładzie nacisk na bezpieczeństwo i świadomą zgodę użytkownika, szczególnie w przypadku akcji nieodwracalnych, takich jak usunięcie konta.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/profile`. Dostęp do tej ścieżki powinien być chroniony i wymagać uwierzytelnienia użytkownika. Niezalogowani użytkownicy próbujący uzyskać dostęp do tego widoku powinni zostać przekierowani na stronę logowania (`/login`).

- **Plik strony**: `src/pages/profile.astro`

## 3. Struktura komponentów

Hierarchia komponentów zostanie zorganizowana w celu oddzielenia logiki od prezentacji, z wykorzystaniem komponentu kontenera (`ProfileFeature`) do zarządzania stanem i interakcjami.

```
/profile (.astro)
└── Layout.astro
    └── ProfileFeature.tsx (client:load)
        ├── Card (Informacje o użytkowniku)
        │   └── <p>{user.email}</p>
        ├── Card (Zmiana hasła)
        │   └── ChangePasswordForm.tsx
        │       ├── Input (obecne hasło)
        │       ├── Input (nowe hasło)
        │       ├── Input (potwierdź nowe hasło)
        │       └── Button (zapisz)
        └── Card (Usunięcie konta)
            └── DeleteAccountSection.tsx
                ├── Button ("Usuń konto")
                └── DeleteAccountDialog.tsx (modal)
                    ├── Input (hasło do potwierdzenia)
                    └── Button ("Potwierdź usunięcie")
```

## 4. Szczegóły komponentów

### `ProfileFeature.tsx`

- **Opis komponentu**: Główny komponent kliencki, który pobiera dane użytkownika i zarządza stanem dla całego widoku, w tym widocznością modala potwierdzającego usunięcie konta.
- **Główne elementy**: Wykorzystuje komponenty `Card` z biblioteki Shadcn do grupowania sekcji: informacji o użytkowniku, formularza zmiany hasła i opcji usunięcia konta. Renderuje `DeleteAccountSection`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje je do komponentów podrzędnych.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `ProfileViewModel`.
- **Propsy**: `user: { email: string }`.

### `ChangePasswordForm.tsx`

- **Opis komponentu**: Formularz umożliwiający użytkownikowi zmianę hasła.
- **Główne elementy**: Trzy pola `Input` (obecne hasło, nowe hasło, potwierdzenie nowego hasła) i `Button` do przesłania formularza.
- **Obsługiwane interakcje**: `onSubmit`.
- **Obsługiwana walidacja**:
  - Wszystkie pola są wymagane.
  - Nowe hasło musi spełniać określone kryteria (np. minimalna długość 8 znaków).
  - Wartość pola "Potwierdź nowe hasło" musi być identyczna z wartością pola "Nowe hasło".
- **Typy**: `ChangePasswordDto`.
- **Propsy**: Brak.
- **Uwaga**: Funkcjonalność tego komponentu jest zablokowana do czasu implementacji odpowiedniego endpointu API.

### `DeleteAccountSection.tsx`

- **Opis komponentu**: Zarządza logiką usuwania konta, w tym otwieraniem modala potwierdzającego.
- **Główne elementy**: `Button` w wariancie `destructive` do zainicjowania procesu usuwania oraz komponent `DeleteAccountDialog`.
- **Obsługiwane interakcje**: Kliknięcie przycisku "Usuń konto" otwiera modal. Przekazuje funkcje obsługi do modala.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `DeleteAccountDto`.
- **Propsy**: Brak.

### `DeleteAccountDialog.tsx`

- **Opis komponentu**: Modal dialogowy wymagający od użytkownika ostatecznego potwierdzenia chęci usunięcia konta poprzez ponowne wprowadzenie hasła.
- **Główne elementy**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogDescription`, `Input` na hasło, `DialogFooter` z przyciskami `Button` "Anuluj" i "Potwierdź usunięcie".
- **Obsługiwane interakcje**: `onConfirm`, `onCancel`, `onPasswordChange`.
- **Obsługiwana walidacja**: Pole hasła jest wymagane. Przycisk "Potwierdź usunięcie" jest nieaktywny, dopóki pole hasła nie zostanie wypełnione.
- **Typy**: `DeleteAccountDto`.
- **Propsy**: `isOpen`, `onClose`, `onConfirm`, `isLoading`.

## 5. Typy

- **`ProfileViewModel`**: Model widoku dla danych profilu.
  ```typescript
  interface ProfileViewModel {
    user: {
      email: string;
    };
  }
  ```
- **`ChangePasswordDto`**: Obiekt transferu danych dla formularza zmiany hasła.
  ```typescript
  interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }
  ```
- **`DeleteAccountDto`**: Obiekt transferu danych dla formularza potwierdzenia usunięcia konta.
  ```typescript
  interface DeleteAccountDto {
    password: string;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem po stronie klienta zostanie zrealizowane przy użyciu hooków React (`useState`) oraz React Query (`useMutation`). Zalecane jest stworzenie dedykowanego hooka `useProfile` w celu enkapsulacji logiki.

- **`useProfile.ts`**:
  - **Cel**: Zarządzanie stanem i logiką biznesową widoku profilu.
  - **Stan**:
    - `isDeleteDialogOpen: boolean` - kontroluje widoczność modala.
    - `password: string` - przechowuje wartość hasła z pola w modalu.
  - **Akcje**:
    - `openDeleteDialog()` / `closeDeleteDialog()` - funkcje do zarządzania modalem.
    - `deleteAccountMutation: UseMutationResult<...>` - instancja `useMutation` do obsługi wywołania API `DELETE /api/v1/user`.

## 7. Integracja API

Integracja z backendem będzie dotyczyć głównie endpointu do usuwania konta.

- **Endpoint**: `DELETE /api/v1/user`
- **Narzędzie**: React Query (`useMutation`)
- **Przepływ żądania**:
  1. Użytkownik klika "Potwierdź usunięcie" w modalu.
  2. Wywoływana jest funkcja `deleteAccountMutation.mutate()`.
  3. Wysłane zostaje żądanie `DELETE` na adres `/api/v1/user`. Żądanie nie zawiera ciała (body).
- **Obsługa odpowiedzi**:
  - **Sukces (`204 No Content`)**: W `onSuccess` mutacji, użytkownik jest wylogowywany (przez wywołanie `POST /api/v1/auth/logout`), a następnie przekierowywany na stronę logowania (`/login`).
  - **Błąd (`401 Unauthorized`, `500 Internal Server Error`)**: W `onError` mutacji, wyświetlany jest komunikat błędu informujący użytkownika o niepowodzeniu operacji.

**Ważna uwaga**: Zgodnie z wymaganiami UX i historyjką użytkownika, proces usuwania konta wymaga podania hasła. Obecna implementacja backendu (`DELETE /user`) nie weryfikuje tego hasła. Frontend zaimplementuje pole na hasło jako warunek konieczny do aktywacji przycisku potwierdzenia, jednak walidacja po stronie serwera powinna zostać dodana w przyszłości w celu zwiększenia bezpieczeństwa.

## 8. Interakcje użytkownika

- **Załadowanie widoku**: Użytkownik widzi swój e-mail, formularz zmiany hasła i przycisk "Usuń konto".
- **Kliknięcie "Usuń konto"**: Otwiera się modal `DeleteAccountDialog`.
- **Wpisanie hasła w modalu**: Przycisk "Potwierdź usunięcie" staje się aktywny.
- **Kliknięcie "Anuluj" w modalu**: Modal zamyka się.
- **Kliknięcie "Potwierdź usunięcie"**: Przycisk pokazuje stan ładowania. Po pomyślnym usunięciu konta, następuje przekierowanie na stronę logowania. W przypadku błędu, wyświetlany jest stosowny komunikat.

## 9. Warunki i walidacja

- **Dostęp do widoku**: Middleware w `src/middleware/index.ts` musi weryfikować, czy użytkownik jest zalogowany. Jeśli nie, przekierowuje go do `/login`.
- **Walidacja w `DeleteAccountDialog`**: Przycisk "Potwierdź usunięcie" jest nieaktywny (`disabled`), jeśli `password.length === 0` lub jeśli żądanie API jest w toku (`isLoading`).

## 10. Obsługa błędów

- **Brak uwierzytelnienia**: Obsługiwany przez middleware na poziomie routingu.
- **Błąd serwera (np. 500) podczas usuwania konta**: Hook `useMutation` przechwyci błąd. Należy wyświetlić użytkownikowi generyczny komunikat, np. "Wystąpił błąd podczas usuwania konta. Spróbuj ponownie później.", używając systemu notyfikacji (np. toast).
- **Błąd sieci**: React Query obsłuży błąd sieciowy podobnie jak błąd serwera, co pozwoli na wyświetlenie tego samego komunikatu.

## 11. Kroki implementacji

1.  **Utworzenie strony Astro**: Stwórz plik `src/pages/profile.astro`. Dodaj podstawową strukturę, importując komponent `Layout` i przekazując odpowiednie metadane.
2.  **Ochrona ścieżki**: Zaktualizuj middleware (`src/middleware/index.ts`), aby chronić ścieżkę `/profile` i przekierowywać niezalogowanych użytkowników.
3.  **Stworzenie komponentu `ProfileFeature`**: Stwórz plik `src/components/features/profile/ProfileFeature.tsx`. Zaimplementuj w nim statyczną strukturę widoku z komponentami `Card` z Shadcn, wyświetlając e-mail użytkownika przekazany jako prop.
4.  **Integracja `ProfileFeature` ze stroną Astro**: W `profile.astro`, pobierz dane sesji użytkownika po stronie serwera i przekaż e-mail jako prop do `<ProfileFeature client:load user={...} />`.
5.  **Implementacja `DeleteAccountSection` i `DeleteAccountDialog`**: Stwórz komponenty odpowiedzialne za logikę usuwania konta. Użyj hooka `useState` do zarządzania stanem otwarcia modala i wartością pola hasła.
6.  **Stworzenie hooka `useProfile`**: Przenieś logikę zarządzania stanem (modal, hasło) oraz definicję mutacji React Query do hooka `useProfile.ts`.
7.  **Implementacja mutacji API**: W `useProfile`, użyj `useMutation` do zdefiniowania logiki wywołania `DELETE /api/v1/user`. W `onSuccess` dodaj przekierowanie, a w `onError` obsługę błędów.
8.  **Implementacja (wizualna) `ChangePasswordForm`**: Stwórz komponent formularza zmiany hasła. Jego funkcjonalność pozostaw nieaktywną do czasu dostarczenia odpowiedniego API.
9.  **Stylowanie i finalizacja**: Dopracuj wygląd i responsywność widoku, upewniając się, że wszystkie komponenty są poprawnie ostylowane zgodnie z design systemem.
10. **Testowanie manualne**: Przetestuj cały przepływ usuwania konta, włączając w to przypadki błędów i anulowanie akcji.
