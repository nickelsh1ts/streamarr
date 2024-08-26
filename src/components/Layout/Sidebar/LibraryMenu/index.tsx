'use client';
import useHash from '@app/hooks/useHash';
import {
  FilmIcon,
  BookmarkIcon,
  NewspaperIcon,
  TvIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuLinksProps {
  href: string;
  messagesKey: string;
  icon: React.ReactNode;
}

interface LibraryLinksProps {
  href: string;
  messageKey: string;
  library: 'movie' | 'show' | 'music' | 'livetv' | 'photos' | 'other';
}

const MenuLinks: MenuLinksProps[] = [
  {
    href: '/watch/web/index.html#!',
    messagesKey: 'Home',
    icon: <HomeIcon className="w-7 h-7 inline-flex" />,
  },
  {
    href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=home&pivot=discover.recommended',
    messagesKey: 'Discover',
    icon: <NewspaperIcon className="w-7 h-7 inline-flex" />,
  },
  {
    href: '/watch/web/index.html#!/media/tv.plex.provider.discover?source=watchlist&pivot=discover.watchlist',
    messagesKey: 'Watch List',
    icon: <BookmarkIcon className="w-7 h-7 inline-flex" />,
  },
];

const LibraryLinks: LibraryLinksProps[] = [
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=1&pivot=library',
    messageKey: 'movies',
    library: 'movie',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=10&pivot=library',
    messageKey: 'kids movies',
    library: 'movie',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=4&pivot=library',
    messageKey: 'retro: movies',
    library: 'movie',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=2&pivot=library',
    messageKey: 'tv shows',
    library: 'show',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=8&pivot=library',
    messageKey: 'kids shows:',
    library: 'show',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=5&pivot=library',
    messageKey: 'retro: tv shows',
    library: 'show',
  },
  {
    href: '/watch/web/index.html#!/media/65c8e6766fed4f8450771fbc9a6a9081c6ed698d/com.plexapp.plugins.library?source=9&pivot=library',
    messageKey: 'music',
    library: 'music',
  },
  {
    href: '/watch/web/index.html#!/live-tv',
    messageKey: 'live TV',
    library: 'livetv',
  },
];

