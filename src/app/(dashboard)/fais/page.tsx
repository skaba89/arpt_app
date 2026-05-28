'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, Wifi, Download, Upload, Clock, Users, MapPin, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

interface Fai {
  id: string
  name: string
  code: string
  type: string
  status: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  licenseDate?: string
  avgDownloadSpeed?: number
  avgUploadSpeed?: number
  avgLatency?: number
  subscriberCount?: number
  coverageZones?: number
  createdAt: string
  createdBy?: { id: string; name: string; email: string }
  _count?: { qosReports: number; documents: number; conformityChecks: number }
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  inactive: { label: 'Inactif', variant: 'destructive' },
  pending: { label: 'En attente', variant: 'outline' },
}

const typeMap: Record<string, { label: string; icon: string }> = {
  fixe: { label: 'Fixe', icon: '🔌' },
  wifi: { label: 'Wi-Fi', icon: '📶' },
  satellite: { label: 'Satellite', icon: '🛰️' },
  fibre: { label: 'Fibre', icon: '🔗' },
}

function getSpeedColor(speed: number, minThreshold: number) {
  if (speed >= minThreshold * 1.5) return 'text-emerald-600'
  if (speed >= minThreshold) return 'text-yellow-600'
  return 'text-red-600'
}

function getSpeedBg(speed: number, minThreshold: number) {
  if (speed >= minThreshold * 1.5) return 'bg-emerald-50'
  if (speed >= minThreshold) return 'bg-yellow-50'
  return 'bg-red-50'
}

function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR')
}

function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

