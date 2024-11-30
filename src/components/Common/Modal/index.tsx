import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import type React from 'react';

interface Props {
  subtitle?: string;
  title?: string;
  content?: React.ReactNode;
  show: boolean;
  onClose?: () => void;
}

export default function Modal({
  title,
  subtitle,
  content,
  show,
  onClose,
}: Props) {
  return (
    <Dialog onClose={onClose} open={show}>
      <DialogBackdrop
        transition
        className="fixed inset-0 z-[1050] w-full bg-base-300 backdrop-blur-sm bg-opacity-30 transition-opacity data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 max-sm:bottom-16 z-[1050] w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg text-left shadow-md sm:my-8 w-full sm:max-w-xl border border-primary transition duration-300 ease-out data-[closed]:opacity-0 data-[closed]:scale-0 data-[closed]:max-sm:translate-y-full"
          >
            <div className="absolute pt-1 pr-1 top-0 right-0">
              <button
                type="button"
                className="btn hover:bg-zinc-700 p-1 btn-sm rounded-md"
                onClick={onClose}
              >
                <span className="absolute w-1 h-1 p-0 -m-1 whitespace-nowrap border-0 sr-only">
                  Close
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
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <DialogTitle
                    as="h3"
                    className="text-base font-semibold leading-6 text-primary"
                  >
                    {title}
                  </DialogTitle>
                  <div className="mt-2">{subtitle}</div>
                  <div className="mt-2">{content}</div>
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
