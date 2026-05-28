# Task 2-6: Drive Test / Measurement Campaigns & Benchmarking Modules

## Summary
Added two new modules to the ARPT Guinée platform: **Campagnes de Mesures** (Drive Test / Measurement Campaigns) and **Benchmarking Opérateurs** (Operator Comparison), based on the DAO for auditing coverage and QoS.

## Files Modified

### 1. `prisma/schema.prisma`
- **Replaced** existing simple `Campaign` model (had only `id, title, description, type, status, startDate, endDate`) with full-featured model including: `reference`, `name`, `regions`, `localities`, `technologies`, `services`, `teamLeadId`, `teamSize`, `equipment`, `totalTests`, `conformRate`, `measurements` relation
- **Added** `Measurement` model with all QoS indicators from the DAO: voice metrics (callAttempted, callSuccess, callDropped, callSetupTime), SMS metrics (smsSent, smsSuccess, smsDelay), data metrics (downloadSpeed, uploadSpeed, latency, packetLoss), QoE metrics (webPageLoadTime, videoStreamingScore, downloadSuccessRate), coverage (signalStrength, coverageLevel), GPS (latitude, longitude), conformity (isConform, notes)
- **Added** `measurements Measurement[]` relation to `Operator` model
- **Added** `campaigns Campaign[]` and `ledCampaigns Campaign[]` relations to `User` model (relation names: CampaignCreatedBy, CampaignLeadBy)

### 2. `prisma/seed-campaigns.ts` (NEW)
- Seeds 3 campaigns: CAMP-2025-001 (completed), CAMP-2025-002 (in_progress), CAMP-2025-003 (planned)
- Seeds 9 measurements across 4 operators (Orange, MTN, Celcom, Guinetel) in multiple regions (Conakry, Kankan, Kindia, Boké) and technologies (2G, 3G, 4G, fixe)
- Measurements include both conforming (4G urban) and non-conforming (2G/3G rural) data points

### 3. `src/app/api/campaigns/route.ts` (NEW)
- **GET**: List campaigns with pagination, status/type filtering, includes createdBy, teamLead, measurement count
- **POST**: Create campaign with Zod validation (reference, name, type enum, status enum, etc.), auth check, duplicate reference check

### 4. `src/app/api/measurements/route.ts` (NEW)
- **GET**: List measurements with filters (campaignId, operatorId, region, technology, testType), includes operator and campaign info
- **POST**: Create measurement with Zod validation (all QoS fields, testType enum, technology enum, coverageLevel enum), auth check, campaign existence verification

### 5. `src/app/api/benchmark/route.ts` (NEW)
- **GET**: Aggregated benchmarking data with:
  - `operatorComparison`: Per-operator aggregated metrics (voice, SMS, data, QoE, overall score, conformRate) with ranking
  - `regionBreakdown`: Per-region per-operator metrics
  - `technologyBreakdown`: Per-technology (2G/3G/4G/fixe) per-operator metrics
  - `criticalZones`: Top 5 regions with lowest conformity rates
  - Supports technology filter query param
  - Overall score is weighted: Voice 30%, SMS 15%, Data 25%, Latency 15%, Download success 15%

### 6. `src/app/(dashboard)/campagnes/page.tsx` (NEW)
- Summary cards (total campaigns, in progress, completed)
- Campaign list table with status badges, type labels, conformity rate
- Search and status filter
- Create campaign dialog with full form (reference, name, type, description, dates, regions, technologies, services)
- Campaign detail dialog with 3 tabs:
  - **Détails**: Campaign info (period, regions, technologies, team, equipment, stats cards)
  - **Mesures**: Measurement table (operator, region, technology, voice/SMS/data metrics, conformity)
  - **Conformité**: Conformity summary by operator with progress bars

### 7. `src/app/(dashboard)/benchmark/page.tsx` (NEW)
- Public transparency page as specified in DAO
- Operator ranking cards with rank badges (🥇🥈🥉), overall score, voice/SMS/data/latency metrics, star QoE ratings, conformity rate
- Technology filter dropdown
- 4-tab layout:
  - **Comparaison**: Detailed comparison table with score bars for voice, SMS, data; star QoE ratings; overall score and conformity badges
  - **Par Région**: Per-region breakdown with operator metrics tables
  - **Par Technologie**: Per-technology cards showing operator performance
  - **Zones Critiques**: Red-themed section showing regions with lowest conformity rates, operator-by-operator breakdown, ARPT regulatory notice

### 8. `src/app/(dashboard)/layout.tsx` (MODIFIED)
- Added `Radio` and `BarChart3` imports from lucide-react
- Added navigation items: "Campagnes" (href: /campagnes, icon: Radio) and "Benchmark" (href: /benchmark, icon: BarChart3)
- Inserted after "QoS" in nav items list

## Database Changes
- Ran `prisma db push --accept-data-loss` twice (initial model, then full replacement)
- Regenerated Prisma client
- Seeded 3 campaigns and 9 measurements

## Build Verification
- TypeScript: Zero errors in new code (all 27 remaining TS errors are pre-existing, mostly missing @radix-ui type declarations)
- All API routes compile successfully
- Both frontend pages compile successfully
- Navigation items added and visible in sidebar

## Key Design Decisions
- All text in French as required
- Used Zod validation on all POST routes
- Used existing shadcn/ui components (Card, Badge, Table, Dialog, Tabs, Progress, Select, Skeleton)
- Loading skeletons, empty states, and error states implemented
- Benchmark page is visually rich with color-coded scores, rank badges, star ratings, progress bars
- Critical zones section has red theme with regulatory notice from DAO
- Campaign detail dialog uses Tabs for organized information display
