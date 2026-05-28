'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  PlayCircle,
  Eye,
  AlertTriangle,
  Shield,
  Lock,
  Globe,
  ChevronRight,
} from 'lucide-react'

interface Deliverable {
  id: string
  campaignId: string
  campaign: { id: string; reference: string; name: string }
  type: string
  title: string
  description: string | null
  status: string
  confidentiality: string
  filename: string | null
  fileUrl: string | null
  dueDate: string | null
  submittedDate: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
  submitted: { label: 'Soumis', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  reviewed: { label: 'Révisé', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

const confidentialityConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  confidential: { label: 'Confidentiel', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: Lock },
  restricted: { label: 'Restreint', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Shield },
  public: { label: 'Public', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: Globe },
}

const typeLabels: Record<string, string> = {
  methodological_note: 'Note méthodologique',
  sampling_plan: 'Plan d\'échantillonnage',
  raw_data: 'Données brutes',
  coverage_map: 'Carte de couverture',
  technical_report: 'Rapport technique',
  benchmark_report: 'Rapport de benchmark',
  ppt_presentation: 'Présentation PPT',
  digital_support: 'Support numérique',
  results_presentation: 'Présentation résultats',
}

export default function LivrablesPage() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [campaignFilter, setCampaignFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [confFilter, setConfFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [timelineDialogOpen, setTimelineDialogOpen] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all')

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formCampaignId, setFormCampaignId] = useState('')
  const [formType, setFormType] = useState<string>('technical_report')
  const [formConf, setFormConf] = useState<string>('confidential')
  const [formDesc, setFormDesc] = useState('')
  const [formDueDate, setFormDueDate] = useState('')

  const [campaigns, setCampaigns] = useState<{ id: string; reference: string; name: string }[]>([])

  const fetchDeliverables = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (campaignFilter && campaignFilter !== 'all') params.set('campaignId', campaignFilter)
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (confFilter && confFilter !== 'all') params.set('confidentiality', confFilter)
      params.set('limit', '100')
      const res = await fetch(`/api/deliverables?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setDeliverables(data.deliverables || [])
    } catch {
      setError('Impossible de charger les livrables')
    } finally {
      setLoading(false)
    }
  }, [campaignFilter, typeFilter, statusFilter, confFilter])

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns?limit=50')
      if (!res.ok) return
      const data = await res.json()
      setCampaigns((data.campaigns || []).map((c: { id: string; reference: string; name: string }) => ({
        id: c.id,
        reference: c.reference,
        name: c.name,
      })))
    } catch {
      // silently ignore
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    fetchDeliverables()
  }, [fetchDeliverables])

  const handleCreate = async () => {
    if (!formTitle || !formCampaignId) return
    try {
      const res = await fetch('/api/deliverables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          campaignId: formCampaignId,
          type: formType,
          confidentiality: formConf,
          description: formDesc || undefined,
          dueDate: formDueDate || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setCreateDialogOpen(false)
      resetForm()
      fetchDeliverables()
    } catch (err) {
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormCampaignId('')
    setFormType('technical_report')
    setFormConf('confidential')
    setFormDesc('')
    setFormDueDate('')
  }

  const filtered = deliverables.filter(
    (d) => d.title.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalLivrables = deliverables.length
  const enAttente = deliverables.filter((d) => d.status === 'pending').length
  const soumis = deliverables.filter((d) => d.status === 'submitted').length
  const approuves = deliverables.filter((d) => d.status === 'approved').length
  const enRetard = deliverables.filter((d) => {
    if (!d.dueDate) return false
    return new Date(d.dueDate) < new Date() && d.status !== 'approved'
  }).length

  const formatDate = (d: string | null) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('fr-FR')
  }

  // Timeline data
  const timelineCampaigns = selectedCampaignId === 'all'
    ? campaigns
    : campaigns.filter((c) => c.id === selectedCampaignId)

  const getDeliverablesForCampaign = (campaignId: string) =>
    deliverables.filter((d) => d.campaignId === campaignId)

  const statusOrder = ['pending', 'in_progress', 'submitted', 'reviewed', 'approved', 'rejected']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Livrables</h1>
          <p className="text-muted-foreground">
            Suivi des livrables requis par le DAO pour les campagnes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setTimelineDialogOpen(true)}>
            <Eye className="h-4 w-4" />
            Vue timeline
          </Button>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau livrable
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total livrables</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalLivrables}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-gray-600">{enAttente}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soumis</CardTitle>
            <PlayCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-yellow-600">{soumis}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approuvés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-emerald-600">{approuves}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-red-600">{enRetard}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des livrables</CardTitle>
          <CardDescription>Tous les livrables des campagnes de mesure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un livrable..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer par campagne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les campagnes</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.reference} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={confFilter} onValueChange={setConfFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Confidentialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(confidentialityConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
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
              <FileText className="h-8 w-8 mb-2" />
              <p>Aucun livrable trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">Campagne</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Confidentialité</TableHead>
                    <TableHead className="hidden lg:table-cell">Date limite</TableHead>
                    <TableHead className="hidden lg:table-cell">Date soumission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => {
                    const sc = statusConfig[d.status] || statusConfig.pending
                    const cc = confidentialityConfig[d.confidentiality] || confidentialityConfig.confidential
                    const ConfIcon = cc.icon
                    const isOverdue = d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'approved'
                    return (
                      <TableRow key={d.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {d.title}
                          {isOverdue && (
                            <AlertTriangle className="h-3 w-3 text-red-500 inline ml-1" />
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{d.campaign?.reference}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[d.type] || d.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cc.color}`}>
                            <ConfIcon className="h-3 w-3" />
                            {cc.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {formatDate(d.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{formatDate(d.submittedDate)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
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

      {/* Timeline Dialog */}
      <Dialog open={timelineDialogOpen} onOpenChange={setTimelineDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Timeline des livrables</DialogTitle>
            <DialogDescription>
              Progression des livrables par campagne
            </DialogDescription>
          </DialogHeader>
          <div className="mb-4">
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Sélectionner une campagne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les campagnes</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.reference} - {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[55vh] overflow-y-auto space-y-6">
            {timelineCampaigns.map((campaign) => {
              const campDeliverables = getDeliverablesForCampaign(campaign.id)
              if (campDeliverables.length === 0) return null
              const approvedCount = campDeliverables.filter((d) => d.status === 'approved').length
              const progress = campDeliverables.length > 0 ? Math.round((approvedCount / campDeliverables.length) * 100) : 0
              return (
                <div key={campaign.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">{campaign.reference}</code>
                      <span className="ml-2 text-sm font-medium">{campaign.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{approvedCount}/{campDeliverables.length} approuvés</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="space-y-2 ml-4">
                    {campDeliverables.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)).map((d) => {
                      const sc = statusConfig[d.status] || statusConfig.pending
                      return (
                        <div key={d.id} className="flex items-center gap-3 text-sm">
                          <div className={`h-2.5 w-2.5 rounded-full ${sc.color.split(' ')[0]}`} />
                          <span className="flex-1 truncate">{d.title}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.color}`}>
                            {sc.label}
                          </span>
                          {d.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(d.dueDate)}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {timelineCampaigns.every((c) => getDeliverablesForCampaign(c.id).length === 0) && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p>Aucun livrable à afficher</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Deliverable Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau livrable</DialogTitle>
            <DialogDescription>
              Ajouter un livrable requis pour une campagne
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="liv-title">Titre du livrable</Label>
              <Input id="liv-title" placeholder="Ex: Rapport technique Q3 2025" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="liv-campaign">Campagne</Label>
              <Select value={formCampaignId} onValueChange={setFormCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une campagne" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.reference} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="liv-type">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="liv-conf">Confidentialité</Label>
                <Select value={formConf} onValueChange={setFormConf}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confidential">Confidentiel</SelectItem>
                    <SelectItem value="restricted">Restreint</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="liv-desc">Description</Label>
              <Input id="liv-desc" placeholder="Description du livrable..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="liv-due">Date limite</Label>
              <Input id="liv-due" type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formTitle || !formCampaignId}>
              Créer le livrable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
