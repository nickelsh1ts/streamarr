'use client';
import DOMPurify from 'isomorphic-dompurify';
import React, { useMemo } from 'react';

interface ContentRendererProps {
  html: string;
  className?: string;
}

// Allowed HTML tags for rendering
const ALLOWED_TAGS = [
  'p',
  'br',
  'b',
  'i',
  'em',
  'strong',
  'u',
  's',
  'strike',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
  'div',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

// Allowed HTML attributes
const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'id',
  'style',
  'src',
  'alt',
  'title',
  'width',
  'height',
];

/**
 * Safely renders sanitized HTML content
 * Uses DOMPurify for XSS protection
 */
const ContentRenderer: React.FC<ContentRendererProps> = ({
  html,
  className = '',
}) => {
  // Sanitize and process the HTML
  const sanitizedHtml = useMemo(() => {
    if (!html) return '';

    // Configure DOMPurify
    const config = {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target', 'rel'],
    };

    // Sanitize the HTML
    let clean = DOMPurify.sanitize(html, config);

    // Post-process: add safe link attributes to all anchors
    // This ensures external links open safely
    clean = clean.replace(
      /<a\s+([^>]*)href=/gi,
      '<a $1target="_blank" rel="noopener noreferrer" href='
    );

    return clean;
  }, [html]);

  if (!sanitizedHtml) {
    return null;
  }

  return (
    <div
      className={`prose prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default ContentRenderer;
