'use client';
import useClickOutside from '@app/hooks/useClickOutside';
import { withProperties } from '@app/utils/typeHelpers';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { Fragment, useRef, useState } from 'react';

interface DropdownItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  buttonType?: 'primary' | 'ghost';
}

const DropdownItem = ({
  children,
  buttonType = 'primary',
  ...props
}: DropdownItemProps) => {
  let styleClass = 'btn-sm text-white';

  switch (buttonType) {
    case 'ghost':
      styleClass +=
        ' bg-transparent rounded hover:bg-gradient-to-br from-primary to-primary/20 text-white focus:border-primary-content focus:text-white';
      break;
    default:
      styleClass +=
        ' rounded hover:bg-primary-content/10 active:bg-primary-content/20 focus:text-white';
  }
  return (
    <a
      className={`flex cursor-pointer items-center px-4 py-2 text-sm leading-5 focus:outline-none ${styleClass}`}
      {...props}
    >
      {children}
    </a>
  );
};

interface ButtonWithDropdownProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  buttonType?: 'primary' | 'ghost';
  dropUp?: boolean;
  side?: 'left' | 'right';
}

const ButtonWithDropdown = ({
  text,
  children,
  className,
  dropUp = false,
  side = 'right',
  buttonType = 'primary',
  ...props
}: ButtonWithDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useClickOutside(buttonRef, () => setIsOpen(false));

  const styleClasses = {
    mainButtonClasses: 'btn-sm text-white border rounded-none',
    dropdownSideButtonClasses: 'btn-sm border rounded-none',
    dropdownClasses: 'relative border p-1 backdrop-blur',
  };

  switch (buttonType) {
    case 'ghost':
      styleClasses.mainButtonClasses +=
        '  bg-base-100/20 border-primary-content/60 hover:bg-gradient-to-tl from-primary-content/10 via-primary-content/15 from-10% via-30% to-primary-content/0 hover:border-primary-content/40 focus:border-primary-content/30 active:border-primary-content/20';
      styleClasses.dropdownSideButtonClasses = styleClasses.mainButtonClasses;
      styleClasses.dropdownClasses +=
        ' bg-base-100 border border-white/40 bg-opacity-30';
      break;
    default:
      styleClasses.mainButtonClasses +=
        ' bg-primary border-primary bg-opacity-60 hover:bg-opacity-100 hover:border-primary/60 active:bg-primary/40 active:border-primary focus:ring-1 focus:ring-primary-content';
      styleClasses.dropdownSideButtonClasses +=
        ' bg-primary bg-opacity-60 border-primary hover:bg-opacity-100 active:bg-opacity-40 focus:ring-1 focus:ring-primary-content';
      styleClasses.dropdownClasses +=
        ' bg-primary bg-opacity-30 border-primary';
  }

  return (
    <span
      className={`relative flex ${side === 'left' ? 'flex-row-reverse' : 'flex-row'} h-full rounded-md shadow-sm`}
    >
      <button
        type="button"
        className={`relative z-10 inline-flex h-full items-center px-4 py-2 text-sm font-medium leading-5 transition duration-150 ease-in-out hover:z-20 focus:z-20 focus:outline-none ${
          styleClasses.mainButtonClasses
        } ${children ? (side === 'right' ? 'rounded-l-md' : 'rounded-r-md') : 'rounded-md'} ${className && className}`}
        {...props}
      >
        {text}
      </button>
      {children && (
        <span className="relative -ml-px block" ref={buttonRef}>
          <button
            type="button"
            className={`relative z-10 inline-flex h-full items-center ${side === 'left' ? 'rounded-l-md' : 'rounded-r-md'} px-2 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out hover:z-20 focus:z-20 ${styleClasses.dropdownSideButtonClasses}`}
            aria-label="Expand"
            onClick={() => setIsOpen((state) => !state)}
          >
            {!dropUp ? (
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${isOpen && 'scale-y-[-1]'}`}
              />
            ) : (
              <ChevronUpIcon
                className={`w-4 h-4 transition-transform ${isOpen && 'scale-y-[-1]'}`}
              />
            )}
          </button>
          <Transition as={Fragment} show={isOpen}>
            <div
              className={`absolute menu min-w-52 text-sm -my-1 ${side === 'left' ? '-ml-1 left-0' : '-mr-1 right-0'} transition ease-out duration-75 opacity-100 translate-y-0 data-[closed]:opacity-0 data-[leave]:opacity-0 ${dropUp ? 'top-auto bottom-full origin-bottom-right data-[closed]:translate-y-2 data-[leave]:translate-y-2' : 'origin-top-right data-[closed]:-translate-y-2 data-[leave]:-translate-y-2'}`}
            >
              <div
                className={`rounded-md ring-1 ring-black ring-opacity-5 ${styleClasses.dropdownClasses}`}
              >
                <div className={`flex flex-col`}>{children}</div>
              </div>
            </div>
          </Transition>
        </span>
      )}
    </span>
  );
};
export default withProperties(ButtonWithDropdown, { Item: DropdownItem });
