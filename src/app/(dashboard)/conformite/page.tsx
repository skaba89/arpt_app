'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Search, ShieldCheck, ShieldX, AlertTriangle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Info } from 'lucide-react'

interface Threshold {
  id: string
  name: string
  code: string
  category: string
  technology: string
  metric: string
  minValue?: number
  maxValue?: number
  unit?: string
  isRegulatory: boolean
  source?: string
  description?: string
  active: boolean
  _count?: { conformityChecks: number }
}

interface Operator {
  id: string
  name: string
  code: string
}

interface Fai {
  id: string
  name: string
  code: string
}

interface ConformityCheck {
  id: string
  operatorId?: string
  faiId?: string
  thresholdId: string
  measuredValue: number
  isConform: boolean
  period: string
  region?: string
  source?: string
  notes?: string
  checkedAt: string
  threshold: Threshold
  operator?: Operator
  fai?: Fai
  checkedBy?: { id: string; name: string; email: string }
}

const categoryLabels: Record<string, string> = {
  voix: 'Voix',
  sms: 'SMS',
  data: 'Data Mobile',
  internet_fixe: 'Internet Fixe',
  couverture: 'Couverture',
}

const categoryColors: Record<string, string> = {
  voix: 'bg-purple-100 text-purple-800',
  sms: 'bg-blue-100 text-blue-800',
  data: 'bg-cyan-100 text-cyan-800',
  internet_fixe: 'bg-amber-100 text-amber-800',
  couverture: 'bg-emerald-100 text-emerald-800',
}

const sourceLabels: Record<string, string> = {
  drive_test: 'Drive Test',
  fixed_test: 'Test Fixe',
  operator_report: 'Rapport Opérateur',
}

