import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import { ProviderManager } from '../providers/providerManager';
import { ChatMessage } from '../types';
import { ContextExtractor } from '../utils/contextExtractor';
import { PromptTemplates } from '../utils/promptTemplates';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'freepilot.chatView';

  private view?: vscode.WebviewView;
  private configManager = ConfigManager.getInstance();
  private providerManager = ProviderManager.getInstance();
  private conversationHistory: ChatMessage[] = [];
  private abortController?: AbortController;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      await this.handleWebviewMessage(data);
    });

    // Send initial context and config
    this.sendCurrentContext();
    this.sendConfigUpdate();

    // Listen for active editor changes
    vscode.window.onDidChangeActiveTextEditor(() => this.sendCurrentContext());
    vscode.window.onDidChangeTextEditorSelection(() => this.sendCurrentContext());
  }

  private async handleWebviewMessage(message: any): Promise<void> {
    switch (message.type) {
      case 'webviewReady': {
        this.sendCurrentContext();
        this.sendConfigUpdate();
        break;
      }

      case 'sendMessage': {
        await this.processUserMessage(message.text, message.context);
        break;
      }

      case 'stopGeneration': {
        if (this.abortController) {
          this.abortController.abort();
          this.abortController = undefined;
        }
        break;
      }

      case 'insertCode': {
        await this.insertCodeAtCursor(message.code);
        break;
      }

      case 'replaceCode': {
        await this.replaceSelection(message.code);
        break;
      }

      case 'diffCode': {
        await this.openDiffView(message.code);
        break;
      }

      case 'switchModel': {
        await vscode.commands.executeCommand('freepilot.switchModel');
        this.sendConfigUpdate();
        break;
      }

      case 'oauthLogin': {
        await vscode.commands.executeCommand('freepilot.oauthLogin');
        this.sendConfigUpdate();
        break;
      }

      case 'setApiKey': {
        await vscode.commands.executeCommand('freepilot.setApiKey');
        this.sendConfigUpdate();
        break;
      }

      case 'clearChat': {
        this.conversationHistory = [];
        break;
      }

      case 'quickAction': {
        await this.handleQuickAction(message.action);
        break;
      }
    }
  }

  public async sendUserMessageFromCommand(prompt: string, displayLabel?: string): Promise<void> {
    if (!this.view) {
      await vscode.commands.executeCommand('freepilot.chatView.focus');
    }

    if (this.view) {
      this.view.show?.(true);
      const displayText = displayLabel || (prompt.length > 80 ? prompt.slice(0, 80) + '...' : prompt);
      this.view.webview.postMessage({
        type: 'addUserMessage',
        text: displayText
      });
      await this.processUserMessage(prompt);
    }
  }

  private async processUserMessage(userInput: string, clientContext?: any): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Attach current file context if not explicitly attached
    let enrichedInput = userInput;
    const editorCtx = ContextExtractor.getActiveEditorContext();
    if (editorCtx && !userInput.includes(editorCtx.filename)) {
      if (editorCtx.selectedText && editorCtx.selectedText.trim().length > 0) {
        enrichedInput = `Current Selection from \`${editorCtx.filename}\` (${editorCtx.languageId}):\n\`\`\`${editorCtx.languageId}\n${editorCtx.selectedText}\n\`\`\`\n\nUser Request: ${userInput}`;
      }
    }

    this.conversationHistory.push({ role: 'user', content: enrichedInput });

    try {
      const provider = this.providerManager.getProvider();
      const hasKey = await provider.hasValidApiKey();
      const meta = this.providerManager.getProviderMeta(this.configManager.getConfig().provider);

      if (meta.requiresApiKey && !hasKey) {
        throw new Error(
          `API key is missing for ${meta.name}. Click 🔑 (top right) to set your free API key from ${meta.apiKeyHelpUrl}`
        );
      }

      let accumulated = '';
      const response = await provider.chat(
        {
          messages: this.conversationHistory,
          maxTokens: this.configManager.getConfig().maxChatTokens,
          temperature: this.configManager.getConfig().temperature
        },
        (chunk, full) => {
          accumulated = full;
          this.view?.webview.postMessage({
            type: 'streamChunk',
            chunk,
            accumulated
          });
        },
        signal
      );

      this.conversationHistory.push({ role: 'assistant', content: response || accumulated });

      this.view?.webview.postMessage({
        type: 'streamEnd',
        fullText: response || accumulated
      });
    } catch (err: any) {
      if (signal.aborted) {
        this.view?.webview.postMessage({
          type: 'streamEnd',
          fullText: this.conversationHistory[this.conversationHistory.length - 1]?.content || ''
        });
      } else {
        this.view?.webview.postMessage({
          type: 'streamError',
          error: err?.message || String(err)
        });
      }
    } finally {
      this.abortController = undefined;
    }
  }

  private async insertCodeAtCursor(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor to insert code.');
      return;
    }

    const pos = editor.selection.active;
    await editor.edit(editBuilder => {
      editBuilder.insert(pos, code);
    });
    vscode.window.showInformationMessage('Code inserted at cursor!');
  }

  private async replaceSelection(code: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor to replace code.');
      return;
    }

    const selection = editor.selection;
    await editor.edit(editBuilder => {
      if (selection.isEmpty) {
        editBuilder.insert(selection.active, code);
      } else {
        editBuilder.replace(selection, code);
      }
    });
    vscode.window.showInformationMessage('Selection replaced with suggested code!');
  }

  private async openDiffView(suggestedCode: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor for diff comparison.');
      return;
    }

    const currentDoc = editor.document;
    const suggestedDoc = await vscode.workspace.openTextDocument({
      content: suggestedCode,
      language: currentDoc.languageId
    });

    const title = `${path.basename(currentDoc.fileName)} ↔ FreePilot Suggestion`;
    await vscode.commands.executeCommand('vscode.diff', currentDoc.uri, suggestedDoc.uri, title);
  }

  private async handleQuickAction(action: string): Promise<void> {
    switch (action) {
      case 'explain':
        await vscode.commands.executeCommand('freepilot.explainCode');
        break;
      case 'fix':
        await vscode.commands.executeCommand('freepilot.fixCode');
        break;
      case 'refactor':
        await vscode.commands.executeCommand('freepilot.refactorCode');
        break;
      case 'test':
        await vscode.commands.executeCommand('freepilot.generateTests');
        break;
      case 'docs':
        await vscode.commands.executeCommand('freepilot.addDocs');
        break;
      case 'security':
        await vscode.commands.executeCommand('freepilot.securityAudit');
        break;
    }
  }

  public sendCurrentContext(): void {
    if (!this.view) return;
    const ctx = ContextExtractor.getActiveEditorContext();
    this.view.webview.postMessage({
      type: 'setContext',
      context: {
        filename: ctx?.filename || '',
        languageId: ctx?.languageId || '',
        selectionText: ctx?.selectedText || ''
      }
    });
  }

  public sendConfigUpdate(): void {
    if (!this.view) return;
    const config = this.configManager.getConfig();
    const meta = this.providerManager.getProviderMeta(config.provider);
    this.view.webview.postMessage({
      type: 'updateConfig',
      provider: meta.name,
      model: config.model,
      flag: meta.flag
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const cssPath = vscode.Uri.joinPath(this.extensionUri, 'src', 'ui', 'webview', 'main.css');
    const jsPath = vscode.Uri.joinPath(this.extensionUri, 'src', 'ui', 'webview', 'main.js');
    const htmlPath = path.join(this.extensionUri.fsPath, 'src', 'ui', 'webview', 'index.html');

    const cssUri = webview.asWebviewUri(cssPath);
    const jsUri = webview.asWebviewUri(jsPath);

    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = html.replace(/\{\{cspSource\}\}/g, webview.cspSource);
    html = html.replace(/\{\{cssUri\}\}/g, cssUri.toString());
    html = html.replace(/\{\{jsUri\}\}/g, jsUri.toString());

    return html;
  }
}
