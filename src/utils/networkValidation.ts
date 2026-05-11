import validator from 'validator';

const IP_BRACKET_REGEX = /^\[(.*)]$/;

export const isValidHostnameOrIpAddress = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  // Avoid accepting values that would later be saved with surrounding whitespace.
  if (trimmed !== value) {
    return false;
  }

  if (trimmed.toLowerCase() === 'localhost') {
    return true;
  }

  if (validator.isIP(trimmed)) {
    return true;
  }

  const bracketMatch = trimmed.match(IP_BRACKET_REGEX);
  if (bracketMatch && validator.isIP(bracketMatch[1], 6)) {
    return true;
  }

  return validator.isFQDN(trimmed, {
    require_tld: false,
    allow_underscores: true,
    allow_trailing_dot: false,
  });
};

export const isValidHttpUrl = (value?: string | null): boolean => {
  if (!value || !value.trim()) {
    return true;
  }

  try {
    const parsed = new URL(value);

    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};
