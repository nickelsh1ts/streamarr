import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import React from 'react';

interface SortableColumnHeaderProps<T extends string> {
  /** The sort field this header controls. */
  field: T;
  /** The currently active sort field. */
  activeField: T;
  /** The current sort direction. */
  direction: 'asc' | 'desc';
  /** Invoked with `field` when the header is activated (click or keyboard). */
  onSort: (field: T) => void;
  /** Header label. */
  children: React.ReactNode;
  /** Optional extra classes applied to the `<th>`. */
  className?: string;
}

/**
 * A sortable table column header. The interactive control is a real `<button>`
 * so it is keyboard focusable and operable (Enter/Space), and the `<th>`
 * exposes `aria-sort` for assistive technology. Used by both the downloads
 * list and the torrent file contents list to keep sorting consistent.
 */
function SortableColumnHeader<T extends string>({
  field,
  activeField,
  direction,
  onSort,
  children,
  className = '',
}: SortableColumnHeaderProps<T>) {
  const isActive = activeField === field;

  return (
    <th
      scope="col"
      className={`hover:bg-base-300 transition-colors select-none ${className}`}
      aria-sort={
        isActive ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'
      }
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="hover:text-primary flex w-full items-center gap-1 hover:cursor-pointer"
      >
        <span>{children}</span>
        {isActive &&
          (direction === 'asc' ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          ))}
      </button>
    </th>
  );
}

export default SortableColumnHeader;
