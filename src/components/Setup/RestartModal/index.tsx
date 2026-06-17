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
        id: 'common.restartRequired',
        defaultMessage: 'Restart Required',
      })}
      onOk={handleRestart}
      okText={
        isRestarting
          ? intl.formatMessage({
              id: 'system.restarting',
              defaultMessage: 'Restarting…',
            })
          : isReconnecting
            ? intl.formatMessage({
                id: 'system.reconnecting',
                defaultMessage: 'Reconnecting…',
              })
            : intl.formatMessage({
                id: 'system.restartNow',
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
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <ArrowPathIcon className="text-primary size-12 animate-spin" />
            <p className="text-lg">
              {isReconnecting ? (
                <FormattedMessage
                  id="system.reconnecting"
                  defaultMessage="Reconnecting…"
                />
              ) : (
                <FormattedMessage
                  id="system.restarting"
                  defaultMessage="Restarting…"
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
              <div className="bg-base-300 rounded-md p-3">
                <p className="text-neutral mb-2 text-sm">
                  <FormattedMessage
                    id="setup.restartRequired.servicesConfigured"
                    defaultMessage="The following services need proxy routes registered via restart:"
                  />
                </p>
                <div className="flex flex-wrap gap-2">
                  {services.map((service) => (
                    <span
                      key={service}
                      className="bg-primary/20 text-primary-content inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                    >
                      <CheckCircleIcon className="text-primary size-4" />
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
