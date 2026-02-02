'use client';
import CachedImage from '@app/components/Common/CachedImage';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import UserCard from '@app/components/Layout/UserCard';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { socket } from '@app/utils/webSocket';
import type { NotificationResultsResponse } from '@server/interfaces/api/notificationInterfaces';
import type {
  UserSettingsGeneralResponse,
  UserSettingsNotificationsResponse,
} from '@server/interfaces/api/userSettingsInterfaces';
import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

interface UserDropdownProps {
  dropUp?: boolean;
  tooltip?: boolean;
}

const UserDropdown = ({
  dropUp = false,
  tooltip = false,
}: UserDropdownProps) => {
  const { user } = useUser();
  const { currentSettings } = useSettings();
  const { data: userSettings } = useSWR<UserSettingsGeneralResponse>(
    user ? `/api/v1/user/${user?.id}/settings/main` : null
  );
  const intl = useIntl();
  const { data: notificationSettings } =
    useSWR<UserSettingsNotificationsResponse>(
      user ? `/api/v1/user/${user?.id}/settings/notifications` : null
    );

  const { data, mutate: revalidate } = useSWR<NotificationResultsResponse>(
    user ? `/api/v1/user/${user?.id}/notifications` : null
  );
  const unread = data?.results.filter((notification) => !notification.isRead);

  useEffect(() => {
    socket.on('newNotification', () => {
      revalidate();
    });
  }, [revalidate]);

  return (
    <div className="indicator">
      {notificationSettings?.inAppEnabled && unread?.length > 0 && (
        <div className="indicator-item indicator-bottom indicator-start left-2 bottom-2 content-center pointer-events-none">
          <span className="absolute badge badge-xs badge-error text-xs top-1.5" />
          <span className="badge badge-xs badge-error text-xs animate-ping opacity-75" />
        </div>
      )}
      <DropDownMenu
        toolTip={tooltip}
        tiptitle={intl.formatMessage({
          id: 'userDropdown.account',
          defaultMessage: 'Account',
        })}
        dropdownIcon={
          <CachedImage
            className="h-9 w-9 rounded-full mr-1"
            src={user?.avatar}
            alt=""
            width={36}
            height={36}
          />
        }
        dropUp={dropUp}
      >
        <UserCard notifications={data} />
        <DropDownMenu.Item
          activeRegEx={/^\/profile\/?$/}
          divide="before"
          href="/profile"
        >
          <FormattedMessage
            id="profile.viewProfile"
            defaultMessage="View Profile"
          />
        </DropDownMenu.Item>
        <DropDownMenu.Item
          activeRegEx={/^\/profile\/settings\/?/}
          href="/profile/settings"
        >
          <FormattedMessage
            id="userDropdown.accountSettings"
            defaultMessage="Account Settings"
          />
        </DropDownMenu.Item>
        {userSettings?.tautulliEnabled && userSettings?.tautulliBaseUrl && (
          <DropDownMenu.Item href="/stats">
            <FormattedMessage
              id="userDropdown.watchHistory"
              defaultMessage="Watch History"
            />
          </DropDownMenu.Item>
        )}
        <DropDownMenu.Item href="/help">
          <FormattedMessage id="help.helpCentre" defaultMessage="Help Centre" />
        </DropDownMenu.Item>
        {(currentSettings.supportUrl || currentSettings.supportEmail) && (
          <DropDownMenu.Item
            href={
              currentSettings.supportUrl
                ? currentSettings.supportUrl
                : `mailto:${currentSettings.supportEmail.toLowerCase()}`
            }
            target="_blank"
          >
            <FormattedMessage
              id="userDropdown.getSupport"
              defaultMessage="Get Support"
            />
          </DropDownMenu.Item>
        )}
        <DropDownMenu.Item href="/logout" divide="before">
          <FormattedMessage
            id="userDropdown.signOut"
            defaultMessage="Sign Out of {applicationTitle}"
            values={{ applicationTitle: currentSettings.applicationTitle }}
          />
        </DropDownMenu.Item>
      </DropDownMenu>
    </div>
  );
};
export default UserDropdown;
