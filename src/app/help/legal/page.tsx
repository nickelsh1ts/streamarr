'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Cookies from '@app/components/Help/Legal/Cookies';
import Privacy from '@app/components/Help/Legal/Privacy';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { FormattedMessage, useIntl } from 'react-intl';

const LegalPage = () => {
  const intl = useIntl();
  return (
    <>
      <div className="text-neutral bg-zinc-100 py-5" style={null}>
        <Breadcrumbs
          paths="/legal"
          homeElement={intl.formatMessage({
            id: 'help.common.helpCentre',
            defaultMessage: 'Help Centre',
          })}
          names={intl.formatMessage({
            id: 'help.legal.breadcrumb',
            defaultMessage: 'Legal',
          })}
        />
      </div>
      <section className="my-auto bg-zinc-100 py-5">
        <main className="container mx-auto max-w-3xl place-content-center space-y-5 p-1 sm:p-4 lg:max-w-5xl xl:max-w-7xl">
          <div role="tablist" className="tabs tabs-lift overflow-x-auto">
            <input
              defaultChecked
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab checked:bg-secondary! text-primary border-none! font-extrabold whitespace-nowrap! checked:text-white"
              aria-label={intl.formatMessage({
                id: 'help.legal.termsTab',
                defaultMessage: 'Terms of Use',
              })}
            />
            <div
              role="tabpanel"
              className="tab-content rounded-box bg-zinc-200 p-2 md:p-6"
            >
              <div className="print:hidden">
                <Link
                  className="link-neutral flex place-items-center font-semibold max-md:m-2"
                  href="/help/legal/termsofuse"
                >
                  <FormattedMessage
                    id="help.legal.hyperlink"
                    defaultMessage="Hyperlink"
                  />{' '}
                  <ArrowTopRightOnSquareIcon className="ms-1 h-4 w-4" />
                </Link>
              </div>
              <TermsOfUse />
            </div>
            <input
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab checked:bg-secondary! text-primary border-none! font-extrabold whitespace-nowrap! checked:text-white"
              aria-label={intl.formatMessage({
                id: 'help.legal.privacyTab',
                defaultMessage: 'Privacy Statement',
              })}
            />
            <div
              role="tabpanel"
              className="tab-content rounded-box bg-zinc-200 p-2 md:p-6"
            >
              <div className="print:hidden">
                <Link
                  className="link-neutral flex place-items-center font-semibold max-md:m-2"
                  href="/help/legal/privacy"
                >
                  <FormattedMessage
                    id="help.legal.hyperlink"
                    defaultMessage="Hyperlink"
                  />{' '}
                  <ArrowTopRightOnSquareIcon className="ms-1 h-4 w-4" />
                </Link>
              </div>
              <Privacy />
            </div>
            <input
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab checked:bg-secondary! text-primary border-none! font-extrabold whitespace-nowrap! checked:text-white"
              aria-label={intl.formatMessage({
                id: 'help.legal.cookiesTab',
                defaultMessage: 'Cookie Policy',
              })}
            />
            <div
              role="tabpanel"
              className="tab-content rounded-box bg-zinc-200 p-2 md:p-6"
            >
              <div className="print:hidden">
                <Link
                  className="link-neutral flex place-items-center font-semibold max-md:m-2"
                  href="/help/legal/cookies"
                >
                  <FormattedMessage
                    id="help.legal.hyperlink"
                    defaultMessage="Hyperlink"
                  />{' '}
                  <ArrowTopRightOnSquareIcon className="ms-1 h-4 w-4" />
                </Link>
              </div>
              <Cookies />
            </div>
          </div>
        </main>
      </section>
    </>
  );
};

export default LegalPage;
