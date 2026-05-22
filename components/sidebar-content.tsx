'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Code2, Server, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Code2, label: 'Script Generator', href: '/script-generator' },
  { icon: Server, label: 'Worker Nodes', href: '/worker-nodes' },
  { icon: Network, label: 'Proxy & RPC', href: '/proxy-rpc' },
]

export function SidebarContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
          <Network className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-slate-100">MiMo Ops</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Status pill */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2">
          <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs text-slate-400">MiMo LLM: Connected</span>
        </div>
      </div>
    </div>
  )
}
