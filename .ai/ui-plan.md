# Architektura UI dla Listic

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Listic zostanie zbudowana w oparciu o framework **Astro**, z interaktywnymi "wyspami" renderowanymi przy użyciu **React**. Takie hybrydowe podejście zapewni szybkość ładowania statycznych części aplikacji oraz dynamiczną interaktywność tam, gdzie jest to potrzebne (np. na liście zakupów, w formularzach).

Stylizacja zostanie zrealizowana za pomocą **Tailwind CSS**, a spójny system komponentów zapewni biblioteka **shadcn/ui**. Architektura jest projektowana zgodnie z podejściem **mobile-first**, co oznacza, że priorytetem jest doskonałe doświadczenie na urządzeniach mobilnych, które następnie jest skalowane na większe ekrany.

Globalne zarządzanie stanem, w szczególności sesją użytkownika, będzie obsługiwane przez **React Context**. Komunikacja z API będzie scentralizowana, aby zapewnić spójną obsługę autoryzacji i błędów. Kluczowym elementem jest również wsparcie dla **trybu offline** dla ostatniej listy zakupów, z wykorzystaniem `localStorage` do przechowywania danych i kolejkowania zmian.

## 2. Lista widoków

### 1. Widok Logowania (Login)

- **Ścieżka widoku**: `/login`
- **Główny cel**: Uwierzytelnienie istniejącego użytkownika.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło, link do rejestracji.
- **Kluczowe komponenty widoku**: `Card`, `Input`, `Button`, `Label`.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasne komunikaty o błędach walidacji (np. "Nieprawidłowy e-mail") i błędach logowania (np. "Błędne hasło lub e-mail"). Przycisk "Zaloguj" jest nieaktywny, dopóki formularz nie jest poprawnie wypełniony.
  - **Dostępność**: Poprawne etykiety dla pól formularza, obsługa nawigacji klawiaturą.
  - **Bezpieczeństwo**: Komunikacja z API przez HTTPS.

### 2. Widok Rejestracji (Register)

- **Ścieżka widoku**: `/register`
- **Główny cel**: Utworzenie nowego konta użytkownika.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail, hasło i potwierdzenie hasła, link do logowania.
- **Kluczowe komponenty widoku**: `Card`, `Input`, `Button`, `Label`.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Walidacja "w locie" po utracie fokusu, szczególnie dla siły hasła i zgodności haseł.
  - **Dostępność**: Pełna obsługa z klawiatury, etykiety ARIA.
  - **Bezpieczeństwo**: Wymagania dotyczące siły hasła egzekwowane po stronie klienta i serwera.

### 3. Widok Generowania Listy (Generate List)

- **Ścieżka widoku**: `/`
- **Główny cel**: Umożliwienie użytkownikowi wygenerowania listy zakupów na podstawie przepisów. Jest to główny widok aplikacji dla zalogowanego użytkownika.
- **Kluczowe informacje do wyświetlenia**: Do 10 pól tekstowych na wklejenie przepisów, przycisk "Generuj listę".
- **Kluczowe komponenty widoku**: `Textarea`, `Button`, `Spinner`.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Wyraźny stan ładowania (spinner) po kliknięciu przycisku generowania. Automatyczne przekierowanie do widoku listy po pomyślnym jej utworzeniu.
  - **Dostępność**: Etykiety dla każdego pola tekstowego.
  - **Bezpieczeństwo**: Walidacja po stronie klienta, aby zapobiec wysyłaniu pustych zapytań.

### 4. Widok Ostatniej Listy (Last List)

- **Ścieżka widoku**: `/list`
- **Główny cel**: Wyświetlanie i interakcja z ostatnio wygenerowaną listą zakupów.
- **Kluczowe informacje do wyświetlenia**:
  - Lista produktów pogrupowana w 8 kategoriach.
  - Formularz do manualnego dodawania produktów.
  - Wskaźnik statusu synchronizacji (dla trybu offline).
- **Kluczowe komponenty widoku**: `Card` (dla kategorii), `ListItem` (dla produktu), `Checkbox`, `Button` (akcje: edytuj, usuń, zgłoś błąd), `Avatar` (ikona AI), `Input` (dodawanie manualne), `Spinner` (synchronizacja).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Optymistyczne aktualizacje UI (np. natychmiastowe wyszarzenie i przeniesienie produktu po zaznaczeniu). Wizualne rozróżnienie produktów AI i manualnych. Jasne komunikaty (toasty) o błędach lub sukcesie synchronizacji.
  - **Dostępność**: Elementy listy dostępne z klawiatury, przyciski akcji mają jasne etykiety ARIA.
  - **Bezpieczeństwo**: Wszystkie zmiany na liście są autoryzowane i walidowane przez API.

### 5. Widok Profilu (Profile)

