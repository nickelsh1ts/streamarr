import Link from 'next/link';
import type { ReactNode } from 'react';
import React from 'react';

type TBreadCrumbProps = {
  separator: ReactNode;
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
  pages: string;
};

const BreadCrumbs = ({
  separator,
  listClasses,
  activeClasses,
  capitalizeLinks,
  pages,
}: TBreadCrumbProps) => {
  const paths = pages;
  const pathNames = paths.split('/').filter((path) => path);

  return (
    <div className="me-auto">
      <div className="ms-md-5 ps-md-4 ms-3">
        <ul className="nav align-items-center text-secondary">
          {pathNames.map((link, index) => {
            const href = `/${pathNames.slice(0, index + 1).join('/')}`;
            const itemClasses =
              paths === href ? `${listClasses} ${activeClasses}` : listClasses;
            const itemLink = capitalizeLinks
              ? link[0].toUpperCase() + link.slice(1, link.length)
              : link;
            return (
              <React.Fragment key={index}>
                <li className={itemClasses}>
                  <Link href={href}>{itemLink}</Link>
                </li>
                {pathNames.length !== index + 1 && separator}
              </React.Fragment>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default BreadCrumbs;
