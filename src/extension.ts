import * as vscode from 'vscode';
import { AuthService } from './auth/authService';
import { FreePilotUriHandler } from './auth/uriHandler';
import { ChatViewProvider } from './chat/chatViewProvider';
import { CodeActionCommands } from './commands/codeActions';
import { InlineCompletionProvider } from './completion/inlineCompletionProvider';
import { ConfigManager } from './config';
import { ProviderManager } from './providers/providerManager';
import { StatusBarManager } from './ui/statusBar';

export function activate(context: vscode.ExtensionContext) {
  console.log('FreePilot extension is activating...');

  // 1. Initialize Configuration & Secrets
  const configManager = ConfigManager.getInstance();
  configManager.initialize(context);

  // 2. Register OAuth / 1-Click Callback URI Handler
  const uriHandler = new FreePilotUriHandler();
  context.subscriptions.push(
    vscode.window.registerUriHandler(uriHandler),
    vscode.commands.registerCommand('freepilot.oauthLogin', async () => {
      await AuthService.getInstance().startOAuthFlow();
    })
  );

  // 3. Register Sidebar AI Chat View Provider (with persistence)
  const chatViewProvider = new ChatViewProvider(context.extensionUri);
  chatViewProvider.setExtensionContext(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // 4. Register Inline Code Completion (Ghost Text) Provider for all files
  const inlineCompletionProvider = new InlineCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      inlineCompletionProvider
    )
  );

  // 5. Register Context Menu & Code Actions
  CodeActionCommands.register(context, chatViewProvider);

  // 6. Register Status Bar Widget & Model Switcher
  const statusBarManager = new StatusBarManager();
  statusBarManager.register(context);

  // 7. Register clearChat command (was missing from command palette)
  context.subscriptions.push(
    vscode.commands.registerCommand('freepilot.clearChat', () => {
      chatViewProvider.clearHistory();
      vscode.window.showInformationMessage('FreePilot chat history cleared.');
    })
  );

  // 8. Auto-reset model to provider default when provider changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('freepilot.provider')) {
        const newProvider = configManager.getConfig().provider;
        const meta = ProviderManager.getInstance().getProviderMeta(newProvider);
        const currentModel = configManager.getConfig().model;
        // Check if current model belongs to new provider
        const validModels = meta.models.map(m => m.id);
        if (!validModels.includes(currentModel)) {
          configManager.updateConfig('model', meta.defaultModel);
        }
      }
    })
  );

  console.log('FreePilot extension activated successfully!');
}

export function deactivate() {
  console.log('FreePilot extension deactivated.');
}

