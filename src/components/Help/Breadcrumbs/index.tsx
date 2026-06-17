'use client';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import { useUser } from '@app/hooks/useUser';
import { ChevronRightIcon, PrinterIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import type { ReactNode } from 'react';
import React from 'react';
import { FormattedMessage } from 'react-intl';

type TBreadCrumbProps = {
  homeElement: ReactNode;
  separator?: ReactNode;
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
  paths: string;
  names: string;
  print?: boolean;
};

const Breadcrumbs = ({
  homeElement = 'Help Centre',
  separator = <ChevronRightIcon className="mx-3 h-5 w-5" />,
  containerClasses = 'flex flex-wrap mx-4 md:mx-16 place-items-center print:hidden relative',
  listClasses = 'inline-flex items-center gap-2 link-primary',
  activeClasses = 'text-neutral hover:text-neutral pointer-events-none',
  capitalizeLinks = true,
  paths,
  names,
  print = true,
}: TBreadCrumbProps) => {
  const pathNames = paths.split('/').filter((path) => path);
  const pathTitles = names.split(',').filter((name) => name);
  const { user, loading } = useUser({ disableAutoRevalidation: true });

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
      <div className="ms-auto flex flex-wrap items-center gap-2">
        {!user && !loading && (
          <div className="text-white">
            <LanguagePicker />
          </div>
        )}
        {print && (
          <button
            onClick={() => {
              window.print();
              return false;
            }}
            className="btn btn-sm min-h-10 rounded-none border-2 border-zinc-600 bg-zinc-200 text-zinc-600 uppercase hover:border-zinc-500 hover:bg-zinc-500 hover:text-white"
          >
            <PrinterIcon className="h-5 w-5" />{' '}
            <FormattedMessage id="common.print" defaultMessage="Print" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Breadcrumbs;
