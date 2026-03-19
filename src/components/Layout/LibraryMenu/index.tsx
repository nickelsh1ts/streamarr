import { Permission, useUser } from '@app/hooks/useUser';
import useLibraryLinks from '@app/hooks/useLibraryLinks';
import {
  FilmIcon,
  BookmarkIcon,
  NewspaperIcon,
  TvIcon,
  RectangleGroupIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, type SetStateAction } from 'react';
import useHash from '@app/hooks/useHash';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import type { UserSettingsGeneralResponse } from '@server/interfaces/api/userSettingsInterfaces';

const PIVOT_STORAGE_KEY = 'library-pivot-settings';
const VALID_PIVOTS = new Set(['library', 'collections', 'categories']);

const getSavedPivot = (): string | null => {
  try {
    const saved = window.localStorage.getItem(PIVOT_STORAGE_KEY);
    return saved && VALID_PIVOTS.has(saved) ? saved : null;
  } catch {
    return null;
  }
};

const savePivot = (pivot: string): void => {
  if (!VALID_PIVOTS.has(pivot)) return;
  try {
    window.localStorage.setItem(PIVOT_STORAGE_KEY, pivot);
  } catch {
    // localStorage unavailable
  }
};

interface MenuLinksProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  regExp: string;
  hidden?: boolean;
}

interface LibraryLinksProps {
  href: string;
  title: string;
  type: 'movie' | 'show' | 'artist' | 'live TV' | 'photos' | 'other';
  regExp: string;
  hasPlaylists: boolean;
}

interface LibraryMenuProps {
  isOpen?: boolean;
  setIsOpen?: (value: SetStateAction<boolean>) => void;
  isMobile?: boolean;
}

const LibraryMenu = ({
  isOpen,
  setIsOpen,
  isMobile = false,
}: LibraryMenuProps) => {
  const intl = useIntl();
  const pathname = usePathname();
  const hash = useHash();
  const url = pathname + (hash || '');
  const { hasPermission, user } = useUser();
  const { libraryLinks, machineId, enablePlaylists, defaultPivot, loading } =
    useLibraryLinks('id');
  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );

  const effectivePivot = getSavedPivot() ?? defaultPivot ?? 'library';
  const handlePivotClick = useCallback((pivot: string) => {
    savePivot(pivot);
  }, []);

  // Group libraries by type
  const groupedLibraries = libraryLinks.reduce(
    (acc, lib) => {
      if (!acc[lib.type]) {
        acc[lib.type] = [];
      }

      acc[lib.type].push({
        href: lib.href,
        title: lib.name,
        type: lib.type,
        regExp: lib.regExp,
        hasPlaylists: lib.hasPlaylists,
      });
      return acc;
    },
    {} as Record<string, LibraryLinksProps[]>
  );

  const libraryTypes: (
    | 'movie'
    | 'show'
    | 'artist'
    | 'live TV'
    | 'photos'
    | 'other'
  )[] = ['movie', 'show', 'artist', 'live TV', 'photos', 'other'];

  const MenuLinks: MenuLinksProps[] = [
    {
      href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=home&pivot=discover.recommended',
      title: intl.formatMessage({
        id: 'library.discover',
        defaultMessage: 'Discover',
      }),
      icon: <NewspaperIcon className="w-7 h-7" />,
      regExp: '=home&pivot=discover',
      hidden:
        isMobile &&
        !hasPermission(
          [
            Permission.CREATE_INVITES,
            Permission.MANAGE_INVITES,
            Permission.VIEW_INVITES,
            Permission.STREAMARR,
          ],
          { type: 'or' }
        ),
    },
    {
      href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=watchlist&pivot=discover.watchlist',
      title: intl.formatMessage({
        id: 'library.watchlist',
        defaultMessage: 'Watch List',
      }),
      icon: <BookmarkIcon className="w-7 h-7" />,
      regExp: '=watchlist&pivot=discover',
      hidden:
        (isMobile && !userSettings?.releaseSched) ||
        !hasPermission(
          [
            Permission.VIEW_SCHEDULE,
            Permission.CREATE_EVENTS,
            Permission.STREAMARR,
          ],
          { type: 'or' }
        ),
    },
    {
      href: machineId
        ? `/watch/web/index.html#!/media/${machineId}/com.plexapp.plugins.library?source=playlists`
        : '#',
      title: intl.formatMessage({
        id: 'library.playlists',
        defaultMessage: 'Playlists',
      }),
      icon: <QueueListIcon className="w-7 h-7" />,
      regExp: 'source=playlists',
      hidden: !enablePlaylists,
    },
  ];

  return (
    <ul
      className="menu m-0 p-0 space-y-1 mb-1 grid grid-col overflow-auto"
      data-tutorial="library-menu"
    >
      {MenuLinks.filter((item) => !item.hidden).map((item) => (
        <SingleItem
          liKey={item.title}
          key={item.title}
          onClick={() => setIsOpen && setIsOpen(!isOpen)}
          href={item.href}
          title={item.title}
          icon={item.icon}
          url={url}
          regExp={item.regExp}
        />
      ))}
      {loading ? (
        <SingleItem
          liKey="loading"
          key="loading"
          onClick={() => setIsOpen && setIsOpen(!isOpen)}
          href="#"
          title={intl.formatMessage({
            id: 'library.loading',
            defaultMessage: 'Loading libraries...',
          })}
          icon={<RectangleGroupIcon className="size-7" />}
          url={url}
          regExp="undefined"
        />
      ) : (
        libraryTypes.map((type) => {
          const Links = groupedLibraries[type] || [];
          let icon = null;
          let multiTitle = null;
          switch (type) {
            case 'movie':
              icon = <FilmIcon className="size-7" />;
              multiTitle = (
                <FormattedMessage id="common.movies" defaultMessage="Movies" />
              );
              break;
            case 'show':
              icon = <TvIcon className="size-7" />;
              multiTitle = (
                <FormattedMessage id="common.shows" defaultMessage="Shows" />
              );
              break;
            case 'artist':
              icon = <MusicalNoteIcon className="size-7" />;
              multiTitle = (
                <FormattedMessage id="common.music" defaultMessage="Music" />
              );
              break;
            case 'live TV':
              icon = <VideoCameraIcon className="size-7" />;
              multiTitle = (
                <FormattedMessage
                  id="library.liveTV"
                  defaultMessage="Live TV"
                />
              );
              break;
            case 'photos':
              icon = <PhotoIcon className="size-7" />;
              multiTitle = (
                <FormattedMessage id="library.photos" defaultMessage="Photos" />
              );
              break;
            default:
              icon = <RectangleGroupIcon className="size-7" />;
              break;
          }
          return Links.length > 1 ? (
            <MultiItem
              onClick={() => setIsOpen && setIsOpen(!isOpen)}
              title={multiTitle ?? type}
              icon={icon}
              LibraryLinks={Links}
              defaultPivot={effectivePivot}
              enablePlaylists={enablePlaylists}
              onPivotClick={handlePivotClick}
              liKey={type}
              key={type}
              url={url}
            />
          ) : Links.length === 1 ? (
            <SingleItem
              liKey={Links[0].title}
              key={Links[0].title}
              onClick={() => setIsOpen && setIsOpen(!isOpen)}
              href={Links[0].href}
              title={Links[0].title}
              icon={icon}
              url={url}
              regExp={Links[0].regExp}
              type={Links[0].type}
              defaultPivot={effectivePivot}
              enablePlaylists={enablePlaylists}
              hasPlaylists={Links[0].hasPlaylists}
              onPivotClick={handlePivotClick}
            />
          ) : null;
        })
      )}
    </ul>
  );
};

