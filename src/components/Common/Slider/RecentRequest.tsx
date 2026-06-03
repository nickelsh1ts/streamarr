import Badge from '@app/components/Common/Badge';
import CachedImage from '@app/components/Common/CachedImage';
import { withProperties } from '@app/utils/typeHelpers';
import { MediaRequestStatus, MediaStatus } from '@server/constants/seerr';
import { FilmIcon, TvIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import useSWR from 'swr';
import { useInView } from '@app/hooks/useElementInView';
import type { SeerrRequestItem } from '@server/interfaces/api/seerrInterfaces';
import { usePathname } from 'next/navigation';

const getStatusBadge = (
  requestStatus: number,
  mediaStatus: number,
  manageHref: string
) => {
  if (requestStatus === MediaRequestStatus.DECLINED) {
    return (
      <Badge badgeType="error">
        <FormattedMessage id="common.declined" defaultMessage="Declined" />
      </Badge>
    );
  }
  if (requestStatus === MediaRequestStatus.FAILED) {
    return (
      <Badge badgeType="error">
        <FormattedMessage id="common.failed" defaultMessage="Failed" />
      </Badge>
    );
  }
  switch (mediaStatus) {
    case MediaStatus.AVAILABLE:
      return (
        <Badge badgeType="success" href={manageHref}>
          <FormattedMessage id="common.available" defaultMessage="Available" />
        </Badge>
      );
    case MediaStatus.PARTIALLY_AVAILABLE:
      return (
        <Badge badgeType="success" href={manageHref}>
          <FormattedMessage
            id="common.partiallyAvailable"
            defaultMessage="Partially Available"
          />
        </Badge>
      );
    case MediaStatus.PROCESSING:
      return (
        <Badge badgeType="primary" href={manageHref}>
          <FormattedMessage id="common.requested" defaultMessage="Requested" />
        </Badge>
      );
    case MediaStatus.PENDING:
      return (
        <Badge badgeType="warning" href={manageHref}>
          <FormattedMessage id="common.pending" defaultMessage="Pending" />
        </Badge>
      );
    case MediaStatus.DELETED:
      return (
        <Badge badgeType="error">
          <FormattedMessage id="common.deleted" defaultMessage="Deleted" />
        </Badge>
      );
    case MediaStatus.BLOCKLISTED:
      return (
        <Badge badgeType="error">
          <FormattedMessage
            id="common.blocklisted"
            defaultMessage="Blocklisted"
          />
        </Badge>
      );
    default:
      return (
        <Badge badgeType="default">
          <FormattedMessage id="common.unknown" defaultMessage="Unknown" />
        </Badge>
      );
  }
};

const RequestCardPlaceholder = () => {
  return (
    <div className="relative w-72 animate-pulse rounded-xl bg-base-200 p-4 sm:w-96">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }} />
      </div>
    </div>
  );
};

