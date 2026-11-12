'use client';

import React, { useState, useMemo } from 'react';
import { RichTextEditor } from './RichTextEditor';
import { richTextContentCss } from './contentStyles';
import { Eye, Code, Paintbrush, Sparkles } from 'lucide-react';

export interface CodeOutput {
    html: string;
    css: string;
    js: string;
    combinedHtml: string;
}

export interface CodePenEditorProps {
    initialHtml?: string;
    initialCss?: string;
    initialJs?: string;
    onChange?: (output: CodeOutput) => void;
    className?: string;
    minHeight?: number;
    showPreview?: boolean;
    onUploadImage?: (file: File) => Promise<string> | string;
    onInsertImageClick?: (callback: (url: string) => void) => void;
}

export function CodePenEditor({
    initialHtml = '<h2>Welcome to My Custom Blog Section 🚀</h2>\n<p>Edit this in the <strong>Visual Editor</strong> or customize with HTML, CSS, and JS tabs!</p>\n<div class="custom-card">\n  <p>Interactive Counter Card</p>\n  <button id="counter-btn" class="accent-btn">Click me: <span id="count">0</span></button>\n</div>',
    initialCss = '/* Custom CSS for your blog section */\n.custom-card {\n  background: #f8fafc;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n  padding: 16px;\n  margin: 16px 0;\n}\n.accent-btn {\n  background: #4f46e5;\n  color: #ffffff;\n  border: none;\n  padding: 8px 16px;\n  border-radius: 6px;\n  cursor: pointer;\n  font-weight: 600;\n}\n.accent-btn:hover {\n  background: #4338ca;\n}',
    initialJs = '// Custom JS for your blog section\nconst btn = document.getElementById("counter-btn");\nconst countSpan = document.getElementById("count");\nlet c = 0;\nif (btn && countSpan) {\n  btn.onclick = () => {\n    c++;\n    countSpan.textContent = c;\n  };\n}',
    onChange,
    className = '',
    minHeight = 350,
    showPreview = true,
    onUploadImage,
    onInsertImageClick,
}: CodePenEditorProps) {
    const [activeTab, setActiveTab] = useState<'visual' | 'html' | 'css' | 'js'>('visual');
    const [html, setHtml] = useState(initialHtml);
    const [css, setCss] = useState(initialCss);
    const [js, setJs] = useState(initialJs);

    const emitChange = (newHtml: string, newCss: string, newJs: string) => {
        if (!onChange) return;
        const combined = `
<style>
${newCss}
</style>
<div class="blog-custom-content">
${newHtml}
</div>
<script>
(function() {
${newJs}
})();
</script>`.trim();

        onChange({
            html: newHtml,
            css: newCss,
            js: newJs,
            combinedHtml: combined,
        });
    };

    const handleHtmlChange = (newHtml: string) => {
        setHtml(newHtml);
        emitChange(newHtml, css, js);
    };

    const handleCssChange = (newCss: string) => {
        setCss(newCss);
        emitChange(html, newCss, js);
    };

    const handleJsChange = (newJs: string) => {
        setJs(newJs);
        emitChange(html, css, newJs);
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
    ${css}
  </style>
</head>
<body class="rich-text-content">
  ${html}
  <script>
    try {
      ${js}
    } catch (err) {
      console.error("Preview script error:", err);
    }
  </script>
</body>
</html>
        `.trim();
    }, [html, css, js]);

    return (
        <div className={`flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden ${className}`}>
            {/* Header Tabs */}
            <div className="flex items-center justify-between bg-gray-50 border-b border-gray-200 px-3 py-2">
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('visual')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'visual'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5" />
                        Visual Editor
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('html')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'html'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <Code className="w-3.5 h-3.5" />
                        HTML
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('css')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'css'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <Paintbrush className="w-3.5 h-3.5" />
                        CSS
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('js')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'js'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                    >
                        <span className="font-mono font-bold text-xs">JS</span>
                        JavaScript
                    </button>
                </div>

                <div className="text-[11px] font-medium text-gray-400">
                    {activeTab === 'visual' && 'Formatting toolbar active'}
                    {activeTab === 'html' && 'Raw HTML markup'}
                    {activeTab === 'css' && 'Custom styles'}
                    {activeTab === 'js' && 'Interactive logic'}
                </div>
            </div>

            {/* Input Panels */}
            <div className="flex-1">
                {activeTab === 'visual' && (
                    <div className="p-0">
                        <RichTextEditor
                            value={html}
                            onChange={handleHtmlChange}
                            minHeight={minHeight}
                            onUploadImage={onUploadImage}
                            onInsertImageClick={onInsertImageClick}
                        />
                    </div>
                )}

                {activeTab === 'html' && (
                    <div className="flex flex-col">
                        <textarea
                            value={html}
                            onChange={(e) => handleHtmlChange(e.target.value)}
                            className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 outline-none resize-none"
                            style={{ minHeight }}
                            placeholder="Type raw HTML here..."
                        />
                    </div>
                )}

                {activeTab === 'css' && (
                    <div className="flex flex-col">
                        <textarea
                            value={css}
                            onChange={(e) => handleCssChange(e.target.value)}
                            className="w-full p-4 font-mono text-xs bg-slate-900 text-amber-300 outline-none resize-none"
                            style={{ minHeight }}
                            placeholder="/* Enter custom CSS rules here */"
                        />
                    </div>
                )}

                {activeTab === 'js' && (
                    <div className="flex flex-col">
                        <textarea
                            value={js}
                            onChange={(e) => handleJsChange(e.target.value)}
                            className="w-full p-4 font-mono text-xs bg-slate-900 text-emerald-300 outline-none resize-none"
                            style={{ minHeight }}
                            placeholder="// Enter JavaScript here..."
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
                            Live Combined Output (HTML + CSS + JS)
                        </span>
                        <span className="text-[11px] text-gray-500">
                            Updates live as you edit Visual, HTML, CSS, or JS
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

