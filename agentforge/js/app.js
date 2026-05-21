/**
 * AgentForge — Main Application
 * UI interactions, drag-drop, canvas rendering, MiMo API integration
 */

let isConnected = false;
let dragNode = null;
let dragOffset = { x: 0, y: 0 };
let connectMode = null; // null | { fromId }
let svgLayer = null;

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
  svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgLayer.classList.add('connections-svg');
  document.getElementById('canvas').appendChild(svgLayer);

  setupDragFromPalette();
  setupDragOnCanvas();
  setupTemperature();
  setupKeyboard();

  // Auto-load template after short delay
  setTimeout(() => addDefaultWorkflow(), 300);
});

// === Temperature Slider ===
function setupTemperature() {
  const slider = document.getElementById('temperature');
  const display = document.getElementById('tempValue');
  if (slider && display) {
    slider.addEventListener('input', () => {
      display.textContent = (slider.value / 100).toFixed(1);
    });
  }
}

// === Keyboard Shortcuts ===
function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'promptInput') {
      submitPrompt();
    }
  });
}

// === Connection Modal ===
function toggleConnection() {
  if (isConnected) {
    isConnected = false;
    const btn = document.getElementById('btnConnect');
    btn.innerHTML = '<span class="btn-dot"></span> Connect MiMo';
    btn.parentElement.classList.remove('connected');
    addLog('info', 'Disconnected from MiMo API');
    return;
  }
  document.getElementById('connectModal').style.display = 'flex';
  const modalKey = document.getElementById('modalApiKey');
  const sidebarKey = document.getElementById('apiKey');
  if (sidebarKey?.value) modalKey.value = sidebarKey.value;
  modalKey.focus();
}

function closeModal() {
  document.getElementById('connectModal').style.display = 'none';
}

function connectApi() {
  const key = document.getElementById('modalApiKey').value.trim();
  if (!key) {
    addLog('error', 'Please enter a valid API key');
    return;
  }
  document.getElementById('apiKey').value = key;
  isConnected = true;
  closeModal();

  const btn = document.getElementById('btnConnect');
  btn.innerHTML = '<span class="btn-dot"></span> Connected';
  btn.parentElement.classList.add('connected');
  addLog('success', 'Connected to Xiaomi MiMo API');
}

// === Drag from Palette ===
function setupDragFromPalette() {
  document.querySelectorAll('.node-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('agentType', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  const canvas = document.getElementById('canvas');
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('agentType');
    if (!type || !AGENT_TYPES[type]) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left + canvas.scrollLeft - 80;
    const y = e.clientY - rect.top + canvas.scrollTop - 20;

    const node = engine.addNode(type, x, y);
    if (node) renderNode(node);
    hideCanvasHint();
  });
}

// === Drag on Canvas (move nodes) ===
function setupDragOnCanvas() {
  const canvas = document.getElementById('canvas');

  canvas.addEventListener('mousedown', (e) => {
    const nodeEl = e.target.closest('.wf-node');
    if (!nodeEl) return;

    // Check if clicking connect handle
    if (e.target.classList.contains('connect-handle')) {
      const fromId = nodeEl.dataset.id;
      connectMode = { fromId };
      addLog('info', `Select target node to connect from ${engine.nodes.get(fromId)?.label}`);
      return;
    }

    // Check if clicking delete handle
    if (e.target.classList.contains('delete-handle')) {
      const id = nodeEl.dataset.id;
      engine.removeNode(id);
      nodeEl.remove();
      renderConnections();
      return;
    }

    const id = nodeEl.dataset.id;
    const node = engine.nodes.get(id);
    if (!node) return;

    // If in connect mode, complete the connection
    if (connectMode) {
      const success = engine.addConnection(connectMode.fromId, id);
      if (success) {
        addLog('success', `Connected ${engine.nodes.get(connectMode.fromId)?.label} → ${node.label}`);
        renderConnections();
      } else {
        addLog('warning', 'Cannot create connection (cycle or duplicate)');
      }
      connectMode = null;
      return;
    }

    dragNode = nodeEl;
    const rect = nodeEl.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    nodeEl.style.zIndex = 20;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragNode) return;
    const canvas = document.getElementById('canvas');
    const canvasRect = canvas.getBoundingClientRect();

    let x = e.clientX - canvasRect.left + canvas.scrollLeft - dragOffset.x;
    let y = e.clientY - canvasRect.top + canvas.scrollTop - dragOffset.y;

    x = Math.max(0, x);
    y = Math.max(0, y);

    dragNode.style.left = x + 'px';
    dragNode.style.top = y + 'px';

    const node = engine.nodes.get(dragNode.dataset.id);
    if (node) { node.x = x; node.y = y; }
    renderConnections();
  });

  document.addEventListener('mouseup', () => {
    if (dragNode) {
      dragNode.style.zIndex = 10;
      dragNode = null;
    }
  });
}

