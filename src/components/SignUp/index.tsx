'use client';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import SetupSteps from '@app/components/Setup/SetupSteps';
import ConfirmAccountForm from '@app/components/SignUp/Forms/ConfirmAccountForm';
import ICodeForm from '@app/components/SignUp/Forms/ICodeForm';
import SignUpAuthForm from '@app/components/SignUp/Forms/SignUpAuthForm';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import {
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import type { User } from '@server/entity/User';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const Join = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const router = useRouter();
  const { currentSettings } = useSettings();
  const intl = useIntl();

  // Step 3: Finalize signup
  const finishSignup = async (autoPinLibraries = true) => {
    if (!user || !inviteCode) return;
    try {
      await axios.post('/api/v1/signup/complete', {
        userId: user.id,
        icode: inviteCode,
      });

      if (autoPinLibraries) {
        try {
          await axios.post(`/api/v1/user/${user.id}/settings/pin-libraries`);
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'signUp.autoPinLibrariesFailed',
              defaultMessage: 'Pinning libraries failed',
            }),
            message: e.response?.data?.message || e.message,
            type: 'warning',
            icon: <ExclamationTriangleIcon className="size-7" />,
          });
        }
      }

      router.push('/watch/web/index.html#!');
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'signUp.errorDuringSignup',
          defaultMessage: 'Error during signup',
        }),
        message:
          e.response?.data?.message ||
          intl.formatMessage({
            id: 'signUp.errorDuringSignupFallback',
            defaultMessage:
              'An error occurred during signup. Please try again.',
          }),
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
            <FormattedMessage
              id="signUp.welcomeTo"
              defaultMessage="Welcome to {applicationTitle}"
              values={{ applicationTitle: currentSettings.applicationTitle }}
            />
          </div>
          <div className="mb-2 text-center">
            <FormattedMessage
              id="signUp.registrationByInvite"
              defaultMessage="Registration is by invite only."
            />
          </div>
        </div>
        <nav className="relative w-full">
          <ul
            className="divide-y divide-primary rounded-md border border-primary bg-primary bg-opacity-50 md:flex md:divide-y-0"
            style={{ backdropFilter: 'blur(5px)' }}
          >
            <SetupSteps
              stepNumber={1}
              description={intl.formatMessage({
                id: 'signUp.enterInviteCode',
                defaultMessage: 'Enter Invite Code',
              })}
              active={currentStep === 1}
              completed={currentStep > 1}
            />
            <SetupSteps
              stepNumber={2}
              description={intl.formatMessage({
                id: 'signUp.createAccount',
                defaultMessage: 'Create Account',
              })}
              active={currentStep === 2}
              completed={currentStep > 2}
            />
            <SetupSteps
              stepNumber={3}
              description={intl.formatMessage({
                id: 'signUp.confirmAccount',
                defaultMessage: 'Confirm Account',
              })}
              active={currentStep === 3}
              isLastStep
            />
          </ul>
        </nav>
        <div className="mt-10 w-full rounded-md border border-secondary bg-secondary bg-opacity-50 backdrop-blur p-4 text-white">
          {currentStep === 1 && (
            <div>
              <p className="mb-2 text-center pb-6">
                <FormattedMessage
                  id="signUp.getStartedInviteCode"
                  defaultMessage="Get started by entering your invite code below."
                />
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
                <FormattedMessage
                  id="signUp.signInWithPlex"
                  defaultMessage="Please sign in with your Plex account {localLoginOption} to continue the registration process. {plexRecommended}."
                  values={{
                    localLoginOption: currentSettings?.localLogin ? (
                      <FormattedMessage
                        id="signUp.orEnterLocalAccount"
                        defaultMessage="or enter local account details"
                      />
                    ) : null,
                    plexRecommended: currentSettings?.localLogin ? (
                      <FormattedMessage
                        id="signUp.plexRecommended"
                        defaultMessage="(Plex is recommended for the best experience)"
                      />
                    ) : null,
                  }}
                />
              </p>
              <SignUpAuthForm
                inviteCode={inviteCode}
                onComplete={(plexUser) => {
                  setUser(plexUser);
                  setCurrentStep(3);
                }}
              />
            </div>
          )}
          {currentStep === 3 && (
            <div>
              <p className="mb-2 text-center pb-6">
                <FormattedMessage
                  id="signUp.reviewDetailsConfirm"
                  defaultMessage="Review your details below and confirm your account."
                />
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
