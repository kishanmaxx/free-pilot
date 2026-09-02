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
    if (!selection.isEmpty) {
      const diags = vscode.languages.getDiagnostics(document.uri);
      const overlapping = diags.filter(d =>
        d.range.intersection(selection) !== undefined ||
        (d.range.start.line >= selection.start.line && d.range.end.line <= selection.end.line)
      );

      if (overlapping.length > 0) {
        diagnosticsText = overlapping
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

  public static getInlineContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    maxPrefixChars = 4000,
    maxSuffixChars = 1500
  ): InlineCursorContext {
    const fullText = document.getText();
    const offset = document.offsetAt(position);

    const prefixStart = Math.max(0, offset - maxPrefixChars);
    const prefix = fullText.slice(prefixStart, offset);

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
