---
Task ID: 2
Agent: Map Agent
Task: Create interactive map page showing Guinea's 8 administrative regions with QoS coverage data

Work Log:
- Installed react-leaflet, leaflet, @types/leaflet packages
- Added Region model to prisma/schema.prisma with fields: id, name, code, latitude, longitude, population, area, activeOperators, qosScore, complaintCount, coverage, createdAt, updatedAt
- Fixed pre-existing Document model relation issue (restored documents Document[] in User model)
- Ran prisma db push — schema synced successfully
- Created /src/components/guinea-map.tsx: Full Leaflet map component with CircleMarker for each of 8 regions, color-coded by QoS score (green >80, yellow 60-80, red <60), popup with region details, legend overlay, sidebar with national summary, operators by region bar chart, best/worst regions lists, and selected region detail card
- Created /src/app/(dashboard)/carte/page.tsx: Page component using dynamic import with ssr:false for the map, fetches data from /api/regions with hardcoded fallback data, loading skeleton, error handling with fallback warning
- Created /src/app/api/regions/route.ts: GET endpoint returning all regions from database using apiHandler pattern
- Updated /src/app/(dashboard)/layout.tsx: Added Map icon import from lucide-react and "Carte" navigation item after "Tableau de bord"
- Updated /prisma/seed.ts: Added 8 Guinea regions (Conakry, Kindia, Boké, Labé, Mamou, Faranah, Kankan, N'Zérékoré) with upsert pattern
- Seeded database — 8 regions created successfully
- TypeScript compilation: zero errors from new files
- Dev server: /carte returns HTTP 200 with 46987 bytes, /api/regions returns all 8 regions as JSON
- All French labels throughout the interface

Stage Summary:
- 6 files created/modified: 3 new files (guinea-map.tsx, carte/page.tsx, regions/route.ts), 3 updated files (schema.prisma, layout.tsx, seed.ts)
- Interactive Leaflet map with 8 region CircleMarkers, color-coded QoS, click popups
- Sidebar panel with national stats, operators by region, best/worst regions
- API endpoint returns region data from database with fallback hardcoded data on client
- "Carte" navigation item added to sidebar after "Tableau de bord"
- Region model in database with 8 seeded records
