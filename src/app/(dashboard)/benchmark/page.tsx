'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Phone,
  MessageSquare,
  Wifi,
  Clock,
  AlertTriangle,
  Star,
  TrendingDown,
  Shield,
  Zap,
  Globe,
} from 'lucide-react'

interface OperatorComparison {
  operatorId: string
  operatorName: string
  operatorCode: string
  totalMeasurements: number
  rank: number
  voice: { successRate: number | null; dropRate: number | null; avgSetupTime: number | null }
  sms: { successRate: number | null; avgDelay: number | null }
  data: { avgDownload: number | null; avgUpload: number | null; avgLatency: number | null; avgPacketLoss: number | null }
  qoe: { avgPageLoadTime: number | null; avgVideoScore: number | null; avgDownloadSuccessRate: number | null }
  overallScore: number | null
  conformRate: number | null
}

interface RegionOperator {
  operatorId: string
  operatorName: string
  operatorCode: string
  measurements: number
  voiceSuccessRate: number | null
  avgDownload: number | null
  avgLatency: number | null
  conformRate: number | null
}

interface RegionBreakdown {
  region: string
  operators: RegionOperator[]
}

interface TechOperator {
  operatorId: string
  operatorName: string
  operatorCode: string
  measurements: number
  avgDownload: number | null
  conformRate: number | null
}

interface TechBreakdown {
  technology: string
  operators: TechOperator[]
}

interface CriticalZone {
  region: string
  avgConformRate: number
  operators: RegionOperator[]
}

interface BenchmarkData {
  operatorComparison: OperatorComparison[]
  regionBreakdown: RegionBreakdown[]
  technologyBreakdown: TechBreakdown[]
  criticalZones: CriticalZone[]
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-12 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

function StarRating({ score, max = 5 }: { score: number; max?: number }) {
  const filled = Math.round(score)
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < filled ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  )
}

function getScoreColor(score: number | null) {
  if (score === null) return 'text-muted-foreground'
  if (score >= 75) return 'text-emerald-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBg(score: number | null) {
  if (score === null) return 'bg-muted/50'
  if (score >= 75) return 'bg-emerald-50 border-emerald-200'
  if (score >= 50) return 'bg-amber-50 border-amber-200'
  return 'bg-red-50 border-red-200'
}

