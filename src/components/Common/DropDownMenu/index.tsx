/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';
import Tooltip from '@app/components/Common/ToolTip';
import useClickOutside from '@app/hooks/useClickOutside';
import useHash from '@app/hooks/useHash';
import { withProperties } from '@app/utils/typeHelpers';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  SetStateAction,
} from 'react';
import { Fragment, useRef, useState } from 'react';

interface DropdownItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  buttonType?: 'primary' | 'ghost';
  divide?: 'before' | 'after';
  isOpen?: boolean;
  setIsOpen?: (value: SetStateAction<boolean>) => void;
}

const DropdownItem = (
    { children, buttonType = 'primary', divide, isOpen, setIsOpen, ...props }: DropdownItemProps
  ) => {
    let styleClass = 'hover:bg-primary-content/10';
    const url = usePathname() + useHash();

    switch (buttonType) {
      case 'ghost':
        styleClass +=
          ' bg-transparent rounded hover:bg-gradient-to-br from-primary to-primary/20 text-white focus:border-primary-content focus:text-white';
        break;
      default:
        styleClass += '';
    }

    const isActive = url.includes(props.href);

    return (
      <li className="">
        {divide === 'before' && (
          <span className="border-t p-0 border-[#ffffff1a] my-1"></span>
        )}
        <Link
          href={props.href || ''}
          onClick={() => setIsOpen && setIsOpen(!isOpen)}
          onKeyDown={() => {}}
          className={`rounded-none py-1 ${styleClass} ${isActive ? 'bg-primary-content/20' : ''}`}
          {...props}
        >
          {children}
        </Link>
        {divide === 'after' && (
          <div className="border-t p-0 border-zinc-300/40 my-1"></div>
        )}
      </li>
    );
  };

interface DropDownMenuProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  dropUp?: boolean;
  title?: string;
  dropdownIcon?: React.ReactNode;
  buttonType?: 'primary' | 'ghost';
  toolTip?: boolean;
  ttplacement?: 'top' | 'bottom';
}

const DropDownMenu = ({
  dropUp,
  title,
  children,
  dropdownIcon,
  ttplacement = 'bottom',
  buttonType,
  toolTip = false,
  ...props
}: DropDownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useClickOutside(buttonRef, () => setIsOpen(false));

  const styleClasses = {
    dropdownSideButtonClasses: 'flex place-items-center p-1 gap-1',
    dropdownClasses: 'py-1 rounded-md',
  };

  switch (buttonType) {
    case 'ghost':
      styleClasses.dropdownClasses += '';
      styleClasses.dropdownSideButtonClasses += '';
      break;
    default:
      styleClasses.dropdownSideButtonClasses +=
        ' text-zinc-300 hover:text-white';
      styleClasses.dropdownClasses +=
        ' shadow-3xl bg-[#202629] border-[.2px] border-base-200';
  }

  return (
    <span className={`relative inline-flex h-full`}>
      <span className="relative -ml-px block" ref={buttonRef}>
        <Tooltip
          content={toolTip && title}
          tooltipConfig={{ placement: ttplacement }}
        >
          <button
            type="button"
            className={`relative inline-flex h-full items-center p-2 text-sm font-medium leading-5 ${styleClasses.dropdownSideButtonClasses}`}
            aria-label="Expand"
            onClick={() => setIsOpen((state) => !state)}
            {...props}
          >
            {dropdownIcon ? dropdownIcon : title}
            {!dropUp ? (
              <ChevronDownIcon
                className={`w-4 h-4 -ms-1 transition-transform ${isOpen && 'scale-y-[-1]'}`}
              />
            ) : (
              <ChevronUpIcon
                className={`w-4 h-4 -ms-1 transition-transform ${isOpen && 'scale-y-[-1]'}`}
              />
            )}
          </button>
        </Tooltip>
        <Transition as={Fragment} show={isOpen}>
          <div
            className={`absolute menu min-w-52 text-sm -mr-1 -my-1 right-0 transition ease-out duration-75 opacity-100 translate-y-0 data-[closed]:opacity-0 data-[leave]:opacity-0 ${dropUp ? 'top-auto bottom-full origin-bottom-right data-[closed]:translate-y-2 data-[leave]:translate-y-2' : 'origin-top-right data-[closed]:-translate-y-2 data-[leave]:-translate-y-2'}`}
          >
            <div className={`${styleClasses.dropdownClasses}`}>
              {title && (
                <span className="ms-4 font-bold text-primary-content/45 uppercase">
                  {title}
                </span>
              )}
              <ul
                className={`flex flex-col ${title && 'mt-2'}`}
                onKeyDown={() => setIsOpen(false)}
                onClick={() => setIsOpen(false)}
              >
                {children}
              </ul>
            </div>
          </div>
        </Transition>
      </span>
    </span>
  );
};

DropdownItem.displayName = 'Drop Down Item';

export default withProperties(DropDownMenu, { Item: DropdownItem });
