'use client';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { UAParser } from 'ua-parser-js';
import { FormattedMessage } from 'react-intl';
import useLocale from '@app/hooks/useLocale';
import { momentWithLocale as moment } from '@app/utils/momentLocale';

interface DeviceItemProps {
  deletePushSubscriptionFromBackend: (endpoint: string) => void;
  device: {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
    createdAt: Date;
  };
  subEndpoint: string | null;
}

const DeviceItem = ({
  deletePushSubscriptionFromBackend,
  device,
  subEndpoint,
}: DeviceItemProps) => {
  const { locale } = useLocale();
  const parsedUserAgent = UAParser(device.userAgent);

  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-[#161616] py-4 shadow-md ring-1 ring-primary xl:h-28 xl:flex-row">
      <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
        <div className="relative z-10 flex w-full items-center overflow-hidden pl-4 pr-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
          <div className="relative h-auto w-12 flex-shrink-0 scale-100 transform-gpu overflow-hidden rounded-md transition duration-300 hover:scale-105">
            {parsedUserAgent.device.type === 'mobile' ? (
              <DevicePhoneMobileIcon />
            ) : (
              <ComputerDesktopIcon />
            )}
          </div>
          <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
            <div className="pt-0.5 text-xs font-medium text-white sm:pt-1">
              {device.createdAt
                ? moment(device.createdAt).locale(locale).format('LL')
                : 'N/A'}
            </div>
            <div className="mr-2 min-w-0 truncate text-lg font-bold text-white hover:underline xl:text-xl">
              {device.userAgent && parsedUserAgent.device.model ? (
                parsedUserAgent.device.model
              ) : (
                <FormattedMessage
                  id="common.unknown"
                  defaultMessage="Unknown"
                />
              )}
            </div>
          </div>
        </div>
        <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:ml-2 sm:mt-0 xl:flex-1 xl:pr-0">
          <div className="my-1 flex align-items-center overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="mr-2 ">
              <FormattedMessage
                id="userSettings.operatingSystem"
                defaultMessage="Operating System"
              />
            </span>
            <span className="flex truncate text-sm text-gray-300">
              {device.userAgent ? parsedUserAgent.os.name : 'N/A'}
            </span>
          </div>
          <div className="my-1 flex align-items-center overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="mr-2 ">
              <FormattedMessage
                id="userSettings.browser"
                defaultMessage="Browser"
              />
            </span>
            <span className="flex truncate text-sm text-gray-300">
              {device.userAgent ? parsedUserAgent.browser.name : 'N/A'}
            </span>
          </div>
          <div className="my-1 flex align-items-center overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="mr-2 ">
              <FormattedMessage
                id="userSettings.engine"
                defaultMessage="Engine"
              />
            </span>
            <span className="flex truncate text-sm text-gray-300">
              {device.userAgent ? parsedUserAgent.engine.name : 'N/A'}
            </span>
          </div>
        </div>
      </div>
      <div className="z-10 mt-4 flex w-full flex-col justify-center space-y-2 pl-4 pr-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
        {subEndpoint === device.endpoint ? (
          <Button
            buttonType="primary"
            buttonSize="md"
            className="w-full"
            disabled
          >
            <LockClosedIcon className="size-7 mr-2" />{' '}
            <span>
              <FormattedMessage
                id="userSettings.notifications.subscriptionActive"
                defaultMessage="Active Subscription"
              />
            </span>
          </Button>
        ) : (
          <ConfirmButton
            onClick={() => deletePushSubscriptionFromBackend(device.endpoint)}
            confirmText={
              <FormattedMessage
                id="common.areYouSure"
                defaultMessage="Are you sure?"
              />
            }
            className="w-full"
          >
            <TrashIcon className="size-7 mr-2" />
            <span>
              <FormattedMessage
                id="userSettings.notifications.deleteSubscription"
                defaultMessage="Delete Subscription"
              />
            </span>
          </ConfirmButton>
        )}
      </div>
    </div>
  );
};

export default DeviceItem;
