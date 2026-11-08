# ⚡ FreePilot - The 100% Free AI Copilot & Chat for VS Code

**FreePilot** is an open-source, zero-cost AI coding companion for Visual Studio Code. It brings the power of **GitHub Copilot + Cursor AI** into your editor without requiring paid subscriptions, utilizing top-tier free AI models and local offline LLMs.

---

## ✨ Key Features

### 1. 🤖 Interactive Sidebar AI Chat Assistant
- Chat seamlessly with AI directly inside the VS Code sidebar.
- **Streaming markdown responses** with syntax-highlighted code blocks.
- One-click code actions on every generated code snippet:
  - 📋 **Copy**: Copy snippet to clipboard.
  - 📥 **Insert at Cursor**: Place code directly into active editor position.
  - 🔄 **Replace Selection**: Overwrite highlighted text with suggested solution.
  - ⚡ **Diff View**: Open a side-by-side VS Code diff comparison before applying changes.

### 2. 👻 Real-Time Inline Ghost-Text Code Completions
- GitHub Copilot-style inline ghost text suggestions as you type.
- Powered by Fill-in-the-Middle (FIM) context extraction (prefix + suffix).
- Intelligent debounce (configurable) and multi-line completion parsing.

### 3. ⚡ One-Click Right-Click Context Menu Actions
- ⚡ **Explain Code** (`Ctrl+Alt+E`): Step-by-step breakdown of selected logic.
- 🛠️ **Fix Bugs & Issues** (`Ctrl+Alt+F`): Analyzes code + VS Code compiler diagnostics to deliver instant fixes.
- 🔄 **Refactor & Optimize**: Clean code principles, typing, time/space complexity optimization.
- 🧪 **Generate Unit Tests**: Ready-to-run tests in Jest, PyTest, JUnit, Go testing, etc.
- 📝 **Add Docstrings / Comments**: JSDoc, TSDoc, Python docstrings, GoDoc, JavaDoc.
- 🔒 **Security & Vulnerability Audit**: Detect SQL injection, XSS, insecure input, and secrets leaks.
- ✨ **Complete Code at Cursor** (`Ctrl+Alt+Space`): Manual trigger for full block completion.

---

## 🌐 Supported Free AI Providers & Free Tiers

FreePilot connects to top-tier free AI engines worldwide:

