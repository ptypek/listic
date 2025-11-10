# Plan implementacji widoku Ostatniej Listy (Last List)

## 1. Przegląd
Celem jest stworzenie widoku `/list`, który wyświetla ostatnio wygenerowaną listę zakupów użytkownika. Widok ten pozwoli na pełną interakcję z listą, w tym dodawanie, edytowanie i usuwanie produktów, oznaczanie posiadanych już pozycji oraz raportowanie błędów w produktach wygenerowanych przez AI. Wszystkie zmiany będą optymistycznie aktualizowane w interfejsie i synchronizowane z serwerem w tle.

## 2. Routing widoku
Widok będzie dostępny pod główną ścieżką aplikacji po zalogowaniu:
- **Ścieżka**: `/list`
- **Plik Astro**: `src/pages/list.astro`
- **Komponent React**: `src/components/features/last-list/LastListView.tsx` (renderowany jako wyspa `client:load` w pliku Astro)

## 3. Struktura komponentów
Hierarchia komponentów React zostanie zorganizowana w celu zapewnienia reużywalności i separacji logiki.

```
- LastListPage.astro
  - LastListView.tsx (Komponent główny, zarządzający stanem)
    - AddProductForm.tsx (Formularz do dodawania nowych produktów)
    - CategoryList.tsx (Lista kart kategorii)
      - CategoryCard.tsx (Karta dla pojedynczej kategorii)
        - ProductListItem.tsx (Element listy produktów)
          - ItemActions.tsx (Menu kontekstowe dla akcji na produkcie)
```

## 4. Szczegóły komponentów

### `LastListView.tsx`
- **Opis komponentu**: Główny, "inteligentny" komponent, który orkiestruje pobieranie danych, zarządzanie stanem za pomocą hooka `useLastList` i renderuje podkomponenty.
- **Główne elementy**: Wyświetla tytuł listy, komponent `AddProductForm` oraz `CategoryList`. Obsługuje stany ładowania i błędów na poziomie całego widoku.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, przekazuje handlery mutacji (dodawanie, edycja, usuwanie) do komponentów podrzędnych.
- **Typy**: `ListViewModel`, `Category[]`
- **Propsy**: Brak.

### `AddProductForm.tsx`
- **Opis komponentu**: Formularz do ręcznego dodawania produktów do listy.
- **Główne elementy**: `Input` dla nazwy produktu, `Input` (type="number") dla ilości, `Input` dla jednostki, `Select` dla kategorii. Przycisk "Dodaj" jest wyłączony do momentu poprawnej walidacji.
- **Obsługiwane interakcje**: `onSubmit` formularza.
- **Obsługiwana walidacja**:
  - `name`: Wymagane, nie może być puste (po usunięciu białych znaków).
  - `quantity`: Wymagane, musi być liczbą większą od 0.
  - `unit`: Wymagane, nie może być puste.
  - `categoryId`: Wymagane, musi być wybrane z listy.
- **Typy**: `AddProductFormData`, `Category[]`
- **Propsy**: `onSubmit: (data: AddProductFormData) => void`, `categories: Category[]`, `disabled: boolean`.

### `CategoryCard.tsx`
- **Opis komponentu**: Kontener (Shadcn `Card`) dla produktów należących do jednej kategorii.
- **Główne elementy**: `CardHeader` z nazwą kategorii, `CardContent` z listą komponentów `ProductListItem`.
- **Obsługiwane interakcje**: Brak.
- **Typy**: `CategoryViewModel`.
- **Propsy**: `category: CategoryViewModel`, `onUpdateItem`, `onDeleteItem`, `onReportError`.

### `ProductListItem.tsx`
- **Opis komponentu**: Reprezentuje pojedynczy wiersz produktu na liście.
- **Główne elementy**: `Checkbox` do oznaczania, nazwa produktu, ilość, jednostka. `Avatar` z ikoną AI, jeśli `source === 'ai'`. Komponent `ItemActions` z menu akcji.
- **Obsługiwane interakcje**: Zaznaczenie/odznaczenie `Checkbox`.
- **Typy**: `ListItemViewModel`.
- **Propsy**: `item: ListItemViewModel`, `onUpdate: (id, data) => void`, `onDelete: (id) => void`, `onReportError: (id) => void`.

