import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface AlertProps {
  title?: React.ReactNode;
  type?: 'warning' | 'info' | 'error' | 'primary';
  children?: React.ReactNode;
}

const Alert = ({ title, children, type }: AlertProps) => {
  let design = {
    bgColor: 'border border-warning backdrop-blur bg-warning bg-opacity-20',
    titleColor: 'text-warning',
    textColor: 'text-warning',
    svg: <ExclamationTriangleIcon className="size-5" />,
  };

  switch (type) {
    case 'info':
      design = {
        bgColor: 'border border-info backdrop-blur bg-info bg-opacity-20',
        titleColor: 'text-info-content',
        textColor: 'text-info-content',
        svg: <InformationCircleIcon className="size-5" />,
      };
      break;
    case 'error':
      design = {
        bgColor: 'bg-error backdrop-blur bg-opacity-20 border border-error',
        titleColor: 'text-error-content',
        textColor: 'text-error-content',
        svg: <XCircleIcon className="size-5" />,
      };
      break;
    case 'primary':
      design = {
        bgColor: 'bg-primary backdrop-blur bg-opacity-20 border border-primary',
        titleColor: 'text-primary-content',
        textColor: 'text-primary-content',
        svg: <InformationCircleIcon className="size-5" />,
      };
      break;
  }

  return (
    <div className={`mb-4 rounded-md p-4 ${design.bgColor}`}>
      <div className={`flex flex-wrap gap-2 ${design.titleColor}`}>
        <div className={`flex-shrink-0 ${design.titleColor}`}>{design.svg}</div>
        {title && (
          <div className="md:flex flex-1 md:justify-between">
            <div className={`text-sm ${design.textColor}`}>
              <div className={`text-sm font-medium ${design.titleColor}`}>
                {title}
              </div>
            </div>
          </div>
        )}
        {children && children}
      </div>
    </div>
  );
};

export default Alert;
