'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Plus, Search, MessageSquareWarning } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'

interface Operator {
  id: string
  name: string
  code: string
}

interface Complaint {
  id: string
  reference: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  operatorId: string | null
  operator?: Operator | null
  complainantName: string | null
  complainantPhone: string | null
  complainantEmail: string | null
  assignedToId: string | null
  createdAt: string
}

const categoryLabels: Record<string, string> = {
  qualite_service: 'Qualité',
  facturation: 'Facturation',
  couverture: 'Couverture',
  service_client: 'Service client',
  fraude: 'Fraude',
  autre: 'Autre',
  reseau: 'Réseau',
  internet: 'Internet',
}

const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  high: { label: 'Haute', variant: 'destructive' },
  critical: { label: 'Critique', variant: 'destructive', className: 'bg-red-700 hover:bg-red-800' },
  medium: { label: 'Moyenne', variant: 'default', className: 'bg-yellow-500 hover:bg-yellow-600' },
  low: { label: 'Basse', variant: 'secondary' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  open: { label: 'Ouverte', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  resolved: { label: 'Résolue', variant: 'secondary' },
  closed: { label: 'Fermée', variant: 'secondary' },
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPriority, setFormPriority] = useState('')
  const [formOperatorId, setFormOperatorId] = useState('')
  const [formComplainantName, setFormComplainantName] = useState('')
  const [formComplainantPhone, setFormComplainantPhone] = useState('')
  const [formComplainantEmail, setFormComplainantEmail] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [compRes, opRes] = await Promise.all([
        apiClient.get<Complaint[]>('/api/complaints', { params: { limit: 100 } }),
        apiClient.get<Operator[]>('/api/operators', { params: { limit: 100 } }),
      ])
      if (compRes.success && compRes.data) setComplaints(compRes.data)
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

  const handleCreateComplaint = async () => {
    try {
      setSubmitting(true)
      setFormError(null)

      const response = await apiClient.post<Complaint>('/api/complaints', {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        priority: formPriority || 'medium',
        operatorId: formOperatorId || undefined,
        complainantName: formComplainantName || undefined,
        complainantPhone: formComplainantPhone || undefined,
        complainantEmail: formComplainantEmail || undefined,
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
        setFormError('Erreur lors de la création de la plainte')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormCategory('')
    setFormPriority('')
    setFormOperatorId('')
    setFormComplainantName('')
    setFormComplainantPhone('')
    setFormComplainantEmail('')
    setFormError(null)
  }

  const filtered = complaints.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      (c.operator?.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plaintes</h1>
          <p className="text-muted-foreground">
            Gestion des plaintes des usagers et des opérateurs
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle plainte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enregistrer une plainte</DialogTitle>
              <DialogDescription>
                Remplissez le formulaire pour enregistrer une nouvelle plainte
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="c-title">Titre</Label>
                <Input id="c-title" placeholder="Résumé de la plainte" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-desc">Description</Label>
                <Textarea id="c-desc" placeholder="Description détaillée de la plainte..." rows={3} value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualite_service">Qualité</SelectItem>
                      <SelectItem value="facturation">Facturation</SelectItem>
                      <SelectItem value="couverture">Couverture</SelectItem>
                      <SelectItem value="service_client">Service client</SelectItem>
                      <SelectItem value="fraude">Fraude</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priorité</Label>
                  <Select value={formPriority} onValueChange={setFormPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Opérateur concerné</Label>
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
                <Label htmlFor="c-name">Nom du plaignant</Label>
                <Input id="c-name" placeholder="Nom complet" value={formComplainantName} onChange={(e) => setFormComplainantName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Téléphone</Label>
                  <Input id="c-phone" placeholder="+224 ..." value={formComplainantPhone} onChange={(e) => setFormComplainantPhone(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" placeholder="email@exemple.gn" value={formComplainantEmail} onChange={(e) => setFormComplainantEmail(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button onClick={handleCreateComplaint} disabled={submitting || !formTitle || !formDescription || !formCategory}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total plaintes</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{complaints.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ouvertes</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {complaints.filter((c) => c.status === 'open').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {complaints.filter((c) => c.status === 'in_progress').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">
                {complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Complaints table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des plaintes</CardTitle>
          <CardDescription>Toutes les plaintes enregistrées sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher une plainte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
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
                  <TableHead>Référence</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Opérateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Plaignant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                          {complaint.reference}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {complaint.title}
                      </TableCell>
                      <TableCell>{categoryLabels[complaint.category] || complaint.category}</TableCell>
                      <TableCell>
                        <Badge
                          variant={priorityMap[complaint.priority]?.variant}
                          className={priorityMap[complaint.priority]?.className}
                        >
                          {priorityMap[complaint.priority]?.label || complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{complaint.operator?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={statusMap[complaint.status]?.variant}
                          className={statusMap[complaint.status]?.className}
                        >
                          {statusMap[complaint.status]?.label || complaint.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{complaint.complainantName || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucune plainte trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
