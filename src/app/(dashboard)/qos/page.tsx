'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Activity, Phone, Wifi, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const mockQosData = [
  {
    id: '1',
    operator: 'Orange Guinée',
    period: 'Q1 2025',
    callSuccessRate: 94.2,
    dropRate: 2.1,
    dataThroughput: 28.5,
    latency: 35,
    overallScore: 82,
    status: 'reviewed',
  },
  {
    id: '2',
    operator: 'MTN Guinée',
    period: 'Q1 2025',
    callSuccessRate: 89.7,
    dropRate: 3.8,
    dataThroughput: 22.1,
    latency: 48,
    overallScore: 76,
    status: 'reviewed',
  },
  {
    id: '3',
    operator: 'Celcom Guinée',
    period: 'Q1 2025',
    callSuccessRate: 85.3,
    dropRate: 5.2,
    dataThroughput: 18.3,
    latency: 62,
    overallScore: 71,
    status: 'draft',
  },
  {
    id: '4',
    operator: 'Orange Guinée',
    period: 'Q4 2024',
    callSuccessRate: 92.8,
    dropRate: 2.5,
    dataThroughput: 26.7,
    latency: 38,
    overallScore: 80,
    status: 'reviewed',
  },
  {
    id: '5',
    operator: 'MTN Guinée',
    period: 'Q4 2024',
    callSuccessRate: 87.1,
    dropRate: 4.1,
    dataThroughput: 20.5,
    latency: 52,
    overallScore: 73,
    status: 'reviewed',
  },
]

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-emerald-50'
  if (score >= 70) return 'bg-yellow-50'
  return 'bg-red-50'
}

function getProgressColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

function TrendIcon({ value, threshold }: { value: number; threshold: number }) {
  if (value > threshold) return <TrendingUp className="h-3 w-3 text-emerald-600" />
  if (value < threshold) return <TrendingDown className="h-3 w-3 text-red-600" />
  return <Minus className="h-3 w-3 text-muted-foreground" />
}

export default function QosPage() {
  // Latest reports per operator
  const latestReports = mockQosData.filter((r) => r.period === 'Q1 2025')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Qualité de Service (QoS)</h1>
        <p className="text-muted-foreground">
          Suivi des indicateurs de qualité de service des opérateurs télécoms
        </p>
      </div>

      {/* QoS Metric Cards per Operator */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {latestReports.map((report) => (
          <Card key={report.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{report.operator}</CardTitle>
                <Badge variant={report.status === 'reviewed' ? 'default' : 'outline'}>
                  {report.status === 'reviewed' ? 'Vérifié' : 'Brouillon'}
                </Badge>
              </div>
              <CardDescription>Période : {report.period}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className={`flex items-center justify-between rounded-lg p-3 ${getScoreBg(report.overallScore)}`}>
                <span className="text-sm font-medium">Score global</span>
                <span className={`text-2xl font-bold ${getScoreColor(report.overallScore)}`}>
                  {report.overallScore}%
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Taux d&apos;appel abouti
                    </span>
                    <span className="font-medium">{report.callSuccessRate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${getProgressColor(report.callSuccessRate)}`}
                      style={{ width: `${report.callSuccessRate}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      Taux d&apos;appel coupé
                    </span>
                    <span className="font-medium">{report.dropRate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${report.dropRate <= 3 ? 'bg-emerald-500' : report.dropRate <= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(report.dropRate * 10, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                      Débit data (Mbps)
                    </span>
                    <span className="font-medium">{report.dataThroughput}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${getProgressColor(report.dataThroughput / 0.35)}`}
                      style={{ width: `${Math.min((report.dataThroughput / 40) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      Latence (ms)
                    </span>
                    <span className="font-medium">{report.latency} ms</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${report.latency <= 40 ? 'bg-emerald-500' : report.latency <= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min((report.latency / 100) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full history table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des rapports QoS</CardTitle>
          <CardDescription>Tous les rapports de qualité de service par opérateur et période</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opérateur</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-center">Taux abouti</TableHead>
                <TableHead className="text-center">Taux coupé</TableHead>
                <TableHead className="text-center">Débit (Mbps)</TableHead>
                <TableHead className="text-center">Latence (ms)</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockQosData.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.operator}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {report.callSuccessRate}%
                      <TrendIcon value={report.callSuccessRate} threshold={90} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {report.dropRate}%
                      <TrendIcon value={3 - report.dropRate} threshold={0} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{report.dataThroughput}</TableCell>
                  <TableCell className="text-center">{report.latency}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={getScoreColor(report.overallScore)}
                    >
                      {report.overallScore}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'reviewed' ? 'default' : 'outline'}>
                      {report.status === 'reviewed' ? 'Vérifié' : 'Brouillon'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
