'use client';
import useClickOutside from '@app/hooks/useClickOutside';
import { withProperties } from '@app/utils/typeHelpers';
import { Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
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

interface ButtonWithDropdownProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  dropdownIcon?: React.ReactNode;
  buttonType?: 'primary' | 'ghost';
}

const ButtonWithDropdown = ({
  text,
  children,
  dropdownIcon,
  className,
  buttonType = 'primary',
  ...props
}: ButtonWithDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  useClickOutside(buttonRef, () => setIsOpen(false));

  const styleClasses = {
    mainButtonClasses: 'btn-sm text-white border backdrop-blur',
    dropdownSideButtonClasses: 'btn-sm border backdrop-blur',
    dropdownClasses: ' backdrop-blur border',
  };

  switch (buttonType) {
    case 'ghost':
      styleClasses.mainButtonClasses +=
        '  bg-base-100/20 border-primary-content/60 hover:bg-gradient-to-tl from-primary-content/10 via-primary-content/15 from-10% via-30% to-primary-content/0 hover:border-primary-content/40 focus:border-primary-content/30 active:border-primary-content/20';
      styleClasses.dropdownSideButtonClasses = styleClasses.mainButtonClasses;
      styleClasses.dropdownClasses +=
        ' bg-base-100 border border-white/40 bg-opacity-30 p-1 backdrop-blur';
      break;
    default:
      styleClasses.mainButtonClasses +=
        ' bg-primary border-primary bg-opacity-60 hover:bg-opacity-100 hover:border-primary/60 active:bg-primary/40 active:border-primary focus:ring-1 focus:ring-primary-content';
      styleClasses.dropdownSideButtonClasses +=
        ' bg-primary bg-opacity-60 border-primary hover:bg-opacity-100 active:bg-opacity-40 focus:ring-1 focus:ring-primary-content';
      styleClasses.dropdownClasses += ' bg-primary/40 p-1 border-primary';
  }

  return (
    <span className="relative inline-flex h-full rounded-md shadow-sm">
      <button
        type="button"
        className={`relative z-10 inline-flex h-full items-center px-4 py-2 text-sm font-medium leading-5 transition duration-150 ease-in-out hover:z-20 focus:z-20 focus:outline-none ${
          styleClasses.mainButtonClasses
        } ${children ? 'rounded-l-md' : 'rounded-md'} ${className}`}
        {...props}
      >
        {text}
      </button>
      {children && (
        <span className="relative -ml-px block">
          <button
            type="button"
            className={`relative z-10 inline-flex h-full items-center rounded-r-md px-2 py-2 text-sm font-medium leading-5 text-white transition duration-150 ease-in-out hover:z-20 focus:z-20 ${styleClasses.dropdownSideButtonClasses}`}
            aria-label="Expand"
            onClick={() => setIsOpen((state) => !state)}
            ref={buttonRef}
          >
            {dropdownIcon ? (
              dropdownIcon
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </button>
          <Transition
            as={Fragment}
            show={isOpen}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="absolute right-0 z-40 mt-2 -mr-1 w-56 origin-top-right rounded-md shadow-lg">
              <div
                className={`rounded-md ring-1 ring-black ring-opacity-5 ${styleClasses.dropdownClasses}`}
              >
                <div className="py-1 space-y-1">{children}</div>
              </div>
            </div>
          </Transition>
        </span>
      )}
    </span>
  );
};
export default withProperties(ButtonWithDropdown, { Item: DropdownItem });
