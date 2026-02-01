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
      className={`${heightClass} flex flex-col items-center justify-center bg-base-300 px-4 rounded-lg`}
    >
      <div className="text-center max-w-md">
        <Cog6ToothIcon className="w-16 h-16 mx-auto mb-4 text-base-content/40" />
        <h2 className="text-2xl font-semibold text-base-content mb-2">
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
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
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