### `ItemActions.tsx`
- **Opis komponentu**: Menu kontekstowe (Shadcn `DropdownMenu`) dla akcji na produkcie.
- **Główne elementy**: `DropdownMenuTrigger` (ikona "więcej"), `DropdownMenuItem` dla "Edytuj", "Mam już" i "Błędny składnik".
- **Obsługiwane interakcje**: Kliknięcie na każdą z opcji menu. Opcja "Błędny składnik" jest widoczna tylko dla `item.source === 'ai'`.
- **Typy**: `ListItemViewModel`.
- **Propsy**: `item: ListItemViewModel`, `onEdit: () => void`, `onDelete: () => void`, `onReportError: () => void`.

## 5. Typy
Do obsługi widoku potrzebne będą następujące struktury danych, w tym modele widoku (ViewModel) do transformacji danych z API na potrzeby UI.

```typescript
// src/types.ts (rozszerzenie istniejących)

// DTO z API (bez zmian)
export interface ListItem {
  id: string;
  list_id: string;
  category_id: number;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  source: 'manual' | 'ai';
  // ... inne pola
}

export interface Category {
  id: number;
  name: string;
}

// --- Nowe typy i ViewModels ---

// Model widoku dla elementu listy (bezpośrednie mapowanie)
export type ListItemViewModel = ListItem;

// Model widoku dla kategorii, zawierający przypisane do niej produkty
export interface CategoryViewModel extends Category {
  items: ListItemViewModel[];
}

// Główny model widoku dla całej listy, z produktami zgrupowanymi w kategorie
export interface ListViewModel {
  id: string;
  name: string;
  groupedItems: CategoryViewModel[];
}

// Typ dla danych z formularza dodawania produktu
export interface AddProductFormData {
  name: string;
  quantity: number;
  unit: string;
  categoryId: number;
}
```

## 6. Zarządzanie stanem
Cały stan serwera (listy, kategorie, mutacje) będzie zarządzany przez **TanStack Query** w dedykowanym customowym hooku `useLastList`.

**`src/hooks/useLastList.ts`**
- **Cel**: Abstrakcja całej logiki pobierania danych i mutacji dla widoku listy.
- **`useQuery`**:
  - `['categories']`: Pobiera i cache'uje listę wszystkich kategorii (`GET /categories`).
  - `['lists', 'latest']`: Pobiera wszystkie listy posortowane malejąco po dacie utworzenia (`GET /lists?sort=created_at&order=desc`), aby uzyskać ID ostatniej listy.
  - `['list', latestListId]`: Pobiera szczegóły ostatniej listy (`GET /lists/{listId}`). Zapytanie jest włączone (`enabled: !!latestListId`) dopiero po uzyskaniu ID. W opcji `select` tego hooka nastąpi transformacja płaskiej listy `items` na zgrupowaną strukturę `ListViewModel`.
- **`useMutation`**:
  - `addListItem`: Do dodawania nowego produktu (`POST /list-items`).
  - `updateListItem`: Do edycji i zaznaczania produktów (`PATCH /list-items/{itemId}`).
  - `deleteListItem`: Do usuwania produktów (`DELETE /list-items/{itemId}`).
  - `reportAiFeedback`: Do zgłaszania błędów AI (`POST /ai-feedback`).
- **Optymistyczne aktualizacje**: Wszystkie mutacje (`add`, `update`, `delete`) będą implementować optymistyczne aktualizacje przy użyciu `onMutate` i mechanizmu przywracania stanu w `onError`.

## 7. Integracja API
Integracja będzie realizowana przez serwis `list.service.ts` i wywoływana w hooku `useLastList`.

- **Pobranie ostatniej listy**:
  1. `GET /api/v1/lists?sort=created_at&order=desc` -> Zwraca `List[]`.
  2. Z odpowiedzi pobierane jest `id` pierwszego elementu.
  3. `GET /api/v1/lists/{listId}` -> Zwraca `ShoppingList` z `items`.
- **Dodanie produktu (US-007)**:
  - `POST /api/v1/list-items`
  - **Request Body**: `{ list_id: string, category_id: number, name: string, quantity: number, unit: string }`
  - **Response (201)**: `ListItem`
- **Edycja produktu (US-008)**:
  - `PATCH /api/v1/list-items/{itemId}`
  - **Request Body**: `{ name?: string, quantity?: number, unit?: string, is_checked?: boolean }`
  - **Response (200)**: `ListItem`
