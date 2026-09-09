'use client'

import { useParams } from 'next/navigation'
import { StepBar } from '@/components/StepBar'
import { BinWorkspace } from '@/components/BinWorkspace'

/** A saved bin on its own page, reached from the library or a shared link. */
export default function BinPage() {
  const params = useParams()

  return (
    <div className="bin-workspace h-[calc(100dvh-44px)] flex flex-col">
      <StepBar steps={['Check photo', 'Check tools', 'Design & download']} current={2} />
      <BinWorkspace binId={params.id as string} />
    </div>
  )
}
