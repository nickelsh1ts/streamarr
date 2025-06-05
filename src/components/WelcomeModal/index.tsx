'use client';
import Button from '@app/components/Common/Button';
import Modal from '@app/components/Common/Modal';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

const key = 'welcomeModalClosed';
const initialValue = false;

const WelcomeModal = () => {
  const [modalState, setModalState] = useState(false);

  const [value, setValue] = useLocalStorage(key, initialValue, {
    initializeWithValue: false,
  });

  useEffect(() => {
    setModalState(!value);
  }, [value]);

  const WelcomeModalContent = () => {
    return (
      <div className="w-full h-full justify-items-center">
        <div className="m-8">
          <img alt="welcome" src="/img/welcome.png" className="w-96 h-auto" />
        </div>
        <div className="mb-8">
          <p className="text-4xl">
            <span className="font-bold">Welcome to</span>{' '}
            <span className="font-extralight">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </span>
          </p>
        </div>
        <div className="mb-8 text-justify">
          <p className="mb-2">Hey there - Just a little heads up!</p>
          <p className="mb-6">
            This is still very much a work in progress and missing some
            features. If you encounter issues, please keep trying or reach out
            to nickelsh1ts.
          </p>
          <p className="">
            There&apos;s a lot more to come, so stay tuned and check back again
            later!
          </p>
        </div>
        <div>
          <div>
            <Button
              onClick={() => {
                setValue(true);
              }}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      size="sm"
      onClose={() => {
        setValue(true);
      }}
      show={modalState}
      content={<WelcomeModalContent />}
    />
  );
};

export default WelcomeModal;
