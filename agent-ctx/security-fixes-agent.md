# Security Fixes — Work Record

## Task: P1-04, P1-05, P1-06 — Critical Security Fixes

### P1-04: Apply authorize() middleware on ALL backend routes

**Files modified:**
- `/home/z/my-project/arpt_app/backend/src/index.ts`
- `/home/z/my-project/arpt_app/backend/src/middleware/rbac.ts`

**Changes made:**

1. **`rbac.ts`**: Added `'rapports-generes'` to the `Resource` type union and to all 4 role entries in the PERMISSIONS matrix:
   - `dg`: `['read']`
   - `agent`: `['read', 'create', 'update', 'delete']`
   - `operateur`: `['read']`
   - `public`: `[]`

2. **`index.ts`**: 
   - Added imports: `authorize`, `requireAuth` from `./middleware/rbac`, and `Request, Response, NextFunction` from `express`
   - Created `authorizeCRUD(resource)` helper that maps HTTP method → action (GET=read, POST=create, PUT/PATCH=update, DELETE=delete)
   - Applied RBAC middleware to all 28 route groups:
     - CRUD routes use `authorizeCRUD()` 
     - Read-only routes use `authorize(resource, 'read')`
     - Notifications uses `requireAuth()` (users read their own)
     - Auth routes have no resource-level authorization

### P1-05: Filter passwords in GET /api/users for DG role

**File modified:** `/home/z/my-project/arpt_app/backend/src/routes/users.ts`

**Changes made:**

1. **DG password leak fixed**: The `else` branch (DG role) now strips passwords using `users.map(u => { const { password: _, ...safe } = u; return safe })` instead of returning raw `users` array
2. **Operateur/public path**: Added password stripping for the `findUnique` result using `const { password: _, ...safeUser } = user`, plus null-safety check

### P1-06: Wrap DELETE operateur in a Prisma transaction

**File modified:** `/home/z/my-project/arpt_app/backend/src/routes/operateurs.ts`

**Changes made:**

1. Fixed `authorize('operateurs', 'update')` → `authorize('operateurs', 'delete')` (was incorrectly using 'update' action)
2. Wrapped all 12 delete operations in `prisma.$transaction([...])` for atomicity
3. Added two previously missing `deleteMany` calls:
   - `prisma.rapportGenere.deleteMany({ where: { operateurId: id } })`
   - `prisma.sanction.deleteMany({ where: { operateurId: id } })`
