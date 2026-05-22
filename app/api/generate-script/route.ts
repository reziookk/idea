import { NextRequest, NextResponse } from 'next/server'

const RPC_URLS: Record<string, string> = {
  Monad: 'https://rpc.monad.xyz',
  Arbitrum: 'https://arb1.arbitrum.io/rpc',
  Base: 'https://mainnet.base.org',
  Ethereum: 'https://cloudflare-eth.com',
  Optimism: 'https://mainnet.optimism.io',
  Polygon: 'https://polygon-rpc.com',
}

function buildScript(network: string, scriptType: string): string {
  const rpcUrl = RPC_URLS[network] ?? 'https://rpc.monad.xyz'
  const taskComment = buildTaskComment(scriptType)

  return `/**
 * MiMo Ops — Generated Automation Script
 * ========================================
 * Script Type : ${scriptType}
 * Target Network: ${network}
 * RPC URL      : ${rpcUrl}
 * Generated    : ${new Date().toISOString()}
 * Model        : mimo-1m (1M token context)
 *
 * IMPORTANT: Never commit private keys. Load from .env only.
 */

import { ethers } from 'ethers'
import * as dotenv from 'dotenv'
dotenv.config()

// ─── Configuration ──────────────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL ?? '${rpcUrl}'
const PRIVATE_KEYS: string[] = (process.env.PRIVATE_KEYS ?? '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean)

const GAS_MULTIPLIER = 1.15          // 15% above base estimate
const MAX_RETRIES = 3
const STUCK_TIMEOUT_MS = 30_000      // replace tx if stuck > 30s
const RETRY_BACKOFF_BASE_MS = 1_000  // exponential backoff seed

// ─── Provider & Wallet setup ────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL)
const wallets = PRIVATE_KEYS.map((pk) => new ethers.Wallet(pk, provider))

// ─── Logging helpers (matches MiMo Ops log viewer format) ───────────────────
type LogLevel = 'info' | 'warn' | 'error' | 'success'

function log(level: LogLevel, address: string, message: string) {
  const ts = new Date().toTimeString().slice(0, 8)
  const short = \`\${address.slice(0, 6)}…\${address.slice(-4)}\`
  const network = '${network}'
  console.log(\`[\${ts}] [\${level.padEnd(7)}] \${short} (\${network}) \${message}\`)
}

// ─── Gas estimation with multiplier + mempool-aware bump ────────────────────
let gasFeeBaseline: bigint | null = null

async function getGasConfig(): Promise<{
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}> {
  const feeData = await provider.getFeeData()
  const base = feeData.maxFeePerGas ?? ethers.parseUnits('30', 'gwei')
  const priority = feeData.maxPriorityFeePerGas ?? ethers.parseUnits('2', 'gwei')

  // Mempool-aware: if fee is rising vs. baseline, bump further
  let adjusted = BigInt(Math.ceil(Number(base) * GAS_MULTIPLIER))
  if (gasFeeBaseline !== null && base > gasFeeBaseline) {
    const bumpFactor = 1.05 // additional 5% when fees are rising
    adjusted = BigInt(Math.ceil(Number(adjusted) * bumpFactor))
  }
  gasFeeBaseline = base

  return {
    maxFeePerGas: adjusted,
    maxPriorityFeePerGas: BigInt(Math.ceil(Number(priority) * GAS_MULTIPLIER)),
  }
}

// ─── Replacement tx if stuck ────────────────────────────────────────────────
async function waitOrReplace(
  wallet: ethers.Wallet,
  tx: ethers.TransactionResponse,
  nonce: number
): Promise<ethers.TransactionReceipt | null> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), STUCK_TIMEOUT_MS)
  )

  const receipt = await Promise.race([tx.wait(), timeout])
  if (receipt) return receipt

  // Tx stuck — bump gas by 10% and replace
  log('warn', wallet.address, \`Tx stuck >30s, replacing with +10% gas nonce=\${nonce}\`)
  const feeData = await provider.getFeeData()
  const bumpedFee = BigInt(Math.ceil(Number(feeData.maxFeePerGas ?? 0n) * 1.1))

  try {
    const replacement = await wallet.sendTransaction({
      to: tx.to ?? wallet.address,
      data: tx.data,
      value: tx.value,
      nonce,
      maxFeePerGas: bumpedFee,
      maxPriorityFeePerGas: bumpedFee / 10n,
    })
    return replacement.wait()
  } catch (err) {
    log('error', wallet.address, \`Replacement tx failed: \${(err as Error).message}\`)
    return null
  }
}

// ─── Per-wallet execution with retry + exponential backoff ──────────────────
async function executeForWallet(wallet: ethers.Wallet): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log('info', wallet.address, \`Attempt \${attempt}/\${MAX_RETRIES} — fetching pending nonce\`)

      const nonce = await provider.getTransactionCount(wallet.address, 'pending')
      const gasConfig = await getGasConfig()

      log('info', wallet.address, \`gasPrice=\${ethers.formatUnits(gasConfig.maxFeePerGas, 'gwei')} gwei (×\${GAS_MULTIPLIER})\`)

      // ─────────────────────────────────────────────────────────────────────
      ${taskComment}
      // ─────────────────────────────────────────────────────────────────────

      // Example: replace the sendTransaction below with your contract call
      const tx = await wallet.sendTransaction({
        to: '0x0000000000000000000000000000000000000000', // TODO: replace with contract address
        data: '0x',                                       // TODO: replace with encoded calldata
        nonce,
        ...gasConfig,
      })

      log('info', wallet.address, \`Tx submitted: \${tx.hash}\`)
      const receipt = await waitOrReplace(wallet, tx, nonce)

      if (receipt?.status === 1) {
        log('success', wallet.address, \`Tx confirmed: \${receipt.hash} block \${receipt.blockNumber}\`)
        return
      } else {
        log('error', wallet.address, \`Tx reverted or not confirmed\`)
        throw new Error('Tx reverted')
      }
    } catch (err) {
      const errorMsg = (err as Error).message
      log('error', wallet.address, \`Attempt \${attempt} failed: \${errorMsg}\`)

      if (attempt < MAX_RETRIES) {
        const backoffMs = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1)
        log('warn', wallet.address, \`Retrying in \${backoffMs}ms (exponential backoff)\`)
        await new Promise((r) => setTimeout(r, backoffMs))
      } else {
        log('error', wallet.address, \`All \${MAX_RETRIES} attempts exhausted\`)
        throw err // surface terminal failure to Promise.allSettled
      }
    }
  }
}

// ─── Main: fan out across all wallets ───────────────────────────────────────
async function main() {
  if (wallets.length === 0) {
    console.error('[error] No wallets loaded. Set PRIVATE_KEYS in .env')
    process.exit(1)
  }

  log('info', wallets[0].address, \`Starting multi-wallet execution: \${wallets.length} wallets on ${network}\`)

  const results = await Promise.allSettled(
    wallets.map((wallet) => executeForWallet(wallet))
  )

  let successes = 0
  let failures = 0
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      successes++
    } else {
      failures++
      log('error', wallets[i].address, \`Final error: \${r.reason}\`)
    }
  })

  console.log(\`\\n[done] \${successes}/\${wallets.length} wallets succeeded, \${failures} failed\`)
}

main().catch((err) => {
  console.error('[fatal]', err)
  process.exit(1)
})
`
}

