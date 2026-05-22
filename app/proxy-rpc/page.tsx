'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Globe, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useRpcStore } from '@/stores/rpc'
import { useProxyStore } from '@/stores/proxy'
import { RpcEndpoint, ProxyEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

const NETWORKS = ['Monad', 'Arbitrum', 'Base', 'Ethereum', 'Optimism', 'Polygon']

// ─── RPC Table ──────────────────────────────────────────────────────────────
function RpcTab() {
  const rpcs = useRpcStore((s) => s.rpcs)
  const addRpc = useRpcStore((s) => s.addRpc)
  const updateRpc = useRpcStore((s) => s.updateRpc)
  const deleteRpc = useRpcStore((s) => s.deleteRpc)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<RpcEndpoint | null>(null)
  const [form, setForm] = useState({ network: 'Monad', url: '', weight: '1' })

  const openAdd = () => { setEditing(null); setForm({ network: 'Monad', url: '', weight: '1' }); setDialogOpen(true) }
  const openEdit = (rpc: RpcEndpoint) => {
    setEditing(rpc)
    setForm({ network: rpc.network, url: rpc.url, weight: String(rpc.weight) })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.url.trim()) { toast.error('URL is required'); return }
    if (editing) {
      updateRpc(editing.id, { network: form.network, url: form.url, weight: parseInt(form.weight) || 1 })
      toast.success('RPC updated')
    } else {
      addRpc({ network: form.network, url: form.url, weight: parseInt(form.weight) || 1 })
      toast.success('RPC endpoint added')
    }
    setDialogOpen(false)
  }

  const latencyColor = (ms: number | null) => {
    if (ms === null || ms === undefined) return 'text-slate-500'
    if (ms < 50) return 'text-sky-300'
    if (ms < 100) return 'text-amber-300'
    return 'text-rose-300'
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> Add RPC
        </Button>
      </div>
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-medium">Network</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">URL</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Latency</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Weight</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rpcs.map((rpc) => (
                  <TableRow key={rpc.id} className="border-slate-800/50 hover:bg-slate-900/40">
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                        {rpc.network}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-400 truncate max-w-[200px] block">{rpc.url}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('font-mono text-xs', latencyColor(rpc.latency))}>
                        {rpc.latency !== null ? `${rpc.latency}ms` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-1.5 w-1.5 rounded-full', rpc.status === 'active' ? 'bg-sky-400' : rpc.status === 'checking' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600')} />
                        <span className={cn('text-xs', rpc.status === 'active' ? 'text-sky-300' : rpc.status === 'checking' ? 'text-amber-300' : 'text-slate-500')}>
                          {rpc.status.charAt(0).toUpperCase() + rpc.status.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{rpc.weight}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-slate-300 hover:bg-slate-800" onClick={() => openEdit(rpc)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => { deleteRpc(rpc.id); toast.error('RPC removed') }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-400" />
              {editing ? 'Edit RPC Endpoint' : 'Add RPC Endpoint'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Network</Label>
              <Select value={form.network} onValueChange={(v) => v && setForm((f) => ({ ...f, network: v }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {NETWORKS.map((n) => (
                    <SelectItem key={n} value={n} className="text-sm text-slate-300 focus:bg-slate-800">{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">RPC URL</Label>
              <Input
                placeholder="https://rpc.example.com"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-xs focus-visible:ring-indigo-500/30"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Weight (optional)</Label>
              <Input
                type="number"
                placeholder="1"
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus-visible:ring-indigo-500/30 w-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-500 hover:bg-indigo-400 text-white" onClick={handleSave}>
              {editing ? 'Save Changes' : 'Add RPC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Proxy Table ─────────────────────────────────────────────────────────────
function ProxyTab() {
  const proxies = useProxyStore((s) => s.proxies)
  const addProxy = useProxyStore((s) => s.addProxy)
  const updateProxy = useProxyStore((s) => s.updateProxy)
  const deleteProxy = useProxyStore((s) => s.deleteProxy)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ProxyEntry | null>(null)
  const [quickInput, setQuickInput] = useState('')
  const [form, setForm] = useState({ label: '', ip: '', port: '', username: '', password: '', status: 'active' as 'active' | 'inactive' })

  const parseQuickInput = (raw: string) => {
    const parts = raw.split(':')
    if (parts.length >= 4) {
      setForm((f) => ({ ...f, ip: parts[0], port: parts[1], username: parts[2], password: parts.slice(3).join(':') }))
    }
  }

  const openAdd = () => {
    setEditing(null)
    setQuickInput('')
    setForm({ label: '', ip: '', port: '', username: '', password: '', status: 'active' })
    setDialogOpen(true)
  }
  const openEdit = (p: ProxyEntry) => {
    setEditing(p)
    setQuickInput('')
    setForm({ label: p.label, ip: p.ip, port: p.port, username: p.username, password: p.password, status: p.status })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.ip.trim() || !form.port.trim()) { toast.error('IP and port are required'); return }
    const label = form.label.trim() || `${form.ip}:${form.port}`
    if (editing) {
      updateProxy(editing.id, { ...form, label })
      toast.success('Proxy updated')
    } else {
      addProxy({ ...form, label })
      toast.success('Proxy added')
    }
    setDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400 text-white gap-1.5" onClick={openAdd}>
          <Plus className="h-3.5 w-3.5" /> Add Proxy
        </Button>
      </div>
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 text-xs font-medium">Label</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">IP:Port</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Username</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Status</TableHead>
                  <TableHead className="text-slate-400 text-xs font-medium">Last Used</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxies.map((proxy) => (
                  <TableRow key={proxy.id} className="border-slate-800/50 hover:bg-slate-900/40">
                    <TableCell className="text-xs text-slate-300 font-medium">{proxy.label}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger render={<span className="font-mono text-xs text-slate-400 cursor-default">{proxy.ip}:{proxy.port}</span>} />
                        <TooltipContent className="bg-slate-900 border-slate-700 text-xs text-slate-300">
                          User: {proxy.username} · Pass: {'•'.repeat(8)}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{proxy.username}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={cn('h-1.5 w-1.5 rounded-full', proxy.status === 'active' ? 'bg-sky-400' : 'bg-slate-600')} />
                        <span className={cn('text-xs', proxy.status === 'active' ? 'text-sky-300' : 'text-slate-500')}>
                          {proxy.status.charAt(0).toUpperCase() + proxy.status.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{proxy.lastUsed ?? '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-slate-300 hover:bg-slate-800" onClick={() => openEdit(proxy)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => { deleteProxy(proxy.id); toast.error('Proxy removed') }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              {editing ? 'Edit Proxy' : 'Add Proxy'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Quick paste (ip:port:user:pass)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="198.51.100.1:8080:user:pass"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-xs focus-visible:ring-indigo-500/30"
                  />
                  <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-700 shrink-0" onClick={() => parseQuickInput(quickInput)}>
                    Parse
                  </Button>
                </div>
                <Separator className="bg-slate-800" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-slate-400">Label (optional)</Label>
                <Input
                  placeholder="US-East-01"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus-visible:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">IP Address</Label>
                <Input
                  placeholder="198.51.100.1"
                  value={form.ip}
                  onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-xs focus-visible:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Port</Label>
                <Input
                  placeholder="8080"
                  value={form.port}
                  onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-slate-300 font-mono text-xs focus-visible:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Username</Label>
                <Input
                  placeholder="proxyuser"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus-visible:ring-indigo-500/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus-visible:ring-indigo-500/30"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Status</Label>
              <Select value={form.status} onValueChange={(v) => v && setForm((f) => ({ ...f, status: v as 'active' | 'inactive' }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-300 text-sm focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="active" className="text-sm text-slate-300 focus:bg-slate-800">Active</SelectItem>
                  <SelectItem value="inactive" className="text-sm text-slate-300 focus:bg-slate-800">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-slate-400 hover:text-slate-200" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-indigo-500 hover:bg-indigo-400 text-white" onClick={handleSave}>
              {editing ? 'Save Changes' : 'Add Proxy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ProxyRpcPage() {
  const rpcs = useRpcStore((s) => s.rpcs)
  const proxies = useProxyStore((s) => s.proxies)

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center gap-4">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-slate-100">{rpcs.length}</p>
            <p className="text-xs text-slate-500">RPC endpoints</p>
          </div>
          <Separator orientation="vertical" className="bg-slate-800 h-10" />
          <div className="text-center">
            <p className="text-xl font-bold text-slate-100">{proxies.length}</p>
            <p className="text-xs text-slate-500">Proxies</p>
          </div>
          <Separator orientation="vertical" className="bg-slate-800 h-10" />
          <div className="text-center">
            <p className="text-xl font-bold text-sky-300">{rpcs.filter((r) => r.status === 'active').length}</p>
            <p className="text-xs text-slate-500">Active RPCs</p>
          </div>
          <Separator orientation="vertical" className="bg-slate-800 h-10" />
          <div className="text-center">
            <p className="text-xl font-bold text-sky-300">{proxies.filter((p) => p.status === 'active').length}</p>
            <p className="text-xs text-slate-500">Active proxies</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="rpc" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800 h-9">
          <TabsTrigger value="rpc" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 gap-1.5">
            <Globe className="h-3.5 w-3.5" /> RPC Endpoints
          </TabsTrigger>
          <TabsTrigger value="proxies" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300 gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Proxies
          </TabsTrigger>
        </TabsList>
        <TabsContent value="rpc">
          <RpcTab />
        </TabsContent>
        <TabsContent value="proxies">
          <ProxyTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
