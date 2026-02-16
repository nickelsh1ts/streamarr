'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import { useOnboardingContext } from '@app/context/OnboardingContext';
import {
  CheckBadgeIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import { PlayIcon, EyeIcon } from '@heroicons/react/24/outline';
import type { OnboardingSettingsResponse } from '@server/interfaces/api/onboardingInterfaces';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';
import WelcomeContentManager from './WelcomeContentManager';
import TutorialStepManager from './TutorialStepManager';

const OnboardingSettings = () => {
  const intl = useIntl();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetAllUsersModal, setShowResetAllUsersModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingAllUsers, setIsResettingAllUsers] = useState(false);
  const [resetKey, setResetKey] = useState(0); // Force re-render of managers
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<OnboardingSettingsResponse>('/api/v1/settings/onboarding');

  const {
    startWelcomePreview,
    startTutorialPreview,
    refetch: refetchOnboarding,
  } = useOnboardingContext();

  const OnboardingSchema = Yup.object().shape({
    welcomeEnabled: Yup.boolean().required(),
    tutorialEnabled: Yup.boolean().required(),
    tutorialMode: Yup.string()
      .oneOf(['spotlight', 'wizard', 'both'])
      .required(),
    allowSkipWelcome: Yup.boolean().required(),
    allowSkipTutorial: Yup.boolean().required(),
    tutorialAutostart: Yup.boolean().required(),
    tutorialAutostartDelay: Yup.number().min(0).required(),
  });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  const handleResetToDefaults = async () => {
    setIsResetting(true);
    try {
      await axios.post('/api/v1/settings/onboarding/reset', {});
      setShowResetModal(false);
      setResetKey((prev) => prev + 1); // Force re-render of managers
      // Revalidate the data after reset
      await revalidate();
      // Also refresh the onboarding context
      refetchOnboarding();
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.resetSuccess',
          defaultMessage: 'Onboarding content reset to defaults!',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
        type: 'success',
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.resetError',
          defaultMessage: 'Failed to reset onboarding content.',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
        message:
          e.response?.data?.message ||
          (e instanceof Error ? e.message : String(e)),
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetAllUsers = async () => {
    setIsResettingAllUsers(true);
    try {
      await axios.post('/api/v1/settings/onboarding/reset-all-users', {});
      setShowResetAllUsersModal(false);
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.resetAllUsersSuccess',
          defaultMessage: 'Onboarding reset for all users!',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
        type: 'success',
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.resetAllUsersError',
          defaultMessage: 'Failed to reset onboarding for all users.',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
        message:
          e.response?.data?.message ||
          (e instanceof Error ? e.message : String(e)),
      });
    } finally {
      setIsResettingAllUsers(false);
    }
  };

  return (
    <div className="mb-6">
      <Modal
        show={showResetModal}
        onOk={handleResetToDefaults}
        onCancel={() => setShowResetModal(false)}
        okText={intl.formatMessage({
          id: 'common.reset',
          defaultMessage: 'Reset',
        })}
        cancelText={intl.formatMessage({
          id: 'common.cancel',
          defaultMessage: 'Cancel',
        })}
        title={intl.formatMessage({
          id: 'settings.onboarding.resetTitle',
          defaultMessage: 'Reset to Defaults',
        })}
        okButtonType="error"
        loading={isResetting}
      >
        <FormattedMessage
          id="settings.onboarding.resetConfirm"
          defaultMessage="Are you sure you want to reset all welcome content and tutorial steps to their defaults? This will delete any custom content you have created."
        />
      </Modal>
      <Modal
        show={showResetAllUsersModal}
        onOk={handleResetAllUsers}
        onCancel={() => setShowResetAllUsersModal(false)}
        okText={intl.formatMessage({
          id: 'common.reset',
          defaultMessage: 'Reset',
        })}
        cancelText={intl.formatMessage({
          id: 'common.cancel',
          defaultMessage: 'Cancel',
        })}
        title={intl.formatMessage({
          id: 'settings.onboarding.resetAllUsersTitle',
          defaultMessage: 'Reset All Users',
        })}
        okButtonType="error"
        loading={isResettingAllUsers}
      >
        <FormattedMessage
          id="settings.onboarding.resetAllUsersConfirm"
          defaultMessage="Are you sure you want to reset onboarding progress for all users? This will show the welcome modal and tutorial to all users again on their next visit."
        />
      </Modal>
      <div className="mb-6">
        <h3 className="text-2xl font-extrabold">
          <FormattedMessage
            id="settings.onboarding.title"
            defaultMessage="Onboarding Settings"
          />
        </h3>
        <p className="mb-5">
          <FormattedMessage
            id="settings.onboarding.description"
            defaultMessage="Configure the welcome modal and tutorial experience for new users."
          />
        </p>
        <Formik
          initialValues={{
            welcomeEnabled: data?.welcomeEnabled ?? true,
            tutorialEnabled: data?.tutorialEnabled ?? true,
            tutorialMode: data?.tutorialMode ?? 'both',
            allowSkipWelcome: data?.allowSkipWelcome ?? true,
            allowSkipTutorial: data?.allowSkipTutorial ?? true,
            tutorialAutostart: data?.tutorialAutostart ?? true,
            tutorialAutostartDelay: data?.tutorialAutostartDelay ?? 500,
          }}
          validationSchema={OnboardingSchema}
          enableReinitialize
          onSubmit={async (values) => {
            try {
              await axios.post('/api/v1/settings/onboarding', values);
              revalidate();
              refetchOnboarding();
              Toast({
                title: intl.formatMessage(
                  {
                    id: 'common.settingsSaveSuccess',
                    defaultMessage: '{appName} settings saved successfully',
                  },
                  { appName: 'Onboarding' }
                ),
                icon: <CheckBadgeIcon className="size-7" />,
                type: 'success',
              });
            } catch (e) {
              Toast({
                title: intl.formatMessage(
                  {
                    id: 'common.settingsSaveError',
                    defaultMessage: 'Something went wrong while saving {appName} settings.',
                  },
                  { appName: 'onboarding' }
                ),
                icon: <XCircleIcon className="size-7" />,
                type: 'error',
                message:
                  e.response?.data?.message ||
                  (e instanceof Error ? e.message : String(e)),
              });
            }
          }}
        >
          {({ isSubmitting, values }) => (
            <Form className="mt-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                <label htmlFor="welcomeEnabled" className="col-span-1">
                  <FormattedMessage
                    id="settings.onboarding.welcomeEnabled"
                    defaultMessage="Enable Welcome Modal"
                  />
                  <p className="text-sm text-neutral">
                    <FormattedMessage
                      id="settings.onboarding.welcomeEnabledTip"
                      defaultMessage="Show a welcome carousel to new users on first login."
                    />
                  </p>
                </label>
                <div className="col-span-2">
                  <Field
                    type="checkbox"
                    id="welcomeEnabled"
                    name="welcomeEnabled"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                </div>
              </div>
              {values.welcomeEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                  <label htmlFor="allowSkipWelcome" className="col-span-1">
                    <span className="mr-2">
                      <FormattedMessage
                        id="settings.onboarding.allowSkip"
                        defaultMessage="Allow Skip"
                      />
                    </span>
                    <p className="text-sm text-neutral">
                      <FormattedMessage
                        id="settings.onboarding.allowSkipWelcomeTip"
                        defaultMessage="Allow users to skip or dismiss the welcome modal."
                      />
                    </p>
                  </label>
                  <div className="col-span-2">
                    <Field
                      type="checkbox"
                      id="allowSkipWelcome"
                      name="allowSkipWelcome"
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                <label htmlFor="tutorialEnabled" className="col-span-1">
                  <span className="mr-2">
                    <FormattedMessage
                      id="settings.onboarding.tutorialEnabled"
                      defaultMessage="Enable Tutorial"
                    />
                  </span>
                  <p className="text-sm text-neutral">
                    <FormattedMessage
                      id="settings.onboarding.tutorialEnabledTip"
                      defaultMessage="Guide users through key features with an interactive tutorial."
                    />
                  </p>
                </label>
                <div className="col-span-2">
                  <Field
                    type="checkbox"
                    id="tutorialEnabled"
                    name="tutorialEnabled"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                </div>
              </div>
              {values.tutorialEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                  <label htmlFor="allowSkipTutorial" className="col-span-1">
                    <span className="mr-2">
                      <FormattedMessage
                        id="settings.onboarding.allowSkip"
                        defaultMessage="Allow Skip"
                      />
                    </span>
                    <p className="text-sm text-neutral">
                      <FormattedMessage
                        id="settings.onboarding.allowSkipTutorialTip"
                        defaultMessage="Allow users to skip the tutorial."
                      />
                    </p>
                  </label>
                  <div className="col-span-2">
                    <Field
                      type="checkbox"
                      id="allowSkipTutorial"
                      name="allowSkipTutorial"
                      className="checkbox checkbox-sm checkbox-primary"
                    />
                  </div>
                </div>
              )}
              {values.tutorialEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                  <label htmlFor="tutorialMode" className="col-span-1">
                    <FormattedMessage
                      id="settings.onboarding.tutorialMode"
                      defaultMessage="Tutorial Mode"
                    />
                    <p className="text-sm text-neutral">
                      <FormattedMessage
                        id="settings.onboarding.tutorialModeTip"
                        defaultMessage="Choose how the tutorial guides users through features."
                      />
                    </p>
                  </label>
                  <div className="col-span-2">
                    <Field
                      as="select"
                      id="tutorialMode"
                      name="tutorialMode"
                      className="select select-primary select-sm"
                    >
                      <option value="spotlight">
                        {intl.formatMessage({
                          id: 'settings.onboarding.mode.spotlight',
                          defaultMessage: 'Spotlight (Element Highlighting)',
                        })}
                      </option>
                      <option value="wizard">
                        {intl.formatMessage({
                          id: 'settings.onboarding.mode.wizard',
                          defaultMessage: 'Wizard (Carousel Slide)',
                        })}
                      </option>
                      <option value="both">
                        {intl.formatMessage({
                          id: 'settings.onboarding.mode.both',
                          defaultMessage: 'Both (Spotlight + Wizard)',
                        })}
                      </option>
                    </Field>
                  </div>
                </div>
              )}
              {values.tutorialEnabled && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                    <label htmlFor="tutorialAutostart" className="col-span-1">
                      <span className="mr-2">
                        <FormattedMessage
                          id="settings.onboarding.tutorialAutostart"
                          defaultMessage="Auto-Start Tutorial"
                        />
                      </span>
                      <p className="text-sm text-neutral">
                        <FormattedMessage
                          id="settings.onboarding.tutorialAutostartTip"
                          defaultMessage="Automatically start the tutorial after the welcome modal or on first login."
                        />
                      </p>
                    </label>
                    <div className="col-span-2">
                      <Field
                        type="checkbox"
                        id="tutorialAutostart"
                        name="tutorialAutostart"
                        className="checkbox checkbox-sm checkbox-primary"
                      />
                    </div>
                  </div>
                  {values.tutorialAutostart && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 col-span-2 sm:col-span-1">
                      <label
                        htmlFor="tutorialAutostartDelay"
                        className="col-span-1"
                      >
                        <FormattedMessage
                          id="settings.onboarding.tutorialAutostartDelay"
                          defaultMessage="Auto-Start Delay (ms)"
                        />
                        <p className="text-sm text-neutral">
                          <FormattedMessage
                            id="settings.onboarding.tutorialAutostartDelayTip"
                            defaultMessage="Delay in milliseconds before auto-starting the tutorial."
                          />
                        </p>
                      </label>
                      <div className="col-span-2">
                        <Field
                          type="number"
                          id="tutorialAutostartDelay"
                          name="tutorialAutostartDelay"
                          min="0"
                          step="500"
                          className="input input-sm input-primary"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    buttonSize="sm"
                    disabled={isSubmitting}
                  >
                    <ArrowDownTrayIcon className="size-4 mr-2" />
                    {isSubmitting ? (
                      <FormattedMessage
                        id="common.saving"
                        defaultMessage="Saving..."
                      />
                    ) : (
                      <FormattedMessage
                        id="common.saveChanges"
                        defaultMessage="Save Changes"
                      />
                    )}
                  </Button>
                </span>
              </div>
            </Form>
          )}
        </Formik>
      </div>
      <div className="section mt-8">
        <h4 className="text-xl font-bold">
          <FormattedMessage
            id="settings.onboarding.previewSection"
            defaultMessage="Preview & Test"
          />
        </h4>
        <p className="mb-4 description">
          <FormattedMessage
            id="settings.onboarding.previewDescription"
            defaultMessage="Test the welcome modal and tutorial without affecting user data. Preview mode does not save progress."
          />
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            buttonType="primary"
            buttonSize="sm"
            onClick={async () => {
              await refetchOnboarding();
              startWelcomePreview();
            }}
          >
            <EyeIcon className="size-5 mr-2" />
            <FormattedMessage
              id="settings.onboarding.previewWelcome"
              defaultMessage="Preview Welcome"
            />
          </Button>
          <Button
            buttonType="primary"
            buttonSize="sm"
            onClick={async () => {
              await refetchOnboarding();
              startTutorialPreview();
            }}
          >
            <PlayIcon className="size-5 mr-2" />
            <FormattedMessage
              id="settings.onboarding.previewTutorial"
              defaultMessage="Preview Tutorial"
            />
          </Button>
        </div>
      </div>
      <div className="section mt-8">
        <h4 className="text-xl font-bold">
          <FormattedMessage
            id="settings.onboarding.welcomeContent"
            defaultMessage="Welcome Content"
          />
        </h4>
        <p className="mb-4 description">
          <FormattedMessage
            id="settings.onboarding.welcomeContentDescription"
            defaultMessage="Configure the slides shown in the welcome modal carousel."
          />
        </p>
        <WelcomeContentManager key={`welcome-${resetKey}`} />
      </div>
      <div className="section mt-8">
        <h4 className="text-xl font-bold">
          <FormattedMessage
            id="settings.onboarding.tutorialSteps"
            defaultMessage="Tutorial Steps"
          />
        </h4>
        <p className="mb-4 description">
          <FormattedMessage
            id="settings.onboarding.tutorialStepsDescription"
            defaultMessage="Configure the interactive tutorial steps."
          />
        </p>
        <TutorialStepManager key={`tutorial-${resetKey}`} />
      </div>
      <div className="section my-8">
        <h4 className="text-xl font-bold">
          <FormattedMessage
            id="settings.onboarding.resetSection"
            defaultMessage="Reset to Defaults"
          />
        </h4>
        <p className="mb-4 description">
          <FormattedMessage
            id="settings.onboarding.resetSectionDescription"
            defaultMessage="Reset all welcome content and tutorial steps to their default values. This will delete any customizations."
          />
        </p>
        <div className="flex gap-3">
          <Button
            buttonType="error"
            buttonSize="sm"
            onClick={() => setShowResetModal(true)}
          >
            <ArrowPathIcon className="size-5 mr-2" />
            <FormattedMessage
              id="settings.onboarding.resetTitle"
              defaultMessage="Reset to Defaults"
            />
          </Button>
          <Button
            buttonType="warning"
            buttonSize="sm"
            onClick={() => setShowResetAllUsersModal(true)}
          >
            <UsersIcon className="size-5 mr-2" />
            <FormattedMessage
              id="settings.onboarding.resetAllUsersButton"
              defaultMessage="Reset All Users"
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSettings;
