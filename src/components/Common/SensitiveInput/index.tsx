'use client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Field } from 'formik';
import { useState } from 'react';

interface CustomInputProps extends React.ComponentProps<'input'> {
  as?: 'input';
}

interface CustomFieldProps extends React.ComponentProps<typeof Field> {
  as?: 'field';
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput = ({
  as = 'input',
  size = 'md',
  ...props
}: SensitiveInputProps) => {
  const [isHidden, setHidden] = useState(true);
  const Component = as === 'input' ? 'input' : Field;
  const componentProps =
    as === 'input'
      ? props
      : {
          ...props,
          as: props.type === 'textarea' && !isHidden ? 'textarea' : undefined,
        };
  return (
    <>
      <Component
        {...componentProps}
        className={`rounded-r-none ${componentProps.className ?? ''}`}
        type={
          isHidden
            ? 'password'
            : props.type !== 'password'
              ? (props.type ?? 'text')
              : 'text'
        }
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        type="button"
        className={`btn btn-primary btn-${size} rounded-none last:rounded-r-md`}
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
