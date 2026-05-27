'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Activity,
  MessageSquareWarning,
  Gavel,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  FileText,
  AlertTriangle,
} from 'lucide-react'

// Mock data
const kpiData = [
  {
    title: 'Opérateurs',
    value: '6',
    description: '4 actifs, 2 en attente',
    icon: Building2,
    trend: '+1 ce mois',
    trendUp: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Plaintes actives',
    value: '23',
    description: '8 urgentes, 15 en cours',
    icon: MessageSquareWarning,
    trend: '+5 cette semaine',
    trendUp: false,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    title: 'Score QoS moyen',
    value: '78.5%',
    description: 'Objectif : 85%',
    icon: Activity,
    trend: '+2.3% ce mois',
    trendUp: true,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Sanctions en attente',
    value: '4',
    description: 'Montant total : 125M GNF',
    icon: Gavel,
    trend: '-2 résolues',
    trendUp: true,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'complaint',
    message: 'Nouvelle plainte déposée — Orange Guinée',
    time: 'Il y a 15 min',
    badge: 'Urgent',
    badgeVariant: 'destructive' as const,
  },
  {
    id: 2,
    type: 'qos',
    message: 'Rapport QoS Q1-2025 — MTN Guinée soumis',
    time: 'Il y a 2h',
    badge: 'Nouveau',
    badgeVariant: 'default' as const,
  },
  {
    id: 3,
    type: 'sanction',
    message: 'Sanction exécutée — Celcom Guinée',
    time: 'Il y a 5h',
    badge: 'Exécuté',
    badgeVariant: 'secondary' as const,
  },
  {
    id: 4,
    type: 'audit',
    message: 'Audit de conformité programmé — 15 Mars 2025',
    time: 'Hier',
    badge: 'Planifié',
    badgeVariant: 'outline' as const,
  },
  {
    id: 5,
    type: 'decision',
    message: 'Décision n°2025-012 publiée',
    time: 'Hier',
    badge: 'Publié',
    badgeVariant: 'secondary' as const,
  },
]

const quickActions = [
  { title: 'Nouvelle plainte', href: '/complaints', icon: Plus },
  { title: 'Rapport QoS', href: '/qos', icon: FileText },
  { title: 'Signaler un incident', href: '/complaints', icon: AlertTriangle },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de l&apos;activité de régulation télécom
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
              <div className="flex items-center gap-1 mt-2">
                {kpi.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-orange-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    kpi.trendUp ? 'text-emerald-600' : 'text-orange-600'
                  }`}
                >
                  {kpi.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières actions sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                  <Badge variant={activity.badgeVariant} className="shrink-0">
                    {activity.badge}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Raccourcis vers les tâches courantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full justify-start gap-3 h-12"
                  asChild
                >
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4" />
                    {action.title}
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-dashed p-4 text-center">
              <p className="text-sm font-medium">Besoin d&apos;aide ?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Consultez le guide utilisateur ou contactez le support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operator status summary */}
      <Card>
        <CardHeader>
          <CardTitle>État des opérateurs</CardTitle>
          <CardDescription>Résumé du statut des opérateurs télécoms en Guinée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Orange Guinée', status: 'Actif', score: '82%', color: 'bg-emerald-500' },
              { name: 'MTN Guinée', status: 'Actif', score: '76%', color: 'bg-yellow-500' },
              { name: 'Celcom Guinée', status: 'Actif', score: '71%', color: 'bg-orange-500' },
              { name: 'Guinéenne de Téléphonie', status: 'En attente', score: '—', color: 'bg-muted' },
              { name: 'Sotelgui', status: 'Inactif', score: '—', color: 'bg-red-500' },
              { name: 'Africa Telecom', status: 'En attente', score: '—', color: 'bg-muted' },
            ].map((op) => (
              <div
                key={op.name}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className={`h-2.5 w-2.5 rounded-full ${op.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{op.name}</p>
                  <p className="text-xs text-muted-foreground">{op.status}</p>
                </div>
                <span className="text-sm font-semibold">{op.score}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
