'use client';
import useHash from '@app/hooks/useHash';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { HTMLAttributeAnchorTarget } from 'react';

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

const DropDownMenu = ({ dropUp, menuLinks, title, icon }: OptionsProps) => {
  const path = usePathname();
  const hash = useHash();

  const url = path + hash;

  return (
    <div className={`dropdown dropdown-end${dropUp ? ' dropdown-top' : ''}`}>
      <div
        tabIndex={0}
        role="button"
        className="flex place-items-center px-2 py-1 gap-1 text-zinc-300 hover:text-white"
        title={title}
      >
        {icon ? icon : title}
        {!dropUp ? (
          <ChevronDownIcon className="w-4 h-4 -ms-1" />
        ) : (
          <ChevronUpIcon className="w-4 h-4 -ms-1" />
        )}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-primary backdrop-blur-md bg-opacity-60 rounded-md z-[1] px-0 py-2 min-w-44 text-sm"
      >
        <li className="p-2 ms-2 text-base uppercase">{title}</li>
        {menuLinks.map((menuLink) => {
          const isActive = url.includes(menuLink.href);
          return (
            <>
              {menuLink.divide === 'before' && (
                <div className="bg-zinc-300/40 h-0.5 my-2"></div>
              )}
              <li className={`m-0`} key={menuLink.messagesKey}>
                <Link
                  href={menuLink.href}
                  target={menuLink.target}
                  className={`rounded-none gap-1 pe-2 active:!bg-zinc-50/20 ${isActive ? 'text-white bg-white/10 hover:text-zinc-200' : 'text-zinc-300 hover:text-white'}`}
                >
                  {menuLink.icon}
                  {menuLink.messagesKey}
                </Link>
              </li>
              {menuLink.divide === 'after' && (
                <div className="bg-zinc-300/40 h-0.5 my-2"></div>
              )}
            </>
          );
        })}
      </ul>
    </div>
  );
};

export default DropDownMenu;
