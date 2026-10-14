import React from 'react';
import DOMPurify from 'dompurify';

export interface SanitizedHtmlProps {
  html: string;
  className?: string;
  tag?: 'div' | 'span' | 'p' | 'article' | 'section';
}

/**
 * Programmatic helper to sanitize raw HTML strings using DOMPurify.
 * Removes script tags, inline event attributes (onerror, onclick), and javascript: URIs.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'span', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'mark', 'kbd'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'title'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'data', 'action'],
    FORCE_BODY: false,
  });
}

/**
 * Security Directive Component: XSS Prevention
 * Uses DOMPurify to strip all malicious scripts, inline event handlers, and javascript: URIs
 * before rendering. Ensures zero unsanitized HTML is injected into the DOM.
 */
export const SanitizedHtml: React.FC<SanitizedHtmlProps> = ({
  html,
  className = '',
  tag: Tag = 'div',
}) => {
  const cleanHtml = React.useMemo(() => sanitizeHtml(html), [html]);

  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default SanitizedHtml;
