import Link from 'next/link';
import React from 'react';

interface BadgeProps {
  badgeType?:
    | 'default'
    | 'primary'
    | 'error'
    | 'warning'
    | 'success'
    | 'dark'
    | 'light';
  className?: string;
  href?: string;
  children: React.ReactNode;
}

const Badge = (
  { badgeType = 'default', className, href, children }: BadgeProps,
  ref?: React.Ref<HTMLElement>
) => {
  const badgeStyle = [
    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap',
  ];

  if (href) {
    badgeStyle.push('transition cursor-pointer !no-underline');
  } else {
    badgeStyle.push('cursor-default');
  }

  switch (badgeType) {
    case 'error':
      badgeStyle.push(
        'bg-error bg-opacity-80 border-error-content border text-error-content'
      );
      if (href) {
        badgeStyle.push('hover:bg-error bg-opacity-100');
      }
      break;
    case 'warning':
      badgeStyle.push(
        'bg-warning bg-opacity-80 border-warning-content border text-warning-content'
      );
      if (href) {
        badgeStyle.push('hover:bg-warning hover:bg-opacity-100');
      }
      break;
    case 'success':
      badgeStyle.push(
        'bg-success bg-opacity-80 border border-success-content text-success-content'
      );
      if (href) {
        badgeStyle.push('hover:bg-success hover:bg-opacity-100');
      }
      break;
    case 'dark':
      badgeStyle.push('bg-gray-900 !text-gray-400');
      if (href) {
        badgeStyle.push('hover:bg-gray-800');
      }
      break;
    case 'light':
      badgeStyle.push('bg-gray-700 !text-gray-300');
      if (href) {
        badgeStyle.push('hover:bg-gray-600');
      }
      break;
    default:
      badgeStyle.push(
        'bg-primary bg-opacity-80 border border-primary-content text-primary-content'
      );
      if (href) {
        badgeStyle.push('hover:bg-primary hover:bg-opacity-100');
      }
  }

  if (className) {
    badgeStyle.push(className);
  }

  if (href?.includes('://')) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={badgeStyle.join(' ')}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {children}
      </a>
    );
  } else if (href) {
    return (
      <Link
        href={href}
        className={badgeStyle.join(' ')}
        ref={ref as React.Ref<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  } else {
    return (
      <span
        className={badgeStyle.join(' ')}
        ref={ref as React.Ref<HTMLSpanElement>}
      >
        {children}
      </span>
    );
  }
};

export default React.forwardRef(Badge) as typeof Badge;
