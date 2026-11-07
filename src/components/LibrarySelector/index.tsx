import type { Library } from '@server/lib/settings';
import { isDefaultSentinel } from '@server/utils/sharedLibraries';
import sortBy from 'lodash/sortBy';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { CSSObjectWithLabel } from 'react-select';
import Select from 'react-select';
import useSWR from 'swr';

export type OptionType = {
  value: string;
  label: string;
  isFixed?: boolean;
};

// Option value for "Default Libraries"; the field itself holds null
const DEFAULT_OPTION = 'default';
const SPECIAL_OPTIONS = new Set(['all', DEFAULT_OPTION]);
const toFieldValue = (option: string) =>
  option === DEFAULT_OPTION ? null : option;

const selectStyles = {
  multiValueLabel: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, paddingRight: 6 } : base;
  },
  multiValueRemove: (base: CSSObjectWithLabel, props: { data: OptionType }) => {
    return props.data?.isFixed ? { ...base, display: 'none' } : base;
  },
};

interface LibrarySelectorProps {
  /** 'all', null (follow the default), 'unchanged', or pipe-separated library ids */
  value?: string | null;
  setFieldValue: (property: string, value: string | null) => void;
  serverValue?: string;
  /** Offers a "Default Libraries" option that follows the server default */
  allowDefault?: boolean;
  /** Allows an empty selection, treated as 'unchanged' for bulk editing */
  allowUnchanged?: boolean;
}

const LibrarySelector = ({
  value,
  setFieldValue,
  serverValue,
  allowDefault = false,
  allowUnchanged = false,
}: LibrarySelectorProps) => {
  const { data: Libraries } = useSWR<Library[]>('/api/v1/libraries');
  const intl = useIntl();

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

  if (allowDefault) {
    options.unshift({
      value: DEFAULT_OPTION,
      label: serverLibraryNames
        ? intl.formatMessage(
            {
              id: 'librarySelector.defaultLibrariesWith',
              defaultMessage: 'Default Libraries ({libraries})',
            },
            { libraries: serverLibraryNames }
          )
        : serverValue !== undefined
          ? intl.formatMessage({
              id: 'librarySelector.defaultLibrariesAll',
              defaultMessage: 'Default Libraries (All)',
            })
          : intl.formatMessage({
              id: 'librarySelector.defaultLibraries',
              defaultMessage: 'Default Libraries',
            }),
      isFixed: true,
    });
  }

  options.unshift({
    value: 'all',
    label: intl.formatMessage({
      id: 'invite.allLibraries',
      defaultMessage: 'All Libraries',
    }),
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
      placeholder={
        allowUnchanged
          ? intl.formatMessage({
              id: 'librarySelector.noChange',
              defaultMessage: 'No change',
            })
          : undefined
      }
      value={(() => {
        if (allowUnchanged && value === 'unchanged') {
          return [];
        }
        if (allowDefault && isDefaultSentinel(value)) {
          return options.filter((opt) => opt.value === DEFAULT_OPTION);
        }
        if (value === 'all' || isDefaultSentinel(value)) {
          return options.filter((opt) => opt.value === 'all');
        }
        return value
          .split('|')
          .map((id) => options.find((opt) => opt.value === id))
          .filter(
            (opt): opt is OptionType => !!opt && !SPECIAL_OPTIONS.has(opt.value)
          );
      })()}
      onChange={(selected, meta) => {
        const picked = meta.option?.value;
        if (meta.action === 'select-option' && SPECIAL_OPTIONS.has(picked)) {
          return setFieldValue('sharedLibraries', toFieldValue(picked));
        }
        const ids = selected
          .map((lib) => lib.value)
          .filter((id) => !SPECIAL_OPTIONS.has(id));
        if (ids.length > 0) {
          return setFieldValue('sharedLibraries', ids.join('|'));
        }
        // Only a special option (or nothing) remains
        setFieldValue(
          'sharedLibraries',
          selected[0]
            ? toFieldValue(selected[0].value)
            : allowUnchanged
              ? 'unchanged'
              : allowDefault
                ? null
                : 'all'
        );
      }}
    />
  );
};

export default LibrarySelector;
