'use client';
import Button from '@app/components/Common/Button';
import ComingSoon from '@app/components/Common/ComingSoon';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import SetupSteps from '@app/components/Setup/SetupSteps';
import SignUpForm from '@app/components/SignUp/Form';
import useLocale from '@app/hooks/useLocale';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Join = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { locale } = useLocale();

  const finishSignup = async () => {
    setIsUpdating(true);
    const response = await axios.post<{ initialized: boolean }>(
      '/api/v1/signup/initialize'
    );

    setIsUpdating(false);
    if (response.data.initialized) {
      await axios.post('/api/v1/signup', { locale });
      router.push('/');
    }
  };

  return (
    <div className="relative flex flex-col items-center h-full w-full py-12">
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="px-4 sm:mx-auto w-full sm:max-w-4xl">
        <div className="mb-10 w-full text-white">
          <div className="mb-2 flex justify-center text-2xl font-bold">
            Welcome to {process.env.NEXT_PUBLIC_APP_NAME || 'Streamarr'}
          </div>
          <div className="mb-2 text-center text-sm">
            Registration is by invite only.
          </div>
        </div>
        <nav className="relative w-full">
          <ul
            className="divide-y divide-primary rounded-md border border-primary bg-primary bg-opacity-50 md:flex md:divide-y-0"
            style={{ backdropFilter: 'blur(5px)' }}
          >
            <SetupSteps
              stepNumber={1}
              description="Enter invite code"
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description="Sign in with Plex"
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <SetupSteps
              stepNumber={3}
              description="Confirm Account"
              active={currentStep === 3}
              isLastStep
            />
          </ul>
        </nav>
        <div className="mt-10 w-full rounded-md border border-secondary bg-secondary bg-opacity-50 backdrop-blur p-4 text-white">
          {currentStep === 1 && (
            <>
              <div className="mb-2 text-center pb-6 text-sm">
                Get started by entering your invite code below.
              </div>
              <SignUpForm onComplete={() => setCurrentStep(2)} />
            </>
          )}
          {currentStep === 3 && (
            <div>
              <p>Settings Services</p>
              <div className="actions">
                <div className="flex justify-end">
                  <span className="ml-3 inline-flex rounded-md shadow-sm">
                    <Button
                      buttonType="primary"
                      onClick={() => finishSignup()}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Completing...' : 'Complete Signup'}
                    </Button>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ComingSoon />
    </div>
  );
};

export default Join;
