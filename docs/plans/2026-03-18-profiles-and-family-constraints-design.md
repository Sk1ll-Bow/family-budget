# Design: Profiles and Family Constraints

## Goal
Implement a `profiles` table to store user metadata, ensure data persistence across reloads, and enforce a "one family per user" constraint with local cache isolation.

## Architecture & Data Flow

### 1. Database Schema (Supabase)

#### [NEW] `public.profiles`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | References `auth.users.id` |
| `email` | `text` | User's email |
| `display_name` | `text` | User's display name |
| `avatar_icon` | `text` | Lucide icon name |
| `avatar_bg` | `text` | Background color/style |
| `currency` | `text` | Default 'EUR' |
| `language` | `text` | 'ru', 'en', or 'sk' |
| `created_at` | `timestamptz` | Timestamp |

#### [MODIFY] `public.family_members`
- Add a unique constraint (or unique index) on `user_id` to ensure one family per user.

### 2. Local Storage (Dexie)

#### [NEW] `profiles` table in `FamilyBudgetDB`
- Syncs with Supabase `profiles`.

#### Cache Management
- When a user joins or creates a family: `familyId` is set in `useAuthStore` and persisted in `localStorage`.
- When a user **exits** a family:
  1. Remove membership from `family_members` in Supabase.
  2. Clear `familyId` from `useAuthStore` and `localStorage`.
  3. Clear local tables: `families`, `expenses`, `categories`, `accounts` (but keep `profiles`).

### 3. State Management (`useAuthStore`)

- **`initialize()`**: 
  - Restores Supabase session.
  - Fetches/restores User Profile from Dexie/Supabase.
  - Fetches/restores `familyId` from `localStorage` (or Supabase if cache is empty).
- **`exitFamily()`**: 
  - Handles the API call and cache cleanup.

### 4. UI Layer

- **`AppShell`**: 
  - Uses `familyId` to decide whether to render the `MainLayout` or the `FamilySetup` screen.
- **`FamilySetup`**: 
  - Blocked if `familyId` is already present (redirect to `/`).
- **`SettingsPage`**: 
  - Add "Exit Family" button.

## Error Handling
- If profile fetching fails, use fallback values from Auth metadata.
- If family joining fails due to the unique constraint, show a clear message: "You are already a member of another family."

## Security (RLS)
- `profiles`: Users can only read/write their own profile.
- `family_members`: Enforce the unique constraint on `user_id`.
