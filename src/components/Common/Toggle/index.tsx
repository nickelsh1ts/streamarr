import { XMarkIcon, CheckIcon } from '@heroicons/react/24/solid';

interface ToggleProps {
  id: string;
  valueOf: boolean;
  onClick: () => void;
  title?: React.ReactNode;
  ariaLabel?: string;
}

const Toggle = ({ id, valueOf, onClick, title, ariaLabel }: ToggleProps) => {
  return (
    <div className="inline-flex items-center space-x-2">
      <span
        id={id}
        role="checkbox"
        tabIndex={0}
        aria-checked={valueOf}
        aria-label={
          ariaLabel || (typeof title === 'string' ? title : undefined)
        }
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Space') {
            e.preventDefault();
            onClick();
          }
        }}
        className={`${
          valueOf ? 'bg-primary' : 'bg-neutral'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-primary focus:ring`}
      >
        <span
          aria-hidden="true"
          className={`${
            valueOf ? 'translate-x-5' : 'translate-x-0'
          } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
        >
          <span
            className={`${
              valueOf
                ? 'opacity-0 duration-100 ease-out'
                : 'opacity-100 duration-200 ease-in'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
          >
            <XMarkIcon className="h-3 w-3 text-neutral" />
          </span>
          <span
            className={`${
              valueOf
                ? 'opacity-100 duration-200 ease-in'
                : 'opacity-0 duration-100 ease-out'
            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
          >
            <CheckIcon className="h-3 w-3 text-primary" />
          </span>
        </span>
      </span>
      {title && <label htmlFor={id}>{title}</label>}
    </div>
  );
};
export default Toggle;
