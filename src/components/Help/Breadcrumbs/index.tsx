'use client'
import type { ReactNode } from 'react';
import React from 'react';
import { ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

type TBreadCrumbProps = {
  homeElement: ReactNode;
  separator?: ReactNode;
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
  paths: string;
  names: string;
};

const Breadcrumbs = ({
  homeElement = 'Help Centre',
  separator = <ChevronRightIcon className="w-5 h-5 mx-3" />,
  containerClasses = 'flex flex-wrap mx-4 md:mx-16 place-items-center print:hidden',
  listClasses = 'inline-flex items-center gap-2 link-primary',
  activeClasses = 'text-neutral hover:text-neutral pointer-events-none',
  capitalizeLinks = true,
  paths,
  names,
}: TBreadCrumbProps) => {
  const pathNames = paths.split('/').filter((path) => path);
  const pathTitles = names.split(',').filter((name) => name);

  return (
    <div className={containerClasses}>
      <Link href="/help" className={listClasses}>
        {homeElement}
      </Link>
      {pathNames.length > 0 && separator}
      {pathTitles.map((link, index) => {
        const href = `/help/${pathNames.slice(0, index + 1).join('/')}`;
        const itemClasses =
          '/help' + paths === href
            ? `${listClasses} ${activeClasses}`
            : listClasses;
        const itemLink = capitalizeLinks
          ? link[0].toUpperCase() + link.slice(1, link.length)
          : link;
        return (
          <React.Fragment key={index}>
            <Link href={href} className={itemClasses}>
              {itemLink}
            </Link>
            {pathNames.length !== index + 1 && separator}
          </React.Fragment>
        );
      })}
      <button onClick={() => {window.print();return false;}} className='btn rounded-none bg-zinc-200 border-zinc-600 border-2 text-zinc-600 hover:bg-zinc-500 hover:text-white hover:border-zinc-500 btn-sm min-h-10 uppercase ms-auto'><PrinterIcon className='w-5 h-5' /> print</button>
    </div>
  );
};

export default Breadcrumbs;
