# @storio/rich-text-editor

A reusable rich text editor library for React / Next.js websites.

This is the **exact same advanced editor** used in Storio's CMS admin panel — copied directly from `storio-richtext-editor/src/RichTextEditor.tsx` and `frontend-next/components/Slate.tsx`. It is not a simplified version; it keeps all premium MS-Word-style features.

## Install

```bash
npm install @storio/rich-text-editor
```

Peer dependencies (install in your project):
```bash
npm install react react-dom tailwindcss
```

## Usage

```tsx
'use client';

import { RichTextEditor } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';
import { useState } from 'react';

export function MySection() {
  const [html, setHtml] = useState('<p>Hello from Storio editor library!</p>');

  return (
    <RichTextEditor
      value={html}
      onChange={setHtml}
      placeholder="Write your content…"
      minHeight={300}
      className="my-4"
      onInsertImageClick={(callback) => {
        // Open YOUR OWN media picker here, then call callback(url)
        const url = window.prompt('Paste image URL:');
        if (url) callback(url);
      }}
      onInsertFileClick={(callback, name) => {
        const url = window.prompt('Paste file URL:');
        const fileName = window.prompt('File name (optional):');
        if (url) callback(url, fileName);
      }}
    />
  );
}
```

## Features (all preserved from Storio)

- contentEditable-based WYSIWYG editing
- Full formatting toolbar: bold, italic, underline, strikethrough, superscript, subscript
- Font family, font size, heading dropdowns
- Text color & highlight color pickers
- Alignment, line spacing, lists, indent/outdent
- Code blocks, blockquotes, custom horizontal rules
- Links, images (pluggable via `onInsertImageClick`)
- **Table picker & premium table operations** (add/delete rows/columns, cell background, table themes)
- **WordArt typography presets**
- **Symbols & emoji picker**
- **Search & replace**
- **Voice typing (Web Speech API)**
- **MS Word (.docx) import** via Mammoth
- **11 premium document templates** (newsletters, reports, syllabi, pricing, faculty showcase, etc.)
- **MS Word shapes** (process blocks, badges, callouts, banners, arrows, shields)
- **Signature & canvas sketch pad** (draw and insert as image)
- **Image resize handles & alignment toolbar** (floating overlay when image selected)
- **Draft autosave & recovery banner** (localStorage)
- **Document statistics** (words, characters, reading time)
- **Translate** (Google Translate integration)
- **Fullscreen mode**
- **Status bar with word count**

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Current HTML content |
| `onChange` | `(html: string) => void` | — | Fired with HTML on every change |
| `placeholder` | `string` | `'Start typing here…'` | Placeholder shown when empty |
| `minHeight` | `number` | `280` | Minimum editor height in pixels |
| `className` | `string` | `''` | Additional CSS class |
| `onInsertImageClick` | `(callback: (url: string) => void) => void` | — | Open your own media picker, then call `callback(url)` |
| `onInsertFileClick` | `(callback: (url: string, name?: string) => void) => void` | — | Open your own file picker, then call `callback(url, name)` |

## CSS / Tailwind

The editor uses **Tailwind CSS classes** throughout. Make sure Tailwind is installed in your consumer project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Import the CSS file once in your app root:

```tsx
import '@storio/rich-text-editor/styles.css';
```

## License

MIT
