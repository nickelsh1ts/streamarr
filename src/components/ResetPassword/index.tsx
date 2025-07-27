'use client';
import Button from '@app/components/Common/Button';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import LanguagePicker from '@app/components/Layout/LanguagePicker';
import { ArrowDownTrayIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

const ResetPassword = ({ guid }: { guid: string }) => {
  const [hasSubmitted, setSubmitted] = useState(false);

  const ResetSchema = Yup.object().shape({
    password: Yup.string()
      .required('You must provide a password')
      .min(8, 'Password is too short; should be a minimum of 8 characters'),
    confirmPassword: Yup.string()
      .required('Passwords must match')
      .test('passwords-match', 'Passwords must match', function (value) {
        return this.parent.password === value;
      }),
  });

  return (
    <>
      <div className="absolute top-4 right-4">
        <LanguagePicker />
      </div>
      <div className="container max-w-lg mx-auto py-14 px-4">
        <div className="text-start px-2 mb-4 relative">
          <h2 className="text-2xl font-extrabold mb-2">Reset your password</h2>
          <p className="text-sm">
            Please enter a new password for your local account.
          </p>
        </div>
        <div className="bg-secondary backdrop-blur-md bg-opacity-50 shadow rounded-lg border border-secondary">
          <div className="p-4">
            {hasSubmitted ? (
              <>
                <p className="text-md font-bold mb-2 mt-4">
                  Password reset successfully!
                </p>
                <span className="my-4 flex justify-center rounded-md shadow-sm">
                  <Button
                    as="link"
                    href="/signin"
                    buttonType="primary"
                    className="btn-block"
                  >
                    <span>Back to Sign in</span>
                  </Button>
                </span>
              </>
            ) : (
              <Formik
                initialValues={{
                  confirmPassword: '',
                  password: '',
                }}
                validationSchema={ResetSchema}
                onSubmit={async (values) => {
                  const response = await axios.post(
                    `/api/v1/auth/reset-password/${guid}`,
                    {
                      password: values.password,
                    }
                  );

                  if (response.status === 200) {
                    setSubmitted(true);
                  }
                }}
              >
                {({ errors, touched, isSubmitting, isValid }) => {
                  return (
                    <Form className="mt-4">
                      <div>
                        <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
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
                              placeholder="Password"
                            />
                          </div>
                          {errors.password &&
                            touched.password &&
                            typeof errors.password === 'string' && (
                              <div className="text-error">
                                {errors.password}
                              </div>
                            )}
                        </div>
                        <div className="mt-1 mb-2 sm:col-span-2 sm:mt-0">
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
                              id="confirmPassword"
                              name="confirmPassword"
                              placeholder="Confirm password"
                            />
                          </div>
                          {errors.confirmPassword &&
                            touched.confirmPassword && (
                              <div className="text-error">
                                {errors.confirmPassword}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-primary pt-5 mb-4">
                        <Button
                          buttonType="primary"
                          type="submit"
                          className="btn-block"
                          disabled={isSubmitting || !isValid}
                        >
                          <ArrowDownTrayIcon className="size-7 mr-2" />
                          <span>
                            {isSubmitting ? 'Saving...' : 'Save changes'}
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