- **Ścieżka widoku**: `/profile`
- **Główny cel**: Zarządzanie kontem użytkownika.
- **Kluczowe informacje do wyświetlenia**: Adres e-mail użytkownika, formularz zmiany hasła, przycisk wylogowania, przycisk usunięcia konta.
- **Kluczowe komponenty widoku**: `Card`, `Input`, `Button`, `Modal` (dla potwierdzenia usunięcia konta).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Krytyczne akcje (usunięcie konta) wymagają dodatkowego potwierdzenia w oknie modalnym.
  - **Dostępność**: Wszystkie elementy interaktywne są w pełni dostępne.
  - **Bezpieczeństwo**: Usunięcie konta wymaga ponownego wprowadzenia hasła w celu weryfikacji.

## 3. Mapa podróży użytkownika

**Główny przepływ: Rejestracja i generowanie pierwszej listy**

1.  **Start**: Użytkownik ląduje na stronie `/login`.
2.  **Rejestracja**: Klika link "Zarejestruj się", przechodzi do `/register`. Wypełnia formularz i tworzy konto.
3.  **Logowanie**: Po pomyślnej rejestracji jest przekierowywany do `/login`. Wprowadza dane i się loguje.
4.  **Przekierowanie do Głównego Widoku**: Po zalogowaniu następuje przekierowanie do widoku `/` (Generuj listę).
5.  **Generowanie Listy**: Użytkownik wkleja linki do przepisów w pola tekstowe i klika "Generuj listę".
6.  **Stan Ładowania**: Aplikacja wyświetla globalny spinner, informując o przetwarzaniu.
7.  **Wyświetlenie Listy**: Po pomyślnym przetworzeniu, użytkownik jest przekierowywany na stronę `/list`, gdzie widzi nowo utworzoną listę zakupów, pogrupowaną według kategorii.
8.  **Interakcja z Listą**: Użytkownik odhacza produkty (`is_checked: true`), które są wyszarzane i przenoszone na dół swojej kategorii. Zmiana jest widoczna natychmiast (optymistyczny UI).
9.  **Zgłaszanie Błędu**: Użytkownik zauważa błąd w produkcie wygenerowanym przez AI i klika przycisk "!". Produkt jest oznaczany jako "kupiony", otrzymuje czerwoną ramkę, a na ekranie pojawia się modal z podziękowaniem i opcjami "Edytuj" lub "Usuń".

## 4. Układ i struktura nawigacji

Nawigacja w aplikacji została zaprojektowana z myślą o prostocie i łatwości dostępu na urządzeniach mobilnych.

- **Główny Layout**: Widoki `/`, `/list` oraz `/profile` są opakowane w główny layout, który zawiera stały element nawigacyjny.
- **Dolny Pasek Nawigacyjny (Bottom Navigation Bar)**: Jest to główny mechanizm nawigacji dla zalogowanego użytkownika. Składa się z trzech ikon/przycisków:
  - **Generuj listę** (ikona plusa/magii): Prowadzi do `/`.
  - **Ostatnia lista** (ikona listy): Prowadzi do `/list`.
  - **Profil** (ikona użytkownika): Prowadzi do `/profile`.
- **Nawigacja dla niezalogowanych**: Użytkownik niezalogowany ma dostęp tylko do widoków `/login` i `/register`, które nie zawierają głównego paska nawigacyjnego. Przepływ między nimi odbywa się za pomocą linków. Próba wejścia na chronioną ścieżkę powoduje przekierowanie do `/login`.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę systemu projektowego.

- **`Button`**: Standardowy przycisk z wariantami (główny, drugorzędny, destrukcyjny) i obsługą stanu ładowania.
- **`Input`**: Pole tekstowe z obsługą walidacji, błędów i etykiet.
- **`Textarea`**: Wieloliniowe pole tekstowe używane w widoku generowania listy.
- **`Card`**: Kontener do grupowania powiązanych treści, np. kategorii na liście zakupów lub formularzy.
- **`ListItem`**: Komponent reprezentujący pojedynczy produkt na liście. Będzie zawierał checkbox, nazwę produktu, ilość, jednostkę oraz przyciski akcji. Będzie miał warianty wizualne (dla produktu AI, manualnego, zgłoszonego błędu).
- **`Checkbox`**: Komponent do oznaczania produktów jako kupione.
- **`Modal`**: Okno dialogowe używane do potwierdzania krytycznych akcji (np. usunięcie konta) lub wyświetlania dodatkowych informacji (np. po zgłoszeniu błędu AI).
- **`Spinner`**: Wskaźnik ładowania używany podczas operacji asynchronicznych (generowanie listy, synchronizacja).
- **`Toast` / `Alert`**: Komponent do wyświetlania globalnych powiadomień o sukcesie lub błędzie operacji.
