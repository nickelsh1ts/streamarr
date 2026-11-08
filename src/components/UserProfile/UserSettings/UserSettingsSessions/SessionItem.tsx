'use client';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import useLocale from '@app/hooks/useLocale';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import type { UserSessionResponse } from '@server/interfaces/api/userSettingsInterfaces';
import { FormattedMessage } from 'react-intl';
import { UAParser } from 'ua-parser-js';

interface SessionItemProps {
  session: UserSessionResponse;
  onRevoke: (id: string) => void;
}

const loginMethodLabel = {
  plex: (
    <FormattedMessage
      id="userSettings.sessions.methodPlex"
      defaultMessage="Plex"
    />
  ),
  local: (
    <FormattedMessage
      id="userSettings.sessions.methodLocal"
      defaultMessage="Email & Password"
    />
  ),
  signup: (
    <FormattedMessage
      id="userSettings.sessions.methodSignup"
      defaultMessage="Invite Sign-Up"
    />
  ),
};

const SessionItem = ({ session, onRevoke }: SessionItemProps) => {
  const { locale } = useLocale();
  const parsedUserAgent = UAParser(session.userAgent ?? '');
  const { vendor, model, type: deviceType } = parsedUserAgent.device;

  const deviceName = !session.userAgent ? (
    <FormattedMessage
      id="userSettings.sessions.unknownDevice"
      defaultMessage="Unknown Device"
    />
  ) : vendor && model ? (
    `${vendor} ${model}`
  ) : (
    ({
      mobile: (
        <FormattedMessage
          id="userSettings.notifications.deviceTypeMobile"
          defaultMessage="Mobile Device"
        />
      ),
      tablet: (
        <FormattedMessage
          id="userSettings.notifications.deviceTypeTablet"
          defaultMessage="Tablet"
        />
      ),
      smarttv: (
        <FormattedMessage
          id="userSettings.notifications.deviceTypeSmartTv"
          defaultMessage="Smart TV"
        />
      ),
    }[deviceType ?? ''] ?? (
      <FormattedMessage
        id="userSettings.notifications.deviceTypeDesktop"
        defaultMessage="Desktop Computer"
      />
    ))
  );

  return (
    <div
      className="ring-primary relative flex w-full flex-col justify-between overflow-hidden rounded-xl bg-[#161616] py-4 shadow-md ring-1 xl:flex-row"
      data-testid="session-item"
    >
      <div className="relative flex w-full flex-col justify-between overflow-hidden sm:flex-row">
        <div className="relative z-10 flex w-full items-center overflow-hidden pr-4 pl-4 sm:pr-0 xl:w-7/12 2xl:w-2/3">
          <div className="relative h-auto w-12 shrink-0">
            {deviceType === 'mobile' ? (
              <DevicePhoneMobileIcon />
            ) : (
              <ComputerDesktopIcon />
            )}
          </div>
          <div className="flex flex-col justify-center overflow-hidden pl-2 xl:pl-4">
            <div className="pt-0.5 text-xs font-medium text-white sm:pt-1">
              {session.createdAt ? (
                <FormattedMessage
                  id="userSettings.sessions.signedIn"
                  defaultMessage="Signed in {date}"
                  values={{
                    date: moment(session.createdAt).locale(locale).format('LL'),
                  }}
                />
              ) : (
                'N/A'
              )}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="mr-2 min-w-0 truncate text-lg font-bold text-white xl:text-xl">
                {deviceName}
              </span>
            </div>
          </div>
        </div>
        <div className="z-10 mt-4 ml-4 flex w-full flex-col justify-center overflow-hidden pr-4 text-sm sm:mt-0 sm:ml-2 xl:flex-1 xl:pr-0">
          <div className="my-1 flex overflow-hidden whitespace-nowrap">
            <span className="mr-2">
              <FormattedMessage
                id="userSettings.operatingSystem"
                defaultMessage="Operating System"
              />
            </span>
            <span className="truncate text-gray-300">
              {parsedUserAgent.os.name ?? 'N/A'}
            </span>
          </div>
          <div className="my-1 flex overflow-hidden whitespace-nowrap">
            <span className="mr-2">
              <FormattedMessage
                id="userSettings.browser"
                defaultMessage="Browser"
              />
            </span>
            <span className="truncate text-gray-300">
              {parsedUserAgent.browser.name ?? 'N/A'}
            </span>
          </div>
          <div className="my-1 flex overflow-hidden whitespace-nowrap">
            <span className="mr-2">
              <FormattedMessage
                id="userSettings.sessions.lastActiveLabel"
                defaultMessage="Last Active"
              />
            </span>
            <span className="truncate text-gray-300">
              {
                // A client clock behind the server would otherwise read "in a few seconds"
                moment
                  .min(moment(session.lastActiveAt), moment())
                  .locale(locale)
                  .fromNow()
              }
            </span>
          </div>
          <div className="my-1 flex overflow-hidden whitespace-nowrap">
            <span className="mr-2">
              <FormattedMessage
                id="userSettings.sessions.signInMethod"
                defaultMessage="Sign-In Method"
              />
            </span>
            <span className="truncate text-gray-300">
              {session.loginMethod
                ? loginMethodLabel[session.loginMethod]
                : 'N/A'}
            </span>
          </div>
          {session.ipAddress && (
            <div className="my-1 flex overflow-hidden whitespace-nowrap">
              <span className="mr-2">
                <FormattedMessage
                  id="userSettings.sessions.ipAddress"
                  defaultMessage="IP Address"
                />
              </span>
              <span className="truncate text-gray-300">
                {session.ipAddress}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="z-10 mt-4 flex w-full flex-col justify-center space-y-2 pr-4 pl-4 xl:mt-0 xl:w-96 xl:items-end xl:pl-0">
        {session.current ? (
          <Button
            buttonType="primary"
            buttonSize="sm"
            className="w-full"
            disabled
          >
            <LockClosedIcon className="mr-2 size-5" />
            <span>
              <FormattedMessage
                id="userSettings.sessions.currentSession"
                defaultMessage="Current Device"
              />
            </span>
          </Button>
        ) : (
          <ConfirmButton
            buttonSize="sm"
            onClick={() => onRevoke(session.id)}
            confirmText={
              <FormattedMessage
                id="common.areYouSure"
                defaultMessage="Are you sure?"
              />
            }
            className="w-full"
            data-testid="session-revoke"
          >
            <TrashIcon className="mr-2 size-5" />
            <span>
              <FormattedMessage
                id="userSettings.sessions.revoke"
                defaultMessage="Revoke Device"
              />
            </span>
          </ConfirmButton>
        )}
      </div>
    </div>
  );
};

export default SessionItem;
