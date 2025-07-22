import type { Library } from '@server/lib/settings';
import { sortBy } from 'lodash';
import { useMemo } from 'react';
import type { CSSObjectWithLabel } from 'react-select';
import Select from 'react-select';
import useSWR from 'swr';

export type OptionType = {
  value: string;
  label: string;
  isFixed?: boolean;
};

const selectStyles = {
  multiValueLabel: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, paddingRight: 6 } : base;
  },
  multiValueRemove: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, display: 'none' } : base;
  },
};

interface LibrarySelectorProps {
  value?: string;
  setFieldValue: (property: string, value: string) => void;
  serverValue?: string;
  isUserSettings?: boolean;
}

const LibrarySelector = ({
  value,
  setFieldValue,
  serverValue,
  isUserSettings = false,
}: LibrarySelectorProps) => {
  const { data: Libraries } = useSWR<Library[]>('/api/v1/libraries');

  const sortedLibraries = useMemo(() => {
    return sortBy(Libraries, 'name');
  }, [Libraries]);

  // Map serverValue IDs to names for the label
  const serverLibraryNames = useMemo(() => {
    if (!Libraries || !serverValue) return '';
    const idList = serverValue.split('|');
    return idList
      .map((id) => Libraries.find((lib) => lib.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  }, [Libraries, serverValue]);

  const options: OptionType[] =
    sortedLibraries?.map((library) => ({
      label: library.name,
      value: library.id,
    })) ?? [];

  if (isUserSettings) {
    options.unshift({
      value: 'server',
      label: serverLibraryNames
        ? `Default Libraries (${serverLibraryNames})`
        : 'Default Libraries (All)',
      isFixed: true,
    });
  }

  options.unshift({
    value: 'all',
    label: 'All Libraries',
    isFixed: true,
  });

  const mergedSelectStyles = {
    ...selectStyles,
    menuPortal: (base: CSSObjectWithLabel) => ({ ...base, zIndex: 9999 }),
    menu: (base: CSSObjectWithLabel) => ({
      ...base,
      marginBottom: 8,
    }),
  };

  return (
    <Select<OptionType, true>
      options={options}
      isMulti
      unstyled
      styles={mergedSelectStyles}
      closeMenuOnSelect={false}
      menuPortalTarget={
        typeof window !== 'undefined' ? document.body : undefined
      }
      menuPosition="fixed"
      menuPlacement="auto"
      minMenuHeight={300}
      className="react-select-container"
      classNamePrefix="react-select"
      value={(() => {
        // If 'all' is selected, only show 'all'
        if (
          (isUserSettings && value === 'all') ||
          (!isUserSettings && !value)
        ) {
          return [options.find((opt) => opt.value === 'all')!];
        }
        // If 'server' is selected, only show 'server'
        if ((value === '' || value === 'server') && isUserSettings) {
          return [options.find((opt) => opt.value === 'server')!];
        }
        // Otherwise, show selected libraries by id
        const selectedIds = value?.split('|') ?? [];
        // If nothing is selected, show nothing
        if (selectedIds.length === 0) return [];
        return selectedIds
          .map((id) => options.find((opt) => opt.value === id))
          .filter(
            (opt) => opt && opt.value !== 'all' && opt.value !== 'server'
          ) as OptionType[];
      })()}
      onChange={(value, options) => {
        // Remove 'all' or 'server' if another library is selected
        if (
          options &&
          options.action === 'select-option' &&
          (options.option?.value === 'server' ||
            options.option?.value === 'all')
        ) {
          return setFieldValue(
            'sharedLibraries',
            options.option?.value === 'server'
              ? ''
              : isUserSettings
                ? 'all'
                : ''
          );
        }
        // If all selected are 'server' or 'all', handle accordingly
        if (value.length === 0) {
          return setFieldValue('sharedLibraries', '');
        }
        if (value.every((v) => v.value === 'server')) {
          return setFieldValue('sharedLibraries', '');
        }
        if (value.every((v) => v.value === 'all')) {
          return setFieldValue('sharedLibraries', isUserSettings ? 'all' : '');
        }
        // Otherwise, set selected libraries (removing 'all' and 'server')
        setFieldValue(
          'sharedLibraries',
          value
            .map((lib) => lib.value)
            .filter((v) => v !== 'all' && v !== 'server')
            .join('|')
        );
      }}
    />
  );
};

export default LibrarySelector;
