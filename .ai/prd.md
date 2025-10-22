# Dokument wymagań produktu (PRD) - LISTIC

## 1. Przegląd produktu

LISTIC to inteligentna aplikacja webowa zaprojektowana w podejściu "mobile-first", której celem jest uproszczenie procesu tworzenia list zakupów. Aplikacja wykorzystuje sztuczną inteligencję do automatycznego generowania skonsolidowanych i skategoryzowanych list zakupów na podstawie przepisów wklejanych przez użytkownika. Główne funkcje obejmują automatyczną konwersję jednostek, kategoryzację produktów, a także możliwość manualnego dodawania i edycji listy. Aplikacja wspiera również kluczowe funkcjonalności w trybie offline, co czyni ją użyteczną bezpośrednio w sklepie.

## 2. Problem użytkownika

Tworzenie list zakupów na podstawie jednego lub wielu przepisów jest procesem czasochłonnym i podatnym na błędy. Użytkownicy muszą ręcznie agregować składniki, przeliczać jednostki (np. z imperialnych na metryczne), a następnie organizować listę tak, aby zakupy w sklepie były efektywne. Często prowadzi to do frustracji, zapominania o produktach, kupowania zbędnych rzeczy lub złej ilości danego produktu. Brak wygodnego narzędzia, które automatyzuje ten proces, zmusza użytkowników do korzystania z notatników lub niespecjalistycznych aplikacji, które nie rozwiązują problemu u jego źródła.

## 3. Wymagania funkcjonalne

### 3.1. System Kont Użytkowników

- Użytkownik może założyć konto za pomocą adresu e-mail i hasła.
- Proces rejestracji nie wymaga weryfikacji adresu e-mail.
- Podczas rejestracji wyświetlane jest wyraźne ostrzeżenie o konieczności podania poprawnego adresu e-mail, ponieważ jest to jedyna metoda odzyskania konta.
- Użytkownik może zalogować się na swoje konto.
- Użytkownik ma możliwość zresetowania hasła.
- Użytkownik ma możliwość trwałego usunięcia swojego konta.

### 3.2. Generowanie Listy Zakupów przez AI

- Interfejs umożliwia użytkownikowi dodanie do 10 dynamicznych pól tekstowych, gdzie każde pole jest przeznaczone na jeden przepis.
- AI przetwarza tekst wklejony we wszystkie pola w celu ekstrakcji składników, ich ilości i jednostek.
- AI agreguje zduplikowane składniki w jedną pozycję na liście (np. "100g mąki" + "200g mąki" -> "300g mąki").
- AI automatycznie konwertuje jednostki imperialne na metryczne (np. "1 cup" -> "240 ml"). Konwersja dotyczy prostych przypadków objętościowych.
- AI automatycznie kategoryzuje składniki według predefiniowanych 8 kategorii: Nabiał, Warzywa, Mięso, Suche, Owoce, Ryby, Przyprawy, Inne.
- W przypadku nierozpoznania tekstu, system informuje o tym użytkownika i pozwala na manualne dodanie pozycji.

### 3.3. Manualne Zarządzanie Listą

- Użytkownik może manualnie dodać nową pozycję do listy za pomocą pól: Nazwa, Ilość, Jednostka.
- Pole "Nazwa" wspierane jest przez funkcję autouzupełniania opartą na statycznym słowniku popularnych produktów.
- Użytkownik może edytować każdą pozycję na liście (zmienić nazwę, ilość, jednostkę). Zmiana jednostki (np. z "g" na "szt") jest tylko zmianą tekstową i nie pociąga za sobą automatycznych przeliczeń.
- Użytkownik może usunąć każdą pozycję z listy.

### 3.4. Interfejs Listy Zakupów

- Wygenerowana lista jest wyświetlana w formie pogrupowanej według 8 kategorii.
- Każda pozycja na liście posiada interaktywny checkbox do oznaczania produktów jako "kupione".
- Oznaczenie produktu jako "kupione" przesuwa produkt na koniec listy.
- Przy każdej pozycji znajdują się dwa przyciski:
  - [Mam już]: Usuwa pozycję z listy (nie jest to liczone jako modyfikacja na potrzeby metryk).
  - [Błędny składnik]: Oznacza pozycję jako błędnie przetworzoną przez AI, co służy do śledzenia jakości modelu.

