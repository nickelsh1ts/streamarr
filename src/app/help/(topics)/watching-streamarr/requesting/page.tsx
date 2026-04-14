'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import {
  StarIcon,
  ClockIcon,
  BellIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import type { SeerrQuotaResponse } from '@server/interfaces/api/seerrInterfaces';
import Image from 'next/image';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const useSeerrQuota = () => {
  const { data, error, isLoading } = useSWR<SeerrQuotaResponse>(
    '/api/v1/settings/public/seerr/quota',
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    quota: data,
    error,
    isLoading,
  };
};

const useSeerrUserQuota = () => {
  const { user } = useUser();
  const { data, error, isLoading } = useSWR<SeerrQuotaResponse>(
    user ? `/api/v1/user/${user.id}/settings/seerr/quota` : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  );

  return {
    userQuota: data,
    error,
    isLoading,
  };
};

const HelpContent = () => {
  const { currentSettings } = useSettings();
  const { quota } = useSeerrQuota();
  const { userQuota } = useSeerrUserQuota();

  // Use user-specific quotas if they exist, otherwise fall back to defaults
  const hasUserMovieQuota =
    userQuota?.movieQuotaLimit !== undefined &&
    userQuota?.movieQuotaLimit !== null;
  const hasUserTvQuota =
    userQuota?.tvQuotaLimit !== undefined && userQuota?.tvQuotaLimit !== null;

  const effectiveQuota = {
    movieQuotaLimit: hasUserMovieQuota
      ? userQuota.movieQuotaLimit
      : (quota?.movieQuotaLimit ?? null),
    movieQuotaDays: hasUserMovieQuota
      ? (userQuota.movieQuotaDays ?? null)
      : (quota?.movieQuotaDays ?? null),
    tvQuotaLimit: hasUserTvQuota
      ? userQuota.tvQuotaLimit
      : (quota?.tvQuotaLimit ?? null),
    tvQuotaDays: hasUserTvQuota
      ? (userQuota.tvQuotaDays ?? null)
      : (quota?.tvQuotaDays ?? null),
  };

  return (
    <>
      <div className="font-extrabold" id="requesting">
        <FormattedMessage
          id="help.requesting.title"
          defaultMessage="Requesting new media"
        />
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li className="">
          <FormattedMessage
            id="help.requesting.step1"
            defaultMessage="Sign in to {appTitle} and select {seerrLogo}"
            values={{
              appTitle: currentSettings.applicationTitle,
              seerrLogo: (
                <Image
                  className="h-auto w-20 inline-flex self-center mx-1"
                  src="/external/seerr-logo_full_dark.svg"
                  alt="Seerr"
                  width={112}
                  height={48}
                />
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.step2"
            defaultMessage="Search for any movie or show or locate via discovery"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.step3"
            defaultMessage="Open the media discovery page by selecting it"
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.step4"
            defaultMessage='Select the "Request" option and if relevant select which season(s)'
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.step5"
            defaultMessage="Once your request has been approved by a moderator, it will begin downloading"
          />
        </li>
      </ul>
      <p className="italic text-sm my-4" id="importantinfo">
        <FormattedMessage
          id="help.common.importantInfo"
          defaultMessage="Important Information"
        />
      </p>
      <ul className="list list-disc ms-14 my-4">
        <li>
          <FormattedMessage
            id="help.requesting.info1"
            defaultMessage="Each individual request is processed the moment it's approved, or in the event it's auto-approved, immediately."
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.info2"
            defaultMessage="The time in which it takes to become available on {appTitle} can depend on many factors such as the release date (older media can be more difficult to find), the popularity, and the quality."
            values={{
              appTitle: (
                <span className="text-primary">
                  {currentSettings.applicationTitle}
                </span>
              ),
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.info3"
            defaultMessage="Keep an eye on {seerr}, or watch for the Media Available notification."
            values={{
              seerr: <span className="text-primary">Seerr</span>,
            }}
          />
        </li>
        <li>
          <FormattedMessage
            id="help.requesting.info4"
            defaultMessage="{appTitle} supports multiple types of notifications, all of which can be managed via your notification settings. {channels}"
            values={{
              appTitle: (
                <span className="text-primary">
                  {currentSettings.applicationTitle}
                </span>
              ),
              channels: <i>(In-App, Push Notifications, and Email)</i>,
            }}
          />
        </li>
        <li>
          <span className="text-primary">
            {currentSettings.applicationTitle}
          </span>{' '}
          {effectiveQuota.movieQuotaLimit || effectiveQuota.tvQuotaLimit ? (
            <FormattedMessage
              id="help.requesting.quotaDetails"
              defaultMessage="currently allows for a maximum of {movieLimit} Movie requests{moviePeriod} and a maximum of {tvLimit} Season requests{tvPeriod}, per member."
              values={{
                movieLimit: (
                  <span className="text-info font-extrabold underline">
                    {effectiveQuota.movieQuotaLimit ?? 'unlimited'}
                  </span>
                ),
                moviePeriod: effectiveQuota.movieQuotaDays
                  ? ` every ${effectiveQuota.movieQuotaDays} day${effectiveQuota.movieQuotaDays !== 1 ? 's' : ''}`
                  : '',
                tvLimit: (
                  <span className="text-info font-extrabold underline">
                    {effectiveQuota.tvQuotaLimit ?? 'unlimited'}
                  </span>
                ),
                tvPeriod: effectiveQuota.tvQuotaDays
                  ? ` every ${effectiveQuota.tvQuotaDays} day${effectiveQuota.tvQuotaDays !== 1 ? 's' : ''}`
                  : '',
              }}
            />
          ) : quota ? (
            <FormattedMessage
              id="help.requesting.noQuota"
              defaultMessage="currently has no request limits configured."
            />
          ) : (
            <FormattedMessage
              id="help.requesting.quotaGeneric"
              defaultMessage="may have request limits that apply per member."
            />
          )}
        </li>
      </ul>
    </>
  );
};

const anchors = [
  { href: '#requesting', title: 'Requesting' },
  { href: '#importantinfo', title: 'Important Info' },
];

const Heading = () => {
  return (
    <span className="flex flex-wrap place-items-center border-b-2 gap-x-2 border-zinc-500 pb-4">
      <FormattedMessage
        id="help.requesting.headingText"
        defaultMessage="Request new media with"
      />
      <Image
        className="h-auto w-28"
        src="/external/seerr-logo_full_dark.svg"
        alt="Seerr"
        width={176}
        height={44}
      />
    </span>
  );
};

const Benefits = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black bg-primary h-fit">
          <StarIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            <FormattedMessage
              id="help.requesting.discoverTitle"
              defaultMessage="The best way to discover media"
            />
          </p>
          <p>
            <FormattedMessage
              id="help.requesting.discoverDesc"
              defaultMessage="Seerr helps you find media you want to watch. With inline recommendations and suggestions, you will find yourself deeper and deeper in a rabbit hole of content you never knew you just had to have."
            />
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <ClockIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            <FormattedMessage
              id="help.requesting.easyTitle"
              defaultMessage="Requesting has never been so easy"
            />
          </p>
          <p>
            <FormattedMessage
              id="help.requesting.easyDesc"
              defaultMessage="Seerr presents you with a request interface that is incredibly easy to understand and use. You can select the exact seasons you want to watch."
            />
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <BellIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            <FormattedMessage
              id="help.requesting.notificationsTitle"
              defaultMessage="Notifications"
            />
          </p>
          <p>
            <FormattedMessage
              id="help.requesting.notificationsDesc"
              defaultMessage="Several notification agents are directly supported, including email, Discord and web push."
            />
          </p>
        </div>
      </div>
      <div className="flex align-items-start">
        <span className="rounded me-3 relative p-2 text-white print:text-black  bg-primary h-fit">
          <DevicePhoneMobileIcon className="w-8 h-8" />
        </span>
        <div>
          <p className="font-extrabold text-lg">
            <FormattedMessage
              id="help.requesting.mobileTitle"
              defaultMessage="Mobile-Friendly Experience"
            />
          </p>
          <p>
            <FormattedMessage
              id="help.requesting.mobileDesc"
              defaultMessage="Use Seerr as a near-native mobile app by adding it to your home screen. Seerr is designed for use on any screen size."
            />
          </p>
        </div>
      </div>
    </div>
  );
};

const Requesting = () => {
  const { currentSettings } = useSettings();
  const intl = useIntl();

  if (!currentSettings.seerrEnabled) {
    return (
      <section className="text-neutral bg-zinc-100 py-5">
        <Breadcrumbs
          paths="/watching-streamarr/requesting"
          homeElement={intl.formatMessage({
            id: 'help.common.helpCentre',
            defaultMessage: 'Help Centre',
          })}
          names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.requesting.breadcrumb', defaultMessage: 'Request new media with Seerr' })}`}
        />
        <HelpCard
          heading={intl.formatMessage({
            id: 'help.requesting.unavailableHeading',
            defaultMessage: 'Requesting New Media',
          })}
          subheading={intl.formatMessage(
            {
              id: 'help.requesting.unavailableDesc',
              defaultMessage:
                'Media requests are not currently available on {appTitle}. The Seerr request service has not been configured. Please contact the server admin for more information.',
            },
            { appTitle: currentSettings.applicationTitle }
          )}
          anchors={[]}
          content={<></>}
        />
      </section>
    );
  }

  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/watching-streamarr/requesting"
        homeElement={intl.formatMessage({
          id: 'help.common.helpCentre',
          defaultMessage: 'Help Centre',
        })}
        names={`${intl.formatMessage({ id: 'help.watching.breadcrumb', defaultMessage: 'Watching {appTitle}' }, { appTitle: currentSettings.applicationTitle })},${intl.formatMessage({ id: 'help.requesting.breadcrumb', defaultMessage: 'Request new media with Seerr' })}`}
      />
      <HelpCard
        heading={<Heading />}
        subheading={<Benefits />}
        anchors={anchors}
        content={<HelpContent />}
      />
    </section>
  );
};

export default Requesting;
