# Plan implementacji widoku Generowania Listy

## 1. Przegląd
Celem tego widoku jest umożliwienie zalogowanym użytkownikom tworzenia nowej, inteligentnej listy zakupów poprzez wklejenie surowego tekstu z jednego lub więcej przepisów. Aplikacja przetworzy te dane za pomocą AI, aby wygenerować skonsolidowaną i skategoryzowaną listę produktów. Widok ten stanowi główny punkt wejścia do kluczowej funkcjonalności aplikacji.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką aplikacji dla zalogowanych użytkowników:
- **Ścieżka**: `/`

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React (`.tsx`) i osadzone na stronie Astro. Hierarchia komponentów będzie następująca:

```
GenerateListPage.astro
└── GenerateListView.tsx
    ├── RecipeInputList.tsx
    │   └── RecipeInput.tsx (mapowany dynamicznie)
    ├── Button.tsx (przycisk "Dodaj kolejny przepis")
    └── Button.tsx (przycisk "Generuj listę")
```

- **`GenerateListPage.astro`**: Główny plik strony Astro, który renderuje komponent React.
- **`GenerateListView.tsx`**: Główny komponent widoku, zarządzający stanem formularza, logiką walidacji i komunikacją z API.
- **`RecipeInputList.tsx`**: Komponent renderujący listę pól do wprowadzania przepisów.
- **`RecipeInput.tsx`**: Pojedynczy element listy, zawierający pole `Textarea` na przepis oraz przycisk do jego usunięcia.

## 4. Szczegóły komponentów

### `GenerateListView.tsx`
- **Opis komponentu**: Kontener całej logiki widoku. Odpowiada za zarządzanie stanem (za pomocą customowego hooka `useGenerateList`), obsługę zdarzeń formularza oraz wyświetlanie stanu ładowania i błędów.
- **Główne elementy**:
  - Nagłówek `<h1>` z tytułem "Wygeneruj listę z przepisów".
  - Komponent `<RecipeInputList />`.
  - Przycisk `Button` do dodawania nowego pola na przepis.
  - Przycisk `Button` do wysłania formularza.
  - Komponent `<Spinner />` wyświetlany warunkowo podczas ładowania.
- **Obsługiwane interakcje**:
  - Wysłanie formularza w celu wygenerowania listy.
- **Obsługiwana walidacja**:
  - Sprawdzenie, czy co najmniej jeden przepis został dodany przed wysłaniem.
- **Typy**: `GenerateListViewModel`.
- **Propsy**: Brak.

### `RecipeInputList.tsx`
- **Opis komponentu**: Zarządza dynamiczną listą pól na przepisy.
- **Główne elementy**:
  - Mapowanie i renderowanie komponentów `<RecipeInput />` dla każdego przepisu w stanie.
