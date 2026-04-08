"use client";

import DOMPurify from "isomorphic-dompurify";

interface SafeHtmlProps {
  content: string;
  className?: string;
}

export function SafeHtml({ content, className }: SafeHtmlProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
    />
  );
}
