'use client'

import { Suspense, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { CapturePanel } from '@/components/CapturePanel'
import { StepBar } from '@/components/StepBar'
import { BinWorkspace } from '@/components/BinWorkspace'
import {
  TraceWorkspace,
  traceStepIndex,
  traceStepLabels,
  type TraceFinished,
  type TraceStep,
} from '@/components/TraceWorkspace'
import { designerUrl, readDesignerRoute } from '@/lib/designerRoute'
import { cn } from '@/lib/utils'

/**
 * One screen from photo to printable bin. Checking the paper, picking tools,
 * and designing the bin all happen here; the URL follows along so a reload or
 * a shared link reopens the same work.
 */
function Designer() {
  const router = useRouter()
  const initial = readDesignerRoute(useSearchParams())

  const [sessionId, setSessionId] = useState<string | undefined>(initial.sessionId)
  const [binId, setBinId] = useState<string | undefined>(initial.binId)
  const [step, setStep] = useState<TraceStep>('corners')
  const [tracerCount, setTracerCount] = useState(1)

  const phase = binId ? 'design' : sessionId ? 'trace' : 'upload'

  const handleUploaded = useCallback((newSessionId: string) => {
    setSessionId(newSessionId)
    setStep('corners')
    window.history.replaceState(null, '', designerUrl({ sessionId: newSessionId }))
  }, [])

  const handleFinished = useCallback(({ destination, href, binId: created }: TraceFinished) => {
    // saving to the library leaves the designer; a new bin stays on this page
    if (destination === 'library' || !created) {
      router.push(href)
      return
    }
    setBinId(created)
    window.history.replaceState(null, '', designerUrl({ sessionId, binId: created }))
  }, [router, sessionId])

  if (phase === 'upload') {
    return (
      <div className="designer-start">
        <CapturePanel onUploaded={handleUploaded} />
      </div>
    )
  }

  const steps = traceStepLabels(tracerCount)

  return (
    <div className={cn(
      'h-[calc(100dvh-44px)] flex flex-col w-full',
      phase === 'design' ? 'bin-workspace' : 'trace-workspace',
    )}>
      <StepBar
        steps={steps}
        current={phase === 'design' ? steps.length - 1 : traceStepIndex(step, tracerCount)}
        onStepClick={(i) => {
          if (phase === 'design') return
          if (i === 0) setStep('corners')
          else if (tracerCount > 1 && i === 1) setStep('trace')
        }}
      />
      {phase === 'design' && binId ? (
        <BinWorkspace binId={binId} />
      ) : (
        <TraceWorkspace
          sessionId={sessionId!}
          step={step}
          onStepChange={setStep}
          onTracerCountChange={setTracerCount}
          onFinished={handleFinished}
        />
      )}
    </div>
  )
}

export default function DesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12 gap-2 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Opening the designer...</span>
        </div>
      }
    >
      <Designer />
    </Suspense>
  )
}
