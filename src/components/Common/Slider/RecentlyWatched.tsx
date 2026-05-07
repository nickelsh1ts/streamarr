import { withProperties } from '@app/utils/typeHelpers';
import type { WatchHistoryItem } from '@server/interfaces/api/userInterfaces';
import { FilmIcon, TvIcon } from '@heroicons/react/24/solid';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useInView } from '@app/hooks/useElementInView';
import { useIsTouch } from '@app/hooks/useIsTouch';
import useClickOutside from '@app/hooks/useClickOutside';
import CachedImage from '@app/components/Common/CachedImage';
import Badge from '@app/components/Common/Badge';
import { FormattedMessage } from 'react-intl';

const WatchCardPlaceholder = () => (
  <div className="w-36 sm:w-44 animate-pulse rounded-xl bg-base-200 aspect-[2/3] flex-shrink-0" />
);

const RecentlyWatched = ({ item }: { item?: WatchHistoryItem }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, 0.17);
  const isTouch = useIsTouch();
  const [showDetail, setShowDetail] = useState(false);

  const isEpisode = item?.mediaType === 'episode';
  const thumbUrl =
    item?.thumb && !item?.deletedFromPlex
      ? `/imageproxy/plex?path=${encodeURIComponent(item.thumb)}`
      : null;
  const tmdbPosterUrl = item?.posterPath
    ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
    : null;
  const plexThumbReliable = item?.plexThumbReliable ?? true;
  const candidates = useMemo(
    () =>
      (plexThumbReliable
        ? [thumbUrl, tmdbPosterUrl]
        : [tmdbPosterUrl, thumbUrl]
      ).filter((u): u is string => !!u),
    [thumbUrl, tmdbPosterUrl, plexThumbReliable]
  );
  const [posterIdx, setPosterIdx] = useState(0);
  const posterSrc = candidates[posterIdx] ?? null;

  const handleClickOutside = useCallback(() => {
    if (isTouch) setShowDetail(false);
  }, [isTouch]);

  useClickOutside(ref, handleClickOutside);
  const displayTitle =
    isEpisode && item?.grandparentTitle
      ? item.grandparentTitle
      : (item?.title ?? '');
  const subtitle = isEpisode ? (item?.title ?? null) : null;

  const containerClass =
    'absolute inset-0 rounded-xl overflow-hidden ring-1 ring-white/10';

  const innerCard = (
    <>
      {posterSrc ? (
        <CachedImage
          src={posterSrc}
          alt={displayTitle}
          fill
          sizes="(min-width: 640px) 176px, 144px"
          className="object-cover"
          onError={() => setPosterIdx((i) => i + 1)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-base-300">
          {isEpisode ? (
            <TvIcon className="size-10 text-base-content/20" />
          ) : (
            <FilmIcon className="size-10 text-base-content/20" />
          )}
        </div>
      )}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${showDetail ? 'opacity-100' : 'opacity-0'}`}
      />
      {item?.deletedFromPlex && (
        <div className="absolute top-1 right-1 z-10">
          <Badge badgeType="error">
            <FormattedMessage id="common.deleted" defaultMessage="Deleted" />
          </Badge>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-2 pb-2 pt-8">
        <p
          className="text-xs font-bold leading-tight text-white truncate"
          title={displayTitle}
        >
          {displayTitle}
        </p>
        {subtitle && (
          <p
            className="text-[10px] text-white/60 leading-tight truncate mt-0.5"
            title={subtitle}
          >
            {subtitle}
          </p>
        )}
        {item?.summary && (
          <div
            className={`overflow-hidden transition-[max-height] duration-300 ease-out ${showDetail ? 'max-h-32' : 'max-h-0'}`}
          >
            <p
              className="text-[10px] leading-snug text-white/85 mt-1"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 6,
                overflow: 'hidden',
                whiteSpace: 'normal',
              }}
            >
              {item.summary}
            </p>
          </div>
        )}
        {Number(item?.percentComplete) &&
          item.percentComplete > 0 &&
          item.percentComplete < 85 && (
            <div className="mt-1.5">
              <div className="h-0.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.percentComplete}%` }}
                />
              </div>
            </div>
          )}
      </div>
    </>
  );

  return (
    <div
      ref={ref}
      className={`relative w-36 sm:w-44 aspect-[2/3] flex-shrink-0 transition-transform duration-200 hover:scale-[1.06] hover:z-10 ${showDetail ? 'scale-[1.06] z-10' : ''}`}
      onMouseEnter={() => {
        if (!isTouch) setShowDetail(true);
      }}
      onMouseLeave={() => setShowDetail(false)}
    >
      {!isInView ? (
        <div className="absolute inset-0 rounded-xl bg-base-200 animate-pulse" />
      ) : isTouch ? (
        <div
          className={containerClass}
          onClick={() => {
            if (!showDetail) {
              setShowDetail(true);
            } else if (item?.plexUrl && !item?.deletedFromPlex) {
              window.location.href = item.plexUrl;
            }
          }}
        >
          {innerCard}
        </div>
      ) : item?.plexUrl && !item?.deletedFromPlex ? (
        <a href={item.plexUrl} className={containerClass}>
          {innerCard}
        </a>
      ) : (
        <div className={containerClass}>{innerCard}</div>
      )}
    </div>
  );
};

export default withProperties(RecentlyWatched, {
  Placeholder: WatchCardPlaceholder,
});
