import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type LinksProps = {
  href: string;
  text: string;
};

type TopicsPageProps = {
  heading: string;
  subheading: string;
  links: LinksProps[];
};

const TopicsPage = ({
  heading,
  subheading,
  links,
}: TopicsPageProps) => {
  return (
    <div className="container mx-auto max-w-screen-md mt-10 text-black px-4">
      <div className="text-4xl font-extrabold my-7">{heading}</div>
      <div className="">{subheading}</div>
      <div className="grid grid-cols-1 my-6 gap-2 border rounded-md border-zinc-300 p-4 border-t-8 border-t-primary">
        <p className="font-extrabold mb-2">Related Articles</p>
        {links?.map((link, i) => {
          return (
            <Link
              key={i}
              href={link.href}
              className="flex gap-2 place-items-center hover:brightness-75 hover:text-primary hover:underline border border-zinc-300 p-2 rounded-md"
            >
              <DocumentTextIcon className="w-5 h-5" />
              {link.text}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TopicsPage;
