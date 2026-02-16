'use client';
import React, { useMemo } from 'react';

interface SpotlightProps {
  targetRect: DOMRect;
  padding?: number;
  backgroundColor?: string;
  className?: string;
  zIndex?: number;
  blockClicks?: boolean;
}

const Spotlight: React.FC<SpotlightProps> = ({
  targetRect,
  padding = 8,
  className = '',
  zIndex = 1100,
  blockClicks = true,
}) => {
  const { spotlightStyle, holeStyle } = useMemo(() => {
    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const width = targetRect.width + padding * 2;
    const height = targetRect.height + padding * 2;

    return {
      spotlightStyle: {
        clipPath: `polygon(
          0% 0%,
          0% 100%,
          ${x}px 100%,
          ${x}px ${y}px,
          ${x + width}px ${y}px,
          ${x + width}px ${y + height}px,
          ${x}px ${y + height}px,
          ${x}px 100%,
          100% 100%,
          100% 0%
        )`,
        zIndex,
      },
      holeStyle: {
        left: x,
        top: y,
        width,
        height,
        zIndex: zIndex + 1,
      },
    };
  }, [targetRect, padding, zIndex]);

  return (
    <>
      {blockClicks && (
        <div
          className="fixed inset-0 cursor-default animate-fade-in"
          style={{ zIndex: zIndex - 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div
        className={`fixed inset-0 pointer-events-none transition-all duration-300 animate-fade-in bg-black backdrop-blur-sm bg-opacity-30 ${className}`}
        style={spotlightStyle}
      />
      {blockClicks && (
        <div className="fixed pointer-events-none" style={holeStyle} />
      )}
    </>
  );
};

export default Spotlight;