interface SingleItemProps {
  liKey: string;
  onClick?: () => void;
  href: string;
  title: string;
  icon: React.ReactNode;
  className?: string;
  linkclasses?: string;
  url: string;
  regExp: string | RegExp;
  type?: 'movie' | 'show' | 'artist' | 'live TV' | 'photos' | 'other';
  defaultPivot?: string;
  enablePlaylists?: boolean;
  hasPlaylists?: boolean;
  onPivotClick?: (pivot: string) => void;
  'data-tutorial'?: string;
  'data-testid'?: string;
}

const matchesLibrarySource = (url: string, sourceId: string): boolean => {
  const pattern = new RegExp(`[?&]source=${sourceId}(?=[&#]|$)`);
  return pattern.test(url);
};

export const SingleItem = ({
  liKey,
  onClick,
  href,
  title,
  icon,
  className,
  linkclasses,
  url,
  regExp,
  type,
  defaultPivot = 'library',
  enablePlaylists = false,
  hasPlaylists = false,
  onPivotClick,
  'data-tutorial': dataTutorial,
  'data-testid': dataTestId,
}: SingleItemProps) => {
  const isActive =
    typeof regExp === 'string'
      ? regExp.includes('source=')
        ? matchesLibrarySource(
            url,
            regExp.replace('source=', '').replace('&', '')
          )
        : url.includes(regExp)
      : regExp.test(url);

  // Determine pivot list based on type
  const pivotList: string[] | null = (() => {
    if (!type) return null;
    switch (type) {
      case 'movie':
      case 'show': {
        const pivots = ['library', 'collections', 'categories'];
        if (enablePlaylists && hasPlaylists) pivots.push('playlists');
        return pivots;
      }
      case 'artist':
        return ['library', 'playlists'];
      default:
        return null;
    }
  })();

  return (
    <li
      className={`pointer-events-auto ${className ? className : ''}`}
      key={liKey}
      data-tutorial={dataTutorial}
      data-testid={dataTestId}
    >
      <Link
        onClick={onClick}
        href={
          href && pivotList && type ? href + '&pivot=' + defaultPivot : href
        }
        className={`w-full items-center focus:!bg-primary/70 active:!bg-primary/20 focus:text-primary-content capitalize gap-0 space-x-2 ${isActive ? 'text-primary-content bg-primary/70 hover:bg-primary/30 hover:text-primary-content/70' : 'text-base-content hover:text-base-content/70'} ${linkclasses ? linkclasses : ''}`}
      >
        {icon}
        <p className="truncate">{title}</p>
      </Link>
      {isActive && pivotList && (
        <ul className="flex flex-col gap-1 mt-1">
          {pivotList.map((pivot) => (
            <li key={pivot}>
              <Link
                onClick={() => {
                  onPivotClick?.(pivot);
                  onClick?.();
                }}
                href={href && pivotList ? href + '&pivot=' + pivot : href}
                className={`active:!bg-white/15 ${isActive && url.includes(`&pivot=${pivot}`) ? 'bg-white/10 hover:bg-white/[0.05]' : ''}`}
              >
                <p className="capitalize">{pivot}</p>
                {isActive && url.includes(`&pivot=${pivot}`) && (
                  <div className="divider divider-primary m-0 w-7 ms-auto self-center" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

interface MultiItemProps {
  onClick?: () => void;
  title: string;
  icon: React.ReactNode;
  LibraryLinks: LibraryLinksProps[];
  liKey: string;
  defaultPivot: string;
  enablePlaylists?: boolean;
  onPivotClick?: (pivot: string) => void;
  url: string;
}

export const MultiItem = ({
  onClick,
  title,
  icon,
  LibraryLinks,
  liKey,
  defaultPivot,
  enablePlaylists = false,
  onPivotClick,
  url,
}: MultiItemProps) => {
  const getPivotList = (
    type: string,
    hasPlaylists: boolean
  ): string[] | null => {
    switch (type) {
      case 'movie':
      case 'show': {
        const pivots = ['library', 'collections', 'categories'];
        if (enablePlaylists && hasPlaylists) pivots.push('playlists');
        return pivots;
      }
      case 'artist':
        return ['library', 'playlists'];
      default:
        return null;
    }
  };

  return (
    <li className="pointer-events-auto" key={liKey}>
      <details
        open={LibraryLinks.some((item) =>
          item.regExp.includes('source=')
            ? matchesLibrarySource(
                url,
                item.regExp.replace('source=', '').replace(/&/g, '')
              )
            : url.includes(item.regExp)
        )}
        className="group"
      >
        <summary className="active:!bg-primary/20 space-x-2 gap-0 hover:text-base-content group-open:text-base-content capitalize">
          {icon}
          <p className="inline-flex">{title}</p>
        </summary>
        <ul className="flex flex-col gap-1 mt-1">
          {LibraryLinks.map((item) => {
            const isActive = item.regExp.includes('source=')
              ? matchesLibrarySource(
                  url,
                  item.regExp.replace('source=', '').replace(/&/g, '')
                )
              : url.includes(item.regExp);

            const pivotList = getPivotList(item.type, item.hasPlaylists);
            return (
              <li key={item.title}>
                <Link
                  onClick={onClick}
                  href={
                    item.href && pivotList
                      ? item.href + '&pivot=' + defaultPivot
                      : item.href
                  }
                  className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize space-x-2 w-full ${isActive ? 'text-base-content bg-primary/70 hover:bg-primary/30 hover:text-primary-content/70' : 'text-base-content hover:text-base-content'}`}
                >
                  <p className="truncate">{item.title}</p>
                </Link>
                {isActive && pivotList && (
                  <ul className="flex flex-col gap-1 mt-1">
                    {pivotList.map((pivot) => (
                      <li key={pivot}>
                        <Link
                          onClick={() => {
                            onPivotClick?.(pivot);
                            onClick?.();
                          }}
                          href={
                            item.href && pivotList
                              ? item.href + '&pivot=' + pivot
                              : item.href
                          }
                          className={`active:!bg-white/15 ${isActive && url.includes(`&pivot=${pivot}`) ? 'bg-white/10 hover:bg-white/[0.05]' : ''}`}
                        >
                          <p className="capitalize">{pivot}</p>
                          {isActive && url.includes(`&pivot=${pivot}`) && (
                            <div className="divider divider-primary m-0 w-7 ms-auto self-center" />
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
};

export default LibraryMenu;
