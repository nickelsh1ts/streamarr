'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import Tooltip from '@app/components/Common/ToolTip';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const PlexSettings = () => {
  return (
    <form className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
      <h3 className="text-2xl font-extrabold">Plex Settings</h3>
      <p className="mb-5">
        Configure the settings for your Plex server. Streamarr scans your Plex
        libraries to generate menus.
      </p>
      <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
        <label htmlFor="preset">Server</label>
        <div className="sm:col-span-2">
          <div className="flex">
            <select
              id="preset"
              name="preset"
              className="select select-sm select-primary rounded-md rounded-r-none w-full disabled:border disabled:border-primary"
              disabled
              onChange={() => {}}
            >
              <option value="manual">
                Press the button to load available servers
              </option>
            </select>
            <button
              onClick={() => {}}
              className="btn btn-sm btn-primary rounded-md rounded-l-none"
            >
              <ArrowPathIcon className={'size-5'} />
            </button>
          </div>
        </div>
        <label htmlFor="hostname">
          Hostname or IP Address
          <span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 h-8 text-primary-content sm:text-sm">
              https://
            </span>
            <input
              type="url"
              className="input input-sm input-primary rounded-md rounded-l-none w-full"
              placeholder="10-22-28-32.7784031cf6754139a9037480f001fb54.plex.direct"
            />
          </div>
        </div>
        <label htmlFor="port">
          Port
          <span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            inputMode="numeric"
            id="port"
            name="port"
            className="input input-sm input-primary w-1/6 rounded-md"
            placeholder="32400"
          />
        </div>
        <label htmlFor="ssl" className="checkbox-label">
          Use SSL
        </label>
        <div className="sm:col-span-2">
          <input
            type="checkbox"
            id="useSsl"
            name="useSsl"
            defaultChecked
            onChange={() => {}}
            className="checkbox checkbox-sm checkbox-primary rounded-md"
          />
        </div>
        <label htmlFor="webAppUrl">
          <a
            href="https://support.plex.tv/articles/200288666-opening-plex-web-app/"
            target="_blank"
            rel="noreferrer"
            className="link-hover"
          >
            Web App
          </a>{' '}
          URL
          <Tooltip
            content={
              'Incorrectly configuring this setting may result in broken functionality'
            }
          >
            <Badge badgeType="error" className="ml-2">
              Advanced
            </Badge>
          </Tooltip>
          <span className="block text-neutral-300 text-sm">
            Optionally direct users to the web app on your server instead of the
            &quot;hosted&quot; web app
          </span>
        </label>
        <div className="sm:col-span-2">
          <div className="form-input-field">
            <input
              type="text"
              inputMode="url"
              id="webAppUrl"
              name="webAppUrl"
              placeholder="https://app.plex.tv/desktop"
              className="input input-sm input-primary rounded-md w-full"
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
    </form>
  );
};
export default PlexSettings;
