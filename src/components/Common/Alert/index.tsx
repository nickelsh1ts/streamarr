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
    bgColor: 'border border-warning backdrop-blur bg-warning/20',
    titleColor: 'text-warning',
    textColor: 'text-warning',
    svg: <ExclamationTriangleIcon className="size-5" />,
  };

  switch (type) {
    case 'info':
      design = {
        bgColor: 'border border-info backdrop-blur bg-info/20',
        titleColor: 'text-info-content',
        textColor: 'text-info-content',
        svg: <InformationCircleIcon className="size-5" />,
      };
      break;
    case 'error':
      design = {
        bgColor: 'bg-error/20 backdrop-blur border border-error',
        titleColor: 'text-error-content',
        textColor: 'text-error-content',
        svg: <XCircleIcon className="size-5" />,
      };
      break;
    case 'primary':
      design = {
        bgColor: 'bg-primary/20 backdrop-blur border border-primary',
        titleColor: 'text-primary-content',
        textColor: 'text-primary-content',
        svg: <InformationCircleIcon className="size-5" />,
      };
      break;
  }

  return (
    <div className={`mb-4 rounded-md p-4 ${design.bgColor}`}>
      <div className={`flex flex-wrap gap-2 text-sm ${design.textColor}`}>
        <div className="flex w-full flex-wrap gap-2">
          <span className={`inline-flex gap-2 ${design.titleColor}`}>
            {design.svg}
            {title && <span className="flex-1 font-medium">{title}</span>}
          </span>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Alert;
