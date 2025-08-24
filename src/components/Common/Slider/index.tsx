import RecentInvite from '@app/components/Common/Slider/RecentInvite';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';
import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpring } from 'react-spring';

interface SliderProps {
  sliderKey: string;
  items?: JSX.Element[];
  isLoading: boolean;
  isEmpty?: boolean;
  emptyMessage?: React.ReactNode;
  placeholder?: React.ReactNode;
}

enum Direction {
  RIGHT,
  LEFT,
}

const Slider = ({
  sliderKey,
  items,
  isLoading,
  isEmpty = false,
  emptyMessage,
  placeholder = <RecentInvite.Placeholder />,
}: SliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPos, setScrollPos] = useState({ isStart: true, isEnd: false });

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.getBoundingClientRect().width;
    const scrollPosition = container.scrollLeft;

    if (!items || items.length === 0 || clientWidth >= scrollWidth) {
      setScrollPos({ isStart: true, isEnd: true });
      return;
    }

    const isStart = scrollPosition <= 1;
    const isEnd = scrollPosition >= scrollWidth - clientWidth - 1;

    setScrollPos({ isStart, isEnd });
  }, [items]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedScroll = useCallback(
    debounce(() => handleScroll(), 50),
    [handleScroll]
  );

  useEffect(() => {
    const handleResize = () => {
      debouncedScroll();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [debouncedScroll]);

  useEffect(() => {
    handleScroll();
  }, [items, handleScroll]);

  const onScroll = () => {
    debouncedScroll();
  };

  const [, setX] = useSpring(() => ({
    from: { x: 0 },
    to: { x: 0 },
  }));

  const slide = (direction: Direction) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const clientWidth = container.getBoundingClientRect().width;
    const scrollPosition = container.scrollLeft;

    // Get card width from first visible child
    let cardWidth = 0;
    const children = Array.from(container.children) as HTMLElement[];
    for (const child of children) {
      const childWidth = child.getBoundingClientRect().width;
      if (childWidth > 0) {
        cardWidth = childWidth;
        break;
      }
    }

    if (cardWidth === 0) cardWidth = 200; // Fallback

    const visibleItems = Math.floor(clientWidth / cardWidth);
    const scrollStep = Math.max(visibleItems * cardWidth, cardWidth);

    const newX =
      direction === Direction.LEFT
        ? Math.max(scrollPosition - scrollStep, 0)
        : Math.min(
            scrollPosition + scrollStep,
            container.scrollWidth - clientWidth
          );

    setX.start({
      from: { x: scrollPosition },
      to: { x: newX },
      onChange: (results) => {
        if (containerRef.current) {
          containerRef.current.scrollLeft = results.value.x;
        }
      },
      onRest: () => handleScroll(),
      reset: true,
      config: { friction: 60, tension: 500, velocity: 20 },
    });
  };

  return (
    <div className="relative" data-testid="media-slider">
      <div className="absolute right-0 -mt-10 flex text-gray-400">
        <button
          className={`${
            scrollPos.isStart ? 'text-gray-800' : 'hover:text-white'
          } focus:outline-none`}
          onClick={() => !scrollPos.isStart && slide(Direction.LEFT)}
          disabled={scrollPos.isStart}
          type="button"
          aria-label="Scroll left"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          className={`${
            scrollPos.isEnd ? 'text-gray-800' : 'hover:text-white'
          } focus:outline-none`}
          onClick={() => !scrollPos.isEnd && slide(Direction.RIGHT)}
          disabled={scrollPos.isEnd}
          type="button"
          aria-label="Scroll right"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
      <div
        className="hide-scrollbar relative -my-2 -ml-4 -mr-4 overflow-y-auto overflow-x-scroll overscroll-x-contain whitespace-nowrap px-2 py-2"
        ref={containerRef}
        onScroll={onScroll}
      >
        {items?.map((item, index) => (
          <div
            key={`${sliderKey}-${index}`}
            className="inline-block px-2 align-top"
          >
            {item}
          </div>
        ))}
        {isLoading &&
          [...Array(10)].map((_item, i) => (
            <div
              key={`placeholder-${i}`}
              className="inline-block px-2 align-top"
            >
              {placeholder}
            </div>
          ))}
        {isEmpty && (
          <div className="mt-16 mb-16 text-center font-medium text-gray-400">
            {emptyMessage ? emptyMessage : 'No Results found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default Slider;
