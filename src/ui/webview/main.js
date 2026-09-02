(function () {
  // Acquire VS Code API
  const vscode = acquireVsCodeApi();

  // DOM Elements
  const messagesContainer = document.getElementById('chat-messages');
  const promptInput = document.getElementById('prompt-input');
  const sendButton = document.getElementById('send-button');
  const providerBadge = document.getElementById('provider-badge');
  const activeFileChip = document.getElementById('active-file-chip');
  const activeSelectionChip = document.getElementById('active-selection-chip');
  const btnSwitchModel = document.getElementById('btn-switch-model');
  const btnSetKey = document.getElementById('btn-set-key');
  const btnOauthLogin = document.getElementById('btn-oauth-login');
  const btnClearChat = document.getElementById('btn-clear-chat');

  let isGenerating = false;
  let currentAssistantBubble = null;
  let currentRawText = '';
  let activeContext = { filename: '', selectionText: '', languageId: '' };

  // Setup auto-growing textarea
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = Math.min(promptInput.scrollHeight, 160) + 'px';
  });

  // Enter to send (Shift+Enter for newline)
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendButton.addEventListener('click', () => {
    if (isGenerating) {
      vscode.postMessage({ type: 'stopGeneration' });
      setGeneratingState(false);
    } else {
      handleSend();
    }
  });

  providerBadge?.addEventListener('click', () => {
    vscode.postMessage({ type: 'switchModel' });
  });

  btnOauthLogin?.addEventListener('click', () => {
    vscode.postMessage({ type: 'oauthLogin' });
  });

  btnSwitchModel?.addEventListener('click', () => {
    vscode.postMessage({ type: 'switchModel' });
  });

  btnSetKey?.addEventListener('click', () => {
    vscode.postMessage({ type: 'setApiKey' });
  });

  btnClearChat?.addEventListener('click', () => {
    vscode.postMessage({ type: 'clearChat' });
    clearChatUI();
  });

  // Quick prompt buttons
  document.querySelectorAll('.quick-prompt-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      if (action) {
        vscode.postMessage({ type: 'quickAction', action });
      }
    });
  });

  function handleSend() {
    const text = promptInput.value.trim();
    if (!text || isGenerating) return;

    // Append user message
    appendMessage('user', text);
    promptInput.value = '';
    promptInput.style.height = 'auto';

    // Start generating
    setGeneratingState(true);
    currentRawText = '';
    currentAssistantBubble = appendMessage('assistant', '');

    vscode.postMessage({
      type: 'sendMessage',
      text: text,
      context: activeContext
    });
  }

  function setGeneratingState(generating) {
    isGenerating = generating;
    if (generating) {
      sendButton.innerHTML = '⏹ Stop';
      sendButton.classList.add('stop-btn');
    } else {
      sendButton.innerHTML = '➤ Send';
      sendButton.classList.remove('stop-btn');
    }
  }

  function appendMessage(role, content) {
    // Hide welcome card once chat starts
    const welcome = document.querySelector('.welcome-card');
    if (welcome) welcome.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'message-row';

    const header = document.createElement('div');
    header.className = 'message-header';
    header.innerHTML =
      role === 'user'
        ? '<span>👤 You</span>'
        : '<span>🤖 FreePilot</span>';
    row.appendChild(header);

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${role}`;
    if (content) {
      bubble.innerHTML = renderMarkdown(content);
      attachCodeActions(bubble);
    }
    row.appendChild(bubble);

    messagesContainer.appendChild(row);
    scrollToBottom();
    return bubble;
  }

  function clearChatUI() {
    messagesContainer.innerHTML = `
      <div class="welcome-card">
        <div class="welcome-title">
          <span>⚡ FreePilot AI Assistant</span>
        </div>
        <p class="welcome-subtitle">
          100% Free AI Copilot powered by Google Gemini, DeepSeek, SiliconFlow, Zhipu GLM, Qwen, Groq, Ollama & OpenRouter.
        </p>
        <div class="free-pills">
          <span class="free-pill">Gemini 2.0 Flash</span>
          <span class="free-pill">DeepSeek R1/V3</span>
          <span class="free-pill">GLM-4-Flash</span>
          <span class="free-pill">Qwen 2.5 Coder</span>
          <span class="free-pill">Llama 3.3 70B</span>
          <span class="free-pill">Ollama Offline</span>
        </div>
        <div class="quick-prompts-grid">
          <button class="quick-prompt-btn" data-action="explain">⚡ Explain Code</button>
          <button class="quick-prompt-btn" data-action="fix">🛠️ Fix Bugs & Issues</button>
          <button class="quick-prompt-btn" data-action="refactor">🔄 Refactor / Optimize</button>
          <button class="quick-prompt-btn" data-action="test">🧪 Generate Unit Tests</button>
          <button class="quick-prompt-btn" data-action="docs">📝 Add Docstrings</button>
          <button class="quick-prompt-btn" data-action="security">🔒 Security Audit</button>
        </div>
      </div>
    `;

    // Re-attach quick buttons
    document.querySelectorAll('.quick-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action) {
          vscode.postMessage({ type: 'quickAction', action });
        }
      });
    });
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle messages from VS Code Extension Host
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      case 'streamChunk': {
        if (!currentAssistantBubble) {
          currentAssistantBubble = appendMessage('assistant', '');
        }
        currentRawText = message.accumulated;
        currentAssistantBubble.innerHTML =
          renderMarkdown(currentRawText) + '<span class="cursor-pulse"></span>';
        attachCodeActions(currentAssistantBubble);
        scrollToBottom();
        break;
      }

      case 'streamEnd': {
        setGeneratingState(false);
        if (currentAssistantBubble) {
          currentAssistantBubble.innerHTML = renderMarkdown(message.fullText || currentRawText);
          attachCodeActions(currentAssistantBubble);
        }
        currentAssistantBubble = null;
        currentRawText = '';
        scrollToBottom();
        break;
      }

      case 'streamError': {
        setGeneratingState(false);
        if (currentAssistantBubble) {
          currentAssistantBubble.innerHTML += `<div style="color: #ef4444; margin-top: 8px; font-weight: bold;">⚠️ Error: ${escapeHtml(message.error)}</div>`;
        } else {
          appendMessage('assistant', `⚠️ **Error**: ${message.error}`);
        }
        currentAssistantBubble = null;
        scrollToBottom();
        break;
      }

      case 'setContext': {
        activeContext = message.context || { filename: '', selectionText: '', languageId: '' };
        if (activeFileChip) {
          if (activeContext.filename) {
            activeFileChip.style.display = 'flex';
            activeFileChip.textContent = `📄 ${activeContext.filename}`;
          } else {
            activeFileChip.style.display = 'none';
          }
        }
        if (activeSelectionChip) {
          if (activeContext.selectionText && activeContext.selectionText.trim().length > 0) {
            activeSelectionChip.style.display = 'flex';
            const lines = activeContext.selectionText.trim().split('\n').length;
            activeSelectionChip.textContent = `✂️ Selection (${lines} lines)`;
          } else {
            activeSelectionChip.style.display = 'none';
          }
        }
        break;
      }

      case 'updateConfig': {
        if (providerBadge) {
          providerBadge.textContent = `${message.flag || '⚡'} ${message.model || message.provider}`;
        }
        break;
      }

      case 'addUserMessage': {
        appendMessage('user', message.text);
        setGeneratingState(true);
        currentRawText = '';
        currentAssistantBubble = appendMessage('assistant', '');
        break;
      }

      case 'loadHistory': {
        if (message.messages && message.messages.length > 0) {
          const welcome = document.querySelector('.welcome-card');
          if (welcome) welcome.style.display = 'none';
          messagesContainer.innerHTML = '';
          message.messages.forEach((msg) => {
            if (msg.role === 'user' || msg.role === 'assistant') {
              appendMessage(msg.role, msg.content);
            }
          });
          scrollToBottom();
        }
        break;
      }

      case 'clearChat': {
        clearChatUI();
        break;
      }
    }
  });

  // Markdown rendering with code fences
  function renderMarkdown(md) {
    if (!md) return '';

    // First handle triple-backtick code blocks
    let processed = md.replace(/```([\w-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const escapedCode = escapeHtml(code.trimEnd());
      const displayLang = lang || 'code';
      return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span>${displayLang}</span>
          <div class="code-actions">
            <button class="code-btn btn-copy" data-code="${escapeAttr(code)}">📋 Copy</button>
            <button class="code-btn btn-insert" data-code="${escapeAttr(code)}">📥 Insert</button>
            <button class="code-btn btn-replace" data-code="${escapeAttr(code)}">🔄 Replace</button>
            <button class="code-btn btn-diff" data-code="${escapeAttr(code)}">⚡ Diff</button>
          </div>
        </div>
        <pre><code class="language-${displayLang}">${escapedCode}</code></pre>
      </div>`;
    });

    // Inline formatting
    processed = processed
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');

    // Group consecutive <li> into a single <ul>
    processed = processed.replace(
      /(<li>[\s\S]*?<\/li>)(\s*<li>[\s\S]*?<\/li>)*/g,
      (match) => `<ul>${match}</ul>`
    );

    processed = processed.replace(/\n\n/g, '<br/><br/>');

    return processed;
  }

  function attachCodeActions(container) {
    container.querySelectorAll('.btn-copy').forEach((btn) => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          navigator.clipboard.writeText(code);
          btn.textContent = '✓ Copied!';
          btn.classList.add('success');
          setTimeout(() => {
            btn.textContent = '📋 Copy';
            btn.classList.remove('success');
          }, 1500);
        }
      };
    });

    container.querySelectorAll('.btn-insert').forEach((btn) => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          vscode.postMessage({ type: 'insertCode', code });
        }
      };
    });

    container.querySelectorAll('.btn-replace').forEach((btn) => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          vscode.postMessage({ type: 'replaceCode', code });
        }
      };
    });

    container.querySelectorAll('.btn-diff').forEach((btn) => {
      btn.onclick = () => {
        const code = btn.getAttribute('data-code');
        if (code) {
          vscode.postMessage({ type: 'diffCode', code });
        }
      };
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Signal ready to host
  vscode.postMessage({ type: 'webviewReady' });
})();
