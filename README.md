# @storio/rich-text-editor 🚀

A plug-and-play, zero-config rich text & code customizer library for **React** and **Next.js**.

Allows teammates and writers to create beautiful content visually, or customize it with separated **HTML, CSS, and JavaScript** tabs, and immediately render the live interactive output on reader-facing pages (blogs, articles, docs).

---

## 1. Installation

Install the package in any React / Next.js project:

```bash
# If installing from npm (or internal registry):
npm install @storio/rich-text-editor

# OR if installing directly from the local repository / workspace:
npm install "d:/Brainicon Technology/RichTextEditor"

# OR via Git:
npm install git+https://github.com/MostofaSeum/RichTextEditor.git
```

### Peer Dependencies
Ensure the project has `react` and `react-dom` (v18 or v19):
```bash
npm install react react-dom
```

---

## 2. Quick Start: How Teammates Use It

### Option A: Standard Word-like Rich Text Editor (`<RichTextEditor />`)
For regular blog editing with all formatting, table pickers, Mammoth .docx import, templates, drawing canvas, and drag-and-drop images:

```tsx
'use client';

import React, { useState } from 'react';
import { RichTextEditor } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';

export function BlogEditor() {
  const [content, setContent] = useState('<h2>Welcome to my blog</h2><p>Start writing here...</p>');

  const handleSave = async () => {
    // Save to your database / API endpoint
    await fetch('/api/posts/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    alert('Blog post saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <RichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Write your article..."
        minHeight={360}
      />
      <button 
        onClick={handleSave}
        className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold"
      >
        Save Article
      </button>
    </div>
  );
}
```

---

### Option B: Advanced Customizer (`<CodePenEditor />`)
For power users who want separated **Visual Editor, HTML, CSS, and JS** tabs, with live combined output:

```tsx
'use client';

import React, { useState } from 'react';
import { CodePenEditor, type CodeOutput } from '@storio/rich-text-editor';
import '@storio/rich-text-editor/styles.css';

export function AdvancedPostCustomizer() {
  const [data, setData] = useState<CodeOutput | null>(null);

  const handleSave = async () => {
    if (!data) return;
    // data contains:
    // data.html         -> Raw HTML markup
    // data.css          -> Custom stylesheet rules
    // data.js           -> Custom interactive JavaScript
    // data.combinedHtml -> Full bundle ready for direct blog rendering

    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data.combinedHtml, // Ready to render in blog!
      }),
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <CodePenEditor
        onChange={(output) => setData(output)}
        minHeight={320}
      />
      <button 
        onClick={handleSave} 
        className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg"
      >
        Publish Custom Post
      </button>
    </div>
  );
}
```

---

### Option C: Rendering on the Blog / Reader Page (`<RichTextRenderer />`)
Place `<RichTextRenderer />` on your public blog post page to display the saved output. It automatically applies custom styles and executes any interactive JavaScript widgets:

```tsx
'use client';

import { RichTextRenderer } from '@storio/rich-text-editor';

export function BlogPostPage({ post }: { post: { content: string } }) {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <RichTextRenderer html={post.content} />
    </main>
  );
}
```

---

## 3. Universal Image Uploading

By default, any dropped, pasted (`Ctrl+V`), or uploaded image is converted to an offline Base64 string automatically (zero setup needed).

If your team uses **AWS S3, Cloudinary, Firebase, or your own upload endpoint**, simply provide `onUploadImage`:

```tsx
<RichTextEditor
  value={content}
  onChange={setContent}
  onUploadImage={async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const { url } = await res.json();
    return url; // Automatically inserted into the editor!
  }}
/>
```

---

## 4. Components & Props Reference

### `<RichTextEditor />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | **Required** | Current HTML content string |
| `onChange` | `(html: string) => void` | **Required** | Callback fired whenever content changes |
| `placeholder` | `string` | `'Start typing here…'` | Placeholder shown when editor is empty |
| `minHeight` | `number` | `280` | Minimum height of the editor in pixels |
| `className` | `string` | `''` | Extra CSS class for container |
| `onUploadImage` | `(file: File) => Promise<string> \| string` | `undefined` | Custom cloud uploader hook (S3/Cloudinary) |
| `onInsertImageClick` | `(callback: (url: string) => void) => void` | `undefined` | External modal callback |

### `<CodePenEditor />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `initialHtml` | `string` | Sample HTML | Initial markup |
| `initialCss` | `string` | Sample CSS | Initial stylesheet |
| `initialJs` | `string` | Sample JS | Initial JavaScript |
| `onChange` | `(output: CodeOutput) => void` | `undefined` | Emits `{ html, css, js, combinedHtml }` |
| `showPreview` | `boolean` | `true` | Show/hide the live combined preview iframe |
| `onUploadImage` | `(file: File) => Promise<string> \| string` | `undefined` | Image uploader hook |

### `<RichTextRenderer />`
| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `html` | `string` | **Required** | Stored blog content string |
| `executeScripts` | `boolean` | `true` | Automatically executes embedded `<script>` widgets |
| `className` | `string` | `''` | Extra CSS class for reader container |
