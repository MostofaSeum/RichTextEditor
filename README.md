# @storio/rich-text-editor

A plug-and-play, zero-config WYSIWYG rich text editor & code customizer library for **React** and **Next.js**.

Designed for production web apps, CMS platforms, and SaaS dashboards. It gives your team full Word-style visual editing, dedicated **HTML / CSS / JavaScript** tabs with live previews, drag-and-drop image uploading with corner drag-to-resize, and matching reader components.

---

## Table of Contents
1. [Installation](#-installation)
2. [Quick Start](#-quick-start)
   - [A. Visual Word-Style Editor (`<RichTextEditor />`)](#a-visual-word-style-editor-richtexteditor)
   - [B. Multi-Tab Customizer (`<CodePenEditor />`)](#b-multi-tab-customizer-codepeneditor)
   - [C. Public Blog Reader (`<RichTextRenderer />`)](#c-public-blog-reader-richtextrenderer)
   - [D. Styling Saved HTML Anywhere (`content.css` / `richTextContentCss`)](#d-styling-saved-html-anywhere-contentcss--richtextcontentcss)
3. [Image System (Upload, Drag-and-Drop, Paste & Resize)](#-image-system)
4. [Saving to Databases (Django, Node, Postgres, MongoDB, etc.)](#-saving-to-databases)
5. [Controlling Size, Spacing & Container Width](#-controlling-size-spacing--container-width)
6. [Props & API Reference](#-props--api-reference)
7. [Features Included](#-features-included)

---

## 📦 Installation

Install directly into any React 18+ or Next.js app using the repository URL:

```bash
# Recommended: Install directly via GitHub repository
npm install github:MostofaSeum/RichTextEditor

# OR with yarn:
yarn add github:MostofaSeum/RichTextEditor

# OR with pnpm:
pnpm add github:MostofaSeum/RichTextEditor
```

### In `package.json`:
```json
{
  "dependencies": {
    "@storio/rich-text-editor": "github:MostofaSeum/RichTextEditor#main"
  }
}
```

### Peer Dependencies
Requires React 18 or 19:
```bash
npm install react react-dom
```
> **Note:** TailwindCSS is **not required** in consumer apps. All editor and toolbar styles are self-contained and pre-bundled in `@storio/rich-text-editor/styles.css`.

---

## 🚀 Quick Start

Always import the bundled editor styles once in your component or root layout:
```tsx
import '@storio/rich-text-editor/styles.css';
```

---

### A. Visual Word-Style Editor (`<RichTextEditor />`)
For typical content writing with complete Word formatting, tables, document templates, shapes, and image resizing:

```tsx
'use client';

import { useState } from 'react';
import { RichTextEditor } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';

export function SimpleArticleEditor() {
  const [content, setContent] = useState('<p>Welcome to our new article!</p>');

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Type something amazing..."
        minHeight={400}
      />
    </div>
  );
}
```

---

### B. Multi-Tab Customizer (`<CodePenEditor />`)
For CMS or power users who need dedicated tabs for **Visual Editor**, **HTML**, **CSS**, and **JavaScript** with a live sandboxed combined preview:

```tsx
'use client';

import { useState } from 'react';
import { CodePenEditor, type CodeOutput } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';

export function AdvancedPostCustomizer() {
  const [postData, setPostData] = useState<CodeOutput | null>(null);

  const handleSave = async () => {
    if (!postData) return;

    // Send postData.combinedHtml directly to your database API
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Custom Post',
        content: postData.combinedHtml, // <-- Contains HTML + <style> + <script>
      }),
    });
    alert('Post saved successfully!');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto' }}>
      <CodePenEditor
        onChange={setPostData}
        minHeight={450}
      />
      <button
        onClick={handleSave}
        style={{
          marginTop: '1rem',
          padding: '10px 20px',
          background: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Save &amp; Publish Post
      </button>
    </div>
  );
}
```

---

### C. Public Blog Reader (`<RichTextRenderer />`)
Used on your public-facing article or blog post page to safely display the stored content. Automatically mounts the HTML, applies custom CSS styles, and executes interactive JavaScript:

```tsx
'use client';

import { RichTextRenderer } from '@storio/rich-text-editor';

export function BlogPostPage({ post }: { post: { title: string; content: string } }) {
  return (
    <article style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>{post.title}</h1>
      <hr style={{ margin: '1.5rem 0', borderColor: '#e2e8f0' }} />
      
      {/* Renders the combined HTML, styles, and interactive scripts */}
      <RichTextRenderer html={post.content} />
    </article>
  );
}
```

---

### D. Styling Saved HTML Anywhere (`content.css` / `richTextContentCss`)
The editor bakes structural styling into the saved HTML, but elements like headings (H1–H6), blockquote borders, list bullets, and table outlines require CSS rules to override Tailwind preflight resets.

The library exports a dedicated lightweight stylesheet that formats these containers (`.rte-content`, `.rich-text-content`, `.rich-article-content`):

#### Option 1: Import the standalone CSS file
```tsx
import '@storio/rich-text-editor/content.css';
```
*(If you already import `@storio/rich-text-editor/styles.css`, these rules are already included)*

#### Option 2: Inject the CSS string (Scoped portals, iframes, or Next.js server components)
```tsx
// Imports only the lightweight CSS string (~5 KB) without bringing in editor code
import { richTextContentCss } from '@storio/rich-text-editor/content-styles';

export function ArticleBody({ html }: { html: string }) {
  return (
    <article className="rich-article-content">
      <style dangerouslySetInnerHTML={{ __html: richTextContentCss }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
```

---

## 🖼️ Image System

The library provides a modern image pipeline with zero required setup:

1. **Toolbar Modal**: Clicking the Image icon opens a clean dialog:
   - **Upload from Computer**: Select file from local disk (`.png`, `.jpg`, `.webp`, `.gif`, `.svg`).
   - **Image URL**: Enter any external web image URL.
2. **Drag & Drop**: Drag any image file from your computer and drop it directly onto the editor.
3. **Paste from Clipboard (`Ctrl + V`)**: Copy or screenshot an image and paste it directly into the text.
4. **Corner Drag-to-Resize**:
   - Click any image inside the editor to reveal **4 corner handles** and an alignment toolbar (Left, Center, Right, Full width, Reset, Delete).
   - Drag any corner to scale the image while **preserving original aspect ratio**.

### Cloud Storage (AWS S3, Cloudinary, Firebase, or Custom Backend)
By default, images are converted to Base64 data URLs (zero server required). To store images on your cloud bucket instead, pass `onUploadImage`:

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  onUploadImage={async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    return url; // Inserted into editor automatically!
  }}
/>
```

---

## 💾 Saving to Databases

The editor outputs standard text strings. It requires **no special database plugins** and works seamlessly with:
- **Django (Python)**: `content = models.TextField()`
- **Node.js / Express / NestJS**: `String` column
- **Postgres / MySQL / SQLite**: `TEXT` or `LONGTEXT` column
- **MongoDB / Supabase / Firebase**: String field

### Recommended Save Pattern:
When saving from `<CodePenEditor />`, use **`data.combinedHtml`**:
```ts
const payload = {
  title: title,
  content: data.combinedHtml, // Saves HTML, <style> CSS, and <script> JS together
};
```
When loading it back to display on the blog:
```tsx
<RichTextRenderer html={post.content} />
```

---

## 📐 Controlling Size, Spacing & Container Width

The editor and renderer are **100% fluid (`w-full`)** and adapt to whatever container they sit inside:

### In Dashboard Layouts (Beside a Sidebar)
Wrap the editor in any container. It will not overflow or break sidebar navigation:
```tsx
<div className="flex-1 max-w-5xl mx-auto p-6">
  <RichTextEditor value={content} onChange={setContent} minHeight={450} />
</div>
```

---

## ⚙️ Props & API Reference

### `<RichTextEditor />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | **Required** | Current HTML content string |
| `onChange` | `(html: string) => void` | **Required** | Triggered on every keystroke/formatting change |
| `placeholder` | `string` | `'Start typing here…'` | Faded placeholder when editor is empty |
| `minHeight` | `number` | `280` | Minimum height of text area in pixels |
| `className` | `string` | `''` | Extra CSS class for container |
| `onUploadImage` | `(file: File) => Promise<string> \| string` | `undefined` | Custom cloud uploader hook (S3, Cloudinary) |
| `onInsertImageClick` | `(callback: (url: string) => void) => void` | `undefined` | Custom modal picker override |
| `onInsertFileClick` | `(callback: (url: string, name?: string) => void) => void` | `undefined` | Custom attachment hook |

### `<CodePenEditor />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialHtml` | `string` | `''` | Initial markup string |
| `initialCss` | `string` | `''` | Initial custom stylesheet |
| `initialJs` | `string` | `''` | Initial custom JavaScript |
| `onChange` | `(output: CodeOutput) => void` | `undefined` | Emits `{ html, css, js, combinedHtml }` |
| `minHeight` | `number` | `350` | Minimum height in pixels |
| `showPreview` | `boolean` | `true` | Show/hide the live combined preview iframe |
| `onUploadImage` | `(file: File) => Promise<string> \| string` | `undefined` | Custom cloud uploader hook |

### `<RichTextRenderer />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `html` | `string` | **Required** | Content string loaded from database |
| `executeScripts` | `boolean` | `true` | Executes embedded `<script>` tags for interactive widgets |
| `className` | `string` | `''` | Extra CSS classes for article container |
| `style` | `React.CSSProperties` | `undefined` | Inline styles for article container |

---

### Package Exports
| Export | Type | Description |
| :--- | :--- | :--- |
| `RichTextEditor` | Component | Word-style visual editor |
| `CodePenEditor` | Component | Visual + HTML/CSS/JS tabs with live preview |
| `RichTextRenderer` | Component | Renders saved HTML, CSS, and scripts |
| `richTextContentCss` | `string` | Content stylesheet for saved HTML (inject into `<style>`) |
| `@storio/rich-text-editor/content-styles` | Subpath | Lightweight export of `richTextContentCss` (no editor code) |
| `@storio/rich-text-editor/styles.css` | CSS file | Editor UI styles (import once) |
| `@storio/rich-text-editor/content.css` | CSS file | Standalone content styles (already bundled in `styles.css`) |

---

## ✨ Features Included

- **MS Word-Parity Typography**: Paragraphs, Headings (H1–H6), 7 font families, font sizes (8px–72px), line-height spacing.
- **Inline Styling**: Bold, Italic, Underline, Strikethrough, Superscript, Subscript.
- **Transformations**: UPPERCASE, lowercase, and Capitalize Each Word.
- **WordArt**: 6 3D text effect presets (Neon Blue, Gold Gloss, Retro 3D, Emerald Glow, Metallic Silver, Shadow Outline).
- **Color Controls**: Preset palettes + custom hex color picker for text and highlight backgrounds.
- **Tables**: Interactive 8x8 grid picker, dynamic add/remove rows and columns, cell background colors.
- **Lists & Indent**: Numbered lists, bullet lists, indent/outdent.
- **Shapes & Embellishments**: Pre-built SVGs and badges (Shields, Stars, Process badges, Directional arrows).
- **Drawing Pad**: Built-in canvas sketch pad for handwritten signatures and drawings.
- **MS Word (.docx) Import**: Native Word document importer via Mammoth.
- **Document Layout Templates**: 11 one-click layouts (newsletters, academic circulars, course syllabi, pricing tables, faculty showcases).
- **Voice Typing**: Built-in Web Speech API dictation.
- **Non-destructive Inline Translation**: Google Translate integration (English, Bengali, Arabic, Spanish, Hindi, French).
- **Utilities**: Search & Replace bar, Fullscreen mode (`⛶`), live word count and reading time statistics.

---

## 📄 License
MIT © Brainicon Technology
