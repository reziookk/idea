'use client'

import { useState } from 'react'
import { Search, Plus, Filter, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useWorkersStore } from '@/stores/workers'
import { WorkerTable } from '@/components/worker-table'
import { WorkerStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'

const NETWORKS = ['All', 'Monad', 'Arbitrum', 'Base', 'Ethereum', 'Optimism', 'Polygon']
const STATUSES: (WorkerStatus | 'all')[] = ['all', 'idle', 'running', 'success', 'failed', 'paused']

export default function WorkerNodesPage() {
  const workers = useWorkersStore((s) => s.workers)
  const addWorker = useWorkersStore((s) => s.addWorker)
  const setSelectedStatus = useWorkersStore((s) => s.setSelectedStatus)

  const [networkFilter, setNetworkFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState<WorkerStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Dialog form state
  const [newPk, setNewPk] = useState('')
  const [newNetwork, setNewNetwork] = useState('Monad')

  const filtered = workers.filter((w) => {
    if (networkFilter !== 'All' && w.network !== networkFilter) return false
    if (statusFilter !== 'all' && w.status !== statusFilter) return false
    if (search && !w.address.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const selectedCount = workers.filter((w) => w.selected).length

  const handleAddWallet = () => {
    if (!newPk.trim()) {
      toast.error('Private key is required')
      return
    }
    // Derive address placeholder (in real app would use ethers.Wallet)
    const fakeAddr = `0x${newPk.slice(2, 10).padEnd(40, '0').slice(0, 40)}`
    addWorker({ address: fakeAddr, network: newNetwork })
    toast.success('Wallet added')
    setAddDialogOpen(false)
    setNewPk('')
    setNewNetwork('Monad')
  }

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500 mt-0.5">{workers.length} total wallets · {workers.filter(w => w.status === 'running').length} running</p>
        </div>
        <div className="flex gap-2">
          {selectedCount > 0 && (
            <>
              <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-2 py-1">
                {selectedCount} selected
              </Badge>
              <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs" onClick={() => { setSelectedStatus('running'); toast.info(`Started ${selectedCount} workers`) }}>
                Start Selected
              </Button>
              <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs" onClick={() => { setSelectedStatus('paused'); toast.info(`Paused ${selectedCount} workers`) }}>
                Pause Selected
              </Button>
            </>
          )}
          <Button
            size="sm"
            className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Wallet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Search by address…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 bg-slate-950 border-slate-700 text-slate-300 placeholder:text-slate-600 text-xs focus-visible:ring-indigo-500/30"
              />
            </div>
            <Select value={networkFilter} onValueChange={(v) => v && setNetworkFilter(v)}>
              <SelectTrigger className="h-8 w-36 bg-slate-950 border-slate-700 text-slate-300 text-xs focus:ring-0">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {NETWORKS.map((n) => (
                  <SelectItem key={n} value={n} className="text-xs text-slate-300 focus:bg-slate-800">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as WorkerStatus | 'all')}>
              <SelectTrigger className="h-8 w-36 bg-slate-950 border-slate-700 text-slate-300 text-xs focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs text-slate-300 focus:bg-slate-800 capitalize">
                    {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Worker table */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-200">
              Workers
            </CardTitle>
            <span className="text-xs text-slate-500">
              {filtered.length} of {workers.length}
            </span>
          </div>
        </CardHeader>
        <Separator className="bg-slate-800" />
        <CardContent className="p-0">
          <WorkerTable workers={filtered} />
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-20 text-sm text-slate-600">
              No workers match the current filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Wallet Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Add Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Private Key</Label>
              <Input
                type="password"
                placeholder="0x..."
                value={newPk}
                onChange={(e) => setNewPk(e.target.value)}
                className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-xs focus-visible:ring-indigo-500/30"
              />
              <p className="text-[11px] text-slate-600">Never shared. Stored only in this session.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Network</Label>
              <Select value={newNetwork} onValueChange={(v) => v && setNewNetwork(v)}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {NETWORKS.filter((n) => n !== 'All').map((n) => (
                    <SelectItem key={n} value={n} className="text-sm text-slate-300 focus:bg-slate-800">
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-indigo-500 hover:bg-indigo-400 text-white" onClick={handleAddWallet}>
              Add Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