- **Usunięcie produktu (US-009)**:
  - `DELETE /api/v1/list-items/{itemId}`
  - **Response (204)**: Brak zawartości.
- **Zgłoszenie błędu (US-010)**:
  - `POST /api/v1/ai-feedback`
  - **Request Body**: `{ item_id: string, list_id: string, feedback_type: 'wrong_ingredient', ... }`
  - **Response (201)**: Potwierdzenie.

## 8. Interakcje użytkownika
- **Zaznaczenie produktu**: Kliknięcie na `Checkbox` natychmiast zmienia stan UI (np. przekreślenie tekstu) i w tle wysyła `PATCH` w celu aktualizacji `is_checked`.
- **Dodanie produktu**: Po pomyślnej walidacji i kliknięciu "Dodaj", formularz jest czyszczony, a nowy produkt natychmiast pojawia się na liście w odpowiedniej kategorii. W tle wysyłany jest `POST`.
- **Usunięcie produktu**: Wybranie opcji "Mam już" natychmiast usuwa produkt z UI. W tle wysyłany jest `DELETE`.
- **Edycja produktu**: Wybranie "Edytuj" otwiera modal (dialog) z formularzem wypełnionym danymi produktu. Po zapisaniu zmian, UI jest optymistycznie aktualizowane, a w tle wysyłany jest `PATCH`.

## 9. Warunki i walidacja
- **Formularz dodawania/edycji**: Przycisk "Zapisz" jest nieaktywny, dopóki wszystkie pola (`name`, `quantity`, `unit`, `category`) nie spełnią kryteriów walidacji (niepuste, `quantity > 0`). Walidacja odbywa się na poziomie komponentu formularza.
- **Menu akcji**: Przycisk "Błędny składnik" jest renderowany warunkowo, tylko jeśli `item.source === 'ai'`.

## 10. Obsługa błędów
- **Błąd pobierania danych**: Jeśli którekolwiek z początkowych zapytań `GET` zakończy się błędem, komponent `LastListView` wyświetli komunikat o błędzie z prośbą o odświeżenie strony.
- **Brak list**: Jeśli `GET /lists` zwróci pustą tablicę, widok wyświetli informację zachęcającą do wygenerowania pierwszej listy, wraz z linkiem do odpowiedniej strony.
- **Błąd mutacji**: W przypadku niepowodzenia operacji `POST`, `PATCH` lub `DELETE`, optymistyczna zmiana w UI zostanie cofnięta, a użytkownik zobaczy powiadomienie typu "toast" z informacją o błędzie (np. "Nie udało się usunąć produktu. Spróbuj ponownie.").

## 11. Kroki implementacji
1.  **Stworzenie plików**: Utworzenie plików `src/pages/list.astro` oraz `src/components/features/last-list/[...].tsx` dla wszystkich zdefiniowanych komponentów.
2.  **Hook `useLastList`**: Implementacja logiki pobierania danych w `useLastList.ts`, włączając w to kaskadowe zapytania o listę i jej szczegóły oraz transformację danych do `ListViewModel`.
3.  **Komponent `LastListView`**: Budowa głównego komponentu, który używa hooka `useLastList` i renderuje stany ładowania, błędu lub sukcesu.
4.  **Komponenty prezentacyjne**: Implementacja `CategoryList`, `CategoryCard` i `ProductListItem` do wyświetlania danych.
5.  **Implementacja akcji (Mutations)**:
    - Dodanie mutacji `deleteListItem` do `useLastList` i podpięcie jej do `ItemActions` -> `ProductListItem`. Implementacja optymistycznego usunięcia.
    - Implementacja `AddProductForm` oraz mutacji `addListItem` w `useLastList`. Dodanie optymistycznego dodawania.
    - Implementacja modala do edycji, mutacji `updateListItem` i optymistycznej aktualizacji.
    - Implementacja mutacji `reportAiFeedback`.
6.  **Stany i walidacja**: Dodanie logiki walidacji do formularzy i obsługi stanu `disabled` przycisków.
7.  **Stylowanie i UX**: Dopracowanie wyglądu za pomocą komponentów Shadcn, dodanie animacji, toastów i obsługa responsywności.
8.  **Testowanie**: Manualne przetestowanie wszystkich ścieżek użytkownika, w tym przypadków brzegowych i obsługi błędów.
