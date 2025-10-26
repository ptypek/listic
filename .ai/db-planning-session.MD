<conversation_summary>
<decisions>

Nie będzie tworzona osobna tabela profiles. Encje (listy) będą bezpośrednio powiązane z tabelą auth.users dostarczaną przez Supabase.

Zaimplementowana zostanie relacja 1:N między użytkownikiem a listami zakupów (users 1:N shopping_lists). W MVP aplikacja będzie wyświetlać tylko ostatnią listę.

8 predefiniowanych kategorii produktów będzie przechowywanych w osobnej, statycznej tabeli categories (lookup table).

Tabela popular_products zostanie utworzona jako statyczny słownik do autouzupełniania, zawierający powiązanie z tabelą categories.

Kolumna quantity w tabeli list_items będzie typu NUMERIC(10, 2).

Kolumny quantity i unit w list_items będą miały wartości domyślne: quantity jako 1 i unit jako 'szt', i obie będą NOT NULL.

Do tabeli list_items zostanie dodana kolumna is_checked (typu BOOLEAN).

Zostanie utworzona osobna tabela ai_feedback_log do śledzenia zgłoszeń "Błędny składnik" (US-010).

Klucze obce łączące dane użytkownika (shopping_lists.user_id oraz list_items.list_id) będą używać ON DELETE CASCADE do automatycznego usuwania danych po usunięciu konta (US-004).

Tabela list_items będzie zawierać kolumnę source typu ENUM z wartościami ('ai', 'manual') do śledzenia Metryki 6.2.

Tabele shopping_lists i list_items będą posiadały kolumny updated_at zarządzane przez automatyczny trigger PostgreSQL, aby wspierać funkcjonalność offline (US-011).

Zasady RLS (Row Level Security) zostaną zaimplementowane tak, aby użytkownicy mieli dostęp (CRUD) tylko do własnych list i ich elementów.

Tabele categories i popular_products będą dostępne tylko do odczytu (SELECT) dla wszystkich zalogowanych użytkowników (rola authenticated).

Na potrzeby Metryki 6.1 (Modyfikacje), dodanie nowej pozycji manualnie (source = 'manual') przez użytkownika będzie traktowane jako modyfikacja listy wygenerowanej przez AI.

Tabela shopping_lists będzie posiadała kolumnę name (typu TEXT), której wartość będzie nadawana przez aplikację (np. "Lista nr 1", "Lista nr 2").

</decisions>

<matched_recommendations>

Rekomendacja, aby nie tworzyć tabeli profiles i wiązać dane bezpośrednio z auth.users.id.

Rekomendacja implementacji relacji 1:N (users 1:N shopping_lists) z logiką MVP ograniczoną do LIMIT 1.

Rekomendacja stworzenia tabeli popular_products jako statycznego słownika z powiązaniem do kategorii.

Rekomendacja włączenia RLS na shopping_lists i list_items w oparciu o user_id = auth.uid().

Rekomendacja dodania kolumn updated_at (np. TIMESTAMPZ) i automatyzacji ich aktualizacji za pomocą triggera PostgreSQL (np. trigger_set_timestamp).

Rekomendacja ustawienia ON DELETE CASCADE dla kluczy obcych shopping_lists.user_id oraz list_items.list_id.

Rekomendacja, aby tabela categories była statyczną tabelą (lookup table) wypełnioną predefiniowanymi wartościami.

Rekomendacja dla struktury tabeli ai_feedback_log z kluczem obcym list_item_id ustawionym na ON DELETE SET NULL.

Rekomendacja użycia typu NUMERIC dla kolumny quantity (choć użytkownik zmienił precyzję z 10,3 na 10,2).

Rekomendacja dodania kolumny is_checked BOOLEAN NOT NULL DEFAULT FALSE do tabeli list_items.

Rekomendacja stworzenia typu ENUM (np. item_source AS ENUM ('ai', 'manual')) dla kolumny source.

