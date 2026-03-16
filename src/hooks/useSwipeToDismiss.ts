'use client';
import { useIsTouch } from '@app/hooks/useIsTouch';
import { useCallback, useEffect, useRef, useState } from 'react';

let activeCard: { id: string | number; close: () => void } | null = null;

interface UseSwipeToDismissOptions {
  id: string | number;
  revealWidth?: number;
}

interface SwipeTouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

interface UseSwipeToDismissReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  offsetX: number;
  isRevealed: boolean;
  isSwiping: boolean;
  isDismissing: boolean;
  isTouch: boolean;
  handlers: SwipeTouchHandlers;
  close: () => void;
  dismiss: () => void;
}

const DIRECTION_LOCK_THRESHOLD = 10;

const NOOP_HANDLERS: SwipeTouchHandlers = {
  onTouchStart: () => {},
  onTouchMove: () => {},
  onTouchEnd: () => {},
};

export const useSwipeToDismiss = ({
  id,
  revealWidth = 112,
}: UseSwipeToDismissOptions): UseSwipeToDismissReturn => {
  const isTouch = useIsTouch();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const directionLocked = useRef<'horizontal' | 'vertical' | null>(null);
  const startOffsetX = useRef(0);
  const isRevealedRef = useRef(false);

  const close = useCallback(() => {
    setOffsetX(0);
    setIsRevealed(false);
    isRevealedRef.current = false;
    setIsSwiping(false);
    if (activeCard?.id === id) {
      activeCard = null;
    }
  }, [id]);

  const dismiss = useCallback(() => {
    setIsDismissing(true);
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isDismissing) return;

      // Close any other revealed card
      if (activeCard && activeCard.id !== id) {
        activeCard.close();
        activeCard = null;
      }

      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      directionLocked.current = null;
      startOffsetX.current = isRevealedRef.current ? -revealWidth : 0;
    },
    [isDismissing, id, revealWidth]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDismissing) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;

      // Determine direction lock on first significant movement
      if (!directionLocked.current) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (
          absDeltaX < DIRECTION_LOCK_THRESHOLD &&
          absDeltaY < DIRECTION_LOCK_THRESHOLD
        ) {
          return;
        }

        directionLocked.current =
          absDeltaX > absDeltaY ? 'horizontal' : 'vertical';
      }

      if (directionLocked.current !== 'horizontal') return;

      // Prevent vertical scrolling while swiping horizontally
      e.preventDefault();

      if (!isSwiping) {
        setIsSwiping(true);
      }

      const rawOffset = startOffsetX.current + deltaX;
      const clampedOffset = Math.max(-revealWidth, Math.min(0, rawOffset));
      setOffsetX(clampedOffset);
    },
    [isSwiping, revealWidth, isDismissing]
  );

  const onTouchEnd = useCallback(() => {
    if (isDismissing || directionLocked.current !== 'horizontal') {
      directionLocked.current = null;
      setIsSwiping(false);
      return;
    }

    directionLocked.current = null;
    setIsSwiping(false);

    const netDelta = offsetX - startOffsetX.current;

    if (netDelta < 0 && !isRevealedRef.current) {
      setOffsetX(-revealWidth);
      setIsRevealed(true);
      isRevealedRef.current = true;
      activeCard = { id, close };
    } else if (netDelta > 0 && isRevealedRef.current) {
      close();
    } else {
      setOffsetX(isRevealedRef.current ? -revealWidth : 0);
    }
  }, [offsetX, revealWidth, id, close, isDismissing]);

  useEffect(() => {
    return () => {
      if (activeCard?.id === id) activeCard = null;
    };
  }, [id]);

  useEffect(() => {
    if (!isRevealed) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    const handleScroll = () => close();

    document.addEventListener('click', handleClick, { capture: true });
    document.addEventListener('scroll', handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isRevealed, close]);

  if (!isTouch) {
    return {
      containerRef,
      offsetX: 0,
      isRevealed: false,
      isSwiping: false,
      isDismissing: false,
      isTouch: false,
      handlers: NOOP_HANDLERS,
      close,
      dismiss,
    };
  }

  return {
    containerRef,
    offsetX,
    isRevealed,
    isSwiping,
    isDismissing,
    isTouch: true,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
    close,
    dismiss,
  };
};
