import * as vscode from 'vscode';
import { ProviderManager } from '../providers/providerManager';
import { ProviderId } from '../types';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generates the callback URI for the current VS Code distribution
   * e.g., vscode://freepilot.free-pilot/auth-callback
   */
  public getCallbackUri(): string {
    const scheme = vscode.env.uriScheme || 'vscode';
    return `${scheme}://freepilot.free-pilot/auth-callback`;
  }

  /**
   * Triggers the 1-Click OAuth / Connect flow in browser
   */
  public async startOAuthFlow(targetProvider?: ProviderId): Promise<void> {
    const providerManager = ProviderManager.getInstance();
    const allProviders = providerManager.getAllProvidersMeta().filter(p => p.requiresApiKey);

    let selectedProviderId = targetProvider;
    if (!selectedProviderId) {
      const items = allProviders.map(p => ({
        label: `${p.flag} ${p.name}`,
        description: p.defaultModel,
        detail: `1-Click setup for ${p.name} (${p.tagline})`,
        providerId: p.id
      }));

      const pick = await vscode.window.showQuickPick(items, {
        title: 'FreePilot: 1-Click Connect / OAuth',
        placeHolder: 'Select provider to connect with 1 click'
      });

      if (!pick) return;
      selectedProviderId = pick.providerId;
    }

    const meta = providerManager.getProviderMeta(selectedProviderId);
    const callbackUri = encodeURIComponent(this.getCallbackUri());

    // Try the FreePilot auth gateway first, fall back to provider's direct API key console
    const portalUrl = meta.apiKeyHelpUrl;

    const choice = await vscode.window.showInformationMessage(
      `FreePilot: Opening ${meta.flag} ${meta.name} API key page.\n\n` +
      `After getting your key, come back here and enter it (or use the 1-Click portal if deployed).`,
      'Open Provider Key Page',
      'Enter Key Manually'
    );

    if (choice === 'Open Provider Key Page') {
      await vscode.env.openExternal(vscode.Uri.parse(portalUrl));
      // After opening, prompt for the key immediately
      await vscode.commands.executeCommand('freepilot.setApiKey');
    } else if (choice === 'Enter Key Manually') {
      await vscode.commands.executeCommand('freepilot.setApiKey');
    }
  }
}
