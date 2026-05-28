import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Regions ──────────────────────────────────────────
  const regions = [
    { name: "Conakry", code: "CK", latitude: 9.5092, longitude: -13.7122, population: 2076609, area: 450, activeOperators: 4, qosScore: 83.8, complaintCount: 12, coverage: 95 },
    { name: "Kindia", code: "KD", latitude: 10.0667, longitude: -12.8667, population: 1843043, area: 28533, activeOperators: 3, qosScore: 75.2, complaintCount: 5, coverage: 78 },
    { name: "Boké", code: "BK", latitude: 11.1833, longitude: -14.2833, population: 1098475, area: 31118, activeOperators: 2, qosScore: 62.5, complaintCount: 8, coverage: 55 },
    { name: "Labé", code: "LB", latitude: 11.3167, longitude: -12.3000, population: 1248012, area: 22729, activeOperators: 2, qosScore: 58.3, complaintCount: 6, coverage: 50 },
    { name: "Mamou", code: "MM", latitude: 10.3833, longitude: -12.0833, population: 1034284, area: 8038, activeOperators: 2, qosScore: 65.1, complaintCount: 4, coverage: 62 },
    { name: "Faranah", code: "FR", latitude: 10.0333, longitude: -10.7500, population: 939806, area: 35581, activeOperators: 1, qosScore: 45.7, complaintCount: 9, coverage: 35 },
    { name: "Kankan", code: "KN", latitude: 10.3833, longitude: -9.3000, population: 1999307, area: 72256, activeOperators: 3, qosScore: 68.4, complaintCount: 7, coverage: 70 },
    { name: "N'Zérékoré", code: "NZ", latitude: 7.7500, longitude: -8.8167, population: 1865061, area: 38841, activeOperators: 2, qosScore: 52.1, complaintCount: 11, coverage: 42 },
  ];
  for (const r of regions) {
    await prisma.region.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }
  console.log(`Created ${regions.length} regions`);

  // ── Users ──────────────────────────────────────────
  const users = [
    { email: "superadmin@arpt.gn", name: "Super Administrateur", role: "super_admin", password: "SuperAdmin@2025" },
    { email: "admin@arpt.gn", name: "Administrateur ARPT", role: "admin", password: "Admin@2025", service: "qos" },
    { email: "dg@arpt.gn", name: "Directeur General", role: "dg", password: "DG@2025" },
    { email: "directeur@arpt.gn", name: "Directeur QoS", role: "directeur", password: "Directeur@2025", service: "qos" },
    { email: "chef@arpt.gn", name: "Chef Service", role: "chef_service", password: "Chef@2025", service: "qos" },
    { email: "agent@arpt.gn", name: "Agent Controle", role: "agent", password: "Agent@2025", service: "controle" },
    { email: "juriste@arpt.gn", name: "Juriste ARPT", role: "juriste", password: "Juriste@2025", service: "juridique" },
    { email: "citoyen@arpt.gn", name: "Citoyen Guineen", role: "citoyen", password: "Citoyen@2025" },
    { email: "orange@arpt.gn", name: "Representant Orange", role: "operateur", password: "Operateur@2025" },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: hashedPassword,
        service: (u as any).service || null,
      },
    });
  }
  console.log(`Created ${users.length} users`);

  // ── Operators ──────────────────────────────────────
  const operators = [
    { name: "Orange Guinee", code: "ORG", type: "mobile_fixe", contactEmail: "info@orange.gn" },
    { name: "MTN Guinee", code: "MTN", type: "mobile", contactEmail: "info@mtn.gn" },
    { name: "Celcom Guinee", code: "CEL", type: "mobile", contactEmail: "info@celcom.gn" },
    { name: "Guinee Telecom", code: "GTC", type: "fixe", contactEmail: "info@guineetelecom.gn" },
  ];

  for (const op of operators) {
    await prisma.operator.upsert({
      where: { code: op.code },
      update: {},
      create: op,
    });
  }
  console.log(`Created ${operators.length} operators`);

  // ── Region-Operator Coverage Data ──────────────────
  const regionOperatorsData = [
    // Conakry - all 4 operators
    { regionCode: "CK", operatorCode: "ORG", coverage2G: 99, coverage3G: 97, coverage4G: 92, qosScore: 88, subscriberCount: 850000, siteCount: 450 },
    { regionCode: "CK", operatorCode: "MTN", coverage2G: 98, coverage3G: 95, coverage4G: 88, qosScore: 82, subscriberCount: 720000, siteCount: 380 },
    { regionCode: "CK", operatorCode: "CEL", coverage2G: 95, coverage3G: 90, coverage4G: 75, qosScore: 75, subscriberCount: 350000, siteCount: 220 },
    { regionCode: "CK", operatorCode: "GTC", coverage2G: 90, coverage3G: 70, coverage4G: 30, qosScore: 65, subscriberCount: 120000, siteCount: 85 },
    // Kindia - 3 operators
    { regionCode: "KD", operatorCode: "ORG", coverage2G: 92, coverage3G: 80, coverage4G: 55, qosScore: 78, subscriberCount: 280000, siteCount: 180 },
    { regionCode: "KD", operatorCode: "MTN", coverage2G: 88, coverage3G: 72, coverage4G: 45, qosScore: 72, subscriberCount: 220000, siteCount: 150 },
    { regionCode: "KD", operatorCode: "CEL", coverage2G: 80, coverage3G: 60, coverage4G: 25, qosScore: 62, subscriberCount: 95000, siteCount: 85 },
    // Boké - 2 operators
    { regionCode: "BK", operatorCode: "ORG", coverage2G: 78, coverage3G: 55, coverage4G: 25, qosScore: 65, subscriberCount: 150000, siteCount: 95 },
    { regionCode: "BK", operatorCode: "MTN", coverage2G: 72, coverage3G: 48, coverage4G: 18, qosScore: 58, subscriberCount: 110000, siteCount: 72 },
    // Labé - 2 operators
    { regionCode: "LB", operatorCode: "ORG", coverage2G: 75, coverage3G: 50, coverage4G: 20, qosScore: 60, subscriberCount: 130000, siteCount: 80 },
    { regionCode: "LB", operatorCode: "MTN", coverage2G: 70, coverage3G: 42, coverage4G: 15, qosScore: 55, subscriberCount: 95000, siteCount: 65 },
    // Mamou - 2 operators
    { regionCode: "MM", operatorCode: "ORG", coverage2G: 82, coverage3G: 58, coverage4G: 28, qosScore: 68, subscriberCount: 140000, siteCount: 90 },
    { regionCode: "MM", operatorCode: "MTN", coverage2G: 75, coverage3G: 50, coverage4G: 20, qosScore: 60, subscriberCount: 100000, siteCount: 70 },
    // Faranah - 1 operator
    { regionCode: "FR", operatorCode: "ORG", coverage2G: 60, coverage3G: 30, coverage4G: 8, qosScore: 45, subscriberCount: 75000, siteCount: 45 },
    // Kankan - 3 operators
    { regionCode: "KN", operatorCode: "ORG", coverage2G: 85, coverage3G: 65, coverage4G: 35, qosScore: 72, subscriberCount: 250000, siteCount: 160 },
    { regionCode: "KN", operatorCode: "MTN", coverage2G: 80, coverage3G: 58, coverage4G: 28, qosScore: 65, subscriberCount: 200000, siteCount: 130 },
    { regionCode: "KN", operatorCode: "CEL", coverage2G: 72, coverage3G: 45, coverage4G: 12, qosScore: 55, subscriberCount: 80000, siteCount: 55 },
    // N'Zérékoré - 2 operators
    { regionCode: "NZ", operatorCode: "ORG", coverage2G: 65, coverage3G: 38, coverage4G: 12, qosScore: 52, subscriberCount: 120000, siteCount: 70 },
    { regionCode: "NZ", operatorCode: "MTN", coverage2G: 58, coverage3G: 30, coverage4G: 8, qosScore: 48, subscriberCount: 85000, siteCount: 52 },
  ];

  for (const ro of regionOperatorsData) {
    const region = await prisma.region.findUnique({ where: { code: ro.regionCode } });
    const operator = await prisma.operator.findUnique({ where: { code: ro.operatorCode } });
    if (region && operator) {
      await prisma.regionOperator.upsert({
        where: {
          regionId_operatorId: { regionId: region.id, operatorId: operator.id },
        },
        update: {},
        create: {
          regionId: region.id,
          operatorId: operator.id,
          active: true,
          coverage2G: ro.coverage2G,
          coverage3G: ro.coverage3G,
          coverage4G: ro.coverage4G,
          qosScore: ro.qosScore,
          subscriberCount: ro.subscriberCount,
          siteCount: ro.siteCount,
        },
      });
    }
  }
  console.log(`Created ${regionOperatorsData.length} region-operator entries`);

  // ── QoS Reports ────────────────────────────────────
  const orangeOp = await prisma.operator.findUnique({ where: { code: "ORG" } });
  const mtnOp = await prisma.operator.findUnique({ where: { code: "MTN" } });

  if (orangeOp && mtnOp) {
    const qosReports = [
      { operatorId: orangeOp.id, period: "2025-Q1", callSuccessRate: 95.2, dropRate: 2.1, smsSuccessRate: 98.5, dataThroughput: 25.3, latency: 45, overallScore: 88, status: "reviewed", region: "Conakry" },
      { operatorId: mtnOp.id, period: "2025-Q1", callSuccessRate: 91.8, dropRate: 3.5, smsSuccessRate: 96.2, dataThroughput: 22.1, latency: 52, overallScore: 82, status: "draft", region: "Conakry" },
      { operatorId: orangeOp.id, period: "2025-Q1", callSuccessRate: 89.5, dropRate: 4.2, smsSuccessRate: 94.8, dataThroughput: 18.7, latency: 65, overallScore: 75, status: "draft", region: "Kindia" },
    ];

    for (const report of qosReports) {
      await prisma.qosReport.create({ data: report });
    }
    console.log(`Created ${qosReports.length} QoS reports`);
  }

  // ── Complaints ─────────────────────────────────────
  if (orangeOp && mtnOp) {
    const complaints = [
      { reference: "PLA-2025-001", title: "Pertes d'appels repetees", description: "Depuis 2 semaines, de nombreux appels sont coupes apres quelques secondes sur le reseau Orange dans la zone de Kaloum.", category: "qualite_service", priority: "high", operatorId: orangeOp.id, complainantName: "Mamady Diallo", complainantPhone: "+224622000001" },
      { reference: "PLA-2025-002", title: "Facturation abusive data", description: "Mon forfait data a ete consomme anormalement vite sans utilisation excessive de ma part.", category: "facturation", priority: "medium", operatorId: mtnOp.id, complainantName: "Fatoumata Bary", complainantEmail: "f.bary@email.gn" },
      { reference: "PLA-2025-003", title: "Absence de couverture", description: "Le village de Boundou n'a aucune couverture mobile depuis 3 mois.", category: "couverture", priority: "critical", operatorId: orangeOp.id, status: "open" },
    ];

    for (const complaint of complaints) {
      await prisma.complaint.upsert({
        where: { reference: complaint.reference },
        update: {},
        create: complaint,
      });
    }
    console.log(`Created ${complaints.length} complaints`);
  }

  // ── Sanctions ──────────────────────────────────────
  if (orangeOp && mtnOp) {
    const sanctions = [
      { reference: "SAN-2025-001", title: "Avertissement Orange QoS Q1", description: "Non-respect des seuils minimaux de qualite de service pour la periode Q1 2025.", type: "avertissement", operatorId: orangeOp.id, status: "executed" },
      { reference: "SAN-2025-002", title: "Amine MTN couverture", description: "Amine de 50 millions GNF pour defaut de couverture dans la zone de N'Zerekore.", type: "amine", amount: 50000000, operatorId: mtnOp.id, status: "proposed" },
    ];

    for (const sanction of sanctions) {
      await prisma.sanction.upsert({
        where: { reference: sanction.reference },
        update: {},
        create: sanction,
      });
    }
    console.log(`Created ${sanctions.length} sanctions`);
  }

  // ── Audits ─────────────────────────────────────────
  if (orangeOp) {
    const audits = [
      { reference: "AUD-2025-001", title: "Audit conformite Orange", description: "Audit de conformite technique des infrastructures reseau Orange Guinee.", type: "conformite", status: "completed", operatorId: orangeOp.id, findings: "3 non-conformites majeures detectees", recommendations: "Mise en conformite sous 90 jours" },
      { reference: "AUD-2025-002", title: "Audit procedure interne", description: "Revision des procedures de traitement des plaintes.", type: "procedure", status: "in_progress" },
    ];

    for (const audit of audits) {
      await prisma.audit.upsert({
        where: { reference: audit.reference },
        update: {},
        create: audit,
      });
    }
    console.log(`Created ${audits.length} audits`);
  }

  // ── Decisions ──────────────────────────────────────
  const decisions = [
    { reference: "DEC-2025-001", title: "Decision QoS 2025-Q1", description: "Decision fixant les nouveaux seuils de qualite de service pour l'annee 2025.", type: "reglementaire", status: "published" },
    { reference: "DEC-2025-002", title: "Attribution licence 5G", description: "Decision d'attribution de la licence experimentale 5G.", type: "attribution", status: "draft" },
  ];

  for (const decision of decisions) {
    await prisma.decision.upsert({
      where: { reference: decision.reference },
      update: {},
      create: decision,
    });
  }
  console.log(`Created ${decisions.length} decisions`);

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
