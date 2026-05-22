import { create } from 'zustand'
import { WorkerNode, WorkerStatus } from '@/lib/types'

const MOCK_WALLETS: WorkerNode[] = [
  { id: '1', address: '0x4f3a8b2c1d9e6f7a0b5c3d2e1f0a4b5c6d7e8a91', network: 'Monad', proxyIp: '198.51.100.12', proxyPort: '8080', currentTask: 'Swap USDC→ETH', status: 'running', lastTx: '0xabc123def456789012345678901234567890abcd', gasUsed: 42 },
  { id: '2', address: '0x8c7b6a5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a02', network: 'Arbitrum', proxyIp: '198.51.100.23', proxyPort: '8080', currentTask: 'Mint NFT #4521', status: 'success', lastTx: '0x1234567890abcdef1234567890abcdef12345678', gasUsed: 31 },
  { id: '3', address: '0x2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d03', network: 'Base', proxyIp: '198.51.100.34', proxyPort: '9090', currentTask: 'Idle', status: 'idle', lastTx: '0xdeadbeefdeadbeefdeadbeefdeadbeef12345678', gasUsed: 0 },
  { id: '4', address: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e04', network: 'Ethereum', proxyIp: '203.0.113.45', proxyPort: '3128', currentTask: 'Claim Airdrop', status: 'failed', lastTx: '0xfeedface0000000000000000000000001234abcd', gasUsed: 21 },
  { id: '5', address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a05', network: 'Monad', proxyIp: '198.51.100.56', proxyPort: '8080', currentTask: 'Swap ETH→USDC', status: 'running', lastTx: '0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8906', gasUsed: 38 },
  { id: '6', address: '0x6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f06', network: 'Optimism', proxyIp: '203.0.113.67', proxyPort: '9090', currentTask: 'Idle', status: 'paused', lastTx: '0xabcdef1234567890abcdef1234567890abcdef12', gasUsed: 0 },
  { id: '7', address: '0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b07', network: 'Arbitrum', proxyIp: '198.51.100.78', proxyPort: '8080', currentTask: 'Multi-hop Swap', status: 'running', lastTx: '0x9876543210fedcba9876543210fedcba98765432', gasUsed: 55 },
  { id: '8', address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a08', network: 'Base', proxyIp: '203.0.113.89', proxyPort: '3128', currentTask: 'Mint NFT #7823', status: 'success', lastTx: '0x1111222233334444555566667777888899990000', gasUsed: 28 },
  { id: '9', address: '0xca0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a09', network: 'Polygon', proxyIp: '198.51.100.90', proxyPort: '8080', currentTask: 'Claim Rewards', status: 'idle', lastTx: '0xaaaaabbbbccccddddeeeeffff00001111222233', gasUsed: 0 },
  { id: '10', address: '0xd1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0', network: 'Monad', proxyIp: '203.0.113.12', proxyPort: '9090', currentTask: 'Swap WBTC→ETH', status: 'running', lastTx: '0xf0e1d2c3b4a5968778695a4b3c2d1e0f9a8b7c6d', gasUsed: 61 },
  { id: '11', address: '0xe2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1', network: 'Ethereum', proxyIp: '198.51.100.11', proxyPort: '8080', currentTask: 'Bridge ETH', status: 'failed', lastTx: '0x2222333344445555666677778888999900001111', gasUsed: 76 },
  { id: '12', address: '0xf4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3', network: 'Arbitrum', proxyIp: '203.0.113.33', proxyPort: '3128', currentTask: 'Idle', status: 'idle', lastTx: '0x3333444455556666777788889999aaaabbbbcccc', gasUsed: 0 },
  { id: '13', address: '0x0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c', network: 'Base', proxyIp: '198.51.100.44', proxyPort: '8080', currentTask: 'Mint Collection', status: 'paused', lastTx: '0xddddeeeeffffaaaabbbbcccc000011112222333', gasUsed: 0 },
  { id: '14', address: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d', network: 'Optimism', proxyIp: '203.0.113.55', proxyPort: '9090', currentTask: 'Claim Airdrop', status: 'running', lastTx: '0x4444555566667777888899990000aaaabbbbcccc', gasUsed: 33 },
  { id: '15', address: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e', network: 'Polygon', proxyIp: '198.51.100.66', proxyPort: '8080', currentTask: 'Swap MATIC→USDC', status: 'success', lastTx: '0x5555666677778888999900001111aaaabbbbdddd', gasUsed: 19 },
]

interface WorkersState {
  workers: WorkerNode[]
  setAllStatus: (status: WorkerStatus) => void
  setSelectedStatus: (status: WorkerStatus) => void
  setWorkerStatus: (id: string, status: WorkerStatus) => void
  toggleSelect: (id: string) => void
  selectAll: (selected: boolean) => void
  addWorker: (worker: Omit<WorkerNode, 'id' | 'currentTask' | 'status' | 'lastTx' | 'gasUsed' | 'proxyIp' | 'proxyPort'>) => void
  removeWorker: (id: string) => void
  updateWorker: (id: string, updates: Partial<WorkerNode>) => void
}

export const useWorkersStore = create<WorkersState>((set) => ({
  workers: MOCK_WALLETS,
  setAllStatus: (status) =>
    set((state) => ({
      workers: state.workers.map((w) => ({ ...w, status })),
    })),
  setSelectedStatus: (status) =>
    set((state) => ({
      workers: state.workers.map((w) => (w.selected ? { ...w, status } : w)),
    })),
  setWorkerStatus: (id, status) =>
    set((state) => ({
      workers: state.workers.map((w) => (w.id === id ? { ...w, status } : w)),
    })),
  toggleSelect: (id) =>
    set((state) => ({
      workers: state.workers.map((w) =>
        w.id === id ? { ...w, selected: !w.selected } : w
      ),
    })),
  selectAll: (selected) =>
    set((state) => ({
      workers: state.workers.map((w) => ({ ...w, selected })),
    })),
  addWorker: (newWorker) =>
    set((state) => ({
      workers: [
        ...state.workers,
        {
          ...newWorker,
          id: String(Date.now()),
          currentTask: 'Idle',
          status: 'idle',
          lastTx: '—',
          gasUsed: 0,
          proxyIp: '0.0.0.0',
          proxyPort: '8080',
          selected: false,
        },
      ],
    })),
  removeWorker: (id) =>
    set((state) => ({
      workers: state.workers.filter((w) => w.id !== id),
    })),
  updateWorker: (id, updates) =>
    set((state) => ({
      workers: state.workers.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
}))
