'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Search, FileText, Calendar, Clock, Banknote, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

interface AppelOffre {
  id: string
  reference: string
  title: string
  description?: string
  type: string
  status: string
  budget?: number
  currency: string
  startDate?: string
  deadlineDate?: string
  awardedDate?: string
  locality?: string
  durationDays?: number
  createdAt: string
  createdBy?: { id: string; name: string; email: string }
  _count?: { submissions: number; documents: number }
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  draft: { label: 'Brouillon', variant: 'outline' },
  published: { label: 'Publié', variant: 'default' },
  closed: { label: 'Clôturé', variant: 'secondary' },
  awarded: { label: 'Attribué', variant: 'default', className: 'bg-emerald-600 hover:bg-emerald-700' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  audit: { label: 'Audit', variant: 'default' },
  consultation: { label: 'Consultation', variant: 'secondary' },
  service: { label: 'Service', variant: 'outline' },
}

function formatAmount(amount: number | null | undefined, currency: string = 'GNF') {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ' + currency
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

export default function AppelOffresPage() {
  const [appelOffres, setAppelOffres] = useState<AppelOffre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedAO, setSelectedAO] = useState<AppelOffre | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formRef, setFormRef] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formType, setFormType] = useState('audit')
  const [formBudget, setFormBudget] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formLocality, setFormLocality] = useState('')
  const [formDuration, setFormDuration] = useState('')

  const fetchAppelOffres = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/appel-offres?${params}`)
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      setAppelOffres(data.appelOffres || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, search])

  useEffect(() => {
    fetchAppelOffres()
  }, [fetchAppelOffres])

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      const body: any = {
        reference: formRef,
        title: formTitle,
        description: formDesc || undefined,
        type: formType,
        budget: formBudget ? parseFloat(formBudget) : undefined,
        startDate: formStartDate || undefined,
        deadlineDate: formDeadline || undefined,
        locality: formLocality || undefined,
        durationDays: formDuration ? parseInt(formDuration) : undefined,
      }
      const res = await fetch('/api/appel-offres', {
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
      fetchAppelOffres()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormRef('')
    setFormTitle('')
    setFormDesc('')
    setFormType('audit')
    setFormBudget('')
    setFormStartDate('')
    setFormDeadline('')
    setFormLocality('')
    setFormDuration('')
  }

  const openDetail = (ao: AppelOffre) => {
    setSelectedAO(ao)
    setDetailOpen(true)
  }

  const totalAOs = appelOffres.length
  const publishedCount = appelOffres.filter(a => a.status === 'published').length
  const awardedCount = appelOffres.filter(a => a.status === 'awarded').length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appels d&apos;offres</h1>
          <p className="text-muted-foreground">
            Gestion des dossiers d&apos;appels d&apos;offres (DAO)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel appel d&apos;offres
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouvel appel d&apos;offres</DialogTitle>
              <DialogDescription>
                Créer un nouveau dossier d&apos;appel d&apos;offres
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ao-ref">Référence</Label>
                <Input id="ao-ref" placeholder="Ex: DAO-2025-004" value={formRef} onChange={e => setFormRef(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ao-title">Titre</Label>
                <Input id="ao-title" placeholder="Titre de l'appel d'offres" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ao-desc">Description</Label>
                <Textarea id="ao-desc" placeholder="Description détaillée..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">Audit</SelectItem>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-budget">Budget (GNF)</Label>
                  <Input id="ao-budget" type="number" placeholder="0" value={formBudget} onChange={e => setFormBudget(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-start">Date de publication</Label>
                  <Input id="ao-start" type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-deadline">Date limite</Label>
                  <Input id="ao-deadline" type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ao-locality">Localisation</Label>
                  <Input id="ao-locality" placeholder="Ex: Conakry" value={formLocality} onChange={e => setFormLocality(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ao-duration">Durée (jours)</Label>
                  <Input id="ao-duration" type="number" placeholder="90" value={formDuration} onChange={e => setFormDuration(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={submitting || !formRef || !formTitle}>
                {submitting ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedAO && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{selectedAO.reference}</code>
                  <Badge variant={statusMap[selectedAO.status]?.variant} className={statusMap[selectedAO.status]?.className}>
                    {statusMap[selectedAO.status]?.label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>{selectedAO.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selectedAO.description && <p className="text-muted-foreground">{selectedAO.description}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span>Type : <strong>{typeMap[selectedAO.type]?.label}</strong></span></div>
                  <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><span>Budget : <strong>{formatAmount(selectedAO.budget, selectedAO.currency)}</strong></span></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Publication : {formatDate(selectedAO.startDate)}</span></div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span>Limite : {formatDate(selectedAO.deadlineDate)}</span></div>
                </div>
                {selectedAO.locality && <p>📍 Localisation : {selectedAO.locality}</p>}
                {selectedAO.durationDays && <p>⏱ Durée : {selectedAO.durationDays} jours</p>}
                {selectedAO._count && (
                  <div className="flex gap-4 pt-2 border-t">
                    <span className="text-muted-foreground">{selectedAO._count.submissions} soumission(s)</span>
                    <span className="text-muted-foreground">{selectedAO._count.documents} document(s)</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total appels d&apos;offres</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appelOffres.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Publiés</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attribués</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{awardedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des appels d&apos;offres</CardTitle>
          <CardDescription>Tous les dossiers d&apos;appels d&apos;offres enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre ou référence..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="closed">Clôturé</SelectItem>
                <SelectItem value="awarded">Attribué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Limite</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appelOffres.map((ao) => (
                    <TableRow key={ao.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{ao.reference}</code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">{ao.title}</TableCell>
                      <TableCell>
                        <Badge variant={typeMap[ao.type]?.variant || 'outline'}>
                          {typeMap[ao.type]?.label || ao.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatAmount(ao.budget, ao.currency)}</TableCell>
                      <TableCell className="text-sm">{formatDate(ao.deadlineDate)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[ao.status]?.variant} className={statusMap[ao.status]?.className}>
                          {statusMap[ao.status]?.label || ao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(ao)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {appelOffres.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        Aucun appel d&apos;offres trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </div>
  )
}
