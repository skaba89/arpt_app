# Task ID: 4 — Document Upload & Management System

## Agent: Document Management Agent
## Status: COMPLETED

## Summary
Implemented a complete file upload and document management system for the ARPT Guinée regulatory platform, enabling users to attach files to complaints, audits, decisions, and QoS reports.

## Files Created

### API Routes
1. **`src/app/api/upload/route.ts`** — POST endpoint for file uploads
   - FormData-based upload with validation
   - Max file size: 10MB
   - Allowed types: PDF, images (JPEG/PNG/GIF), Office (DOC/DOCX/XLS/XLSX), CSV, TXT
   - Zod validation for entityId, entityType, category, description
   - Files stored in `/uploads/{entityType}/` with unique names
   - Document records saved in DB with uploadedBy tracking
   - RBAC: all authenticated roles except citoyen/operateur

2. **`src/app/api/documents/route.ts`** — GET/DELETE endpoints
   - GET: List documents with filters (entityId, entityType, category, search)
   - Pagination support
   - Includes uploadedBy user info
   - DELETE: Remove document (super_admin, admin only)
   - Deletes both DB record and physical file
   - Audit logging on delete

3. **`src/app/api/documents/[id]/download/route.ts`** — GET endpoint for file download
   - Returns file with proper Content-Type and Content-Disposition headers
   - Auth required for all roles
   - Sets Cache-Control: private, no-cache

### Components
4. **`src/components/file-upload.tsx`** — Reusable FileUpload component
   - Drag & drop zone with visual feedback
   - Click-to-upload with file type filter
   - Upload progress indication
   - Existing documents list with icons by file type
   - Download button for each file
   - Delete button (admin+ only) with confirmation dialog
   - File size formatting (KB/MB)
   - Category badges
   - All text in French
   - Props: entityId, entityType, category?, maxFiles?, readOnly?

### Pages (Modified)
5. **`src/app/(dashboard)/complaints/page.tsx`** — Enhanced with document management
   - Added detail dialog with Eye button on each row
   - Tabs: "Détails" | "Documents"
   - FileUpload component with entityType="complaint", category="piece_jointe"

6. **`src/app/(dashboard)/audits/page.tsx`** — Enhanced with document management
   - Added detail dialog with Eye button on each row
   - Tabs: "Détails" | "Documents"
   - FileUpload component with entityType="audit", category="audit"

7. **`src/app/(dashboard)/decisions/page.tsx`** — Enhanced with document management
   - Added detail dialog with Eye button on each row
   - Tabs: "Détails" | "Documents"
   - FileUpload component with entityType="decision", category="decision"

8. **`src/app/(dashboard)/qos/page.tsx`** — Enhanced with document management
   - Added detail dialog with Eye button on each row
   - Tabs: "Détails" | "Documents"
   - FileUpload component with entityType="qos", category="rapport"

9. **`src/app/(dashboard)/documents/page.tsx`** — New Documents management page
   - Centralized document listing (admin+)
   - Filters: search, entityType, category
   - Summary cards: Total, Rapports, Pièces jointes
   - Table with file icon, entity type badge, category badge, size, uploader, date
   - Download and delete buttons
   - Delete confirmation dialog

### Schema & Config
10. **`prisma/schema.prisma`** — Added Document model
    - Polymorphic relation via entityId + entityType
    - Fields: filename, mimeType, size, path, category, description
    - uploadedById → User relation
    - @@index on [entityId, entityType]
    - Added `documents Document[]` to User model

11. **`.gitignore`** — Added `uploads/` directory

12. **`src/app/(dashboard)/layout.tsx`** — Added Documents nav item
    - Added FileText icon import
    - Added "Documents" entry after "Décisions" in navItems

## Directory Structure
```
uploads/              → Physical file storage (gitignored)
  complaint/          → Complaint attachments
  audit/              → Audit documents
  decision/           → Decision documents
  qos/                → QoS reports
  sanction/           → Sanction documents
  operator/           → Operator documents
```

## Build Verification
- `npx tsc --noEmit` — No new TypeScript errors in our files
- `npx next build` — Successful, all routes appear correctly
- Pre-existing TS errors in UI components (missing optional deps) and api-handler (type narrowing) are unrelated

## RBAC Matrix
| Operation | Roles |
|-----------|-------|
| Upload file | super_admin, admin, agent, directeur, dg, juriste, chef_service |
| List documents | super_admin, admin, agent, directeur, dg, juriste, chef_service |
| Download file | super_admin, admin, agent, directeur, dg, juriste, chef_service |
| Delete document | super_admin, admin only |

## Security Measures
- File type validation (MIME type whitelist)
- File size limit (10MB)
- Auth required on all endpoints
- RBAC on all endpoints
- Zod validation on all inputs
- Files stored outside public/ (not directly accessible)
- Download requires authentication
- Audit logging on upload and delete
