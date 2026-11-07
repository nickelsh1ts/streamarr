export type SharedLibrariesValue = string | string[] | null | undefined;

interface EnabledLibrary {
  /** Server-local section key (settings.plex.libraries[].id) */
  id: string;
}

/** True for values meaning "use the server default". */
export const isDefaultSentinel = (
  value: SharedLibrariesValue
): value is null | undefined | '' | 'server' =>
  value == null || value === '' || value === 'server';

const parseLibraryKeys = (value: string | string[]): string[] => {
  const parts = Array.isArray(value)
    ? value.flatMap((entry) => String(entry).split(/[,|]/))
    : value.split(/[,|]/);
  return [
    ...new Set(parts.map((key) => key.trim()).filter((key) => key !== '')),
  ];
};

const sortNumeric = (keys: string[]): string[] =>
  [...keys].sort((a, b) => {
    const aNum = parseInt(a, 10);
    const bNum = parseInt(b, 10);
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      return a.localeCompare(b);
    }
    return aNum - bNum;
  });

/**
 * Resolves a sharedLibraries value to explicit, enabled library keys.
 */
export const resolveSharedLibraryKeys = ({
  value,
  adminDefault,
  enabledLibraries,
}: {
  value: SharedLibrariesValue;
  adminDefault: string | null | undefined;
  enabledLibraries: EnabledLibrary[];
}): string[] => {
  const enabledKeys = enabledLibraries.map((library) => library.id);
  const enabledSet = new Set(enabledKeys);

  const effective = isDefaultSentinel(value)
    ? !adminDefault || adminDefault === 'all' || adminDefault === 'server'
      ? 'all'
      : adminDefault
    : (value as string | string[]);

  if (effective === 'all') {
    return sortNumeric(enabledKeys);
  }

  return sortNumeric(
    parseLibraryKeys(effective).filter((key) => enabledSet.has(key))
  );
};

export const normalizeSharedLibrariesValue = (
  value: SharedLibrariesValue
): string | null => {
  if (isDefaultSentinel(value)) {
    return null;
  }
  if (value === 'all') {
    return 'all';
  }
  const keys = sortNumeric(parseLibraryKeys(value as string | string[]));
  return keys.length > 0 ? keys.join('|') : null;
};

/** True when a change to library `key` may change what `value` grants. */
export const referencesLibrary = (
  value: SharedLibrariesValue,
  key: string
): boolean =>
  isDefaultSentinel(value) ||
  value === 'all' ||
  parseLibraryKeys(value).includes(key);

/** Library keys a Plex share grants, or 'all' for an all-libraries share. */
export const shareLibraryKeys = (share: {
  allLibraries: boolean;
  sections: { key: string; shared: boolean }[];
}): string[] | 'all' =>
  share.allLibraries
    ? 'all'
    : share.sections
        .filter((section) => section.shared)
        .map((section) => section.key);

/**
 * The value that keeps an existing Plex share's access, or null when it
 * matches the server default (or shares nothing) so the user follows it.
 */
export const sharedLibrariesFromShare = (
  share: Parameters<typeof shareLibraryKeys>[0],
  {
    adminDefault,
    enabledLibraries,
  }: {
    adminDefault: string | null | undefined;
    enabledLibraries: EnabledLibrary[];
  }
): string | null => {
  const keys = shareLibraryKeys(share);
  const value = keys === 'all' ? 'all' : normalizeSharedLibrariesValue(keys);
  if (!value) {
    return null;
  }
  if (value === 'all') {
    // Only an all-libraries default also covers disabled libraries
    return !adminDefault || adminDefault === 'all' || adminDefault === 'server'
      ? null
      : 'all';
  }
  // Compare the raw keys so access to a disabled library is kept
  const defaultKeys = resolveSharedLibraryKeys({
    value: null,
    adminDefault,
    enabledLibraries,
  }).join('|');
  return value !== defaultKeys ? value : null;
};
