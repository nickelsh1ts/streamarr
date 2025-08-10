'use client';
import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import { Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { FormattedMessage, useIntl } from 'react-intl';

interface LocalSignupFormProps {
  onSubmit: (values: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
}

const LocalSignupForm = ({
  onSubmit,
  isSubmitting,
  error,
}: LocalSignupFormProps) => {
  const intl = useIntl();

  const SignupSchema = Yup.object().shape({
    email: Yup.string()
      .email(
        intl.formatMessage({
          id: 'localSignup.emailInvalid',
          defaultMessage: 'Please enter a valid email address',
        })
      )
      .required(
        intl.formatMessage({
          id: 'localSignup.emailRequired',
          defaultMessage: 'Email address is required',
        })
      ),
    username: Yup.string()
      .min(
        3,
        intl.formatMessage({
          id: 'localSignup.usernameMinLength',
          defaultMessage: 'Username must be at least 3 characters',
        })
      )
      .max(
        20,
        intl.formatMessage({
          id: 'localSignup.usernameMaxLength',
          defaultMessage: 'Username must be less than 20 characters',
        })
      )
      .matches(
        /^[a-zA-Z0-9_-]+$/,
        intl.formatMessage({
          id: 'localSignup.usernameInvalidChars',
          defaultMessage:
            'Username can only contain letters, numbers, underscores, and hyphens',
        })
      )
      .required(
        intl.formatMessage({
          id: 'localSignup.usernameRequired',
          defaultMessage: 'Username is required',
        })
      ),
    password: Yup.string()
      .min(
        8,
        intl.formatMessage({
          id: 'localSignup.passwordMinLength',
          defaultMessage: 'Password must be at least 8 characters',
        })
      )
      .matches(
        /^(?=.*[a-z]).*$/,
        intl.formatMessage({
          id: 'localSignup.passwordLowercase',
          defaultMessage: 'Password must contain at least one lowercase letter',
        })
      )
      .required(
        intl.formatMessage({
          id: 'localSignup.passwordRequired',
          defaultMessage: 'Password is required',
        })
      ),
    confirmPassword: Yup.string()
      .oneOf(
        [Yup.ref('password'), null],
        intl.formatMessage({
          id: 'localSignup.passwordsMatch',
          defaultMessage: 'Passwords must match',
        })
      )
      .required(
        intl.formatMessage({
          id: 'localSignup.confirmPasswordRequired',
          defaultMessage: 'Please confirm your password',
        })
      ),
  });

  return (
    <Formik
      initialValues={{
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      }}
      validationSchema={SignupSchema}
      onSubmit={onSubmit}
    >
      {({ errors, touched, isValid }) => {
        return (
          <div className="p-4 place-content-center bg-secondary/50 border border-secondary rounded-b-lg">
            <Form className="mt-4">
              <div>
                <div className="input input-bordered input-primary flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70 me-2"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  <Field
                    id="username"
                    name="username"
                    type="text"
                    className="grow"
                    placeholder={intl.formatMessage({
                      id: 'common.displayName',
                      defaultMessage: 'Display Name',
                    })}
                  />
                </div>
                {errors.username && touched.username && (
                  <div className="text-center text-error my-2">
                    {errors.username}
                  </div>
                )}
                <div className="input input-bordered input-primary flex items-center mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70 me-2"
                  >
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    className="grow"
                    placeholder={intl.formatMessage({
                      id: 'common.emailAddress',
                      defaultMessage: 'Email Address',
                    })}
                  />
                </div>
                {errors.email && touched.email && (
                  <div className="text-center text-error my-2">
                    {errors.email}
                  </div>
                )}
                <div className="input input-bordered input-primary flex items-center mb-2 mt-5 pr-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70 me-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <SensitiveInput
                    as="field"
                    className="grow w-full"
                    id="password"
                    name="password"
                    placeholder={intl.formatMessage({
                      id: 'common.password',
                      defaultMessage: 'Password',
                    })}
                  />
                </div>
                {errors.password && touched.password && (
                  <div className="text-center text-error my-2">
                    {errors.password}
                  </div>
                )}
                <div className="input input-bordered input-primary flex items-center mb-2 pr-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-4 w-4 opacity-70 me-2"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <SensitiveInput
                    as="field"
                    className="grow w-full"
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder={intl.formatMessage({
                      id: 'common.confirmPassword',
                      defaultMessage: 'Confirm Password',
                    })}
                  />
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="text-center text-error my-2">
                    {errors.confirmPassword}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-center mb-2 text-error">
                    {error}
                  </div>
                )}
              </div>
              <Button
                buttonType="primary"
                className="btn-block"
                type="submit"
                disabled={isSubmitting || !isValid}
              >
                <span>
                  {isSubmitting ? (
                    <FormattedMessage
                      id="localSignup.creatingAccount"
                      defaultMessage="Creating Account..."
                    />
                  ) : (
                    <FormattedMessage
                      id="signUp.createAccount"
                      defaultMessage="Create Account"
                    />
                  )}
                </span>
              </Button>
            </Form>
          </div>
        );
      }}
    </Formik>
  );
};

export default LocalSignupForm;
