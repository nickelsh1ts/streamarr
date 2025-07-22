'use client';
import Error from '@app/app/error';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import SensitiveInput from '@app/components/Common/SensitiveInput';
import Toast from '@app/components/Toast';
import { Permission, useUser } from '@app/hooks/useUser';
import { ArrowDownTrayIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Form, Formik } from 'formik';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import * as Yup from 'yup';

const UserPasswordChange = () => {
  const searchParams = useParams<{ userid: string }>();
  const { user: currentUser } = useUser();
  const { user, hasPermission } = useUser({
    id: Number(searchParams.userid),
  });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<{ hasPassword: boolean }>(
    user ? `/api/v1/user/${user?.id}/settings/password` : null
  );

  const PasswordChangeSchema = Yup.object().shape({
    currentPassword: Yup.lazy(() =>
      data?.hasPassword && currentUser?.id === user?.id
        ? Yup.string().required('You must provide your current password')
        : Yup.mixed().optional()
    ),
    newPassword: Yup.string()
      .required('You must provide a new password')
      .min(8, 'Password is too short; should be a minimum of 8 characters'),
    confirmPassword: Yup.string()
      .required('You must confirm the new password')
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
  });

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return <Error statusCode={500} error={undefined} reset={() => {}} />;
  }

  if (
    currentUser?.id !== user?.id &&
    hasPermission(Permission.ADMIN) &&
    currentUser?.id !== 1
  ) {
    return (
      <>
        <div className="mb-6 mt-3">
          <h3 className="text-2xl font-extrabold">Password</h3>
        </div>
        <Alert
          title={"You do not have permission to modify this user's password."}
          type="error"
        />
      </>
    );
  }

  return (
    <div className="mb-6 mt-3">
      <h3 className="text-2xl font-extrabold mb-2">Password</h3>
      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
        validationSchema={PasswordChangeSchema}
        enableReinitialize
        onSubmit={async (values, { resetForm }) => {
          try {
            await axios.post(`/api/v1/user/${user?.id}/settings/password`, {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword,
            });

            Toast({ title: 'Password saved successfully!' });
          } catch (e) {
            Toast({
              title:
                data.hasPassword && user?.id === currentUser?.id
                  ? 'Something went wrong while saving the password. Was your current password entered correctly?'
                  : 'Something went wrong while saving the password.',
              type: 'error',
              icon: <XCircleIcon className="size-7" />,
              message: e.message,
            });
          } finally {
            revalidate();
            resetForm();
          }
        }}
      >
        {({ errors, touched, isSubmitting, isValid }) => {
          return (
            <Form className="mt-5">
              {!data.hasPassword && (
                <Alert
                  type="warning"
                  title={
                    user?.id === currentUser?.id
                      ? 'Your account currently does not have a password set. Configure a password below to enable sign-in as a "local user" using your email address.'
                      : 'This user account currently does not have a password set. Configure a password below to enable this account to sign in as a "local user."'
                  }
                />
              )}
              <div className="max-w-6xl space-y-5">
                {data.hasPassword && user?.id === currentUser?.id && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0 pb-6">
                    <label htmlFor="currentPassword" className="col-span-1">
                      Current Password
                    </label>
                    <div className="col-span-2">
                      <div className="flex">
                        <SensitiveInput
                          as="field"
                          id="currentPassword"
                          buttonSize="sm"
                          name="currentPassword"
                          className="input input-sm input-primary w-full"
                        />
                      </div>
                      {errors.currentPassword &&
                        touched.currentPassword &&
                        typeof errors.currentPassword === 'string' && (
                          <div className="text-error">
                            {errors.currentPassword}
                          </div>
                        )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="newPassword" className="col-span-1">
                    New Password
                  </label>
                  <div className="col-span-2">
                    <div className="flex">
                      <SensitiveInput
                        as="field"
                        id="newPassword"
                        buttonSize="sm"
                        name="newPassword"
                        className="input input-sm input-primary w-full"
                      />
                    </div>
                    {errors.newPassword &&
                      touched.newPassword &&
                      typeof errors.newPassword === 'string' && (
                        <div className="text-error">{errors.newPassword}</div>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                  <label htmlFor="confirmPassword" className="col-span-1">
                    Confirm Password
                  </label>
                  <div className="col-span-2">
                    <div className="flex">
                      <SensitiveInput
                        as="field"
                        id="confirmPassword"
                        buttonSize="sm"
                        name="confirmPassword"
                        className="input input-sm input-primary w-full"
                      />
                    </div>
                    {errors.confirmPassword &&
                      touched.confirmPassword &&
                      typeof errors.confirmPassword === 'string' && (
                        <div className="text-error">
                          {errors.confirmPassword}
                        </div>
                      )}
                  </div>
                </div>
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    type="submit"
                    buttonSize="sm"
                    disabled={isSubmitting || !isValid}
                  >
                    <ArrowDownTrayIcon className="size-4 mr-2" />
                    <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </span>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default UserPasswordChange;
