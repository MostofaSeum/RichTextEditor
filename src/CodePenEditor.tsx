'use client';

import React, { useState, useMemo } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { richTextContentCss } from './contentStyles';
import { Eye, Code, Sparkles } from 'lucide-react';

export interface CodeOutput {
    /** The full single-file source exactly as written (HTML with inline <style> and <script>). */
    code: string;
    /** Markup only (all <style> and <script> blocks removed). */
    html: string;
    /** Concatenated contents of all inline <style> blocks. */
    css: string;
    /** Concatenated contents of all inline <script> blocks (scripts with `src` are excluded). */
    js: string;
    /** Ready-to-save output: styles, markup wrapped in `.blog-custom-content`, then scripts. */
    combinedHtml: string;
}

export interface CodePenEditorProps {
    /** Initial single-file source: HTML with inline <style> and <script> tags. */
    initialCode?: string;
    /** @deprecated Use `initialCode`. Merged into the single file when `initialCode` is not set. */
    initialHtml?: string;
    /** @deprecated Use `initialCode`. Merged into the single file when `initialCode` is not set. */
    initialCss?: string;
    /** @deprecated Use `initialCode`. Merged into the single file when `initialCode` is not set. */
    initialJs?: string;
    onChange?: (output: CodeOutput) => void;
    className?: string;
    minHeight?: number;
    showPreview?: boolean;
    onUploadImage?: (file: File) => Promise<string> | string;
    onInsertImageClick?: (callback: (url: string) => void) => void;
}

const DEFAULT_CODE = `<style>
  /* Custom CSS for your blog section */
  .custom-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
  }
  .accent-btn {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }
  .accent-btn:hover {
    background: #4338ca;
  }
</style>

<h2>Welcome to My Custom Blog Section 🚀</h2>
<p>Edit this in the <strong>Visual Editor</strong> or customize everything in the <strong>Code</strong> tab!</p>
<div class="custom-card">
  <p>Interactive Counter Card</p>
  <button id="counter-btn" class="accent-btn">Click me: <span id="count">0</span></button>
</div>

<script>
  // Custom JS for your blog section
  const btn = document.getElementById("counter-btn");
  const countSpan = document.getElementById("count");
  let c = 0;
  if (btn && countSpan) {
    btn.onclick = () => {
      c++;
      countSpan.textContent = c;
    };
  }
</script>`;

const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;

interface ParsedCode {
    styleBlocks: string[];
    scriptBlocks: string[];
    markup: string;
    css: string;
    js: string;
}

const innerOf = (block: string) => block.replace(/^<[^>]*>/, '').replace(/<\/[a-z]+\s*>$/i, '');
const openTagOf = (block: string) => (block.match(/^<[^>]*>/) ?? [''])[0];

