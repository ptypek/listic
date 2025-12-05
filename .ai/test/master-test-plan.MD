# Master Test Plan (MTP) - Projekt Listic

## 1. Wstęp i Cel

### 1.1. Wstęp

Niniejszy dokument stanowi główny plan testów (Master Test Plan) dla aplikacji **Listic**, inteligentnej listy zakupów. Projekt wykorzystuje nowoczesny stos technologiczny, obejmujący **Astro** i **React** na frontendzie, **Supabase** jako Backend-as-a-Service (BaaS) oraz integrację z **OpenRouter.ai** do generowania list opartych na sztucznej inteligencji.

Analiza kodu wykazała brak istniejącej infrastruktury testowej, w związku z czym ten plan definiuje strategię jej budowy od podstaw.

### 1.2. Cel Planu Testów

Głównym celem jest zapewnienie i weryfikacja jakości, niezawodności, wydajności i bezpieczeństwa aplikacji Listic. Plan ma na celu:

- Zdefiniowanie kompleksowej strategii testowania na wszystkich poziomach aplikacji.
- Identyfikację krytycznych obszarów biznesowych wymagających szczególnej uwagi.
- Ustanowienie standardów dla pisania testów i mierzenia ich pokrycia.
- Zapewnienie, że nowe funkcje i poprawki błędów nie wprowadzają regresji.
- Stworzenie fundamentów pod automatyzację procesów QA w ramach CI/CD.

## 2. Strategia Testów

Opieramy strategię na klasycznej piramidzie testów, aby zapewnić zrównoważone pokrycie, szybkość wykonania i łatwość utrzymania.

