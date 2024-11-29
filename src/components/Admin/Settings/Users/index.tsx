import PermissionEdit from '@app/components/Admin/PermissionEdit';
import Button from '@app/components/Common/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const UserSettings = () => {
  return (
    <div className="my-6">
      <h3 className="text-2xl font-extrabold">User Settings</h3>
      <p className="mb-5">Configure global and default user settings.</p>
      <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 items-start max-sm:space-y-4 max-sm:space-y-reverse">
        <label htmlFor="localLogin" className="font-bold block">
          Enable Local Sign-in
          <span className="text-sm block font-light text-neutral-300">
            Allow users to sign in using their email address and password,
            instead of Plex OAuth
          </span>
        </label>
        <div className="col-span-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary rounded-md"
          />
        </div>
        <label htmlFor="plexLogin" className="font-bold block">
          Enable New Plex Sign-in
          <span className="text-sm block font-light text-neutral-300">
            Allow Plex users to sign in without first being imported
          </span>
        </label>
        <div className="col-span-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary rounded-md"
          />
        </div>
        <span id="group-label" className="block font-bold">
          Default Permissions
          <span className="text-sm block font-light text-neutral-300">
            Initial permissions assigned to new users
          </span>
        </span>
        <div className="col-span-2">
          <div className="max-w-lg">
            <PermissionEdit />
          </div>
        </div>
        <div className="divider divider-primary mb-0 col-span-full" />
        <div className="flex justify-end col-span-3">
          <Button type="submit" buttonSize="sm" buttonType="primary">
            <ArrowDownTrayIcon className="size-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
export default UserSettings;
