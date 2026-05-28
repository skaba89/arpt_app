# Task 1 - Operator Services on Interactive Map

## Summary
Completely rewrote the interactive map to show operator services, coverage zones, and network infrastructure with 3 switchable views.

## Files Modified

### 1. `prisma/schema.prisma`
- Added `RegionOperator` model with fields: id, regionId, operatorId, active, coverage2G, coverage3G, coverage4G, qosScore, subscriberCount, siteCount, createdAt, updatedAt
- Added `@@unique([regionId, operatorId])` constraint
- Added `operators RegionOperator[]` relation to Region model
- Added `regions RegionOperator[]` relation to Operator model
- Ran `prisma db push` successfully

### 2. `prisma/seed.ts`
- Added 19 RegionOperator seed entries covering all 8 regions with varying operator presence (1-4 operators per region)
- Changed remaining seed entities (complaints, sanctions, audits, decisions) from `create` to `upsert` for idempotency
- Ran `bun run db:seed` successfully — 19 region-operator entries created

### 3. `src/app/api/regions/route.ts`
- Updated GET handler to include operator data via `include: { operators: { include: { operator: { select: { id, name, code } } } } }`
- Returns full RegionOperator data with nested operator info

### 4. `src/components/guinea-map.tsx` (complete rewrite)
- **3 Map Views** switchable via Tabs component:
  - **Vue Régions**: QoS circles per region (existing behavior, enhanced)
  - **Vue Opérateurs**: Colored circles per operator per region, offset to avoid overlap, with filter toggle
  - **Vue Couverture**: Heat-map style with 2G/3G/4G selector, color-coded by coverage level
- **Operator Colors**: ORG=#FF7900, MTN=#FFCC00, CEL=#00AAFF, GNT=#444444, GTC=#00A651
- **Operator Legend** with eye toggle to show/hide individual operators
- **Coverage type dropdown** (2G/3G/4G) for coverage view
- **Rich popups** with:
  - Region name, QoS score, coverage, operators, complaints
  - Per-operator breakdown with mini coverage bars (2G/3G/4G)
  - Subscriber count and site count per operator
- **Right sidebar panel** with:
  - National summary stats
  - Operators by region chart
  - Best/worst regions
  - **Selected region detail panel** with:
    - Operator breakdown table with coverage bars
    - Coverage comparison chart (2G/3G/4G per operator)
    - Network infrastructure summary (total sites/subscribers per operator)
- **New exported types**: `RegionOperatorData`, updated `RegionData` with `operators` field
- Fallback data includes all operator data for offline use
- All text in French

### 5. `src/app/(dashboard)/carte/page.tsx`
- Updated to map API response including operator data to `RegionData` with `RegionOperatorData[]`
- Added `ApiRegionOperator` interface for API response mapping
- Updated page subtitle from "Couverture réseau, QoS et plaintes par région" to "Couverture réseau, opérateurs et QoS par région"
- Fallback data includes full operator breakdown

## Build Result
- TypeScript compilation: No errors in our files
- Pre-existing errors in other files (import, api-handler, etc.) are unrelated
- Seed runs successfully and is idempotent

## Key Features
- All three views (Régions, Opérateurs, Couverture) are fully functional
- Operator colors are consistent across all views and match real brand colors
- Map is responsive with proper Leaflet dynamic import (ssr: false)
- Sidebar updates when a region is selected
- Regions with no operators are handled gracefully
- All popups are informative with mini coverage bars and stats
