# REST API Plan

This document outlines the REST API for the LISTIC application, based on the database schema, PRD, and tech stack. The API will be implemented using Supabase Edge Functions.

## 1. Resources

- **Shopping Lists (`/lists`)**: Represents a user's shopping list. Corresponds to the `shopping_lists` table.
- **List Items (`/list-items`)**: Represents an item within a shopping list. Corresponds to the `list_items` table.
- **Categories (`/categories`)**: A read-only resource for predefined product categories. Corresponds to the `categories` table.
- **Products (`/products`)**: A read-only resource for searching popular products to support autocomplete. Corresponds to the `popular_products` table.
- **AI Feedback (`/ai-feedback`)**: A resource for logging user feedback about AI-generated items. Corresponds to the `ai_feedback_log` table.
- **AI List Generation (`/lists/generate-from-recipes`)**: An RPC-style endpoint for the core AI feature.

## 2. Endpoints

All endpoints are prefixed with `/api/v1`. All endpoints require authentication unless otherwise specified.

---

### Resource: Shopping Lists (`/lists`)

#### GET /lists
- **Description**: Retrieve all shopping lists for the authenticated user.
- **Query Parameters**:
    - `sort` (string, optional): Field to sort by (e.g., `created_at`, `name`). Default: `created_at`.
    - `order` (string, optional): `asc` or `desc`. Default: `desc`.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid-goes-here",
      "user_id": "auth-user-uuid",
      "name": "Weekly Groceries",
      "created_at": "2025-10-26T10:00:00Z",
      "updated_at": "2025-10-26T12:00:00Z"
    }
  ]
  ```
- **Error Responses**:
    - `401 Unauthorized`: User is not authenticated.

#### POST /lists
- **Description**: Create a new, empty shopping list.
- **Request Body**:
  ```json
  {
    "name": "New List Name"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": "new-uuid-goes-here",
    "user_id": "auth-user-uuid",
    "name": "New List Name",
    "created_at": "2025-10-26T13:00:00Z",
    "updated_at": "2025-10-26T13:00:00Z"
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: `name` is missing or empty.
    - `401 Unauthorized`: User is not authenticated.

#### GET /lists/{listId}
- **Description**: Retrieve a single shopping list, including all its items.
- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid-goes-here",
    "name": "Weekly Groceries",
    "created_at": "2025-10-26T10:00:00Z",
    "updated_at": "2025-10-26T12:00:00Z",
    "items": [
      {
        "id": "item-uuid-1",
        "list_id": "uuid-goes-here",
        "category_id": 1,
        "name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "is_checked": false,
        "source": "manual",
        "created_at": "2025-10-26T10:05:00Z",
        "updated_at": "2025-10-26T11:30:00Z"
      }
    ]
  }
  ```
- **Error Responses**:
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: List does not exist or user does not have access.

#### PATCH /lists/{listId}
- **Description**: Update a shopping list's details (e.g., its name).
- **Request Body**:
  ```json
  {
    "name": "Updated List Name"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid-goes-here",
    "user_id": "auth-user-uuid",
    "name": "Updated List Name",
    "created_at": "2025-10-26T10:00:00Z",
    "updated_at": "2025-10-26T14:00:00Z"
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: `name` is empty.
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: List does not exist or user does not have access.

#### DELETE /lists/{listId}
- **Description**: Permanently delete a shopping list and all its items (cascade delete).
- **Success Response (204 No Content)**
- **Error Responses**:
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: List does not exist or user does not have access.

---

### Resource: List Items (`/list-items`)

#### POST /list-items
- **Description**: Add a new item to a shopping list (manual addition).
- **Request Body**:
  ```json
  {
    "list_id": "shopping-list-uuid",
    "category_id": 2,
    "name": "Tomatoes",
    "quantity": 5,
    "unit": "pcs"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "id": "new-item-uuid",
    "list_id": "shopping-list-uuid",
    "category_id": 2,
    "name": "Tomatoes",
    "quantity": 5,
    "unit": "pcs",
    "is_checked": false,
    "source": "manual",
    "created_at": "2025-10-26T15:00:00Z",
    "updated_at": "2025-10-26T15:00:00Z"
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: Invalid or missing fields (`list_id`, `category_id`, `name`).
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: The specified `list_id` or `category_id` does not exist.

#### PATCH /list-items/{itemId}
- **Description**: Update an item on a list (name, quantity, unit, or checked status).
- **Request Body**:
  ```json
  {
    "name": "Ripe Tomatoes",
    "quantity": 6,
    "unit": "pcs",
    "is_checked": true
  }
  ```
- **Success Response (200 OK)**: Returns the updated list item object.
- **Error Responses**:
    - `400 Bad Request`: Invalid field values.
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: Item does not exist or user does not have access.

#### DELETE /list-items/{itemId}
- **Description**: Permanently delete an item from a list. Used for the "I have it already" feature.
- **Success Response (204 No Content)**
- **Error Responses**:
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: Item does not exist or user does not have access.

---

### Resource: User (`/user`)

#### DELETE /user
- **Description**: Permanently delete the authenticated user's account and all associated data. This action is irreversible.
- **Success Response (204 No Content)**
- **Error Responses**:
    - `401 Unauthorized`: User is not authenticated.
    - `500 Internal Server Error`: Failed to delete user account.

---

### RPC Endpoint: AI List Generation

#### POST /lists/generate-from-recipes
- **Description**: Processes raw text from recipes, calls the AI service, and creates a new shopping list with categorized and aggregated items.
- **Request Body**:
  ```json
  {
    "list_name": "Dinner Party List",
    "recipes": [
      "Recipe 1: 1 cup flour, 2 eggs...",
      "Recipe 2: 1/2 cup flour, 100g butter..."
    ]
  }
  ```
- **Success Response (201 Created)**: Returns the full `shopping_list` object with its `items`, similar to `GET /lists/{listId}`.
- **Error Responses**:
    - `400 Bad Request`: `list_name` or `recipes` are invalid (e.g., empty, too many recipes).
    - `401 Unauthorized`: User is not authenticated.
    - `502 Bad Gateway`: The external AI service (Openrouter.ai) failed to process the request.

---

### Other Resources

#### GET /categories
- **Description**: Retrieve the list of all 8 predefined product categories. This is a static lookup table.
- **Authentication**: Not required. Can be public.
- **Success Response (200 OK)**:
  ```json
  [
    { "id": 1, "name": "Nabiał" },
    { "id": 2, "name": "Warzywa" },
    { "id": 3, "name": "Mięso" },
    { "id": 4, "name": "Suche" },
    { "id": 5, "name": "Owoce" },
    { "id": 6, "name": "Ryby" },
    { "id": 7, "name": "Przyprawy" },
    { "id": 8, "name": "Inne" }
  ]
  ```

#### GET /products/search
- **Description**: Search for popular products to power the autocomplete feature.
- **Query Parameters**:
    - `q` (string, required): The search term (e.g., "mil").
- **Success Response (200 OK)**:
  ```json
  [
    { "id": "uuid-1", "name": "Milk", "category_id": 1 },
    { "id": "uuid-2", "name": "Millet", "category_id": 4 }
  ]
  ```
- **Error Responses**:
    - `400 Bad Request`: Query parameter `q` is missing.
    - `401 Unauthorized`: User is not authenticated.

#### POST /ai-feedback
- **Description**: Log a report that an AI-generated item was incorrect.
- **Request Body**:
  ```json
  {
    "list_item_id": "item-uuid-flagged-as-error"
  }
  ```
- **Success Response (202 Accepted)**:
  ```json
  {
    "message": "Feedback received. Thank you!"
  }
  ```
- **Error Responses**:
    - `400 Bad Request`: `list_item_id` is missing or invalid.
    - `401 Unauthorized`: User is not authenticated.
    - `404 Not Found`: The specified `list_item_id` does not exist.

## 3. Authentication and Authorization

- **Authentication**: The API will use Supabase's built-in JWT-based authentication. The client (Astro/React app) will use the `supabase-js` library to handle user sign-up, sign-in, and session management. The JWT token will be sent in the `Authorization` header as a Bearer token with every request to protected endpoints.
- **Authorization**: Authorization will be enforced at the database level using PostgreSQL's Row Level Security (RLS), as defined in the database schema. Supabase automatically applies these policies based on the `user_id` in the JWT. This ensures that users can only perform actions (SELECT, INSERT, UPDATE, DELETE) on their own data. The API functions execute with the user's permissions.

## 4. Validation and Business Logic

- **Validation**: Input validation will be performed within each Supabase Edge Function before database interaction.
    - **`shopping_lists`**: `name` must be a non-empty string.
    - **`list_items`**: `name` and `unit` must be non-empty strings. `quantity` must be a positive number. `category_id` and `list_id` must reference existing and accessible records.
- **Business Logic**:
    - **AI Processing**: The `POST /lists/generate-from-recipes` endpoint will encapsulate the logic of calling the external Openrouter.ai service, parsing the response, aggregating items, converting units, and creating the database records in a single transaction.
    - **Offline Sync**: The API supports offline functionality by providing `updated_at` timestamps on `shopping_lists` and `list_items`. The client is responsible for storing data locally and implementing a sync strategy. A simple "last-write-wins" approach is assumed for this version, where the client sends its updates and the server processes them. The `updated_at` trigger in the database ensures this timestamp is always current.
    - **Account Deletion**: User account deletion is handled by the Supabase Auth SDK. The `ON DELETE CASCADE` constraints in the database schema ensure that all user data (`shopping_lists`, `list_items`, `ai_feedback_log`) is automatically and permanently removed when a user is deleted.
