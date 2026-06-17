'use client';
import SettingsPlex from '@app/components/Admin/Settings/Plex';
import { RESTART_REQUIRED_SWR_KEY } from '@app/components/Admin/Settings/RestartRequiredAlert';
import ServicesBazarr from '@app/components/Admin/Settings/Services/Bazarr';
import ServicesDownloads from '@app/components/Admin/Settings/Services/Downloads';
import ServicesLidarr from '@app/components/Admin/Settings/Services/Lidarr';
import ServicesProwlarr from '@app/components/Admin/Settings/Services/Prowlarr';
import SettingsServicesRadarr from '@app/components/Admin/Settings/Services/Radarr';
import SettingsServicesSonarr from '@app/components/Admin/Settings/Services/Sonarr';
import ServicesTautulli from '@app/components/Admin/Settings/Services/Tautulli';
import ServicesTdarr from '@app/components/Admin/Settings/Services/Tdarr';
import ServicesUptime from '@app/components/Admin/Settings/Services/Uptime';
import AppDataWarning from '@app/components/AppDataWarning';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import ImageFader from '@app/components/Common/ImageFader';
import Tabs from '@app/components/Common/Tabs';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import RestartModal from '@app/components/Setup/RestartModal';
import SetupSteps from '@app/components/Setup/SetupSteps';
import LoginWithPlex from '@app/components/Setup/SigninWithPlex';
import Toast from '@app/components/Toast';
import useLocale from '@app/hooks/useLocale';
import useSettings from '@app/hooks/useSettings';
import { useUser } from '@app/hooks/useUser';
import { XCircleIcon } from '@heroicons/react/24/solid';
import type { RestartStatusResponse } from '@server/interfaces/api/settingsInterfaces';
import axios from 'axios';
import Image from 'next/image';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR, { mutate } from 'swr';

const Setup = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [plexSettingsComplete, setPlexSettingsComplete] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restartServices, setRestartServices] = useState<string[]>([]);
  const { locale } = useLocale();
  const { revalidate } = useUser();
  const { currentSettings } = useSettings();
  const intl = useIntl();
  const logoSrc = currentSettings.customLogo || '/logo_full.png';

  const finishSetup = async () => {
    setIsUpdating(true);
    try {
      // Initialize the app
      const initResponse = await axios.post<{ initialized: boolean }>(
        '/api/v1/settings/initialize'
      );

      if (initResponse.data.initialized) {
        // Update main settings and refresh data
        await axios.post('/api/v1/settings/main', { locale });
        await Promise.all([mutate('/api/v1/settings/public'), revalidate()]);

        // Check if restart is required for any services
        try {
          const restartStatus = await axios.get<RestartStatusResponse>(
            RESTART_REQUIRED_SWR_KEY
          );

          if (restartStatus.data.required) {
            setRestartServices(restartStatus.data.services);
            setShowRestartModal(true);
            return;
          }
        } catch {
          // If check fails, just proceed to admin
        }

        // Redirect to admin page
        window.location.href = '/admin';
      }
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'setup.errorDuringSetup',
          defaultMessage: 'Error completing setup',
        }),
        message: e.message,
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12">
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          backdrops?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
          ) ?? ['/img/people-cinema-watching.jpg']
        }
      />
      <div className="absolute top-4 right-4 z-50">
        <LanguagePicker />
      </div>
      <div className="relative z-40 mt-4 px-4 sm:mx-auto sm:w-full sm:max-w-4xl xl:max-w-6xl">
        <Image
          src={logoSrc}
          className="mx-auto mb-10 max-w-full sm:max-w-md"
          alt="Logo"
          width={448}
          height={196}
          unoptimized={true}
        />
        <AppDataWarning />
        <nav className="relative z-50">
          <ul
            className="divide-primary border-primary bg-primary/50 divide-y rounded-md border md:flex md:divide-y-0"
            style={{ backdropFilter: 'blur(5px)' }}
          >
            <SetupSteps
              stepNumber={1}
              description={intl.formatMessage({
                id: 'setup.signInWithPlex',
                defaultMessage: 'Sign in with Plex',
              })}
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description={intl.formatMessage({
                id: 'setup.configurePlex',
                defaultMessage: 'Configure Plex',
              })}
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <SetupSteps
              stepNumber={3}
              description={intl.formatMessage({
                id: 'setup.configureServices',
                defaultMessage: 'Configure Services',
              })}
              active={currentStep === 3}
              isLastStep
            />
          </ul>
        </nav>
        <div className="border-secondary bg-secondary/50 mt-10 w-full rounded-md border p-4 text-white backdrop-blur">
          {currentStep === 1 && (
            <LoginWithPlex onComplete={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <div>
              <SettingsPlex onComplete={() => setPlexSettingsComplete(true)} />
              <div className="text-neutral mt-4 text-sm">
                <span className="mr-2">
                  <Badge>
                    <FormattedMessage id="setup.tip" defaultMessage="Tip" />
                  </Badge>
                </span>
                <FormattedMessage
                  id="setup.onlyEnabledLibraries"
                  defaultMessage="Only enabled libraries will be scanned."
                />
              </div>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      disabled={!plexSettingsComplete}
                      onClick={() => setCurrentStep(3)}
                    >
                      <FormattedMessage
                        id="common.continue"
                        defaultMessage="Continue"
                      />
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="flex flex-col gap-4">
              <Tabs
                tabs={[
                  {
                    id: 'arr-services',
                    title: intl.formatMessage({
                      id: 'setup.arrServices',
                      defaultMessage: '*Arr Services',
                    }),
                    content: (
                      <div className="flex flex-col gap-4">
                        <SettingsServicesRadarr />
                        <SettingsServicesSonarr />
                        <ServicesLidarr />
                      </div>
                    ),
                  },
                  {
                    id: 'media-services',
                    title: intl.formatMessage({
                      id: 'setup.mediaServices',
                      defaultMessage: 'Media Services',
                    }),
                    content: (
                      <div className="flex flex-col gap-4">
                        <ServicesProwlarr />
                        <ServicesBazarr />
                        <ServicesTdarr />
                      </div>
                    ),
                  },
                  {
                    id: 'monitoring',
                    title: intl.formatMessage({
                      id: 'setup.monitoring',
                      defaultMessage: 'Monitoring',
                    }),
                    content: (
                      <div className="flex flex-col gap-4">
                        <ServicesTautulli />
                        <ServicesUptime />
                      </div>
                    ),
                  },
                  {
                    id: 'downloads',
                    title: intl.formatMessage({
                      id: 'setup.downloads',
                      defaultMessage: 'Downloads',
                    }),
                    content: (
                      <div className="mb-4 flex flex-col gap-4">
                        <ServicesDownloads />
                      </div>
                    ),
                  },
                ]}
              />
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      onClick={() => finishSetup()}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <FormattedMessage
                          id="setup.finishing"
                          defaultMessage="Finishing setup…"
                        />
                      ) : (
                        <FormattedMessage
                          id="setup.finishSetup"
                          defaultMessage="Finish Setup"
                        />
                      )}
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <RestartModal
        show={showRestartModal}
        onSkip={() => {
          setShowRestartModal(false);
          window.location.href = '/admin';
        }}
        services={restartServices}
      />
    </div>
  );
};

export default Setup;
