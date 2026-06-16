import type Newsletter from '@server/entity/Newsletter';
import { getIntl } from '@server/i18n';
import type { IntlShape } from '@server/i18n';
import { sanitizeHtml } from '@server/lib/sanitize';
import { getSettings } from '@server/lib/settings';
import { marked } from 'marked';
import type {
  NewsletterBlockData,
  NewsletterMediaItem,
  NewsletterMediaType,
  NewsletterRecentlyAddedSection,
} from './dataProviders';
import { resolveBlockData } from './dataProviders';
import moment from '@server/utils/momentWithLocale';

marked.use({ gfm: true, breaks: true });

export interface RenderedNewsletter {
  subject: string;
  /** Shared HTML that may still contain per-recipient tokens. */
  html: string;
}

const BLOCK_TOKENS = ['recentlyAdded', 'topStreams', 'byTag'] as const;
const BLOCK_TOKEN_PATTERN = /{{\s*(recentlyAdded|topStreams|byTag)\s*}}/g;
const RECIPIENT_TOKEN_PATTERN = /{{\s*(recipientName|recipientEmail)\s*}}/g;
const POSTER_WIDTH = 120;
const POSTER_HEIGHT = 180;
const GRID_COLUMNS = 3;

const localizedHeading = (
  intl: IntlShape,
  block: 'recentlyAdded' | 'topStreams',
  type: NewsletterMediaType
): string => {
  if (block === 'recentlyAdded') {
    switch (type) {
      case 'movie':
        return intl.formatMessage({
          id: 'newsletter.recentlyAdded.movie',
          defaultMessage: 'Recently Added Movies',
        });
      case 'show':
        return intl.formatMessage({
          id: 'newsletter.recentlyAdded.show',
          defaultMessage: 'Recently Added TV Shows',
        });
      case 'artist':
        return intl.formatMessage({
          id: 'newsletter.recentlyAdded.artist',
          defaultMessage: 'Recently Added Music',
        });
      case 'photo':
        return intl.formatMessage({
          id: 'newsletter.recentlyAdded.photo',
          defaultMessage: 'Recently Added Photos',
        });
      default:
        return intl.formatMessage({
          id: 'newsletter.recentlyAdded.other',
          defaultMessage: 'Recently Added',
        });
    }
  }

  switch (type) {
    case 'movie':
      return intl.formatMessage({
        id: 'newsletter.topStreams.movie',
        defaultMessage: 'Top Movies',
      });
    case 'show':
      return intl.formatMessage({
        id: 'newsletter.topStreams.show',
        defaultMessage: 'Top TV Shows',
      });
    case 'artist':
      return intl.formatMessage({
        id: 'newsletter.topStreams.artist',
        defaultMessage: 'Top Music',
      });
    default:
      return intl.formatMessage({
        id: 'newsletter.topStreams.other',
        defaultMessage: 'Top Streams',
      });
  }
};

/**
 * Localized strings for the email chrome (pug template). Translated per
 * recipient using their locale and passed in as template locals so the
 * template carries no hardcoded copy.
 */
