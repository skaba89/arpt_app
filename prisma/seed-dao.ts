import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed script for DAO Appel d'Offre N°002/ARPT/DCT/2025
 * 
 * Seeds:
 *  - 46 Localities across Guinea's 8 natural regions
 *  - 9 Deliverable types per existing campaign
 *  - 6 Constraints (DAO Section IX categories)
 *  - Benchmark Results for each operator and FAI
 */

async function main() {
  console.log('🌱 Seeding DAO N°002/ARPT/DCT/2025 data...')
  console.log('')

  // ─── 1. LOCALITIES ─────────────────────────────────────────────────────────
  console.log('📍 Seeding localities...')

  const localities = [
    // ── Conakry (Capitale) ──
    { name: 'Conakry', region: 'Conakry', prefecture: 'Conakry', type: 'urbain', population: 1765000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: true, latitude: 9.5092, longitude: -13.7122, overallQoS: 78.5, coverageScore: 85.0, isRoadAxis: false },
    { name: 'Ratoma', region: 'Conakry', prefecture: 'Conakry', type: 'urbain', population: 635000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: true, latitude: 9.5760, longitude: -13.6835, overallQoS: 75.2, coverageScore: 82.0, isRoadAxis: false },
    { name: 'Matam', region: 'Conakry', prefecture: 'Conakry', type: 'urbain', population: 455000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: true, latitude: 9.5485, longitude: -13.6785, overallQoS: 72.8, coverageScore: 78.5, isRoadAxis: false },
    { name: 'Dixinn', region: 'Conakry', prefecture: 'Conakry', type: 'urbain', population: 320000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: true, latitude: 9.5350, longitude: -13.6877, overallQoS: 80.1, coverageScore: 86.0, isRoadAxis: false },
    { name: 'Kaloum', region: 'Conakry', prefecture: 'Conakry', type: 'urbain', population: 120000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: true, latitude: 9.5092, longitude: -13.7122, overallQoS: 82.3, coverageScore: 88.0, isRoadAxis: false },

    // ── Boké ──
    { name: 'Boké', region: 'Boké', prefecture: 'Boké', type: 'urbain', population: 115000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 10.9315, longitude: -14.2950, overallQoS: 55.4, coverageScore: 60.0, isRoadAxis: false },
    { name: 'Kamsar', region: 'Boké', prefecture: 'Boké', type: 'urbain', population: 113000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 11.0083, longitude: -14.5200, overallQoS: 60.2, coverageScore: 65.0, isRoadAxis: false },
    { name: 'Sangarédi', region: 'Boké', prefecture: 'Boké', type: 'periurbain', population: 42000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 11.0783, longitude: -13.8033, overallQoS: 42.1, coverageScore: 48.0, isRoadAxis: false },
    { name: 'Boffa', region: 'Boké', prefecture: 'Boffa', type: 'rural', population: 85000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.1833, longitude: -14.0333, overallQoS: 28.5, coverageScore: 32.0, isRoadAxis: false },
    { name: 'Fria', region: 'Boké', prefecture: 'Fria', type: 'periurbain', population: 56000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 10.3667, longitude: -13.5833, overallQoS: 38.7, coverageScore: 42.0, isRoadAxis: false },
    { name: 'Ax Conakry-Boké', region: 'Boké', prefecture: 'Boké', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.5500, longitude: -13.9000, overallQoS: 22.3, coverageScore: 25.0, isRoadAxis: true, roadAxisName: 'Route Nationale Conakry-Boké' },

    // ── Kindia ──
    { name: 'Kindia', region: 'Kindia', prefecture: 'Kindia', type: 'urbain', population: 185000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 10.0581, longitude: -12.8605, overallQoS: 58.6, coverageScore: 62.0, isRoadAxis: false },
    { name: 'Télimélé', region: 'Kindia', prefecture: 'Télimélé', type: 'periurbain', population: 48000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 10.9167, longitude: -13.0333, overallQoS: 35.2, coverageScore: 38.0, isRoadAxis: false },
    { name: 'Coyah', region: 'Kindia', prefecture: 'Coyah', type: 'periurbain', population: 62000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 9.7167, longitude: -13.3833, overallQoS: 48.9, coverageScore: 52.0, isRoadAxis: false },
    { name: 'Dubréka', region: 'Kindia', prefecture: 'Dubréka', type: 'periurbain', population: 54000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 9.7833, longitude: -13.5167, overallQoS: 45.3, coverageScore: 50.0, isRoadAxis: false },
    { name: 'Forécariah', region: 'Kindia', prefecture: 'Forécariah', type: 'rural', population: 39000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 9.4333, longitude: -13.0833, overallQoS: 25.8, coverageScore: 28.0, isRoadAxis: false },
    { name: 'Ax Conakry-Kindia', region: 'Kindia', prefecture: 'Kindia', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 9.9000, longitude: -13.2000, overallQoS: 32.1, coverageScore: 35.0, isRoadAxis: true, roadAxisName: 'Route Nationale Conakry-Kindia' },

    // ── Labé ──
    { name: 'Labé', region: 'Labé', prefecture: 'Labé', type: 'urbain', population: 105000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 11.3167, longitude: -12.2833, overallQoS: 50.8, coverageScore: 55.0, isRoadAxis: false },
    { name: 'Pita', region: 'Labé', prefecture: 'Pita', type: 'periurbain', population: 47000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 11.0833, longitude: -12.4167, overallQoS: 36.4, coverageScore: 40.0, isRoadAxis: false },
    { name: 'Dalaba', region: 'Labé', prefecture: 'Dalaba', type: 'rural', population: 34000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.7500, longitude: -12.2500, overallQoS: 24.2, coverageScore: 27.0, isRoadAxis: false },
    { name: 'Mali', region: 'Labé', prefecture: 'Mali', type: 'rural', population: 29000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 11.5000, longitude: -12.3000, overallQoS: 20.1, coverageScore: 22.0, isRoadAxis: false },
    { name: 'Tougué', region: 'Labé', prefecture: 'Tougué', type: 'rural', population: 25000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 11.4500, longitude: -11.6833, overallQoS: 18.5, coverageScore: 20.0, isRoadAxis: false },
    { name: 'Ax Labé-Pita', region: 'Labé', prefecture: 'Labé', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 11.2000, longitude: -12.3500, overallQoS: 19.8, coverageScore: 22.0, isRoadAxis: true, roadAxisName: 'Route Nationale Labé-Pita' },

    // ── Mamou ──
    { name: 'Mamou', region: 'Mamou', prefecture: 'Mamou', type: 'urbain', population: 98000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 10.3833, longitude: -12.0833, overallQoS: 52.3, coverageScore: 56.0, isRoadAxis: false },
    { name: 'Dalaba (Mamou)', region: 'Mamou', prefecture: 'Dalaba', type: 'rural', population: 31000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.7000, longitude: -12.3500, overallQoS: 22.6, coverageScore: 25.0, isRoadAxis: false },
    { name: 'Pita (Mamou)', region: 'Mamou', prefecture: 'Pita', type: 'periurbain', population: 38000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 10.9500, longitude: -12.5000, overallQoS: 34.1, coverageScore: 37.0, isRoadAxis: false },
    { name: 'Ax Conakry-Mamou', region: 'Mamou', prefecture: 'Mamou', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 10.1000, longitude: -12.5000, overallQoS: 30.5, coverageScore: 33.0, isRoadAxis: true, roadAxisName: 'Route Nationale Conakry-Mamou' },

    // ── N'Zérékoré ──
    { name: "N'Zérékoré", region: "N'Zérékoré", prefecture: "N'Zérékoré", type: 'urbain', population: 195000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 7.7500, longitude: -8.8167, overallQoS: 48.9, coverageScore: 52.0, isRoadAxis: false },
    { name: 'Beyla', region: "N'Zérékoré", prefecture: 'Beyla', type: 'rural', population: 38000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 8.6833, longitude: -8.6167, overallQoS: 18.2, coverageScore: 20.0, isRoadAxis: false },
    { name: 'Lola', region: "N'Zérékoré", prefecture: 'Lola', type: 'rural', population: 32000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 7.8000, longitude: -8.5333, overallQoS: 16.8, coverageScore: 18.0, isRoadAxis: false },
    { name: 'Macenta', region: "N'Zérékoré", prefecture: 'Macenta', type: 'periurbain', population: 68000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 8.5500, longitude: -9.4667, overallQoS: 35.6, coverageScore: 38.0, isRoadAxis: false },
    { name: 'Guékédou', region: "N'Zérékoré", prefecture: 'Guékédou', type: 'rural', population: 79000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 8.5667, longitude: -10.0667, overallQoS: 20.5, coverageScore: 22.0, isRoadAxis: false },
    { name: 'Kissidougou', region: "N'Zérékoré", prefecture: 'Kissidougou', type: 'periurbain', population: 66000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 9.1833, longitude: -10.1000, overallQoS: 38.2, coverageScore: 42.0, isRoadAxis: false },
    { name: "Ax N'Zérékoré-Macenta", region: "N'Zérékoré", prefecture: "N'Zérékoré", type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 8.1500, longitude: -9.1500, overallQoS: 19.4, coverageScore: 21.0, isRoadAxis: true, roadAxisName: "Route Nationale N'Zérékoré-Macenta" },

    // ── Faranah ──
    { name: 'Faranah', region: 'Faranah', prefecture: 'Faranah', type: 'urbain', population: 89000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 10.0333, longitude: -10.7500, overallQoS: 45.7, coverageScore: 48.0, isRoadAxis: false },
    { name: 'Dabola', region: 'Faranah', prefecture: 'Dabola', type: 'rural', population: 36000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.8167, longitude: -11.1167, overallQoS: 22.4, coverageScore: 25.0, isRoadAxis: false },
    { name: 'Kissidougou (Faranah)', region: 'Faranah', prefecture: 'Kissidougou', type: 'periurbain', population: 52000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 9.2500, longitude: -10.0500, overallQoS: 36.8, coverageScore: 40.0, isRoadAxis: false },
    { name: 'Ax Faranah-Kankan', region: 'Faranah', prefecture: 'Faranah', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.2000, longitude: -10.0000, overallQoS: 21.0, coverageScore: 23.0, isRoadAxis: true, roadAxisName: 'Route Nationale Faranah-Kankan' },

    // ── Kankan ──
    { name: 'Kankan', region: 'Kankan', prefecture: 'Kankan', type: 'urbain', population: 210000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: true, hasFixedInternet: false, latitude: 10.3828, longitude: -9.3050, overallQoS: 53.2, coverageScore: 57.0, isRoadAxis: false },
    { name: 'Siguiri', region: 'Kankan', prefecture: 'Siguiri', type: 'periurbain', population: 95000, hasMobile2G: true, hasMobile3G: true, hasMobile4G: false, hasFixedInternet: false, latitude: 11.4167, longitude: -9.1667, overallQoS: 38.5, coverageScore: 42.0, isRoadAxis: false },
    { name: 'Kouroussa', region: 'Kankan', prefecture: 'Kouroussa', type: 'rural', population: 32000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.6500, longitude: -9.8833, overallQoS: 21.3, coverageScore: 23.0, isRoadAxis: false },
    { name: 'Mandiana', region: 'Kankan', prefecture: 'Mandiana', type: 'rural', population: 27000, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 11.3000, longitude: -8.7333, overallQoS: 17.8, coverageScore: 19.0, isRoadAxis: false },
    { name: 'Ax Kankan-Siguiri', region: 'Kankan', prefecture: 'Kankan', type: 'axe_routier', population: null, hasMobile2G: true, hasMobile3G: false, hasMobile4G: false, hasFixedInternet: false, latitude: 10.9000, longitude: -9.2500, overallQoS: 20.6, coverageScore: 22.0, isRoadAxis: true, roadAxisName: 'Route Nationale Kankan-Siguiri' },
  ]

  let localityCount = 0
  for (const loc of localities) {
    const existing = await prisma.locality.findFirst({
      where: { name: loc.name, region: loc.region, type: loc.type },
    })
    if (!existing) {
      await prisma.locality.create({ data: loc })
      localityCount++
    }
  }
  console.log(`  ✅ Created ${localityCount} new localities (${localities.length} total in seed)`)

  // ─── 2. DELIVERABLES ───────────────────────────────────────────────────────
  console.log('')
  console.log('📄 Seeding deliverables...')

  const campaigns = await prisma.campaign.findMany()
  const deliverableTypes = [
    { type: 'methodological_note', title: 'Note méthodologique', description: "Document décrivant l'approche méthodologique détaillée de la campagne de mesure, conformément au DAO Section III", confidentiality: 'public' },
    { type: 'sampling_plan', title: "Plan d'échantillonnage", description: "Plan détaillé des sites et échantillons de test, incluant les localités et les critères de sélection", confidentiality: 'public' },
    { type: 'raw_data', title: 'Données brutes', description: "Ensemble des données brutes collectées lors des tests terrain (drive test, walk test, test fixe)", confidentiality: 'confidential' },
    { type: 'coverage_map', title: 'Cartographie de couverture', description: "Cartes de couverture réseau détaillées par opérateur, par technologie et par localité", confidentiality: 'confidential' },
    { type: 'technical_report', title: 'Rapport technique', description: "Rapport technique détaillé par opérateur incluant l'analyse des mesures et les constats", confidentiality: 'confidential' },
    { type: 'benchmark_report', title: 'Rapport de benchmark', description: "Rapport de benchmark comparatif public des performances des opérateurs et FAI", confidentiality: 'public' },
    { type: 'ppt_presentation', title: 'Présentation PowerPoint', description: "Présentation synthétique des résultats de la campagne pour le conseil de l'ARPT", confidentiality: 'restricted' },
    { type: 'digital_support', title: 'Support numérique', description: "Support numérique contenant l'ensemble des livrables et données de la campagne", confidentiality: 'confidential' },
    { type: 'results_presentation', title: 'Présentation des résultats', description: "Présentation publique des résultats principaux de la campagne de mesure", confidentiality: 'public' },
  ]

  let deliverableCount = 0
  for (const campaign of campaigns) {
    for (const dt of deliverableTypes) {
      const existing = await prisma.deliverable.findFirst({
        where: { campaignId: campaign.id, type: dt.type },
      })
      if (!existing) {
        const status = campaign.status === 'completed' ? 'approved' : campaign.status === 'in_progress' ? (dt.type === 'methodological_note' || dt.type === 'sampling_plan' ? 'approved' : 'in_progress') : 'pending'
        const dueDate = campaign.endDate
          ? new Date(campaign.endDate.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days after campaign end
          : campaign.startDate
            ? new Date(campaign.startDate.getTime() + 135 * 24 * 60 * 60 * 1000) // ~4.5 months
            : null

        const submittedDate = status === 'approved' && dueDate
          ? new Date(dueDate.getTime() - 2 * 24 * 60 * 60 * 1000)
          : null

        await prisma.deliverable.create({
          data: {
            campaignId: campaign.id,
            type: dt.type,
            title: dt.title,
            description: dt.description,
            confidentiality: dt.confidentiality,
            status,
            dueDate,
            submittedDate,
          },
        })
        deliverableCount++
      }
    }
  }
  console.log(`  ✅ Created ${deliverableCount} deliverables across ${campaigns.length} campaigns`)

  // ─── 3. CONSTRAINTS ────────────────────────────────────────────────────────
  console.log('')
  console.log('🛡️ Seeding constraints...')

  const constraints = [
    {
      category: 'geographic',
      title: 'Accès aux zones reculées',
      description: "Les zones rurales et axes routiers sont difficilement accessibles, particulièrement pendant la saison des pluies. Certaines localités comme Mandiana, Tougué et Lola nécessitent des moyens logistiques importants pour y accéder.",
      severity: 'high',
      status: 'active',
      entityType: 'campaign',
      mitigation: "Prévoir des véhicules tout-terrain et planifier les missions terrain en saison sèche (novembre-avril). Établir des contacts locaux pour faciliter l'accès.",
    },
    {
      category: 'regulatory',
      title: "Respect des spécifications du DAO",
      description: "Le DAO N°002/ARPT/DCT/2025 impose des spécifications techniques et méthodologiques strictes. Tout écart par rapport au cahier des charges peut entraîner le rejet des livrables ou des sanctions contractuelles.",
      severity: 'critical',
      status: 'active',
      entityType: 'appel_offre',
      mitigation: "Établir une checklist de conformité au DAO et valider chaque étape avec le comité de suivi de l'ARPT.",
    },
    {
      category: 'technical',
      title: 'Disponibilité et calibration des équipements',
      description: "Les équipements de mesure (TEMS Pocket, TEMS Paragon) doivent être calibrés et disponibles en nombre suffisant. Les pannes d'équipement peuvent retarder les campagnes de terrain.",
      severity: 'medium',
      status: 'mitigated',
      entityType: 'campaign',
      mitigation: "Maintenir un stock d'équipements de rechange. Effectuer les calibrations avant chaque mission. Prévoir un plan de maintenance préventive.",
    },
    {
      category: 'calendar',
      title: 'Délai de livraison des livrables',
      description: "Le DAO impose la remise de tous les livrables dans un délai de 15 jours ouvrés après la fin des travaux de terrain. Ce délai est court compte tenu de la complexité des analyses et de la production des cartes de couverture.",
      severity: 'high',
      status: 'active',
      entityType: 'campaign',
      mitigation: "Commencer l'analyse des données en parallèle avec les travaux de terrain. Préparer les modèles de rapports en amont.",
    },
    {
      category: 'human_security',
      title: 'Sécurité du personnel de terrain',
      description: "Le personnel effectuant les mesures sur le terrain est exposé à des risques sécuritaires, notamment dans les zones frontalières (Siguiri, Macenta, Guékédou) et sur les axes routiers à cause du trafic.",
      severity: 'critical',
      status: 'active',
      entityType: 'campaign',
      mitigation: "Fournir des équipements de sécurité (gilets réfléchissants, trousse de premiers secours). Établir un protocole de communication régulier. Informer les autorités locales avant chaque mission.",
    },
    {
      category: 'confidentiality',
      title: 'Protection des données opérateurs',
      description: "Les rapports techniques par opérateur contiennent des informations sensibles sur les performances réseau. Le DAO exige une stricte confidentialité : les données d'un opérateur ne doivent pas être partagées avec ses concurrents.",
      severity: 'high',
      status: 'mitigated',
      entityType: 'appel_offre',
      mitigation: "Restreindre l'accès aux rapports individuels par opérateur. Utiliser des classeurs sécurisés numériquement. Ne publier que le rapport de benchmark comparatif agrégé.",
    },
  ]

  let constraintCount = 0
  for (const c of constraints) {
    const existing = await prisma.constraint.findFirst({
      where: { category: c.category, title: c.title },
    })
    if (!existing) {
      await prisma.constraint.create({ data: c })
      constraintCount++
    }
  }
  console.log(`  ✅ Created ${constraintCount} new constraints`)

  // ─── 4. BENCHMARK RESULTS ──────────────────────────────────────────────────
  console.log('')
  console.log('📊 Seeding benchmark results...')

  const operators = await prisma.operator.findMany({ where: { status: 'active' } })
  const fais = await prisma.fai.findMany({ where: { status: 'active' } })
  const period = 'Q1-2025'

  // Mobile operators benchmark data
  const mobileBenchmarkData: Record<string, {
    categories: { category: string; score: number; voiceScore: number; smsScore: number; dataScore: number; coverageScore: number; qoeScore: number; conformityRate: number }[]
  }> = {
    ORG: {
      categories: [
        { category: 'mobile_voice', score: 88.5, voiceScore: 92.1, smsScore: 95.0, dataScore: 78.3, coverageScore: 85.0, qoeScore: 82.5, conformityRate: 78.0 },
        { category: 'mobile_sms', score: 92.3, voiceScore: 92.1, smsScore: 95.8, dataScore: 78.3, coverageScore: 85.0, qoeScore: 82.5, conformityRate: 82.0 },
        { category: 'mobile_data', score: 75.8, voiceScore: 92.1, smsScore: 95.0, dataScore: 78.3, coverageScore: 80.5, qoeScore: 76.0, conformityRate: 72.0 },
        { category: 'overall', score: 82.2, voiceScore: 92.1, smsScore: 95.8, dataScore: 78.3, coverageScore: 85.0, qoeScore: 82.5, conformityRate: 78.0 },
      ],
    },
    MTN: {
      categories: [
        { category: 'mobile_voice', score: 80.2, voiceScore: 84.5, smsScore: 90.2, dataScore: 72.1, coverageScore: 78.0, qoeScore: 74.5, conformityRate: 68.0 },
        { category: 'mobile_sms', score: 87.5, voiceScore: 84.5, smsScore: 90.8, dataScore: 72.1, coverageScore: 78.0, qoeScore: 74.5, conformityRate: 72.0 },
        { category: 'mobile_data', score: 70.4, voiceScore: 84.5, smsScore: 90.2, dataScore: 72.1, coverageScore: 75.2, qoeScore: 68.0, conformityRate: 65.0 },
        { category: 'overall', score: 76.8, voiceScore: 84.5, smsScore: 90.8, dataScore: 72.1, coverageScore: 78.0, qoeScore: 74.5, conformityRate: 68.0 },
      ],
    },
    CEL: {
      categories: [
        { category: 'mobile_voice', score: 72.1, voiceScore: 76.8, smsScore: 85.5, dataScore: 65.2, coverageScore: 70.0, qoeScore: 68.5, conformityRate: 55.0 },
        { category: 'mobile_sms', score: 82.8, voiceScore: 76.8, smsScore: 85.8, dataScore: 65.2, coverageScore: 70.0, qoeScore: 68.5, conformityRate: 60.0 },
        { category: 'mobile_data', score: 62.5, voiceScore: 76.8, smsScore: 85.5, dataScore: 65.2, coverageScore: 66.8, qoeScore: 60.0, conformityRate: 50.0 },
        { category: 'overall', score: 68.5, voiceScore: 76.8, smsScore: 85.8, dataScore: 65.2, coverageScore: 70.0, qoeScore: 68.5, conformityRate: 55.0 },
      ],
    },
  }

  // FAI benchmark data
  const faiBenchmarkData: Record<string, {
    categories: { category: string; score: number; dataScore: number; coverageScore: number; qoeScore: number; conformityRate: number }[]
  }> = {
    GNT: {
      categories: [
        { category: 'fixed_internet', score: 72.5, dataScore: 75.8, coverageScore: 62.0, qoeScore: 70.2, conformityRate: 85.0 },
        { category: 'overall', score: 72.5, dataScore: 75.8, coverageScore: 62.0, qoeScore: 70.2, conformityRate: 85.0 },
      ],
    },
    SKV: {
      categories: [
        { category: 'fixed_internet', score: 48.2, dataScore: 42.0, coverageScore: 78.0, qoeScore: 35.5, conformityRate: 50.0 },
        { category: 'overall', score: 48.2, dataScore: 42.0, coverageScore: 78.0, qoeScore: 35.5, conformityRate: 50.0 },
      ],
    },
  }

  let benchmarkCount = 0

  for (const operator of operators) {
    const data = mobileBenchmarkData[operator.code]
    if (!data) continue

    for (const cat of data.categories) {
      // Determine rank
      const allScores = operators
        .filter(o => mobileBenchmarkData[o.code])
        .map(o => mobileBenchmarkData[o.code].categories.find(c => c.category === cat.category)?.score ?? 0)
        .sort((a, b) => b - a)
      const rank = allScores.indexOf(cat.score) + 1

      const existing = await prisma.benchmarkResult.findFirst({
        where: {
          operatorId: operator.id,
          period,
          category: cat.category,
        },
      })
      if (!existing) {
        await prisma.benchmarkResult.create({
          data: {
            period,
            category: cat.category,
            operatorId: operator.id,
            score: cat.score,
            rank,
            totalRanked: operators.filter(o => mobileBenchmarkData[o.code]).length,
            voiceScore: cat.voiceScore,
            smsScore: cat.smsScore,
            dataScore: cat.dataScore,
            coverageScore: cat.coverageScore,
            qoeScore: cat.qoeScore,
            conformityRate: cat.conformityRate,
            isPublic: cat.category === 'overall',
            publishedAt: cat.category === 'overall' ? new Date('2025-04-01') : null,
          },
        })
        benchmarkCount++
      }
    }
  }

  for (const fai of fais) {
    const data = faiBenchmarkData[fai.code]
    if (!data) continue

    for (const cat of data.categories) {
      const allScores = fais
        .filter(f => faiBenchmarkData[f.code])
        .map(f => faiBenchmarkData[f.code].categories.find(c => c.category === cat.category)?.score ?? 0)
        .sort((a, b) => b - a)
      const rank = allScores.indexOf(cat.score) + 1

      const existing = await prisma.benchmarkResult.findFirst({
        where: {
          faiId: fai.id,
          period,
          category: cat.category,
        },
      })
      if (!existing) {
        await prisma.benchmarkResult.create({
          data: {
            period,
            category: cat.category,
            faiId: fai.id,
            score: cat.score,
            rank,
            totalRanked: fais.filter(f => faiBenchmarkData[f.code]).length,
            dataScore: cat.dataScore,
            coverageScore: cat.coverageScore,
            qoeScore: cat.qoeScore,
            conformityRate: cat.conformityRate,
            isPublic: cat.category === 'overall',
            publishedAt: cat.category === 'overall' ? new Date('2025-04-01') : null,
          },
        })
        benchmarkCount++
      }
    }
  }

  console.log(`  ✅ Created ${benchmarkCount} benchmark results`)

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✨ DAO N°002/ARPT/DCT/2025 seed completed!')
  console.log(`   📍 ${localityCount} localities (across 8 regions)`)
  console.log(`   📄 ${deliverableCount} deliverables (9 types × ${campaigns.length} campaigns)`)
  console.log(`   🛡️  ${constraintCount} constraints (6 categories)`)
  console.log(`   📊 ${benchmarkCount} benchmark results (${operators.length} operators + ${fais.length} FAIs)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
