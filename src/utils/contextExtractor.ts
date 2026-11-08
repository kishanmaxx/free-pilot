import * as vscode from 'vscode';

export interface EditorContext {
  editor: vscode.TextEditor;
  document: vscode.TextDocument;
  selection: vscode.Selection;
  selectedText: string;
  languageId: string;
  filename: string;
  diagnosticsText?: string;
}

export interface InlineCursorContext {
  document: vscode.TextDocument;
  position: vscode.Position;
  prefix: string;
  suffix: string;
  languageId: string;
  filename: string;
}

export class ContextExtractor {
  public static getActiveEditorContext(): EditorContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return undefined;
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);
    const languageId = document.languageId;
    const filename = document.fileName.split(/[\\/]/).pop() || document.fileName;

    let diagnosticsText: string | undefined;
    const diags = vscode.languages.getDiagnostics(document.uri);

    if (!selection.isEmpty) {
      const overlapping = diags.filter(d =>
        d.range.intersection(selection) !== undefined ||
        (d.range.start.line >= selection.start.line && d.range.end.line <= selection.end.line)
      );

      if (overlapping.length > 0) {
        diagnosticsText = overlapping
          .map(d => `[Line ${d.range.start.line + 1}] ${vscode.DiagnosticSeverity[d.severity]}: ${d.message}`)
          .join('\n');
      }
    } else {
      // If no text is selected, capture diagnostics at or adjacent to the cursor line
      const line = selection.active.line;
      const nearby = diags.filter(d => Math.abs(d.range.start.line - line) <= 1);
      if (nearby.length > 0) {
        diagnosticsText = nearby
          .map(d => `[Line ${d.range.start.line + 1}] ${vscode.DiagnosticSeverity[d.severity]}: ${d.message}`)
          .join('\n');
      }
    }

    return {
      editor,
      document,
      selection,
      selectedText,
      languageId,
      filename,
      diagnosticsText
    };
  }

  /**
   * Scans other currently open editor tabs to extract key declarations, interfaces, and function signatures.
   */
  public static getNeighboringTabsContext(currentUri: vscode.Uri, maxChars = 1200): string {
    const docs = vscode.workspace.textDocuments.filter(
      d => d.uri.toString() !== currentUri.toString() && !d.isUntitled && d.fileName.match(/\.(ts|js|py|go|rs|java|cpp|c|cs)$/i)
    );

    if (docs.length === 0) return '';

    const snippets: string[] = [];
    let currentLength = 0;

    for (const doc of docs.slice(0, 3)) {
      const name = doc.fileName.split(/[\\/]/).pop() || doc.fileName;
      const lines = doc.getText().split('\n');
      const exported = lines
        .filter(l => /^\s*(export\s+(interface|type|class|function|const|enum)|def\s+|class\s+|pub\s+fn)/.test(l))
        .slice(0, 10)
        .map(l => l.trim());

      if (exported.length > 0) {
        const block = `// Symbols from open file: ${name}\n${exported.join('\n')}`;
        if (currentLength + block.length <= maxChars) {
          snippets.push(block);
          currentLength += block.length;
        }
      }
    }

    return snippets.join('\n\n');
  }

  public static getInlineContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    maxPrefixChars = 4000,
    maxSuffixChars = 1500
  ): InlineCursorContext {
    const fullText = document.getText();
    const offset = document.offsetAt(position);

    const prefixStart = Math.max(0, offset - maxPrefixChars);
    let prefix = fullText.slice(prefixStart, offset);

    // Enrich prefix with relevant signatures from open neighboring tabs
    const neighborContext = ContextExtractor.getNeighboringTabsContext(document.uri);
    if (neighborContext) {
      prefix = `/* Related Context */\n${neighborContext}\n\n${prefix}`;
    }

    const suffixEnd = Math.min(fullText.length, offset + maxSuffixChars);
    const suffix = fullText.slice(offset, suffixEnd);

    const filename = document.fileName.split(/[\\/]/).pop() || document.fileName;

    return {
      document,
      position,
      prefix,
      suffix,
      languageId: document.languageId,
      filename
    };
  }
}
