'use client';
import CachedImage from '@app/components/Common/CachedImage';
import type { ImageLoader } from 'next/image';
import type { ForwardRefRenderFunction, HTMLAttributes } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

interface ImageFaderProps extends HTMLAttributes<HTMLDivElement> {
  backgroundImages: string[];
  rotationSpeed?: number;
  forceOptimize?: boolean;
  gradient?: string;
}

const DEFAULT_ROTATION_SPEED = 6000;

const ImageFader: ForwardRefRenderFunction<HTMLDivElement, ImageFaderProps> = (
  {
    backgroundImages,
    rotationSpeed = DEFAULT_ROTATION_SPEED,
    gradient = 'bg-gradient-to-t lg:bg-gradient-to-r from-brand-dark via-brand-dark/75 via-65% lg:via-40% to-80% to-brand-dark/0',
    forceOptimize,
    ...props
  },
  ref
) => {
  const [activeIndex, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setIndex((ai) => (ai + 1) % backgroundImages.length),
      rotationSpeed
    );
    return () => {
      clearInterval(interval);
    };
  }, [backgroundImages, rotationSpeed]);

  const imageLoader = useMemo<ImageLoader>(
    () =>
      ({ src }) =>
        src,
    []
  );
  const overrides = useMemo(
    () => (forceOptimize ? { unoptimized: false } : {}),
    [forceOptimize]
  );

  const renderedImages = useMemo(
    () =>
      backgroundImages.map((imageUrl, i) => (
        <div
          key={`banner-image-${i}`}
          className={`absolute-top-shift absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in ${
            i === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        >
          <CachedImage
            unoptimized
            loader={imageLoader}
            className="absolute inset-0 h-full w-full"
            style={{ objectFit: 'cover' }}
            alt=""
            src={imageUrl}
            fill
            {...overrides}
          />
          <div className={`absolute inset-0 ${gradient}`} />
        </div>
      )),
    [backgroundImages, activeIndex, gradient, imageLoader, overrides, props]
  );

  return <div ref={ref}>{renderedImages}</div>;
};

export default React.forwardRef<HTMLDivElement, ImageFaderProps>(ImageFader);
