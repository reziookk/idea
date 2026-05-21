# ⚡ AgentForge — AI Agent Workflow Builder

**AgentForge** is a visual AI agent orchestration platform powered by **Xiaomi MiMo**. Build, configure, and run multi-agent workflows with drag-and-drop simplicity.

> Built for the [Xiaomi MiMo Orbit 100T Creator Incentive Program](https://100t.xiaomimimo.com/)

## 🎯 What It Does

AgentForge solves the problem of **coordinating multiple AI agents** in a structured pipeline. Instead of manually passing context between agents, you visually design a workflow graph where each node is an AI agent with a specific role, and connections define the data flow between them.

### Core Workflow: 6-Agent Pipeline

```
Planner → Researcher → Coder → Reviewer → Executor → TTS Output
```

Each agent receives the output of its predecessors, processes it with MiMo's reasoning/multimodal/TTS capabilities, and passes results downstream.

## ✨ Features

- **Visual Workflow Builder** — Drag agent nodes onto canvas, connect them to define data flow
- **7 Agent Types** — Planner, Researcher, Coder, Reviewer, Executor, TTS Output, Vision
- **MiMo V2.5 Integration** — Supports Pro (reasoning), Omni (multimodal), and TTS models
- **Topological Execution** — Agents run in dependency order, receiving accumulated context
- **Live Execution Log** — Real-time agent status, token usage tracking, and output monitoring
- **Demo Mode** — Works without API key using simulated responses
- **Export/Import** — Save and load workflow configurations as JSON
- **Customizable Prompts** — Each agent node has editable system and user prompts

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML5 + CSS3 + ES6 JavaScript |
| Styling | Custom CSS (dark theme, CSS Grid/Flexbox) |
| API | Xiaomi MiMo V2.5 (OpenAI-compatible endpoint) |
| Models | MiMo V2.5 Pro, MiMo V2.5 Omni, MiMo V2.5 TTS |
| Deployment | Static site (any HTTP server) |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/reziookk/idea.git
cd idea/agentforge

# Serve locally
python3 -m http.server 8090

# Open in browser
open http://localhost:8090
```

### Connect MiMo API

1. Click **Connect MiMo** in the header
2. Enter your API key from [platform.xiaomimimo.com](https://platform.xiaomimimo.com)
3. Run workflows with real MiMo model outputs

> **Demo mode** works without an API key — click **▶ Run Workflow** to see simulated agent outputs.

## 📸 How It Works

1. **Design** — Drag agent nodes from the sidebar, arrange on canvas, connect with links
2. **Configure** — Set custom prompts per agent, choose MiMo model, adjust temperature/tokens
3. **Execute** — Click Run Workflow; agents execute in topological order, passing outputs downstream
4. **Monitor** — Watch live logs, token usage, and per-node status updates

## 🧠 Agent Pipeline Architecture

```
┌─────────┐    ┌────────────┐    ┌───────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│ Planner │───▶│ Researcher │───▶│ Coder │───▶│ Reviewer │───▶│ Executor │───▶│ TTS Output│
│  📋     │    │    🔍      │    │  💻   │    │   🛡️    │    │   ⚙️    │    │   🔊     │
└─────────┘    └────────────┘    └───────┘    └──────────┘    └──────────┘    └───────────┘
  Breaks down    Gathers          Writes        Reviews         Tests &         Converts
  tasks into     context &        clean         for bugs,       runs code       summary to
  subtasks       best practices   code          security        and reports     speech
                                              & quality        results
```

### Data Flow

- **Planner** → Structured task breakdown with dependencies
- **Researcher** → Context enrichment with best practices and benchmarks  
- **Coder** → Production-ready code implementation with error handling
- **Reviewer** → Code quality assessment (score 1-10, security & style feedback)
- **Executor** → Runtime validation, test execution, deployment readiness check
- **TTS Output** → Natural speech synthesis of the final summary report

## 🎨 Supported MiMo Models

| Model | Capability | Best For |
|-------|-----------|----------|
| MiMo V2.5 Pro | Deep reasoning | Planner, Researcher, Reviewer |
| MiMo V2.5 Omni | Multimodal (text + image) | Vision agent |
| MiMo V2.5 TTS | Text-to-speech | TTS Output agent |

## 📁 Project Structure

```
agentforge/
├── index.html          # Main application
├── css/
│   └── styles.css      # Dark theme UI styles
├── js/
│   ├── workflow.js     # Workflow engine (nodes, connections, execution)
│   └── app.js          # UI interactions, drag-drop, API integration
└── README.md           # This file
```

## 🔮 Roadmap

- [ ] Agent output streaming (SSE)
- [ ] Branching workflows (parallel agent execution)
- [ ] Human-in-the-loop approval nodes
- [ ] Workflow templates marketplace
- [ ] MiMo Vision agent (image input)
- [ ] Multi-language TTS output
- [ ] Persistent workflow storage (localStorage)

## 📝 License

MIT

---

Built with ❤️ and Xiaomi MiMo V2.5