/** Classic inline script (no `src`, no non-JS `type` such as module or JSON). */
const isPlainInlineScript = (block: string) => {
    const open = openTagOf(block);
    if (/\ssrc\s*=/i.test(open)) return false;
    const type = open.match(/\stype\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.toLowerCase();
    return !type || type === 'text/javascript' || type === 'application/javascript';
};

/** Split a single-file source into its style blocks, script blocks and remaining markup. */
function parseCode(code: string): ParsedCode {
    const styleBlocks = code.match(STYLE_RE) ?? [];
    const scriptBlocks = code.match(SCRIPT_RE) ?? [];
    const markup = code.replace(STYLE_RE, '').replace(SCRIPT_RE, '').replace(/\n{3,}/g, '\n\n').trim();
    return {
        styleBlocks,
        scriptBlocks,
        markup,
        css: styleBlocks.map(innerOf).join('\n').trim(),
        js: scriptBlocks.filter((b) => !/\ssrc\s*=/i.test(openTagOf(b))).map(innerOf).join('\n').trim(),
    };
}

/** Rebuild the single file after the visual editor changed the markup, keeping styles and scripts. */
function mergeMarkup(parsed: ParsedCode, newMarkup: string): string {
    return [parsed.styleBlocks.join('\n'), newMarkup, parsed.scriptBlocks.join('\n')]
        .filter((part) => part.trim() !== '')
        .join('\n\n');
}

function buildInitialCode({ initialCode, initialHtml, initialCss, initialJs }: CodePenEditorProps): string {
    if (initialCode !== undefined) return initialCode;
    if (initialHtml === undefined && initialCss === undefined && initialJs === undefined) return DEFAULT_CODE;
    return [
        initialCss ? `<style>\n${initialCss}\n</style>` : '',
        initialHtml ?? '',
        initialJs ? `<script>\n${initialJs}\n</script>` : '',
    ]
        .filter(Boolean)
        .join('\n\n');
}

function buildCombinedHtml(parsed: ParsedCode): string {
    const scripts = parsed.scriptBlocks.map((block) =>
        isPlainInlineScript(block)
            ? `${openTagOf(block)}\n(function() {\n${innerOf(block)}\n})();\n</script>`
            : block,
    );
    return [
        parsed.styleBlocks.join('\n'),
        `<div class="blog-custom-content">\n${parsed.markup}\n</div>`,
        scripts.join('\n'),
    ]
        .filter((part) => part.trim() !== '')
        .join('\n');
}

export function CodePenEditor(props: CodePenEditorProps) {
    const {
        onChange,
        className = '',
        minHeight = 350,
        showPreview = true,
        onUploadImage,
        onInsertImageClick,
    } = props;

    const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
    const [code, setCode] = useState(() => buildInitialCode(props));
    const parsed = useMemo(() => parseCode(code), [code]);

    const updateCode = (newCode: string) => {
        setCode(newCode);
        if (!onChange) return;
        const p = parseCode(newCode);
        onChange({
            code: newCode,
            html: p.markup,
            css: p.css,
            js: p.js,
            combinedHtml: buildCombinedHtml(p),
        });
    };

    const handleVisualChange = (newMarkup: string) => {
        updateCode(mergeMarkup(parsed, newMarkup));
    };

    // Build the live sandboxed srcDoc for the preview output
    const previewSrcDoc = useMemo(() => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 16px;
      color: #334155;
      background-color: #ffffff;
      line-height: 1.6;
    }
    ${richTextContentCss}
  </style>
</head>
<body class="rich-text-content">
${code}
</body>
</html>
        `.trim();
    }, [code]);

    const tabClass = (tab: typeof activeTab) =>
        `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`;

    return (
        <div className={`flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden ${className}`}>
            {/* Header Tabs */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
                <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setActiveTab('visual')} className={tabClass('visual')}>
                        <Sparkles className="w-3.5 h-3.5" />
                        Visual Editor
                    </button>
                    <button type="button" onClick={() => setActiveTab('code')} className={tabClass('code')}>
                        <Code className="w-3.5 h-3.5" />
                        Code
                    </button>
                </div>

                <div className="text-[11px] font-medium text-gray-400">
                    {activeTab === 'visual' && 'Formatting toolbar active'}
                    {activeTab === 'code' && 'HTML with inline <style> and <script>'}
                </div>
            </div>

            {/* Input Panels */}
            <div className="flex-1">
                {activeTab === 'visual' && (
                    <div className="p-0">
                        <RichTextEditor
                            value={parsed.markup}
                            onChange={handleVisualChange}
                            minHeight={minHeight}
                            onUploadImage={onUploadImage}
                            onInsertImageClick={onInsertImageClick}
                        />
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="flex flex-col">
                        <textarea
                            value={code}
                            onChange={(e) => updateCode(e.target.value)}
                            className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 outline-none resize-none"
                            style={{ minHeight }}
                            spellCheck={false}
                            placeholder={'<style>\n  /* CSS */\n</style>\n\n<!-- HTML -->\n\n<script>\n  // JavaScript\n</script>'}
                        />
                    </div>
                )}
            </div>

            {/* Live Combined Output Preview */}
            {showPreview && (
                <div className="border-t border-gray-200 bg-gray-50 flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wide">
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            Live Output
                        </span>
                        <span className="text-[11px] text-gray-500">
                            Updates live as you edit Visual or Code
                        </span>
                    </div>
                    <iframe
                        srcDoc={previewSrcDoc}
                        title="Live Combined Preview"
                        className="w-full bg-white border-0"
                        style={{ height: 260 }}
                        sandbox="allow-scripts allow-modals"
                    />
                </div>
            )}
        </div>
    );
}
