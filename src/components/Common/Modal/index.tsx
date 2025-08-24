import type { ButtonType } from '@app/components/Common/Button';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import type React from 'react';
import { FormattedMessage } from 'react-intl';

interface Props {
  subtitle?: string;
  title?: string;
  onCancel?: () => void;
  onOk?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onSecondary?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onTertiary?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  cancelText?: string;
  okText?: string;
  secondaryText?: string;
  tertiaryText?: string;
  okDisabled?: boolean;
  cancelButtonType?: ButtonType;
  okButtonType?: ButtonType;
  secondaryButtonType?: ButtonType;
  secondaryDisabled?: boolean;
  tertiaryDisabled?: boolean;
  tertiaryButtonType?: ButtonType;
  loading?: boolean;
  children?: React.ReactNode;
  show: boolean;
  size?: 'sm' | 'lg';
}

export default function Modal({
  title,
  subtitle,
  onCancel,
  onOk,
  cancelText,
  okText,
  okDisabled = false,
  cancelButtonType = 'default',
  okButtonType = 'primary',
  children,
  secondaryButtonType = 'default',
  secondaryDisabled = false,
  onSecondary,
  secondaryText,
  tertiaryButtonType = 'default',
  tertiaryDisabled = false,
  tertiaryText,
  loading = false,
  onTertiary,
  show,
  size = 'sm',
}: Props) {
  return (
    <Dialog onClose={onCancel} open={show}>
      <DialogBackdrop
        transition
        className="fixed inset-0 z-[1050] w-full bg-base-300 backdrop-blur-sm bg-opacity-30 transition-opacity data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 z-[1050] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-1 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative transform overflow-hidden rounded-lg text-left shadow-md sm:my-8 w-full ${size === 'sm' ? 'sm:max-w-xl' : 'sm:max-w-7xl'} border border-primary transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-0 data-[closed]:max-sm:translate-y-full`}
          >
            <div className="absolute pt-1 pr-1 top-0 right-0 z-10">
              <button
                type="button"
                className="btn hover:bg-zinc-700 p-1 btn-sm rounded-md"
                onClick={onCancel}
              >
                <span className="absolute w-1 h-1 p-0 -m-1 whitespace-nowrap border-0 sr-only">
                  <FormattedMessage id="common.close" defaultMessage="Close" />
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <div className="bg-[#16191d] px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              {loading ? (
                <div className="my-8">
                  <LoadingEllipsis />
                </div>
              ) : (
                <div className="flex items-start">
                  <div className="mt-3 sm:mt-0 w-full">
                    {title && (
                      <DialogTitle
                        as="h3"
                        className="text-lg font-semibold leading-6 text-primary"
                      >
                        {title}
                      </DialogTitle>
                    )}
                    {subtitle && <div className="mt-2">{subtitle}</div>}
                    {children && (
                      <div
                        className={`mt-4 ${onCancel || onOk || onSecondary || onTertiary ? 'mb-3' : ''}`}
                      >
                        {children}
                      </div>
                    )}
                    {(onCancel || onOk || onSecondary || onTertiary) && (
                      <div className="relative mt-5 flex flex-row-reverse sm:mt-4 justify-start">
                        {typeof onOk === 'function' && okText && (
                          <Button
                            buttonSize="sm"
                            buttonType={okButtonType}
                            onClick={onOk}
                            className="ml-3"
                            disabled={okDisabled}
                            data-testid="modal-ok-button"
                          >
                            {okText}
                          </Button>
                        )}
                        {typeof onSecondary === 'function' && secondaryText && (
                          <Button
                            buttonSize="sm"
                            buttonType={secondaryButtonType}
                            onClick={onSecondary}
                            className="ml-3"
                            disabled={secondaryDisabled}
                            data-testid="modal-secondary-button"
                          >
                            {secondaryText}
                          </Button>
                        )}
                        {typeof onTertiary === 'function' && tertiaryText && (
                          <Button
                            buttonSize="sm"
                            buttonType={tertiaryButtonType}
                            onClick={onTertiary}
                            className="ml-3"
                            disabled={tertiaryDisabled}
                          >
                            {tertiaryText}
                          </Button>
                        )}
                        {typeof onCancel === 'function' && cancelText && (
                          <Button
                            buttonSize="sm"
                            buttonType={cancelButtonType}
                            onClick={onCancel}
                            className="ml-3 sm:ml-0"
                            data-testid="modal-cancel-button"
                          >
                            {cancelText}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
