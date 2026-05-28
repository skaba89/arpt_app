'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Trophy,
  Medal,
  Download,
  BarChart3,
  Shield,
  Building2,
  Wifi,
  XCircle,
} from 'lucide-react'

interface BenchmarkEntry {
  id: string
  operatorId: string | null
  faiId: string | null
  operator: { id: string; name: string; code: string } | null
  fai: { id: string; name: string; code: string } | null
  period: string
  category: string
  score: number
  rank: number
  totalRanked: number
  voiceScore: number | null
  smsScore: number | null
  dataScore: number | null
  coverageScore: number | null
  qoeScore: number | null
  conformityRate: number | null
}

const categoryTabs = [
  { value: 'mobile_voice', label: 'Voix Mobile', icon: Building2 },
  { value: 'mobile_sms', label: 'SMS Mobile', icon: Building2 },
  { value: 'mobile_data', label: 'Data Mobile', icon: Wifi },
  { value: 'fixed_internet', label: 'Internet Fixe', icon: Wifi },
  { value: 'overall', label: 'Global', icon: BarChart3 },
]

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>
}

export default function BenchmarkPublicPage() {
  const [data, setData] = useState<BenchmarkEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overall')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (period && period !== 'all') params.set('period', period)
      params.set('isPublic', 'true')
      const res = await fetch(`/api/public-benchmark?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setData(data.results || [])
    } catch {
      setError('Impossible de charger les données de benchmark')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const periods = [...new Set(data.map((d) => d.period))].sort().reverse()

  const filteredData = data
    .filter((d) => d.category === activeTab)
    .sort((a, b) => a.rank - b.rank)

  const getEntityName = (entry: BenchmarkEntry) => {
    if (entry.operator) return entry.operator.name
    if (entry.fai) return entry.fai.name
    return 'Inconnu'
  }

  const getEntityCode = (entry: BenchmarkEntry) => {
    if (entry.operator) return entry.operator.code
    if (entry.fai) return entry.fai.code
    return '—'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Benchmark Public</h1>
          <p className="text-muted-foreground">
            Classement des performances des opérateurs et FAI (DAO Section III.4)
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              {categoryTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1 text-xs sm:text-sm">
                  <tab.icon className="h-3.5 w-3.5 hidden sm:block" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categoryTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <XCircle className="h-8 w-8 mb-2" />
                    <p>{error}</p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BarChart3 className="h-8 w-8 mb-2" />
                    <p>Aucune donnée disponible pour cette catégorie</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center">Rang</TableHead>
                          <TableHead>Opérateur / FAI</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="hidden md:table-cell text-center">Voix</TableHead>
                          <TableHead className="hidden md:table-cell text-center">SMS</TableHead>
                          <TableHead className="hidden md:table-cell text-center">Data</TableHead>
                          <TableHead className="hidden lg:table-cell text-center">Couverture</TableHead>
                          <TableHead className="hidden lg:table-cell text-center">QoE</TableHead>
                          <TableHead className="text-center">Conformité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredData.map((entry) => (
                          <TableRow key={entry.id} className={entry.rank <= 3 ? 'bg-muted/30' : ''}>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <MedalIcon rank={entry.rank} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{getEntityName(entry)}</span>
                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{getEntityCode(entry)}</code>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-lg font-bold ${getScoreColor(entry.score)}`}>
                                  {entry.score.toFixed(1)}
                                </span>
                                <div className="w-20">
                                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${getBarColor(entry.score)}`}
                                      style={{ width: `${Math.min(entry.score, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                              {entry.voiceScore !== null ? (
                                <span className={getScoreColor(entry.voiceScore)}>{entry.voiceScore.toFixed(1)}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                              {entry.smsScore !== null ? (
                                <span className={getScoreColor(entry.smsScore)}>{entry.smsScore.toFixed(1)}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                              {entry.dataScore !== null ? (
                                <span className={getScoreColor(entry.dataScore)}>{entry.dataScore.toFixed(1)}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-center">
                              {entry.coverageScore !== null ? (
                                <span className={getScoreColor(entry.coverageScore)}>{entry.coverageScore.toFixed(1)}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-center">
                              {entry.qoeScore !== null ? (
                                <span className={getScoreColor(entry.qoeScore)}>{entry.qoeScore.toFixed(1)}</span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                              {entry.conformityRate !== null ? (
                                <Badge
                                  variant={entry.conformityRate >= 70 ? 'default' : 'destructive'}
                                  className={entry.conformityRate >= 70 ? 'bg-emerald-600' : ''}
                                >
                                  {entry.conformityRate.toFixed(1)}%
                                </Badge>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-4 border-t">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Données publiées par l&apos;ARPT — République de Guinée</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Autorité de Régulation des Postes et Télécommunications de Guinée
        </p>
      </div>
    </div>
  )
}
