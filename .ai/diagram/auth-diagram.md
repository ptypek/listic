<architecture_analysis>
1.  **Wypis komponentów:**
    *   **Strony Astro:** `login.astro`, `register.astro`, `forgot-password.astro`, `reset-password.astro`, `auth/callback.astro`. Zmodyfikowane zostaną `index.astro` i `src/layouts/Layout.astro`.
    *   **Komponenty React:** `LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`.
    *   **Layout:** `src/layouts/Layout.astro`.
    *   **Middleware:** `src/middleware/index.ts`.
    *   **API Endpoints:** `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/logout`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password`.

2.  **Główne strony i ich komponenty:**
    *   `login.astro` renderuje `LoginForm.tsx`.
    *   `register.astro` renderuje `RegisterForm.tsx`.
    *   `forgot-password.astro` renderuje `ForgotPasswordForm.tsx`.
    *   `reset-password.astro` renderuje `ResetPasswordForm.tsx`.
    *   `Layout.astro` dynamicznie wyświetla linki logowania/rejestracji lub awatar użytkownika.
    *   `index.astro` warunkowo renderuje główną funkcjonalność (`GenerateListFeature`) tylko dla zalogowanych użytkowników.

3.  **Przepływ danych:**
    *   Użytkownik (gość) wchodzi na stronę publiczną (np. `/login`).
    *   `Layout.astro` (przez middleware) nie znajduje sesji i wyświetla przyciski "Zaloguj" i "Zarejestruj".
    *   Komponent React (np. `LoginForm.tsx`) obsługuje formularz i wysyła dane do odpowiedniego endpointu API Astro (`/api/v1/auth/login`).
    *   Endpoint API komunikuje się z Supabase w celu autentykacji.
    *   Po pomyślnej autentykacji, Supabase ustawia cookies sesji, a użytkownik jest przekierowywany na stronę główną.
    *   Middleware przechwytuje nowe żądanie, weryfikuje sesję z cookies i udostępnia ją w `Astro.locals`.
    *   `Layout.astro` i `index.astro` renderują widok dla zalogowanego użytkownika.

4.  **Opis funkcjonalności:**
    *   **Strony `.astro`:** Służą jako "szkielety" HTML, które osadzają w sobie interaktywne komponenty React.
    *   **Komponenty `.tsx`:** Zarządzają stanem formularzy, walidacją po stronie klienta i komunikacją z API.
    *   **`Layout.astro`:** Główny szablon strony, który dostosowuje UI (nagłówek) w zależności od stanu zalogowania.
    *   **`middleware/index.ts`:** Kluczowy element architektury; uruchamiany przy każdym żądaniu, weryfikuje sesję użytkownika i udostępnia ją w kontekście Astro, chroniąc strony i endpointy.
    *   **Endpointy API:** Logika serwerowa, która bezpiecznie komunikuje się z Supabase Auth, izolując klucze API od frontendu.

</architecture_analysis>
<mermaid_diagram>
```mermaid
flowchart TD
    classDef modified fill:#FFC,stroke:#333,stroke-width:2px;
    classDef new fill:#E8F5E9,stroke:#333,stroke-width:2px;
    classDef page fill:#E3F2FD,stroke:#333,stroke-width:2px;
    classDef component fill:#FFF9C4,stroke:#333,stroke-width:2px;
    classDef api fill:#FCE4EC,stroke:#333,stroke-width:2px;
    classDef layout fill:#EDE7F6,stroke:#333,stroke-width:2px;

    subgraph "Warstwa Prezentacji (UI)"
        subgraph "Publiczne Strony Astro"
            direction LR
            P_Login["/login.astro"]:::page
            P_Register["/register.astro"]:::page
            P_Forgot["/forgot-password.astro"]:::page
            P_Reset["/reset-password.astro"]:::page
        end

        subgraph "Komponenty React (Formularze)"
            direction LR
            C_Login["LoginForm.tsx"]:::new
            C_Register["RegisterForm.tsx"]:::new
            C_Forgot["ForgotPasswordForm.tsx"]:::new
            C_Reset["ResetPasswordForm.tsx"]:::new
        end

        subgraph "Główna Aplikacja"
            P_Index["/index.astro"]:::modified
            C_Generate["GenerateListFeature.tsx"]
            C_Avatar["Avatar.tsx"]:::new
        end
    end

    subgraph "Warstwa Pośrednicząca i Logiki Biznesowej (Astro Backend)"
        MW["middleware/index.ts"]:::new
        L_Layout["Layout.astro"]:::modified
        class L_Layout layout

        subgraph "API Endpoints (/api/v1/auth)"
            direction TB
            API_Login["POST /login"]:::api
            API_Register["POST /register"]:::api
            API_Logout["POST /logout"]:::api
            API_Forgot["POST /forgot-password"]:::api
            API_Reset["POST /reset-password"]:::api
        end
    end

    subgraph "Zewnętrzne Usługi"
        Ext_Supabase["Supabase Auth & DB"]
    end

    %% Relacje
    P_Login --> C_Login
    P_Register --> C_Register
    P_Forgot --> C_Forgot
    P_Reset --> C_Reset

    C_Login -- "Wywołanie API" --> API_Login
    C_Register -- "Wywołanie API" --> API_Register
    C_Forgot -- "Wywołanie API" --> API_Forgot
    C_Reset -- "Wywołanie API" --> API_Reset
    C_Avatar -- "Wywołanie API" --> API_Logout

    P_Index -- "Renderuje warunkowo" --> C_Generate

    L_Layout -- "Sprawdza sesję" --> MW
    P_Index -- "Sprawdza sesję" --> MW
    API_Login -- "Sprawdza sesję" --> MW
    
    MW -- "Weryfikuje sesję z" --> Ext_Supabase

    L_Layout -- "Osadza strony" --> P_Login
    L_Layout -- "Osadza strony" --> P_Register
    L_Layout -- "Osadza strony" --> P_Forgot
    L_Layout -- "Osadza strony" --> P_Reset
    L_Layout -- "Osadza strony" --> P_Index
    L_Layout -- "Renderuje warunkowo" --> C_Avatar

    API_Login -- "Uwierzytelnianie" --> Ext_Supabase
    API_Register -- "Rejestracja" --> Ext_Supabase
    API_Logout -- "Wylogowanie" --> Ext_Supabase
    API_Forgot -- "Reset hasła" --> Ext_Supabase
    API_Reset -- "Aktualizacja użytkownika" --> Ext_Supabase
    
    Ext_Supabase -- "Zapis/odczyt list" --> C_Generate
```
</mermaid_diagram>