// === Render Node on Canvas ===
function renderNode(node) {
  const canvas = document.getElementById('canvas');
  const el = document.createElement('div');
  el.className = 'wf-node';
  el.dataset.id = node.id;
  el.style.left = node.x + 'px';
  el.style.top = node.y + 'px';

  const agent = AGENT_TYPES[node.type];
  if (!agent) return; // guard against unknown node types
  const statusColors = { idle: '#8888a8', running: '#6c5ce7', completed: '#00d2a0', error: '#ff5555' };
  const statusLabels = { idle: 'IDLE', running: 'RUN', completed: 'DONE', error: 'ERR' };

  el.innerHTML = `
    <div class="wf-node-header" style="border-top: 2px solid ${agent.color}">
      <div class="wf-node-icon" style="background:${agent.color}22;border:1px solid ${agent.color}44">${agent.icon}</div>
      <span class="wf-node-title">${node.label}</span>
      <span class="wf-node-status" style="background:${statusColors[node.status]}22;color:${statusColors[node.status]}">${statusLabels[node.status]}</span>
      <span class="connect-handle" style="cursor:crosshair;font-size:14px;margin-left:4px" title="Connect from here">🔗</span>
      <span class="delete-handle" style="cursor:pointer;font-size:14px;margin-left:2px" title="Remove node">✕</span>
    </div>
    <div class="wf-node-body">
      <textarea class="prompt-text" placeholder="Custom prompt for this agent..." data-node-id="${node.id}">${node.prompt || ''}</textarea>
      <div class="token-usage">
        <span>Tokens: ${(node.tokens || 0).toLocaleString()}</span>
        <span style="color:${statusColors[node.status]}">${statusLabels[node.status]}</span>
      </div>
    </div>
  `;

  // Bind prompt textarea
  const textarea = el.querySelector('.prompt-text');
  textarea.addEventListener('input', (e) => {
    const n = engine.nodes.get(e.target.dataset.nodeId);
    if (n) n.prompt = e.target.value;
  });
  // Prevent drag when typing
  textarea.addEventListener('mousedown', (e) => e.stopPropagation());

  canvas.appendChild(el);
}

function updateNodeStatus(nodeId) {
  const node = engine.nodes.get(nodeId);
  if (!node) return;

  const el = document.querySelector(`.wf-node[data-id="${nodeId}"]`);
  if (!el) return;

  el.className = 'wf-node' + (node.status === 'running' ? ' running' : node.status === 'completed' ? ' completed' : node.status === 'error' ? ' error' : '');

  const statusEl = el.querySelector('.wf-node-status');
  const statusColors = { idle: '#8888a8', running: '#6c5ce7', completed: '#00d2a0', error: '#ff5555' };
  const statusLabels = { idle: 'IDLE', running: 'RUN', completed: 'DONE', error: 'ERR' };
  if (statusEl) {
    statusEl.style.background = statusColors[node.status] + '22';
    statusEl.style.color = statusColors[node.status];
    statusEl.textContent = statusLabels[node.status];
  }

  const tokenEl = el.querySelector('.token-usage span:first-child');
  if (tokenEl) tokenEl.textContent = 'Tokens: ' + (node.tokens || 0).toLocaleString();

  // Update global token counter
  document.getElementById('tokenCount').textContent = engine.totalTokens.toLocaleString();
}

// === Render Connections ===
function renderConnections() {
  if (!svgLayer) return;
  svgLayer.innerHTML = '';

  for (const conn of engine.connections) {
    const fromNode = engine.nodes.get(conn.from);
    const toNode = engine.nodes.get(conn.to);
    if (!fromNode || !toNode) continue;

    const fromEl = document.querySelector(`.wf-node[data-id="${conn.from}"]`);
    const toEl = document.querySelector(`.wf-node[data-id="${conn.to}"]`);
    if (!fromEl || !toEl) continue;

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();
    const canvasRect = document.getElementById('canvas').getBoundingClientRect();

    const x1 = fromRect.right - canvasRect.left + document.getElementById('canvas').scrollLeft;
    const y1 = fromRect.top + fromRect.height / 2 - canvasRect.top + document.getElementById('canvas').scrollTop;
    const x2 = toRect.left - canvasRect.left + document.getElementById('canvas').scrollLeft;
    const y2 = toRect.top + toRect.height / 2 - canvasRect.top + document.getElementById('canvas').scrollTop;

    const midX = (x1 + x2) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
    path.classList.add(conn.active ? 'active' : '');
    svgLayer.appendChild(path);
  }
}

