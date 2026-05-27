'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { Plus, Search, MessageSquareWarning } from 'lucide-react'

const mockComplaints = [
  { id: '1', reference: 'PLT-2025-001', title: 'Coupures fréquentes du réseau', category: 'Réseau', priority: 'high', status: 'open', assignedTo: 'Mamadou Diallo', operator: 'Orange Guinée' },
  { id: '2', reference: 'PLT-2025-002', title: 'Qualité voix dégradée', category: 'Qualité', priority: 'medium', status: 'in_progress', assignedTo: 'Aissatou Bah', operator: 'MTN Guinée' },
  { id: '3', reference: 'PLT-2025-003', title: 'Surfacturation des appels', category: 'Facturation', priority: 'high', status: 'open', assignedTo: null, operator: 'Celcom Guinée' },
  { id: '4', reference: 'PLT-2025-004', title: 'Absence de couverture en zone rurale', category: 'Couverture', priority: 'medium', status: 'in_progress', assignedTo: 'Ibrahima Sow', operator: 'Orange Guinée' },
  { id: '5', reference: 'PLT-2025-005', title: 'Service client injoignable', category: 'Service client', priority: 'low', status: 'resolved', assignedTo: 'Fatou Camara', operator: 'MTN Guinée' },
  { id: '6', reference: 'PLT-2025-006', title: 'Problème de connexion Internet', category: 'Internet', priority: 'high', status: 'open', assignedTo: 'Mamadou Diallo', operator: 'Celcom Guinée' },
  { id: '7', reference: 'PLT-2025-007', title: 'Débit insuffisant forfait 4G', category: 'Internet', priority: 'medium', status: 'closed', assignedTo: 'Aissatou Bah', operator: 'Orange Guinée' },
  { id: '8', reference: 'PLT-2025-008', title: 'SMS non délivrés', category: 'Réseau', priority: 'low', status: 'open', assignedTo: null, operator: 'MTN Guinée' },
]

const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  high: { label: 'Haute', variant: 'destructive' },
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
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filtered = mockComplaints.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.reference.toLowerCase().includes(search.toLowerCase()) ||
      c.operator.toLowerCase().includes(search.toLowerCase())
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <div className="grid gap-2">
                <Label htmlFor="c-title">Titre</Label>
                <Input id="c-title" placeholder="Résumé de la plainte" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-desc">Description</Label>
                <Textarea id="c-desc" placeholder="Description détaillée de la plainte..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Catégorie</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reseau">Réseau</SelectItem>
                      <SelectItem value="qualite">Qualité</SelectItem>
                      <SelectItem value="facturation">Facturation</SelectItem>
                      <SelectItem value="couverture">Couverture</SelectItem>
                      <SelectItem value="internet">Internet</SelectItem>
                      <SelectItem value="service-client">Service client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priorité</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Opérateur concerné</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange Guinée</SelectItem>
                    <SelectItem value="mtn">MTN Guinée</SelectItem>
                    <SelectItem value="celcom">Celcom Guinée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-name">Nom du plaignant</Label>
                <Input id="c-name" placeholder="Nom complet" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Téléphone</Label>
                  <Input id="c-phone" placeholder="+224 ..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" type="email" placeholder="email@exemple.gn" />
                </div>
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
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total plaintes</CardTitle>
            <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockComplaints.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ouvertes</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComplaints.filter((c) => c.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComplaints.filter((c) => c.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résolues</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length}
            </div>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Assigné à</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {complaint.reference}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {complaint.title}
                  </TableCell>
                  <TableCell>{complaint.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={priorityMap[complaint.priority]?.variant}
                      className={priorityMap[complaint.priority]?.className}
                    >
                      {priorityMap[complaint.priority]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.operator}</TableCell>
                  <TableCell>
                    <Badge
                      variant={statusMap[complaint.status]?.variant}
                      className={statusMap[complaint.status]?.className}
                    >
                      {statusMap[complaint.status]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{complaint.assignedTo || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Aucune plainte trouvée
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
