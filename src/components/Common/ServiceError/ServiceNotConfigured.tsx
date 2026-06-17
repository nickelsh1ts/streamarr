'use client';
import Button from '@app/components/Common/Button';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { FormattedMessage } from 'react-intl';

interface ServiceNotConfiguredProps {
  serviceName: string;
  settingsPath?: string;
  isAdmin?: boolean;
  isAdminRoute?: boolean;
}

export default function ServiceNotConfigured({
  serviceName,
  settingsPath,
  isAdmin = false,
  isAdminRoute = false,
}: ServiceNotConfiguredProps) {
  const heightClass = isAdminRoute
    ? 'h-[calc(100dvh-11.6rem)] sm:h-[calc(100dvh-8.45rem)]'
    : 'h-[calc(100dvh-7.5rem)] sm:h-[calc(100dvh-4.35rem)]';

  return (
    <div
      className={`${heightClass} bg-base-300 flex flex-col items-center justify-center rounded-lg px-4`}
    >
      <div className="max-w-md text-center">
        <Cog6ToothIcon className="text-base-content/40 mx-auto mb-4 h-16 w-16" />
        <h2 className="text-base-content mb-2 text-2xl font-semibold">
          <FormattedMessage
            id="ServiceNotConfigured.title"
            defaultMessage="{serviceName} Not Enabled"
            values={{ serviceName }}
          />
        </h2>
        <p className="text-base-content/70 mb-6">
          {isAdmin ? (
            <FormattedMessage
              id="ServiceNotConfigured.descriptionAdmin"
              defaultMessage="{serviceName} hasn't been set up or enabled yet."
              values={{ serviceName }}
            />
          ) : (
            <FormattedMessage
              id="ServiceNotConfigured.descriptionUser"
              defaultMessage="{serviceName} is not available. Please contact your administrator."
              values={{ serviceName }}
            />
          )}
        </p>
        {isAdmin && settingsPath && (
          <Link href={settingsPath}>
            <Button buttonType="primary" buttonSize="sm">
              <Cog6ToothIcon className="mr-2 h-4 w-4" />
              <FormattedMessage
                id="ServiceNotConfigured.setUp"
                defaultMessage="Set Up {serviceName}"
                values={{ serviceName }}
              />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
