'use client'
import DropDownMenu from '@app/components/Common/DropDownMenu';
import UserCard from '@app/components/Layout/UserCard';

interface UserDropdownProps {
  dropUp?: boolean;
  tooltip?: boolean;
}

const UserDropdown = ({dropUp = false, tooltip = false}: UserDropdownProps) => {
  return (
    <DropDownMenu
      toolTip={tooltip}
      tiptitle='Account'
      dropdownIcon={
        <img
          className="h-7 w-7 rounded-full ring-2 ring-primary-content mr-1"
          src="/android-chrome-192x192.png"
          alt="user"
        />
      }
      dropUp={dropUp}
    >
      <UserCard />
      <DropDownMenu.Item divide="before" href="/u/profile">
        View Profile
      </DropDownMenu.Item>
      <DropDownMenu.Item href="/u/profile/settings">
        Account Settings
      </DropDownMenu.Item>
      <DropDownMenu.Item href="https://stats.nickflixtv.com" target="_blank">
        Watch Statistics
      </DropDownMenu.Item>
      <DropDownMenu.Item href="/help">Help Centre</DropDownMenu.Item>
      <DropDownMenu.Item href="https://discord.gg/ZSTrRJMcDS" target="_blank">
        Get Support
      </DropDownMenu.Item>
      <DropDownMenu.Item href="/logout" divide="before">
        Log Out Of Streamarr
      </DropDownMenu.Item>
    </DropDownMenu>
  );
};
export default UserDropdown;
