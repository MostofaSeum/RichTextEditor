import React from 'react';
export { richTextContentCss } from './contentStyles.js';

interface RichTextEditorProps {
    /** HTML string value */
    value: string;
    /** Called with HTML string on every change */
    onChange: (html: string) => void;
    placeholder?: string;
    /** Minimum height of the editing area in px */
    minHeight?: number;
    className?: string;
    /**
     * Optional custom image uploader for S3, Cloudinary, Firebase, or custom backend.
     * Receives the File and should return the uploaded public image URL.
     * If omitted, images are automatically converted to Base64 data URLs.
     */
    onUploadImage?: (file: File) => Promise<string> | string;
    /**
     * callback; the caller should invoke the callback with the chosen image URL.
     */
    onInsertImageClick?: (callback: (url: string) => void) => void;
    /**
     * Optional handler to open a file picker externally.
     * Callback args: (url: string, fileName?: string)
     */
    onInsertFileClick?: (callback: (url: string, name?: string) => void) => void;
}
declare function RichTextEditor({ value, onChange, placeholder, minHeight, className, onUploadImage, onInsertImageClick, onInsertFileClick: _onInsertFileClick, }: RichTextEditorProps): React.JSX.Element;

interface CodeOutput {
    html: string;
    css: string;
    js: string;
    combinedHtml: string;
}
interface CodePenEditorProps {
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
declare function CodePenEditor({ initialHtml, initialCss, initialJs, onChange, className, minHeight, showPreview, onUploadImage, onInsertImageClick, }: CodePenEditorProps): React.JSX.Element;

interface RichTextRendererProps {
    /** The HTML string (including <style> or <script> tags) to render */
    html: string;
    /** Optional custom container CSS classes */
    className?: string;
    /** Optional inline styles for the container */
    style?: React.CSSProperties;
    /** Whether to execute embedded <script> tags. Defaults to true. */
    executeScripts?: boolean;
}
/**
 * RichTextRenderer
 *
 * Safely renders rich text, custom HTML, embedded <style> CSS,
 * and executes embedded <script> tags so dynamic widgets work in blog posts.
 */
declare function RichTextRenderer({ html, className, style, executeScripts, }: RichTextRendererProps): React.JSX.Element;

export { type CodeOutput, CodePenEditor, type CodePenEditorProps, RichTextEditor, type RichTextEditorProps, RichTextRenderer, type RichTextRendererProps };