const RequestCardError = ({
  requestData,
}: {
  requestData?: SeerrRequestItem;
}) => {
  const pathname = usePathname();

  return (
    <div className="relative flex w-72 overflow-hidden rounded-xl bg-base-300 p-4 text-gray-400 shadow ring-1 ring-red-500 sm:w-96">
      <div className="w-20 sm:w-28">
        <div className="w-full" style={{ paddingBottom: '150%' }}>
          <div className="absolute inset-0 z-10 flex min-w-0 flex-1 flex-col p-4 gap-1">
            <div className="overflow-hidden text-ellipsis whitespace-normal text-base font-bold text-white sm:text-lg">
              <FormattedMessage
                id="userProfile.mediaError"
                defaultMessage="{mediaType, select, movie {Movie} tv {TV show} other {Media}} not found"
                values={{ mediaType: requestData?.type ?? 'media' }}
              />
            </div>
            {requestData && (
              <>
                <div>
                  <Link
                    href={
                      pathname.includes('profile')
                        ? `/request/profile`
                        : `/request/users/${requestData.requestedBy.id}`
                    }
                    className="group flex items-center"
                  >
                    {requestData.requestedBy.id && (
                      <span className="mr-2 rounded-full">
                        <CachedImage
                          src={`/avatarproxy/${requestData.requestedBy.id}`}
                          alt=""
                          className="rounded-full object-cover"
                          width={20}
                          height={20}
                        />
                      </span>
                    )}
                    <span className="truncate group-hover:underline">
                      {requestData.requestedBy.displayName}
                    </span>
                  </Link>
                </div>
                <div className="mt-2 flex items-center text-sm sm:mt-1">
                  <span className="mr-2 hidden font-bold sm:block">
                    <FormattedMessage
                      id="common.status"
                      defaultMessage="Status"
                    />
                  </span>
                  {getStatusBadge(
                    requestData.requestStatus,
                    requestData.mediaStatus,
                    `/request/${requestData.type}/${requestData.media.tmdbId}?manage=1`
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestCard = ({ request }: { request: SeerrRequestItem }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, 0.17);
  const pathname = usePathname();
  const url =
    request.type === 'movie'
      ? `/api/v1/movie/${request.media.tmdbId}`
      : `/api/v1/tv/${request.media.tmdbId}`;

  const { data: title, error } = useSWR(isInView ? url : null, {
    shouldRetryOnError: false,
  });
  const { data: requestData } = useSWR<SeerrRequestItem>(
    isInView ? `/api/v1/request/${request.id}` : null,
    {
      fallbackData: request,
      refreshInterval: 15000,
    }
  );

  if (!title && !error) {
    return (
      <div ref={ref}>
        <RequestCardPlaceholder />
      </div>
    );
  }

  if (!title) {
    return (
      <div ref={ref}>
        <RequestCardError requestData={requestData} />
      </div>
    );
  }

  return (
    <div className="relative flex w-72 overflow-hidden rounded-xl bg-base-300 bg-cover bg-center p-4 shadow ring-1 ring-primary sm:w-96">
      {title.backdropPath && (
        <div className="absolute inset-0 z-0">
          <CachedImage
            alt=""
            src={`https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${title.backdropPath}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            fill
          />
          <div className="absolute inset-0 bg-linear-to-l from-secondary to-secondary/75" />
        </div>
      )}
      <div className="relative z-10 flex min-w-0 flex-1 gap-1 flex-col pr-4">
        <div className="hidden text-xs font-medium sm:flex">
          {(title.releaseDate || title.firstAirDate)?.slice(0, 4)}
        </div>
        <Link
          href={
            request.type === 'movie'
              ? `/request/movie/${requestData.media.tmdbId}`
              : `/request/tv/${requestData.media.tmdbId}`
          }
          className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold hover:underline sm:text-lg"
        >
          {title.title || title.name}
        </Link>
        <div>
          <Link
            href={
              pathname.includes('profile')
                ? `/request/profile`
                : `/request/users/${requestData.requestedBy.id}`
            }
            className="group flex items-center gap-2"
          >
            {requestData.requestedBy.id && (
              <span className="rounded-full">
                <CachedImage
                  src={`/avatarproxy/${requestData.requestedBy.id}`}
                  alt=""
                  className="rounded-full object-cover"
                  width={20}
                  height={20}
                />
              </span>
            )}
            <span className="truncate font-semibold group-hover:text-white group-hover:underline">
              {requestData.requestedBy.displayName}
            </span>
          </Link>
        </div>
        {request.seasons.length > 0 && (
          <div className="my-0.5 hidden items-center text-sm sm:my-1 sm:flex">
            <span className="mr-2 font-bold">
              <FormattedMessage
                id="userProfile.seasons"
                defaultMessage="{seasonCount, plural, one {Season} other {Seasons}}"
                values={{ seasonCount: request.seasons.length }}
              />
            </span>
            <div className="flex flex-wrap gap-y-1">
              {request.seasons.map((season) => (
                <span key={`season-${season.id}`} className="mr-2">
                  <Badge>
                    {season.seasonNumber === 0 ? (
                      <FormattedMessage
                        id="season.specials"
                        defaultMessage="Specials"
                      />
                    ) : (
                      season.seasonNumber
                    )}
                  </Badge>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 flex items-center text-sm sm:mt-1">
          <span className="mr-2 hidden font-bold sm:block">
            <FormattedMessage id="userProfile.status" defaultMessage="Status" />
          </span>
          {getStatusBadge(
            requestData.requestStatus,
            requestData.mediaStatus,
            `/request/${requestData.type}/${requestData.media.tmdbId}?manage=1`
          )}
        </div>
      </div>
      <Link
        href={
          request.type === 'movie'
            ? `/request/movie/${requestData.media.tmdbId}`
            : `/request/tv/${requestData.media.tmdbId}`
        }
        className="w-20 shrink-0 scale-100 transform-gpu cursor-pointer overflow-hidden rounded-md shadow-sm transition duration-300 hover:scale-105 hover:shadow-md sm:w-28"
      >
        {title.posterPath ? (
          <CachedImage
            src={`https://image.tmdb.org/t/p/w600_and_h900_bestv2${title.posterPath}`}
            alt=""
            sizes="100vw"
            style={{ width: '100%', height: 'auto' }}
            width={600}
            height={900}
          />
        ) : (
          <div className="flex aspect-2/3 w-full items-center justify-center bg-base-300">
            {request.type === 'tv' ? (
              <TvIcon className="size-10 text-base-content/20" />
            ) : (
              <FilmIcon className="size-10 text-base-content/20" />
            )}
          </div>
        )}
      </Link>
    </div>
  );
};

export default withProperties(RequestCard, {
  Placeholder: RequestCardPlaceholder,
  Error: RequestCardError,
});
