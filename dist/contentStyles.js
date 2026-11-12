"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/contentStyles.ts
var contentStyles_exports = {};
__export(contentStyles_exports, {
  richTextContentCss: () => richTextContentCss
});
module.exports = __toCommonJS(contentStyles_exports);
var richTextContentCss = `/* \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   Rich text content styles
   Shared by the editor (.rte-content), the renderer (.rich-text-content) and
   consumer article containers (.rich-article-content).

   Tailwind's preflight resets list markers, blockquote borders, heading sizes
   and paragraph margins. These rules restore them so saved HTML looks the same
   everywhere it is rendered (preview iframe, public page, emails, etc.).
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

:is(.rte-content, .rich-text-content, .rich-article-content) {
    line-height: 1.7;
    overflow-wrap: break-word;
    word-break: break-word;
}

:is(.rte-content, .rich-text-content, .rich-article-content) p {
    margin: 0.5rem 0;
    line-height: 1.75;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h1 {
    font-size: 2.25rem;
    font-weight: 800;
    line-height: 1.2;
    margin: 1.25rem 0 0.75rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h2 {
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1.25;
    margin: 1rem 0 0.5rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h3 {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0.85rem 0 0.45rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h4 {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0.75rem 0 0.4rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h5 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0.6rem 0 0.35rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) h6 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0.5rem 0 0.3rem;
}

:is(.rte-content, .rich-text-content, .rich-article-content) ul {
    list-style: disc outside;
    padding-left: 1.5rem;
    margin: 0.6rem 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) ol {
    list-style: decimal outside;
    padding-left: 1.5rem;
    margin: 0.6rem 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) li {
    display: list-item;
    margin: 0.25rem 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) li > ul,
:is(.rte-content, .rich-text-content, .rich-article-content) li > ol {
    margin: 0.25rem 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) blockquote {
    border-left: 4px solid #3b82f6;
    padding: 0.75rem 1.25rem;
    margin: 1rem 0;
    color: #475569;
    font-style: italic;
    background: #f8fafc;
    border-radius: 0 8px 8px 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) blockquote p {
    margin: 0.25rem 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) pre {
    background: #f1f5f9;
    padding: 10px 14px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.55;
    white-space: pre-wrap;
    overflow-x: auto;
    margin: 0.75em 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace;
    font-size: 0.9em;
}

:is(.rte-content, .rich-text-content, .rich-article-content) :not(pre) > code {
    background: #f1f5f9;
    padding: 0.15em 0.4em;
    border-radius: 4px;
}

:is(.rte-content, .rich-text-content, .rich-article-content) a {
    color: #2563eb;
    text-decoration: underline;
}

:is(.rte-content, .rich-text-content, .rich-article-content) img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 0.5em 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) hr {
    border: none;
    border-top: 2px solid #e2e8f0;
    margin: 1.25em 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
}

:is(.rte-content, .rich-text-content, .rich-article-content) th,
:is(.rte-content, .rich-text-content, .rich-article-content) td {
    border: 1px solid #cbd5e1;
    padding: 0.55em 0.8em;
    text-align: left;
    vertical-align: top;
}

:is(.rte-content, .rich-text-content, .rich-article-content) th {
    background: #f1f5f9;
    font-weight: 600;
}

:is(.rte-content, .rich-text-content, .rich-article-content) sub,
:is(.rte-content, .rich-text-content, .rich-article-content) sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
}

:is(.rte-content, .rich-text-content, .rich-article-content) sup {
    top: -0.5em;
}

:is(.rte-content, .rich-text-content, .rich-article-content) sub {
    bottom: -0.25em;
}

/* Shapes: In rendered outputs (preview & live reader), shapes are static and not resizable by viewers */
:is(.rich-text-content, .rich-article-content) [style*="resize"] {
    resize: none !important;
}

`;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  richTextContentCss
});
