# Task 1 - API Routes Agent

## Task: Create MISSING API routes for sanctions, audits, decisions, users, and notifications

## Work Log

### Step 1: Studied Existing Patterns
- Read `api-handler.ts`: Uses `apiHandler()` wrapper with `auth`, `rbac`, `bodySchema`, `querySchema`, `handler` options
- Read `validations.ts`: Existing schemas for operators, qos, complaints, sanctions, audits, decisions + `paginationSchema`
- Read `operators/route.ts`, `complaints/route.ts`, `qos/route.ts`: Consistent pattern of GET (paginated list) + POST (create with RBAC)
- Read `schema.prisma`: All models with relationships
- Read `errors.ts`, `logger.ts`, `db.ts`: Standard error classes, structured logging, Prisma client

### Step 2: Updated validations.ts
Added three new schemas:
- `createUserSchema`: name, email, password (min 8), role (9-role enum), service (optional), active (default true)
- `createNotificationSchema`: title, message, type (info/warning/error/success), category (optional), userId
- `markNotificationsReadSchema`: notificationIds (array of strings, min 1)

Added corresponding type exports: `CreateUserInput`, `CreateNotificationInput`, `MarkNotificationsReadInput`

### Step 3: Created 5 API Route Files

#### `/src/app/api/sanctions/route.ts`
- **GET**: Auth required, paginated, filterable by operatorId, type, status, search (title/reference/description)
- **POST**: RBAC [super_admin, admin, dg, directeur, juriste], auto-generates reference `SAN-YYYY-NNN`
- Includes operator and createdBy relations in responses

#### `/src/app/api/audits/route.ts`
- **GET**: Auth required, paginated, filterable by operatorId, type, status, search
- **POST**: RBAC [super_admin, admin, dg, directeur], auto-generates reference `AUD-YYYY-NNN`
- Includes operator, leadAuditor, createdBy relations in responses
- Converts startDate/endDate strings to Date objects for Prisma

#### `/src/app/api/decisions/route.ts`
- **GET**: Auth required, paginated, filterable by type, status, search
- **POST**: RBAC [super_admin, admin, dg], auto-generates reference `DEC-YYYY-NNN`
- Includes createdBy and decidedBy relations in responses

#### `/src/app/api/users/route.ts`
- **GET**: RBAC [super_admin, admin] only, paginated, filterable by role, active status, search (name/email)
- **POST**: RBAC [super_admin] only, checks email uniqueness, hashes password with bcryptjs (salt rounds: 12)
- Never returns password hashes (uses explicit `select` to exclude password field)
- Uses ConflictError for duplicate email

#### `/src/app/api/notifications/route.ts`
- **GET**: Auth required, filtered by userId from JWT (users can only see own notifications), paginated
  - Also returns unreadCount in meta
  - Filterable by type, category, read status
- **POST**: RBAC [super_admin, admin], creates notification for specified userId
- **PATCH**: Auth required, bulk marks notifications as read
  - Uses `markNotificationsReadSchema` validation
  - Only marks notifications belonging to current user (security: prevents marking other users' notifications)

### Step 4: Build Verification
- TypeScript compilation: Zero errors in all new/modified files
- Pre-existing errors in unrelated files (UI components missing deps, api-handler.ts type issues, test files) were not introduced by this task

## Files Created
1. `/src/app/api/sanctions/route.ts` (79 lines)
2. `/src/app/api/audits/route.ts` (81 lines)
3. `/src/app/api/decisions/route.ts` (75 lines)
4. `/src/app/api/users/route.ts` (112 lines)
5. `/src/app/api/notifications/route.ts` (115 lines)

## Files Modified
1. `/src/lib/validations.ts` - Added createUserSchema, createNotificationSchema, markNotificationsReadSchema + type exports

## Stage Summary
- 5 new API route files created following exact existing apiHandler pattern
- All routes use: apiHandler wrapper, Zod validation, RBAC, Prisma client, structured logger
- Passwords hashed with bcryptjs, never returned in API responses
- All POST routes have proper RBAC with allowedRoles
- All GET routes require authentication
- Notifications scoped to current user (IDOR protection)
- Zero TypeScript compilation errors in new code
