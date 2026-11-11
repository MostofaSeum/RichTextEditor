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

## Features

- **Bidirectional Editing (Visual WYSIWYG ⇄ Source Code)**:
  - Visual mode: Full formatting toolbar (Bold, Italic, Headings, Fonts, Colors, Highlights, Table operations, Mammoth .docx import, Document templates, etc.).
  - **Source Code (`< >`) Mode**: Allows writers and developers to write or paste arbitrary **HTML, custom `<style>` CSS, and interactive `<script>` JavaScript** to build beautiful, custom, interactive blog layouts.
- **Accompanying `<RichTextRenderer />` Component**:
  - Automatically executes and mounts custom HTML, styles, and interactive JavaScript on reader-facing blog post pages without any extra coding.
- **Self-Contained Styling**: Pre-bundled minified CSS (`@storio/rich-text-editor/styles.css`).
- **Zero-Config Installation**: Works out of the box with React 18+ and Next.js.

## Usage

### 1. In your Admin / Writer Section:
```tsx
'use client';

import { RichTextEditor } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';
import { useState } from 'react';

export function BlogEditor() {
  const [content, setContent] = useState('<p>Start writing your article...</p>');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Write your blog post…"
      minHeight={350}
    />
  );
}
```

### 2. On your Public Blog Post / Reader Page:
```tsx
'use client';

import { RichTextRenderer } from '@storio/rich-text-editor';

export function BlogPostPage({ post }: { post: { content: string } }) {
  return (
    <article className="prose max-w-4xl mx-auto my-8">
      {/* Renders the custom HTML, executes custom <style> rules, and runs interactive <script> widgets */}
      <RichTextRenderer html={post.content} />
    </article>
  );
}
```

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
