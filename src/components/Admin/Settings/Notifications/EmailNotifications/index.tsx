'use client';
import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';

//TODO implement email notifications functionality

const EmailNotifications = () => {
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
              className="checkbox checkbox-sm checkbox-primary rounded-md w-full"
            />
          </div>
        </div>
        <label htmlFor="senderName" className="text-label">
          Sender Name
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              className="input input-sm input-primary rounded-md w-full"
              id="senderName"
              name="senderName"
              type="text"
            />
          </div>
        </div>
        <label htmlFor="emailFrom" className="text-label">
          Sender Address
          <span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              id="emailFrom"
              name="emailFrom"
              type="text"
              inputMode="email"
              className="input input-sm input-primary rounded-md w-full"
            />
          </div>
        </div>
        <label htmlFor="smtpHost" className="text-label">
          SMTP Host
          <span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              id="smtpHost"
              name="smtpHost"
              type="text"
              inputMode="url"
              className="input input-sm input-primary rounded-md w-full"
            />
          </div>
        </div>
        <label htmlFor="smtpPort" className="text-label">
          SMTP Port
          <span className="ml-1 text-error">*</span>
        </label>
        <div className="sm:col-span-2">
          <input
            id="smtpPort"
            name="smtpPort"
            type="text"
            inputMode="numeric"
            className="input input-sm input-primary rounded-md w-1/6"
          />
        </div>
        <label htmlFor="encryption">
          Encryption Method
          <span className="ml-1 text-error">*</span>
          <span className="block">
            In most cases, Implicit TLS uses port 465 and STARTTLS uses port 587
          </span>
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <select
              id="encryption"
              name="encryption"
              className="select select-sm select-primary rounded-md w-full"
            >
              <option value="none">None</option>
              <option value="default">Use STARTTLS if available</option>
              <option value="opportunistic">Always use STARTTLS</option>
              <option value="implicit">Use Implicit TLS</option>
            </select>
          </div>
        </div>
        <label htmlFor="allowSelfSigned" className="checkbox-label">
          Allow Self-Signed Certificates
        </label>
        <div className="sm:col-span-2">
          <input
            type="checkbox"
            id="allowSelfSigned"
            name="allowSelfSigned"
            className="checkbox checkbox-sm checkbox-primary rounded-md w-full"
          />
        </div>
        <label htmlFor="authUser" className="text-label">
          SMTP Username
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <input
              id="authUser"
              name="authUser"
              type="text"
              className="input input-sm input-primary rounded-md w-full"
            />
          </div>
        </div>
        <label htmlFor="authPass" className="text-label">
          SMTP Password
        </label>
        <div className="sm:col-span-2">
          <div className="flex">
            <SensitiveInput
              id="authPass"
              name="authPass"
              buttonSize="sm"
              className="input input-sm input-primary rounded-md w-full"
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
export default EmailNotifications;
