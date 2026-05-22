'use client'

import { Copy, MoreHorizontal, ExternalLink } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useWorkersStore } from '@/stores/workers'
import { WorkerNode, WorkerStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

// --------------- status badge config ---------------
const STATUS_CONFIG: Record<WorkerStatus, { label: string; className: string; dot?: boolean }> = {
  idle: { label: 'Idle', className: 'bg-slate-800 text-slate-400 border-slate-700' },
  running: { label: 'Running', className: 'bg-sky-500/10 text-sky-300 border-sky-500/20', dot: true },
  success: { label: 'Success', className: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  failed: { label: 'Failed', className: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
}

const NETWORK_CONFIG: Record<string, string> = {
  Monad: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  Arbitrum: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  Base: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Ethereum: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  Optimism: 'bg-red-500/10 text-red-300 border-red-500/20',
  Polygon: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
}

function truncateAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function truncateTx(tx: string) {
  if (!tx || tx === '—') return '—'
  return `${tx.slice(0, 8)}…${tx.slice(-6)}`
}

interface WorkerTableProps {
  workers?: WorkerNode[]
  compact?: boolean
}

export function WorkerTable({ workers: propWorkers, compact = false }: WorkerTableProps) {
  const storeWorkers = useWorkersStore((s) => s.workers)
  const setWorkerStatus = useWorkersStore((s) => s.setWorkerStatus)
  const toggleSelect = useWorkersStore((s) => s.toggleSelect)
  const selectAll = useWorkersStore((s) => s.selectAll)
  const removeWorker = useWorkersStore((s) => s.removeWorker)

  const workers = propWorkers ?? storeWorkers
  const allSelected = workers.length > 0 && workers.every((w) => w.selected)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    toast.success(`Copied ${label}`)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="w-8">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => selectAll(!!checked)}
                className="border-slate-600"
              />
            </TableHead>
            <TableHead className="text-slate-400 text-xs font-medium">Wallet</TableHead>
            <TableHead className="text-slate-400 text-xs font-medium">Network</TableHead>
            {!compact && <TableHead className="text-slate-400 text-xs font-medium">Proxy IP</TableHead>}
            <TableHead className="text-slate-400 text-xs font-medium">Task</TableHead>
            <TableHead className="text-slate-400 text-xs font-medium">Status</TableHead>
            <TableHead className="text-slate-400 text-xs font-medium">Last Tx</TableHead>
            {!compact && <TableHead className="text-slate-400 text-xs font-medium">Gas (gwei)</TableHead>}
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => {
            const statusCfg = STATUS_CONFIG[worker.status]
            const networkCls = NETWORK_CONFIG[worker.network] ?? 'bg-slate-800 text-slate-300 border-slate-700'
            return (
              <TableRow key={worker.id} className="border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                <TableCell>
                  <Checkbox
                    checked={!!worker.selected}
                    onCheckedChange={() => toggleSelect(worker.id)}
                    className="border-slate-600"
                  />
                </TableCell>
                {/* Wallet */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-300">{truncateAddr(worker.address)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-slate-600 hover:text-slate-400 hover:bg-transparent"
                      onClick={() => copyToClipboard(worker.address, 'address')}
                    >
                      <Copy className="h-2.5 w-2.5" />
                    </Button>
                  </div>
                </TableCell>
                {/* Network */}
                <TableCell>
                  <Badge variant="outline" className={cn('text-[10px] font-medium', networkCls)}>
                    {worker.network}
                  </Badge>
                </TableCell>
                {/* Proxy */}
                {!compact && (
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger render={<span className="font-mono text-[11px] text-slate-500 cursor-default">{worker.proxyIp}:{worker.proxyPort}</span>} />
                      <TooltipContent className="bg-slate-900 border-slate-700 text-slate-300 text-xs">
                        {worker.proxyIp}:{worker.proxyPort} — credentials masked
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                )}
                {/* Task */}
                <TableCell className="text-xs text-slate-300">{worker.currentTask}</TableCell>
                {/* Status */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {statusCfg.dot && (
                      <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                    )}
                    <Badge variant="outline" className={cn('text-[10px] font-medium', statusCfg.className)}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </TableCell>
                {/* Last Tx */}
                <TableCell>
                  {worker.lastTx && worker.lastTx !== '—' ? (
                    <a
                      href={`https://explorer.example.com/tx/${worker.lastTx}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-sky-400 transition-colors"
                    >
                      {truncateTx(worker.lastTx)}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-600">—</span>
                  )}
                </TableCell>
                {/* Gas */}
                {!compact && (
                  <TableCell className="text-xs text-slate-400 font-mono">
                    {worker.gasUsed > 0 ? worker.gasUsed : '—'}
                  </TableCell>
                )}
                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-slate-300 hover:bg-slate-900"><MoreHorizontal className="h-3.5 w-3.5" /></Button>} />
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-sm">
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 cursor-pointer"
                        onClick={() => { setWorkerStatus(worker.id, 'running'); toast.info(`Started ${truncateAddr(worker.address)}`) }}
                      >
                        Start
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 cursor-pointer"
                        onClick={() => { setWorkerStatus(worker.id, 'paused'); toast.info(`Paused ${truncateAddr(worker.address)}`) }}
                      >
                        Pause
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 cursor-pointer"
                        onClick={() => { setWorkerStatus(worker.id, 'idle'); toast.info(`Stopped ${truncateAddr(worker.address)}`) }}
                      >
                        Stop
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 cursor-pointer"
                        onClick={() => { setWorkerStatus(worker.id, 'running'); toast.info(`Restarted ${truncateAddr(worker.address)}`) }}
                      >
                        Restart
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-800 focus:text-slate-100 cursor-pointer"
                        onClick={() => toast.info(`Viewing logs for ${truncateAddr(worker.address)}`)}
                      >
                        View Logs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-800" />
                      <DropdownMenuItem
                        className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer"
                        onClick={() => { removeWorker(worker.id); toast.error(`Removed ${truncateAddr(worker.address)}`) }}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
