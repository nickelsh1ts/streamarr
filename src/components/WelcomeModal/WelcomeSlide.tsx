'use client';
import CachedImage from '@app/components/Common/CachedImage';
import ContentRenderer from '@app/components/Common/ContentRenderer';
import YouTubeEmbed from '@app/components/Common/YouTubeEmbed';
import type { WelcomeContentResponse } from '@server/interfaces/api/onboardingInterfaces';
import React from 'react';

interface WelcomeSlideProps {
  content: WelcomeContentResponse;
  icon?: React.ReactNode;
}

const WelcomeSlide: React.FC<WelcomeSlideProps> = ({ content, icon }) => {
  return (
    <div className="flex flex-col h-full text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-2xl sm:text-3xl font-bold text-base-content mb-4">
        {content.title}
      </h2>
      {content.description && (
        <p className="text-base-content/70 text-lg mb-6 leading-relaxed">
          {content.description}
        </p>
      )}
      <div className="flex-1 flex flex-col gap-4 items-center justify-center">
        {!!content.imageUrl && (
          <div className="relative w-full max-w-lg mx-auto h-48">
            <CachedImage
              src={content.imageUrl}
              alt={content.title}
              fill
              sizes="(max-width: 768px) 100vw, 512px"
              className="object-contain"
            />
          </div>
        )}
        {!!content.videoUrl && (
          <YouTubeEmbed
            url={content.videoUrl}
            title={content.title}
            autoplay={content.videoAutoplay}
            className="max-w-lg mx-auto"
          />
        )}
        {!!content.customHtml && <ContentRenderer html={content.customHtml} />}
      </div>
    </div>
  );
};

export default WelcomeSlide;
