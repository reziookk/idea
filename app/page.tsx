'use client'

import { TrendingUp, TrendingDown, Wallet, Activity, CheckCircle2, XCircle, Play, Pause, RefreshCw, Square } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useWorkersStore } from '@/stores/workers'
import { WorkerTable } from '@/components/worker-table'
import { LiveLogViewer } from '@/components/live-log-viewer'

export default function DashboardPage() {
  const workers = useWorkersStore((s) => s.workers)
  const setAllStatus = useWorkersStore((s) => s.setAllStatus)

  // Active = any wallet not in a terminal state (still actionable)
  const activeCount = workers.filter((w) => w.status !== 'failed' && w.status !== 'success').length
  const runningCount = workers.filter((w) => w.status === 'running').length
  const successCount = workers.filter((w) => w.status === 'success').length
  const failedCount = workers.filter((w) => w.status === 'failed').length
  const totalCompleted = successCount + failedCount
  const successRate = totalCompleted > 0 ? Math.round((successCount / totalCompleted) * 100) : 100

  const KPI_CARDS = [
    {
      title: 'Active Wallets',
      value: activeCount,
      total: workers.length,
      icon: Wallet,
      trend: 'up',
      change: '+3 from yesterday',
      accent: 'text-indigo-400',
    },
    {
      title: 'Tasks Running',
      value: runningCount,
      icon: Activity,
      trend: 'up',
      change: '+2 this hour',
      accent: 'text-sky-400',
    },
    {
      title: 'Success Rate (24h)',
      value: `${successRate}%`,
      icon: CheckCircle2,
      trend: successRate >= 90 ? 'up' : 'down',
      change: successRate >= 90 ? '+2.4% vs. yesterday' : '-1.2% vs. yesterday',
      accent: 'text-sky-400',
    },
    {
      title: 'Failed Tx (24h)',
      value: failedCount,
      icon: XCircle,
      trend: failedCount <= 2 ? 'up' : 'down',
      change: failedCount <= 2 ? 'Low failure rate' : 'Investigate RPCs',
      accent: 'text-rose-400',
    },
  ]

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ title, value, total, icon: Icon, trend, change, accent }) => (
          <Card key={title} className="bg-slate-900/60 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-slate-400">{title}</CardTitle>
              <Icon className={`h-4 w-4 ${accent}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-100">{value}</span>
                {total !== undefined && (
                  <span className="text-xs text-slate-500">/ {total}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-sky-400" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-400" />
                )}
                <span className="text-[11px] text-slate-500">{change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Master controls */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-semibold text-slate-200">Master Controls</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5"
              onClick={() => { setAllStatus('running'); toast.success('All workers started') }}
            >
              <Play className="h-3.5 w-3.5" /> Start All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 gap-1.5"
              onClick={() => { setAllStatus('paused'); toast.info('All workers paused') }}
            >
              <Pause className="h-3.5 w-3.5" /> Pause All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 gap-1.5"
              onClick={() => toast.info('Syncing RPC endpoints…')}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Sync RPCs
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => { setAllStatus('idle'); toast.error('All workers stopped') }}
            >
              <Square className="h-3.5 w-3.5" /> Stop All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Worker table */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-200">Workers</CardTitle>
            <span className="text-xs text-slate-500">{workers.length} wallets</span>
          </div>
        </CardHeader>
        <Separator className="bg-slate-800" />
        <CardContent className="p-0">
          <WorkerTable />
        </CardContent>
      </Card>

      {/* Live Log Viewer */}
      <LiveLogViewer demo />
    </div>
  )
}
