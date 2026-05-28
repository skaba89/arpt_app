'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Map as MapIcon, AlertTriangle } from 'lucide-react'
import { apiClient, ApiError } from '@/lib/api-client'
import type { RegionData } from '@/components/guinea-map'

const GuineaMap = dynamic(() => import('@/components/guinea-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[500px] bg-muted/30 rounded-xl">
      <div className="text-center space-y-3">
        <MapIcon className="h-10 w-10 text-muted-foreground/50 mx-auto animate-pulse" />
        <p className="text-sm text-muted-foreground">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

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

interface ApiRegion {
  id: string
  name: string
  code: string
  latitude: number
  longitude: number
  population: number | null
  area: number | null
  activeOperators: number
  qosScore: number | null
  complaintCount: number
  coverage: number | null
}

export default function CartePage() {
  const [regions, setRegions] = useState<RegionData[]>(FALLBACK_REGIONS)
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRegions() {
      try {
        setLoading(true)
        const response = await apiClient.get<ApiRegion[]>('/api/regions')
        if (response.success && response.data && response.data.length > 0) {
          const mapped: RegionData[] = response.data.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            lat: r.latitude,
            lng: r.longitude,
            population: r.population ?? undefined,
            area: r.area ?? undefined,
            activeOperators: r.activeOperators,
            qosScore: r.qosScore ?? 0,
            complaintCount: r.complaintCount,
            coverage: r.coverage ?? 0,
          }))
          setRegions(mapped)
        }
        // If API returns empty array, fallback data remains
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Erreur de chargement des données')
        }
        // Fallback data already set
      } finally {
        setLoading(false)
      }
    }
    fetchRegions()
  }, [])

  if (error && regions === FALLBACK_REGIONS) {
    // Show warning but still show map with fallback data
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-[#1e3a5f]" />
            Carte Interactive
          </h1>
          <p className="text-muted-foreground text-sm">
            Couverture réseau, QoS et plaintes par région
          </p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Données de secours affichées</span>
          </div>
        )}
      </div>

      {/* Map */}
      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center space-y-4">
                <Skeleton className="h-10 w-10 rounded-full mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
                <Skeleton className="h-3 w-32 mx-auto" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <GuineaMap
          regions={regions}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />
      )}
    </div>
  )
}
