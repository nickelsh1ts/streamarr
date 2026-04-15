'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Privacy from '@app/components/Help/Legal/Privacy';
import { useIntl } from 'react-intl';

const PrivacyPage = () => {
  const intl = useIntl();
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/legal/privacy"
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
            id: 'help.legal.privacyTab',
            defaultMessage: 'Privacy Statement',
          })
        }
      />
      <Privacy />
    </section>
  );
};

export default PrivacyPage;
