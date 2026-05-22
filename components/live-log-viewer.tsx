'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Trash2, Pause, Play, ChevronDown } from 'lucide-react'
import { Log, LogLevel } from '@/lib/types'
import { cn } from '@/lib/utils'

// --------------- demo log generator ---------------
const DEMO_WALLETS = [
  { short: '0x4f3a…a91c', full: '0x4f3a8b2c1d9e6f7a0b5c3d2e1f0a4b5c6d7e8a91', network: 'Monad' },
  { short: '0x8c7b…ed02', full: '0x8c7b6a5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a02', network: 'Arbitrum' },
  { short: '0x2d3c…1e14', full: '0x2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d14', network: 'Base' },
  { short: '0x9e8d…3a05', full: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e05', network: 'Ethereum' },
]

const DEMO_MESSAGES: { level: LogLevel; msg: (w: (typeof DEMO_WALLETS)[0]) => string }[] = [
  { level: 'info', msg: () => `Submitting swap tx... gasPrice=42 gwei` },
  { level: 'success', msg: () => `Tx confirmed: 0xabc${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')} block ${(18234000 + Math.floor(Math.random() * 9999)).toLocaleString()}` },
  { level: 'warn', msg: () => `Mempool congested, bumping gas +15%` },
  { level: 'error', msg: () => `RPC timeout, rotating endpoint` },
  { level: 'info', msg: () => `Fetching pending nonce...` },
  { level: 'info', msg: () => `Wallet balance: ${(Math.random() * 2 + 0.1).toFixed(4)} ETH` },
  { level: 'success', msg: () => `Gas estimation: ${Math.floor(Math.random() * 40 + 25)} gwei (1.15x multiplier)` },
  { level: 'warn', msg: () => `Replacement tx queued (stuck > 30s), nonce bump +10% gas` },
  { level: 'error', msg: () => `Slippage exceeded 2%, tx reverted` },
  { level: 'info', msg: () => `Starting multi-wallet execution across ${DEMO_WALLETS.length} addresses` },
  { level: 'success', msg: () => `Retry #2 succeeded after exponential backoff` },
  { level: 'warn', msg: () => `maxFeePerGas rising: baseline 30 → 47 gwei, adjusting strategy` },
]

function formatTs(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function generateDemoLog(): Log {
  const wallet = DEMO_WALLETS[Math.floor(Math.random() * DEMO_WALLETS.length)]
  const template = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)]
  return {
    id: `${Date.now()}-${Math.random()}`,
    timestamp: formatTs(),
    level: template.level,
    address: wallet.short,
    network: wallet.network,
    message: template.msg(wallet),
  }
}

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: 'text-slate-300',
  warn: 'text-amber-300',
  error: 'text-rose-300',
  success: 'text-sky-300',
}

const LEVEL_BADGE: Record<LogLevel, string> = {
  info: 'bg-slate-800 text-slate-400 border-slate-700',
  warn: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  error: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  success: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
}

// --------------- component ---------------
interface Props {
  logs?: Log[]
  demo?: boolean
}

const MIN_H = 160
const MAX_H = 600
const DEFAULT_H = 320
const LS_KEY = 'mimo-log-height'

