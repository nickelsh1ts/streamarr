'use client';
import useSettings from '@app/hooks/useSettings';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeOpenIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';

const MoreHelp = () => {
  const { currentSettings } = useSettings();

  return (
    <div className="bg-zinc-200 py-20 print:hidden">
      <div className="container max-w-screen-xl mx-auto px-4">
        <h1 className="text-neutral font-extrabold text-center text-4xl">
          Need more help?
        </h1>
        <p className="text-center text-neutral text-lg my-4">
          Check out the help section on Plex or reach out below! We&apos;re
          available during EST hours.
        </p>
      </div>
      <div className="container max-w-screen-xl mx-auto py-4 place-content-center flex flex-wrap gap-5 px-5">
        {(currentSettings.supportEmail || currentSettings.supportUrl) && (
          <div className="card bg-white text-black rounded-sm shadow-xl py-7 basis-1/2 lg:basis-1/3 flex-1">
            <div className="card-body py-4 px-4 md:px-7">
              <div className="flex place-items-center">
                <ChatBubbleLeftRightIcon className="w-20 h-20 flex-none" />
                <div className="my-auto ms-4">
                  <h5 className="card-title">Contact Us</h5>
                  <p className="">
                    Need to chat with us? We&apos;re available on Discord!
                  </p>
                  <div className="flex flex-wrap mt-4">
                    {currentSettings.supportUrl && (
                      <Link
                        target="_blank"
                        href={currentSettings.supportUrl}
                        type="button"
                        className="btn btn-sm btn-primary hover:btn-secondary me-1 mb-2 rounded-md text-base min-h-9"
                        rel="noreferrer"
                      >
                        Support{' '}
                        <svg
                          className="h-7"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z"
                            fill="currentColor"
                          ></path>
                        </svg>
                      </Link>
                    )}
                    {currentSettings.supportEmail && (
                      <Link
                        target="_blank"
                        href={`mailto:${currentSettings.supportEmail.toLowerCase()}`}
                        type="button"
                        className="btn btn-sm btn-outline btn-primary mx-1 mb-2 rounded-md text-base min-h-9"
                        rel="noreferrer"
                      >
                        Email <EnvelopeOpenIcon className="h-7" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="card bg-white text-black rounded-sm shadow-xl py-7 basis-1/2 lg:basis-1/3 flex-1">
          <div className="card-body py-4 px-4 md:px-7">
            <div className="flex place-items-center">
              <BookOpenIcon className="w-20 h-20 flex-none" />
              <div className="my-auto ms-4">
                <h5 className="card-title">Visit Plex</h5>
                <p className="mb-4">
                  Take a look at the Plex Help section or browse their forums
                  for even more assistance.
                </p>
                <Link
                  target="_blank"
                  href="https://support.plex.tv/"
                  type="button"
                  className="btn btn-sm btn-accent rounded-md text-base min-h-9"
                  rel="noreferrer"
                >
                  Plex Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoreHelp;
