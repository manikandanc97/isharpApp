"use client";

import { useState } from "react";

interface QuestionDiagramProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
}

/**
 * Renders dynamic question, option, and solution diagrams (including data URIs,
 * SVG payloads, local uploads, and external URLs of unknown aspect ratio).
 * Uses native <img> intentionally because next/image requires static dimensions
 * and domain allowlists incompatible with arbitrary imported question media.
 */
export function QuestionDiagram({
  src,
  alt,
  className = "max-h-72 object-contain rounded-lg",
  fallbackText = "Diagram image preview unavailable or not found",
}: QuestionDiagramProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src) return null;

  if (failedSrc === src) {
    return (
      <div className="py-4 text-center text-xs font-medium text-slate-400">
        {fallbackText}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setFailedSrc(src)}
    />
  );
}