export function LiveLogViewer({ logs: externalLogs, demo = true }: Props) {
  const [internalLogs, setInternalLogs] = useState<Log[]>([])
  const [filter, setFilter] = useState<'all' | LogLevel>('all')
  const [paused, setPaused] = useState(false)
  const [height, setHeight] = useState(DEFAULT_H)
  const [autoScroll, setAutoScroll] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startH: number } | null>(null)

  const logs = externalLogs ?? internalLogs

  // Load persisted height
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setHeight(Math.min(MAX_H, Math.max(MIN_H, parseInt(saved))))
    } catch {}
  }, [])

  // Demo generator
  useEffect(() => {
    if (!demo || externalLogs) return
    // Seed with a few initial logs
    const seed: Log[] = Array.from({ length: 8 }, () => generateDemoLog())
    setInternalLogs(seed)

    const interval = setInterval(() => {
      if (!paused) {
        setInternalLogs((prev) => {
          const next = [...prev, generateDemoLog()]
          return next.length > 500 ? next.slice(-500) : next
        })
      }
    }, 1800)
    return () => clearInterval(interval)
  }, [demo, externalLogs, paused])

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Detect manual scroll up → pause auto-scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    setAutoScroll(atBottom)
  }, [])

  // Resize drag
  const onMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { startY: e.clientY, startH: height }
    e.preventDefault()
  }
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const delta = dragRef.current.startY - e.clientY
      const newH = Math.min(MAX_H, Math.max(MIN_H, dragRef.current.startH + delta))
      setHeight(newH)
    }
    const onUp = () => {
      if (!dragRef.current) return
      try { localStorage.setItem(LS_KEY, String(height)) } catch {}
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [height])

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter)

  const downloadLogs = () => {
    const text = filtered.map((l) => `[${l.timestamp}] [${l.level}] ${l.address} (${l.network}) ${l.message}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'mimo-ops.log'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      {/* Drag resize handle */}
      <div
        className="h-1.5 bg-slate-800 cursor-ns-resize hover:bg-indigo-500/40 transition-colors flex items-center justify-center select-none"
        onMouseDown={onMouseDown}
        title="Drag to resize"
      >
        <div className="w-8 h-0.5 rounded-full bg-slate-700" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className={cn('h-1.5 w-1.5 rounded-full', paused ? 'bg-slate-500' : 'bg-sky-400 animate-pulse')} />
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Live Logs</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-700 text-slate-500">
            {filtered.length}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-6 w-28 text-[11px] bg-slate-900 border-slate-700 text-slate-400 px-2 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all" className="text-xs text-slate-300">All</SelectItem>
              <SelectItem value="info" className="text-xs text-slate-300">Info</SelectItem>
              <SelectItem value="warn" className="text-xs text-amber-300">Warnings</SelectItem>
              <SelectItem value="error" className="text-xs text-rose-300">Errors</SelectItem>
              <SelectItem value="success" className="text-xs text-sky-300">Success</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            onClick={() => { setAutoScroll(true); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }}
            title="Scroll to bottom"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-slate-300 hover:bg-slate-900"
            onClick={downloadLogs}
            title="Download .log"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-500 hover:text-rose-400 hover:bg-slate-900"
            onClick={() => setInternalLogs([])}
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ height }}
        className="overflow-y-auto overflow-x-hidden"
      >
        <div className="p-3 space-y-0.5">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-slate-600 font-mono">
              No log entries
            </div>
          )}
          {filtered.map((log) => (
            <div
              key={log.id}
              className={cn('flex items-start gap-2 font-mono text-[11px] leading-relaxed px-1 rounded hover:bg-slate-900/50 transition-colors', LEVEL_CLASS[log.level])}
            >
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={cn('shrink-0 text-[10px] px-1.5 py-px rounded border font-semibold', LEVEL_BADGE[log.level])}>
                {log.level.toUpperCase()}
              </span>
              <span className="shrink-0 bg-slate-900 text-slate-400 px-1.5 py-px rounded text-[10px] border border-slate-800">
                {log.address}
              </span>
              <span className="shrink-0 text-slate-600 text-[10px]">({log.network})</span>
              <span className="min-w-0 break-words">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-scroll nudge */}
      {!autoScroll && (
        <div
          className="flex items-center justify-center gap-1.5 py-1.5 bg-indigo-500/10 border-t border-indigo-500/20 text-xs text-indigo-300 cursor-pointer hover:bg-indigo-500/15 transition-colors"
          onClick={() => { setAutoScroll(true); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }}
        >
          <ChevronDown className="h-3 w-3" /> Auto-scroll paused — click to resume
        </div>
      )}
    </div>
  )
}
