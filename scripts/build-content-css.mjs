import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = path.join(root, 'src', 'content.css');
const tsPath = path.join(root, 'src', 'contentStyles.ts');

const css = fs.readFileSync(cssPath, 'utf8');

const ts = `/* AUTO-GENERATED from src/content.css — run "npm run build:content" after editing the CSS. */
export const richTextContentCss = ${JSON.stringify(css)};
`;

fs.writeFileSync(tsPath, ts, 'utf8');
console.log('Generated src/contentStyles.ts');

// Keep a standalone copy available for consumers that only render saved HTML.
const distDir = path.join(root, 'dist');
if (fs.existsSync(distDir)) {
    fs.copyFileSync(cssPath, path.join(distDir, 'content.css'));
    console.log('Copied src/content.css -> dist/content.css');

    fs.writeFileSync(
        path.join(distDir, 'content.d.ts'),
        "declare module '@storio/rich-text-editor/content.css';\n",
        'utf8',
    );
    console.log('Wrote dist/content.d.ts');
}