export const getNewsletterEmailStrings = (
  intl: IntlShape,
  applicationTitle: string
): {
  openLabel: string;
  subscriptionNotice: string;
  subscriptionNoticeImportant: string;
  manageSubscriptions: string;
} => ({
  openLabel: intl.formatMessage(
    { id: 'newsletter.email.open', defaultMessage: 'Open {applicationTitle}' },
    { applicationTitle }
  ),
  subscriptionNotice: intl.formatMessage(
    {
      id: 'newsletter.email.subscriptionNotice',
      defaultMessage:
        'You are receiving this email because you are subscribed to {applicationTitle} newsletters.',
    },
    { applicationTitle }
  ),
  subscriptionNoticeImportant: intl.formatMessage(
    {
      id: 'newsletter.email.subscriptionNoticeImportant',
      defaultMessage:
        'You are receiving this email because it was deemed important by {applicationTitle} admin.',
    },
    { applicationTitle }
  ),
  manageSubscriptions: intl.formatMessage({
    id: 'newsletter.email.manageSubscriptions',
    defaultMessage: 'Manage subscriptions',
  }),
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildPosterHtml = (
  item: NewsletterMediaItem,
  resourceBase: string
): string => {
  // Real TMDB poster, routed through the app's (public, cached) image proxy so
  // we never hit TMDB directly. `resourceBase` is the application URL for
  // delivered email and empty for the in-app preview (relative, same-host).
  if (item.posterPath) {
    return `<img src="${resourceBase}/imageproxy/t/p/w300${item.posterPath}" alt="${escapeHtml(
      item.title
    )}" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" style="display: block; margin: 0 auto; border-radius: 6px; width: ${POSTER_WIDTH}px; height: ${POSTER_HEIGHT}px; object-fit: cover;" />`;
  }

  // No TMDB poster (e.g. music): hosted placeholder with a centered media icon.
  return `<img src="${resourceBase}/img/newsletter/poster-placeholder-${item.mediaType}.png" alt="${escapeHtml(
    item.title
  )}" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" style="display: block; margin: 0 auto; border-radius: 6px; width: ${POSTER_WIDTH}px; height: ${POSTER_HEIGHT}px;" />`;
};

const buildMediaCellHtml = (
  item: NewsletterMediaItem,
  resourceBase: string,
  watchBaseUrl?: string
): string => {
  const poster = buildPosterHtml(item, resourceBase);
  const year = item.year ? ` (${item.year})` : '';
  const subtitle = item.subtitle
    ? `<div style="font-size: 0.8em; color: #aaa;">${escapeHtml(
        item.subtitle
      )}</div>`
    : '';
  const titleHtml = `<div style="margin-top: 0.35rem; font-size: 0.9em; font-weight: 500;">${escapeHtml(
    item.title
  )}${year}</div>`;

  // Deep-link the poster and title into the app's /watch player when we have a
  // Plex ratingKey and the link target is configured.
  const href =
    watchBaseUrl && item.ratingKey
      ? `${watchBaseUrl}${item.ratingKey}`
      : undefined;
  const content = href
    ? `<a href="${escapeHtml(
        href
      )}" style="color: inherit; text-decoration: none;">${poster}${titleHtml}</a>`
    : `${poster}${titleHtml}`;

  return `<td style="padding: 0.5rem; vertical-align: top; text-align: center; width: ${Math.floor(
    100 / GRID_COLUMNS
  )}%;">${content}${subtitle}</td>`;
};

const buildMediaGridHtml = (
  heading: string,
  items: NewsletterMediaItem[],
  resourceBase: string,
  watchBaseUrl?: string
): string => {
  if (!items.length) {
    return '';
  }

  const rows: string[] = [];

  for (let index = 0; index < items.length; index += GRID_COLUMNS) {
    const cells = items
      .slice(index, index + GRID_COLUMNS)
      .map((item) => buildMediaCellHtml(item, resourceBase, watchBaseUrl))
      .join('');
    rows.push(`<tr>${cells}</tr>`);
  }

  const headingHtml = heading
    ? `<h2 style="margin: 1.5rem 0 0.5rem; font-size: 1.1em; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 0.35rem;">${escapeHtml(
        heading
      )}</h2>`
    : '';

  return `${headingHtml}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">${rows.join(
    ''
  )}</table>`;
};

const injectGlobalTokens = (
  content: string,
  { escape = true, locale }: { escape?: boolean; locale?: string } = {}
): string => {
  const { applicationTitle, applicationUrl } = getSettings().main;
  const date = moment()
    .locale(locale ?? getSettings().main.locale)
    .format('LL');
  const maybeEscape = (value: string) => (escape ? escapeHtml(value) : value);

  return content
    .replace(/{{\s*applicationTitle\s*}}/g, maybeEscape(applicationTitle))
    .replace(/{{\s*applicationUrl\s*}}/g, maybeEscape(applicationUrl ?? ''))
    .replace(/{{\s*date\s*}}/g, maybeEscape(date));
};

/**
 * Renders the shared portion of a newsletter once: body markup is converted
 * (markdown) and sanitized, data blocks are resolved and injected, and global
 * tokens are substituted. Per-recipient tokens are left in place for
 * renderForRecipient.
 */
export const renderNewsletter = async (
  newsletter: Newsletter,
  options: {
    baseUrl?: string;
    intl?: IntlShape;
    blockData?: NewsletterBlockData;
  } = {}
): Promise<RenderedNewsletter> => {
  const { baseUrl, blockData: providedBlockData } = options;
  const intl = options.intl ?? getIntl(getSettings().main.locale);
  const settings = getSettings();
  const { applicationUrl } = settings.main;
  // Prefix for app-hosted resources (poster proxy, placeholder images, watch
  // deep links). Defaults to the application URL (absolute, for delivered
  // email); the preview passes '' so they render relative to the current host.
  const resourceBase = baseUrl ?? applicationUrl ?? '';
  const machineId = settings.plex.machineId;
  // Base for deep links into the app's Plex web player; the item's ratingKey is
  // appended per cell. Emitted only when the Plex machine identifier is known.
  const watchBaseUrl = machineId
    ? `${resourceBase}/watch/web/index.html#!/server/${machineId}/details?key=/library/metadata/`
    : undefined;

  const blockData =
    providedBlockData ?? (await resolveBlockData(newsletter.blocks));

  let body = newsletter.body ?? '';

  if (newsletter.bodyFormat === 'markdown') {
    body = marked.parse(body, { async: false }) as string;
  }

  body = sanitizeHtml(body);

  // A block token placed on its own line becomes a paragraph (e.g.
  // `<p>{{recentlyAdded}}</p>`) after markdown conversion. Unwrap those so the
  // grid <table> injected below is not nested inside a <p> (invalid markup).
  body = body.replace(
    /<p>\s*({{\s*(?:recentlyAdded|topStreams|byTag)\s*}})\s*<\/p>/g,
    '$1'
  );

  const sectionHeading = (
    block: 'recentlyAdded' | 'topStreams',
    type: NewsletterMediaType
  ): string => {
    const configured = newsletter.blocks?.[block]?.[type]?.header?.trim();
    return configured || localizedHeading(intl, block, type);
  };

  // Recently added and top streams both render one grid per library-type
  // section, each with an admin-configurable (else localized) heading.
  const renderSections = (
    block: 'recentlyAdded' | 'topStreams',
    sections: NewsletterRecentlyAddedSection[]
  ): string =>
    sections
      .map((section) =>
        buildMediaGridHtml(
          sectionHeading(block, section.type),
          section.items,
          resourceBase,
          watchBaseUrl
        )
      )
      .join('');

  const blockHtml: Record<string, string> = {
    recentlyAdded: renderSections('recentlyAdded', blockData.recentlyAdded),
    topStreams: renderSections('topStreams', blockData.topStreams),
    byTag: buildMediaGridHtml(
      newsletter.blocks?.byTag?.header?.trim() || '',
      blockData.byTag,
      resourceBase,
      watchBaseUrl
    ),
  };

  // Replace explicitly placed block tokens, then append any enabled blocks
  // that were not placed so simple newsletters work without tokens.
  const placed = new Set<string>();

  body = body.replace(BLOCK_TOKEN_PATTERN, (_match, token: string) => {
    placed.add(token);
    return blockHtml[token];
  });

  for (const token of BLOCK_TOKENS) {
    if (!placed.has(token) && blockHtml[token]) {
      body += blockHtml[token];
    }
  }

  return {
    subject: injectGlobalTokens(newsletter.subject ?? '', {
      escape: false,
      locale: intl.locale,
    }),
    html: injectGlobalTokens(body, { locale: intl.locale }),
  };
};

/**
 * Substitutes per-recipient tokens into an already rendered newsletter.
 */
export const renderForRecipient = (
  rendered: RenderedNewsletter,
  recipient: { displayName?: string; email: string }
): RenderedNewsletter => {
  const values: Record<string, string> = {
    recipientName: recipient.displayName || recipient.email,
    recipientEmail: recipient.email,
  };

  return {
    subject: rendered.subject.replace(
      RECIPIENT_TOKEN_PATTERN,
      (_match, token: string) => values[token]
    ),
    html: rendered.html.replace(
      RECIPIENT_TOKEN_PATTERN,
      (_match, token: string) => escapeHtml(values[token])
    ),
  };
};
