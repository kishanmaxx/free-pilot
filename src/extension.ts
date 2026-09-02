import * as vscode from 'vscode';
import { AuthService } from './auth/authService';
import { FreePilotUriHandler } from './auth/uriHandler';
import { ChatViewProvider } from './chat/chatViewProvider';
import { CodeActionCommands } from './commands/codeActions';
import { InlineCompletionProvider } from './completion/inlineCompletionProvider';
import { ConfigManager } from './config';
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

  // 3. Register Sidebar AI Chat View Provider
  const chatViewProvider = new ChatViewProvider(context.extensionUri);
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

  console.log('FreePilot extension activated successfully!');
}

export function deactivate() {
  console.log('FreePilot extension deactivated.');
}
