'use client';
import CachedImage from '@app/components/Common/CachedImage';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import UserCard from '@app/components/Layout/UserCard';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';

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

  return (
    <div className="indicator">
      <span className="indicator-item indicator-bottom indicator-start left-2 bottom-2 badge badge-xs badge-error empty:block !hidden" />
      <DropDownMenu
        toolTip={tooltip}
        tiptitle="Account"
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
        <UserCard />
        <DropDownMenu.Item
          activeRegEx={/^\/profile\/?$/}
          divide="before"
          href="/profile"
        >
          View Profile
        </DropDownMenu.Item>
        <DropDownMenu.Item
          activeRegEx={/^\/profile\/settings\/?/}
          href="/profile/settings"
        >
          Account Settings
        </DropDownMenu.Item>
        {currentSettings?.statsUrl && (
          <DropDownMenu.Item
            href={currentSettings?.statsUrl.toLowerCase()}
            target="_blank"
          >
            Watch History
          </DropDownMenu.Item>
        )}
        <DropDownMenu.Item href="/help">Help Centre</DropDownMenu.Item>
        {(currentSettings.supportUrl || currentSettings.supportEmail) && (
          <DropDownMenu.Item
            href={
              currentSettings.supportUrl
                ? currentSettings.supportUrl
                : `mailto:${currentSettings.supportEmail.toLowerCase()}`
            }
            target="_blank"
          >
            Get Support
          </DropDownMenu.Item>
        )}
        <DropDownMenu.Item href="/logout" divide="before">
          Sign Out of {currentSettings.applicationTitle}
        </DropDownMenu.Item>
      </DropDownMenu>
    </div>
  );
};
export default UserDropdown;
