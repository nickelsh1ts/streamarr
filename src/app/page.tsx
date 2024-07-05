import type { Metadata, NextPage } from 'next';
import Link from 'next/link';

const applicationTitle = 'Streamarr';

const messages = {
  title: 'Stream the greatest Movies, Series, Classics and more',
};

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const Index: NextPage = () => {
  return (
    <main className="main">
      Hello world!
      <div>
        <Link href="/lol">
          <button className="btn btn-outline btn-primary uppercase text-lg">
            Log in
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="size-5 -rotate-90"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </button>
        </Link>
      </div>
    </main>
  );
};

export default Index;