Rekomendacja włączenia RLS na categories i popular_products zezwalającej na SELECT dla roli authenticated.

</matched_recommendations>

<database_planning_summary>

Główne wymagania dotyczące schematu bazy danych
Schemat bazy danych PostgreSQL (w ramach Supabase) musi wspierać aplikację webową "mobile-first" (LISTIC) do zarządzania listami zakupów. Kluczowe wymagania obejmują:

Integrację z systemem autentykacji Supabase (auth.users).

Obsługę wielu list zakupów na użytkownika.

Przechowywanie pozycji na liście wraz z ilością, jednostką, kategorią i statusem (kupione/niekupione).

Wsparcie dla funkcjonalności offline (PWA) poprzez śledzenie czasu ostatniej modyfikacji (updated_at).

Możliwość rozróżniania pozycji dodanych przez AI od pozycji dodanych manualnie (na potrzeby metryk).

Mechanizm logowania błędów AI zgłaszanych przez użytkowników.

Automatyczne usuwanie danych użytkownika (kaskadowe) po usunięciu konta.

Dwie statyczne tabele (categories, popular_products) do wspierania UI (kategoryzacja, autouzupełnianie).

Kluczowe encje i ich relacje
auth.users (dostarczane przez Supabase): Przechowuje dane logowania użytkowników.

categories: Statyczna tabela (lookup table) zawierająca 8 predefiniowanych kategorii (np. "Nabiał", "Warzywa").

Relacje: 1:N z popular_products i list_items.

popular_products: Statyczna tabela (lookup table) do autouzupełniania.

Pola: id, name, category_id (FK do categories.id).

Relacje: N:1 z categories.

shopping_lists: Przechowuje listy zakupów użytkowników.

Pola: id (PK), user_id (FK do auth.users.id, ON DELETE CASCADE), name (TEXT, NOT NULL), created_at, updated_at.

Relacje: 1:N z auth.users.

list_items: Przechowuje poszczególne produkty na liście zakupów.

Pola: id (PK), list_id (FK do shopping_lists.id, ON DELETE CASCADE), category_id (FK do categories.id), name (TEXT, NOT NULL), quantity (NUMERIC(10, 2), NOT NULL, DEFAULT 1), unit (TEXT, NOT NULL, DEFAULT 'szt'), is_checked (BOOLEAN, NOT NULL, DEFAULT FALSE), source (item_source ENUM('ai', 'manual')), updated_at.

Relacje: N:1 z shopping_lists; N:1 z categories.

ai_feedback_log: Loguje zgłoszenia błędów AI przez użytkowników (US-010).

Pola: id (PK), user_id (FK do auth.users.id, ON DELETE CASCADE), list_item_id (FK do list_items.id, ON DELETE SET NULL), created_at.

Relacje: N:1 z auth.users; N:1 z list_items (z możliwością SET NULL).

Ważne kwestie dotyczące bezpieczeństwa i skalowalności
Bezpieczeństwo (RLS): Dostęp do danych będzie ściśle kontrolowany.

shopping_lists i list_items: Pełne uprawnienia (CRUD) tylko dla właściciela danych (polityka oparta na user_id = auth.uid()).

categories i popular_products: Uprawnienia SELECT dla wszystkich zalogowanych użytkowników (rola authenticated).

ai_feedback_log: Uprawnienia INSERT dla zalogowanych użytkowników, SELECT ograniczony (np. do administratorów).

Wydajność/Skalowalność:

Synchronizacja offline (US-011) będzie wspierana przez triggery PostgreSQL na shopping_lists i list_items, które automatycznie aktualizują kolumnę updated_at przy każdej operacji UPDATE.

Użycie typu ENUM dla kolumny source jest wydajniejsze niż TEXT z ograniczeniem CHECK.

Klucze obce (np. user_id, list_id, category_id) zostaną zaindeksowane w celu przyspieszenia zapytań (JOIN).

</database_planning_summary>
</conversation_summary>
