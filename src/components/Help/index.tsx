import HelpHeader from '@app/components/Help/Header';
import MoreHelp from '@app/components/Help/MoreHelp';
import PopularTopics from '@app/components/Help/PopularTopics';
import Topics from '@app/components/Help/Topics';
import Footer from '@app/components/Layout/Footer';

const Help = () => {
  return (
    <main>
      <HelpHeader />
      <PopularTopics />
      <Topics />
      <MoreHelp />
      <Footer />
    </main>
  );
};

export default Help;
