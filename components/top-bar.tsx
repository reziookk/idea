'use client'

import { usePathname } from 'next/navigation'
import { RefreshCw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useWorkersStore } from '@/stores/workers'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/script-generator': 'Script Generator',
  '/worker-nodes': 'Worker Nodes',
  '/proxy-rpc': 'Proxy & RPC',
}

export function TopBar() {
  const pathname = usePathname()
  const title = ROUTE_TITLES[pathname] ?? 'MiMo Ops'
  const workers = useWorkersStore((s) => s.workers)
  const walletCount = workers.length

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      {/* Left: page title (with padding for mobile hamburger) */}
      <div className="lg:pl-0 pl-10">
        <h1 className="text-sm font-semibold text-slate-100">{title}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-900 gap-1.5"
          onClick={() => toast.info('Syncing RPC endpoints…')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Sync RPCs</span>
        </Button>
        <Badge variant="secondary" className="gap-1.5 bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800">
          <Wallet className="h-3 w-3" />
          {walletCount} wallets
        </Badge>
      </div>
    </header>
  )
}
