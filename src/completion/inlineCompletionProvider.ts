import * as vscode from 'vscode';
import { ConfigManager } from '../config';
import { ProviderManager } from '../providers/providerManager';
import { ContextExtractor } from '../utils/contextExtractor';

interface CachedCompletion {
  key: string;
  completion: string;
  timestamp: number;
}

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private configManager = ConfigManager.getInstance();
  private providerManager = ProviderManager.getInstance();
  private abortController?: AbortController;
  private cache: Map<string, CachedCompletion> = new Map();
  private maxCacheSize = 50;
  private cacheTtlMs = 60000; // 1 minute
  private pendingDebounceReject?: () => void;

  /** Language IDs to skip inline completions for */
  private static readonly SKIP_LANGUAGES = new Set([
    'plaintext', 'markdown', 'json', 'jsonc', 'xml', 'yaml', 'toml',
    'ini', 'properties', 'csv', 'log', 'gitcommit', 'gitrebase',
    'diff', 'scminput'
  ]);

  public async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[] | undefined> {
    const config = this.configManager.getConfig();
    if (!config.enableInlineCompletions) {
      return undefined;
    }

    // Skip non-code files
    if (InlineCompletionProvider.SKIP_LANGUAGES.has(document.languageId)) {
      return undefined;
    }

    // Don't complete in huge files or minified code
    if (document.lineCount > 10000) {
      return undefined;
    }

    // Cancel any previous in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Check cancellation
    if (token.isCancellationRequested) {
      return undefined;
    }

    // Extract cursor context
    const cursorContext = ContextExtractor.getInlineContext(document, position);
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.substring(0, position.character);

    // Skip if line is mostly whitespace or comment trigger without intent
    if (linePrefix.trim().length === 0 && position.line === 0) {
      return undefined;
    }

    // Check cache
    const cacheKey = `${document.uri.toString()}:${position.line}:${position.character}:${linePrefix}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return this.formatCompletionResult(cached.completion, position);
    }

    // Proper debounce: reject any previously pending debounce
    if (this.pendingDebounceReject) {
      this.pendingDebounceReject();
      this.pendingDebounceReject = undefined;
    }

    const delay = config.inlineCompletionDelayMs;
    try {
      await new Promise<void>((resolve, reject) => {
        this.pendingDebounceReject = reject;
        setTimeout(() => {
          this.pendingDebounceReject = undefined;
          resolve();
        }, delay);
      });
    } catch {
      // Debounce was cancelled by a newer keystroke
      return undefined;
    }

    if (token.isCancellationRequested || signal.aborted) {
      return undefined;
    }

    try {
      const targetProviderId = config.completionProvider || config.provider;
      const provider = this.providerManager.getProvider(targetProviderId);
      const meta = this.providerManager.getProviderMeta(targetProviderId);
      const hasKey = await provider.hasValidApiKey();
      if (meta.requiresApiKey && !hasKey) {
        // Silent fail for inline completion if API key not set, to avoid annoying popup on every keystroke
        return undefined;
      }

      const completion = await provider.completeCode(
        {
          prefix: cursorContext.prefix,
          suffix: cursorContext.suffix,
          languageId: cursorContext.languageId,
          filename: cursorContext.filename,
          maxTokens: config.maxCompletionTokens,
          temperature: 0.1
        },
        signal
      );

      if (!completion || completion.trim().length === 0) {
        return undefined;
      }

      // Store in cache
      this.setCache(cacheKey, completion);

      return this.formatCompletionResult(completion, position);
    } catch (err: any) {
      // Don't show modal error dialogs for inline background completions
      console.warn('FreePilot inline completion error:', err?.message || err);
      return undefined;
    }
  }

  private formatCompletionResult(
    text: string,
    position: vscode.Position
  ): vscode.InlineCompletionList {
    const item = new vscode.InlineCompletionItem(text, new vscode.Range(position, position));
    return {
      items: [item]
    };
  }

  private setCache(key: string, completion: string): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { key, completion, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
