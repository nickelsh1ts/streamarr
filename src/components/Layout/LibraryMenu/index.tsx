import useHash from '@app/hooks/useHash';
import {
  FilmIcon,
  BookmarkIcon,
  NewspaperIcon,
  TvIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SetStateAction } from 'react';

interface MenuLinksProps {
  href: string;
  title: string;
  icon: React.ReactNode;
}

interface LibraryLinksProps {
  href: string;
  title: string;
  type: 'movies' | 'TV shows' | 'music' | 'live TV' | 'photos' | 'other';
  regExp: RegExp;
}

interface LibraryMenuProps {
  isOpen?: boolean;
  setIsOpen?: (value: SetStateAction<boolean>) => void;
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=home&pivot=discover.recommended',
    title: 'Discover',
    icon: <NewspaperIcon className="w-7 h-7" />,
  },
  {
    href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=watchlist&pivot=discover.watchlist',
    title: 'Watch List',
    icon: <BookmarkIcon className="w-7 h-7" />,
  },
];

const LibraryLinks: LibraryLinksProps[] = [
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=1',
    title: 'movies',
    type: 'movies',
    regExp: /(?=(\/(.*)=1&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=10',
    title: 'kids movies',
    type: 'movies',
    regExp: /(?=(\/(.*)=10&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=4',
    title: 'retro: movies',
    type: 'movies',
    regExp: /(?=(\/(.*)=4&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=11',
    title: 'retro: Kids movies',
    type: 'movies',
    regExp: /(?=(\/(.*)=11&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=2',
    title: 'TV shows',
    type: 'TV shows',
    regExp: /(?=(\/(.*)=2&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=8',
    title: 'kids shows',
    type: 'TV shows',
    regExp: /(?=(\/(.*)=8&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=5',
    title: 'retro: TV shows',
    type: 'TV shows',
    regExp: /(?=(\/(.*)=5&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=7',
    title: 'retro: Kids shows',
    type: 'TV shows',
    regExp: /(?=(\/(.*)=7&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=9',
    title: 'music',
    type: 'music',
    regExp: /(?=(\/(.*)=9&pivot))/,
  },
  {
    href: '/watch/web/index.html#!/live-tv',
    title: 'live TV',
    type: 'live TV',
    regExp: /^\/watch\/web\/index\.html#!\/live-tv\/?(.)*?$/,
  },
];

const LibraryMenu = ({ isOpen, setIsOpen }: LibraryMenuProps) => {
  const path = usePathname();
  const hash = useHash();

  const url = path + hash;

  const libraryTypes = [
    'movies',
    'TV shows',
    'music',
    'live TV',
    'photos',
    'other',
  ];

  return (
    <ul className="menu m-0 p-0 space-y-1 mb-1 overflow-auto grid grid-col">
      {MenuLinks.map((item) => {
        const isActive =
          (url.includes(item.href) &&
            !item.href.match(/^\/watch\/web\/index\.html#!\/?$/)) ||
          (url.match(/^\/watch\/web\/index\.html#?!?\/?$/) &&
            item.href.match(/^\/watch\/web\/index\.html#?!?\/?$/));
        return (
          <SingleItem
            liKey={item.title}
            key={item.title}
            onClick={() => setIsOpen && setIsOpen(!isOpen)}
            href={item.href}
            title={item.title}
            icon={item.icon}
            active={isActive}
          />
        );
      })}
      {libraryTypes.map((type) => {
        const Links = LibraryLinks.filter((library) =>
          library.type.includes(type)
        );
        const isActive = Links.map((libraries) => {
          return url.match(libraries.regExp);
        }).filter((library) => library)[0];

        let icon = null;

        switch (type) {
          case 'movies':
            icon = <FilmIcon className="size-7" />;
            break;
          case 'TV shows':
            icon = <TvIcon className="size-7" />;
            break;
          case 'music':
            icon = <MusicalNoteIcon className="size-7" />;
            break;
          case 'live TV':
            icon = <VideoCameraIcon className="size-7" />;
            break;
          case 'photos':
            icon = <PhotoIcon className="size-7" />;
            break;
          default:
            icon = <RectangleGroupIcon className="size-7" />;
            break;
        }

        return Links.length > 1 ? (
          <MultiItem
            onClick={() => setIsOpen && setIsOpen(!isOpen)}
            title={type}
            icon={icon}
            LibraryLinks={Links}
            defaultPivot={'library'}
            liKey={type}
            key={type}
          />
        ) : Links.length === 1 ? (
          <SingleItem
            liKey={Links[0].title}
            key={Links[0].title}
            onClick={() => setIsOpen && setIsOpen(!isOpen)}
            href={Links[0].href}
            title={Links[0].title}
            icon={icon}
            active={isActive}
          />
        ) : null;
      })}
    </ul>
  );
};

interface SingleItemProps {
  liKey: string;
  onClick?: (value: SetStateAction<boolean>) => void;
  href: string;
  title: string;
  icon: React.ReactNode;
  active: unknown;
  className?: string;
  linkclasses?: string;
  isOpen?: boolean;
}

export const SingleItem = ({
  liKey,
  onClick,
  href,
  title,
  icon,
  active,
  className,
  linkclasses,
  isOpen,
}: SingleItemProps) => {
  const isActive = active;
  return (
    <li
      className={`pointer-events-auto ${className ? className : ''}`}
      key={liKey}
    >
      <Link
        onClick={() => onClick && onClick(!isOpen)}
        href={href}
        className={`flex items-center flex-1 focus:!bg-primary/70 active:!bg-primary/20 capitalize gap-0 space-x-2 ${isActive ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'} ${linkclasses ? linkclasses : ''}`}
      >
        {icon}
        <p className="truncate">{title}</p>
      </Link>
    </li>
  );
};

export const MultiItem = ({
  onClick,
  title,
  icon,
  LibraryLinks,
  liKey,
  defaultPivot,
}) => {
  const path = usePathname();
  const hash = useHash();

  const url = path + hash;

  let pivotList = null;

  return (
    <li className="pointer-events-auto" key={liKey}>
      <details
        open={
          LibraryLinks.map((item) => {
            return url.includes(item.href);
          }).filter((item) => item)[0]
        }
        className="group"
      >
        <summary className="active:!bg-primary/20 space-x-2 gap-0 text-zinc-300 hover:text-white group-open:text-white capitalize">
          {icon}
          <p className="inline-flex">{title}</p>
        </summary>
        <ul className="flex flex-col gap-1 mt-1">
          {LibraryLinks.map((item) => {
            const isActive = url.match(item.regExp);

            switch (item.type) {
              case 'movies':
                pivotList = ['library', 'collections', 'categories'];
                break;
              case 'TV shows':
                pivotList = ['library', 'collections', 'categories'];
                break;
              case 'music':
                pivotList = ['library', 'playlists'];
                break;
              default:
                pivotList = null;
                break;
            }

            return (
              <li key={item.title}>
                <Link
                  onClick={onClick}
                  href={
                    item.href && pivotList
                      ? item.href + '&pivot=' + defaultPivot
                      : item.href
                  }
                  className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize space-x-2 ${isActive ? 'text-white bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  <p className="truncate">{item.title}</p>
                </Link>
                {isActive && pivotList && (
                  <ul className="flex flex-col gap-1 mt-1">
                    {pivotList.map((pivot) => {
                      return (
                        <li key={pivot}>
                          <Link
                            onClick={onClick}
                            href={
                              item.href && pivotList
                                ? item.href + '&pivot=' + pivot
                                : item.href
                            }
                            className={`active:!bg-white/15 ${url.includes(item.href + '&pivot=' + pivot) && 'bg-white/10 hover:bg-white/[0.05]'}`}
                          >
                            <p className="capitalize">{pivot}</p>
                            {url.includes(
                              item.href && pivotList
                                ? item.href + '&pivot=' + pivot
                                : item.href
                            ) && (
                              <div className="divider divider-primary m-0 w-7 ms-auto self-center" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
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
