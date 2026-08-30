# GPUBridge Credits System Documentation

Welcome to the comprehensive technical and operational documentation for the **GPUBridge Credits System**.

---

## 1. Overview

The GPUBridge platform operates on an automated credit-based quota system. Every registered user receives a default allocation of free credits to run high-performance AI inference (Image generation, Video generation, XTTS voice cloning, Chat models, Image editing, and Travel map generation) hosted on dedicated in-house GPU workers.

---

## 2. Credit Allocation & Rates

### Default Free Allocation
- **New User Signup**: **`100 Free Credits`** automatically provisioned upon account creation.

### Operation Rates

| Operation | Endpoint | Deducted Credits | Service / Controller |
| :--- | :--- | :---: | :--- |
| **Image Generation** | `POST /generate/image` | **5 Credits** | `GenerateController.ts` |
| **Video Generation** | `POST /generate/video` | **10 Credits** | `GenerateController.ts` |
| **Chat Assistant** | `POST /chat` | **5 Credits** | `ChatController.ts` |
| **Voice / XTTS-v2** | `POST /tts` | **5 Credits** | `TtsController.ts` |
| **InstructPix2Pix (Edit)** | `POST /generate/img2img` | **5 Credits** | `GenerateController.ts` |
| **Travel Map Video** | `POST /generate/map` | **5 Credits** | `GenerateController.ts` |

---

## 3. Database Schema (Supabase)

The credits system utilizes two primary tables in Supabase Postgres:

### `public.credits`
Stores the active balance for each user.

```sql
create table public.credits (
    user_id uuid primary key references auth.users(id) on delete cascade,
    balance integer not null default 100,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### `public.credit_usage`
Maintains an immutable audit log for every deduction.

```sql
create table public.credit_usage (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    operation text not null,
    cost integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## 4. Backend Architecture & Flow

### 1. User Registration (`AuthService.ts`)
When a user signs up via `POST /auth/signup`:
1. Supabase Admin API creates the authenticated user.
2. A row is inserted into `public.credits` with `balance = 100`.
3. Session tokens are returned to the client.

### 2. Credit Verification & Deduction (`CreditService.ts`)
Before GPU inference begins:
1. `CreditService.deductCredits(userId, operation, cost)` queries `public.credits`.
2. **Balance Check**:
   - If `balance < cost`, throws an error:  
     `"Contact admin for this my gmail divyanshujamloki05@gmail to add more free credits"`
3. **Atomic Deduction**:
   - Updates `balance = balance - cost`.
4. **Audit Logging**:
   - Inserts record into `public.credit_usage`.

### 3. User Balance Endpoint (`/auth/me`)
- Returns `{ user: { id, email }, credits: balance }`.

---

## 5. Frontend Integration & Notification System

### Global Store (`CreditsContext.tsx`)
- Provides `useCredits()` hook with:
  - `credits`: Current real-time credit count.
  - `deductCredits(cost, operationName)`: Decrements local state and triggers instant toast notification.
  - `refreshCredits()`: Syncs balance with backend `/auth/me`.

### Real-Time Toast Notifications
- **Deduction Toast**: Triggers immediately on generation with cost, operation name, and remaining balance.
  - *Example*: `⚡ -5 Credits Deducted • Image Generation (Remaining: 95 credits)`
- **Low Credits Warning**: Automatically pops up if remaining balance drops to $\le 15$ credits.
- **Exhausted Notice**: Informs user when credits reach 0 with contact email for top-up.

### Navigation Header (`SiteHeader.tsx`)
- Displays an active **`⚡ XX Credits`** badge in the navigation bar.
- Clicking the badge instantly refreshes and syncs the balance from the server.

---

## 6. Admin Credit Management (Top-Up)

To manually grant additional credits to a user:

1. Open **Supabase Dashboard** $\rightarrow$ **Table Editor** $\rightarrow$ **`credits`**.
2. Locate the user's `user_id` or search by ID.
3. Update the `balance` field (e.g., set to `500` or `1000`).
4. Alternatively run SQL:
```sql
UPDATE public.credits
SET balance = balance + 100
WHERE user_id = '<USER_UUID>';
```

---

## 7. Contact & Support

For credit top-ups or inquiries:
- **Email**: `divyanshujamloki05@gmail.com`
