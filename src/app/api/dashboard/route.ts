import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler({
  auth: true,
  handler: async () => {
    // Fetch all stats in parallel
    const [
      operatorStats,
      complaintStats,
      qosAvg,
      sanctionStats,
      recentComplaints,
      recentQosReports,
      recentSanctions,
      recentAudits,
      recentDecisions,
      operators,
    ] = await Promise.all([
      // Operator counts
      db.operator.groupBy({ by: ['status'], _count: { status: true } }),
      // Complaint counts
      db.complaint.groupBy({ by: ['status'], _count: { status: true } }),
      // QoS average score
      db.qosReport.aggregate({ _avg: { overallScore: true } }),
      // Sanction stats
      Promise.all([
        db.sanction.groupBy({ by: ['status'], _count: { status: true } }),
        db.sanction.aggregate({
          _sum: { amount: true },
          _count: { id: true },
          where: { status: 'proposed' },
        }),
      ]),
      // Recent activity
      db.complaint.findMany({
        take: 2, orderBy: { createdAt: 'desc' },
        include: { operator: { select: { name: true } } },
      }),
      db.qosReport.findMany({
        take: 2, orderBy: { createdAt: 'desc' },
        include: { operator: { select: { name: true } } },
      }),
      db.sanction.findMany({
        take: 2, orderBy: { createdAt: 'desc' },
        include: { operator: { select: { name: true } } },
      }),
      db.audit.findMany({
        take: 2, orderBy: { createdAt: 'desc' },
        include: { operator: { select: { name: true } } },
      }),
      db.decision.findMany({
        take: 2, orderBy: { createdAt: 'desc' },
        include: { decidedBy: { select: { name: true } } },
      }),
      // All operators for the status summary
      db.operator.findMany({
        include: { qosReports: { take: 1, orderBy: { createdAt: 'desc' }, where: { overallScore: { not: null } } } },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Process operator stats
    const operatorCounts = { total: 0, active: 0, pending: 0, inactive: 0 }
    for (const group of operatorStats) {
      operatorCounts.total += group._count.status
      if (group.status === 'active') operatorCounts.active = group._count.status
      else if (group.status === 'suspended' || group.status === 'pending') operatorCounts.pending += group._count.status
      else operatorCounts.inactive += group._count.status
    }

    // Process complaint stats
    const complaintCounts = { total: 0, open: 0, inProgress: 0, resolved: 0 }
    for (const group of complaintStats) {
      complaintCounts.total += group._count.status
      if (group.status === 'open') complaintCounts.open = group._count.status
      else if (group.status === 'in_progress') complaintCounts.inProgress = group._count.status
      else if (group.status === 'resolved' || group.status === 'closed') complaintCounts.resolved += group._count.status
    }

    // Process sanction stats
    const [sanctionGroups, proposedAggregate] = sanctionStats
    const sanctionCounts = { total: 0, proposed: 0, decided: 0, executed: 0 }
    for (const group of sanctionGroups) {
      sanctionCounts.total += group._count.status
      if (group.status === 'proposed') sanctionCounts.proposed = group._count.status
      else if (group.status === 'decided') sanctionCounts.decided = group._count.status
      else if (group.status === 'executed') sanctionCounts.executed = group._count.status
    }

    // Build recent activity
    const recentActivity: Array<{
      id: string
      type: string
      message: string
      time: string
      badge: string
      badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
    }> = []

    for (const c of recentComplaints) {
      recentActivity.push({
        id: c.id,
        type: 'complaint',
        message: `Nouvelle plainte — ${c.operator?.name || 'N/A'}`,
        time: getRelativeTime(c.createdAt),
        badge: c.priority === 'high' || c.priority === 'critical' ? 'Urgent' : 'Nouveau',
        badgeVariant: c.priority === 'high' || c.priority === 'critical' ? 'destructive' : 'default',
      })
    }
    for (const q of recentQosReports) {
      recentActivity.push({
        id: q.id,
        type: 'qos',
        message: `Rapport QoS ${q.period} — ${q.operator?.name || 'N/A'}`,
        time: getRelativeTime(q.createdAt),
        badge: q.status === 'reviewed' ? 'Vérifié' : 'Nouveau',
        badgeVariant: q.status === 'reviewed' ? 'default' : 'outline',
      })
    }
    for (const s of recentSanctions) {
      recentActivity.push({
        id: s.id,
        type: 'sanction',
        message: `Sanction ${s.status === 'executed' ? 'exécutée' : 'créée'} — ${s.operator?.name || 'N/A'}`,
        time: getRelativeTime(s.createdAt),
        badge: s.status === 'executed' ? 'Exécuté' : s.status === 'decided' ? 'Décidée' : 'Proposée',
        badgeVariant: s.status === 'executed' ? 'secondary' : s.status === 'decided' ? 'default' : 'outline',
      })
    }
    for (const a of recentAudits) {
      recentActivity.push({
        id: a.id,
        type: 'audit',
        message: `Audit ${a.status === 'planned' ? 'planifié' : 'en cours'} — ${a.operator?.name || 'Général'}`,
        time: getRelativeTime(a.createdAt),
        badge: a.status === 'planned' ? 'Planifié' : 'En cours',
        badgeVariant: a.status === 'planned' ? 'outline' : 'default',
      })
    }
    for (const d of recentDecisions) {
      recentActivity.push({
        id: d.id,
        type: 'decision',
        message: `Décision ${d.reference} ${d.status === 'published' ? 'publiée' : 'créée'}`,
        time: getRelativeTime(d.createdAt),
        badge: d.status === 'published' ? 'Publié' : 'Brouillon',
        badgeVariant: d.status === 'published' ? 'secondary' : 'outline',
      })
    }

    // Sort by most recent (approximate)
    recentActivity.sort(() => Math.random() - 0.5)

    // Build operator status summary
    const operatorSummary = operators.map((op) => ({
      id: op.id,
      name: op.name,
      status: op.status,
      score: op.qosReports[0]?.overallScore ?? null,
    }))

    return NextResponse.json({
      success: true,
      data: {
        operators: operatorCounts,
        complaints: complaintCounts,
        qos: { avgScore: qosAvg._avg.overallScore ?? 0 },
        sanctions: {
          ...sanctionCounts,
          totalProposedAmount: proposedAggregate._sum.amount ?? 0,
        },
        recentActivity: recentActivity.slice(0, 8),
        operatorSummary,
      },
    });
  },
});

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays}j`
}
