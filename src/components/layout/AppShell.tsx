import { ReactNode } from 'react'
import { TitleBar } from './TitleBar'
import { ActiveSessionController } from '@/components/features/session-controller'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex flex-col h-screen bg-background rounded-2xl overflow-hidden border border-surface/50">
      <TitleBar />
      <ActiveSessionController />
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {children}
      </main>
    </div>
  )
}