![Piramida Testów](https://martinfowler.com/bliki/images/testPyramid/test-pyramid.png)

### 2.1. Poziomy Testów i Narzędzia

| Poziom Testów                              | Opis i Zakres                                                                                                                  | Rekomendowane Narzędzia                                                                                                                                                                                                                                                                                         | Przykładowe Cele Testów w Projekcie                                                                                                                                                                                                                                                                                   |
| :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Testy Jednostkowe (Unit Tests)**         | Weryfikacja małych, izolowanych fragmentów kodu (funkcji, komponentów) bez zależności zewnętrznych (np. baza danych, API).     | • **Vitest**: Nowoczesny i szybki framework testowy, kompatybilny z Vite (używanym przez Astro).<br>• **React Testing Library**: Do testowania komponentów React (`.tsx`) w sposób zorientowany na użytkownika.<br>• **`@supabase/supabase-js` Mocks**: Do izolowania logiki od rzeczywistych wywołań Supabase. | • Funkcje w `src/services/*.ts` (np. logika biznesowa w `list.service.ts`).<br>• Walidatory Zod w `src/lib/validators/*.ts`.<br>• Pojedyncze komponenty UI z `src/components/ui/` i `src/components/features/`.                                                                                                       |
| **Testy Integracyjne (Integration Tests)** | Weryfikacja współpracy między modułami. Testowanie endpointów API w izolacji od UI, ale z połączeniem do testowej bazy danych. | • **Vitest** z **Supertest**: Do wysyłania żądań HTTP do endpointów API Astro (`src/pages/api/v1/**/*.ts`).<br>• **Testowa baza danych Supabase**: Osobny projekt w Supabase lub schemat do celów testowych.<br>• **Mock Service Worker (MSW)**: Do mockowania zewnętrznych API, np. OpenRouter.ai.             | • Endpoint `POST /api/v1/lists/generate-from-recipes.ts` - weryfikacja całego przepływu od żądania po zapis w bazie.<br>• Sprawdzenie działania polityk RLS (Row Level Security) dla różnych użytkowników.<br>• Interakcja między komponentem React a hookiem (np. `GenerateListFeature.tsx` i `useGenerateList.ts`). |
| **Testy End-to-End (E2E)**                 | Symulacja pełnych scenariuszy użytkownika w przeglądarce, od logowania po wykonanie kluczowej akcji.                           | • **Playwright**: Nowoczesne narzędzie do automatyzacji E2E, oferujące szybkość, niezawodność i świetne narzędzia deweloperskie.                                                                                                                                                                                | • Pełny przepływ rejestracji i logowania użytkownika.<br>• Scenariusz: "Użytkownik loguje się, generuje listę z przepisów, dodaje ręcznie produkt, a następnie usuwa listę".<br>• Weryfikacja responsywności UI na różnych urządzeniach.                                                                              |

## 3. Obszary Krytyczne (Critical Paths)

Poniższe funkcjonalności mają najwyższy priorytet biznesowy i muszą być pokryte testami na wszystkich poziomach.

1.  **Proces Uwierzytelniania Użytkownika:**
    - **Opis:** Rejestracja, logowanie, wylogowywanie oraz ochrona ścieżek.
    - **Pliki:** `src/pages/login.astro`, `register.astro`, `api/v1/auth/*`, `src/middleware/index.ts`.
    - **Ryzyko:** Błędy w tym obszarze uniemożliwiają korzystanie z aplikacji i mogą prowadzić do wycieku danych.

2.  **Generowanie Listy z Przepisów (AI Feature):**
    - **Opis:** Kluczowa funkcja aplikacji, która przetwarza dane wejściowe, komunikuje się z zewnętrznym API (OpenRouter.ai), przetwarza odpowiedź i zapisuje wyniki w bazie danych.
    - **Pliki:** `src/services/list.service.ts` (metoda `generateListFromRecipes`), `src/pages/api/v1/lists/generate-from-recipes.ts`.
    - **Ryzyko:** Zależność od zewnętrznego serwisu, złożoność parsowania danych, potencjalne błędy w transakcjach bazodanowych.

3.  **Zarządzanie Listą i Produktami (CRUD):**
    - **Opis:** Ręczne tworzenie, odczyt, aktualizacja i usuwanie list oraz ich poszczególnych produktów.
    - **Pliki:** `src/services/list.service.ts`, `src/pages/api/v1/lists/**/*.ts`, `src/pages/api/v1/list-items/**/*.ts`.
    - **Ryzyko:** Błędy w logice biznesowej mogą prowadzić do utraty danych użytkownika. Kluczowe jest rygorystyczne testowanie polityk RLS, aby użytkownik nie miał dostępu do danych innych użytkowników.

4.  **Wyświetlanie Ostatniej Listy i Kategorii:**
    - **Opis:** Główny widok aplikacji po zalogowaniu, prezentujący ostatnią listę zakupów z podziałem na kategorie.
    - **Pliki:** `src/components/features/last-list/LastListView.tsx`, `src/hooks/useLastList.ts`.
    - **Ryzyko:** Problemy z wydajnością przy dużej liczbie produktów, błędy w grupowaniu i sortowaniu.

## 4. Scenariusze Testowe (Przykłady)

### Moduł: Generowanie Listy z Przepisów (`generateListFromRecipes`)

| Typ                  | Scenariusz                                                                                              | Oczekiwany Rezultat                                                                                                                                                                                                                           |
| :------------------- | :------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Happy Path**       | Użytkownik wysyła 2 przepisy z powtarzającymi się składnikami.                                          | • API zwraca status `201 Created`.<br>• W bazie danych tworzona jest nowa lista.<br>• Składniki są poprawnie złączone, przetłumaczone na j. polski i przeliczone na jednostki metryczne.<br>• Każdy produkt ma przypisaną poprawną kategorię. |
| **Edge Case**        | Przepis zawiera składnik, którego kategoria nie jest zdefiniowana w mapowaniu `aiCategoryToDbCategory`. | • Składnik zostaje przypisany do domyślnej kategorii "inne".<br>• Proces kończy się sukcesem.                                                                                                                                                 |
| **Edge Case**        | Zewnętrzne API (OpenRouter.ai) zwraca niepoprawny format JSON lub błąd 500.                             | • `list.service.ts` poprawnie przechwytuje błąd.<br>• API zwraca status `500 Internal Server Error` z czytelnym komunikatem.<br>• Żadne dane nie są zapisywane w bazie (transakcja jest wycofywana).                                          |
| **Błędne Dane**      | Użytkownik wysyła pustą listę przepisów lub nazwę listy.                                                | • Walidator Zod (`generateListFromRecipesSchema`) odrzuca żądanie.<br>• API zwraca status `400 Bad Request` z informacją o błędach walidacji.                                                                                                 |
| **Brak Autoryzacji** | Niezalogowany użytkownik próbuje wywołać endpoint.                                                      | • Middleware lub sam endpoint zwraca status `401 Unauthorized`.                                                                                                                                                                               |

## 5. Dane Testowe i Środowisko

### 5.1. Dane Testowe

- **Mocki (Unit/Integration):** Do testów jednostkowych i integracyjnych dane powinny być mockowane. Dla `list.service.ts` należy mockować klienta Supabase, aby symulować odpowiedzi z bazy danych oraz klienta OpenAI, aby symulować odpowiedzi z AI.
- **Seedowanie Bazy Danych (Integration/E2E):** Należy stworzyć skrypt (`/supabase/seed.sql` lub skrypt TS) do wypełniania testowej bazy danych. Skrypt powinien tworzyć:
  - Co najmniej 2 testowych użytkowników.
  - Kilka list zakupów przypisanych do różnych użytkowników.
  - Produkty w listach.
  - Dane te zapewnią spójne i powtarzalne warunki dla testów integracyjnych i E2E.

### 5.2. Środowisko Testowe

- **Zmienne Środowiskowe:** Należy utworzyć plik `.env.test`, który będzie zawierał konfigurację dla środowiska testowego, w tym:
  - `SUPABASE_URL` i `SUPABASE_ANON_KEY` dla **dedykowanego projektu testowego w Supabase**.
  - Opcjonalnie, mockowany klucz API dla OpenRouter.
- **Baza Danych:** **Krytyczne jest używanie osobnej bazy danych do testów**, aby uniknąć zanieczyszczenia lub usunięcia danych deweloperskich/produkcyjnych. Supabase ułatwia tworzenie nowych projektów, które mogą służyć jako środowisko testowe.

## 6. Plan Automatyzacji w CI/CD

Automatyzacja jest kluczem do utrzymania jakości w dynamicznie rozwijanym projekcie. Proponuję następujący plan wdrożenia w **GitHub Actions**.

### Krok 1: Natychmiastowa implementacja (na każdy Pull Request)

1.  **Linting & Formatting Check:**
    - `npm run lint`
    - `prettier --check .`
    - Cel: Zapewnienie spójności i jakości kodu przed merge.

2.  **Testy Jednostkowe i Integracyjne (API):**
    - `npm test` (po skonfigurowaniu Vitest)
    - Cel: Szybkie wykrywanie regresji w logice biznesowej i na endpointach. Testy te powinny być szybkie (wykonanie poniżej 1 minuty).

### Krok 2: Wdrożenie w późniejszej fazie (uruchamiane przed deploymentem lub w nocy)

1.  **Testy End-to-End (E2E):**
    - `npx playwright test`
    - Cel: Weryfikacja krytycznych ścieżek użytkownika w realnym środowisku. Ze względu na czas wykonania i potencjalną niestabilność, mogą być uruchamiane rzadziej niż testy jednostkowe.

2.  **Generowanie Raportu Pokrycia Testami (Code Coverage):**
    - `vitest run --coverage`
    - Cel: Monitorowanie pokrycia kodu testami i identyfikacja nieprzetestowanych obszarów. Raporty mogą być publikowane np. na Codecov.