export default class FaisPage extends React.Component<{}, {
  fais: Fai[]
  loading: boolean
  error: string | null
  search: string
  typeFilter: string
  dialogOpen: boolean
  detailOpen: boolean
  selectedFai: Fai | null
  page: number
  totalPages: number
  submitting: boolean
  formName: string
  formCode: string
  formType: string
  formEmail: string
  formPhone: string
  formWebsite: string
  formDlSpeed: string
  formUlSpeed: string
  formLatency: string
  formSubscribers: string
  formZones: string
}> {
  constructor(props: {}) {
    super(props)
    this.state = {
      fais: [],
      loading: true,
      error: null,
      search: '',
      typeFilter: '',
      dialogOpen: false,
      detailOpen: false,
      selectedFai: null,
      page: 1,
      totalPages: 1,
      submitting: false,
      formName: '',
      formCode: '',
      formType: 'fixe',
      formEmail: '',
      formPhone: '',
      formWebsite: '',
      formDlSpeed: '',
      formUlSpeed: '',
      formLatency: '',
      formSubscribers: '',
      formZones: '',
    }
  }

  componentDidMount() {
    this.fetchFais()
  }

  componentDidUpdate(prevProps: {}, prevState: { page: number; typeFilter: string; search: string }) {
    if (prevState.page !== this.state.page || prevState.typeFilter !== this.state.typeFilter || prevState.search !== this.state.search) {
      this.fetchFais()
    }
  }

  fetchFais = async () => {
    try {
      this.setState({ loading: true, error: null })
      const params = new URLSearchParams()
      params.set('page', this.state.page.toString())
      params.set('limit', '20')
      if (this.state.typeFilter) params.set('type', this.state.typeFilter)
      if (this.state.search) params.set('search', this.state.search)

      const res = await fetch(`/api/fais?${params}`)
      if (!res.ok) throw new Error('Erreur lors du chargement')
      const data = await res.json()
      this.setState({ fais: data.fais || [], totalPages: data.pagination?.totalPages || 1 })
    } catch (err: any) {
      this.setState({ error: err.message || 'Erreur de chargement' })
    } finally {
      this.setState({ loading: false })
    }
  }

  handleCreate = async () => {
    try {
      this.setState({ submitting: true })
      const s = this.state
      const body: any = {
        name: s.formName,
        code: s.formCode,
        type: s.formType,
        contactEmail: s.formEmail || undefined,
        contactPhone: s.formPhone || undefined,
        website: s.formWebsite || undefined,
        avgDownloadSpeed: s.formDlSpeed ? parseFloat(s.formDlSpeed) : undefined,
        avgUploadSpeed: s.formUlSpeed ? parseFloat(s.formUlSpeed) : undefined,
        avgLatency: s.formLatency ? parseFloat(s.formLatency) : undefined,
        subscriberCount: s.formSubscribers ? parseInt(s.formSubscribers) : undefined,
        coverageZones: s.formZones ? parseInt(s.formZones) : undefined,
      }
      const res = await fetch('/api/fais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la création')
      }
      this.setState({ dialogOpen: false })
      this.resetForm()
      this.fetchFais()
    } catch (err: any) {
      alert(err.message)
    } finally {
      this.setState({ submitting: false })
    }
  }

  resetForm = () => {
    this.setState({
      formName: '', formCode: '', formType: 'fixe', formEmail: '', formPhone: '',
      formWebsite: '', formDlSpeed: '', formUlSpeed: '', formLatency: '',
      formSubscribers: '', formZones: '',
    })
  }

  render() {
    const s = this.state
    const activeCount = s.fais.filter(f => f.status === 'active').length
    const avgDl = s.fais.filter(f => f.avgDownloadSpeed).reduce((sum, f) => sum + (f.avgDownloadSpeed || 0), 0) / (s.fais.filter(f => f.avgDownloadSpeed).length || 1)
    const avgUl = s.fais.filter(f => f.avgUploadSpeed).reduce((sum, f) => sum + (f.avgUploadSpeed || 0), 0) / (s.fais.filter(f => f.avgUploadSpeed).length || 1)

    return (
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FAI — Fournisseurs d&apos;Accès Internet</h1>
            <p className="text-muted-foreground">
              Gestion des fournisseurs d&apos;accès Internet en Guinée
            </p>
          </div>
          <Dialog open={s.dialogOpen} onOpenChange={(open) => this.setState({ dialogOpen: open })}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un FAI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau FAI</DialogTitle>
                <DialogDescription>Enregistrer un nouveau fournisseur d&apos;accès Internet</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fai-name">Nom</Label>
                    <Input id="fai-name" placeholder="Ex: Guinee Net" value={s.formName} onChange={e => this.setState({ formName: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fai-code">Code (3 chars)</Label>
                    <Input id="fai-code" placeholder="Ex: GNT" maxLength={10} value={s.formCode} onChange={e => this.setState({ formCode: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fai-type">Type</Label>
                    <Select value={s.formType} onValueChange={v => this.setState({ formType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixe">Fixe</SelectItem>
                        <SelectItem value="fibre">Fibre</SelectItem>
                        <SelectItem value="wifi">Wi-Fi</SelectItem>
                        <SelectItem value="satellite">Satellite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fai-email">Email</Label>
                    <Input id="fai-email" type="email" placeholder="info@fai.gn" value={s.formEmail} onChange={e => this.setState({ formEmail: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fai-phone">Téléphone</Label>
                    <Input id="fai-phone" placeholder="+224 ..." value={s.formPhone} onChange={e => this.setState({ formPhone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fai-website">Site web</Label>
                    <Input id="fai-website" placeholder="https://..." value={s.formWebsite} onChange={e => this.setState({ formWebsite: e.target.value })} />
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-3">Métriques de performance</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fai-dl" className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Débit descendant (Mbps)</Label>
                      <Input id="fai-dl" type="number" step="0.1" placeholder="15.5" value={s.formDlSpeed} onChange={e => this.setState({ formDlSpeed: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fai-ul" className="flex items-center gap-1"><Upload className="h-3.5 w-3.5" /> Débit montant (Mbps)</Label>
                      <Input id="fai-ul" type="number" step="0.1" placeholder="5.2" value={s.formUlSpeed} onChange={e => this.setState({ formUlSpeed: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fai-latency" className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Latence (ms)</Label>
                      <Input id="fai-latency" type="number" placeholder="35" value={s.formLatency} onChange={e => this.setState({ formLatency: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="fai-subs" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Abonnés</Label>
                      <Input id="fai-subs" type="number" placeholder="15000" value={s.formSubscribers} onChange={e => this.setState({ formSubscribers: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fai-zones" className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Zones de couverture</Label>
                  <Input id="fai-zones" type="number" placeholder="5" value={s.formZones} onChange={e => this.setState({ formZones: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => this.setState({ dialogOpen: false })}>Annuler</Button>
                <Button onClick={this.handleCreate} disabled={s.submitting || !s.formName || !s.formCode}>
                  {s.submitting ? 'Création...' : 'Créer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Detail dialog */}
        <Dialog open={s.detailOpen} onOpenChange={(open) => this.setState({ detailOpen: open })}>
          <DialogContent className="max-w-lg">
            {s.selectedFai && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{s.selectedFai.code}</code>
                    {s.selectedFai.name}
                    <Badge variant={statusMap[s.selectedFai.status]?.variant}>
                      {statusMap[s.selectedFai.status]?.label}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription>
                    {typeMap[s.selectedFai.type]?.icon} {typeMap[s.selectedFai.type]?.label || s.selectedFai.type}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {s.selectedFai.contactEmail && <div>Email : <strong>{s.selectedFai.contactEmail}</strong></div>}
                    {s.selectedFai.contactPhone && <div>Tél : <strong>{s.selectedFai.contactPhone}</strong></div>}
                    {s.selectedFai.website && <div>Site : <a href={s.selectedFai.website} target="_blank" className="text-blue-600 underline">{s.selectedFai.website}</a></div>}
                    {s.selectedFai.licenseDate && <div>Licence : {formatDate(s.selectedFai.licenseDate)}</div>}
                  </div>
                  {s.selectedFai.avgDownloadSpeed && (
                    <div className="space-y-3 pt-3 border-t">
                      <p className="text-sm font-medium">Performance Internet</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5 text-muted-foreground" /> Débit descendant</span>
                          <span className="font-medium">{s.selectedFai.avgDownloadSpeed} Mbps</span>
                        </div>
                        <Progress value={Math.min((s.selectedFai.avgDownloadSpeed / 30) * 100, 100)} className="h-1.5" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" /> Débit montant</span>
                          <span className="font-medium">{s.selectedFai.avgUploadSpeed} Mbps</span>
                        </div>
                        <Progress value={Math.min(((s.selectedFai.avgUploadSpeed || 0) / 10) * 100, 100)} className="h-1.5" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Latence</span>
                          <span className="font-medium">{s.selectedFai.avgLatency} ms</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" /> Abonnés : <strong>{formatNumber(s.selectedFai.subscriberCount)}</strong></div>
                        <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Zones : <strong>{s.selectedFai.coverageZones || '—'}</strong></div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Performance cards per FAI */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.fais.map((fai) => (
            <Card key={fai.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>{typeMap[fai.type]?.icon}</span>
                    {fai.name}
                  </CardTitle>
                  <Badge variant={statusMap[fai.status]?.variant}>
                    {statusMap[fai.status]?.label}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">{fai.code}</code>
                  {typeMap[fai.type]?.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {fai.avgDownloadSpeed !== null && fai.avgDownloadSpeed !== undefined ? (
                  <>
                    <div className={`flex items-center justify-between rounded-lg p-3 ${getSpeedBg(fai.avgDownloadSpeed, 2)}`}>
                      <span className="text-sm font-medium">Débit descendant</span>
                      <span className={`text-xl font-bold ${getSpeedColor(fai.avgDownloadSpeed, 2)}`}>
                        {fai.avgDownloadSpeed} Mbps
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Upload className="h-3.5 w-3.5 text-muted-foreground" /> Débit montant</span>
                        <span className="font-medium">{fai.avgUploadSpeed} Mbps</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> Latence</span>
                        <span className={`font-medium ${fai.avgLatency && fai.avgLatency <= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fai.avgLatency} ms
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" /> Abonnés</span>
                        <span className="font-medium">{formatNumber(fai.subscriberCount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Zones</span>
                        <span className="font-medium">{fai.coverageZones || '—'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune métrique disponible</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des FAI</CardTitle>
            <CardDescription>Tous les fournisseurs d&apos;accès Internet enregistrés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un FAI..."
                  value={s.search}
                  onChange={(e) => { this.setState({ search: e.target.value, page: 1 }) }}
                  className="pl-9"
                />
              </div>
              <Select value={s.typeFilter} onValueChange={(v) => { this.setState({ typeFilter: v === 'all' ? '' : v, page: 1 }) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="fixe">Fixe</SelectItem>
                  <SelectItem value="fibre">Fibre</SelectItem>
                  <SelectItem value="wifi">Wi-Fi</SelectItem>
                  <SelectItem value="satellite">Satellite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {s.loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : s.error ? (
              <div className="py-8 text-center text-destructive">{s.error}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Débit ↓</TableHead>
                      <TableHead className="text-center">Débit ↑</TableHead>
                      <TableHead className="text-center">Latence</TableHead>
                      <TableHead className="text-center">Abonnés</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {s.fais.map((fai) => (
                      <TableRow key={fai.id}>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{fai.code}</code>
                        </TableCell>
                        <TableCell className="font-medium">{fai.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {typeMap[fai.type]?.icon} {typeMap[fai.type]?.label || fai.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{fai.avgDownloadSpeed ?? '—'}</TableCell>
                        <TableCell className="text-center">{fai.avgUploadSpeed ?? '—'}</TableCell>
                        <TableCell className={`text-center ${(fai.avgLatency ?? 0) <= 80 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {fai.avgLatency ? `${fai.avgLatency} ms` : '—'}
                        </TableCell>
                        <TableCell className="text-center">{formatNumber(fai.subscriberCount)}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[fai.status]?.variant}>
                            {statusMap[fai.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => this.setState({ selectedFai: fai, detailOpen: true })}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {s.fais.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          Aucun FAI trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {s.totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm" disabled={s.page <= 1} onClick={() => this.setState({ page: s.page - 1 })}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {s.page} / {s.totalPages}</span>
                    <Button variant="outline" size="sm" disabled={s.page >= s.totalPages} onClick={() => this.setState({ page: s.page + 1 })}>
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
}
