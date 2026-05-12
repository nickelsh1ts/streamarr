'use client';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { Field } from 'formik';
import { useState } from 'react';

interface SensitiveInputBaseProps {
  buttonSize?: 'sm' | 'md' | 'lg';
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface CustomInputProps
  extends React.ComponentProps<'input'>, SensitiveInputBaseProps {
  as?: 'input';
  type?: React.HTMLInputTypeAttribute | 'textarea';
}

interface CustomFieldProps
  extends React.ComponentProps<typeof Field>, SensitiveInputBaseProps {
  as: 'field';
  type?: React.HTMLInputTypeAttribute | 'textarea';
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
}

type SensitiveInputProps = CustomInputProps | CustomFieldProps;

const SensitiveInput = ({
  as = 'input',
  buttonSize = 'md',
  ...props
}: SensitiveInputProps) => {
  const [isHidden, setHidden] = useState(true);
  const isTextarea = 'type' in props && props.type === 'textarea';
  const Component = as === 'input' ? 'input' : Field;
  const componentProps =
    as === 'input'
      ? props
      : {
          ...props,
          as: isTextarea ? 'textarea' : undefined,
        };
  return (
    <>
      <Component
        autoComplete="off"
        data-1pignore="true"
        data-lpignore="true"
        data-bwignore="true"
        {...componentProps}
        className={`rounded-r-none ${componentProps.className ?? ''}`}
        placeholder={componentProps.placeholder}
        type={
          isTextarea
            ? undefined
            : isHidden
              ? 'password'
              : 'type' in props && props.type !== 'password'
                ? (props.type ?? 'text')
                : 'text'
        }
        style={
          isTextarea && isHidden
            ? { WebkitTextSecurity: 'disc', ...props.style }
            : props.style
        }
      />
      <button
        onClick={(e) => {
          e.preventDefault();
          setHidden(!isHidden);
        }}
        type="button"
        className={`btn btn-primary btn-${buttonSize} rounded-none last:rounded-r-md ${
          isTextarea ? 'h-auto self-stretch' : ''
        }`}
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
