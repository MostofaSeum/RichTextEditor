import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CodePenEditor, type CodeOutput } from '../dist/index.mjs';
import '../dist/styles.css';

function Playground() {
  const [output, setOutput] = useState<CodeOutput | null>(null);

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
          Interactive Blog Customizer — Clean Separated Sections
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Users have clean, dedicated sections for <strong>Visual Editor</strong>, <strong>HTML</strong>, <strong>CSS</strong>, and <strong>JS</strong>. The combined output updates live below!
        </p>
      </header>

      {/* The Component */}
      <CodePenEditor
        onChange={(data) => setOutput(data)}
        minHeight={320}
      />

      {/* Output String (what gets saved in the database or rendered in the blog) */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5, margin: '0 0 8px 0' }}>
          Generated Output Object (for your API / Database)
        </h3>
        <pre style={{ margin: 0, padding: 14, background: '#0f172a', color: '#38bdf8', borderRadius: 8, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {output ? JSON.stringify({ html: output.html, css: output.css, js: output.js }, null, 2) : 'Type or edit to see output...'}
        </pre>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Playground />);
}
