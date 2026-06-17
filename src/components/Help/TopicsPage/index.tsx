'use client';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

type LinksProps = {
  href: string;
  text: string;
};

type TopicsPageProps = {
  heading: string;
  subheading: string;
  links: LinksProps[];
};

const TopicsPage = ({ heading, subheading, links }: TopicsPageProps) => {
  return (
    <div className="container mx-auto mt-10 max-w-screen-md px-4 text-black">
      <div className="my-7 text-4xl font-extrabold">{heading}</div>
      <div className="text-neutral">{subheading}</div>
      <div className="border-t-primary my-6 grid grid-cols-1 gap-2 rounded-md border border-t-8 border-zinc-300 p-4">
        <p className="mb-2 font-extrabold">
          <FormattedMessage
            id="help.relatedArticles"
            defaultMessage="Related Articles"
          />
        </p>
        {links?.map((link, i) => {
          return (
            <Link
              key={i}
              href={link.href}
              className="hover:text-primary flex place-items-center gap-2 rounded-md border border-zinc-300 p-2 hover:underline hover:brightness-75"
            >
              <DocumentTextIcon className="h-5 w-5 shrink-0" />
              {link.text}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TopicsPage;
