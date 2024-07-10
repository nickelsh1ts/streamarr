'use client'
import type { ImageLoader } from 'next/image';
import Image from 'next/image';
import type { ForwardRefRenderFunction, HTMLAttributes } from 'react';
import React, { useEffect, useState } from 'react';

interface ImageFaderProps extends HTMLAttributes<HTMLDivElement> {
  backgroundImages: string[];
  rotationSpeed?: number;
  forceOptimize?: boolean;
}

const DEFAULT_ROTATION_SPEED = 6000;

const ImageFader: ForwardRefRenderFunction<HTMLDivElement, ImageFaderProps> = (
  {
    backgroundImages,
    rotationSpeed = DEFAULT_ROTATION_SPEED,
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

  const imageLoader: ImageLoader = ({ src }) => src;

  return (
    <div ref={ref}>
      {backgroundImages.map((imageUrl, i) => (
        <div
          key={`banner-image-${i}`}
          className={`absolute-top-shift absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in ${
            i === activeIndex ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        >
          <Image
            unoptimized
            loader={imageLoader}
            className="absolute inset-0 h-full w-full"
            style={{objectFit:"cover"}}
            alt=""
            src={imageUrl}
            fill
          />
          <div
            className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-dark/90 md:from-brand-dark/100 from-40% md:from-15% via-brand-light/75 via-75% md:via-45%"
          />
        </div>
      ))}
    </div>
  );
};

export default React.forwardRef<HTMLDivElement, ImageFaderProps>(ImageFader);
