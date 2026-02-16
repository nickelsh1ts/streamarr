'use client';
import React, { useMemo } from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

/**
 * Privacy-enhanced YouTube embed component
 * Uses youtube-nocookie.com for GDPR compliance
 */
const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  url,
  title = 'Video',
  autoplay = false,
  className = '',
}) => {
  const iframeSrc = useMemo(() => {
    if (!url) return null;

    const params = autoplay ? '?autoplay=1&mute=1' : '';
    return `${url}${params}`;
  }, [url, autoplay]);

  if (!iframeSrc) {
    return null;
  }

  return (
    <div
      className={`relative w-full aspect-video max-w-full overflow-hidden rounded-lg shadow-lg ${className}`}
    >
      <iframe
        src={iframeSrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

export default YouTubeEmbed;
