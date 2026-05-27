'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

const mockOperators = [
  { id: '1', name: 'Orange Guinée', code: 'ORANGE', type: 'Mobile', status: 'active', licenseDate: '2005-03-15', contactEmail: 'contact@orange.gn', contactPhone: '+224 622 000 000' },
  { id: '2', name: 'MTN Guinée', code: 'MTN', type: 'Mobile', status: 'active', licenseDate: '2006-07-20', contactEmail: 'info@mtn.gn', contactPhone: '+224 623 000 000' },
  { id: '3', name: 'Celcom Guinée', code: 'CELCOM', type: 'Mobile', status: 'active', licenseDate: '2008-01-10', contactEmail: 'contact@celcom.gn', contactPhone: '+224 624 000 000' },
  { id: '4', name: 'Guinéenne de Téléphonie', code: 'GTEL', type: 'Fixe', status: 'pending', licenseDate: null, contactEmail: 'info@gtelecom.gn', contactPhone: null },
  { id: '5', name: 'Sotelgui', code: 'SOTELGUI', type: 'Fixe + Mobile', status: 'inactive', licenseDate: '1995-06-01', contactEmail: 'contact@sotelgui.gn', contactPhone: null },
  { id: '6', name: 'Africa Telecom', code: 'AFTEL', type: 'Internet', status: 'pending', licenseDate: null, contactEmail: 'info@africatelecom.gn', contactPhone: null },
]

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  pending: { label: 'En attente', variant: 'outline' },
  inactive: { label: 'Inactif', variant: 'destructive' },
}

export default function OperatorsPage() {
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = mockOperators.filter(
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <div className="grid gap-2">
                <Label htmlFor="op-name">Nom de l&apos;opérateur</Label>
                <Input id="op-name" placeholder="Ex: Orange Guinée" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-code">Code</Label>
                <Input id="op-code" placeholder="Ex: ORANGE" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="fixe">Fixe</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="fixe-mobile">Fixe + Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-email">Email de contact</Label>
                <Input id="op-email" type="email" placeholder="contact@operateur.gn" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="op-phone">Téléphone de contact</Label>
                <Input id="op-phone" placeholder="+224 622 000 000" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setDialogOpen(false)}>
                Enregistrer
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
            <div className="text-2xl font-bold">{mockOperators.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Opérateurs actifs</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOperators.filter((o) => o.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOperators.filter((o) => o.status === 'pending').length}
            </div>
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
              {filtered.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{op.code}</code>
                  </TableCell>
                  <TableCell>{op.type}</TableCell>
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
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Aucun opérateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
