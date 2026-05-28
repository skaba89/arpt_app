# Task: DAO N°002/ARPT/DCT/2025 Feature Enhancements

## Summary
Enhanced 2 existing pages (Campagnes and Appel d'Offres) with DAO N°002/ARPT/DCT/2025 compliance features without breaking existing functionality.

## Changes Made

### 1. Campaigns Page (`src/app/(dashboard)/campagnes/page.tsx`)
- **Phase indicator** added to each campaign row in the table with color-coded badges (planning=gray, preparation=blue, field_work=orange, analysis=purple, reporting=green, closed=dark)
- **Phase Progress Bar** added in campaign detail dialog showing visual timeline of 6 phases with completed (green), current (blue+pulse), and future (gray) states
- **Livrables tab** added as 4th tab in campaign detail dialog, fetching from `/api/deliverables?campaignId={id}` with:
  - Deliverables checklist with status icons and checkboxes
  - Status badges (pending, in_progress, submitted, reviewed, approved, rejected)
  - Confidentiality badges (confidential, restricted, public)
  - Type labels (9 types from DAO)
  - Due date and submitted date display
  - Summary cards showing totals
- **Cabinet field** display added with Building2 icon when `cabinetName` exists
- **Updated statusConfig** to include `preparation`, `field_work`, `analysis`, `reporting` statuses
- **Updated status filter** dropdown with all new statuses
- **Added new interfaces**: Deliverable interface
- **Added new config maps**: phaseConfig, deliverableTypeConfig, deliverableStatusConfig, confidentialityConfig
- **Added new imports**: Checkbox, Package, Building2, CircleDot, ArrowRight, Lock, Eye, AlertCircle, Upload

### 2. Appel d'Offres Page (`src/app/(dashboard)/appel-offres/page.tsx`)
- **Soumission detail/create dialog** with DAO compliance checklist:
  - **Dossier Administratif section**: 11 checklist items (Lettre de soumission, RCCM, Statuts, etc.) with progress bar
  - **Offre Technique section**: 8 checklist items with progress bar
  - **Offre Financière section**: Global cost input, detailed pricing checkbox, payment schedule textarea with progress bar
  - Auto-calculated `adminDossierComplete`, `technicalDossierComplete`, `financialDossierComplete`
- **Evaluation scores display** in soumission detail: adminScore, technicalScore, financialScore, totalScore, rank
- **Compliance status badges** in soumissions list: compliant=green, non_compliant=red, under_review=yellow, submitted=gray
- **Soumissions tab** added to AO detail dialog with list view showing progress bars and scores
- **Create soumission dialog** with full checklist and company info form
- **Interactive checkboxes** that update soumission data via PUT API
- **Added new interfaces**: Soumission interface
- **Added new config maps**: soumissionStatusConfig, adminChecklistItems, technicalChecklistItems
- **Added new imports**: Checkbox, Tabs, Progress, ClipboardCheck, Shield, Award, TrendingUp, etc.

### 3. API Routes
- **Campaigns API** (`src/app/api/campaigns/route.ts`): Updated schema to include `phase` and `cabinetName` fields
- **New Soumissions API** (`src/app/api/soumissions/route.ts`): Full CRUD with:
  - GET: List soumissions with filtering by appelOffreId and status
  - POST: Create soumission with auto-calculated dossier completeness
  - PUT: Update soumission with auto-recalculated completeness

### 4. Seed Data (`prisma/seed.ts`)
- Updated soumissions with full DAO checklist data (11 admin items, 8 technical items, financial data)
- Added 4 campaigns with different phases (planning, field_work, analysis, closed)
- Added 26 deliverables across campaigns with various statuses and confidentiality levels
- Made seed idempotent with existence checks

### 5. Dependencies
- Installed `@radix-ui/react-checkbox` package

## Files Modified
1. `src/app/(dashboard)/campagnes/page.tsx` - Complete rewrite with phase/livrables features
2. `src/app/(dashboard)/appel-offres/page.tsx` - Complete rewrite with soumission checklist features
3. `src/app/api/campaigns/route.ts` - Added phase/cabinetName fields
4. `src/app/api/soumissions/route.ts` - New file - full CRUD API
5. `prisma/seed.ts` - Updated with rich seed data

## Database Schema
No schema changes were needed - the Prisma schema already included:
- Campaign.phase field
- Campaign.cabinetName field
- Deliverable model
- Soumission model with all checklist fields

## Build Status
✅ Build passes successfully
✅ No TypeScript errors in modified files
✅ Database seeded with test data
