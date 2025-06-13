'use client';
import DropDownMenu from '@app/components/Common/DropDownMenu';
import UserCard from '@app/components/Layout/UserCard';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface UserDropdownProps {
  dropUp?: boolean;
  tooltip?: boolean;
}

const UserDropdown = ({
  dropUp = false,
  tooltip = false,
}: UserDropdownProps) => {
  const { user, revalidate } = useUser();
  const router = useRouter();
  const logout = async () => {
    const response = await axios.post('/api/v1/auth/logout');

    if (response.data?.status === 'ok') {
      revalidate();
    }
  };

  return (
    <div className="indicator">
      <span className="indicator-item indicator-bottom indicator-start left-2 bottom-2 badge badge-xs badge-error empty:block !hidden" />
      <DropDownMenu
        toolTip={tooltip}
        tiptitle="Account"
        dropdownIcon={
          <img
            className="h-7 w-7 rounded-full ring-2 ring-primary-content mr-1"
            src={user?.avatar}
            alt=""
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
        <DropDownMenu.Item
          href={`https://stats.${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.com`}
          target="_blank"
        >
          Watch Statistics
        </DropDownMenu.Item>
        <DropDownMenu.Item href="/help">Help Centre</DropDownMenu.Item>
        <DropDownMenu.Item href="https://discord.gg/ZSTrRJMcDS" target="_blank">
          Get Support
        </DropDownMenu.Item>
        <DropDownMenu.Item
          onClick={() => logout().then(() => router.push('/'))}
          divide="before"
        >
          Sign Out of {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
        </DropDownMenu.Item>
      </DropDownMenu>
    </div>
  );
};
export default UserDropdown;
