'use client'

import React, { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  Building2,
  MessageSquareWarning,
  Signal,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Radio,
  Antenna,
  Users,
  Eye,
  EyeOff,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────

export interface RegionOperatorData {
  operatorId: string
  operatorName: string
  operatorCode: string
  active: boolean
  coverage2G: number | null
  coverage3G: number | null
  coverage4G: number | null
  qosScore: number | null
  subscriberCount: number | null
  siteCount: number | null
}

export interface RegionData {
  id?: string
  name: string
  code: string
  lat: number
  lng: number
  population?: number
  area?: number
  activeOperators: number
  qosScore: number
  complaintCount: number
  coverage: number
  operators?: RegionOperatorData[]
}

type MapView = 'regions' | 'operators' | 'coverage'
type CoverageType = '4G' | '3G' | '2G'

// ── Constants ─────────────────────────────────────────────────

const OPERATOR_COLORS: Record<string, string> = {
  ORG: '#FF7900', // Orange
  MTN: '#FFCC00', // MTN yellow
  CEL: '#00AAFF', // Celcom blue
  GNT: '#444444', // Guinetel gray
  GTC: '#00A651', // Guinea Telecom green
}

const OPERATOR_NAMES: Record<string, string> = {
  ORG: 'Orange Guinée',
  MTN: 'MTN Guinée',
  CEL: 'Celcom Guinée',
  GTC: 'Guinée Telecom',
  GNT: 'Guinetel',
}

const FALLBACK_REGIONS: RegionData[] = [
  { name: "Conakry", code: "CK", lat: 9.5092, lng: -13.7122, population: 2076609, area: 450, activeOperators: 4, qosScore: 83.8, complaintCount: 12, coverage: 95,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 99, coverage3G: 97, coverage4G: 92, qosScore: 88, subscriberCount: 850000, siteCount: 450 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 98, coverage3G: 95, coverage4G: 88, qosScore: 82, subscriberCount: 720000, siteCount: 380 },
      { operatorId: '3', operatorName: 'Celcom Guinée', operatorCode: 'CEL', active: true, coverage2G: 95, coverage3G: 90, coverage4G: 75, qosScore: 75, subscriberCount: 350000, siteCount: 220 },
      { operatorId: '4', operatorName: 'Guinée Telecom', operatorCode: 'GTC', active: true, coverage2G: 90, coverage3G: 70, coverage4G: 30, qosScore: 65, subscriberCount: 120000, siteCount: 85 },
    ]
  },
  { name: "Kindia", code: "KD", lat: 10.0667, lng: -12.8667, population: 1843043, area: 28533, activeOperators: 3, qosScore: 75.2, complaintCount: 5, coverage: 78,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 92, coverage3G: 80, coverage4G: 55, qosScore: 78, subscriberCount: 280000, siteCount: 180 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 88, coverage3G: 72, coverage4G: 45, qosScore: 72, subscriberCount: 220000, siteCount: 150 },
      { operatorId: '3', operatorName: 'Celcom Guinée', operatorCode: 'CEL', active: true, coverage2G: 80, coverage3G: 60, coverage4G: 25, qosScore: 62, subscriberCount: 95000, siteCount: 85 },
    ]
  },
  { name: "Boké", code: "BK", lat: 11.1833, lng: -14.2833, population: 1098475, area: 31118, activeOperators: 2, qosScore: 62.5, complaintCount: 8, coverage: 55,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 78, coverage3G: 55, coverage4G: 25, qosScore: 65, subscriberCount: 150000, siteCount: 95 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 72, coverage3G: 48, coverage4G: 18, qosScore: 58, subscriberCount: 110000, siteCount: 72 },
    ]
  },
  { name: "Labé", code: "LB", lat: 11.3167, lng: -12.3000, population: 1248012, area: 22729, activeOperators: 2, qosScore: 58.3, complaintCount: 6, coverage: 50,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 75, coverage3G: 50, coverage4G: 20, qosScore: 60, subscriberCount: 130000, siteCount: 80 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 70, coverage3G: 42, coverage4G: 15, qosScore: 55, subscriberCount: 95000, siteCount: 65 },
    ]
  },
  { name: "Mamou", code: "MM", lat: 10.3833, lng: -12.0833, population: 1034284, area: 8038, activeOperators: 2, qosScore: 65.1, complaintCount: 4, coverage: 62,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 82, coverage3G: 58, coverage4G: 28, qosScore: 68, subscriberCount: 140000, siteCount: 90 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 75, coverage3G: 50, coverage4G: 20, qosScore: 60, subscriberCount: 100000, siteCount: 70 },
    ]
  },
  { name: "Faranah", code: "FR", lat: 10.0333, lng: -10.7500, population: 939806, area: 35581, activeOperators: 1, qosScore: 45.7, complaintCount: 9, coverage: 35,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 60, coverage3G: 30, coverage4G: 8, qosScore: 45, subscriberCount: 75000, siteCount: 45 },
    ]
  },
  { name: "Kankan", code: "KN", lat: 10.3833, lng: -9.3000, population: 1999307, area: 72256, activeOperators: 3, qosScore: 68.4, complaintCount: 7, coverage: 70,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 85, coverage3G: 65, coverage4G: 35, qosScore: 72, subscriberCount: 250000, siteCount: 160 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 80, coverage3G: 58, coverage4G: 28, qosScore: 65, subscriberCount: 200000, siteCount: 130 },
      { operatorId: '3', operatorName: 'Celcom Guinée', operatorCode: 'CEL', active: true, coverage2G: 72, coverage3G: 45, coverage4G: 12, qosScore: 55, subscriberCount: 80000, siteCount: 55 },
    ]
  },
  { name: "N'Zérékoré", code: "NZ", lat: 7.7500, lng: -8.8167, population: 1865061, area: 38841, activeOperators: 2, qosScore: 52.1, complaintCount: 11, coverage: 42,
    operators: [
      { operatorId: '1', operatorName: 'Orange Guinée', operatorCode: 'ORG', active: true, coverage2G: 65, coverage3G: 38, coverage4G: 12, qosScore: 52, subscriberCount: 120000, siteCount: 70 },
      { operatorId: '2', operatorName: 'MTN Guinée', operatorCode: 'MTN', active: true, coverage2G: 58, coverage3G: 30, coverage4G: 8, qosScore: 48, subscriberCount: 85000, siteCount: 52 },
    ]
  },
]

