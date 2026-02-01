import { CheckIcon } from '@heroicons/react/24/solid';

interface CurrentStep {
  stepNumber: number;
  description: string;
  active?: boolean;
  completed?: boolean;
  isLastStep?: boolean;
}

const SetupSteps = ({
  stepNumber,
  description,
  active = false,
  completed = false,
  isLastStep = false,
}: CurrentStep) => {
  return (
    <li className="relative md:flex md:flex-1">
      <div className="flex items-center space-x-4 px-6 py-4 text-sm font-medium leading-5">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center ${completed ? 'bg-primary border' : 'border-2'} ${active ? 'border-primary' : completed ? 'border-primary-content' : 'border-primary-content/60'} rounded-full`}
        >
          {completed ? (
            <CheckIcon className="h-6 w-6 text-primary-content" />
          ) : (
            <p
              className={`${active ? 'text-primary-content' : 'text-primary-content/70'}`}
            >
              {stepNumber}
            </p>
          )}
        </div>
        <p
          className={`text-sm font-medium leading-5 ${active ? 'text-primary-content' : 'text-primary-content/70'}`}
        >
          {description}
        </p>
      </div>

      {!isLastStep && (
        <div className="absolute top-0 right-0 hidden h-full w-5 md:block">
          <svg
            className="h-full w-full text-primary"
            viewBox="0 0 22 80"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M0 -2L20 40L0 82"
              vectorEffect="non-scaling-stroke"
              stroke="currentcolor"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </li>
  );
};

export default SetupSteps;
