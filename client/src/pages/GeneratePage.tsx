import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import SchemaGenerator from '@/components/SchemaGenerator'
import UrlDiscovery from '@/components/UrlDiscovery'

export default function GeneratePage() {
  const [selectedUrl, setSelectedUrl] = useState('')
  const [autoGenerate, setAutoGenerate] = useState(false)
  const schemaGeneratorRef = useRef<any>(null)
  const [searchParams, setSearchParams] = useSearchParams()

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

          {/* Schema Generator */}
          <div ref={schemaGeneratorRef}>
            <SchemaGenerator selectedUrl={selectedUrl} autoGenerate={autoGenerate} />
          </div>
        </div>
      </div>
    </div>
  )
}
