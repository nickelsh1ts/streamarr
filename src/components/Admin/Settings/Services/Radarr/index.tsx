import Button from '@app/components/Common/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ServicesRadarr = () => {
  return (
    <>
      <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
        <label htmlFor="service">
          Enable Radarr<span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary rounded-md"
            />
          </div>
        </div>
        <label htmlFor="radarrBasePath" className="text-label">
          Radarr Base Path
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 text-primary-content sm:text-sm">
              https://streamarr.nickelsh1ts.com
            </span>
            <input
              className="input input-sm input-primary rounded-md w-1/2 rounded-l-none"
              id="senderName"
              name="senderName"
              type="text"
              placeholder="/admin/radarr"
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
export default ServicesRadarr;
