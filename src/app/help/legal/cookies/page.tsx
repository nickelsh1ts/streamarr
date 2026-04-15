'use client'
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Cookies from '@app/components/Help/Legal/Cookies';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';
import { useIntl } from 'react-intl';

export const generateMetadata = () => generatePageMetadata('Cookie Policy');

const CookiesPage = () => {
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/cookies"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={
          intl.formatMessage({
            id: 'help.legal.breadcrumb',
            defaultMessage: 'Legal',
          }) +
          ',' +
          intl.formatMessage({
            id: 'help.legal.cookiesTab',
            defaultMessage: 'Cookie Policy',
          })
        }
      />
      <Cookies />
    </section>
  );
};

export default CookiesPage;
