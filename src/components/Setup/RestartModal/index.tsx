'use client';
import Modal from '@app/components/Common/Modal';
import { waitForRestart } from '@app/utils/restartHelpers';
import { ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface RestartModalProps {
  show: boolean;
  services: string[];
  onSkip: () => void;
}

const RestartModal = ({ show, services, onSkip }: RestartModalProps) => {
  const intl = useIntl();
  const [isRestarting, setIsRestarting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [restartFailed, setRestartFailed] = useState(false);

  const handleRestart = useCallback(async () => {
    setIsRestarting(true);
    setRestartFailed(false);

    try {
      await axios.post('/api/v1/settings/restart');
      await new Promise((r) => setTimeout(r, 750));

      setIsRestarting(false);
      setIsReconnecting(true);

      if (await waitForRestart()) {
        window.location.href = '/admin';
      } else {
        setIsReconnecting(false);
        setRestartFailed(true);
      }
    } catch {
      setIsRestarting(false);
      setIsReconnecting(false);
      setRestartFailed(true);
    }
  }, []);

  const isProcessing = isRestarting || isReconnecting;

  return (
    <Modal
      show={show}
      title={intl.formatMessage({
        id: 'setup.restartRequired.title',
        defaultMessage: 'Restart Required',
      })}
      onOk={handleRestart}
      okText={
        isRestarting
          ? intl.formatMessage({
              id: 'settings.restartRequired.restarting',
              defaultMessage: 'Restarting...',
            })
          : isReconnecting
            ? intl.formatMessage({
                id: 'settings.restartRequired.reconnecting',
                defaultMessage: 'Reconnecting...',
              })
            : intl.formatMessage({
                id: 'settings.restartRequired.button',
                defaultMessage: 'Restart Now',
              })
      }
      okDisabled={isProcessing}
      okButtonType="primary"
      onCancel={onSkip}
      cancelText={intl.formatMessage({
        id: 'setup.restartRequired.skipButton',
        defaultMessage: 'Skip for Now',
      })}
      cancelButtonType="default"
    >
      <div className="flex flex-col gap-4">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <ArrowPathIcon className="size-12 text-primary animate-spin" />
            <p className="text-lg">
              {isReconnecting ? (
                <FormattedMessage
                  id="settings.restartRequired.reconnecting"
                  defaultMessage="Reconnecting..."
                />
              ) : (
                <FormattedMessage
                  id="settings.restartRequired.restarting"
                  defaultMessage="Restarting..."
                />
              )}
            </p>
          </div>
        ) : restartFailed ? (
          <div className="text-error">
            <FormattedMessage
              id="settings.restartRequired.failed"
              defaultMessage="Restart failed. Please restart the server manually."
            />
          </div>
        ) : (
          <>
            <p>
              <FormattedMessage
                id="setup.restartRequired.message"
                defaultMessage="Services were configured that require a server restart to be available. Would you like to restart now?"
              />
            </p>
            {services.length > 0 && (
              <div className="rounded-md bg-base-300 p-3">
                <p className="text-sm text-neutral mb-2">
                  <FormattedMessage
                    id="setup.restartRequired.servicesConfigured"
                    defaultMessage="The following services need proxy routes registered via restart:"
                  />
                </p>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary-content"
                    >
                      <CheckCircleIcon className="size-4 text-primary" />
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default RestartModal;
