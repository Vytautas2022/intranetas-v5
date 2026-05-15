# Developer Handoff: Orders and Periodic Tasks Modules

This document outlines the architecture, data management, and operational logic for the recently added **Orders** and **Periodic Tasks** modules.

## 1. Project Architecture
The project follows a standard React/Vite/TypeScript architecture, enforcing a strict separation of concerns to facilitate future backend migration.

## 2. Mock DB Approach
We utilize static TypeScript files in `src/mock-db/` as the primary data stores (e.g., `orders.ts`, `periodicTasks.ts`).
- **Persistence:** None. State is held in React `useState`/Context and reset on browser refresh.
- **Safety:** Mock DB files should be considered immutable by UI/Logic components. Only the React Context should trigger updates.

## 3. UI / Logic / Mock DB Separation
To ensure clean code, we enforced:
1.  **UI (`src/modules/`):** React components responsible for rendering and handling user interactions (calling Context actions). They **contain zero business logic**.
2.  **Logic (`src/logic/`):** Pure TypeScript functions. They receive data, compute changes, and return new states or side effects.
3.  **Mock DB:** Centralized data structures (`types` and seed data).

## 4. Orders Module
Manages club requests, approval chains, and purchasing lifecycle.

- **Data Model:** `Order` interface defined in `src/mock-db/orders.ts`. Includes item lists, comments, and history.
- **Status Flow:** `DRAFT -> PENDING_APPROVAL -> APPROVED -> ORDERED -> WAITING_DELIVERY -> DELIVERED -> DELIVERED_TO_CLUB -> SENT_TO_ACCOUNTING -> CLOSED` (plus `REJECTED`).
- **Permissions:** Logic resides in `logic/orderLogic.ts`. `canUserApprove` evaluates based on user role and order state.
- **Analytics:** Basic visualizations using `recharts` for spending and budget tracking.

## 5. Periodic Tasks Module
Manages recurrent maintenance, safety checks, and inspection workflows.

- **Data Model:** `PeriodicTaskTemplate` (rules) and `PeriodicTaskInstance` (individual occurrence).
- **Recurrence Logic:** `generateNextDueDate` calculates the next trigger date based on template settings.
- **Status Flow:** `SCHEDULED -> PENDING -> IN_PROGRESS -> COMPLETED -> OVERDUE -> SKIPPED`.
- **Permissions:** Role-based checks integrated within `periodicTaskLogic.ts`.
- **Analytics:** Tracking completion rates, overdue tasks, and costs per club.

## 6. Known Limitations
- **Data Persistence:** Browser refresh resets all data to seeded values.
- **Mock Auth:** Authentication is simulated via a `currentUser` prop passed from `App.tsx`.
- **Scaling:** Kanban boards may get crowded; pagination or list-view filtering should be prioritized as data grows.

## 7. Future Backend Migration: Migration Strategy
When moving to a real backend:
1.  **API Routes:** Replace Context actions (e.g., `approveOrder`) with `fetch` calls to backend endpoints.
2.  **State Management:** Replace React `useState` with server-state management (like React Query or SWR) to cache fetched data.
3.  **Authentication:** Integrate with a standard auth provider (Firebase Auth, Auth0, etc.) to replace `currentUser` props.

## 8. Firebase / Real DB Recommendations
- **Firestore:** Structure data to map to current `orders` and `periodicTaskInstances` collections.
- **Atomic Operations:** Utilize Firestore transactions for status changes to prevent race conditions.
- **Security Rules:** Critical. Each entity must enforce Auth-based ownership and Role-based access rules.

## 9. Important: What NOT to Break
- **Logic Integrity:** Do not move calculations into components.
- **Imports:** Preserve the current import path structure to avoid dependency circularity.
- **Backwards Compatibility:** Keep existing `historyLogic.ts` and `common` types; they are shared across modules.
