'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ImageUploader } from '@/components/ImageUploader'
import { Alert } from '@/components/Alert'
import { uploadImage } from '@/lib/api'

interface Props {
  /** Called with the new session once the photo is on the server. */
  onUploaded: (sessionId: string) => void
  /** The pitch above the drop zone, hidden where the page already made it. */
  showIntro?: boolean
}

/** The single front door: a photo goes in, a traced session comes out. */
export function CapturePanel({ onUploaded, showIntro = true }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(file: File) {
    setUploading(true)
    setError(null)
    try {
      const result = await uploadImage(file)
      onUploaded(result.session_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="capture-panel">
      {showIntro && (
        <div className="workspace-intro">
          <span className="workspace-eyebrow">A PLACE FOR EVERY TOOL</span>
          <h1>Your tools. A perfect-fit bin.</h1>
          <p>Turn a photo into a custom Gridfinity bin, ready to 3D print. No CAD experience needed.</p>
          <ol className="journey-overview" aria-label="How to create a bin">
            {['Upload a photo', 'Check your tools', 'Design & download'].map((label, index) => (
              <li key={label}><span>{index + 1}</span>{label}</li>
            ))}
          </ol>
        </div>
      )}

      <div data-tour="upload">
        <ImageUploader onUpload={handleUpload} disabled={uploading} />
      </div>

      {uploading && (
        <div className="flex items-center justify-center gap-2 text-text-muted text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {error && (
        <div className="max-w-md mx-auto">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
    </div>
  )
}
