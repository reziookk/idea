/**
 * AgentForge — Workflow Engine
 * Manages agent nodes, connections, and execution pipeline
 */

const AGENT_TYPES = {
  planner:    { icon: '📋', label: 'Planner',    color: '#5b8def', systemPrompt: 'You are a task planning agent. Break down complex tasks into structured subtasks with dependencies.' },
  researcher: { icon: '🔍', label: 'Researcher', color: '#c084fc', systemPrompt: 'You are a research agent. Gather information, analyze context, and provide detailed findings.' },
  coder:      { icon: '💻', label: 'Coder',      color: '#34d399', systemPrompt: 'You are a coding agent. Write clean, efficient code based on specifications provided.' },
  reviewer:   { icon: '🛡️', label: 'Reviewer',   color: '#f97316', systemPrompt: 'You are a code review agent. Analyze code for bugs, security issues, and best practice violations.' },
  executor:   { icon: '⚙️', label: 'Executor',   color: '#ef4444', systemPrompt: 'You are an execution agent. Run code, test outputs, and report results.' },
  tts:        { icon: '🔊', label: 'TTS Output', color: '#e879f9', systemPrompt: 'Convert the input text to speech output using MiMo TTS model.' },
  vision:     { icon: '👁️', label: 'Vision',     color: '#facc15', systemPrompt: 'You are a vision agent. Analyze images and provide detailed descriptions and insights.' }
};

class WorkflowEngine {
  constructor() {
    this.nodes = new Map();
    this.connections = [];
    this.executionOrder = [];
    this.isRunning = false;
    this.totalTokens = 0;
    this.nodeIdCounter = 0;
  }

  addNode(type, x = 100, y = 100) {
    const id = `node_${++this.nodeIdCounter}`;
    const agent = AGENT_TYPES[type];
    if (!agent) return null;

    const node = {
      id,
      type,
      x,
      y,
      label: agent.label,
      icon: agent.icon,
      color: agent.color,
      systemPrompt: agent.systemPrompt,
      status: 'idle', // idle | running | completed | error
      output: '',
      tokens: 0,
      prompt: ''
    };

    this.nodes.set(id, node);
    return node;
  }

  removeNode(id) {
    this.nodes.delete(id);
    this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
  }

  addConnection(fromId, toId) {
    if (fromId === toId) return false;
    const exists = this.connections.some(c => c.from === fromId && c.to === toId);
    if (exists) return false;
    // Prevent cycles
    if (this.wouldCreateCycle(fromId, toId)) return false;
    this.connections.push({ from: fromId, to: toId });
    return true;
  }

  wouldCreateCycle(fromId, toId) {
    const visited = new Set();
    const stack = [toId];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === fromId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const conn of this.connections) {
        if (conn.from === current) stack.push(conn.to);
      }
    }
    return false;
  }

  removeConnection(fromId, toId) {
    this.connections = this.connections.filter(c => !(c.from === fromId && c.to === toId));
  }

  getExecutionOrder() {
    // Topological sort
    const inDegree = new Map();
    const adjacency = new Map();

    for (const [id] of this.nodes) {
      inDegree.set(id, 0);
      adjacency.set(id, []);
    }

    for (const conn of this.connections) {
      adjacency.get(conn.from).push(conn.to);
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1);
    }

    const queue = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const order = [];
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);
      for (const neighbor of adjacency.get(current) || []) {
        const newDeg = inDegree.get(neighbor) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return order;
  }

  async executeNode(nodeId, input, apiCall) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    node.status = 'running';
    node.output = '';

    try {
      const model = document.querySelector('input[name="model"]:checked')?.value || 'mimo-v2.5-pro';
      const temperature = parseFloat(document.getElementById('temperature')?.value || 30) / 100;

      const messages = [
        { role: 'system', content: node.systemPrompt },
      ];

      if (input) {
        messages.push({ role: 'user', content: input });
      } else if (node.prompt) {
        messages.push({ role: 'user', content: node.prompt });
      } else {
        messages.push({ role: 'user', content: 'Begin your task based on your role description.' });
      }

      const result = await apiCall({
        model,
        messages,
        temperature,
        max_tokens: parseInt(document.getElementById('maxTokens')?.value || 4096),
      });

      node.output = result.content || '';
      node.tokens = (result.usage?.total_tokens || 0);
      this.totalTokens += node.tokens;
      node.status = 'completed';

      return node.output;
    } catch (err) {
      node.status = 'error';
      node.output = err.message || 'Execution failed';
      throw err;
    }
  }

  async runWorkflow(apiCall, onNodeUpdate, onLog) {
    if (this.isRunning) return;
    this.isRunning = true;

    const order = this.getExecutionOrder();
    onLog?.('info', `Workflow started — ${order.length} agents in pipeline`);

    const nodeOutputs = new Map();

    for (const nodeId of order) {
      if (!this.isRunning) break;

      const node = this.nodes.get(nodeId);
      onNodeUpdate?.(nodeId);
      onLog?.('agent', `[${node.label}] Starting execution...`);

      // Gather inputs from connected predecessors
      const predecessorOutputs = this.connections
        .filter(c => c.to === nodeId)
        .map(c => nodeOutputs.get(c.from) || '')
        .filter(Boolean);

      const input = predecessorOutputs.join('\n\n---\n\n');

      try {
        const output = await this.executeNode(nodeId, input, apiCall);
        nodeOutputs.set(nodeId, output);
        onNodeUpdate?.(nodeId);
        onLog?.('success', `[${node.label}] Completed — ${node.tokens.toLocaleString()} tokens used`);
      } catch (err) {
        onNodeUpdate?.(nodeId);
        onLog?.('error', `[${node.label}] Error: ${err.message}`);
        this.isRunning = false;
        break;
      }
    }

    this.isRunning = false;
    onLog?.('info', `Workflow finished — Total: ${this.totalTokens.toLocaleString()} tokens`);
  }

  stop() {
    this.isRunning = false;
  }

  clear() {
    this.nodes.clear();
    this.connections = [];
    this.executionOrder = [];
    this.totalTokens = 0;
    this.nodeIdCounter = 0;
  }

  serialize() {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      connections: this.connections
    }, null, 2);
  }

  deserialize(json) {
    try {
      const data = JSON.parse(json);
      this.clear();
      for (const node of data.nodes) {
        this.nodes.set(node.id, node);
        if (node.id.includes('_')) {
          const counter = parseInt(node.id.split('_')[1]);
          if (counter > this.nodeIdCounter) this.nodeIdCounter = counter;
        }
      }
      this.connections = (data.connections || []).filter(
        c => this.nodes.has(c.from) && this.nodes.has(c.to) && c.from !== c.to
      );
      this.totalTokens = Array.from(this.nodes.values()).reduce((sum, n) => sum + (n.tokens || 0), 0);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton
const engine = new WorkflowEngine();
