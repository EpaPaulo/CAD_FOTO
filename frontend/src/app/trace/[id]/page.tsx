'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { StepBar } from '@/components/StepBar'
import { TraceWorkspace, traceStepIndex, traceStepLabels, type TraceStep } from '@/components/TraceWorkspace'

/** The trace on its own page, kept as a deep link into a saved session. */
export default function TracePage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [step, setStep] = useState<TraceStep>('corners')
  const [tracerCount, setTracerCount] = useState(1)

  return (
    <div className="trace-workspace h-[calc(100dvh-44px)] flex flex-col w-full">
      <StepBar
        steps={traceStepLabels(tracerCount)}
        current={traceStepIndex(step, tracerCount)}
        onStepClick={(i) => {
          if (i === 0) setStep('corners')
          else if (tracerCount > 1 && i === 1) setStep('trace')
        }}
      />
      <TraceWorkspace
        sessionId={sessionId}
        step={step}
        onStepChange={setStep}
        onTracerCountChange={setTracerCount}
        onFinished={({ href }) => router.push(href)}
      />
    </div>
  )
}
