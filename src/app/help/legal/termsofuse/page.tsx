'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import { useIntl } from 'react-intl';

const TermsPage = () => {
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/termsofuse"
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
            id: 'help.legal.termsTab',
            defaultMessage: 'Terms of Use',
          })
        }
      />
      <TermsOfUse />
    </section>
  );
};

export default TermsPage;
