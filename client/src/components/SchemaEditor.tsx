import { useRef, useEffect, useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Copy, Check, AlertCircle, CheckCircle, Sun, Moon, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { JsonLdSchema } from '@shared/types'

// Debounce utility
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  line?: number
}

interface SchemaEditorProps {
  schemas: JsonLdSchema[]
  htmlScriptTags?: string
  onSchemaChange?: (schemas: JsonLdSchema[]) => void
  onValidate?: (schemas: JsonLdSchema[]) => Promise<any>
  readonly?: boolean
  height?: string
  className?: string
  highlightedChanges?: string[] // Property paths that were added/changed
}

export default function SchemaEditor({
  schemas,
  htmlScriptTags,
  onSchemaChange,
  onValidate,
  readonly = false,
  height = '400px',
  className,
  highlightedChanges = []
}: SchemaEditorProps) {
  const editorRef = useRef<any>(null)
  const [currentSchemaIndex] = useState(0)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'super'>('idle')
  const [editorValue, setEditorValue] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isUserEditing, setIsUserEditing] = useState(false)

  // Helper function to extract JSON from HTML script tags
  const extractJsonFromHtml = (content: string): string => {
    // Check if content contains <script> tags
    const scriptTagMatch = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)

    if (scriptTagMatch && scriptTagMatch[1]) {
      // Return the content between the script tags
      return scriptTagMatch[1].trim()
    }

    // If no script tags, return the original content (assume it's raw JSON)
    return content.trim()
  }

  useEffect(() => {
    // Only update editor value if user is not actively editing
    // This prevents cursor jumping during auto-save
    if (schemas.length > 0 && !isUserEditing) {
      // If htmlScriptTags is available from API, show that in the editor
      // Otherwise, show raw JSON
      if (htmlScriptTags) {
        setEditorValue(htmlScriptTags)
      } else {
        const currentSchema = schemas[currentSchemaIndex] || schemas[0]
        setEditorValue(JSON.stringify(currentSchema, null, 2))
      }
    }
  }, [schemas, currentSchemaIndex, htmlScriptTags, isUserEditing])

  // Debounced save function
  const debouncedSave = useDebounce((value: string) => {
    setSaveStatus('saving')
    try {
      // Extract JSON from HTML script tags if present
      const jsonContent = extractJsonFromHtml(value)
      const parsedSchema = JSON.parse(jsonContent)
      const updatedSchemas = [...schemas]
      updatedSchemas[currentSchemaIndex] = parsedSchema
      onSchemaChange?.(updatedSchemas)
      setSaveStatus('saved')
      // Reset editing flag and status after save
      setTimeout(() => {
        setSaveStatus('idle')
        setIsUserEditing(false)
      }, 2000)
    } catch (error) {
      setSaveStatus('error')
      // Reset editing flag and status after error
      setTimeout(() => {
        setSaveStatus('idle')
        setIsUserEditing(false)
      }, 3000)
    }
  }, 3000) // 3 second delay

  const handleEditorChange = (value: string | undefined) => {
    if (!value || readonly) return

    setEditorValue(value)
    setIsUserEditing(true)

    // Trigger debounced save
    debouncedSave(value)
  }

  const validateCurrentSchema = async () => {
    if (!onValidate || !editorValue) return

    setIsValidating(true)
    try {
      // Extract JSON from HTML script tags if present
      const jsonContent = extractJsonFromHtml(editorValue)
      const parsedSchema = JSON.parse(jsonContent)
      const result = await onValidate([parsedSchema])

      if (result.data && result.data.results) {
        const errors = result.data.results[0]?.errors || []
        const warnings = result.data.results[0]?.warnings || []
        setValidationErrors([...errors, ...warnings])
      }
    } catch (error) {
      setValidationErrors([{
        field: 'json',
        message: 'Invalid JSON syntax',
        severity: 'error'
      }])
    } finally {
      setIsValidating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      // Copy whatever is currently displayed in the editor
      // If htmlScriptTags exists, it will copy the HTML version
      // Otherwise, it copies the raw JSON
      await navigator.clipboard.writeText(editorValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const copyImplementationCode = async () => {
    // Use htmlScriptTags from API if available, otherwise fallback to manual generation
    const implementationCode = htmlScriptTags || `<!-- Add this to your website's <head> section -->
<script type="application/ld+json">
${schemas.length === 1
  ? JSON.stringify(schemas[0], null, 2)
  : JSON.stringify(schemas, null, 2)
}
</script>`

    try {
      // Stage 1: Copying...
      setCopyState('copying')

      // Brief delay to show "Copying..." state
      await new Promise(resolve => setTimeout(resolve, 300))

      // Perform the copy
      await navigator.clipboard.writeText(implementationCode)

      // Stage 2: Copied! 🎉
      setCopyState('copied')

      // Wait 1 second before showing super message
      setTimeout(() => {
        // Stage 3: You're super!
        setCopyState('super')

        // Reset after 2 seconds
        setTimeout(() => {
          setCopyState('idle')
        }, 2000)
      }, 1000)
    } catch (error) {
      console.error('Failed to copy implementation code:', error)
      setCopyState('idle')
    }
  }

  const editorOptions = {
    readOnly: readonly,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    automaticLayout: true,
    fontSize: 14,
    lineHeight: 20,
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: true,
    formatOnType: true
  }

  const errorCount = validationErrors.filter(e => e.severity === 'error').length
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length

  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      {/* AI Refinement Changes Banner */}
      {highlightedChanges.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-2">
                ✨ AI Refinement Applied - {highlightedChanges.length} improvement{highlightedChanges.length !== 1 ? 's' : ''}
              </h4>
              <div className="space-y-1">
                {highlightedChanges.map((change, index) => (
                  <div key={index} className="text-xs text-green-800 flex items-center">
                    <span className="text-green-500 mr-2">→</span>
                    <span className="font-medium">{change}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-700 mt-2 italic">
                New properties are highlighted in the editor below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-muted/30 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="font-medium">Schema Editor</h3>

            {/* Save Status Indicator */}
            {!readonly && (
              <div className="flex items-center text-xs">
                {saveStatus === 'saving' && (
                  <span className="text-muted-foreground flex items-center">
                    <div className="animate-spin rounded-full h-2 w-2 border-b border-primary mr-1.5" />
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-green-600 flex items-center">
                    <Check className="h-3 w-3 mr-1" />
                    Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-red-600 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Invalid JSON
                  </span>
                )}
              </div>
            )}

            {/* Validation Status */}
            <div className="flex items-center space-x-2">
              {isValidating ? (
                <div className="flex items-center text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2" />
                  Validating...
                </div>
              ) : (
                <>
                  {errorCount > 0 && (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errorCount} error{errorCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center text-sm text-yellow-600">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {warningCount} warning{warningCount !== 1 ? 's' : ''}
                    </div>
                  )}
                  {errorCount === 0 && warningCount === 0 && validationErrors.length === 0 && editorValue && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!readonly && onValidate && (
              <button
                onClick={validateCurrentSchema}
                disabled={isValidating || !editorValue}
                className="px-3 py-1 text-xs rounded border border-border hover:bg-accent transition-colors disabled:opacity-50"
              >
                Validate
              </button>
            )}

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center px-3 py-1 text-xs rounded border border-border hover:bg-accent transition-colors"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </button>

            <button
              onClick={copyImplementationCode}
              disabled={copyState !== 'idle'}
              className={cn(
                "flex items-center px-3 py-1 text-xs rounded transition-all",
                copyState === 'idle' && "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105",
                copyState === 'copying' && "bg-primary/80 text-primary-foreground",
                copyState === 'copied' && "bg-success text-success-foreground scale-105",
                copyState === 'super' && "bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white scale-105"
              )}
            >
              {copyState === 'idle' && <Copy className="h-3 w-3 mr-1" />}
              {copyState === 'copying' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {copyState === 'copied' && <Check className="h-3 w-3 mr-1" />}
              {copyState === 'super' && <Sparkles className="h-3 w-3 mr-1" />}

              {copyState === 'idle' && 'Copy Schema'}
              {copyState === 'copying' && 'Copying...'}
              {copyState === 'copied' && 'Copied! 🎉'}
              {copyState === 'super' && "You're super!"}
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div style={{ height }}>
        <Editor
          language={htmlScriptTags ? "html" : "json"}
          value={editorValue}
          onChange={handleEditorChange}
          options={editorOptions}
          theme={isDarkMode ? "vs-dark" : "light"}
          onMount={(editor) => {
            editorRef.current = editor
          }}
        />
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border-t border-border bg-muted/20 p-4 max-h-32 overflow-y-auto">
          <div className="space-y-1">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start space-x-2 text-xs',
                  error.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                )}
              >
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">{error.field}:</span> {error.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Instructions */}
      {readonly && schemas.length > 0 && (
        <div className="border-t border-border bg-muted/10 p-4">
          <h4 className="text-sm font-medium mb-2">Implementation Instructions</h4>
          <p className="text-xs text-muted-foreground mb-2">
            Copy the schema above and add it to your website's &lt;head&gt; section:
          </p>
          <code className="text-xs bg-muted/50 px-2 py-1 rounded block">
            &lt;script type="application/ld+json"&gt;{'\n'}
            {schemas.length === 1 ? '  {schema}' : '  [{schemas}]'}{'\n'}
            &lt;/script&gt;
          </code>
        </div>
      )}
    </div>
  )
}