- **Obsługiwane interakcje**:
  - Przekazywanie zdarzeń zmiany treści, dodawania i usuwania przepisów do komponentu nadrzędnego.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RecipeInputViewModel`.
- **Propsy**:
  - `recipes: RecipeInputViewModel[]`
  - `onRecipeChange: (id: string, value: string) => void`
  - `onRemoveRecipe: (id: string) => void`

### `RecipeInput.tsx`
- **Opis komponentu**: Reprezentuje pojedynczy wiersz z polem na przepis.
- **Główne elementy**:
  - `<label>` dla pola tekstowego (dla dostępności).
  - Komponent `<Textarea />` (z biblioteki Shadcn/ui).
  - Komponent `<Button />` z ikoną kosza do usunięcia pola.
- **Obsługiwane interakcje**:
  - `onChange` na `Textarea`: aktualizuje wartość przepisu w stanie.
  - `onClick` na przycisku usuwania: wywołuje funkcję usuwającą przepis.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `RecipeInputViewModel`.
- **Propsy**:
  - `recipe: RecipeInputViewModel`
  - `onRecipeChange: (id: string, value: string) => void`
  - `onRemoveRecipe: (id: string) => void`

## 5. Typy

### `GenerateListRequestDto`
Typ obiektu wysyłanego do API.
```typescript
interface GenerateListRequestDto {
  list_name: string;
  recipes: string[];
}
```

### `GenerateListViewModel`
Typ reprezentujący stan całego widoku.
```typescript
interface GenerateListViewModel {
  recipes: RecipeInputViewModel[];
  isLoading: boolean;
  error: string | null;
}
```
- `recipes`: Tablica obiektów reprezentujących poszczególne pola na przepisy.
- `isLoading`: Flaga informująca o trwającym procesie generowania listy.
- `error`: Przechowuje komunikat błędu do wyświetlenia użytkownikowi.

### `RecipeInputViewModel`
Typ dla pojedynczego pola na przepis, zapewniający stabilne renderowanie w listach React.
```typescript
interface RecipeInputViewModel {
  id: string; // Unikalny identyfikator, np. z crypto.randomUUID()
  value: string;
}
```

## 6. Zarządzanie stanem
Logika i stan widoku zostaną wyizolowane w customowym hooku `useGenerateList`.

### `useGenerateList()`
- **Cel**: Hermetyzacja logiki formularza, w tym dodawania/usuwania pól, walidacji i komunikacji z API.
- **Zarządzany stan**: `recipes`, `isLoading`, `error`.
- **Zwracane funkcje**:
  - `addRecipe()`: Dodaje nowe pole na przepis (limit 10).
  - `removeRecipe(id: string)`: Usuwa pole o danym ID (jeśli jest więcej niż 1).
  - `updateRecipe(id: string, value: string)`: Aktualizuje treść przepisu.
  - `handleSubmit()`: Waliduje dane i wysyła je do API.
- **Integracja z API**: Hook będzie używał biblioteki `@tanstack/react-query` (`useMutation`) do obsługi żądania POST, co uprości zarządzanie stanami `isLoading`, `error` oraz obsługę sukcesu/błędu.

## 7. Integracja API
- **Endpoint**: `POST /api/v1/lists/generate-from-recipes`
- **Proces**:
  1. Po kliknięciu "Generuj listę", hook `useGenerateList` wywoła funkcję `handleSubmit`.
  2. Funkcja ta odfiltruje puste przepisy i skonstruuje obiekt `GenerateListRequestDto`. Jako `list_name` zostanie użyta domyślna nazwa, np. "Nowa lista z przepisów".
  3. Zostanie wykonane żądanie POST z użyciem `useMutation`.
- **Obsługa odpowiedzi**:
  - **Sukces (201 Created)**: Odpowiedź będzie zawierać obiekt nowej listy (`ShoppingList`). Zostanie z niego wyodrębnione `id`, a użytkownik zostanie przekierowany na stronę tej listy (`/list/[id]`) za pomocą funkcji `navigate` z `astro:transitions/client`.
  - **Błąd**: Komunikat błędu zostanie zapisany w stanie i wyświetlony użytkownikowi.

## 8. Interakcje użytkownika
- **Dodawanie pola na przepis**: Kliknięcie przycisku "Dodaj kolejny przepis" dodaje nowe pole `Textarea` (do maksymalnie 10). Przycisk jest nieaktywny po osiągnięciu limitu.
- **Usuwanie pola na przepis**: Kliknięcie przycisku "Usuń" obok danego pola usuwa je z formularza (minimalnie jedno pole musi pozostać).
- **Wprowadzanie tekstu**: Użytkownik może wkleić lub wpisać tekst w dowolne pole `Textarea`.
- **Generowanie listy**: Kliknięcie "Generuj listę" blokuje przycisk, wyświetla `Spinner` i rozpoczyna proces komunikacji z API. Po zakończeniu, użytkownik jest przekierowywany lub widzi komunikat o błędzie.

## 9. Warunki i walidacja
- **Limit pól**: Interfejs uniemożliwi dodanie więcej niż 10 pól na przepisy.
- **Minimum pól**: Interfejs uniemożliwi usunięcie ostatniego pola.
- **Puste przepisy**: Przed wysłaniem formularza, logika w `handleSubmit` odfiltruje wszystkie pola, które są puste lub zawierają tylko białe znaki.
- **Walidacja przed wysłaniem**: Jeśli po odfiltrowaniu pustych pól lista przepisów jest pusta, żądanie do API nie zostanie wysłane, a użytkownik zobaczy błąd "Proszę dodać przynajmniej jeden przepis."

## 10. Obsługa błędów
- **Błędy walidacji klienta**: Wyświetlenie komunikatu błędu bezpośrednio w interfejsie (np. pod przyciskiem "Generuj listę").
- **Błąd `401 Unauthorized`**: Wyświetlenie komunikatu (np. w formie toasta): "Sesja wygasła. Proszę zalogować się ponownie."
- **Błąd `502 Bad Gateway` (błąd usługi AI)**: Wyświetlenie komunikatu: "Zewnętrzna usługa AI nie odpowiada. Spróbuj ponownie za chwilę."
- **Inne błędy serwera lub sieci**: Wyświetlenie ogólnego komunikatu: "Wystąpił nieoczekiwany błąd. Prosimy spróbować ponownie."

## 11. Kroki implementacji
1.  **Stworzenie plików**: Utworzenie plików `GenerateListPage.astro`, `GenerateListView.tsx`, `RecipeInputList.tsx`, `RecipeInput.tsx` oraz hooka `useGenerateList.ts`.
2.  **Implementacja `RecipeInput.tsx`**: Stworzenie komponentu z `Textarea` i przyciskiem "Usuń", podpięcie propsów `onChange` i `onRemove`.
3.  **Implementacja `RecipeInputList.tsx`**: Implementacja komponentu, który mapuje stan `recipes` i renderuje listę komponentów `RecipeInput`.
4.  **Implementacja hooka `useGenerateList.ts`**: Zdefiniowanie stanu, logiki `addRecipe`, `removeRecipe`, `updateRecipe` oraz szkieletu funkcji `handleSubmit`.
5.  **Implementacja `GenerateListView.tsx`**: Połączenie hooka `useGenerateList` z komponentami UI. Renderowanie listy, przycisków i warunkowe wyświetlanie `Spinnera` oraz błędów.
6.  **Integracja API w `useGenerateList.ts`**: Zaimplementowanie `useMutation` do obsługi żądania `POST /api/v1/lists/generate-from-recipes`.
7.  **Implementacja przekierowania**: W `onSuccess` mutacji dodać logikę przekierowania użytkownika za pomocą `navigate()`.
8.  **Stylowanie i UX**: Dopracowanie wyglądu, animacji i komunikatów, aby zapewnić płynne doświadczenie użytkownika, zgodnie z systemem designu Shadcn/ui.
9.  **Testowanie manualne**: Przetestowanie wszystkich interakcji, walidacji i scenariuszy błędów.
