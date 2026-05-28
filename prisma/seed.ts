import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

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
      await prisma.complaint.create({ data: complaint });
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
      await prisma.sanction.create({ data: sanction });
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
      await prisma.audit.create({ data: audit });
    }
    console.log(`Created ${audits.length} audits`);
  }

  // ── Decisions ──────────────────────────────────────
  const decisions = [
    { reference: "DEC-2025-001", title: "Decision QoS 2025-Q1", description: "Decision fixant les nouveaux seuils de qualite de service pour l'annee 2025.", type: "reglementaire", status: "published" },
    { reference: "DEC-2025-002", title: "Attribution licence 5G", description: "Decision d'attribution de la licence experimentale 5G.", type: "attribution", status: "draft" },
  ];

  for (const decision of decisions) {
    await prisma.decision.create({ data: decision });
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
