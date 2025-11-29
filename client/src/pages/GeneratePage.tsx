import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SchemaGenerator from '@/components/SchemaGenerator'
import UrlDiscovery from '@/components/UrlDiscovery'
import OrganizationPromoBanner from '@/components/OrganizationPromoBanner'
import { apiService } from '@/services/api'

export default function GeneratePage() {
  const [selectedUrl, setSelectedUrl] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(false)
  const schemaGeneratorRef = useRef<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Fetch organizations to determine if promo banner should show
  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiService.listOrganizations()
  })

  const hasOrganizations = orgsData?.data && orgsData.data.length > 0

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Generate Schema'
  }, [])

  // Handle URL from query parameters
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const autoParam = searchParams.get('auto')

    if (urlParam) {
      setSelectedUrl(urlParam)
      if (autoParam === 'true') {
        setAutoGenerate(true)
        // Scroll to schema generator
        setTimeout(() => {
          if (schemaGeneratorRef.current) {
            schemaGeneratorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          // Reset autoGenerate after a brief moment
          setTimeout(() => setAutoGenerate(false), 500)
        }, 100)
      }
      // Clear query parameters
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleUrlSelect = (url: string) => {
    // Set the URL and trigger generation
    setSelectedUrl(url)
    setAutoGenerate(true)

    // Scroll to schema generator
    if (schemaGeneratorRef.current) {
      schemaGeneratorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    // Trigger generation after a short delay to allow UI update
    setTimeout(() => {
      setSelectedUrl('') // Reset after passing to SchemaGenerator
      setAutoGenerate(false) // Reset autoGenerate flag
    }, 100)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8 p-6">
          {/* URL Discovery */}
          <UrlDiscovery onUrlSelect={handleUrlSelect} />

          {/* Organization Promo Banner - show when user has no organizations */}
          {!hasOrganizations && !orgsLoading && <OrganizationPromoBanner />}

          {/* Schema Generator */}
          <div ref={schemaGeneratorRef}>
            <SchemaGenerator selectedUrl={selectedUrl} autoGenerate={autoGenerate} />
          </div>
        </div>
      </div>
    </div>
  )
}