// ── Helpers ───────────────────────────────────────────────────

function getQosColor(score: number): string {
  if (score > 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

function getQosLabel(score: number): string {
  if (score > 80) return 'Bon'
  if (score >= 60) return 'Moyen'
  return 'Faible'
}

function getCoverageColor(coverage: number): string {
  if (coverage >= 80) return '#22c55e'
  if (coverage >= 50) return '#eab308'
  return '#ef4444'
}

function getCoverageBgClass(coverage: number): string {
  if (coverage >= 80) return 'text-emerald-600'
  if (coverage >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('fr-FR').format(n)
}

// Offsets for multiple operator circles at same location
function getOperatorOffset(index: number, total: number): [number, number] {
  if (total === 1) return [0, 0]
  const angle = (2 * Math.PI * index) / total - Math.PI / 2
  const radius = 0.15
  return [Math.cos(angle) * radius, Math.sin(angle) * radius]
}

// ── Map Resize Handler ────────────────────────────────────────

function MapResizeHandler() {
  const map = useMap()
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])
  return null
}

// ── Mini Coverage Bar ─────────────────────────────────────────

function MiniCoverageBar({ value, color, label }: { value: number | null; color: string; label: string }) {
  if (value == null) return null
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="w-5 text-gray-500">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5 min-w-[50px]">
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-medium w-8 text-right">{value}%</span>
    </div>
  )
}

// ── Region Popup Content ──────────────────────────────────────

