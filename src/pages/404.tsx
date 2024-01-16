import PageTitle from '@app/components/Common/PageTitle';
import Footer from '@app/components/Footer';
import ThinNav from '@app/components/ThinNav';
import { faBackward } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  errormessagewithcode: '{statusCode} - {error}',
  pagenotfound: 'Hmm, looks like that page doesn&apos;t exist.',
  returnHome: 'Let&apos;s Rewind',
});

const Custom404 = () => {
  const router = useRouter();
  const intl = useIntl();

  return (
    <section className="page_404">
      <PageTitle title={intl.formatMessage(messages.pagenotfound)} />
      <ThinNav />
      <div className="container">
        <div className="row">
          <div className="col">
            <div className="col text-center">
              <div className="four_zero_four_bg">
                <h1 className="text-dark fw-bold text-center">404</h1>
              </div>
              <div className="contant_box_404 text-dark">
                <h2 className="lost-space">
                  LOST IN{' '}
                  <s className="ntv-purple">
                    <span className="text-dark">SPACE</span>
                  </s>{' '}
                  STREAMING?
                </h2>
                <p>
                  {intl.formatMessage(messages.errormessagewithcode, {
                    statusCode: 404,
                    error: intl.formatMessage(messages.pagenotfound),
                  })}
                </p>
                <>
                  <button
                    onClick={() => router.back()}
                    className="btn btn-outline-purple fw-bolder fs-5 my-3"
                  >
                    <span className="fs-5">
                      {intl.formatMessage(messages.returnHome)}
                      <FontAwesomeIcon icon={faBackward} />
                    </span>
                  </button>
                </>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
};

export default Custom404;
