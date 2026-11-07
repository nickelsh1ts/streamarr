'use client';
import Toast from '@app/components/Toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import type { PlexBulkSyncSummary } from '@server/lib/plexSync';
import { useIntl } from 'react-intl';

/** Warns about users a library change removed or failed to sync; returns true on failure. */
const usePlexSyncToast = () => {
  const intl = useIntl();

  return (plexSync?: PlexBulkSyncSummary | 'failed'): boolean => {
    if (!plexSync) {
      return false;
    }
    if (plexSync !== 'failed' && plexSync.removed) {
      Toast({
        title: intl.formatMessage(
          {
            id: 'userLibraries.savedUsersRemovedFromPlexMessage',
            defaultMessage:
              '{count, plural, one {# user was} other {# users were}} removed from the Plex server and {count, plural, one {has} other {have}} been deactivated.',
          },
          { count: plexSync.removed }
        ),
        type: 'warning',
        icon: <ExclamationTriangleIcon className="size-7" />,
      });
    }
    if (plexSync !== 'failed' && !plexSync.failed) {
      return false;
    }
    Toast({
      title: intl.formatMessage({
        id: 'userLibraries.savedPlexSyncFailed',
        defaultMessage: 'Settings saved, but Plex sync failed.',
      }),
      message:
        plexSync === 'failed'
          ? undefined
          : intl.formatMessage(
              {
                id: 'userLibraries.savedPlexSyncFailedMessage',
                defaultMessage:
                  'Changes were saved, but {count, plural, one {# user} other {# users}} could not be synced with Plex.',
              },
              { count: plexSync.failed }
            ),
      type: 'warning',
      icon: <ExclamationTriangleIcon className="size-7" />,
    });
    return true;
  };
};

export default usePlexSyncToast;
