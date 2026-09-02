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

    // Generate web connect portal URL (or open direct provider portal with callback support)
    // Supports official FreePilot OAuth gateway or fallback directly to provider key console
    const portalUrl = `https://freepilot-auth.pages.dev/?provider=${selectedProviderId}&callback=${callbackUri}&app=${vscode.env.appName}`;

    const choice = await vscode.window.showInformationMessage(
      `FreePilot: Opening 1-Click connect page for ${meta.flag} ${meta.name} in your browser.`,
      'Open in Browser',
      'Enter Key Manually'
    );

    if (choice === 'Open in Browser') {
      // Open browser
      await vscode.env.openExternal(vscode.Uri.parse(portalUrl));
    } else if (choice === 'Enter Key Manually') {
      await vscode.commands.executeCommand('freepilot.setApiKey');
    }
  }
}
