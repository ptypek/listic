````markdown
# Schemat Bazy Danych PostgreSQL dla Aplikacji LISTIC

## 1. Lista Tabel

### `categories`

Statyczna tabela (lookup table) przechowująca predefiniowane kategorie produktów.

```sql
CREATE TABLE public.categories (
  id SMALLINT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Wypełnienie tabeli danymi
INSERT INTO public.categories (id, name) VALUES
(1, 'Nabiał'),
(2, 'Warzywa'),
(3, 'Mięso'),
(4, 'Suche'),
(5, 'Owoce'),
(6, 'Ryby'),
(7, 'Przyprawy'),
(8, 'Inne');
```
````

### `popular_products`

Statyczna tabela (lookup table) do wspierania funkcji autouzupełniania.

```sql
CREATE TABLE public.popular_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id SMALLINT NOT NULL REFERENCES public.categories(id)
);
```

### `shopping_lists`

Przechowuje listy zakupów utworzone przez użytkowników.

```sql
CREATE TABLE public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `list_items`

Przechowuje poszczególne pozycje na liście zakupów.

```sql
-- Definicja typu ENUM dla źródła pozycji
CREATE TYPE public.item_source AS ENUM ('ai', 'manual');

CREATE TABLE public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  category_id SMALLINT NOT NULL REFERENCES public.categories(id),
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'szt',
  is_checked BOOLEAN NOT NULL DEFAULT FALSE,
  source item_source NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `ai_feedback_log`

Loguje zgłoszenia "Błędny składnik" od użytkowników (US-010).

```sql
CREATE TABLE public.ai_feedback_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_item_id UUID REFERENCES public.list_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## 2. Relacje Między Tabelami

- **`auth.users` 1:N `shopping_lists`**: Jeden użytkownik może mieć wiele list zakupów. Klucz obcy `shopping_lists.user_id` wskazuje na `auth.users.id`.
- **`shopping_lists` 1:N `list_items`**: Jedna lista zakupów może zawierać wiele pozycji. Klucz obcy `list_items.list_id` wskazuje na `shopping_lists.id`.
- **`categories` 1:N `list_items`**: Jedna kategoria może być przypisana do wielu pozycji na liście. Klucz obcy `list_items.category_id` wskazuje na `categories.id`.
- **`categories` 1:N `popular_products`**: Jedna kategoria może być przypisana do wielu popularnych produktów. Klucz obcy `popular_products.category_id` wskazuje na `categories.id`.
- **`auth.users` 1:N `ai_feedback_log`**: Jeden użytkownik może zgłosić wiele błędów AI. Klucz obcy `ai_feedback_log.user_id` wskazuje na `auth.users.id`.
- **`list_items` 1:1 `ai_feedback_log` (opcjonalnie)**: Jedno zgłoszenie błędu dotyczy jednej pozycji na liście. Klucz obcy `ai_feedback_log.list_item_id` wskazuje na `list_items.id`. Relacja jest opcjonalna (`ON DELETE SET NULL`), aby zachować log błędu nawet po usunięciu pozycji z listy.

## 3. Indeksy

Klucze podstawowe i obce są domyślnie indeksowane przez PostgreSQL. Dodatkowe indeksy w celu optymalizacji zapytań:

```sql
-- Indeks na kluczu obcym w shopping_lists
CREATE INDEX idx_shopping_lists_user_id ON public.shopping_lists(user_id);

-- Indeksy na kluczach obcych w list_items
CREATE INDEX idx_list_items_list_id ON public.list_items(list_id);
CREATE INDEX idx_list_items_category_id ON public.list_items(category_id);

-- Indeks na kluczu obcym w popular_products
CREATE INDEX idx_popular_products_category_id ON public.popular_products(category_id);

-- Indeksy na kluczach obcych w ai_feedback_log
CREATE INDEX idx_ai_feedback_log_user_id ON public.ai_feedback_log(user_id);
CREATE INDEX idx_ai_feedback_log_list_item_id ON public.ai_feedback_log(list_item_id);
```

## 4. Zasady PostgreSQL (Row Level Security)

RLS zostanie włączone dla tabel przechowujących dane użytkowników, aby zapewnić, że mają oni dostęp tylko do własnych zasobów.

```sql
-- Włączenie RLS dla tabel
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popular_products ENABLE ROW LEVEL SECURITY;

-- Polityki dla tabeli shopping_lists
CREATE POLICY "Użytkownicy mogą zarządzać własnymi listami zakupów"
  ON public.shopping_lists FOR ALL
  USING (auth.uid() = user_id);

-- Polityki dla tabeli list_items
CREATE POLICY "Użytkownicy mogą zarządzać pozycjami na swoich listach"
  ON public.list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shopping_lists
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Polityki dla tabeli ai_feedback_log
CREATE POLICY "Użytkownicy mogą tworzyć i przeglądać własne zgłoszenia błędów"
  ON public.ai_feedback_log FOR ALL
  USING (auth.uid() = user_id);

-- Polityki dla tabel statycznych (tylko odczyt dla zalogowanych)
CREATE POLICY "Zalogowani użytkownicy mogą odczytywać kategorie"
  ON public.categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Zalogowani użytkownicy mogą odczytywać popularne produkty"
  ON public.popular_products FOR SELECT
  USING (auth.role() = 'authenticated');
```

## 5. Dodatkowe Uwagi i Automatyzacje

### Automatyczna aktualizacja `updated_at`

Aby wspierać funkcjonalność offline (US-011), kolumna `updated_at` musi być automatycznie aktualizowana przy każdej zmianie wiersza. Można to osiągnąć za pomocą funkcji i triggera w PostgreSQL.

```sql
-- Funkcja do aktualizacji timestampu
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli shopping_lists
CREATE TRIGGER set_timestamp_shopping_lists
BEFORE UPDATE ON public.shopping_lists
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger dla tabeli list_items
CREATE TRIGGER set_timestamp_list_items
BEFORE UPDATE ON public.list_items
FOR EACH ROW
EXECUTE PROCEDURE public.trigger_set_timestamp();
```

### Uzasadnienie Wyborów Projektowych

- **Brak tabeli `profiles`**: Zgodnie z decyzją, upraszcza to schemat i eliminuje potrzebę synchronizacji danych między `auth.users` a osobną tabelą profili.
- **`ON DELETE CASCADE`**: Zapewnia integralność danych i automatyzuje usuwanie powiązanych zasobów (list, pozycji, logów) po usunięciu konta użytkownika, co jest zgodne z wymaganiem US-004.
- **`ON DELETE SET NULL` dla `ai_feedback_log`**: Pozwala zachować historyczny log zgłoszenia błędu, nawet jeśli powiązana z nim pozycja na liście zostanie usunięta przez użytkownika.
- **Typ `NUMERIC(10, 2)`**: Zapewnia precyzyjne przechowywanie wartości ilościowych, w tym ułamkowych (np. 0.5 kg).
- **Typ `ENUM` dla `source`**: Jest bardziej wydajny pod względem przechowywania i zapytań niż `TEXT` z ograniczeniem `CHECK`.

```

```
