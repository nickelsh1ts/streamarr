import Footer from '@app/components/Footer';
import BreadCrumbs from '@app/components/Help/BreadCrumbs';
import MoreHelp from '@app/components/Help/MoreHelp';
import PrintButton from '@app/components/PrintButton';
import ThinNav from '@app/components/ThinNav';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type LayoutProps = {
  children: React.ReactNode;
};

const HelpPages = ({ children }: LayoutProps) => {
  return (
    <>
      <ThinNav />
      <div className="d-flex d-print-none mb-5 flex-wrap">
        <BreadCrumbs
          separator={<FontAwesomeIcon icon={faChevronRight} />}
          activeClasses="link-secondary"
          listClasses="nav-link link-purple"
          capitalizeLinks
          pages="help/watching streamarr"
        />
        <PrintButton />
      </div>
      {children}
      <MoreHelp />
      <Footer />
    </>
  );
};

export default HelpPages;
