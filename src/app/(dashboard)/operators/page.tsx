'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { Plus, Search, Building2 } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'

interface Operator {
  id: string
  name: string
  code: string
  type: string
  status: string
  licenseDate: string | null
  contactEmail: string | null
  contactPhone: string | null
  createdAt: string
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  pending: { label: 'En attente', variant: 'outline' },
  suspended: { label: 'Suspendu', variant: 'secondary' },
  inactive: { label: 'Inactif', variant: 'destructive' },
  revoked: { label: 'Révoqué', variant: 'destructive' },
}

const typeLabels: Record<string, string> = {
  mobile: 'Mobile',
  fixe: 'Fixe',
  internet: 'Internet',
  mobile_fixe: 'Fixe + Mobile',
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const loadOperators = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get<Operator[]>('/api/operators', {
        params: { limit: 100 },
      })
      if (response.success && response.data) {
        setOperators(response.data)
      } else {
        setError(response.error?.message || 'Erreur de chargement')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erreur de chargement des opérateurs')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOperators()
  }, [loadOperators])

  const handleCreateOperator = async () => {
    try {
      setSubmitting(true)
      setFormError(null)

      const response = await apiClient.post<Operator>('/api/operators', {
        name: formName,
        code: formCode,
        type: formType || 'mobile',
        contactEmail: formEmail || undefined,
        contactPhone: formPhone || undefined,
      })

      if (response.success) {
        setDialogOpen(false)
        resetForm()
        loadOperators() // Refresh the list
      } else {
        setFormError(response.error?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Erreur lors de la création de l\'opérateur')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormCode('')
    setFormType('')
    setFormEmail('')
    setFormPhone('')
    setFormError(null)
  }

  const filtered = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opérateurs</h1>
          <p className="text-muted-foreground">
            Gestion des opérateurs de télécommunications en Guinée
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un opérateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvel opérateur</DialogTitle>
              <DialogDescription>
                Enregistrer un nouvel opérateur de télécommunications
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="op-name">Nom de l&apos;opérateur</Label>
                <Input id="op-name" placeholder="Ex: Orange Guinée" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-code">Code</Label>
                <Input id="op-code" placeholder="Ex: ORANGE" value={formCode} onChange={(e) => setFormCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-type">Type</Label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="fixe">Fixe</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="mobile_fixe">Fixe + Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-email">Email de contact</Label>
                <Input id="op-email" type="email" placeholder="contact@operateur.gn" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-phone">Téléphone de contact</Label>
                <Input id="op-phone" placeholder="+224 622 000 000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm() }}>
                Annuler
              </Button>
              <Button onClick={handleCreateOperator} disabled={submitting || !formName || !formCode}>
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total opérateurs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{operators.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opérateurs actifs</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {operators.filter((o) => o.status === 'active').length}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {operators.filter((o) => o.status === 'pending' || o.status === 'suspended').length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search and table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des opérateurs</CardTitle>
          <CardDescription>Tous les opérateurs enregistrés sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un opérateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          {error ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={loadOperators}>
                Réessayer
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date de licence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-medium">{op.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{op.code}</code>
                      </TableCell>
                      <TableCell>{typeLabels[op.type] || op.type}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[op.status]?.variant || 'outline'}>
                          {statusMap[op.status]?.label || op.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {op.licenseDate
                          ? new Date(op.licenseDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucun opérateur trouvé
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
