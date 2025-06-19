'use client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Field } from 'formik';
import { useState } from 'react';

interface SensitiveInputBaseProps {
  buttonSize?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
}

interface CustomInputProps
  extends React.ComponentProps<'input'>,
    SensitiveInputBaseProps {
  as?: 'input';
}

interface CustomFieldProps
  extends React.ComponentProps<typeof Field>,
    SensitiveInputBaseProps {
  as: 'field';
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput = ({
  as = 'input',
  buttonSize = 'md',
  ...props
}: SensitiveInputProps) => {
  const [isHidden, setHidden] = useState(true);
  const isInput = as === 'input';
  const Component = isInput ? 'input' : Field;
  // Type guards for type and className
  const type = 'type' in props ? props.type : undefined;
  const className = 'className' in props ? props.className : undefined;
  const componentProps = isInput
    ? props
    : {
        ...props,
        as: type === 'textarea' && !isHidden ? 'textarea' : undefined,
      };
  return (
    <>
      <Component
        {...componentProps}
        className={`rounded-r-none ${className ?? ''}`}
        type={
          isHidden
            ? 'password'
            : type !== 'password'
              ? (type ?? 'text')
              : 'text'
        }
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        type="button"
        className={`btn btn-primary btn-${buttonSize} rounded-none last:rounded-r-md`}
      >
        {isHidden ? (
          <EyeSlashIcon className="size-5" />
        ) : (
          <EyeIcon className="size-5" />
        )}
      </button>
    </>
  );
};

export default SensitiveInput;
