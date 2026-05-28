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
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  MapPin,
  Cpu,
  Calendar,
  HardHat,
  Lock,
  Activity,
} from 'lucide-react'

interface Constraint {
  id: string
  category: string
  title: string
  description: string
  severity: string
  status: string
  entityType: string | null
  entityId: string | null
  mitigation: string | null
  resolvedAt: string | null
  createdAt: string
}

const categoryConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  geographic: { label: 'Géographique', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: MapPin },
  regulatory: { label: 'Réglementaire', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', icon: Shield },
  technical: { label: 'Technique', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', icon: Cpu },
  calendar: { label: 'Calendaire', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Calendar },
  human_security: { label: 'Sécurité personnes', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: HardHat },
  confidentiality: { label: 'Confidentialité', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', icon: Lock },
}

const severityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Faible', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  high: { label: 'Élevée', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
  critical: { label: 'Critique', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
}

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
  mitigated: { label: 'Atténuée', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
  resolved: { label: 'Résolue', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
  ignored: { label: 'Ignorée', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
}

export default function ContraintesPage() {
  const [constraints, setConstraints] = useState<Constraint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState<string>('technical')
  const [formSeverity, setFormSeverity] = useState<string>('medium')
  const [formDescription, setFormDescription] = useState('')
  const [formMitigation, setFormMitigation] = useState('')
  const [formEntityType, setFormEntityType] = useState<string>('')

  const fetchConstraints = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      if (severityFilter && severityFilter !== 'all') params.set('severity', severityFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('limit', '100')
      const res = await fetch(`/api/constraints?${params}`)
      if (!res.ok) throw new Error('Erreur réseau')
      const data = await res.json()
      setConstraints(data.constraints || [])
    } catch {
      setError('Impossible de charger les contraintes')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, severityFilter, statusFilter])

  useEffect(() => {
    fetchConstraints()
  }, [fetchConstraints])

  const handleCreate = async () => {
    if (!formTitle || !formDescription) return
    try {
      const res = await fetch('/api/constraints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          severity: formSeverity,
          description: formDescription,
          mitigation: formMitigation || undefined,
          entityType: formEntityType || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur')
      }
      setCreateDialogOpen(false)
      resetForm()
      fetchConstraints()
    } catch (err) {
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormCategory('technical')
    setFormSeverity('medium')
    setFormDescription('')
    setFormMitigation('')
    setFormEntityType('')
  }

  const filtered = constraints.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  )

  // Stats
  const totalContraintes = constraints.length
  const actives = constraints.filter((c) => c.status === 'active').length
  const critiques = constraints.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length
  const resolues = constraints.filter((c) => c.status === 'resolved').length
  const resolvedPercent = totalContraintes > 0 ? Math.round((resolues / totalContraintes) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contraintes</h1>
          <p className="text-muted-foreground">
            Suivi des contraintes réglementaires et opérationnelles (DAO Section IX)
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle contrainte
        </Button>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Taux de résolution des contraintes</span>
            <span className="text-sm font-bold">{resolvedPercent}%</span>
          </div>
          <Progress value={resolvedPercent} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>{resolues} résolues sur {totalContraintes} total</span>
            <span>{actives} actives, {critiques} critiques</span>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total contraintes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalContraintes}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actives</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-red-600">{actives}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-orange-600">{critiques}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold text-emerald-600">{resolues}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des contraintes</CardTitle>
          <CardDescription>Toutes les contraintes réglementaires et opérationnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une contrainte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes sévérités</SelectItem>
                {Object.entries(severityConfig).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
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
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p>Aucune contrainte trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Entité</TableHead>
                    <TableHead className="hidden lg:table-cell">Atténuation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const catCfg = categoryConfig[c.category] || categoryConfig.technical
                    const CatIcon = catCfg.icon
                    const sevCfg = severityConfig[c.severity] || severityConfig.medium
                    const statCfg = statusConfig[c.status] || statusConfig.active
                    return (
                      <TableRow key={c.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium max-w-[200px]">
                          <div className="truncate">{c.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${catCfg.color}`}>
                            <CatIcon className="h-3 w-3" />
                            {catCfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sevCfg.color}`}>
                            {sevCfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statCfg.color}`}>
                            {statCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {c.entityType ? (
                            <Badge variant="outline" className="text-xs">{c.entityType}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm max-w-[200px] truncate">
                          {c.mitigation || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-xs"
                            onClick={async () => {
                              try {
                                await fetch(`/api/constraints`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: c.id, status: c.status === 'resolved' ? 'active' : 'resolved' }),
                                })
                                fetchConstraints()
                              } catch (err) {
                                console.error(err)
                              }
                            }}
                          >
                            {c.status === 'resolved' ? 'Réouvrir' : 'Résoudre'}
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

      {/* Create Constraint Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle contrainte</DialogTitle>
            <DialogDescription>
              Enregistrer une contrainte réglementaire ou opérationnelle
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="con-title">Titre</Label>
              <Input id="con-title" placeholder="Ex: Accès limité aux zones rurales" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="con-category">Catégorie</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="con-severity">Sévérité</Label>
                <Select value={formSeverity} onValueChange={setFormSeverity}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(severityConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="con-desc">Description</Label>
              <Input id="con-desc" placeholder="Description détaillée de la contrainte..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="con-mitigation">Mesure d&apos;atténuation</Label>
              <Input id="con-mitigation" placeholder="Comment atténuer cette contrainte..." value={formMitigation} onChange={(e) => setFormMitigation(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="con-entity">Type d&apos;entité liée (optionnel)</Label>
              <Select value={formEntityType} onValueChange={setFormEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Aucune" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="campaign">Campagne</SelectItem>
                  <SelectItem value="appel_offre">Appel d&apos;offres</SelectItem>
                  <SelectItem value="operator">Opérateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!formTitle || !formDescription}>
              Créer la contrainte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
