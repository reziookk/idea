export type WorkerStatus = 'idle' | 'running' | 'success' | 'failed' | 'paused'

export interface WorkerNode {
  id: string
  address: string
  network: string
  proxyIp: string
  proxyPort: string
  currentTask: string
  status: WorkerStatus
  lastTx: string
  gasUsed: number
  selected?: boolean
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success'

export interface Log {
  id: string
  timestamp: string
  level: LogLevel
  address: string
  network: string
  message: string
}

export interface RpcEndpoint {
  id: string
  network: string
  url: string
  latency: number | null
  status: 'active' | 'inactive' | 'checking'
  weight: number
}

export interface ProxyEntry {
  id: string
  label: string
  ip: string
  port: string
  username: string
  password: string
  status: 'active' | 'inactive'
  lastUsed: string | null
}
