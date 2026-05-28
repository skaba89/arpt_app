'use client'

import React, { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  Building2,
  MessageSquareWarning,
  Signal,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react'

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
}

const FALLBACK_REGIONS: RegionData[] = [
  { name: "Conakry", code: "CK", lat: 9.5092, lng: -13.7122, population: 2076609, area: 450, activeOperators: 4, qosScore: 83.8, complaintCount: 12, coverage: 95 },
  { name: "Kindia", code: "KD", lat: 10.0667, lng: -12.8667, population: 1843043, area: 28533, activeOperators: 3, qosScore: 75.2, complaintCount: 5, coverage: 78 },
  { name: "Boké", code: "BK", lat: 11.1833, lng: -14.2833, population: 1098475, area: 31118, activeOperators: 2, qosScore: 62.5, complaintCount: 8, coverage: 55 },
  { name: "Labé", code: "LB", lat: 11.3167, lng: -12.3000, population: 1248012, area: 22729, activeOperators: 2, qosScore: 58.3, complaintCount: 6, coverage: 50 },
  { name: "Mamou", code: "MM", lat: 10.3833, lng: -12.0833, population: 1034284, area: 8038, activeOperators: 2, qosScore: 65.1, complaintCount: 4, coverage: 62 },
  { name: "Faranah", code: "FR", lat: 10.0333, lng: -10.7500, population: 939806, area: 35581, activeOperators: 1, qosScore: 45.7, complaintCount: 9, coverage: 35 },
  { name: "Kankan", code: "KN", lat: 10.3833, lng: -9.3000, population: 1999307, area: 72256, activeOperators: 3, qosScore: 68.4, complaintCount: 7, coverage: 70 },
  { name: "N'Zérékoré", code: "NZ", lat: 7.7500, lng: -8.8167, population: 1865061, area: 38841, activeOperators: 2, qosScore: 52.1, complaintCount: 11, coverage: 42 },
]

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
  if (coverage >= 80) return 'text-emerald-600'
  if (coverage >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function MapResizeHandler() {
  const map = useMap()
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])
  return null
}

interface GuineaMapProps {
  regions?: RegionData[]
  selectedRegion: RegionData | null
  onSelectRegion: (region: RegionData) => void
}

export default function GuineaMap({ regions = FALLBACK_REGIONS, selectedRegion, onSelectRegion }: GuineaMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const sortedByQos = [...regions].sort((a, b) => b.qosScore - a.qosScore)
  const bestRegions = sortedByQos.slice(0, 3)
  const worstRegions = sortedByQos.slice(-3).reverse()

  const totalOperators = regions.reduce((sum, r) => sum + r.activeOperators, 0)
  const totalComplaints = regions.reduce((sum, r) => sum + r.complaintCount, 0)
  const avgQos = regions.reduce((sum, r) => sum + r.qosScore, 0) / regions.length
  const avgCoverage = regions.reduce((sum, r) => sum + r.coverage, 0) / regions.length

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Map Container */}
      <div className="flex-1 relative rounded-xl overflow-hidden border shadow-sm" style={{ minHeight: '500px' }}>
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
          {regions.map((region) => {
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
                  <div className="p-1 min-w-[200px]">
                    <h3 className="font-bold text-base mb-2" style={{ color: '#1e3a5f' }}>
                      {region.name}
                    </h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Score QoS</span>
                        <Badge
                          style={{
                            backgroundColor: color,
                            color: 'white',
                            fontSize: '11px',
                          }}
                        >
                          {region.qosScore.toFixed(1)}% — {getQosLabel(region.qosScore)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Opérateurs</span>
                        <span className="font-semibold">{region.activeOperators}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Plaintes</span>
                        <span className="font-semibold">{region.complaintCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Couverture</span>
                        <span className="font-semibold">{region.coverage}%</span>
                      </div>
                      {region.population && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Population</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('fr-FR').format(region.population)}
                          </span>
                        </div>
                      )}
                      {region.area && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Superficie</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('fr-FR').format(region.area)} km²
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>

        {/* Legend overlay */}
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
              <span className={`text-sm font-bold ${getCoverageColor(avgCoverage)}`}>
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
        {selectedRegion && (
          <Card className="border-[#1e3a5f] border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Signal className="h-4 w-4 text-[#1e3a5f]" />
                {selectedRegion.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">QoS</p>
                  <p className="text-sm font-bold" style={{ color: getQosColor(selectedRegion.qosScore) }}>
                    {selectedRegion.qosScore.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Couverture</p>
                  <p className={`text-sm font-bold ${getCoverageColor(selectedRegion.coverage)}`}>
                    {selectedRegion.coverage}%
                  </p>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Opérateurs</p>
                  <p className="text-sm font-bold">{selectedRegion.activeOperators}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Plaintes</p>
                  <p className="text-sm font-bold text-orange-600">{selectedRegion.complaintCount}</p>
                </div>
              </div>
              {selectedRegion.population && (
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Population</p>
                  <p className="text-sm font-bold">
                    {new Intl.NumberFormat('fr-FR').format(selectedRegion.population)} hab.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