// === Default Workflow Template ===
function addDefaultWorkflow() {
  engine.clear();
  document.querySelectorAll('.wf-node').forEach(el => el.remove());

  const nodes = [
    engine.addNode('planner', 60, 40),
    engine.addNode('researcher', 300, 40),
    engine.addNode('coder', 540, 40),
    engine.addNode('reviewer', 540, 220),
    engine.addNode('executor', 300, 220),
    engine.addNode('tts', 60, 220),
  ];

  // Set default prompts
  const defaultPrompts = {
    planner: 'Analyze the given task and break it into structured subtasks. Output a numbered list with dependencies.',
    researcher: 'Research best practices and relevant information for the planned subtasks. Provide detailed context.',
    coder: 'Write clean, production-ready code based on the research and plan. Include error handling.',
    reviewer: 'Review the code for bugs, security vulnerabilities, and best practice violations. Provide a score (1-10) and fix suggestions.',
    executor: 'Execute the code and test outputs. Report any runtime errors or unexpected behaviors.',
    tts: 'Convert the final review and execution summary into a spoken audio report.'
  };

  nodes.forEach(n => {
    if (n) {
      n.prompt = defaultPrompts[n.type] || '';
      renderNode(n);
      const textarea = document.querySelector(`.prompt-text[data-node-id="${n.id}"]`);
      if (textarea) textarea.value = n.prompt;
    }
  });

  // Auto-connect in sequence
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i] && nodes[i + 1]) {
      engine.addConnection(nodes[i].id, nodes[i + 1].id);
    }
  }

  renderConnections();
  hideCanvasHint();
  addLog('info', 'Default 6-agent workflow loaded');
}

// === Clear Canvas ===
function clearCanvas() {
  engine.clear();
  document.querySelectorAll('.wf-node').forEach(el => el.remove());
  renderConnections();
  document.getElementById('tokenCount').textContent = '0';
  showCanvasHint();
  addLog('info', 'Canvas cleared');
}

// === Export / Import ===
function exportWorkflow() {
  const data = engine.serialize();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'agentforge-workflow.json';
  a.click();
  URL.revokeObjectURL(url);
  addLog('success', 'Workflow exported');
}

function importWorkflow() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const success = engine.deserialize(ev.target.result);
      if (success) {
        document.querySelectorAll('.wf-node').forEach(el => el.remove());
        for (const [id, node] of engine.nodes) {
          if (!AGENT_TYPES[node.type]) continue; // skip unknown node types
          renderNode(node);
          const textarea = document.querySelector(`.prompt-text[data-node-id="${id}"]`);
          if (textarea) textarea.value = node.prompt || '';
        }
        renderConnections();
        document.getElementById('tokenCount').textContent = engine.totalTokens.toLocaleString();
        hideCanvasHint();
        addLog('success', 'Workflow imported');
      } else {
        addLog('error', 'Failed to import workflow — invalid format');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// === MiMo API Call ===
async function mimoApiCall(params) {
  const apiKey = document.getElementById('apiKey')?.value;
  if (!apiKey) throw new Error('No API key configured');

  const response = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage || { total_tokens: 0 }
  };
}

