import type { Metadata, NextPage } from 'next';

const applicationTitle = 'Streamarr';

const messages = ({
  title: 'Stream the greatest Movies, Series, Classics and more',
});

export const metadata: Metadata = {
  title: `${messages.title} - ${applicationTitle}`,
};

const Index: NextPage = () => {
  return(
    <main className='main'>
      Hello world!
    </main>
  );
};

export default Index;
