import FooterAbout from '@app/components/Footer/FooterAbout';
import FooterBrand from '@app/components/Footer/FooterBrand';
import FooterHelp from '@app/components/Footer/FooterHelp';
import FooterSocials from '@app/components/Footer/FooterSocials';
import FooterThanks from '@app/components/Footer/FooterThanks';
import ScrollToTopBtn from '@app/components/ScrollToTopBtn';
import useSettings from '@app/hooks/useSettings';

const dateYear = new Date().getFullYear();

const Footer = () => {
  const settings = useSettings();
  const messages = {
    CompanyTitle: `${settings.currentSettings.companyTitle}`,
  };

  return (
    <>
      <footer
        id="footer"
        className="footer d-print-none mt-auto py-3"
        style={{ background: 'rgba(8,0,17,1)' }}
      >
        <ScrollToTopBtn />
        <FooterSocials />
        <div className="text-muted text-white-50 container">
          <div className="row">
            <FooterBrand />
            <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 col-lg-8 offset-lg-1">
              <FooterAbout />
              <FooterHelp />
              <FooterThanks />
            </div>
          </div>
          <p style={{ fontSize: '0.8rem' }}>
            © {dateYear} {messages.CompanyTitle}.com
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;
