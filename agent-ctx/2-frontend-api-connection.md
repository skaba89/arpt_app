# Task 2 - Frontend API Connection Agent

## Mission
Connect ALL frontend dashboard pages to the real backend API routes instead of using hardcoded mock data. Also create the missing Settings page and add notification bell.

## Work Completed

### 1. Created API Client (`/src/lib/api-client.ts`)
- Reusable fetch wrapper with typed methods: get, post, put, patch, delete
- JWT token management via client-side storage (sessionStorage)
- Authorization header support (`Bearer {token}`)
- Credentials: 'include' for httpOnly cookie-based auth
- 401 handling with automatic redirect to login
- Consistent error handling via `ApiError` class
- `ApiResponse<T>` typed responses

### 2. Updated Auth Provider (`/src/providers/auth-provider.tsx`)
- Stores JWT token from login response using `setClientToken()`
- Clears token on logout
- Uses token for subsequent API calls

### 3. Created Missing API Routes

| Route | File | Methods | Description |
|-------|------|---------|-------------|
| `/api/sanctions` | `src/app/api/sanctions/route.ts` | GET, POST | Sanctions CRUD with operator relations |
| `/api/audits` | `src/app/api/audits/route.ts` | GET, POST | Audits CRUD with operator relations |
| `/api/decisions` | `src/app/api/decisions/route.ts` | GET, POST | Decisions CRUD with decidedBy relations |
| `/api/notifications` | `src/app/api/notifications/route.ts` | GET, PATCH | Notifications with unread count, mark read |
| `/api/dashboard` | `src/app/api/dashboard/route.ts` | GET | Aggregated dashboard stats |
| `/api/auth/change-password` | `src/app/api/auth/change-password/route.ts` | POST | Password change with validation |

### 4. Updated Dashboard Page (`/src/app/(dashboard)/dashboard/page.tsx`)
- Replaced all hardcoded KPI data with `apiClient.get('/api/dashboard')`
- Loading skeleton states while fetching
- Error state with retry button
- Dynamic KPI cards based on real data
- Dynamic recent activity from multiple sources
- Dynamic operator status summary with QoS scores

### 5. Updated Operators Page (`/src/app/(dashboard)/operators/page.tsx`)
- Fetches operators from `GET /api/operators`
- Creates operators via `POST /api/operators` with dialog form
- Form validation and error handling
- Loading skeletons, empty states, error states
- Type labels mapped (mobile_fixe -> Fixe + Mobile)

### 6. Updated QoS Page (`/src/app/(dashboard)/qos/page.tsx`)
- Fetches QoS reports from `GET /api/qos`
- Fetches operators for the create form dropdown
- Creates QoS reports via `POST /api/qos`
- Dynamic metric cards per operator (latest report)
- Full history table with real data
- Handles null metric values gracefully

### 7. Updated Complaints Page (`/src/app/(dashboard)/complaints/page.tsx`)
- Fetches complaints from `GET /api/complaints`
- Creates complaints via `POST /api/complaints`
- Category labels mapped (qualite_service -> Qualité)
- Form with operator dropdown from real data
- Loading, error, empty states

### 8. Updated Sanctions Page (`/src/app/(dashboard)/sanctions/page.tsx`)
- Fetches sanctions from `GET /api/sanctions`
- No create dialog (per requirements)
- Type labels mapped (avertissement, amine, suspension, retrait_licence)
- Amount formatting for GNF
- Loading, error, empty states

### 9. Updated Audits Page (`/src/app/(dashboard)/audits/page.tsx`)
- Fetches audits from `GET /api/audits`
- Type labels mapped (conformite, technique, financier, procedure)
- Operator name from included relation
- Loading, error, empty states

### 10. Updated Decisions Page (`/src/app/(dashboard)/decisions/page.tsx`)
- Fetches decisions from `GET /api/decisions`
- Type labels mapped (reglementaire, sanction, arbitrage, attribution)
- decidedBy user from included relation
- Loading, error, empty states

### 11. Created Settings Page (`/src/app/(dashboard)/settings/page.tsx`)
- Profile section (name, email, role, service) - read only
- Change password form with validation
- Notification preferences (placeholder toggles)
- Security info section (2FA status, sessions)
- Follows same card-based layout as other pages

### 12. Updated Dashboard Layout (`/src/app/(dashboard)/layout.tsx`)
- Added NotificationBell component in the header
- Polls `/api/notifications` every 60 seconds
- Shows unread count badge on bell icon
- Popover with notification list
- Mark individual or all notifications as read
- Notification type icons (info, warning, success, error)

## Files Created (6)
- `/src/lib/api-client.ts`
- `/src/app/api/sanctions/route.ts`
- `/src/app/api/audits/route.ts`
- `/src/app/api/decisions/route.ts`
- `/src/app/api/notifications/route.ts`
- `/src/app/api/dashboard/route.ts`
- `/src/app/api/auth/change-password/route.ts`
- `/src/app/(dashboard)/settings/page.tsx`

## Files Modified (9)
- `/src/providers/auth-provider.tsx`
- `/src/app/(dashboard)/dashboard/page.tsx`
- `/src/app/(dashboard)/operators/page.tsx`
- `/src/app/(dashboard)/qos/page.tsx`
- `/src/app/(dashboard)/complaints/page.tsx`
- `/src/app/(dashboard)/sanctions/page.tsx`
- `/src/app/(dashboard)/audits/page.tsx`
- `/src/app/(dashboard)/decisions/page.tsx`
- `/src/app/(dashboard)/layout.tsx`

## Key Design Decisions
- All API calls use `credentials: 'include'` to send httpOnly cookies
- JWT token also stored in sessionStorage for Authorization header fallback
- apiHandler extracts token from either cookie or Authorization header
- All pages show skeleton loading states during data fetch
- All pages show error states with retry buttons
- All pages handle empty data states
- French language maintained throughout
- All existing shadcn/ui components preserved