### 3.5. Wymagania Techniczne

- Aplikacja jest aplikacją webową działającą w przeglądarce (Responsive Web Design).
- Interfejs jest zaprojektowany w podejściu "mobile-first".
- Aplikacja musi zapewniać podstawową funkcjonalność w trybie offline (przeglądanie ostatnio załadowanej listy, odhaczanie pozycji) z wykorzystaniem technologii PWA/LocalStorage.

## 4. Granice produktu

Następujące funkcje są świadomie wykluczone z zakresu MVP (Minimum Viable Product):

- Integracje z portalami społecznościowymi (logowanie przez Google, Facebook itp.).
- Weryfikacja adresu e-mail po rejestracji.
- Rozpoznawanie przez AI nagłówków i podsekcji w przepisach (np. "Składniki na krem").
- Automatyczne przeliczanie ilości przy manualnej zmianie jednostki przez użytkownika.
- Udostępnianie list zakupów innym użytkownikom.
- Tworzenie natywnych aplikacji mobilnych (iOS, Android).
- Historia list zakupów.
- Możliwość dodawania własnych kategorii.

## 5. Historyjki użytkowników

### Zarządzanie Kontem

- ID: US-001
- Tytuł: Rejestracja nowego konta
- Opis: Jako nowy użytkownik, chcę móc szybko założyć konto używając tylko adresu e-mail i hasła, abym mógł zapisywać i zarządzać moimi listami zakupów.
- Kryteria akceptacji:

  - 1. Formularz rejestracji zawiera pola: "E-mail", "Hasło", "Powtórz hasło".
  - 2. Wyświetlany jest komunikat informujący, że poprawny e-mail jest niezbędny do odzyskania hasła.
  - 3. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany do głównego panelu aplikacji.
  - 4. W przypadku błędu (np. zajęty e-mail) wyświetlany jest stosowny komunikat.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich list.
- Kryteria akceptacji:

  - 1. Formularz logowania zawiera pola: "E-mail", "Hasło".
  - 2. Po poprawnym zalogowaniu uzyskuję dostęp do ostatnio stworzonej listy lub panelu głównego.
  - 3. W przypadku podania błędnych danych wyświetlany jest komunikat o błędzie.

- ID: US-003
- Tytuł: Resetowanie hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę mieć możliwość jego zresetowania, abym mógł odzyskać dostęp do konta.
- Kryteria akceptacji:

  - 1. Na stronie logowania znajduje się link "Zapomniałem hasła".
  - 2. Po kliknięciu w link i podaniu adresu e-mail, na moją skrzynkę wysyłana jest instrukcja resetu hasła.
  - 3. Mogę ustawić nowe hasło dla mojego konta.

- ID: US-004
- Tytuł: Usuwanie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich powiązanych z nim danych.
- Kryteria akceptacji:
  - 1. W ustawieniach konta znajduje się opcja "Usuń konto".
  - 2. Akcja wymaga dodatkowego potwierdzenia (np. poprzez wpisanie hasła).
  - 3. Po usunięciu konta wszystkie dane użytkownika są trwale usuwane z systemu.

### Tworzenie i Zarządzanie Listą

- ID: US-005
- Tytuł: Generowanie listy zakupów z przepisów przez AI
- Opis: Jako użytkownik, chcę wkleić listy składników z kilku różnych przepisów w osobne pola, aby otrzymać jedną, zagregowaną i skategoryzowaną listę zakupów.
- Kryteria akceptacji:

  - 1. Mogę dodać do 10 pól tekstowych na przepisy.
  - 2. Po wklejeniu tekstów i kliknięciu przycisku "Generuj listę", AI przetwarza dane.
  - 3. Wynikiem jest jedna lista zakupów, na której składniki są połączone i pogrupowane w kategorie.
  - 4. Zduplikowane pozycje są agregowane (np. "1 jajko" + "2 jajka" -> "3 jajka").

