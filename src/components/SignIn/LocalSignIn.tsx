import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import useSettings from '@app/hooks/useSettings';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useState } from 'react';
import * as Yup from 'yup';
import { FormattedMessage, useIntl } from 'react-intl';

interface LocalLoginProps {
  revalidate: () => void;
}

const LocalLogin = ({ revalidate }: LocalLoginProps) => {
  const settings = useSettings();
  const [loginError, setLoginError] = useState<string | null>(null);
  const intl = useIntl();

  const LoginSchema = Yup.object().shape({
    email: Yup.string()
      .email()
      .required(
        intl.formatMessage({
          id: 'email.required',
          defaultMessage: 'You must provide a valid email address',
        })
      ),
    password: Yup.string().required(
      intl.formatMessage({
        id: 'signIn.passwordRequired',
        defaultMessage: 'You must provide a password',
      })
    ),
  });

  const passwordResetEnabled =
    settings.currentSettings.applicationUrl &&
    settings.currentSettings.emailEnabled;

  return (
    <Formik
      initialValues={{
        email: '',
        password: '',
      }}
      validationSchema={LoginSchema}
      onSubmit={async (values) => {
        try {
          await axios.post('/api/v1/auth/local', {
            email: values.email,
            password: values.password,
          });
        } catch {
          setLoginError(
            intl.formatMessage({
              id: 'signIn.loginError',
              defaultMessage: 'Something went wrong while trying to sign in.',
            })
          );
        } finally {
          revalidate();
        }
      }}
    >
      {({ errors, touched, isSubmitting, isValid }) => {
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
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                  <Field
                    id="email"
                    name="email"
                    type="text"
                    inputMode="email"
                    data-testid="email"
                    className="grow"
                    placeholder={intl.formatMessage({
                      id: 'common.emailAddress',
                      defaultMessage: 'Email address',
                    })}
                  />
                </div>
                {errors.email &&
                  touched.email &&
                  typeof errors.email === 'string' && (
                    <div className="text-center text-error my-2">
                      {errors.email}
                    </div>
                  )}
                <div className="input input-bordered input-primary flex items-center pr-0">
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
                    })}
                  />
                </div>
                {errors.password &&
                  touched.password &&
                  typeof errors.password === 'string' && (
                    <div className="text-center text-error my-2">
                      {errors.password}
                    </div>
                  )}
                <div className="form-control my-4">
                  <label className="flex cursor-pointer place-items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="checkbox checkbox-primary checkbox-xs me-2 rounded-md"
                    />
                    <span className="label-text">
                      <FormattedMessage
                        id="signIn.rememberMe"
                        defaultMessage="Remember me"
                      />
                    </span>
                  </label>
                </div>
                {loginError && (
                  <div className="text-sm text-center mb-2 text-error">
                    {loginError}
                  </div>
                )}
              </div>
              <Button
                buttonType="primary"
                className="btn-block"
                type="submit"
                disabled={isSubmitting || !isValid}
                data-testid="local-signin-button"
              >
                <span>
                  {isSubmitting ? (
                    <FormattedMessage
                      id="signIn.signingIn"
                      defaultMessage="Signing In…"
                    />
                  ) : (
                    <FormattedMessage
                      id="common.signIn"
                      defaultMessage="Sign In"
                    />
                  )}
                </span>
              </Button>
              {passwordResetEnabled && (
                <p className="mt-1 text-center">
                  <Link href="/resetpassword" className="text-warning text-sm">
                    <span>
                      <FormattedMessage
                        id="signIn.forgotPassword"
                        defaultMessage="Wait, I forgot my password"
                      />
                    </span>
                  </Link>
                </p>
              )}
            </Form>
          </div>
        );
      }}
    </Formik>
  );
};

export default LocalLogin;
