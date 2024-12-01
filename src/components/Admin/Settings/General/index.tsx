'use client';
import Button from '@app/components/Common/Button';
import CopyButton from '@app/components/Common/CopyButton';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

const GeneralSettings = () => {
  return (
    <>
      <form className="mt-6">
        <h3 className="text-2xl font-extrabold">General Settings</h3>
        <p className="mb-5">
          Configure global and default settings for Streamarr.
        </p>
        <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl">
          <label htmlFor="apiKey" className="">
            API Key
          </label>
          <div className="col-span-2">
            <div className="flex">
              <SensitiveInput
                type="text"
                id="apiKey"
                size={'sm'}
                className="input input-sm input-primary w-full"
                value={'Lorem ipsum odor'}
                readOnly
              />
              <CopyButton
                size="sm"
                textToCopy="Lorem ipsum odor"
                key={'copy'}
              />
              <Button
                type="button"
                buttonType="primary"
                buttonSize="sm"
                className="rounded-none only:rounded-md last:rounded-r-md"
                onClick={() =>
                  Toast({
                    icon: <XCircleIcon className="size-7" />,
                    title: 'Error: Failed to revalidate API',
                    type: 'error',
                  })
                }
              >
                <ArrowPathIcon className="size-5" />
              </Button>
            </div>
          </div>
          <label htmlFor="applicationTitle">Application Title</label>
          <div className="col-span-2">
            <input
              className="input input-primary input-sm w-full"
              placeholder="Streamarr"
            />
          </div>
          <label htmlFor="applicationTitle">Application URL</label>
          <div className="col-span-2">
            <input
              className="input input-primary input-sm w-full"
              placeholder="https://streamarr.nickelsh1ts.com"
            />
          </div>
          <label htmlFor="applicationTitle">Display Language</label>
          <div className="col-span-2">
            <select
              name="locale"
              className="select select-primary select-sm w-full"
              defaultValue={'English'}
            >
              <option value={'English'}>English</option>
              <option value={'Spanish'}>Spanish</option>
            </select>
          </div>
        </div>
        <div className="divider divider-primary mb-0 col-span-full" />
        <div className="flex justify-end col-span-3 mt-4">
          <Button type="submit" buttonSize="sm" buttonType="primary">
            <ArrowDownTrayIcon className="size-4 mr-2" /> Save Changes
          </Button>
        </div>
      </form>
      <div className="mt-6 mb-10">
        <h3 className="text-2xl font-extrabold">Invite Settings</h3>
        <p className="mb-5">
          Configure global and default invite settings for Streamarr.
        </p>
        <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl"></div>
        <div className="divider divider-primary mb-0 col-span-full" />
        <div className="flex justify-end col-span-3 mt-4">
          <Button type="submit" buttonSize="sm" buttonType="primary">
            <ArrowDownTrayIcon className="size-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
      <div className="mt-6 mb-10">
        <h3 className="text-2xl font-extrabold">Schedule Settings</h3>
        <p className="mb-5">
          Configure global and default schedule settings for Streamarr.
        </p>
        <div className="mt-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-center max-sm:space-y-4 max-sm:space-y-reverse max-w-5xl"></div>
        <div className="divider divider-primary mb-0 col-span-full" />
        <div className="flex justify-end col-span-3 mt-4">
          <Button type="submit" buttonSize="sm" buttonType="primary">
            <ArrowDownTrayIcon className="size-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>
    </>
  );
};
export default GeneralSettings;