- ID: US-006
- Tytuł: Automatyczna konwersja jednostek
- Opis: Jako użytkownik, który wkleił przepis z jednostkami imperialnymi, chcę, aby aplikacja automatycznie przeliczyła je na jednostki metryczne.
- Kryteria akceptacji:

  - 1. Pozycja "1 cup of flour" jest konwertowana na "240 ml mąki" na liście zakupów.
  - 2. Konwersja obejmuje podstawowe jednostki objętości i wagi.

- ID: US-007
- Tytuł: Manualne dodawanie produktu do listy
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania produktu do listy, którego zabrakło w przepisie lub który chcę dopisać.
- Kryteria akceptacji:

  - 1. Na ekranie listy znajduje się formularz z polami "Nazwa produktu", "Ilość", "Jednostka".
  - 2. Pole "Nazwa produktu" sugeruje pozycje ze statycznego słownika podczas wpisywania.
  - 3. Po dodaniu, produkt pojawia się w odpowiedniej kategorii na liście.

- ID: US-008
- Tytuł: Edycja pozycji na liście
- Opis: Jako użytkownik, chcę mieć możliwość edycji nazwy, ilości lub jednostki produktu na liście, jeśli AI popełniło błąd lub chcę coś zmienić.
- Kryteria akceptacji:

  - 1. Każda pozycja na liście ma opcję "Edytuj".
  - 2. Po kliknięciu mogę zmienić tekst w polach nazwy, ilości i jednostki.
  - 3. Zmiana jednostki z "g" na "szt" zmienia tylko etykietę, bez przeliczania ilości.

- ID: US-009
- Tytuł: Oznaczanie produktu jako "Mam już"
- Opis: Jako użytkownik, który przygotowuje się do zakupów, chcę oznaczyć produkty, które już mam w domu, aby usunąć je z finalnej listy zakupów.
- Kryteria akceptacji:

  - 1. Każda pozycja na liście ma przycisk [Mam już].
  - 2. Po kliknięciu przycisku, pozycja jest usuwana z listy.
  - 3. Ta akcja nie jest zliczana jako "modyfikacja" w metrykach jakości AI.

- ID: US-010
- Tytuł: Raportowanie błędnie rozpoznanego składnika
- Opis: Jako użytkownik, chcę móc oznaczyć, że dana pozycja została źle zinterpretowana przez AI, aby pomóc w doskonaleniu algorytmu.
- Kryteria akceptacji:

  - 1. Każda pozycja na liście wygenerowanej przez AI ma przycisk [Błędny składnik].
  - 2. Kliknięcie przycisku rejestruje zdarzenie w systemie analitycznym w celu dalszej analizy.
  - 3. Pozycja pozostaje na liście, aby użytkownik mógł ją manualnie edytować lub usunąć.

- ID: US-011
- Tytuł: Korzystanie z listy w trybie offline
- Opis: Jako użytkownik w sklepie, gdzie często jest słaby zasięg, chcę mieć dostęp do mojej listy zakupów i móc odhaczać produkty bez połączenia z internetem.
- Kryteria akceptacji:
  - 1. Po pierwszym załadowaniu listy przy aktywnym połączeniu, jest ona zapisywana w pamięci urządzenia.
  - 2. Mogę otworzyć aplikację i zobaczyć ostatnią listę będąc offline.
  - 3. Mogę odhaczać kupione produkty na liście w trybie offline.
  - 4. Zmiany są synchronizowane z serwerem po odzyskaniu połączenia z internetem.

## 6. Metryki sukcesu

### 6.1. Metryka Jakości AI (Modyfikacje)

- Cel: 75% list generowanych przez AI nie jest modyfikowana przez użytkownika.
- Sposób mierzenia: Procent list, na których użytkownik nie użył funkcji edycji (nazwy, ilości, jednostki) dla żadnej z pozycji wygenerowanych przez AI.
- Wykluczenia: Użycie przycisku [Mam już] nie jest liczone jako modyfikacja.
- Metryka wspierająca: Liczba użyć przycisku [Błędny składnik] na listę/sesję w celu monitorowania jakości działania AI.

### 6.2. Metryka Adopcji AI

- Cel: Użytkownicy tworzą 75% pozycji na listach zakupów z wykorzystaniem AI.
- Sposób mierzenia: Procent pozycji na wszystkich listach w systemie, które pochodzą z generatora AI, w przeciwieństwie do pozycji dodanych manualnie.
