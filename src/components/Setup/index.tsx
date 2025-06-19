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
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';

const Setup = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [plexSettingsComplete, setPlexSettingsComplete] = useState(false);
  const router = useRouter();
  const { locale } = useLocale();

  const finishSetup = async () => {
    setIsUpdating(true);
    const response = await axios.post<{ initialized: boolean }>(
      '/api/v1/settings/initialize'
    );

    setIsUpdating(false);
    if (response.data.initialized) {
      await axios.post('/api/v1/settings/main', { locale });
      mutate('/api/v1/settings/public');

      router.push('/watch');
    }
  };

  const { data: backdrops } = useSWR<string[]>('/api/v1/backdrops', {
    refreshInterval: 0,
    refreshWhenHidden: false,
    revalidateOnFocus: false,
  });

  return (
    <div className="relative flex min-h-screen flex-col justify-center py-12">
      {backdrops ? (
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            backdrops?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop}`
            ) ?? []
          }
        />
      ) : (
        <div>
          <div
            className={`absolute-top-shift absolute inset-0 bg-cover bg-center transition-opacity duration-700 ease-in`}
          >
            <Image
              unoptimized
              className="absolute inset-0 h-full w-full"
              style={{ objectFit: 'cover' }}
              alt=""
              src={'/img/people-cinema-watching.jpg'}
              fill
            />
            <div
              className={`absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-dark via-brand-dark/75 via-65% lg:via-40% to-80% to-brand-dark/0`}
            />
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 z-50">
        <LanguagePicker />
      </div>
      <div className="relative z-40 px-4 sm:mx-auto sm:w-full sm:max-w-4xl">
        <Image
          src={`${process.env.NEXT_PUBLIC_LOGO ? process.env.NEXT_PUBLIC_LOGO : '/logo_full.png'}`}
          className="mb-10 max-w-full sm:mx-auto sm:max-w-md"
          alt="Logo"
          width={448}
          height={196}
        />
        <AppDataWarning />
        <nav className="relative z-50">
          <ul
            className="divide-y divide-primary rounded-md border border-primary bg-primary bg-opacity-50 md:flex md:divide-y-0"
            style={{ backdropFilter: 'blur(5px)' }}
          >
            <SetupSteps
              stepNumber={1}
              description="Sign in with Plex"
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description="Configure Plex"
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <SetupSteps
              stepNumber={3}
              description="Configure Services"
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
                  <Badge>Tip</Badge>
                </span>
                Scanning will run in the background. You can continue the setup
                process in the meantime.
              </div>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      disabled={!plexSettingsComplete}
                      onClick={() => setCurrentStep(3)}
                    >
                      Continue
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <p>Settings Services</p>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      onClick={() => finishSetup()}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Finishing...' : 'Finish Setup'}
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
