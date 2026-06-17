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
    <div className="flex h-full flex-col text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-base-content mb-4 text-2xl font-bold sm:text-3xl">
        {content.title}
      </h2>
      {content.description && (
        <p className="text-base-content/70 mb-6 text-lg leading-relaxed">
          {content.description}
        </p>
      )}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        {!!content.imageUrl && (
          <div className="relative mx-auto h-48 w-full max-w-lg">
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
            className="mx-auto max-w-lg"
          />
        )}
        {!!content.customHtml && <ContentRenderer html={content.customHtml} />}
      </div>
    </div>
  );
};

export default WelcomeSlide;