function RegionPopupContent({ region }: { region: RegionData }) {
  const ops = region.operators ?? []
  return (
    <div className="p-1 min-w-[220px] max-w-[280px]">
      <h3 className="font-bold text-base mb-2" style={{ color: '#1e3a5f' }}>
        {region.name}
      </h3>
      <div className="space-y-2 text-sm">
        {/* QoS + Coverage Summary */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Score QoS</span>
          <Badge style={{ backgroundColor: getQosColor(region.qosScore), color: 'white', fontSize: '11px' }}>
            {region.qosScore.toFixed(1)}% — {getQosLabel(region.qosScore)}
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Couverture</span>
          <span className={`font-semibold ${getCoverageBgClass(region.coverage)}`}>{region.coverage}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Opérateurs</span>
          <span className="font-semibold">{region.activeOperators}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Plaintes</span>
          <span className="font-semibold text-orange-600">{region.complaintCount}</span>
        </div>

        {/* Operators breakdown */}
        {ops.length > 0 && (
          <div className="mt-2 pt-2 border-t">
            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Opérateurs présents</p>
            {ops.map((op) => (
              <div key={op.operatorId} className="mb-2 last:mb-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                  <span className="font-medium text-xs">{op.operatorName}</span>
                  {op.qosScore != null && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto"
                      style={{ borderColor: getQosColor(op.qosScore), color: getQosColor(op.qosScore) }}>
                      QoS {op.qosScore}%
                    </Badge>
                  )}
                </div>
                <div className="space-y-0.5 pl-4">
                  <MiniCoverageBar value={op.coverage2G} color={OPERATOR_COLORS[op.operatorCode] ?? '#888'} label="2G" />
                  <MiniCoverageBar value={op.coverage3G} color={OPERATOR_COLORS[op.operatorCode] ?? '#888'} label="3G" />
                  <MiniCoverageBar value={op.coverage4G} color={OPERATOR_COLORS[op.operatorCode] ?? '#888'} label="4G" />
                </div>
                <div className="flex gap-3 text-[10px] text-gray-500 pl-4 mt-0.5">
                  {op.subscriberCount != null && (
                    <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{formatNumber(op.subscriberCount)}</span>
                  )}
                  {op.siteCount != null && (
                    <span className="flex items-center gap-0.5"><Antenna className="w-2.5 h-2.5" />{formatNumber(op.siteCount)} sites</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {region.population && (
          <div className="mt-1 pt-1 border-t flex justify-between items-center">
            <span className="text-gray-600">Population</span>
            <span className="font-semibold">{formatNumber(region.population)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Operator Legend ────────────────────────────────────────────

function OperatorLegend({ visibleOps, onToggleOp }: { visibleOps: Set<string>; onToggleOp: (code: string) => void }) {
  const allOpCodes = Object.keys(OPERATOR_COLORS)
  return (
    <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border max-w-[200px]">
      <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
        <Building2 className="w-3 h-3" /> Opérateurs
      </h4>
      <div className="space-y-1">
        {allOpCodes.map((code) => {
          const isVisible = visibleOps.has(code)
          return (
            <button
              key={code}
              onClick={() => onToggleOp(code)}
              className="flex items-center gap-2 w-full text-left hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
            >
              <div className="w-3 h-3 rounded-full shrink-0 border border-gray-300"
                style={{ backgroundColor: isVisible ? OPERATOR_COLORS[code] : '#e5e7eb', opacity: isVisible ? 1 : 0.4 }} />
              <span className={`text-xs ${isVisible ? 'text-gray-700' : 'text-gray-400'}`}>
                {OPERATOR_NAMES[code] ?? code}
              </span>
              {isVisible ? <Eye className="w-3 h-3 text-gray-500 ml-auto" /> : <EyeOff className="w-3 h-3 text-gray-400 ml-auto" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── QoS Legend ────────────────────────────────────────────────

function QosLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Légende QoS</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs text-gray-600">Bon (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }} />
          <span className="text-xs text-gray-600">Moyen (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs text-gray-600">Faible (&lt;60%)</span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t">
        <p className="text-[10px] text-gray-500">Taille = nombre de plaintes</p>
      </div>
    </div>
  )
}

// ── Coverage Legend ────────────────────────────────────────────

function CoverageLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">Légende Couverture</h4>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-xs text-gray-600">Élevée (&gt;80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }} />
          <span className="text-xs text-gray-600">Moyenne (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-xs text-gray-600">Faible (&lt;50%)</span>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar Detail Panel ──────────────────────────────────────

function RegionDetailPanel({ region }: { region: RegionData }) {
  const ops = region.operators ?? []
  const totalSites = ops.reduce((s, o) => s + (o.siteCount ?? 0), 0)
  const totalSubs = ops.reduce((s, o) => s + (o.subscriberCount ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Region Overview */}
      <Card className="border-[#1e3a5f] border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Signal className="h-4 w-4 text-[#1e3a5f]" />
            {region.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-[10px] text-muted-foreground">QoS</p>
              <p className="text-sm font-bold" style={{ color: getQosColor(region.qosScore) }}>
                {region.qosScore.toFixed(1)}%
              </p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Couverture</p>
              <p className={`text-sm font-bold ${getCoverageBgClass(region.coverage)}`}>
                {region.coverage}%
              </p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Opérateurs</p>
              <p className="text-sm font-bold">{region.activeOperators}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Plaintes</p>
              <p className="text-sm font-bold text-orange-600">{region.complaintCount}</p>
            </div>
          </div>
          {region.population && (
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Population</p>
              <p className="text-sm font-bold">{formatNumber(region.population)} hab.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operator Breakdown Table */}
      {ops.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1e3a5f]" />
              Détail par Opérateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ops.map((op) => {
                const color = OPERATOR_COLORS[op.operatorCode] ?? '#888'
                return (
                  <div key={op.operatorId} className="border rounded-md p-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold">{op.operatorName}</span>
                      {op.qosScore != null && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto"
                          style={{ borderColor: getQosColor(op.qosScore), color: getQosColor(op.qosScore) }}>
                          QoS {op.qosScore}%
                        </Badge>
                      )}
                    </div>
                    {/* Coverage bars */}
                    <div className="space-y-1">
                      <MiniCoverageBar value={op.coverage2G} color={color} label="2G" />
                      <MiniCoverageBar value={op.coverage3G} color={color} label="3G" />
                      <MiniCoverageBar value={op.coverage4G} color={color} label="4G" />
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-3 mt-1.5 text-[10px] text-gray-500">
                      {op.subscriberCount != null && (
                        <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" />{formatNumber(op.subscriberCount)} abonnés</span>
                      )}
                      {op.siteCount != null && (
                        <span className="flex items-center gap-0.5"><Antenna className="w-2.5 h-2.5" />{formatNumber(op.siteCount)} sites</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Comparison Chart */}
      {ops.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#1e3a5f]" />
              Comparaison Couverture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {/* 4G Comparison */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 mb-1">4G</p>
                {ops.map((op) => {
                  const val = op.coverage4G ?? 0
                  return (
                    <div key={`4g-${op.operatorId}`} className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      <span className="text-[10px] w-8 text-gray-500 truncate">{op.operatorCode}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      </div>
                      <span className="text-[10px] font-medium w-8 text-right">{val}%</span>
                    </div>
                  )
                })}
              </div>
              {/* 3G Comparison */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 mb-1">3G</p>
                {ops.map((op) => {
                  const val = op.coverage3G ?? 0
                  return (
                    <div key={`3g-${op.operatorId}`} className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      <span className="text-[10px] w-8 text-gray-500 truncate">{op.operatorCode}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      </div>
                      <span className="text-[10px] font-medium w-8 text-right">{val}%</span>
                    </div>
                  )
                })}
              </div>
              {/* 2G Comparison */}
              <div>
                <p className="text-[10px] font-semibold text-gray-500 mb-1">2G</p>
                {ops.map((op) => {
                  const val = op.coverage2G ?? 0
                  return (
                    <div key={`2g-${op.operatorId}`} className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      <span className="text-[10px] w-8 text-gray-500 truncate">{op.operatorCode}</span>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                      </div>
                      <span className="text-[10px] font-medium w-8 text-right">{val}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Infrastructure Summary */}
      {ops.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Antenna className="h-4 w-4 text-[#1e3a5f]" />
              Infrastructure Réseau
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total sites/antennes</span>
                <span className="text-sm font-bold">{formatNumber(totalSites)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total abonnés</span>
                <span className="text-sm font-bold">{formatNumber(totalSubs)}</span>
              </div>
              {/* Sites per operator */}
              <div className="mt-2 pt-2 border-t">
                <p className="text-[10px] text-gray-500 mb-1">Sites par opérateur</p>
                {ops.map((op) => (
                  <div key={`sites-${op.operatorId}`} className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888' }} />
                    <span className="text-[10px] text-gray-600 w-20 truncate">{op.operatorCode}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{
                        width: totalSites > 0 ? `${((op.siteCount ?? 0) / totalSites) * 100}%` : '0%',
                        backgroundColor: OPERATOR_COLORS[op.operatorCode] ?? '#888'
                      }} />
                    </div>
                    <span className="text-[10px] font-medium w-10 text-right">{formatNumber(op.siteCount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────

interface GuineaMapProps {
  regions?: RegionData[]
  selectedRegion: RegionData | null
  onSelectRegion: (region: RegionData) => void
}

export default function GuineaMap({ regions = FALLBACK_REGIONS, selectedRegion, onSelectRegion }: GuineaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const [mapView, setMapView] = useState<MapView>('regions')
  const [coverageType, setCoverageType] = useState<CoverageType>('4G')
  const [visibleOperators, setVisibleOperators] = useState<Set<string>>(new Set(Object.keys(OPERATOR_COLORS)))

  const toggleOperator = (code: string) => {
    setVisibleOperators((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  // Computed stats
  const sortedByQos = useMemo(() => [...regions].sort((a, b) => b.qosScore - a.qosScore), [regions])
  const bestRegions = sortedByQos.slice(0, 3)
  const worstRegions = sortedByQos.slice(-3).reverse()

  const totalOperators = regions.reduce((sum, r) => sum + r.activeOperators, 0)
  const totalComplaints = regions.reduce((sum, r) => sum + r.complaintCount, 0)
  const avgQos = regions.reduce((sum, r) => sum + r.qosScore, 0) / regions.length
  const avgCoverage = regions.reduce((sum, r) => sum + r.coverage, 0) / regions.length

  // Compute coverage key for scaling in coverage view
  const coverageKey: keyof RegionOperatorData = coverageType === '4G' ? 'coverage4G' : coverageType === '3G' ? 'coverage3G' : 'coverage2G'

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Map Container */}
      <div className="flex-1 relative rounded-xl overflow-hidden border shadow-sm" style={{ minHeight: '500px' }}>
        {/* Tab control at top of map */}
        <div className="absolute top-3 left-3 z-20">
          <Tabs value={mapView} onValueChange={(v) => setMapView(v as MapView)}>
            <TabsList className="bg-white/95 backdrop-blur-sm shadow-md">
              <TabsTrigger value="regions" className="text-xs px-3">
                <Activity className="w-3.5 h-3.5 mr-1" />
                Régions
              </TabsTrigger>
              <TabsTrigger value="operators" className="text-xs px-3">
                <Building2 className="w-3.5 h-3.5 mr-1" />
                Opérateurs
              </TabsTrigger>
              <TabsTrigger value="coverage" className="text-xs px-3">
                <Radio className="w-3.5 h-3.5 mr-1" />
                Couverture
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Coverage type selector */}
        {mapView === 'coverage' && (
          <div className="absolute top-14 left-3 z-20">
            <Select value={coverageType} onValueChange={(v) => setCoverageType(v as CoverageType)}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-white/95 backdrop-blur-sm shadow-md border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4G">Couverture 4G</SelectItem>
                <SelectItem value="3G">Couverture 3G</SelectItem>
                <SelectItem value="2G">Couverture 2G</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <MapContainer
          center={[10.0, -10.5]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', minHeight: '500px' }}
          className="z-0"
        >
          <MapResizeHandler />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ── Vue Régions ─────────────────────── */}
          {mapView === 'regions' && regions.map((region) => {
            const color = getQosColor(region.qosScore)
            const isSelected = selectedRegion?.code === region.code
            const isHovered = hoveredRegion === region.code
            const radius = Math.max(12, Math.min(30, region.complaintCount * 2.5 + 10))

            return (
              <CircleMarker
                key={region.code}
                center={[region.lat, region.lng]}
                radius={isSelected ? radius + 5 : isHovered ? radius + 3 : radius}
                pathOptions={{
                  color: isSelected ? '#1e3a5f' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.7 : isHovered ? 0.6 : 0.45,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectRegion(region),
                  mouseover: () => setHoveredRegion(region.code),
                  mouseout: () => setHoveredRegion(null),
                }}
              >
                <Popup>
                  <RegionPopupContent region={region} />
                </Popup>
              </CircleMarker>
            )
          })}

          {/* ── Vue Opérateurs ──────────────────── */}
          {mapView === 'operators' && regions.map((region) => {
            const regionOps = (region.operators ?? []).filter((o) => visibleOperators.has(o.operatorCode))
            if (regionOps.length === 0) return null

            return (
              <React.Fragment key={`ops-${region.code}`}>
                {regionOps.map((op, idx) => {
                  const [offLat, offLng] = getOperatorOffset(idx, regionOps.length)
                  const color = OPERATOR_COLORS[op.operatorCode] ?? '#888'
                  const isSelected = selectedRegion?.code === region.code
                  const radius = Math.max(8, Math.min(18, (op.subscriberCount ?? 10000) / 100000 + 6))

                  return (
                    <CircleMarker
                      key={`${region.code}-${op.operatorCode}`}
                      center={[region.lat + offLat, region.lng + offLng]}
                      radius={isSelected ? radius + 3 : radius}
                      pathOptions={{
                        color: '#fff',
                        fillColor: color,
                        fillOpacity: isSelected ? 0.8 : 0.6,
                        weight: 2,
                      }}
                      eventHandlers={{
                        click: () => onSelectRegion(region),
                        mouseover: () => setHoveredRegion(region.code),
                        mouseout: () => setHoveredRegion(null),
                      }}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px]">
                          <h3 className="font-bold text-base mb-1" style={{ color: '#1e3a5f' }}>
                            {region.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-semibold text-sm">{op.operatorName}</span>
                          </div>
                          <div className="space-y-1.5 text-sm">
                            {op.qosScore != null && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Score QoS</span>
                                <Badge style={{ backgroundColor: getQosColor(op.qosScore), color: 'white', fontSize: '11px' }}>
                                  {op.qosScore}%
                                </Badge>
                              </div>
                            )}
                            <MiniCoverageBar value={op.coverage2G} color={color} label="2G" />
                            <MiniCoverageBar value={op.coverage3G} color={color} label="3G" />
                            <MiniCoverageBar value={op.coverage4G} color={color} label="4G" />
                            {op.subscriberCount != null && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Abonnés</span>
                                <span className="font-semibold">{formatNumber(op.subscriberCount)}</span>
                              </div>
                            )}
                            {op.siteCount != null && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">Sites/antennes</span>
                                <span className="font-semibold">{formatNumber(op.siteCount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </React.Fragment>
            )
          })}

          {/* ── Vue Couverture ─────────────────── */}
          {mapView === 'coverage' && regions.map((region) => {
            const ops = region.operators ?? []
            // Average coverage of the selected type across operators
            const coverageValues = ops.map((o) => o[coverageKey] as number | null).filter((v): v is number => v != null)
            const avgCov = coverageValues.length > 0 ? coverageValues.reduce((a, b) => a + b, 0) / coverageValues.length : 0
            const color = getCoverageColor(avgCov)
            const isSelected = selectedRegion?.code === region.code
            const isHovered = hoveredRegion === region.code
            const radius = Math.max(12, Math.min(35, avgCov * 0.35 + 8))

            return (
              <CircleMarker
                key={`cov-${region.code}`}
                center={[region.lat, region.lng]}
                radius={isSelected ? radius + 5 : isHovered ? radius + 3 : radius}
                pathOptions={{
                  color: isSelected ? '#1e3a5f' : color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.7 : isHovered ? 0.6 : 0.45,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => onSelectRegion(region),
                  mouseover: () => setHoveredRegion(region.code),
                  mouseout: () => setHoveredRegion(null),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-base mb-1" style={{ color: '#1e3a5f' }}>
                      {region.name}
                    </h3>
                    <div className="mb-2">
                      <Badge style={{ backgroundColor: color, color: 'white', fontSize: '11px' }}>
                        Couverture {coverageType} : {avgCov.toFixed(1)}%
                      </Badge>
                    </div>
                    {ops.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-gray-500">Par opérateur</p>
                        {ops.map((op) => {
                          const val = op[coverageKey] as number | null
                          const opColor = OPERATOR_COLORS[op.operatorCode] ?? '#888'
                          return (
                            <div key={op.operatorId}>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opColor }} />
                                <span className="text-xs font-medium">{op.operatorName}</span>
                                {val != null && (
                                  <span className="text-xs font-semibold ml-auto">{val}%</span>
                                )}
                              </div>
                              {val != null && (
                                <div className="pl-4">
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full" style={{ width: `${val}%`, backgroundColor: opColor }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {ops.length === 0 && (
                      <p className="text-xs text-gray-400">Aucun opérateur dans cette région</p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Legends (outside MapContainer, positioned absolutely) */}
        {mapView === 'regions' && <QosLegend />}
        {mapView === 'operators' && (
          <OperatorLegend visibleOps={visibleOperators} onToggleOp={toggleOperator} />
        )}
        {mapView === 'coverage' && <CoverageLegend />}
      </div>

      {/* Sidebar Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto max-h-[700px]">
        {/* Summary Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#1e3a5f]" />
              Résumé National
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Opérateurs actifs</span>
              </div>
              <span className="text-sm font-bold">{totalOperators}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total plaintes</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{totalComplaints}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">QoS moyen</span>
              </div>
              <span className="text-sm font-bold" style={{ color: getQosColor(avgQos) }}>
                {avgQos.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Signal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Couverture moy.</span>
              </div>
              <span className={`text-sm font-bold ${getCoverageBgClass(avgCoverage)}`}>
                {avgCoverage.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Operators by Region */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1e3a5f]" />
              Opérateurs par Région
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {regions
              .sort((a, b) => b.activeOperators - a.activeOperators)
              .map((region) => (
                <div key={region.code} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate">{region.name}</span>
                    <span className="text-xs font-semibold">{region.activeOperators}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-[#1e3a5f] transition-all"
                      style={{ width: `${(region.activeOperators / 4) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Best Regions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Meilleures Régions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bestRegions.map((region, i) => (
              <div
                key={region.code}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => onSelectRegion(region)}
              >
                <span className="text-xs font-bold text-emerald-600 w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{region.name}</p>
                  <p className="text-[10px] text-muted-foreground">Couverture: {region.coverage}%</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0"
                  style={{ borderColor: '#22c55e', color: '#22c55e' }}
                >
                  {region.qosScore.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Worst Regions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Régions Critiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {worstRegions.map((region) => (
              <div
                key={region.code}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-red-50 cursor-pointer transition-colors border border-red-100"
                onClick={() => onSelectRegion(region)}
              >
                <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{region.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {region.complaintCount} plaintes · {region.coverage}% couverture
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] shrink-0"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                >
                  {region.qosScore.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected Region Detail */}
        {selectedRegion && <RegionDetailPanel region={selectedRegion} />}
      </div>
    </div>
  )
}
