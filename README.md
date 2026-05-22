### Soundness Layer Testnet vApps

Verify GitHub ownership and submit vApp and zkApp proposals for Soundness Layer testnet access.

[![Discord](https://img.shields.io/discord/1234567890?label=Discord&logo=discord)](https://discord.gg/soundnesslabs)
[![PRs](https://img.shields.io/github/issues-pr/soundlayer/testnet-vapps?label=Submissions)](https://github.com/SoundnessLabs/testnet-vapps/pulls)

## Quick Start

1. Fork this repository
2. Copy `TEMPLATE.md` to `submissions/{category}/{your-github-username}.md`
3. Fill out your vApp proposal
4. Create Pull Request
5. Join [Discord](https://discord.gg/soundnesslabs) and use `/submit-vapp` command

## Categories

- **identity** - Authentication, credentials, reputation
- **defi** - Finance, trading, payments  
- **social** - Community, content, messaging
- **gaming** - Games, NFTs, entertainment
- **infrastructure** - Tools, analytics, monitoring
- **other** - Innovative ideas

## Requirements

- Valid GitHub username (must match PR author)
- Discord ID for verification
- Technical architecture with SL integration
- Realistic development timeline

## Process

1. **Submit PR** → Automated validation
2. **Team review** → 2-3 business days  
3. **Approval** → Sound_dev Discord role
4. **Build PoC** → Testnet access

## Resources

- [X](https://x.com/SoundnessLabs)
- [Discord](https://discord.gg/soundnesslabs)



**Ready to build?** [Submit Your vApp](/TEMPLATE.md) • [Join Discord](https://discord.gg/soundnesslabs)

---

# MiMo Ops — Web3 Multi-Wallet Automation Dashboard

> An AI-driven control plane that turns days of bespoke Web3 scripting and ops setup into a one-paste, one-click, fully observable execution loop. Built to showcase MiMo's 1M-token context window and agentic code generation.

![Next.js 14](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38BDF8?logo=tailwindcss)
![ethers.js](https://img.shields.io/badge/ethers.js-v6-2535A0)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Why MiMo Ops

Web3 power users — airdrop farmers, DeFi market-makers, NFT minters, on-chain protocol testers — routinely operate dozens to hundreds of wallets across multiple EVM chains. The on-chain logic is rarely the hard part; the **operational scaffolding around it** is:

- Hand-encoding contract ABIs
- Reasoning about EIP-1559 fee dynamics across chains
- Handling stuck nonces and replacement transactions
- Rotating RPC endpoints when one fails
- Orchestrating parallel execution without leaking state between wallets
- Reading thousands of transaction logs without going cross-eyed

A single missed detail — a missing `value` on a replacement tx, an unhandled `Promise.allSettled` rejection, a falsy check on a zero-latency probe — silently burns gas or skips intended trades.

**MiMo Ops collapses that scaffolding into an AI-driven control plane.** Paste a contract ABI or an entire GitHub repo, get back a production-ready multi-wallet `ethers.js` v6 script, deploy it across a fleet of proxied worker nodes, and watch structured logs stream into a single readable dashboard.

---

## Features

| Module | Description |
| --- | --- |
| **Dashboard** (`/`) | 4 KPI cards (Active Wallets, Tasks Running, 24h Success Rate, Failed Tx), master control panel (Start All / Pause All / Sync RPCs / Stop All), worker table, and a docked Live Log Viewer. |
| **Script Generator** (`/script-generator`) | Paste ABI / docs / source / GitHub URL into a 1M-token-aware editor. Pick target network and script type. POST to `/api/generate-script` and get back a fully-formed `ethers.js` v6 multi-wallet script with syntax highlighting, copy, and download. |
| **Worker Nodes** (`/worker-nodes`) | Searchable, filterable management view for the wallet fleet. Bulk Start/Pause on selected workers. Add Wallet dialog with private-key entry and network selection. |
| **Proxy & RPC** (`/proxy-rpc`) | Tabbed CRUD for custom RPC endpoints (URL, weight, latency probe) and proxies (parses `ip:port:user:pass` paste format). |
| **Live Log Viewer** | Terminal-style streaming panel: filterable by level (info / warn / error / success), auto-scroll with manual-scroll pause, drag-to-resize with localStorage persistence, clear, and `.log` download. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Operator (browser, dark UI)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  paste ABI / docs / repo (≤ 1M tok)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  /api/generate-script  ──►  MiMo LLM (1M context)               │
│  • whole-codebase reasoning                                     │
│  • emits ethers.js v6 script template                           │
│      ├─ dynamic gas (×1.15 + mempool-aware bump)                │
│      ├─ replacement tx for stuck nonces (>30s)                  │
│      ├─ exponential-backoff retry (3×)                          │
│      └─ Promise.allSettled fan-out across wallets               │
└──────────────────────────┬──────────────────────────────────────┘
                           │  generated script
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│            Worker Fleet (Zustand-backed UI agents)              │
│  Wallet₁ ─ Proxy₁ ─ RPC₁  ◄──┐                                  │
│  Wallet₂ ─ Proxy₂ ─ RPC₂  ◄──┤  Master Controller               │
│  Wallet₃ ─ Proxy₃ ─ RPC₃  ◄──┤  (start / pause / sync / stop)   │
│  ...                          │                                 │
│                          structured log events                  │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Live Log Viewer  +  KPI tiles  +  Worker table                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn UI |
| State | Zustand |
| Web3 | ethers.js v6 |
| Icons | lucide-react |
| Notifications | sonner |
| Syntax highlight | react-syntax-highlighter (Prism, `vscDarkPlus`) |
| Package manager | pnpm |

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx                    # Root layout, dark mode, sidebar shell
│   ├── page.tsx                      # Dashboard (KPIs + table + log viewer)
│   ├── globals.css                   # Tailwind base + custom CSS variables
│   ├── api/
│   │   └── generate-script/route.ts  # POST handler — simulated MiMo call
│   ├── script-generator/page.tsx
│   ├── worker-nodes/page.tsx
│   └── proxy-rpc/page.tsx
├── components/
│   ├── app-sidebar.tsx               # Fixed sidebar + mobile Sheet drawer
│   ├── sidebar-content.tsx
│   ├── top-bar.tsx                   # Page title + Sync RPCs + wallet badge
│   ├── worker-table.tsx              # Shadcn Table + per-row actions
│   ├── live-log-viewer.tsx           # Terminal panel (see Design notes)
│   └── ui/                           # Shadcn primitives
├── stores/
│   ├── workers.ts                    # Wallet fleet + bulk actions
│   ├── rpc.ts                        # RPC endpoint CRUD
│   └── proxy.ts                      # Proxy CRUD
├── lib/
│   ├── types.ts                      # Wallet, Log, RpcEndpoint, Proxy
│   └── utils.ts                      # cn() helper
└── (Soundness Layer submissions/, scripts/, TEMPLATE.md preserved)
```

---

## Quick Start

**Prerequisites:** Node.js ≥ 18 and `pnpm` (`npm i -g pnpm` if missing).

```bash
git clone -b capy/web3-dashboard-init https://github.com/reziookk/idea.git mimo-ops
cd mimo-ops
pnpm install
pnpm dev
```

Open <http://localhost:3000>.

### Other scripts

```bash
pnpm lint    # ESLint (zero warnings policy)
pnpm build   # Production build (output: .next/)
pnpm start   # Serve the production build
```

---

## API Reference

### `POST /api/generate-script`

Simulates a MiMo LLM call. Latency is artificially injected (~1.2s) to feel realistic.

**Request body** (`application/json`)

```jsonc
{
  "input":      "<ABI / docs / source — up to 1M tokens>",
  "network":    "Monad | Arbitrum | Base | Ethereum | Optimism | Polygon",
  "scriptType": "Multi-wallet Swap | Multi-wallet Mint | Multi-wallet Claim | Custom Interaction"
}
```

`null`, missing, or non-object bodies are accepted and fall back to safe defaults (no 500s on malformed input).

**Response**

```jsonc
{
  "script":    "<full ethers.js v6 source as a string>",
  "model":     "mimo-1m",
  "tokensUsed": 1851,
  "latencyMs":  1207
}
```

The returned `script` is a self-contained Node.js program that loads `PRIVATE_KEYS` from `.env`, sets up a `JsonRpcProvider`, computes EIP-1559 fees with a 1.15× multiplier and mempool-aware bump, sends transactions with `Promise.allSettled` fan-out, replaces stuck txs after 30 s with a +10 % gas bump (preserving original `value`), retries up to 3× with exponential backoff, and throws on terminal failure so failures are surfaced to the caller.

---

## Environment Variables

The dashboard itself runs without env vars — all state is in-memory / Zustand. The **generated** script reads from `.env`:

```ini
# .env — for the generated automation script
PRIVATE_KEYS=0xkey1,0xkey2,0xkey3   # comma-separated; never commit
RPC_URL=https://your-rpc-endpoint   # optional; defaults to the chosen network's public RPC
```

---

## Design Principles

### Log readability is a first-class feature

Most "hacker terminal" UIs use neon green (`text-green-400`, `text-lime-*`, `text-emerald-400/500`). After two hours of staring at transaction logs, those palettes cause real eye strain. MiMo Ops deliberately avoids them.

| Level | Tailwind class | Hex |
| --- | --- | --- |
| Info | `text-slate-300` | `#CBD5E1` |
| Success | `text-sky-300` | `#7DD3FC` |
| Warning | `text-amber-300` | `#FCD34D` |
| Error | `text-rose-300` | `#FDA4AF` |
| Timestamps | `text-slate-500` | `#64748B` |

Backgrounds are `bg-slate-950` (`#020617`) with `font-mono` and `leading-relaxed` for long lines. Streaming indicator is sky/cyan, not green.

### Dark mode by default

The entire UI is built for dark mode. No light-mode fallback — Web3 ops work happens at night.

### Soft accent palette

Primary brand: indigo (`bg-indigo-500`). Status indicators: sky / amber / rose. No saturated reds, greens, or yellows anywhere in interactive surfaces.

---

## Safety Notes

- **Never commit private keys.** The generated script loads them from `.env`. The Add Wallet dialog uses `type=password` inputs and stores keys in browser memory only (no persistence).
- All demo proxy IPs in this repo (`198.51.100.x`, `203.0.113.x`) are TEST-NET-2 / TEST-NET-3 reserved ranges — never real infrastructure.
- The mock `/api/generate-script` route does **not** call any external LLM; it returns a deterministic template. Swap the handler for a real MiMo call when integrating.

---

## Roadmap

- [ ] Wire `/api/generate-script` to the live MiMo LLM endpoint
- [ ] Persistent worker state (SQLite / Postgres) + JWT-authed multi-user
- [ ] WebSocket log stream from a real backend worker pool
- [ ] Real RPC latency probes (replace mock values)
- [ ] In-browser script execution sandbox (Web Worker) for safe dry-runs
- [ ] Telegram / Discord webhook notifications on failed batches

---

## License

MIT — see [LICENSE](./LICENSE).
