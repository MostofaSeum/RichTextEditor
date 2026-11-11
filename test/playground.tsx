import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
// Test importing from the built library distribution
import { RichTextEditor, RichTextRenderer } from '../dist/index.mjs';
import '../dist/styles.css';

const INITIAL_SAMPLE = `<h2>How We Built Our Cloud Infrastructure 🚀</h2>
<p>In modern web engineering, speed and interactivity matter. Below is an example of an <strong>advanced custom card</strong> styled with custom CSS and powered by embedded JavaScript!</p>

<style>
  .interactive-callout {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    border: 1px solid #4338ca;
    color: #ffffff;
    border-radius: 12px;
    padding: 24px;
    margin: 18px 0;
    box-shadow: 0 10px 25px rgba(49, 46, 129, 0.3);
  }
  .interactive-callout h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #e0e7ff;
  }
  .interactive-callout p {
    margin: 0 0 14px 0;
    font-size: 13.5px;
    color: #c7d2fe;
  }
  .demo-btn {
    background: #6366f1;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
  }
  .demo-btn:hover {
    background: #4f46e5;
    transform: translateY(-1px);
  }
  .demo-badge {
    display: inline-block;
    background: #10b981;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 9999px;
    margin-left: 10px;
  }
</style>

<div class="interactive-callout">
  <h3>⚡ Custom Interactive Blog Component</h3>
  <p>Writers can write custom HTML, inject &lt;style&gt; CSS, and attach interactive JavaScript events:</p>
  <button id="like-post-btn" class="demo-btn">
    👍 Claps (<span id="clap-count">12</span>)
  </button>
  <span id="thank-badge" class="demo-badge" style="display:none;">Thanks for clapping!</span>
</div>

<script>
  (function() {
    const btn = document.getElementById('like-post-btn');
    const counter = document.getElementById('clap-count');
    const badge = document.getElementById('thank-badge');
    if (btn && counter) {
      btn.onclick = function() {
        let count = parseInt(counter.textContent || '0', 10);
        counter.textContent = count + 1;
        if (badge) badge.style.display = 'inline-block';
      };
    }
  })();
</script>

<p>You can click the <strong>&lt; / &gt; (Code)</strong> button in the editor toolbar at any time to inspect or customize this code directly!</p>
`;

function Playground() {
  const [content, setContent] = useState(INITIAL_SAMPLE);

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px 0', color: '#0f172a' }}>
          @storio/rich-text-editor — HTML/CSS/JS Blog Post Testing
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>
          Writers can customize writing visually or in <strong>&lt;/&gt; Source Code Mode</strong> with custom HTML, CSS, and JS. Below you see both the Editor and the final Blog Reader view!
        </p>
      </header>

      {/* Editor Section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
            1. Admin / Writer View (RichTextEditor)
          </h2>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Tip: Click the <strong>&lt; &gt; button</strong> on the far right of the toolbar to edit raw HTML/CSS/JS
          </span>
        </div>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Start typing your article here..."
            minHeight={340}
            onInsertImageClick={(callback) => {
              const url = window.prompt('Enter Image URL:');
              if (url) callback(url);
            }}
          />
        </div>
      </section>

      {/* Public Blog Output Section */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px 0' }}>
          2. Final Published Blog Post View (RichTextRenderer)
        </h2>
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '28px 36px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <RichTextRenderer html={content} />
        </div>
      </section>

      {/* Raw HTML Inspection */}
      <section>
        <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5, margin: '0 0 8px 0' }}>
          Under the Hood (Stored Database String)
        </h3>
        <pre style={{ margin: 0, padding: 14, background: '#0f172a', color: '#38bdf8', borderRadius: 8, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {content}
        </pre>
      </section>
    </div>
  );
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<Playground />);
}
