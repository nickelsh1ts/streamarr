'use client';
import Button from '@app/components/Common/Button';
import { BeakerIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const WebpushNotifications = () => {
  return (
    <>
      <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
        <label htmlFor="preset">
          Enable Agent<span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary rounded-md"
            />
          </div>
        </div>
      </div>
      <div className="divider divider-primary mb-0 col-span-full" />
      <div className="flex justify-end col-span-full mt-4">
        <span className="ml-3 inline-flex rounded-md shadow-sm">
          <Button
            buttonSize="sm"
            buttonType="warning"
            disabled={true}
            onClick={() => {}}
            className="disabled:bg-warning/30"
          >
            <BeakerIcon className="size-5 mr-2" />
            <span>Test</span>
          </Button>
        </span>
        <span className="ml-3 inline-flex rounded-md shadow-sm">
          <Button
            buttonSize="sm"
            buttonType="primary"
            type="submit"
            disabled={false}
          >
            <ArrowDownTrayIcon className="size-5 mr-2" />
            <span>Save Changes</span>
          </Button>
        </span>
      </div>
    </>
  );
};
export default WebpushNotifications;
