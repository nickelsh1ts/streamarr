import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

interface AlertProps {
  title?: React.ReactNode;
  type?: 'warning' | 'info' | 'error';
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
        bgColor: 'bg-error border border-error',
        titleColor: 'text-error-content',
        textColor: 'text-error-content',
        svg: <XCircleIcon className="size-5" />,
      };
      break;
  }

  return (
    <div className={`mb-4 rounded-md p-4 ${design.bgColor}`}>
      <div className="flex">
        <div className={`flex-shrink-0 ${design.titleColor}`}>{design.svg}</div>
        <div className="ml-3">
          {title && (
            <div className={`text-sm font-medium ${design.titleColor}`}>
              {title}
            </div>
          )}
          {children && (
            <div className={`mt-2 text-sm first:mt-0 ${design.textColor}`}>
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
