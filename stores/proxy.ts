import { create } from 'zustand'
import { ProxyEntry } from '@/lib/types'

const SEED_PROXIES: ProxyEntry[] = [
  { id: '1', label: 'US-East-01', ip: '198.51.100.12', port: '8080', username: 'proxyuser1', password: 'p@ssw0rd1', status: 'active', lastUsed: '2 min ago' },
  { id: '2', label: 'US-West-02', ip: '198.51.100.23', port: '8080', username: 'proxyuser2', password: 'p@ssw0rd2', status: 'active', lastUsed: '5 min ago' },
  { id: '3', label: 'EU-Central-01', ip: '203.0.113.45', port: '3128', username: 'euproxy1', password: 'eupass1', status: 'active', lastUsed: '12 min ago' },
  { id: '4', label: 'EU-West-02', ip: '203.0.113.67', port: '9090', username: 'euproxy2', password: 'eupass2', status: 'inactive', lastUsed: '1 hr ago' },
  { id: '5', label: 'APAC-01', ip: '198.51.100.90', port: '8080', username: 'apacuser1', password: 'apacpass1', status: 'active', lastUsed: '8 min ago' },
  { id: '6', label: 'US-South-03', ip: '203.0.113.33', port: '3128', username: 'proxyuser3', password: 'p@ssw0rd3', status: 'active', lastUsed: '3 min ago' },
  { id: '7', label: 'EU-North-01', ip: '203.0.113.89', port: '9090', username: 'euproxy3', password: 'eupass3', status: 'inactive', lastUsed: '2 hr ago' },
]

interface ProxyState {
  proxies: ProxyEntry[]
  addProxy: (proxy: Omit<ProxyEntry, 'id' | 'lastUsed'>) => void
  updateProxy: (id: string, updates: Partial<ProxyEntry>) => void
  deleteProxy: (id: string) => void
}

export const useProxyStore = create<ProxyState>((set) => ({
  proxies: SEED_PROXIES,
  addProxy: (newProxy) =>
    set((state) => ({
      proxies: [
        ...state.proxies,
        { ...newProxy, id: String(Date.now()), lastUsed: null },
      ],
    })),
  updateProxy: (id, updates) =>
    set((state) => ({
      proxies: state.proxies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  deleteProxy: (id) =>
    set((state) => ({ proxies: state.proxies.filter((p) => p.id !== id) })),
}))
