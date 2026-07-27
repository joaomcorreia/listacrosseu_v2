"use client";

import { useEffect, useState } from 'react'
import { fetchDebugListingsSample, type DebugInfo } from '@/lib/api/listings'

export default function DebugBanner() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      setLoading(false)
      return
    }

    const loadDebugInfo = async () => {
      try {
        const info = await fetchDebugListingsSample()
        setDebugInfo(info)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load debug info')
      } finally {
        setLoading(false)
      }
    }

    loadDebugInfo()
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (loading) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 text-sm">
        🔄 Loading debug info...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">
        ❌ Debug API Error: {error}
      </div>
    )
  }

  if (!debugInfo) {
    return null
  }

  return (
    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-2 text-sm">
      🧱 DEV MODE | 
      📊 Listings: {debugInfo.debug_info.total_listings.toLocaleString()} | 
      🌍 Countries: {debugInfo.debug_info.total_countries} | 
      🏙️ Cities: {debugInfo.debug_info.total_cities} | 
      🏷️ Categories: {debugInfo.debug_info.total_categories} |
      📋 Sample: {debugInfo.count} records
    </div>
  )
}
