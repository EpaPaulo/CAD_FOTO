'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, Camera, Check } from 'lucide-react'
import { PhotoIllustration } from './OnboardingIllustrations'

interface Props { onUpload: (file: File) => void; disabled?: boolean }

export function ImageUploader({ onUpload, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  function submit(file?: File) {
    if (!file || disabled) return
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      setError('Choose a photo, such as a JPG, PNG, or HEIC file.')
      return
    }
    setError(null)
    onUpload(file)
  }
  return (
    <section className="capture-card">
      <div className={`capture-dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true) }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }}
        onDrop={event => { event.preventDefault(); setDragging(false); submit(event.dataTransfer.files[0]) }} aria-busy={disabled}>
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif" aria-label="Choose a tool photo" className="hidden"
          onChange={event => { submit(event.target.files?.[0]); event.target.value = '' }} disabled={disabled} />
        <div className="capture-icon">{disabled ? <Loader2 className="animate-spin" /> : <Upload />}</div>
        <h2>{disabled ? 'Preparing your photo…' : dragging ? 'Drop your photo here' : 'Start with a photo'}</h2>
        <p>{disabled ? 'Finding the paper so your tools will be the right size.' : 'Drag a photo here, or choose one from your device.'}</p>
        <button type="button" className="btn-primary capture-button" onClick={() => inputRef.current?.click()} disabled={disabled}>
          {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {disabled ? 'Uploading…' : 'Choose photo'}
        </button>
        <span className="text-xs text-text-secondary">JPG, PNG, HEIC & other image formats</span>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </div>
      <aside className="capture-guide">
        <div className="capture-example"><PhotoIllustration /></div>
        <div>
          <div className="capture-guide-title"><Camera className="h-4 w-4 text-accent" /> A good photo makes a great fit</div>
          <ul className="space-y-2 text-sm text-text-secondary">
            {['Place tools apart on a sheet of paper.', 'Keep all four paper corners visible.', 'Take the photo straight from above.'].map(tip => <li key={tip} className="flex gap-2"><Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />{tip}</li>)}
          </ul>
          <p className="capture-note">A4, Letter, A3 or Tabloid. The paper gives us the scale for a precise fit.</p>
        </div>
      </aside>
    </section>
  )
}
