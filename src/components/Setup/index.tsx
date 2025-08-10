'use client';
import AppDataWarning from '@app/components/AppDataWarning';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import ImageFader from '@app/components/Common/ImageFader';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import SettingsPlex from '@app/components/Admin/Settings/Plex';
import LoginWithPlex from '@app/components/Setup/SigninWithPlex';
import SetupSteps from '@app/components/Setup/SetupSteps';
import useLocale from '@app/hooks/useLocale';
import useSettings from '@app/hooks/useSettings';
import axios from 'axios';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';
import SettingsServicesRadarr from '@app/components/Admin/Settings/Services/Radarr';
import SettingsServicesSonarr from '@app/components/Admin/Settings/Services/Sonarr';
import { useUser } from '@app/hooks/useUser';
import { FormattedMessage, useIntl } from 'react-intl';
import Toast from '@app/components/Toast';
import { XCircleIcon } from '@heroicons/react/24/solid';

const Setup = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [plexSettingsComplete, setPlexSettingsComplete] = useState(false);
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
      <div className="relative z-40 px-4 sm:mx-auto sm:w-full sm:max-w-4xl">
        <Image
          src={logoSrc}
          className="mb-10 max-w-full sm:mx-auto sm:max-w-md"
          alt="Logo"
          width={448}
          height={196}
          unoptimized={true}
        />
        <AppDataWarning />
        <nav className="relative z-50">
          <ul
            className="divide-y divide-primary rounded-md border border-primary bg-primary bg-opacity-50 md:flex md:divide-y-0"
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
        <div className="mt-10 w-full rounded-md border border-secondary bg-secondary bg-opacity-50 backdrop-blur p-4 text-white">
          {currentStep === 1 && (
            <LoginWithPlex onComplete={() => setCurrentStep(2)} />
          )}
          {currentStep === 2 && (
            <div>
              <SettingsPlex onComplete={() => setPlexSettingsComplete(true)} />
              <div className="mt-4 text-sm text-neutral-300">
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
              <SettingsServicesRadarr />
              <SettingsServicesSonarr />
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
                          defaultMessage="Finishing setup..."
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
    </div>
  );
};

export default Setup;
