import PageTitle from '@app/components/Common/PageTitle';
import Footer from '@app/components/Footer';
import BreadCrumbs from '@app/components/Help/BreadCrumbs';
import TermsStatement from '@app/components/Help/TermsOfUse/TermsStatement';
import PrintButton from '@app/components/PrintButton';
import ThinNav from '@app/components/ThinNav';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TermsOfUse = () => {
  const messages = {
    terms: 'Terms Of Use',
  };

  return (
    <>
      <PageTitle title={messages.terms} />
      <ThinNav />
      <div className="d-flex d-print-none mb-5 flex-wrap">
        <BreadCrumbs
          separator={<FontAwesomeIcon icon={faChevronRight} />}
          activeClasses="link-secondary"
          listClasses="nav-link link-purple"
          capitalizeLinks
          pages="Help/Legal/Terms Of Use"
        />
        <PrintButton />
      </div>
      <TermsStatement />
      <Footer />
    </>
  );
};

export default TermsOfUse;
