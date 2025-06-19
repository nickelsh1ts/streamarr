'use client';
import Modal from '@app/components/Common/Modal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  PaperAirplaneIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  BellAlertIcon,
  BackwardIcon,
} from '@heroicons/react/24/solid';
import Button from '@app/components/Common/Button';
import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';

export const ComingSoonContent = () => {
  const router = useRouter();
  const { currentSettings } = useSettings();

  const features = [
    {
      name: 'Invite a Friend.',
      description:
        "Soon you'll be able to invite some of your closest friends to join in on the fun. Generate, manage and send invite codes.",
      icon: PaperAirplaneIcon,
    },
    {
      name: 'Release Schedule.',
      description:
        'Check out when the latest and greatest movies and episodes air. Never miss a new release again.',
      icon: CalendarDaysIcon,
    },
    {
      name: 'User Profiles.',
      description: `View, edit and manage your ${currentSettings.applicationTitle} user profile and settings.`,
      icon: UserCircleIcon,
    },
    {
      name: 'Notification Center.',
      description:
        'A central notification center to manage and view application messages, request & invite statuses and more.',
      icon: BellAlertIcon,
    },
  ];
  return (
    <div className="text-left lg:-mt-8 -mb-4 lg:-mr-6 md:-ml-4">
      <div className="mx-auto max-w-7xl md:px-2 lg:px-8">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-x-8 gap-y-10 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          <div className="lg:py-4 lg:pr-8">
            <div className="lg:max-w-lg">
              <h2 className="text-base/7 font-semibold text-primary">
                Name the movie...
              </h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty text-primary-content sm:text-5xl">
                I was 12 going on 13 the first time I saw (a new feature...)
              </p>
              <p className="mt-6 text-lg/8 text-neutral-100">
                We&apos;re working hard to bring you the latest features. Stay
                tuned!
              </p>
              <dl className="mt-6 max-w-2xl space-y-4 sm:space-y-8 text-base/7 text-neutral-300 lg:max-w-none">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-9">
                    <dt className="inline font-semibold text-primary">
                      <feature.icon
                        aria-hidden="true"
                        className="absolute top-1 left-1 size-5 text-primary"
                      />
                      {feature.name}
                    </dt>{' '}
                    <dd className="inline">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="text-end text-sm text-neutral-700 mt-3 font-bold">
              <span className="inline-flex">
                Answer:{' '}
                <span className="text-start ms-2 [&:not(:hover)]:bg-neutral-700">
                  Stand By Me (a dead body)
                </span>
              </span>
            </div>
          </div>
          <div className="relative max-md:-ml-10 md:max-lg:overflow-hidden rounded-xl md:max-lg:mb-8">
            <div className="absolute h-full w-full justify-items-center ms-4">
              <Image
                alt="Coming Soon"
                src="/img/coming-soon-marquee.png"
                className="w-auto max-sm:max-h-64 sm:max-h-96 h-auto"
                width={600}
                height={256}
              />
              <Button
                onClick={() => router.back()}
                buttonType={'warning'}
                buttonSize="lg"
                className="ms-2 sm:ms-6 shadow-secondary shadow-md font-bold"
              >
                Let&apos;s rewind <BackwardIcon className="size-7 ms-2" />
              </Button>
            </div>
            <Image
              alt="Cinema Seating"
              src="/img/cinema-seating.jpg"
              className="max-w-none md:rounded-xl shadow-xl ring-1 ring-gray-400/10 max-sm:max-h-[28rem] w-auto h-full"
              width={600}
              height={448}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ComingSoon = () => {
  const [modalState] = useState(true);
  const router = useRouter();

  return (
    <Modal
      size="lg"
      onClose={() => router.back()}
      show={modalState}
      content={<ComingSoonContent />}
    />
  );
};

export default ComingSoon;
