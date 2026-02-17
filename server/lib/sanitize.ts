import DOMPurify from 'isomorphic-dompurify';
import path from 'path';

// Allowed HTML tags for custom content
const ALLOWED_TAGS = [
  'p',
  'br',
  'b',
  'i',
  'em',
  'strong',
  'u',
  's',
  'strike',
  'a',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'code',
  'pre',
  'hr',
  'span',
  'div',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

// Allowed HTML attributes
const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'class',
  'id',
  'style',
  'src',
  'alt',
  'title',
  'width',
  'height',
];

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });
};

// YouTube URL regex patterns
const YOUTUBE_PATTERNS = [
  // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:\S*)?/,
  // Short URLs: youtu.be/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\S*)?/,
  // Embed URLs: youtube.com/embed/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\S*)?/,
  // nocookie embed URLs
  /(?:https?:\/\/)?(?:www\.)?youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\S*)?/,
];

/**
 * Extract YouTube video ID from various URL formats
 * @param url - The YouTube URL
 * @returns The video ID or null if not a valid YouTube URL
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) {
    return null;
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Sanitize and convert YouTube URL to privacy-enhanced nocookie embed URL
 * @param url - The YouTube URL to sanitize
 * @returns Privacy-enhanced embed URL or null if invalid
 */
export const sanitizeYouTubeUrl = (url: string): string | null => {
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return null;
  }

  // Return privacy-enhanced nocookie embed URL
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
};

/**
 * Validate if a URL is a safe external URL
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export const isValidExternalUrl = (url: string): boolean => {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize an image URL - validates it's a proper URL
 * @param url - The image URL to sanitize
 * @returns The URL if valid, null otherwise
 */
export const sanitizeImageUrl = (url: string): string | null => {
  if (!url) {
    return null;
  }

  // Allow internal paths starting with /
  if (url.startsWith('/')) {
    // Decode the URL to catch encoded path traversal attempts
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch {
      // Invalid encoding
      return null;
    }

    // Validate it doesn't contain path traversal (including encoded forms)
    if (decodedUrl.includes('..')) {
      return null;
    }

    // Normalize the path to resolve any remaining path issues
    const normalizedPath = path.normalize(decodedUrl);
    // Ensure normalized path still starts with / (prevents going above root)
    if (!normalizedPath.startsWith('/')) {
      return null;
    }

    return url;
  }

  // For external URLs, validate the protocol
  if (isValidExternalUrl(url)) {
    return url;
  }

  return null;
};
