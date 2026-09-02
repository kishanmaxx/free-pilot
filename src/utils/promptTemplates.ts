export class PromptTemplates {
  public static readonly SYSTEM_CHAT = `You are FreePilot, an expert AI programming assistant embedded directly in Visual Studio Code.
Your goal is to provide concise, accurate, bug-free, and idiomatic code and explanations.
Follow these rules:
1. Provide production-ready, clean, well-structured code.
2. Always wrap code blocks with their respective language identifier (e.g., \`\`\`typescript, \`\`\`python).
3. Be direct and concise. Avoid unnecessary conversational fluff unless clarifying nuance.
4. When refactoring or fixing bugs, explain the root cause and highlight key changes.
5. Adhere to modern security best practices and language idioms.`;

  public static readonly SYSTEM_COMPLETION = `You are an ultra-fast inline code completion engine.
Your task is to predict the code that belongs immediately at the cursor position between the preceding code (prefix) and succeeding code (suffix).
CRITICAL RULES:
- Output ONLY the exact raw code to insert at the cursor.
- Do NOT output markdown code blocks (\`\`\`), backticks, or explanations.
- Do NOT repeat prefix code or suffix code.
- Keep the indentation consistent with the surrounding context.`;

  public static buildFimPrompt(
    prefix: string,
    suffix: string,
    languageId: string,
    filename: string,
    modelFamily: 'deepseek' | 'codellama' | 'starcoder' | 'chat'
  ): string {
    if (modelFamily === 'deepseek') {
      return `<｜fim begin｜>${prefix}<｜fim hole｜>${suffix}<｜fim end｜>`;
    } else if (modelFamily === 'codellama') {
      return `<PRE> ${prefix} <SUF>${suffix} <MID>`;
    } else if (modelFamily === 'starcoder') {
      return `<fim_prefix>${prefix}<fim_suffix>${suffix}<fim_middle>`;
    } else {
      // Chat completion fallback
      return `Complete the code snippet located at <CURSOR>.

File: ${filename} (${languageId})

--- PRECEDING CODE ---
${prefix}
--- SUCCEEDING CODE ---
${suffix}

Provide ONLY the exact code to insert directly at the cursor without repeating any prefix or suffix, and without any markdown formatting.`;
    }
  }

  public static buildExplainPrompt(code: string, languageId: string, filename: string): string {
    return `Please provide a clear and structured explanation of the following ${languageId} code from \`${filename}\`:

\`\`\`${languageId}
${code}
\`\`\`

Include:
1. **High-Level Purpose**: What does this code do?
2. **Key Logic & Step-by-Step Flow**: How does it work?
3. **Important Parameters / Return Values / Edge Cases** (if applicable).`;
  }

  public static buildFixPrompt(
    code: string,
    languageId: string,
    filename: string,
    diagnostics?: string
  ): string {
    let diagText = '';
    if (diagnostics && diagnostics.trim().length > 0) {
      diagText = `\nVS Code Error / Warning Diagnostics:\n${diagnostics}\n`;
    }

    return `Please identify and fix any bugs, syntax errors, or runtime issues in the following ${languageId} code from \`${filename}\`:${diagText}

\`\`\`${languageId}
${code}
\`\`\`

Provide:
1. **Diagnosis**: What is wrong and why?
2. **Fixed Code**: Provide the complete corrected code in a code block.
3. **Key Changes**: Brief summary of what was fixed.`;
  }

  public static buildRefactorPrompt(code: string, languageId: string, filename: string): string {
    return `Please refactor and optimize the following ${languageId} code from \`${filename}\`:

\`\`\`${languageId}
${code}
\`\`\`

Focus on:
1. Readability, maintainability, and clean code principles.
2. Performance and time/space complexity optimization.
3. Modern language idioms and typing.
4. Error handling and robustness.

Provide the complete refactored code along with a brief explanation of improvements.`;
  }

  public static buildGenerateTestsPrompt(code: string, languageId: string, filename: string): string {
    return `Generate comprehensive unit tests for the following ${languageId} code from \`${filename}\`:

\`\`\`${languageId}
${code}
\`\`\`

Requirements:
1. Use the most standard testing framework for ${languageId} (e.g., Jest/Vitest for TS/JS, PyTest for Python, JUnit for Java, testing for Go).
2. Cover standard happy paths, edge cases, error conditions, and null/undefined handling.
3. Include mock setups if external dependencies are present.
4. Provide ready-to-run test code.`;
  }

  public static buildAddDocsPrompt(code: string, languageId: string, filename: string): string {
    return `Add complete, standard documentation comments and type annotations to the following ${languageId} code from \`${filename}\`:

\`\`\`${languageId}
${code}
\`\`\`

Requirements:
1. Use standard doc formats (JSDoc/TSDoc for TS/JS, docstrings for Python, GoDoc for Go, JavaDoc for Java, etc.).
2. Document function descriptions, parameters, return types, exceptions thrown, and usage examples.
3. Return the complete updated code.`;
  }

  public static buildSecurityAuditPrompt(code: string, languageId: string, filename: string): string {
    return `Perform a thorough security and vulnerability audit on the following ${languageId} code from \`${filename}\`:

\`\`\`${languageId}
${code}
\`\`\`

Check for:
1. Injection vulnerabilities (SQLi, Command Injection, XSS, etc.).
2. Insecure data handling, hardcoded secrets, or unvalidated inputs.
3. Resource leaks, race conditions, or unhandled exceptions.
4. Provide safe remediation code and security recommendations.`;
  }
}
