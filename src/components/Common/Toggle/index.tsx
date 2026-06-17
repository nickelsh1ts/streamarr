import { CheckIcon, MinusIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useIntl } from 'react-intl';

interface ToggleProps {
  id: string;
  /** true = enabled, false = disabled, null = no change (triState only) */
  valueOf: boolean | null;
  onClick?: () => void;
  /** Called with the chosen state when triState is enabled */
  onChange?: (value: boolean | null) => void;
  /** Renders a three-position toggle (left = disabled, middle = no
   * change, right = enabled). With a mouse, click a third of the track
   * to jump straight to that state; on touch, tap a half of the track
   * to step one state in that direction. Arrow keys also step. */
  triState?: boolean;
  title?: React.ReactNode;
  ariaLabel?: string;
}

const Toggle = ({
  id,
  valueOf,
  onClick,
  onChange,
  triState = false,
  title,
  ariaLabel,
}: ToggleProps) => {
  const intl = useIntl();

  const stateLabel =
    valueOf === null
      ? intl.formatMessage({
          id: 'toggle.noChange',
          defaultMessage: 'No change',
        })
      : valueOf
        ? intl.formatMessage({
            id: 'toggle.enabled',
            defaultMessage: 'Enabled',
          })
        : intl.formatMessage({
            id: 'toggle.disabled',
            defaultMessage: 'Disabled',
          });

  const step = (direction: -1 | 1) => {
    if (direction === -1) {
      onChange?.(valueOf === true ? null : false);
    } else {
      onChange?.(valueOf === false ? null : true);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (!triState) {
      return onClick?.();
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;

    // Precise pointers jump straight to the tapped third; coarse (touch)
    // pointers step one state toward the tapped half instead, so the
    // narrow middle zone never has to be hit directly with a thumb
    const nativeEvent = e.nativeEvent as MouseEvent | PointerEvent;
    const isCoarse =
      'pointerType' in nativeEvent && nativeEvent.pointerType
        ? nativeEvent.pointerType === 'touch'
        : typeof window !== 'undefined' &&
          window.matchMedia('(pointer: coarse)').matches;

    if (isCoarse) {
      return step(fraction < 0.5 ? -1 : 1);
    }
    onChange?.(fraction < 1 / 3 ? false : fraction < 2 / 3 ? null : true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!triState) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    }
  };

  return (
    <div className="inline-flex items-start space-x-2">
      <div className="flex flex-col items-center">
        <span
          id={id}
          role={triState ? 'slider' : 'checkbox'}
          tabIndex={0}
          aria-checked={triState ? undefined : !!valueOf}
          aria-valuemin={triState ? 0 : undefined}
          aria-valuemax={triState ? 2 : undefined}
          aria-valuenow={
            triState
              ? valueOf === false
                ? 0
                : valueOf === null
                  ? 1
                  : 2
              : undefined
          }
          aria-valuetext={triState ? stateLabel : undefined}
          aria-label={
            ariaLabel || (typeof title === 'string' ? title : undefined)
          }
          aria-labelledby={
            !ariaLabel && title && typeof title !== 'string'
              ? `${id}-label`
              : undefined
          }
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={`${
            valueOf === null
              ? 'bg-base-300'
              : valueOf
                ? 'bg-primary'
                : 'bg-neutral'
          } ${
            triState ? 'w-16' : 'w-11'
          } ring-primary relative inline-flex h-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${
              valueOf === null
                ? 'translate-x-5'
                : valueOf
                  ? triState
                    ? 'translate-x-10'
                    : 'translate-x-5'
                  : 'translate-x-0'
            } relative inline-block h-5 w-5 rounded-full bg-white shadow transition duration-200 ease-in-out`}
          >
            <span
              className={`${
                valueOf === false
                  ? 'opacity-100 duration-200 ease-in'
                  : 'opacity-0 duration-100 ease-out'
              } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            >
              <XMarkIcon className="text-neutral h-3 w-3" />
            </span>
            {triState && (
              <span
                className={`${
                  valueOf === null
                    ? 'opacity-100 duration-200 ease-in'
                    : 'opacity-0 duration-100 ease-out'
                } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
              >
                <MinusIcon className="text-neutral h-3 w-3" />
              </span>
            )}
            <span
              className={`${
                valueOf === true
                  ? 'opacity-100 duration-200 ease-in'
                  : 'opacity-0 duration-100 ease-out'
              } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
            >
              <CheckIcon className="text-primary h-3 w-3" />
            </span>
          </span>
        </span>
        {triState && (
          <span aria-hidden="true" className="text-neutral text-xs">
            ({stateLabel})
          </span>
        )}
      </div>
      {title && <span id={`${id}-label`}>{title}</span>}
    </div>
  );
};
export default Toggle;
