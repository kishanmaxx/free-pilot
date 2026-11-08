import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import { ProviderManager } from '../providers/providerManager';
import { ProviderId } from '../types';

export class FreePilotUriHandler implements vscode.UriHandler {
  private configManager = ConfigManager.getInstance();
  private providerManager = ProviderManager.getInstance();

  public async handleUri(uri: vscode.Uri): Promise<void> {
    console.log('FreePilot URI received:', uri.toString());

    // Expected format:
    // vscode://freepilot.free-pilot/auth-callback?provider=groq&key=gsk_...&model=llama-3.3-70b-versatile
    // or /auth-callback?token=...&provider=siliconflow
    const path = uri.path.replace(/^\/+/, '');

    if (path === 'auth-callback' || path === 'auth') {
      const queryParams = new URLSearchParams(uri.query);
      const provider = queryParams.get('provider') as ProviderId | null;
      const key = queryParams.get('key') || queryParams.get('token') || queryParams.get('api_key');
      const model = queryParams.get('model');

      if (!provider || !key) {
        vscode.window.showErrorMessage(
          'FreePilot Auth Error: Missing provider or token in callback URL.'
        );
        return;
      }

      try {
        // Save the API key securely in SecretStorage
        await this.configManager.setApiKey(provider, key);

        // Update active provider & model if specified
        await this.configManager.updateConfig('provider', provider);
        if (model) {
          await this.configManager.updateConfig('model', model);
        }

        const meta = this.providerManager.getProviderMeta(provider);
        vscode.window.showInformationMessage(
          `🎉 FreePilot: Successfully connected to ${meta.flag} ${meta.name} via 1-Click Auth!`
        );

        // Focus and refresh the chat view
        vscode.commands.executeCommand('freepilot.openChat');
      } catch (err: any) {
        vscode.window.showErrorMessage(
          `Failed to save FreePilot credentials: ${err?.message || err}`
        );
      }
    }
  }
}
