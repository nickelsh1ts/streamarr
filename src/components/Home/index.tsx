import PageTitle from '@app/components/Common/PageTitle';
import CookiesBanner from '@app/components/CookiesBanner';
import Footer from '@app/components/Footer';
import DevicesSection from '@app/components/Home/DevicesSection';
import FAQSection from '@app/components/Home/FAQSection';
import HomeNavbar from '@app/components/Home/HomeNavbar';
import PromoSection from '@app/components/Home/PromoSection';
import RequestSection from '@app/components/Home/RequestSection';
import ServicesSection from '@app/components/Home/ServicesSection';
import WatchingSection from '@app/components/Home/WatchingSection';

const messages = {
  home: 'Stream the greatest Movies, Series, Classics and more',
};

const Setup = () => {
  return (
    <>
      <PageTitle title={messages.home} />
      <div className="body-purple">
        <HomeNavbar />
        <main className="m-0 p-0">
          <PromoSection />
          <RequestSection />
          <WatchingSection />
          <ServicesSection />
          <DevicesSection />
          <FAQSection />
        </main>
        <div className="container-fluid pe-none fixed-bottom">
          <CookiesBanner />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Setup;