| Provider | Country / Origin | Highlight Models | Free Tier Details | Free Key Link |
| :--- | :---: | :--- | :--- | :--- |
| **SiliconFlow (硅基流动)** | 🇨🇳 China | `deepseek-ai/DeepSeek-V3`<br>`deepseek-ai/DeepSeek-R1`<br>`Qwen/Qwen2.5-Coder-32B`<br>`THUDM/glm-4-9b-chat` | Generous free balance & permanent free models | [SiliconCloud](https://cloud.siliconflow.cn/account/ak) |
| **Zhipu AI (智谱清言)** | 🇨🇳 China | `glm-4-flash` | **100% Free Forever** on BigModel platform | [Zhipu BigModel](https://open.bigmodel.cn/usercenter/apikeys) |
| **Alibaba DashScope (通义千问)** | 🇨🇳 China | `qwen2.5-coder-32b-instruct`<br>`qwen-plus`<br>`qwen-turbo` | Free token quota on DashScope | [DashScope Console](https://dashscope.console.aliyun.com/apiKey) |
| **Moonshot Kimi (月之暗面)** | 🇨🇳 China | `moonshot-v1-8k`<br>`moonshot-v1-32k`<br>`moonshot-v1-128k`<br>`moonshot-v1-auto` | Free starter quota on Moonshot Platform | [Moonshot Platform](https://platform.moonshot.cn/console/api-keys) |
| **DeepSeek Official** | 🇨🇳 China | `deepseek-chat` (V3)<br>`deepseek-reasoner` (R1) | Free starter credits on platform | [DeepSeek Platform](https://platform.deepseek.com/api_keys) |
| **Groq Cloud** | 🇺🇸 USA | `llama-3.3-70b-versatile`<br>`deepseek-r1-distill-llama-70b`<br>`llama-3.1-8b-instant`<br>`mixtral-8x7b-32768` | Ultra-fast free tier (500+ tok/s) | [Groq Console](https://console.groq.com/keys) |
| **Cerebras Cloud** | 🇺🇸 USA | `llama3.3-70b`<br>`llama3.1-8b` | Blazing fast (1800+ tok/s) free tier | [Cerebras Cloud](https://cloud.cerebras.ai/) |
| **Pollinations AI** | 🌸 Global | `openai-fast`<br>`openai`<br>`mistral`<br>`gpt-4o` | **100% Free & Unlimited** (No key required) | [Pollinations.ai](https://pollinations.ai/) |
| **OpenRouter** | 🌐 Global | `deepseek-v4-flash-0731:free`<br>`cohere/north-mini-code:free`<br>`poolside/laguna-s-2.1:free`<br>`qwen/qwen3.8-27b:free`<br>`nemotron-3.5-lightning:free`<br>`deepseek-r1:free` | All `:free` models on OpenRouter | [OpenRouter Keys](https://openrouter.ai/keys) |
| **Mistral AI** | 🇫🇷 France | `codestral-latest`<br>`mistral-small-latest` | Free developer tier on Mistral Console | [Mistral Console](https://console.mistral.ai/api-keys/) |
| **Local Ollama** | 💻 Offline | `qwen2.5-coder`<br>`deepseek-coder-v2`<br>`codellama`<br>`llama3.2` | **100% Free, Private & Offline** (No key needed) | [Ollama.ai](https://ollama.ai/) |
| **Custom Endpoint** | 🛠️ Custom | LM Studio, LocalAI, vLLM, FastChat | Connect to any local or self-hosted server | Configurable URL |

---

## 🚀 Getting Started

### Method 1: Running in Debug Mode (F5)
1. Open this `free-pilot` folder in VS Code.
2. Press **`F5`** on your keyboard (or go to Run & Debug > Run FreePilot Extension).
3. A new **Extension Development Host** VS Code window will launch with FreePilot activated.
4. Open the FreePilot icon on the sidebar or press **`Ctrl+Alt+C`** to start chatting!

### Method 2: Package into `.vsix` for 1-Click Installation
To install the extension into your everyday VS Code:
```bash
npm run package
```
This generates `free-pilot-0.1.0.vsix`. In VS Code, open the Extensions view (`Ctrl+Shift+X`), click `...` at the top right, and select **Install from VSIX...**.

---

## ⚙️ Configuration & Settings

Access settings via `Settings` > Search `FreePilot` or edit `settings.json`:

| Setting | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `freepilot.provider` | `enum` | `"groq"` | Active provider (`groq`, `siliconflow`, `zhipu`, `dashscope`, `kimi`, `deepseek`, `cerebras`, `pollinations`, `openrouter`, `mistral`, `ollama`, `custom`) |
| `freepilot.model` | `string` | `"llama-3.3-70b-versatile"` | Active model identifier |
| `freepilot.enableInlineCompletions` | `boolean` | `true` | Enable real-time ghost text inline code completions |
| `freepilot.inlineCompletionDelayMs` | `number` | `350` | Debounce delay before fetching inline suggestions |
| `freepilot.ollamaEndpoint` | `string` | `"http://localhost:11434"` | Endpoint URL for local Ollama |
| `freepilot.customEndpoint` | `string` | `"http://localhost:1234/v1"` | Base URL for custom OpenAI-compatible API |

---

## ⌨️ Shortcuts

| Action | Shortcut (Windows/Linux) | Shortcut (macOS) |
| :--- | :--- | :--- |
| **Toggle FreePilot Chat** | `Ctrl + Alt + C` | `Cmd + Alt + C` |
| **Complete Code at Cursor** | `Ctrl + Alt + Space` | `Cmd + Alt + Space` |
| **Explain Selected Code** | `Ctrl + Alt + E` | `Cmd + Alt + E` |
| **Fix Bugs in Selection** | `Ctrl + Alt + F` | `Cmd + Alt + F` |

---

## 🔒 Security & Privacy

- All API keys are encrypted and stored safely inside **VS Code SecretStorage** (operating system keychain).
- Local Ollama runs completely offline on `localhost:11434` — zero data leaves your computer.
- Open-source, transparent, and telemetry-free.
