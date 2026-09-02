import * as vscode from 'vscode';
import { ChatViewProvider } from '../chat/chatViewProvider';
import { ConfigManager } from '../config';
import { ProviderManager } from '../providers/providerManager';
import { ContextExtractor } from '../utils/contextExtractor';
import { PromptTemplates } from '../utils/promptTemplates';

export class CodeActionCommands {
  private static chatProvider?: ChatViewProvider;

  public static setChatProvider(provider: ChatViewProvider): void {
    CodeActionCommands.chatProvider = provider;
  }

  public static register(context: vscode.ExtensionContext, chatProvider: ChatViewProvider): void {
    CodeActionCommands.setChatProvider(chatProvider);

    context.subscriptions.push(
      vscode.commands.registerCommand('freepilot.openChat', () => {
        vscode.commands.executeCommand('freepilot.chatView.focus');
      }),

      vscode.commands.registerCommand('freepilot.explainCode', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select a block of code to explain.');
          return;
        }
        const prompt = PromptTemplates.buildExplainPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename
        );
        await CodeActionCommands.sendToChat(prompt, `Explain code in ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.fixCode', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select code with bugs or errors to fix.');
          return;
        }
        const prompt = PromptTemplates.buildFixPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename,
          ctx.diagnosticsText
        );
        await CodeActionCommands.sendToChat(prompt, `Fix issues in ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.refactorCode', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select code to refactor.');
          return;
        }
        const prompt = PromptTemplates.buildRefactorPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename
        );
        await CodeActionCommands.sendToChat(prompt, `Refactor ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.generateTests', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select code to generate unit tests for.');
          return;
        }
        const prompt = PromptTemplates.buildGenerateTestsPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename
        );
        await CodeActionCommands.sendToChat(prompt, `Unit tests for ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.addDocs', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select code to add documentation for.');
          return;
        }
        const prompt = PromptTemplates.buildAddDocsPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename
        );
        await CodeActionCommands.sendToChat(prompt, `Add documentation for ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.securityAudit', async () => {
        const ctx = ContextExtractor.getActiveEditorContext();
        if (!ctx || !ctx.selectedText.trim()) {
          vscode.window.showWarningMessage('Please select code for security audit.');
          return;
        }
        const prompt = PromptTemplates.buildSecurityAuditPrompt(
          ctx.selectedText,
          ctx.languageId,
          ctx.filename
        );
        await CodeActionCommands.sendToChat(prompt, `Security audit for ${ctx.filename}`);
      }),

      vscode.commands.registerCommand('freepilot.completeCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        const position = editor.selection.active;
        const ctx = ContextExtractor.getInlineContext(editor.document, position);

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'FreePilot: Generating code completion...',
            cancellable: true
          },
          async (_, token) => {
            const abort = new AbortController();
            token.onCancellationRequested(() => abort.abort());

            try {
              const provider = ProviderManager.getInstance().getProvider();
              const completion = await provider.completeCode(
                {
                  prefix: ctx.prefix,
                  suffix: ctx.suffix,
                  languageId: ctx.languageId,
                  filename: ctx.filename,
                  maxTokens: ConfigManager.getInstance().getConfig().maxCompletionTokens
                },
                abort.signal
              );

              if (completion && completion.trim().length > 0) {
                await editor.edit(editBuilder => {
                  editBuilder.insert(position, completion);
                });
              }
            } catch (err: any) {
              vscode.window.showErrorMessage(`FreePilot completion failed: ${err?.message || err}`);
            }
          }
        );
      }),

      vscode.commands.registerCommand('freepilot.toggleInlineCompletions', async () => {
        const cm = ConfigManager.getInstance();
        const current = cm.getConfig().enableInlineCompletions;
        await cm.updateConfig('enableInlineCompletions', !current);
        vscode.window.showInformationMessage(
          `FreePilot inline completions: ${!current ? 'Enabled (ON)' : 'Disabled (OFF)'}`
        );
      })
    );
  }

  private static async sendToChat(prompt: string, displayLabel?: string): Promise<void> {
    await vscode.commands.executeCommand('freepilot.chatView.focus');
    if (CodeActionCommands.chatProvider) {
      CodeActionCommands.chatProvider.sendUserMessageFromCommand(prompt, displayLabel);
    }
  }
}
