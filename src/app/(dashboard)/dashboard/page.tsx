'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { apiClient, ApiError } from '@/lib/api-client'

// Types for API data
interface DashboardData {
  operators: { total: number; active: number; pending: number; inactive: number }
  complaints: { total: number; open: number; inProgress: number; resolved: number }
  qos: { avgScore: number }
  sanctions: { total: number; proposed: number; decided: number; executed: number; totalProposedAmount: number }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    time: string
    badge: string
    badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline'
  }>
  operatorSummary: Array<{
    id: string
    name: string
    status: string
    score: number | null
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        const response = await apiClient.get<DashboardData>('/api/dashboard')
        if (response.success && response.data) {
          setData(response.data)
        } else {
          setError(response.error?.message || 'Erreur de chargement')
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Erreur de chargement du tableau de bord')
        }
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const kpiData = data ? [
    {
      title: 'Opérateurs',
      value: String(data.operators.total),
      description: `${data.operators.active} actifs, ${data.operators.pending} en attente`,
      icon: Building2,
      trend: `${data.operators.total} enregistrés`,
      trendUp: true,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Plaintes actives',
      value: String(data.complaints.open + data.complaints.inProgress),
      description: `${data.complaints.open} ouvertes, ${data.complaints.inProgress} en cours`,
      icon: MessageSquareWarning,
      trend: `${data.complaints.total} au total`,
      trendUp: data.complaints.open < data.complaints.resolved,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Score QoS moyen',
      value: `${data.qos.avgScore.toFixed(1)}%`,
      description: 'Objectif : 85%',
      icon: Activity,
      trend: data.qos.avgScore >= 75 ? 'Bon niveau' : 'En dessous de l\'objectif',
      trendUp: data.qos.avgScore >= 75,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Sanctions en attente',
      value: String(data.sanctions.proposed),
      description: data.sanctions.totalProposedAmount > 0
        ? `Montant total : ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(data.sanctions.totalProposedAmount)} GNF`
        : 'Aucun montant en attente',
      icon: Gavel,
      trend: `${data.sanctions.total} au total`,
      trendUp: data.sanctions.proposed === 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ] : []

  const quickActions = [
    { title: 'Nouvelle plainte', href: '/complaints', icon: Plus },
    { title: 'Rapport QoS', href: '/qos', icon: FileText },
    { title: 'Signaler un incident', href: '/complaints', icon: AlertTriangle },
  ]

  const statusColorMap: Record<string, string> = {
    active: 'bg-emerald-500',
    pending: 'bg-yellow-500',
    suspended: 'bg-muted',
    inactive: 'bg-red-500',
    revoked: 'bg-red-500',
  }

  const statusLabelMap: Record<string, string> = {
    active: 'Actif',
    pending: 'En attente',
    suspended: 'Suspendu',
    inactive: 'Inactif',
    revoked: 'Révoqué',
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de l&apos;activité de régulation télécom
          </p>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Erreur de chargement</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          kpiData.map((kpi) => (
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
          ))
        )}
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
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-48 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.recentActivity.map((activity) => (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Aucune activité récente</p>
              </div>
            )}
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
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : data?.operatorSummary && data.operatorSummary.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.operatorSummary.map((op) => (
                <div
                  key={op.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${statusColorMap[op.status] || 'bg-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{op.name}</p>
                    <p className="text-xs text-muted-foreground">{statusLabelMap[op.status] || op.status}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {op.score !== null ? `${op.score}%` : '—'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucun opérateur enregistré</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