function getProgressBarColor(score: number | null) {
  if (score === null) return 'bg-muted'
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-amber-100 text-amber-800 border-amber-300',
    2: 'bg-gray-100 text-gray-700 border-gray-300',
    3: 'bg-orange-100 text-orange-800 border-orange-300',
  }
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <span className={`inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles[rank] || 'bg-muted text-muted-foreground border-muted'}`}>
      {medals[rank] || `#${rank}`}
    </span>
  )
}

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [technologyFilter, setTechnologyFilter] = useState<string>('')

  const fetchBenchmark = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (technologyFilter) params.set('technology', technologyFilter)
      const res = await fetch(`/api/benchmark?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const json = await res.json()
      setData(json)
    } catch {
      setError('Impossible de charger les données de benchmarking')
    } finally {
      setLoading(false)
    }
  }, [technologyFilter])

  useEffect(() => {
    fetchBenchmark()
  }, [fetchBenchmark])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="text-lg font-medium">{error || 'Aucune donnée disponible'}</p>
      </div>
    )
  }

  const { operatorComparison, regionBreakdown, technologyBreakdown, criticalZones } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Benchmarking Opérateurs
          </h1>
          <p className="text-muted-foreground">
            Comparaison synthétique des performances des opérateurs de télécommunications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Rapport public de transparence — ARPT Guinée</span>
        </div>
      </div>

      {/* Technology filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Filtrer par technologie :</span>
        <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes technologies</SelectItem>
            <SelectItem value="2G">2G</SelectItem>
            <SelectItem value="3G">3G</SelectItem>
            <SelectItem value="4G">4G</SelectItem>
            <SelectItem value="fixe">Fixe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Operator Ranking Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {operatorComparison.map((op) => (
          <Card key={op.operatorId} className={`border-2 ${getScoreBg(op.overallScore)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{op.operatorName}</CardTitle>
                <RankBadge rank={op.rank} />
              </div>
              <CardDescription>
                <code className="rounded bg-white/50 px-1.5 py-0.5 text-xs">{op.operatorCode}</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Score global</span>
                <span className={`text-2xl font-bold ${getScoreColor(op.overallScore)}`}>
                  {op.overallScore !== null ? op.overallScore : '—'}
                </span>
              </div>
              <Progress value={op.overallScore || 0} className="h-2" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>Voix : {op.voice.successRate !== null ? `${op.voice.successRate}%` : '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span>SMS : {op.sms.successRate !== null ? `${op.sms.successRate}%` : '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-muted-foreground" />
                  <span>Débit : {op.data.avgDownload !== null ? `${op.data.avgDownload}` : '—'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span>Latence : {op.data.avgLatency !== null ? `${op.data.avgLatency}ms` : '—'}</span>
                </div>
              </div>
              {op.qoe.avgVideoScore !== null && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">QoE :</span>
                  <StarRating score={op.qoe.avgVideoScore} />
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{op.totalMeasurements} mesures</span>
                <span className={`font-semibold ${op.conformRate !== null && op.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Conformité : {op.conformRate !== null ? `${op.conformRate}%` : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed comparison table */}
      <Tabs defaultValue="operators" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="operators">Comparaison</TabsTrigger>
          <TabsTrigger value="regions">Par Région</TabsTrigger>
          <TabsTrigger value="technologies">Par Technologie</TabsTrigger>
          <TabsTrigger value="critiques">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Zones Critiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operators" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison détaillée des opérateurs</CardTitle>
              <CardDescription>Indicateurs de qualité de service par opérateur — voix, SMS, données et QoE</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rang</TableHead>
                      <TableHead>Opérateur</TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span>Voix (%)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>SMS (%)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Wifi className="h-3.5 w-3.5" />
                          <span>Débit (Mbps)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Latence (ms)</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span>QoE</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead className="text-center">Conformité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operatorComparison.map((op) => (
                      <TableRow key={op.operatorId}>
                        <TableCell><RankBadge rank={op.rank} /></TableCell>
                        <TableCell className="font-medium">{op.operatorName}</TableCell>
                        <TableCell className="text-center">
                          {op.voice.successRate !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={getScoreColor(op.voice.successRate)}>{op.voice.successRate}%</span>
                              <ScoreBar value={op.voice.successRate} max={100} color={getProgressBarColor(op.voice.successRate)} />
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {op.sms.successRate !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={getScoreColor(op.sms.successRate)}>{op.sms.successRate}%</span>
                              <ScoreBar value={op.sms.successRate} max={100} color={getProgressBarColor(op.sms.successRate)} />
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {op.data.avgDownload !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={getScoreColor(op.data.avgDownload > 15 ? 80 : op.data.avgDownload > 5 ? 55 : 30)}>
                                {op.data.avgDownload}
                              </span>
                              <ScoreBar value={op.data.avgDownload} max={30} color={getProgressBarColor(op.data.avgDownload > 15 ? 80 : op.data.avgDownload > 5 ? 55 : 30)} />
                            </div>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {op.data.avgLatency !== null ? (
                            <span className={op.data.avgLatency <= 50 ? 'text-emerald-600 font-medium' : op.data.avgLatency <= 100 ? 'text-amber-600 font-medium' : 'text-red-600 font-medium'}>
                              {op.data.avgLatency}
                            </span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {op.qoe.avgVideoScore !== null ? (
                            <StarRating score={op.qoe.avgVideoScore} />
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-bold ${getScoreColor(op.overallScore)}`}>
                            {op.overallScore !== null ? op.overallScore : '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {op.conformRate !== null ? (
                            <Badge variant={op.conformRate >= 70 ? 'default' : 'destructive'}>
                              {op.conformRate}%
                            </Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Comparaison par région
              </CardTitle>
              <CardDescription>Performances des opérateurs dans chaque région de Guinée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {regionBreakdown.map((region) => (
                  <div key={region.region}>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {region.region}
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opérateur</TableHead>
                            <TableHead className="text-center">Mesures</TableHead>
                            <TableHead className="text-center">Voix (%)</TableHead>
                            <TableHead className="text-center">Débit (Mbps)</TableHead>
                            <TableHead className="text-center">Latence (ms)</TableHead>
                            <TableHead className="text-center">Conformité</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {region.operators.map((op) => (
                            <TableRow key={op.operatorId}>
                              <TableCell className="font-medium">{op.operatorName}</TableCell>
                              <TableCell className="text-center">{op.measurements}</TableCell>
                              <TableCell className="text-center">
                                {op.voiceSuccessRate !== null ? (
                                  <span className={getScoreColor(op.voiceSuccessRate)}>{op.voiceSuccessRate}%</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-center">{op.avgDownload !== null ? op.avgDownload : '—'}</TableCell>
                              <TableCell className="text-center">{op.avgLatency !== null ? op.avgLatency : '—'}</TableCell>
                              <TableCell className="text-center">
                                {op.conformRate !== null ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={op.conformRate} className="h-2 w-16" />
                                    <span className={`text-xs font-medium ${op.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {op.conformRate}%
                                    </span>
                                  </div>
                                ) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
                {regionBreakdown.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Globe className="h-8 w-8 mb-2" />
                    <p>Aucune donnée régionale disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technologies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Analyse par technologie
              </CardTitle>
              <CardDescription>Comparaison des performances par type de réseau (2G, 3G, 4G, Fixe)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {technologyBreakdown.map((tech) => (
                  <div key={tech.technology}>
                    <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-bold">{tech.technology}</Badge>
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {tech.operators.map((op) => (
                        <Card key={op.operatorId} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{op.operatorName}</span>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{op.operatorCode}</code>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Débit moyen</span>
                              <span className="font-medium">{op.avgDownload !== null ? `${op.avgDownload} Mbps` : '—'}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Conformité</span>
                              <div className="flex items-center gap-2">
                                <Progress value={op.conformRate || 0} className="h-2 w-16" />
                                <span className={`text-xs font-medium ${(op.conformRate || 0) >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {op.conformRate !== null ? `${op.conformRate}%` : '—'}
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mesures</span>
                              <span className="font-medium">{op.measurements}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
                {technologyBreakdown.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Zap className="h-8 w-8 mb-2" />
                    <p>Aucune donnée technologique disponible</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="critiques" className="mt-4">
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                Zones Critiques
              </CardTitle>
              <CardDescription className="text-red-700/70">
                Régions présentant les taux de conformité les plus faibles — nécessitent une attention prioritaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              {criticalZones.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <TrendingDown className="h-8 w-8 mb-2" />
                  <p>Aucune zone critique identifiée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalZones.map((zone) => (
                    <Card key={zone.region} className="border-red-200 bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <h4 className="font-semibold">{zone.region}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Conformité moyenne :</span>
                            <Badge variant="destructive" className="text-sm">
                              {zone.avgConformRate}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={zone.avgConformRate} className="h-3 mb-3" />
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {zone.operators.map((op) => (
                            <div key={op.operatorId} className="rounded-lg border border-red-100 bg-red-50/30 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{op.operatorName}</span>
                                <code className="rounded bg-white px-1 py-0.5 text-xs">{op.operatorCode}</code>
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Voix</span>
                                  <span className={op.voiceSuccessRate !== null ? getScoreColor(op.voiceSuccessRate) : ''}>
                                    {op.voiceSuccessRate !== null ? `${op.voiceSuccessRate}%` : '—'}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Débit</span>
                                  <span>{op.avgDownload !== null ? `${op.avgDownload} Mbps` : '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Conformité</span>
                                  <span className={`font-semibold ${op.conformRate !== null && op.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {op.conformRate !== null ? `${op.conformRate}%` : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary notice */}
          <Card className="mt-4 border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Note de l&apos;ARPT</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Les zones critiques identifiées ci-dessus font l&apos;objet d&apos;un suivi renforcé par l&apos;ARPT.
                    Les opérateurs concernés sont tenus de soumettre un plan d&apos;amélioration dans les délais prescrits.
                    Ce rapport de benchmarking est publié conformément aux dispositions du DAO portant audit de la couverture
                    et de la qualité de service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MapPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
