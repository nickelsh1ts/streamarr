import Footer from '@app/components/Layout/Footer';
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
  return (<>
    <main className="main text-center my-auto">
      <h1 className='text-2xl'>Hello world!</h1>
      <div className='h-[]'>
        <Link href="/test">
        </Link>
      </div>
    </main>
    <Footer /></>
  );
};

export default Index;