function buildTaskComment(scriptType: string): string {
  switch (scriptType) {
    case 'Multi-wallet Swap':
      return `// TODO: Multi-wallet Swap
      // const contract = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet)
      // const deadline = Math.floor(Date.now() / 1000) + 300
      // const tx = await contract.swapExactTokensForTokens(
      //   amountIn,
      //   amountOutMin,
      //   [TOKEN_IN, TOKEN_OUT],
      //   wallet.address,
      //   deadline,
      //   { nonce, ...gasConfig }
      // )`

    case 'Multi-wallet Mint':
      return `// TODO: Multi-wallet Mint
      // const contract = new ethers.Contract(NFT_CONTRACT, NFT_ABI, wallet)
      // const mintPrice = await contract.mintPrice()
      // const tx = await contract.mint(wallet.address, quantity, {
      //   value: mintPrice * BigInt(quantity),
      //   nonce, ...gasConfig
      // })`

    case 'Multi-wallet Claim':
      return `// TODO: Multi-wallet Claim
      // const contract = new ethers.Contract(CLAIM_CONTRACT, CLAIM_ABI, wallet)
      // const proof = merkleProofs[wallet.address] // load from proofs.json
      // const tx = await contract.claim(wallet.address, claimAmount, proof, {
      //   nonce, ...gasConfig
      // })`

    default:
      return `// TODO: Custom Interaction
      // const iface = new ethers.Interface(ABI_JSON)
      // const calldata = iface.encodeFunctionData('yourFunction', [param1, param2])
      // const tx = await wallet.sendTransaction({
      //   to: CONTRACT_ADDRESS,
      //   data: calldata,
      //   nonce, ...gasConfig
      // })`
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now()

  const raw = await req.json().catch(() => null)
  const body: Record<string, unknown> = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const input: string = typeof body.input === 'string' ? body.input : ''
  const network: string = typeof body.network === 'string' ? (body.network as string) : 'Monad'
  const scriptType: string = typeof body.scriptType === 'string' ? (body.scriptType as string) : 'Multi-wallet Swap'

  // Simulate MiMo LLM processing delay
  await new Promise((r) => setTimeout(r, 1200))

  const script = buildScript(network, scriptType)
  const tokensUsed = Math.floor(input.length / 4) + 1847

  return NextResponse.json({
    script,
    model: 'mimo-1m',
    tokensUsed,
    latencyMs: Date.now() - start,
  })
}
