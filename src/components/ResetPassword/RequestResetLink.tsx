'use client';
import Button from '@app/components/Common/Button';
import PlexLogo from '@app/assets/services/plex.svg';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import axios from 'axios';
import { Field, Form, Formik } from 'formik';
import Link from 'next/link';
import { useState } from 'react';
import * as Yup from 'yup';
import { FormattedMessage, useIntl } from 'react-intl';

const ResetPassword = () => {
  const intl = useIntl();
  const [hasSubmitted, setSubmitted] = useState(false);

  const ResetSchema = Yup.object().shape({
    email: Yup.string()
      .email(
        intl.formatMessage({
          id: 'email.required',
          defaultMessage: 'You must provide a valid email address',
        })
      )
      .required(
        intl.formatMessage({
          id: 'email.required',
          defaultMessage: 'You must provide a valid email address',
        })
      ),
  });

  return (
    <>
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="container max-w-lg mx-auto py-14 px-4">
        <div className="text-start px-2 mb-4 relative">
          <h2 className="text-2xl font-extrabold mb-2">
            <FormattedMessage
              id="resetPassword.title"
              defaultMessage="Identify your account"
            />
          </h2>
          <p className="text-sm">
            <span className="font-bold">
              <FormattedMessage
                id="resetPassword.email.label"
                defaultMessage="Please enter the email address associated to your Local account."
              />
            </span>{' '}
            <FormattedMessage
              id="resetPassword.email.note"
              defaultMessage="Note that Plex users must reset their password from the {plexLogo} login window."
              values={{
                plexLogo: <PlexLogo className="inline-block size-9" />,
              }}
            />
          </p>
        </div>
        <div className="bg-secondary backdrop-blur-md bg-opacity-50 shadow rounded-lg border border-secondary">
          <div className="p-4">
            {hasSubmitted ? (
              <>
                <h2 className="text-2xl font-extrabold mb-2">
                  <FormattedMessage
                    id="resetPassword.email.sent"
                    defaultMessage="Check your email"
                  />
                </h2>
                <p className="text-md text-gray-300">
                  <span className="font-bold">
                    <FormattedMessage
                      id="resetPassword.email.sent.label"
                      defaultMessage="Please check your email to access the reset password link."
                    />
                  </span>{' '}
                  <FormattedMessage
                    id="resetPassword.email.sent.note"
                    defaultMessage="If you do not receive it, your address may be incorrect or not associated to an existing account."
                  />
                </p>
                <span className="mt-4 flex justify-center rounded-md shadow-sm">
                  <Button
                    as="link"
                    href="/signin"
                    buttonType="primary"
                    className="btn-block"
                  >
                    <span>
                      <FormattedMessage
                        id="resetPassword.backToSignIn"
                        defaultMessage="Back to Sign in"
                      />
                    </span>
                  </Button>
                </span>
                <p className="mt-2 text-center">
                  <Link href="/help" className="text-warning text-sm">
                    <span>
                      <FormattedMessage
                        id="resetPassword.help"
                        defaultMessage="Wait, I need more help"
                      />
                    </span>
                  </Link>
                </p>
              </>
            ) : (
              <Formik
                initialValues={{
                  email: '',
                }}
                validationSchema={ResetSchema}
                onSubmit={async (values) => {
                  const response = await axios.post(
                    `/api/v1/auth/reset-password`,
                    {
                      email: values.email,
                    }
                  );

                  if (response.status === 200) {
                    setSubmitted(true);
                  }
                }}
              >
                {({ errors, touched, isSubmitting, isValid }) => {
                  return (
                    <Form>
                      <div>
                        <div className="mt-4 mb-2 sm:col-span-2">
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
                                defaultMessage: 'Email Address',
                              })}
                            />
                          </div>
                          {errors.email &&
                            touched.email &&
                            typeof errors.email === 'string' && (
                              <div className="text-error">{errors.email}</div>
                            )}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-primary pt-5 mb-4">
                        <Button
                          buttonType="primary"
                          className="btn-block"
                          type="submit"
                          disabled={isSubmitting || !isValid}
                        >
                          <span>
                            <FormattedMessage
                              id="common.continue"
                              defaultMessage="Continue"
                            />
                          </span>
                        </Button>
                      </div>
                    </Form>
                  );
                }}
              </Formik>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
