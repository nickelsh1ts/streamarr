'use client';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import SetupSteps from '@app/components/Setup/SetupSteps';
import ConfirmAccountForm from '@app/components/SignUp/Forms/ConfirmAccountForm';
import ICodeForm from '@app/components/SignUp/Forms/ICodeForm';
import SignUpAuthForm from '@app/components/SignUp/Forms/SignUpAuthForm';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { XCircleIcon } from '@heroicons/react/24/solid';
import type { User } from '@server/entity/User';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const Join = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const router = useRouter();
  const { currentSettings } = useSettings();

  // Step 3: Finalize signup
  const finishSignup = async () => {
    if (!user || !inviteCode) return;
    try {
      await axios.post('/api/v1/signup/complete', {
        userId: user.id,
        icode: inviteCode,
      });
      router.push('/watch/web/index.html#!/settings/manage-library-access');
    } catch (e) {
      Toast({
        title: 'Error during signup',
        message:
          e.response?.data?.message ||
          'An error occurred during signup. Please try again.',
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
      });
    }
  };

  return (
    <div className="relative flex flex-col items-center h-full w-full py-12">
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="px-4 sm:mx-auto w-full sm:max-w-4xl">
        <div className="mb-10 w-full text-white">
          <div className="mb-2 flex justify-center text-3xl font-bold">
            Welcome to {currentSettings.applicationTitle}
          </div>
          <div className="mb-2 text-center">
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
              description="Enter Invite Code"
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description="Create Account"
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
            <div>
              <p className="mb-2 text-center pb-6">
                Get started by entering your invite code below.
              </p>
              <ICodeForm
                onComplete={(code) => {
                  setInviteCode(code);
                  setCurrentStep(2);
                }}
              />
            </div>
          )}
          {currentStep === 2 && (
            <div>
              <p className="mb-2 text-center pb-6">
                Please sign in with your Plex account{' '}
                {currentSettings?.localLogin && (
                  <>or enter local account details </>
                )}
                to continue the registration process.{' '}
                {currentSettings?.localLogin && (
                  <> (Plex is recommended for the best experience)</>
                )}
              </p>
              <SignUpAuthForm
                inviteCode={inviteCode}
                onComplete={(plexUser) => {
                  setUser(plexUser);
                  // Always proceed to step 3 for account confirmation
                  setCurrentStep(3);
                }}
              />
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <p className="mb-2 text-center pb-6">
                Review your details below and confirm your account.
              </p>
              <ConfirmAccountForm user={user} onComplete={finishSignup} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Join;
