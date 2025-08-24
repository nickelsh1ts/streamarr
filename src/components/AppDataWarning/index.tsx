import Alert from '@app/components/Common/Alert';
import useSWR from 'swr';
import { FormattedMessage } from 'react-intl';

const AppDataWarning = () => {
  const { data, error } = useSWR<{ appData: boolean; appDataPath: string }>(
    '/api/v1/status/appdata'
  );

  const appDataPath = '/app/config';

  if (!data && !error) {
    return null;
  }

  if (!data) {
    return null;
  }

  return (
    <>
      {!data.appData && (
        <Alert
          title={
            <FormattedMessage
              id="appData.warning"
              defaultMessage="The <code>{appDataPath}</code> volume mount was not configured properly. All data will be cleared when the container is stopped or restarted."
              values={{
                appDataPath,
                code: (chunks: React.ReactNode) => <code>{chunks}</code>,
              }}
            />
          }
        />
      )}
    </>
  );
};

export default AppDataWarning;