const LibraryMenu = () => {
  const path = usePathname();
  const hash = useHash();

  const url = path + hash;

  return (
    <>
      {MenuLinks.map((menuLink) => {
        const isActive =
          (url.includes(menuLink.href) &&
            menuLink.href != '/watch/web/index.html#!') ||
          ((url === '/watch/web/index.html#!' ||
            url === '/watch/web/index.html') &&
            menuLink.href === '/watch/web/index.html#!');
        return (
          <li className="" key={menuLink.href}>
            <Link
              href={menuLink.href}
              className={`text-lg focus:!bg-primary/70 active:!bg-white/20 ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
            >
              {menuLink.icon}
              <p className="truncate">{menuLink.messagesKey}</p>
            </Link>
          </li>
        );
      })}
      {LibraryLinks.filter((library) => library.library.includes('movie'))
        .length > 1 ? (
        <li>
          <details
            open={
              LibraryLinks.filter((library) =>
                library.library.includes('movie')
              )
                .map((libraries) => {
                  return url.includes(libraries.href);
                })
                .filter((library) => library)[0]
            }
            className="group"
          >
            <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
              <FilmIcon className="w-7 h-7" /> Movies
            </summary>
            <ul className="flex flex-col gap-1 mt-1">
              {LibraryLinks.filter((library) =>
                library.library.includes('movie')
              ).map((libraryLink) => {
                const isActive = url.includes(libraryLink.href);
                return (
                  <li key={libraryLink.messageKey}>
                    <Link
                      href={libraryLink.href}
                      className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <p className="truncate">{libraryLink.messageKey}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        </li>
      ) : (
        <>
          {LibraryLinks.filter((library) =>
            library.library.includes('movie')
          ).map((libraryLink) => {
            const isActive = url.includes(libraryLink.href);
            return (
              <li key={libraryLink.messageKey}>
                <Link
                  key={libraryLink.messageKey}
                  href={libraryLink.href}
                  className={`text-lg w-full focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  <FilmIcon className="w-7 h-7" />
                  <p className="truncate">{libraryLink.messageKey}</p>
                </Link>
              </li>
            );
          })}
        </>
      )}
      {LibraryLinks.filter((library) => library.library.includes('show'))
        .length > 1 ? (
        <li>
          <details
            open={
              LibraryLinks.filter((library) => library.library.includes('show'))
                .map((libraries) => {
                  return url.includes(libraries.href);
                })
                .filter((library) => library)[0]
            }
            className="group"
          >
            <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
              <TvIcon className="w-7 h-7" /> TV Shows
            </summary>
            <ul className="flex flex-col gap-1 mt-1">
              {LibraryLinks.filter((library) =>
                library.library.includes('show')
              ).map((libraryLink) => {
                const isActive = url.includes(libraryLink.href);
                return (
                  <li key={libraryLink.messageKey}>
                    <Link
                      href={libraryLink.href}
                      className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <p className="truncate">{libraryLink.messageKey}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        </li>
      ) : (
        <>
          {LibraryLinks.filter((library) =>
            library.library.includes('show')
          ).map((libraryLink) => {
            const isActive = url.includes(libraryLink.href);
            return (
              <li key={libraryLink.messageKey}>
                <Link
                  href={libraryLink.href}
                  className={`text-lg w-full focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  <TvIcon className="w-7 h-7" />
                  <p className="truncate">{libraryLink.messageKey}</p>
                </Link>
              </li>
            );
          })}
        </>
      )}
      {LibraryLinks.filter((library) => library.library.includes('music'))
        .length > 1 ? (
        <li>
          <details
            open={
              LibraryLinks.filter((library) =>
                library.library.includes('music')
              )
                .map((libraries) => {
                  return url.includes(libraries.href);
                })
                .filter((library) => library)[0]
            }
            className="group"
          >
            <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
              <MusicalNoteIcon className="w-7 h-7 inline-flex" /> Music (beta)
            </summary>
            <ul className="flex flex-col gap-1 mt-1">
              {LibraryLinks.filter((library) =>
                library.library.includes('music')
              ).map((libraryLink) => {
                const isActive = url.includes(libraryLink.href);
                return (
                  <li key={libraryLink.messageKey}>
                    <Link
                      href={libraryLink.href}
                      className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <p className="truncate">{libraryLink.messageKey}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        </li>
      ) : (
        <>
          {LibraryLinks.filter((library) =>
            library.library.includes('music')
          ).map((libraryLink) => {
            const isActive = url.includes(libraryLink.href);
            return (
              <li key={libraryLink.messageKey}>
                <Link
                  href={libraryLink.href}
                  className={`text-lg w-full focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  <MusicalNoteIcon className="w-7 h-7 inline-flex" />
                  <p className="truncate">{libraryLink.messageKey}</p>
                </Link>
              </li>
            );
          })}
        </>
      )}

      {LibraryLinks.filter((library) => library.library.includes('livetv'))
        .length > 1 ? (
        <li>
          <details
            open={
              LibraryLinks.filter((library) =>
                library.library.includes('livetv')
              )
                .map((libraries) => {
                  return url.includes(libraries.href);
                })
                .filter((library) => library)[0]
            }
            className="group"
          >
            <summary className="text-lg active:!bg-primary/20 text-zinc-300 hover:text-white group-open:text-white">
              <VideoCameraIcon className="w-7 h-7 inline-flex" /> Live TV
            </summary>
            <ul className="flex flex-col gap-1 mt-1">
              {LibraryLinks.filter((library) =>
                library.library.includes('livetv')
              ).map((libraryLink) => {
                const isActive = url.includes(libraryLink.href);
                return (
                  <li key={libraryLink.messageKey}>
                    <Link
                      href={libraryLink.href}
                      className={`focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                    >
                      <p className="truncate">{libraryLink.messageKey}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        </li>
      ) : (
        <>
          {LibraryLinks.filter((library) =>
            library.library.includes('livetv')
          ).map((libraryLink) => {
            const isActive = url.includes(libraryLink.href);
            return (
              <li key={libraryLink.messageKey}>
                <Link
                  href={libraryLink.href}
                  className={`text-lg w-full focus:!bg-primary/70 active:!bg-primary/20 capitalize ${isActive ? 'text-white pointer-events-none bg-primary/70 hover:bg-primary/30 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  <VideoCameraIcon className="w-7 h-7 inline-flex" />
                  <p className="truncate">{libraryLink.messageKey}</p>
                </Link>
              </li>
            );
          })}
        </>
      )}
      <li className="leading-none my-4">
        <a className="block active:!bg-primary/20 max-lg:pe-16" href="/request">
          <img
            className="h-auto w-auto"
            src="/external/os-logo_full.svg"
            alt="overseerr"
            title="Make a request"
          />
          <p className="ms-auto -mt-3 w-fit">
            <small className="">Request &amp; Report</small>
          </p>
        </a>
      </li>
    </>
  );
};

export default LibraryMenu;
