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
  activeRegEx?: RegExp;
}

const DropdownItem = ({
  children,
  buttonType = 'primary',
  divide,
  isOpen,
  activeRegEx,
  setIsOpen,
  ...props
}: DropdownItemProps) => {
  let styleClass = 'hover:bg-base-content/10 text-base-content';
  const url = usePathname() + useHash();

  switch (buttonType) {
    case 'ghost':
      styleClass +=
        ' bg-transparent rounded hover:bg-gradient-to-br from-primary to-primary/20 focus:border-base-content focus:text-base-content';
      break;
    default:
      styleClass += '';
  }

  const isActive = activeRegEx
    ? url.match(activeRegEx)
    : url.includes(props.href);

  return (
    <li className="">
      {divide === 'before' && (
        <span className="border-t p-0 border-[#ffffff1a] my-1"></span>
      )}
      {props.href ? (
        <Link
          href={props.href}
          onClick={() => setIsOpen && setIsOpen(!isOpen)}
          onKeyDown={() => setIsOpen && setIsOpen(!isOpen)}
          className={`rounded-none py-1 ${styleClass} ${isActive ? 'bg-base-content/20' : ''}`}
          {...props}
        >
          {children}
        </Link>
      ) : (
        <button
          onClick={() => setIsOpen && setIsOpen(!isOpen)}
          onKeyDown={() => setIsOpen && setIsOpen(!isOpen)}
          className={`w-full text-left rounded-none py-1 ${styleClass} ${isActive ? 'bg-base-content/20' : ''}`}
          {...(props as unknown as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          {children}
        </button>
      )}
      {divide === 'after' && (
        <div className="border-t p-0 border-zinc-300/40 my-1"></div>
      )}
    </li>
  );
};

interface DropDownMenuProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  dropUp?: boolean;
  side?: 'left' | 'right';
  title?: string;
  dropdownIcon?: React.ReactNode;
  buttonType?: 'primary' | 'ghost';
  toolTip?: boolean;
  ttplacement?: 'top' | 'bottom';
  tiptitle?: string;
  chevron?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const DropDownMenu = ({
  dropUp,
  side = 'right',
  title,
  children,
  dropdownIcon,
  ttplacement = 'bottom',
  tiptitle,
  buttonType,
  chevron = true,
  toolTip = false,
  size = 'sm',
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
        ' text-zinc-300 hover:text-primary-content';
      styleClasses.dropdownClasses +=
        ' shadow-3xl bg-base-200 border-[.2px] border-base-200';
  }

  return (
    <span className={`relative inline-flex h-full`}>
      <span className="relative -ml-px block" ref={buttonRef}>
        <Tooltip
          content={toolTip && tiptitle && tiptitle}
          tooltipConfig={{ placement: ttplacement }}
        >
          <button
            type="button"
            className={`relative inline-flex h-full items-center text-sm font-medium leading-5 ${styleClasses.dropdownSideButtonClasses}`}
            aria-label="Expand"
            onClick={(e) => {
              setIsOpen((state) => !state);
              e.stopPropagation();
            }}
            {...props}
          >
            {dropdownIcon ? dropdownIcon : title}
            {chevron &&
              (!dropUp ? (
                <ChevronDownIcon
                  className={`w-4 h-4 -ms-1 transition-transform ${isOpen && 'scale-y-[-1]'}`}
                />
              ) : (
                <ChevronUpIcon
                  className={`w-4 h-4 -ms-1 transition-transform ${isOpen && 'scale-y-[-1]'}`}
                />
              ))}
          </button>
        </Tooltip>
        <Transition as={Fragment} show={isOpen}>
          <div
            className={`absolute z-50 menu ${size === 'md' ? 'min-w-64' : size === 'lg' ? 'min-w-72' : 'min-w-52'} text-sm -mr-1 -ml-1 -my-1 ${side}-0 transition ease-out duration-75 opacity-100 translate-y-0 data-[closed]:opacity-0 data-[leave]:opacity-0 ${dropUp ? `top-auto bottom-full origin-bottom-${side} data-[closed]:translate-y-2 data-[leave]:translate-y-2` : `origin-top-${side} data-[closed]:-translate-y-2 data-[leave]:-translate-y-2`}`}
          >
            <div className={`${styleClasses.dropdownClasses}`}>
              {title && (
                <span className="ms-4 font-bold text-base-content/45 uppercase">
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
