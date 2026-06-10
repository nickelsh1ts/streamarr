export type SharedLibrariesValue = string | string[] | null | undefined;

interface EnabledLibrary {
  /** Server-local section key (settings.plex.libraries[].id) */
  id: string;
}

/** True for values meaning "use the server default". */
export const isDefaultSentinel = (value: SharedLibrariesValue): boolean =>
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

export const materializeDefaultSnapshot = ({
  adminDefault,
  enabledLibraries,
}: {
  adminDefault: string | null | undefined;
  enabledLibraries: EnabledLibrary[];
}): string => {
  if (!adminDefault || adminDefault === 'all' || adminDefault === 'server') {
    return 'all';
  }
  const enabledSet = new Set(enabledLibraries.map((library) => library.id));
  const keys = sortNumeric(
    parseLibraryKeys(adminDefault).filter((key) => enabledSet.has(key))
  );
  if (keys.length === 0) {
    throw new Error(
      'Default shared libraries resolve to no enabled libraries — check the Plex library and shared-library settings.'
    );
  }
  return keys.join('|');
};
