# Listic

An intelligent web application designed to simplify the process of creating shopping lists from recipes.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

**Listic** is a smart, web application that streamlines shopping list creation. It leverages AI to automatically generate consolidated and categorized shopping lists by processing recipes pasted by the user. Key features include automatic unit conversion, product categorization, and offline support, making it a handy tool for grocery shopping.

The core problem this project aims to solve is the time-consuming and error-prone nature of manually creating shopping lists from one or more recipes. Listic automates the aggregation of ingredients, conversion of units, and organization of the list to make shopping more efficient.

## Tech Stack

- **Frontend:** [Astro](https://astro.build/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (via `class-variance-authority`, `clsx`, `tailwind-merge`)
- **Backend (Planned):** [Supabase](https://supabase.com/)
- **AI (Planned):** Recipe processing via an external API (e.g., OpenRouter)
- **Linting & Formatting:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/)
- **Package Manager:** [npm](https://www.npmjs.com/)

## Getting Started Locally

Follow these instructions to set up the project on your local machine.

### Prerequisites

- **Node.js:** Version `22.14.0`. It is recommended to use a version manager like [nvm](https://github.com/nvm-sh/nvm).

  ```bash
  nvm use
  ```

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ptypek/listic
    cd listic
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Then, fill in the required environment variables:
    - `SUPABASE_URL`: Your Supabase project URL.
    - `SUPABASE_KEY`: Your Supabase project anon key.
    - `OPENROUTER_API_KEY`: Your API key for OpenRouter or a similar service for AI processing.

### Running the Application

- **Start the development server:**
  ```bash
  npm run dev
  ```
  The application will be available at `http://localhost:3000`.

## Available Scripts

The following scripts are available in the `package.json`:

- `npm run dev`: Starts the Astro development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for preview.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.
- `npm run format`: Formats the code using Prettier.

## Project Scope

### Key Features (MVP)

- **User Authentication:** Users can create an account, log in, reset passwords, and delete their accounts.
- **AI-Powered List Generation:**
  - Paste up to 10 recipes to generate a single, aggregated shopping list.
  - AI extracts ingredients, quantities, and units.
  - Duplicate ingredients are consolidated.
  - Imperial units are automatically converted to metric.
  - Ingredients are categorized (e.g., Dairy, Vegetables, Meat, etc.).
- **Manual List Management:**
  - Manually add, edit, or delete items on the list.
  - Autocomplete for popular product names.
- **Interactive Shopping List UI:**
  - Grouped by category.
  - Checkboxes to mark items as purchased.
  - Options to mark items as "already owned" or flag incorrect AI parsing.
- **Offline Functionality:** View the last loaded list and check off items without an internet connection (using PWA/LocalStorage).

### Out of Scope (for now)

- Social media logins.
- Email verification.
- Sharing lists with other users.
- Shopping history.
- Custom categories.

## Project Status

The project is currently in the initial development phase, focusing on implementing the Minimum Viable Product (MVP) functionalities.

## License

This project does not have a specified license.
