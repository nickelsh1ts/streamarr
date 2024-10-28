'use client';
import useHash from '@app/hooks/useHash';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { HTMLAttributeAnchorTarget, RefObject } from 'react';
import { createRef, forwardRef, useRef } from 'react';

export const DivideStyles = {
  before: 'before',
  after: 'after',
};

type DivideStyle = (typeof DivideStyles)[keyof typeof DivideStyles];

interface MenuLinksProps {
  href: string;
  messagesKey: string;
  icon?: React.ReactNode;
  divide?: DivideStyle;
  target?: HTMLAttributeAnchorTarget;
}

interface OptionsProps {
  dropUp?: boolean;
  menuLinks: MenuLinksProps[];
  title: string;
  icon?: React.ReactNode;
}

const DropDownMenu = forwardRef(
  (
    { dropUp, menuLinks, title, icon }: OptionsProps,
    ref: RefObject<HTMLInputElement>
  ) => {
    const path = usePathname();
    const hash = useHash();

    const url = path + hash;

    const divref = createRef<HTMLDivElement>();

    const outRef = useRef();

    function closeBtn() {
      if (ref != null && typeof ref != 'function') {
        ref.current.click();
      }
      divref.current.click();
    }

    return (
      <details
        className={`dropdown dropdown-end${dropUp ? ' dropdown-top' : ''} pointer-events-auto hover:cursor-pointer`}
        ref={outRef}
      >
        <summary
          className="flex place-items-center p-1 gap-1 text-zinc-300 hover:text-white"
          title={title}
          ref={divref}
        >
          {icon ? icon : title}
          {!dropUp ? (
            <ChevronDownIcon className="w-4 h-4 -ms-1" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 -ms-1" />
          )}
        </summary>
        <ul
          tabIndex={0}
          className="dropdown-content mt-2 menu bg-[#202629] rounded-sm z-[1] px-0 min-w-44 text-sm py-1"
        >
          <li className="ms-4 mb-2 font-bold text-primary-content/45 uppercase">
            {title}
          </li>
          {menuLinks.map((menuLink) => {
            const isActive = url.includes(menuLink.href);
            return (
              <>
                {menuLink.divide === 'before' && (
                  <div className="border-t border-zinc-300/40 my-1"></div>
                )}
                <li className={`m-0`} key={menuLink.messagesKey}>
                  <Link
                    onClick={closeBtn}
                    href={menuLink.href}
                    target={menuLink.target}
                    className={`rounded-none py-1 active:!bg-zinc-50/20 ${isActive ? 'text-white bg-white/10 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                  >
                    {menuLink.icon}
                    {menuLink.messagesKey}
                  </Link>
                </li>
                {menuLink.divide === 'after' && (
                  <div className="border-t border-zinc-300/40 my-1"></div>
                )}
              </>
            );
          })}
        </ul>
      </details>
    );
  }
);

DropDownMenu.displayName = 'Drop Down Menu';

export default DropDownMenu;
