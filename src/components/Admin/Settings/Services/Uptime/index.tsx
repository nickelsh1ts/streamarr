import Button from '@app/components/Common/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ServicesUptime = () => {
  return (
    <>
      <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
        <label htmlFor="service">
          Enable Uptime<span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary rounded-md"
            />
          </div>
        </div>
        <label htmlFor="UptimeBasePath" className="text-label">
          Uptime URL
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              className="input input-sm input-primary rounded-md w-full"
              id="senderName"
              name="senderName"
              type="text"
              placeholder="https://streamarr.nickelsh1ts.com/status"
            />
          </div>
        </div>
      </div>
      <div className="divider divider-primary mb-0 col-span-full" />
      <div className="flex justify-end col-span-3 mt-4">
        <Button type="submit" buttonSize="sm" buttonType="primary">
          <ArrowDownTrayIcon className="size-4 mr-2" /> Save Changes
        </Button>
      </div>
    </>
  );
};
export default ServicesUptime;
