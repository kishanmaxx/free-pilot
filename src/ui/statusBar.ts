import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import { ProviderManager } from '../providers/providerManager';
import { ProviderId } from '../types';

export class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;
  private configManager = ConfigManager.getInstance();
  private providerManager = ProviderManager.getInstance();

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'freepilot.switchModel';
    this.update();
  }

  public register(context: vscode.ExtensionContext): void {
    context.subscriptions.push(this.statusBarItem);
    this.statusBarItem.show();

    // Listen for config changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('freepilot')) {
          this.update();
        }
      })
    );

    // Register switchModel command
    context.subscriptions.push(
      vscode.commands.registerCommand('freepilot.switchModel', async () => {
        await this.showModelQuickPick();
      }),
      vscode.commands.registerCommand('freepilot.setApiKey', async () => {
        await this.showApiKeyPrompt();
      })
    );
  }

  public async update(): Promise<void> {
    const config = this.configManager.getConfig();
    const meta = this.providerManager.getProviderMeta(config.provider);
    const hasKey = await this.providerManager.getProvider().hasValidApiKey();

    const keyStatus = meta.requiresApiKey ? (hasKey ? '✓' : '⚠️ Key missing') : '⚡ Offline/Local';
    const inlineStatus = config.enableInlineCompletions ? '✨' : '⚪';

    this.statusBarItem.text = `$(hubot) FreePilot: ${meta.flag} ${config.model}`;
    this.statusBarItem.tooltip = new vscode.MarkdownString(
      `**FreePilot AI Copilot**\n\n` +
      `- **Provider**: ${meta.name} (${meta.flag})\n` +
      `- **Model**: \`${config.model}\`\n` +
      `- **Status**: ${keyStatus}\n` +
      `- **Inline Completions**: ${config.enableInlineCompletions ? 'Active' : 'Disabled'}\n\n` +
      `*Click to switch provider or model*`
    );
  }

  private async showModelQuickPick(): Promise<void> {
    const allProviders = this.providerManager.getAllProvidersMeta();
    const currentConfig = this.configManager.getConfig();

    const items: Array<vscode.QuickPickItem & { providerId: ProviderId; modelId: string }> = [];

    for (const provider of allProviders) {
      for (const model of provider.models) {
        const isCurrent =
          currentConfig.provider === provider.id && currentConfig.model === model.id;

        items.push({
          label: `${isCurrent ? '$(check) ' : ''}${provider.flag} ${model.name}`,
          description: `${provider.name} | ${model.id}`,
          detail: `${model.freeTierNote} — ${model.description}`,
          providerId: provider.id,
          modelId: model.id
        });
      }
    }

    const selected = await vscode.window.showQuickPick(items, {
      title: 'FreePilot: Select AI Provider & Free Model',
      placeHolder: 'Choose a free model (Gemini, DeepSeek, Qwen, SiliconFlow, Groq, Ollama...)'
    });

    if (selected) {
      await this.configManager.updateConfig('provider', selected.providerId);
      await this.configManager.updateConfig('model', selected.modelId);
      this.update();

      const provider = this.providerManager.getProvider(selected.providerId);
      const hasKey = await provider.hasValidApiKey();
      const meta = this.providerManager.getProviderMeta(selected.providerId);

      if (meta.requiresApiKey && !hasKey) {
        const setNow = await vscode.window.showWarningMessage(
          `FreePilot switched to ${meta.name}, but API key is missing. Set it now?`,
          'Set API Key',
          'Get Free Key',
          'Later'
        );
        if (setNow === 'Set API Key') {
          await this.showApiKeyPrompt(selected.providerId);
        } else if (setNow === 'Get Free Key') {
          vscode.env.openExternal(vscode.Uri.parse(meta.apiKeyHelpUrl));
        }
      } else {
        vscode.window.showInformationMessage(
          `FreePilot active model set to: ${selected.label}`
        );
      }
    }
  }

  public async showApiKeyPrompt(targetProvider?: ProviderId): Promise<void> {
    const currentProvider = targetProvider || this.configManager.getConfig().provider;
    const meta = this.providerManager.getProviderMeta(currentProvider);

    if (!meta.requiresApiKey) {
      vscode.window.showInformationMessage(
        `${meta.name} runs locally and does not require an API key!`
      );
      return;
    }

    const currentKey = await this.configManager.getApiKey(currentProvider);
    const maskedKey = currentKey
      ? `${currentKey.slice(0, 4)}...${currentKey.slice(-4)}`
      : 'None';

    const input = await vscode.window.showInputBox({
      title: `Set API Key for ${meta.flag} ${meta.name}`,
      prompt: `Get a 100% free key at: ${meta.apiKeyHelpUrl}`,
      password: true,
      placeHolder: `Enter your ${meta.name} API key (Current: ${maskedKey})`,
      ignoreFocusOut: true
    });

    if (input !== undefined) {
      await this.configManager.setApiKey(currentProvider, input.trim());
      await this.update();
      if (input.trim().length > 0) {
        vscode.window.showInformationMessage(
          `API key for ${meta.name} saved successfully!`
        );
      } else {
        vscode.window.showInformationMessage(`API key for ${meta.name} cleared.`);
      }
    }
  }
}