// Demo API call (simulated — no real key needed)
async function demoApiCall(params) {
  // Simulate API latency
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

  const lastMsg = params.messages?.[params.messages.length - 1]?.content || '';
  const model = params.model || 'mimo-v2.5-pro';

  const demoResponses = {
    planner: `Task Analysis Complete:\n\n1. Gather requirements and constraints\n2. Identify key components and interfaces\n3. Define data flow architecture\n4. Plan implementation phases\n5. Set validation checkpoints\n\nDependencies: Steps 1-2 must complete before 3-5.\nEstimated complexity: Medium`,
    researcher: `Research Findings:\n\n• Best practices recommend modular architecture\n• Similar systems use event-driven patterns\n• Performance benchmarks suggest 15ms avg latency\n• Security: TLS 1.3 + token-based auth recommended\n• Documentation: OpenAPI 3.0 spec for API layer\n\nConfidence: High (87%)`,
    coder: `Implementation:\n\n\`\`\`javascript\nclass AgentPipeline {\n  constructor(config) {\n    this.agents = config.agents;\n    this.context = new Map();\n  }\n\n  async execute(input) {\n    let result = input;\n    for (const agent of this.agents) {\n      result = await agent.process(result);\n      this.context.set(agent.id, result);\n    }\n    return result;\n  }\n}\n\`\`\`\n\nCode includes error handling, logging, and type safety.`,
    reviewer: `Code Review Report:\n\n✅ Structure: Well-organized, follows SOLID principles\n✅ Error handling: Comprehensive try-catch with fallbacks\n⚠️ Performance: Consider batching for high-volume scenarios\n⚠️ Security: Add input sanitization for external data\n\nScore: 8/10\nCritical issues: 0\nSuggestions: 2`,
    executor: `Execution Results:\n\n✓ All unit tests passed (12/12)\n✓ Integration test suite: PASSED\n✓ Memory usage: 24MB (within limits)\n✓ Avg response time: 12ms\n✗ Edge case: Empty input not handled (minor)\n\nStatus: READY FOR DEPLOYMENT`,
    tts: `Audio output generated successfully.\nDuration: 45 seconds\nFormat: MP3 44.1kHz\nVoice: MiMo Natural TTS\n\nThe review summary has been converted to speech output with natural intonation and emphasis on key findings.`,
    vision: `Image Analysis:\n\n• Type: Screenshot/Web interface\n• Elements detected: Navigation, content area, sidebar\n• Color scheme: Dark theme with accent colors\n• Layout: Responsive grid layout\n• Accessibility: Good contrast ratios detected\n\nRecommendations: Consider adding ARIA labels for dynamic content.`
  };

  // Match by system prompt or pick based on context
  let response = 'Agent processing complete. Output generated based on input context.';
  for (const [key, val] of Object.entries(demoResponses)) {
    if (lastMsg.toLowerCase().includes(key) || params.messages?.[0]?.content?.toLowerCase().includes(key)) {
      response = val;
      break;
    }
  }

  const inputTokens = Math.floor(lastMsg.length / 3.5);
  const outputTokens = Math.floor(response.length / 3.5);

  return {
    content: response,
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    }
  };
}

// === Run Workflow ===
async function runWorkflow() {
  if (engine.nodes.size === 0) {
    addLog('warning', 'No agents on canvas. Add nodes or load a template.');
    return;
  }

  const btnRun = document.getElementById('btnRun');
  const btnStop = document.getElementById('btnStop');
  btnRun.style.display = 'none';
  btnStop.style.display = 'inline-flex';

  const apiFn = isConnected ? mimoApiCall : demoApiCall;

  try {
    await engine.runWorkflow(
      apiFn,
      (nodeId) => updateNodeStatus(nodeId),
      (level, msg) => addLog(level, msg)
    );
  } catch (err) {
    addLog('error', `Workflow failed: ${err.message}`);
  }

  btnRun.style.display = 'inline-flex';
  btnStop.style.display = 'none';
}

function stopWorkflow() {
  engine.stop();
  addLog('warning', 'Workflow stopped by user');
}

// === Submit Prompt ===
function submitPrompt() {
  const input = document.getElementById('promptInput');
  const task = input.value.trim();
  if (!task) return;

  input.value = '';

  // If there's a planner node, update its prompt
  for (const [id, node] of engine.nodes) {
    if (node.type === 'planner') {
      node.prompt = task;
      const textarea = document.querySelector(`.prompt-text[data-node-id="${id}"]`);
      if (textarea) textarea.value = task;
      addLog('info', `Task assigned to Planner: "${task.substring(0, 60)}..."`);
      // Auto-run workflow
      runWorkflow();
      return;
    }
  }

  addLog('warning', 'No Planner agent found. Add one to process tasks.');
}

// === Logging ===
function addLog(level, message) {
  const body = document.getElementById('logBody');
  const entry = document.createElement('div');
  entry.className = `log-entry ${level}`;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  entry.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${message}</span>`;
  body.appendChild(entry);
  body.scrollTop = body.scrollHeight;
}

function clearLogs() {
  const body = document.getElementById('logBody');
  body.innerHTML = '';
  addLog('info', 'Logs cleared');
}

// === Canvas Hints ===
function hideCanvasHint() {
  const hint = document.getElementById('canvasHint');
  if (hint) hint.style.display = 'none';
}

function showCanvasHint() {
  const hint = document.getElementById('canvasHint');
  if (hint) hint.style.display = 'block';
}
