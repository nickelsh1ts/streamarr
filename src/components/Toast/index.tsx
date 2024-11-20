import { XMarkIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

type Renderable = JSX.Element | string | null;
type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
type ToastType = 'default' | 'primary' | 'error' | 'warning' | 'success';

interface ToastProps {
  icon?: Renderable;
  title?: string;
  message?: string;
  duration?: number;
  position?: ToastPosition;
  classnames?: string;
  type?: ToastType;
  ariaProps?: {
    role?: 'status' | 'alert';
    'aria-live'?: 'assertive' | 'off' | 'polite';
  };
}

const Toast = ({
  icon,
  title,
  message,
  duration = 5000,
  position = 'top-right',
  classnames = '',
  type = 'default',
  ariaProps = { role: 'status', 'aria-live': 'polite' },
}: ToastProps) => {
  const toastStyle = [];
  const ringStyle = [];
  switch (type) {
    case 'primary':
      toastStyle.push(
        'bg-primary ring-primary-content ring-opacity-30 text-primary-content'
      );
      ringStyle.push('focus:ring-primary-content');
      break;
    case 'error':
      toastStyle.push(
        'bg-error ring-error-content ring-opacity-30 text-error-content'
      );
      ringStyle.push('focus:ring-error-content');
      break;
    case 'warning':
      toastStyle.push(
        'bg-warning ring-warning-content ring-opacity-30 text-warning-content'
      );
      ringStyle.push('focus:ring-warning-content');
      break;
    case 'success':
      toastStyle.push(
        'bg-success ring-success-content ring-opacity-30 text-success-content'
      );
      ringStyle.push('focus:ring-success-content');
      break;
    default:
      toastStyle.push(
        'bg-base-100 ring-base-content ring-opacity-30 text-base-content'
      );
      ringStyle.push('focus:ring-base-content');
  }
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-in' : 'animate-leave'
        } max-w-sm w-full relative shadow-lg rounded-lg pointer-events-auto flex ring-1 ${toastStyle.join(' ')}`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-center">
            {icon && (
              <div className="flex-shrink-0 pt-0.5 self-center">{icon}</div>
            )}
            {(title || message) && (
              <div className="ml-3 mr-2 flex-1">
                {title && <p className="text-sm font-bold">{title}</p>}
                {message && <p className="mt-1 text-sm">{message}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="flex">
          <button
            onClick={() => toast.dismiss(t.id)}
            className={`absolute top-0 right-0 p-1 m-1 rounded-md focus:outline-none focus:ring-2 ${ringStyle} hover:opacity-70`}
          >
            <XMarkIcon className="size-5" />
          </button>
        </div>
      </div>
    ),
    {
      duration: duration,
      position: position,
      className: classnames,
      ariaProps: {
        role: ariaProps.role,
        'aria-live': ariaProps['aria-live'],
      },
    }
  );
};

export default Toast;