export default function ConformitePage() {
  const [checks, setChecks] = useState<ConformityCheck[]>([])
  const [thresholds, setThresholds] = useState<Threshold[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [fais, setFais] = useState<Fai[]>([])
  const [summary, setSummary] = useState({ conform: 0, nonConform: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [thresholdsLoading, setThresholdsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('')
  const [technologyFilter, setTechnologyFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [operatorFilter, setOperatorFilter] = useState('')
  const [faiFilter, setFaiFilter] = useState('')
  const [conformFilter, setConformFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formTarget, setFormTarget] = useState<'operator' | 'fai'>('operator')
  const [formOperatorId, setFormOperatorId] = useState('')
  const [formFaiId, setFormFaiId] = useState('')
  const [formThresholdId, setFormThresholdId] = useState('')
  const [formValue, setFormValue] = useState('')
  const [formPeriod, setFormPeriod] = useState('')
  const [formRegion, setFormRegion] = useState('')
  const [formSource, setFormSource] = useState('drive_test')
  const [formNotes, setFormNotes] = useState('')

  const fetchChecks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (categoryFilter) params.set('category', categoryFilter)
      if (technologyFilter) params.set('technology', technologyFilter)
      if (periodFilter) params.set('period', periodFilter)
      if (operatorFilter) params.set('operatorId', operatorFilter)
      if (faiFilter) params.set('faiId', faiFilter)
      if (conformFilter) params.set('isConform', conformFilter)

      const res = await fetch(`/api/conformity?${params}`)
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setChecks(data.checks || [])
      setSummary(data.summary || { conform: 0, nonConform: 0, total: 0 })
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, categoryFilter, technologyFilter, periodFilter, operatorFilter, faiFilter, conformFilter])

  const fetchThresholds = useCallback(async () => {
    try {
      setThresholdsLoading(true)
      const params = new URLSearchParams()
      params.set('limit', '50')
      const res = await fetch(`/api/thresholds?${params}`)
      if (!res.ok) throw new Error('Erreur')
      const data = await res.json()
      setThresholds(data.thresholds || [])
    } catch {
      // Silently fail thresholds
    } finally {
      setThresholdsLoading(false)
    }
  }, [])

  const fetchOperatorsAndFais = useCallback(async () => {
    try {
      const [opRes, faiRes] = await Promise.all([
        fetch('/api/operators?limit=50'),
        fetch('/api/fais?limit=50'),
      ])
      if (opRes.ok) {
        const opData = await opRes.json()
        setOperators(opData.operators || [])
      }
      if (faiRes.ok) {
        const faiData = await faiRes.json()
        setFais(faiData.fais || [])
      }
    } catch {
      // Silently fail
    }
  }, [])

  useEffect(() => {
    fetchChecks()
  }, [fetchChecks])

  useEffect(() => {
    fetchThresholds()
    fetchOperatorsAndFais()
  }, [fetchThresholds, fetchOperatorsAndFais])

  const conformRate = summary.total > 0 ? Math.round((summary.conform / summary.total) * 100) : 0

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      const selectedThreshold = thresholds.find(t => t.id === formThresholdId)
      if (!selectedThreshold) {
        alert('Veuillez sélectionner un seuil')
        return
      }

      const measuredValue = parseFloat(formValue)
      let isConform = false
      if (selectedThreshold.minValue !== null && selectedThreshold.minValue !== undefined) {
        isConform = measuredValue >= selectedThreshold.minValue
      } else if (selectedThreshold.maxValue !== null && selectedThreshold.maxValue !== undefined) {
        isConform = measuredValue <= selectedThreshold.maxValue
      }

      const body: any = {
        thresholdId: formThresholdId,
        measuredValue,
        isConform,
        period: formPeriod,
        region: formRegion || undefined,
        source: formSource,
        notes: formNotes || undefined,
      }

      if (formTarget === 'operator') {
        body.operatorId = formOperatorId
      } else {
        body.faiId = formFaiId
      }

      const res = await fetch('/api/conformity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }
      setDialogOpen(false)
      resetForm()
      fetchChecks()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormTarget('operator')
    setFormOperatorId('')
    setFormFaiId('')
    setFormThresholdId('')
    setFormValue('')
    setFormPeriod('')
    setFormRegion('')
    setFormSource('drive_test')
    setFormNotes('')
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conformité Réglementaire</h1>
          <p className="text-muted-foreground">
            Vérification de la conformité aux seuils réglementaires de QoS
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau contrôle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau contrôle de conformité</DialogTitle>
              <DialogDescription>Enregistrer un nouveau contrôle de conformité QoS</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Cible</Label>
                <Select value={formTarget} onValueChange={(v: 'operator' | 'fai') => setFormTarget(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Opérateur Mobile</SelectItem>
                    <SelectItem value="fai">FAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formTarget === 'operator' ? (
                <div className="grid gap-2">
                  <Label>Opérateur</Label>
                  <Select value={formOperatorId} onValueChange={setFormOperatorId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un opérateur" /></SelectTrigger>
                    <SelectContent>
                      {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name} ({op.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>FAI</Label>
                  <Select value={formFaiId} onValueChange={setFormFaiId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un FAI" /></SelectTrigger>
                    <SelectContent>
                      {fais.map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.code})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Seuil QoS</Label>
                <Select value={formThresholdId} onValueChange={setFormThresholdId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un seuil" /></SelectTrigger>
                  <SelectContent>
                    {thresholds.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.technology} ({categoryLabels[t.category] || t.category})
                        {t.minValue !== null && t.minValue !== undefined ? ` ≥ ${t.minValue}` : ''}
                        {t.maxValue !== null && t.maxValue !== undefined ? ` ≤ ${t.maxValue}` : ''}
                        {t.unit || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cc-value">Valeur mesurée</Label>
                  <Input id="cc-value" type="number" step="0.1" placeholder="95.5" value={formValue} onChange={e => setFormValue(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cc-period">Période</Label>
                  <Input id="cc-period" placeholder="2025-Q1" value={formPeriod} onChange={e => setFormPeriod(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cc-region">Région</Label>
                  <Input id="cc-region" placeholder="Conakry" value={formRegion} onChange={e => setFormRegion(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Source</Label>
                  <Select value={formSource} onValueChange={setFormSource}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drive_test">Drive Test</SelectItem>
                      <SelectItem value="fixed_test">Test Fixe</SelectItem>
                      <SelectItem value="operator_report">Rapport Opérateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cc-notes">Notes</Label>
                <Textarea id="cc-notes" placeholder="Observations..." value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={submitting || !formThresholdId || !formValue || !formPeriod}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taux de conformité</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{conformRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.conform} / {summary.total} contrôles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conformes</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{summary.conform}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Non conformes</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.nonConform}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Seuils réglementaires</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thresholds.filter(t => t.isRegulatory).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Checks and Thresholds */}
      <Tabs defaultValue="checks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="checks">Contrôles de conformité</TabsTrigger>
          <TabsTrigger value="thresholds">Seuils QoS</TabsTrigger>
        </TabsList>

        <TabsContent value="checks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="voix">Voix</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="internet_fixe">Internet Fixe</SelectItem>
                    <SelectItem value="couverture">Couverture</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={technologyFilter} onValueChange={(v) => { setTechnologyFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Technologie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="2G">2G</SelectItem>
                    <SelectItem value="3G">3G</SelectItem>
                    <SelectItem value="4G">4G</SelectItem>
                    <SelectItem value="fixe">Fixe</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={operatorFilter} onValueChange={(v) => { setOperatorFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Opérateur" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {operators.map(op => <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={faiFilter} onValueChange={(v) => { setFaiFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="FAI" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {fais.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={conformFilter} onValueChange={(v) => { setConformFilter(v === 'all' ? '' : v); setPage(1) }}>
                  <SelectTrigger><SelectValue placeholder="Conformité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="true">Conforme</SelectItem>
                    <SelectItem value="false">Non conforme</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Période (2025-Q1)"
                  value={periodFilter}
                  onChange={(e) => { setPeriodFilter(e.target.value); setPage(1) }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Checks table */}
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de conformité</CardTitle>
              <CardDescription>Résultats des vérifications par rapport aux seuils réglementaires</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : error ? (
                <div className="py-8 text-center text-destructive">{error}</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entité</TableHead>
                          <TableHead>Seuil</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead>Techno</TableHead>
                          <TableHead className="text-center">Seuil requis</TableHead>
                          <TableHead className="text-center">Mesure</TableHead>
                          <TableHead>Période</TableHead>
                          <TableHead>Région</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checks.map((check) => {
                          const threshold = check.threshold
                          const entityName = check.operator?.name || check.fai?.name || '—'
                          const thresholdStr = threshold.minValue !== null && threshold.minValue !== undefined
                            ? `≥ ${threshold.minValue}`
                            : threshold.maxValue !== null && threshold.maxValue !== undefined
                              ? `≤ ${threshold.maxValue}`
                              : '—'
                          const unitStr = threshold.unit || ''

                          return (
                            <TableRow key={check.id}>
                              <TableCell className="font-medium">{entityName}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{threshold.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-xs ${categoryColors[threshold.category] || ''}`}>
                                  {categoryLabels[threshold.category] || threshold.category}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">{threshold.technology}</Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium">
                                {thresholdStr} {unitStr}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`font-bold ${check.isConform ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {check.measuredValue} {unitStr}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm">{check.period}</TableCell>
                              <TableCell className="text-sm">{check.region || '—'}</TableCell>
                              <TableCell>
                                {check.isConform ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Conforme
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" /> Non conforme
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {checks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                              Aucun contrôle de conformité trouvé
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seuils réglementaires QoS</CardTitle>
              <CardDescription>Seuils de qualité de service définis par l&apos;ARPT conformément aux normes ITU/ETSI/3GPP</CardDescription>
            </CardHeader>
            <CardContent>
              {thresholdsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Techno</TableHead>
                        <TableHead>Seuil minimum</TableHead>
                        <TableHead>Seuil maximum</TableHead>
                        <TableHead>Unité</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Réglementaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {thresholds.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1.5">
                              {t.name}
                              {t.description && (
                                <span title={t.description}>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{t.code}</code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs ${categoryColors[t.category] || ''}`}>
                              {categoryLabels[t.category] || t.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{t.technology}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{t.minValue !== null && t.minValue !== undefined ? `≥ ${t.minValue}` : '—'}</TableCell>
                          <TableCell className="text-center">{t.maxValue !== null && t.maxValue !== undefined ? `≤ ${t.maxValue}` : '—'}</TableCell>
                          <TableCell className="text-center">{t.unit || '—'}</TableCell>
                          <TableCell className="text-sm">{t.source || '—'}</TableCell>
                          <TableCell>
                            {t.isRegulatory ? (
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Oui</Badge>
                            ) : (
                              <Badge variant="outline">Non</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {thresholds.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                            Aucun seuil QoS trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
