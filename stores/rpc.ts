import { create } from 'zustand'
import { RpcEndpoint } from '@/lib/types'

const SEED_RPCS: RpcEndpoint[] = [
  { id: '1', network: 'Monad', url: 'https://rpc.monad.xyz', latency: 45, status: 'active', weight: 1 },
  { id: '2', network: 'Monad', url: 'https://monad-testnet.rpc.caldera.xyz/http', latency: 62, status: 'active', weight: 1 },
  { id: '3', network: 'Arbitrum', url: 'https://arb1.arbitrum.io/rpc', latency: 38, status: 'active', weight: 2 },
  { id: '4', network: 'Arbitrum', url: 'https://arbitrum-one.publicnode.com', latency: 51, status: 'active', weight: 1 },
  { id: '5', network: 'Base', url: 'https://mainnet.base.org', latency: 29, status: 'active', weight: 1 },
  { id: '6', network: 'Ethereum', url: 'https://cloudflare-eth.com', latency: 88, status: 'inactive', weight: 1 },
  { id: '7', network: 'Optimism', url: 'https://mainnet.optimism.io', latency: 41, status: 'active', weight: 1 },
  { id: '8', network: 'Polygon', url: 'https://polygon-rpc.com', latency: 73, status: 'active', weight: 1 },
]

interface RpcState {
  rpcs: RpcEndpoint[]
  addRpc: (rpc: Omit<RpcEndpoint, 'id' | 'latency' | 'status'>) => void
  updateRpc: (id: string, updates: Partial<RpcEndpoint>) => void
  deleteRpc: (id: string) => void
}

export const useRpcStore = create<RpcState>((set) => ({
  rpcs: SEED_RPCS,
  addRpc: (newRpc) =>
    set((state) => ({
      rpcs: [
        ...state.rpcs,
        { ...newRpc, id: String(Date.now()), latency: null, status: 'checking' as const },
      ],
    })),
  updateRpc: (id, updates) =>
    set((state) => ({
      rpcs: state.rpcs.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),
  deleteRpc: (id) =>
    set((state) => ({ rpcs: state.rpcs.filter((r) => r.id !== id) })),
}))
