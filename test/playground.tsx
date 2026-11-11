import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
// Test importing from the built library distribution
import { RichTextEditor } from '../dist/index.mjs';
import '../dist/styles.css';

function Playground() {
  const [content, setContent] = useState(
    '<h2>Welcome to Storio Rich Text Editor 🚀</h2><p>This editor is running directly from the <strong>compiled distribution build</strong> (<code>dist/index.mjs</code> + <code>dist/styles.css</code>).</p><p>Try bold, tables, colors, templates, or images!</p>'
  );

  return (
    <div style={{ maxWidth: 1100, margin: '30px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', color: '#1e293b' }}>
          @storio/rich-text-editor — Live Consumer Test
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Simulating how a colleague installs and renders the editor without any custom setup.
        </p>
      </header>

      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Start typing your article here..."
          minHeight={380}
          onInsertImageClick={(callback) => {
            const url = window.prompt('Enter Image URL (e.g. https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800):');
            if (url) callback(url);
          }}
          onInsertFileClick={(callback) => {
            const url = window.prompt('Enter File URL:');
            const name = window.prompt('Enter File Name (optional):');
            if (url) callback(url, name || undefined);
          }}
        />
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: 0.5 }}>
          Live Generated HTML Output
        </h3>
        <pre style={{ margin: 0, padding: 12, background: '#0f172a', color: '#38bdf8', borderRadius: 6, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {content}
        </pre>
      </div>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Playground />);
}

