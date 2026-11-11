'use client';

import React, { useEffect, useRef } from 'react';

export interface RichTextRendererProps {
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
export function RichTextRenderer({
    html,
    className = '',
    style,
    executeScripts = true,
}: RichTextRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = html;

        if (executeScripts) {
            // Re-create script elements so the browser executes them
            const scripts = container.querySelectorAll('script');
            scripts.forEach((oldScript) => {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach((attr) => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode?.replaceChild(newScript, oldScript);
            });
        }
    }, [html, executeScripts]);

    return (
        <div
            ref={containerRef}
            className={`rich-text-content ${className}`}
            style={style}
        />
    );
}

