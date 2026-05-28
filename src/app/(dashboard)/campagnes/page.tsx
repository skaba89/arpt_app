'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
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
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Radio,
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  FileText,
  BarChart3,
  Package,
  Building2,
  CircleDot,
  ArrowRight,
  Lock,
  Eye,
  AlertCircle,
  Upload,
} from 'lucide-react'

interface Campaign {
  id: string
  reference: string
  name: string
  description: string | null
  type: string
  status: string
  phase: string
  startDate: string | null
  endDate: string | null
  regions: string | null
  localities: string | null
  technologies: string | null
  services: string | null
  teamSize: number | null
  equipment: string | null
  cabinetName: string | null
  totalTests: number
  conformRate: number | null
  createdAt: string
  _count: { measurements: number }
  createdBy: { id: string; name: string | null; email: string } | null
  teamLead: { id: string; name: string | null; email: string } | null
}

interface Measurement {
  id: string
  operatorId: string | null
  region: string | null
  locality: string | null
  testType: string
  technology: string
  callAttempted: number | null
  callSuccess: number | null
  callDropped: number | null
  callSetupTime: number | null
  smsSent: number | null
  smsSuccess: number | null
  smsDelay: number | null
  downloadSpeed: number | null
  uploadSpeed: number | null
  latency: number | null
  packetLoss: number | null
  webPageLoadTime: number | null
  videoStreamingScore: number | null
  downloadSuccessRate: number | null
  signalStrength: number | null
  coverageLevel: string | null
  isConform: boolean | null
  measuredAt: string
  operator: { id: string; name: string; code: string } | null
}

interface Deliverable {
  id: string
  type: string
  title: string
  description: string | null
  status: string
  confidentiality: string
  dueDate: string | null
  submittedDate: string | null
  filename: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  planned: { label: 'Planifiée', variant: 'outline', icon: Clock },
  preparation: { label: 'Préparation', variant: 'outline', icon: Clock },
  in_progress: { label: 'En cours', variant: 'default', icon: PlayCircle },
  field_work: { label: 'Travail terrain', variant: 'default', icon: PlayCircle },
  analysis: { label: 'Analyse', variant: 'default', icon: BarChart3 },
  reporting: { label: 'Rapportage', variant: 'default', icon: FileText },
  completed: { label: 'Terminée', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircle },
}

const phaseConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  planning: { label: 'Planification', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  preparation: { label: 'Préparation', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  field_work: { label: 'Travail terrain', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  analysis: { label: 'Analyse', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  reporting: { label: 'Rapportage', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  closed: { label: 'Clôturée', color: 'text-gray-800', bgColor: 'bg-gray-200' },
}

const phaseOrder = ['planning', 'preparation', 'field_work', 'analysis', 'reporting', 'closed']

const deliverableTypeConfig: Record<string, string> = {
  methodological_note: 'Note méthodologique',
  sampling_plan: "Plan d'échantillonnage",
  raw_data: 'Données brutes',
  coverage_map: 'Cartographie',
  technical_report: 'Rapport technique',
  benchmark_report: 'Rapport benchmark',
  ppt_presentation: 'Présentation PPT',
  digital_support: 'Support numérique',
  results_presentation: 'Présentation résultats',
}

const deliverableStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'En attente', variant: 'outline', icon: Clock },
  in_progress: { label: 'En cours', variant: 'default', icon: PlayCircle },
  submitted: { label: 'Soumis', variant: 'secondary', icon: Upload },
  reviewed: { label: 'Révisé', variant: 'secondary', icon: Eye },
  approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
}

const confidentialityConfig: Record<string, { label: string; className: string }> = {
  confidential: { label: 'Confidentiel', className: 'bg-red-100 text-red-700 border-red-200' },
  restricted: { label: 'Restreint', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  public: { label: 'Public', className: 'bg-green-100 text-green-700 border-green-200' },
}

const typeConfig: Record<string, string> = {
  drive_test: 'Drive Test',
  walk_test: 'Walk Test',
  fixed_test: 'Test Fixe',
  combined: 'Combinée',
}

const regionNames: Record<string, string> = {
  CK: 'Conakry',
  KD: 'Kindia',
  KN: 'Kankan',
  BK: 'Boké',
  MM: 'Mamou',
}

export default function CampagnesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [measurementsLoading, setMeasurementsLoading] = useState(false)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [deliverablesLoading, setDeliverablesLoading] = useState(false)

  // Form state
  const [formRef, setFormRef] = useState('')
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<string>('drive_test')
  const [formDesc, setFormDesc] = useState('')
  const [formRegions, setFormRegions] = useState('')
  const [formTech, setFormTech] = useState('2G,3G,4G')
  const [formServices, setFormServices] = useState('voix,sms,data')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '50')
      const res = await fetch(`/api/campaigns?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch {
      setError('Impossible de charger les campagnes')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const fetchMeasurements = useCallback(async (campaignId: string) => {
    try {
      setMeasurementsLoading(true)
      const res = await fetch(`/api/measurements?campaignId=${campaignId}&limit=100`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setMeasurements(data.measurements || [])
    } catch {
      setMeasurements([])
    } finally {
      setMeasurementsLoading(false)
    }
  }, [])

  const fetchDeliverables = useCallback(async (campaignId: string) => {
    try {
      setDeliverablesLoading(true)
      const res = await fetch(`/api/deliverables?campaignId=${campaignId}&limit=50`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setDeliverables(data.deliverables || [])
    } catch {
      setDeliverables([])
    } finally {
      setDeliverablesLoading(false)
    }
  }, [])

  const openDetail = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setDetailDialogOpen(true)
    fetchMeasurements(campaign.id)
    fetchDeliverables(campaign.id)
  }

  const handleCreate = async () => {
    if (!formRef || !formName) return
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formRef,
          name: formName,
          description: formDesc || undefined,
          type: formType,
          regions: formRegions || undefined,
          technologies: formTech || undefined,
          services: formServices || undefined,
          startDate: formStart || undefined,
          endDate: formEnd || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setCreateDialogOpen(false)
      resetForm()
      fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormRef('')
    setFormName('')
    setFormType('drive_test')
    setFormDesc('')
    setFormRegions('')
    setFormTech('2G,3G,4G')
    setFormServices('voix,sms,data')
    setFormStart('')
    setFormEnd('')
  }

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase())
  )

  // Summary stats
  const totalCampaigns = campaigns.length
  const inProgress = campaigns.filter((c) => c.status === 'in_progress').length
  const completed = campaigns.filter((c) => c.status === 'completed').length

  // Measurements summary for detail dialog
  const getMeasurementsSummary = () => {
    if (measurements.length === 0) return null
    const voiceMs = measurements.filter((m) => m.callAttempted && m.callAttempted > 0)
    const dataMs = measurements.filter((m) => m.downloadSpeed !== null)
    const conformCount = measurements.filter((m) => m.isConform === true).length

    return {
      total: measurements.length,
      conformRate: measurements.length > 0 ? Math.round((conformCount / measurements.length) * 1000) / 10 : 0,
      voiceSuccessRate: voiceMs.length > 0
        ? Math.round((voiceMs.reduce((s, m) => s + (m.callSuccess || 0), 0) / voiceMs.reduce((s, m) => s + (m.callAttempted || 0), 0)) * 1000) / 10
        : null,
      avgDownload: dataMs.length > 0
        ? Math.round((dataMs.reduce((s, m) => s + (m.downloadSpeed || 0), 0) / dataMs.length) * 10) / 10
        : null,
      avgLatency: dataMs.length > 0
        ? Math.round((dataMs.reduce((s, m) => s + (m.latency || 0), 0) / dataMs.length) * 10) / 10
        : null,
    }
  }

  // Group measurements by operator for detail view
  const getOperatorSummary = () => {
    const map = new Map<string, { name: string; code: string; ms: Measurement[] }>()
    for (const m of measurements) {
      const key = m.operatorId || 'unknown'
      if (!map.has(key)) {
        map.set(key, { name: m.operator?.name || 'Inconnu', code: m.operator?.code || 'UNK', ms: [] })
      }
      map.get(key)!.ms.push(m)
    }
    return Array.from(map.values()).map((op) => {
      const voiceMs = op.ms.filter((m) => m.callAttempted && m.callAttempted > 0)
      const dataMs = op.ms.filter((m) => m.downloadSpeed !== null)
      const conformCount = op.ms.filter((m) => m.isConform === true).length
      return {
        name: op.name,
        code: op.code,
        total: op.ms.length,
        conformRate: op.ms.length > 0 ? Math.round((conformCount / op.ms.length) * 1000) / 10 : 0,
        voiceSuccessRate: voiceMs.length > 0
          ? Math.round((voiceMs.reduce((s, m) => s + (m.callSuccess || 0), 0) / voiceMs.reduce((s, m) => s + (m.callAttempted || 0), 0)) * 1000) / 10
          : null,
        avgDownload: dataMs.length > 0
          ? Math.round((dataMs.reduce((s, m) => s + (m.downloadSpeed || 0), 0) / dataMs.length) * 10) / 10
          : null,
        avgLatency: dataMs.length > 0
          ? Math.round((dataMs.reduce((s, m) => s + (m.latency || 0), 0) / dataMs.length) * 10) / 10
          : null,
      }
    })
  }

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  const expandRegions = (codes: string | null) => {
    if (!codes) return '—'
    return codes.split(',').map((c) => regionNames[c] || c).join(', ')
  }

  // Phase progress component
  const PhaseProgressBar = ({ currentPhase }: { currentPhase: string }) => {
    const currentIndex = phaseOrder.indexOf(currentPhase)
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Cycle de vie DAO</span>
          <span className="text-xs text-muted-foreground">
            Phase {currentIndex + 1} / {phaseOrder.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {phaseOrder.map((phase, idx) => {
            const config = phaseConfig[phase]
            const isCompleted = idx < currentIndex
            const isCurrent = idx === currentIndex
            const isFuture = idx > currentIndex
            return (
              <React.Fragment key={phase}>
                <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <div
                    className={`w-full h-2 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isCurrent
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-gray-200'
                    }`}
                  />
                  <span
                    className={`text-[10px] leading-tight text-center truncate w-full ${
                      isCompleted
                        ? 'text-emerald-600 font-medium'
                        : isCurrent
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-400'
                    }`}
                  >
                    {config.label}
                  </span>
                </div>
                {idx < phaseOrder.length - 1 && (
                  <ArrowRight
                    className={`h-3 w-3 flex-shrink-0 ${
                      idx < currentIndex ? 'text-emerald-500' : 'text-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campagnes de Mesures</h1>
          <p className="text-muted-foreground">
            Gestion des campagnes drive test, walk test et tests fixes
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total campagnes</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalCampaigns}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <PlayCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-emerald-600">{inProgress}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminées</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{completed}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des campagnes</CardTitle>
          <CardDescription>Toutes les campagnes de mesure enregistrées</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="planned">Planifiée</SelectItem>
                <SelectItem value="preparation">Préparation</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="field_work">Travail terrain</SelectItem>
                <SelectItem value="analysis">Analyse</SelectItem>
                <SelectItem value="reporting">Rapportage</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <XCircle className="h-8 w-8 mb-2" />
              <p>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Radio className="h-8 w-8 mb-2" />
              <p>Aucune campagne trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead className="hidden md:table-cell">Période</TableHead>
                    <TableHead className="hidden lg:table-cell">Régions</TableHead>
                    <TableHead className="text-center">Mesures</TableHead>
                    <TableHead className="text-center">Conformité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const sc = statusConfig[c.status] || statusConfig.planned
                    const StatusIcon = sc.icon
                    const pc = phaseConfig[c.phase] || phaseConfig.planning
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openDetail(c)}
                      >
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.reference}</code>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                        <TableCell>{typeConfig[c.type] || c.type}</TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${pc.bgColor} ${pc.color}`}>
                            <CircleDot className="h-3 w-3" />
                            {pc.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {formatDate(c.startDate)} — {formatDate(c.endDate)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{expandRegions(c.regions)}</TableCell>
                        <TableCell className="text-center">{c._count.measurements}</TableCell>
                        <TableCell className="text-center">
                          {c.conformRate !== null ? (
                            <span className={c.conformRate >= 70 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {c.conformRate}%
                            </span>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
            <DialogDescription>
              Créer une nouvelle campagne de mesure de qualité de service
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="camp-ref">Référence</Label>
              <Input id="camp-ref" placeholder="Ex: CAMP-2025-004" value={formRef} onChange={(e) => setFormRef(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-name">Nom de la campagne</Label>
              <Input id="camp-name" placeholder="Ex: Drive Test Conakry Q3 2025" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-type">Type de campagne</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drive_test">Drive Test</SelectItem>
                  <SelectItem value="walk_test">Walk Test</SelectItem>
                  <SelectItem value="fixed_test">Test Fixe</SelectItem>
                  <SelectItem value="combined">Combinée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-desc">Description</Label>
              <Input id="camp-desc" placeholder="Description de la campagne..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="camp-start">Date de début</Label>
                <Input id="camp-start" type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="camp-end">Date de fin</Label>
                <Input id="camp-end" type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-regions">Régions (codes séparés par virgules)</Label>
              <Input id="camp-regions" placeholder="Ex: CK,KN,BK" value={formRegions} onChange={(e) => setFormRegions(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-tech">Technologies</Label>
              <Input id="camp-tech" value={formTech} onChange={(e) => setFormTech(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="camp-services">Services</Label>
              <Input id="camp-services" value={formServices} onChange={(e) => setFormServices(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formRef || !formName}>
              Créer la campagne
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCampaign && (
                <>
                  <code className="rounded bg-muted px-2 py-0.5 text-sm">{selectedCampaign.reference}</code>
                  {selectedCampaign.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails de la campagne de mesure
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details" className="gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Détails
                </TabsTrigger>
                <TabsTrigger value="mesures" className="gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Mesures
                </TabsTrigger>
                <TabsTrigger value="conformite" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Conformité
                </TabsTrigger>
                <TabsTrigger value="livrables" className="gap-1">
                  <Package className="h-3.5 w-3.5" />
                  Livrables
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 max-h-[55vh] overflow-y-auto">
                <TabsContent value="details" className="space-y-4">
                  {/* Phase Progress Bar */}
                  <PhaseProgressBar currentPhase={selectedCampaign.phase} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Période :</strong>{' '}
                          {formatDate(selectedCampaign.startDate)} — {formatDate(selectedCampaign.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Régions :</strong> {expandRegions(selectedCampaign.regions)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Technologies :</strong> {selectedCampaign.technologies || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Équipe :</strong> {selectedCampaign.teamSize || '—'} personnes
                        </span>
                      </div>
                      {selectedCampaign.cabinetName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>Cabinet :</strong> {selectedCampaign.cabinetName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium">Type :</span>{' '}
                        <Badge variant="outline">{typeConfig[selectedCampaign.type]}</Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Statut :</span>{' '}
                        <Badge variant={statusConfig[selectedCampaign.status]?.variant || 'outline'}>
                          {statusConfig[selectedCampaign.status]?.label || selectedCampaign.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Phase :</span>{' '}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${phaseConfig[selectedCampaign.phase]?.bgColor || 'bg-gray-100'} ${phaseConfig[selectedCampaign.phase]?.color || 'text-gray-600'}`}>
                          <CircleDot className="h-3 w-3" />
                          {phaseConfig[selectedCampaign.phase]?.label || selectedCampaign.phase}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Services :</span>{' '}
                        <span className="text-sm">{selectedCampaign.services || '—'}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Équipement :</span>{' '}
                        <span className="text-sm">{selectedCampaign.equipment || '—'}</span>
                      </div>
                    </div>
                  </div>
                  {selectedCampaign.description && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-sm">{selectedCampaign.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Total tests</p>
                      <p className="text-lg font-bold">{selectedCampaign.totalTests}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Mesures</p>
                      <p className="text-lg font-bold">{selectedCampaign._count.measurements}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Localités</p>
                      <p className="text-lg font-bold">{selectedCampaign.localities || '—'}</p>
                    </Card>
                    <Card className="p-3">
                      <p className="text-xs text-muted-foreground">Conformité</p>
                      <p className={`text-lg font-bold ${selectedCampaign.conformRate && selectedCampaign.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedCampaign.conformRate !== null ? `${selectedCampaign.conformRate}%` : '—'}
                      </p>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="mesures" className="space-y-4">
                  {measurementsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : measurements.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <BarChart3 className="h-8 w-8 mb-2" />
                      <p>Aucune mesure enregistrée</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Opérateur</TableHead>
                            <TableHead>Région</TableHead>
                            <TableHead>Tech.</TableHead>
                            <TableHead className="text-center">Appels aboutis</TableHead>
                            <TableHead className="text-center">SMS aboutis</TableHead>
                            <TableHead className="text-center">Débit (Mbps)</TableHead>
                            <TableHead className="text-center">Latence (ms)</TableHead>
                            <TableHead className="text-center">Conforme</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {measurements.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-medium">{m.operator?.name || '—'}</TableCell>
                              <TableCell>{m.region || '—'}</TableCell>
                              <TableCell><Badge variant="outline">{m.technology}</Badge></TableCell>
                              <TableCell className="text-center">
                                {m.callAttempted && m.callAttempted > 0
                                  ? `${Math.round(((m.callSuccess || 0) / m.callAttempted) * 1000) / 10}%`
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {m.smsSent && m.smsSent > 0
                                  ? `${Math.round(((m.smsSuccess || 0) / m.smsSent) * 1000) / 10}%`
                                  : '—'}
                              </TableCell>
                              <TableCell className="text-center">{m.downloadSpeed !== null ? m.downloadSpeed : '—'}</TableCell>
                              <TableCell className="text-center">{m.latency !== null ? m.latency : '—'}</TableCell>
                              <TableCell className="text-center">
                                {m.isConform === true ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                                ) : m.isConform === false ? (
                                  <XCircle className="h-4 w-4 text-red-600 mx-auto" />
                                ) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="conformite" className="space-y-4">
                  {(() => {
                    const summary = getMeasurementsSummary()
                    const opSummary = getOperatorSummary()
                    if (!summary) return (
                      <div className="flex flex-col items-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mb-2" />
                        <p>Aucune donnée de conformité disponible</p>
                      </div>
                    )
                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Total mesures</p>
                            <p className="text-lg font-bold">{summary.total}</p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Taux conformité</p>
                            <p className={`text-lg font-bold ${summary.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {summary.conformRate}%
                            </p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Appels aboutis</p>
                            <p className="text-lg font-bold">{summary.voiceSuccessRate !== null ? `${summary.voiceSuccessRate}%` : '—'}</p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Débit moyen</p>
                            <p className="text-lg font-bold">{summary.avgDownload !== null ? `${summary.avgDownload} Mbps` : '—'}</p>
                          </Card>
                        </div>
                        <h3 className="text-sm font-semibold mt-4">Conformité par opérateur</h3>
                        <div className="space-y-3">
                          {opSummary.map((op) => (
                            <Card key={op.code} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{op.name}</span>
                                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{op.code}</code>
                                </div>
                                <span className={`text-sm font-bold ${op.conformRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {op.conformRate}% conforme
                                </span>
                              </div>
                              <Progress value={op.conformRate} className="h-2" />
                              <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                                <span>Appels : {op.voiceSuccessRate !== null ? `${op.voiceSuccessRate}%` : '—'}</span>
                                <span>Débit : {op.avgDownload !== null ? `${op.avgDownload} Mbps` : '—'}</span>
                                <span>Latence : {op.avgLatency !== null ? `${op.avgLatency} ms` : '—'}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </TabsContent>

                <TabsContent value="livrables" className="space-y-4">
                  {deliverablesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : deliverables.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mb-2" />
                      <p>Aucun livrable enregistré pour cette campagne</p>
                      <p className="text-xs mt-1">Les livrables DAO N°002/ARPT/DCT/2025 apparaîtront ici</p>
                    </div>
                  ) : (
                    <>
                      {/* Deliverables summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Total livrables</p>
                          <p className="text-lg font-bold">{deliverables.length}</p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">Approuvés</p>
                          <p className="text-lg font-bold text-emerald-600">
                            {deliverables.filter(d => d.status === 'approved').length}
                          </p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">En attente</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {deliverables.filter(d => d.status === 'pending').length}
                          </p>
                        </Card>
                        <Card className="p-3">
                          <p className="text-xs text-muted-foreground">En cours</p>
                          <p className="text-lg font-bold text-blue-600">
                            {deliverables.filter(d => d.status === 'in_progress' || d.status === 'submitted').length}
                          </p>
                        </Card>
                      </div>

                      {/* Deliverables checklist */}
                      <div className="space-y-2">
                        {deliverables.map((d) => {
                          const dsc = deliverableStatusConfig[d.status] || deliverableStatusConfig.pending
                          const DIcon = dsc.icon
                          const cc = confidentialityConfig[d.confidentiality] || confidentialityConfig.confidential
                          return (
                            <div
                              key={d.id}
                              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                            >
                              <Checkbox
                                checked={d.status === 'approved' || d.status === 'submitted' || d.status === 'reviewed'}
                                className="pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{d.title}</span>
                                  <Badge variant="outline" className="text-[10px]">
                                    {deliverableTypeConfig[d.type] || d.type}
                                  </Badge>
                                  <Badge variant={dsc.variant} className="gap-1 text-[10px]">
                                    <DIcon className="h-3 w-3" />
                                    {dsc.label}
                                  </Badge>
                                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${cc.className}`}>
                                    <Lock className="h-2.5 w-2.5" />
                                    {cc.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {d.dueDate && (
                                    <span>Échéance : {formatDate(d.dueDate)}</span>
                                  )}
                                  {d.submittedDate && (
                                    <span>Soumis : {formatDate(d.submittedDate)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
