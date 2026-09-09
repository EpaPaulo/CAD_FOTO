'use client'

import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { SettingsPopover } from '@/components/SettingsPopover'
import { ThemeToggle } from '@/components/ThemeToggle'
import { GuidedTour } from '@/components/GuidedTour'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { IconButton } from '@/components/IconButton'
import { AccountMenu } from '@/components/AccountMenu'
import { AuthGate } from '@/components/AuthGate'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())
  const [showHelp, setShowHelp] = useState(false)
  const pathname = usePathname()

  const isFullBleed = /^\/(trace|tools|bins|stations)\//.test(pathname)

  return (
    <html lang="en">
      <head>
        <title>TraceCAT</title>
        <meta name="description" content="Turn a photo of your tools into a custom Gridfinity bin, ready to 3D print." />
        <link rel="icon" type="image/png" href="/logo.png" />
      </head>
      <body className="bg-base text-text-primary min-h-screen">
        <QueryClientProvider client={queryClient}>
          <AuthGate>
            <header className="h-11 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
              <div className="h-full px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-text-primary hover:opacity-80 flex-shrink-0">
                  <img src="/logo.png" alt="" className="w-7 h-7" />
                  <span className="font-display text-[15px] font-semibold tracking-[-0.4px]">
                    Trace<span className="text-accent">CAT</span>
                  </span>
                </Link>
                <div className="flex items-center gap-0.5">
                  <ThemeToggle />
                  <IconButton onClick={() => setShowHelp(true)} title="How it works">
                    <HelpCircle className="w-4 h-4" />
                  </IconButton>
                  <SettingsPopover />
                  <div id="account-slot">
                    <AccountMenu />
                  </div>
                </div>
              </div>
            </header>
            <main className={isFullBleed ? '' : 'px-4 py-4'}>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <GuidedTour open={showHelp} onClose={() => setShowHelp(false)} />
          </AuthGate>
        </QueryClientProvider>
      </body>
    </html>
  )
}
