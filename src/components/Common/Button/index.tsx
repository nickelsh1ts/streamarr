import Link from 'next/link';
import type { ForwardedRef, JSX } from 'react';
import React from 'react';

export type ButtonType =
  | 'default'
  | 'primary'
  | 'error'
  | 'warning'
  | 'success'
  | 'ghost';

// Helper type to override types (overrides onClick)
type MergeElementProps<
  T extends React.ElementType,
  P extends Record<string, unknown>,
> = Omit<React.ComponentProps<T>, keyof P> & P;

type ElementTypes = 'button' | 'a' | 'link';

type Element<P extends ElementTypes = 'button'> = P extends 'a'
  ? HTMLAnchorElement
  : HTMLButtonElement;

type BaseProps<P> = {
  buttonType?: ButtonType;
  buttonSize?: 'default' | 'lg' | 'md' | 'sm';
  // Had to do declare this manually as typescript would assume e was of type any otherwise
  onClick?: (
    e: React.MouseEvent<P extends 'a' ? HTMLAnchorElement : HTMLButtonElement>
  ) => void;
};

type ButtonProps<P extends React.ElementType> = {
  as?: P;
  href?: string;
} & MergeElementProps<P, BaseProps<P>>;

function Button<P extends ElementTypes = 'button'>(
  {
    buttonType = 'default',
    buttonSize = 'default',
    as,
    href,
    children,
    className,
    ...props
  }: ButtonProps<P>,
  ref?: React.Ref<Element<P>>
): JSX.Element {
  const buttonStyle = ['btn rounded-md gap-0.5'];
  switch (buttonType) {
    case 'primary':
      buttonStyle.push('btn-primary');
      break;
    case 'error':
      buttonStyle.push('btn-error');
      break;
    case 'warning':
      buttonStyle.push('btn-warning');
      break;
    case 'success':
      buttonStyle.push('btn-success');
      break;
    case 'ghost':
      buttonStyle.push('btn-ghost');
      break;
    default:
      buttonStyle.push('btn-neutral');
  }

  switch (buttonSize) {
    case 'sm':
      buttonStyle.push('text-xs btn-sm');
      break;
    case 'lg':
      buttonStyle.push('text-xl btn-lg');
      break;
    case 'md':
    default:
      buttonStyle.push('text-lg btn-md');
  }

  buttonStyle.push(className ?? '');

  if (as === 'link') {
    return (
      <Link
        href={href}
        className={buttonStyle.join(' ')}
        {...(props as React.ComponentProps<'a'>)}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
      >
        <span className="flex items-center">{children}</span>
      </Link>
    );
  }
  if (as === 'a') {
    return (
      <a
        href={href}
        className={buttonStyle.join(' ')}
        {...(props as React.ComponentProps<'a'>)}
        ref={ref as ForwardedRef<HTMLAnchorElement>}
      >
        <span className="flex items-center">{children}</span>
      </a>
    );
  } else {
    return (
      <button
        className={buttonStyle.join(' ')}
        {...(props as React.ComponentProps<'button'>)}
        ref={ref as ForwardedRef<HTMLButtonElement>}
      >
        <span className="flex items-center">{children}</span>
      </button>
    );
  }
}

export default React.forwardRef(Button) as typeof Button;
