'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, Phone, Wifi, Clock, TrendingUp, TrendingDown, Minus, Plus, Eye } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'
import { FileUpload } from '@/components/file-upload'

interface Operator {
  id: string
  name: string
  code: string
}

interface QosReport {
  id: string
  operatorId: string
  operator?: Operator
  period: string
  region?: string | null
  callSuccessRate: number | null
  callSetupTime: number | null
  dropRate: number | null
  handoverSuccessRate: number | null
  smsSuccessRate: number | null
  dataThroughput: number | null
  latency: number | null
  overallScore: number | null
  status: string
  createdAt: string
}

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
  const [reports, setReports] = useState<QosReport[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Detail dialog state
  const [detailReport, setDetailReport] = useState<QosReport | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Form state
  const [formOperatorId, setFormOperatorId] = useState('')
  const [formPeriod, setFormPeriod] = useState('')
  const [formCallSuccessRate, setFormCallSuccessRate] = useState('')
  const [formDropRate, setFormDropRate] = useState('')
  const [formDataThroughput, setFormDataThroughput] = useState('')
  const [formLatency, setFormLatency] = useState('')
  const [formOverallScore, setFormOverallScore] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [qosRes, opRes] = await Promise.all([
        apiClient.get<QosReport[]>('/api/qos', { params: { limit: 100 } }),
        apiClient.get<Operator[]>('/api/operators', { params: { limit: 100 } }),
      ])
      if (qosRes.success && qosRes.data) setReports(qosRes.data)
      if (opRes.success && opRes.data) setOperators(opRes.data)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateReport = async () => {
    try {
      setSubmitting(true)
      setFormError(null)

      const response = await apiClient.post<QosReport>('/api/qos', {
        operatorId: formOperatorId,
        period: formPeriod,
        callSuccessRate: formCallSuccessRate ? parseFloat(formCallSuccessRate) : undefined,
        dropRate: formDropRate ? parseFloat(formDropRate) : undefined,
        dataThroughput: formDataThroughput ? parseFloat(formDataThroughput) : undefined,
        latency: formLatency ? parseFloat(formLatency) : undefined,
        overallScore: formOverallScore ? parseFloat(formOverallScore) : undefined,
      })

      if (response.success) {
        setDialogOpen(false)
        resetForm()
        loadData()
      } else {
        setFormError(response.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Erreur lors de la création du rapport')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormOperatorId('')
    setFormPeriod('')
    setFormCallSuccessRate('')
    setFormDropRate('')
    setFormDataThroughput('')
    setFormLatency('')
    setFormOverallScore('')
    setFormError(null)
  }

  const openDetail = (report: QosReport) => {
    setDetailReport(report)
    setDetailOpen(true)
  }

  // Get the latest report per operator for the card view
  const latestReportsMap = new Map<string, QosReport>()
  for (const report of reports) {
    if (!latestReportsMap.has(report.operatorId)) {
      latestReportsMap.set(report.operatorId, report)
    }
  }
  const latestReports = Array.from(latestReportsMap.values())

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Qualité de Service (QoS)</h1>
          <p className="text-muted-foreground">
            Suivi des indicateurs de qualité de service des opérateurs télécoms
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau rapport QoS</DialogTitle>
              <DialogDescription>
                Enregistrer un nouveau rapport de qualité de service
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="grid gap-2">
                <Label>Opérateur</Label>
                <Select value={formOperatorId} onValueChange={setFormOperatorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qos-period">Période</Label>
                <Input id="qos-period" placeholder="Ex: Q1 2025" value={formPeriod} onChange={(e) => setFormPeriod(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qos-csr">Taux abouti (%)</Label>
                  <Input id="qos-csr" type="number" step="0.1" placeholder="94.2" value={formCallSuccessRate} onChange={(e) => setFormCallSuccessRate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qos-dr">Taux coupé (%)</Label>
                  <Input id="qos-dr" type="number" step="0.1" placeholder="2.1" value={formDropRate} onChange={(e) => setFormDropRate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qos-dt">Débit data (Mbps)</Label>
                  <Input id="qos-dt" type="number" step="0.1" placeholder="28.5" value={formDataThroughput} onChange={(e) => setFormDataThroughput(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="qos-lat">Latence (ms)</Label>
                  <Input id="qos-lat" type="number" step="1" placeholder="35" value={formLatency} onChange={(e) => setFormLatency(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="qos-score">Score global (%)</Label>
                <Input id="qos-score" type="number" step="0.1" placeholder="82" value={formOverallScore} onChange={(e) => setFormOverallScore(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button onClick={handleCreateReport} disabled={submitting || !formOperatorId || !formPeriod}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* QoS Metric Cards per Operator */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-1.5">
                    <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-10" /></div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        ) : latestReports.length > 0 ? (
          latestReports.map((report) => (
            <Card key={report.id} className="relative overflow-hidden cursor-pointer" onClick={() => openDetail(report)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{report.operator?.name || 'N/A'}</CardTitle>
                  <Badge variant={report.status === 'reviewed' ? 'default' : 'outline'}>
                    {report.status === 'reviewed' ? 'Vérifié' : 'Brouillon'}
                  </Badge>
                </div>
                <CardDescription>Période : {report.period}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Score */}
                <div className={`flex items-center justify-between rounded-lg p-3 ${report.overallScore ? getScoreBg(report.overallScore) : 'bg-muted'}`}>
                  <span className="text-sm font-medium">Score global</span>
                  <span className={`text-2xl font-bold ${report.overallScore ? getScoreColor(report.overallScore) : 'text-muted-foreground'}`}>
                    {report.overallScore !== null ? `${report.overallScore}%` : '—'}
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
                      <span className="font-medium">{report.callSuccessRate !== null ? `${report.callSuccessRate}%` : '—'}</span>
                    </div>
                    {report.callSuccessRate !== null && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${getProgressColor(report.callSuccessRate)}`}
                          style={{ width: `${report.callSuccessRate}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                        Taux d&apos;appel coupé
                      </span>
                      <span className="font-medium">{report.dropRate !== null ? `${report.dropRate}%` : '—'}</span>
                    </div>
                    {report.dropRate !== null && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${report.dropRate <= 3 ? 'bg-emerald-500' : report.dropRate <= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(report.dropRate * 10, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5 text-muted-foreground" />
                        Débit data (Mbps)
                      </span>
                      <span className="font-medium">{report.dataThroughput !== null ? report.dataThroughput : '—'}</span>
                    </div>
                    {report.dataThroughput !== null && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${getProgressColor(report.dataThroughput / 0.35)}`}
                          style={{ width: `${Math.min((report.dataThroughput / 40) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Latence (ms)
                      </span>
                      <span className="font-medium">{report.latency !== null ? `${report.latency} ms` : '—'}</span>
                    </div>
                    {report.latency !== null && (
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${report.latency <= 40 ? 'bg-emerald-500' : report.latency <= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min((report.latency / 100) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Aucun rapport QoS disponible</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full history table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des rapports QoS</CardTitle>
          <CardDescription>Tous les rapports de qualité de service par opérateur et période</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadData}>
                Réessayer
              </Button>
            </div>
          ) : (
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
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id} className="cursor-pointer" onClick={() => openDetail(report)}>
                      <TableCell className="font-medium">{report.operator?.name || 'N/A'}</TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell className="text-center">
                        {report.callSuccessRate !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            {report.callSuccessRate}%
                            <TrendIcon value={report.callSuccessRate} threshold={90} />
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {report.dropRate !== null ? (
                          <div className="flex items-center justify-center gap-1">
                            {report.dropRate}%
                            <TrendIcon value={3 - report.dropRate} threshold={0} />
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">{report.dataThroughput !== null ? report.dataThroughput : '—'}</TableCell>
                      <TableCell className="text-center">{report.latency !== null ? report.latency : '—'}</TableCell>
                      <TableCell className="text-center">
                        {report.overallScore !== null ? (
                          <Badge variant="outline" className={getScoreColor(report.overallScore)}>
                            {report.overallScore}%
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={report.status === 'reviewed' ? 'default' : 'outline'}>
                          {report.status === 'reviewed' ? 'Vérifié' : 'Brouillon'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openDetail(report) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Aucun rapport QoS trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog with documents */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Rapport QoS — {detailReport.operator?.name || 'N/A'}
                </DialogTitle>
                <DialogDescription>Période : {detailReport.period}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className={`flex items-center justify-between rounded-lg p-4 ${detailReport.overallScore ? getScoreBg(detailReport.overallScore) : 'bg-muted'}`}>
                    <span className="text-sm font-medium">Score global</span>
                    <span className={`text-3xl font-bold ${detailReport.overallScore ? getScoreColor(detailReport.overallScore) : 'text-muted-foreground'}`}>
                      {detailReport.overallScore !== null ? `${detailReport.overallScore}%` : '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Taux d&apos;appel abouti</p>
                      <p className="text-lg font-semibold">{detailReport.callSuccessRate !== null ? `${detailReport.callSuccessRate}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Taux d&apos;appel coupé</p>
                      <p className="text-lg font-semibold">{detailReport.dropRate !== null ? `${detailReport.dropRate}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Débit data</p>
                      <p className="text-lg font-semibold">{detailReport.dataThroughput !== null ? `${detailReport.dataThroughput} Mbps` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Latence</p>
                      <p className="text-lg font-semibold">{detailReport.latency !== null ? `${detailReport.latency} ms` : '—'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge variant={detailReport.status === 'reviewed' ? 'default' : 'outline'}>
                      {detailReport.status === 'reviewed' ? 'Vérifié' : 'Brouillon'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date de création</p>
                    <p className="text-sm font-medium">{new Date(detailReport.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </TabsContent>
                <TabsContent value="documents" className="mt-4">
                  <FileUpload
                    entityId={detailReport.id}
                    entityType="qos"
                    category="rapport"
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
