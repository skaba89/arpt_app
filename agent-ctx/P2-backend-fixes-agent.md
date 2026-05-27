# Phase 2 Backend Fixes — Work Record

## Summary
All 5 active Phase 2 backend tasks completed successfully (P2-11 skipped per instructions — frontend-only issue).

## Changes Made

### P2-06: Implement version restore
**File:** `/home/z/my-project/arpt_app/backend/src/routes/versions.ts`
- The POST `/restore` endpoint was a no-op that just logged an audit entry
- Added actual restore logic: parses `docVersion.données` (JSON string) and uses a `switch` on `docVersion.entitéType` to update the target entity via Prisma
- Supported entity types: `operateur`, `dossier`, `decision`, `declaration`
- Returns 400 for unsupported entity types
- Audit log now uses `docVersion.entitéType` and `docVersion.entitéId` instead of the request body values

### P2-07: Fix RBAC permissions
**File:** `/home/z/my-project/arpt_app/backend/src/routes/templates.ts`
- Line 82: Changed DELETE handler from `authorize('templates', 'update')` → `authorize('templates', 'delete')`

**File:** `/home/z/my-project/arpt_app/backend/src/routes/seuils-qos.ts`
- Line 55: Changed POST handler from `authorize('seuils-qos', 'update')` → `authorize('seuils-qos', 'create')`

### P2-08: Add ownership check on notification mark-read
**File:** `/home/z/my-project/arpt_app/backend/src/routes/notifications.ts`
- Added ownership verification before marking a notification as read by ID
- First fetches the notification, checks `notif.userId === ctx.userId`
- Returns 404 if notification not found, 403 if user doesn't own it

### P2-12: Add backend .dockerignore and frontend healthcheck
**File:** `/home/z/my-project/arpt_app/backend/.dockerignore` (new)
- Added with: `node_modules`, `dist`, `.env`, `.env.*`, `.git`, `.gitignore`, `*.md`

**File:** `/home/z/my-project/arpt_app/docker-compose.yml`
- Added `healthcheck` block to the `frontend` service with wget-based health check on `/api/health`

### P2-13: Add missing indexes to Prisma schema
**Files:** All 3 schema files updated identically:
- `/home/z/my-project/arpt_app/prisma/schema.prisma`
- `/home/z/my-project/arpt_app/backend/prisma/schema.prisma`
- `/home/z/my-project/arpt_app/backend/prisma/schema-full.prisma`

Indexes added:
- `User`: `@@index([role])`
- `Declaration`: `@@index([operateurId, periode])`
- `QoSMesure`: `@@index([operateurId])`
- `Reclamation`: `@@index([status])`
- `AuditLog`: `@@index([userId, createdAt])`
- `RapportMensuel`: `@@index([operateurId])`

### P2-11: Fix XSS in decisions print preview — SKIPPED
Per instructions, this is a frontend-only issue and was skipped.
