'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ClipboardCheck, Search } from 'lucide-react'

const mockAudits = [
  { id: '1', reference: 'AUD-2025-001', title: 'Audit de couverture réseau — Conakry', type: 'coverage', status: 'planned', startDate: '2025-03-15', operator: 'Orange Guinée' },
  { id: '2', reference: 'AUD-2025-002', title: 'Audit de conformité technique', type: 'compliance', status: 'in_progress', startDate: '2025-02-20', operator: 'MTN Guinée' },
  { id: '3', reference: 'AUD-2024-008', title: 'Audit QoS — Région de Kindia', type: 'qos', status: 'completed', startDate: '2024-11-10', operator: 'Celcom Guinée' },
  { id: '4', reference: 'AUD-2025-003', title: 'Audit financier des redevances', type: 'financial', status: 'planned', startDate: '2025-04-01', operator: null },
  { id: '5', reference: 'AUD-2024-006', title: 'Audit de sécurité des réseaux', type: 'security', status: 'completed', startDate: '2024-09-05', operator: 'Orange Guinée' },
  { id: '6', reference: 'AUD-2025-004', title: 'Vérification des indicateurs QoS', type: 'qos', status: 'in_progress', startDate: '2025-02-01', operator: 'MTN Guinée' },
  { id: '7', reference: 'AUD-2024-003', title: 'Audit de couverture — Boké', type: 'coverage', status: 'completed', startDate: '2024-07-15', operator: 'Celcom Guinée' },
]

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  coverage: { label: 'Couverture', variant: 'default' },
  compliance: { label: 'Conformité', variant: 'secondary' },
  qos: { label: 'QoS', variant: 'outline' },
  financial: { label: 'Financier', variant: 'destructive' },
  security: { label: 'Sécurité', variant: 'default', className: 'bg-purple-500 hover:bg-purple-600' },
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  planned: { label: 'Planifié', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
  completed: { label: 'Terminé', variant: 'secondary' },
  cancelled: { label: 'Annulé', variant: 'destructive' },
}

export default function AuditsPage() {
  const [search, setSearch] = useState('')

  const filtered = mockAudits.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.reference.toLowerCase().includes(search.toLowerCase()) ||
      (a.operator && a.operator.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audits</h1>
        <p className="text-muted-foreground">
          Planification et suivi des audits de conformité et de performance
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total audits</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAudits.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAudits.filter((a) => a.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terminés</CardTitle>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockAudits.filter((a) => a.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des audits</CardTitle>
          <CardDescription>Tous les audits planifiés et réalisés</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un audit..."
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
                <TableHead>Type</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Date de début</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                      {audit.reference}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {audit.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={typeMap[audit.type]?.variant}
                      className={typeMap[audit.type]?.className}
                    >
                      {typeMap[audit.type]?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>{audit.operator || '—'}</TableCell>
                  <TableCell>
                    {audit.startDate
                      ? new Date(audit.startDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusMap[audit.status]?.variant}
                      className={statusMap[audit.status]?.className}
                    >
                      {statusMap[audit.status]?.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun audit trouvé
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
