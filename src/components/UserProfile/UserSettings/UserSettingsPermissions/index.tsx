'use client';
import Alert from '@app/components/Common/Alert';
import Button from '@app/components/Common/Button';
import PermissionEdit from '@app/components/Admin/PermissionEdit';
import { useUser } from '@app/hooks/useUser';
import axios from 'axios';
import { Form, Formik } from 'formik';
import useSWR from 'swr';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Error from '@app/app/error';
import Toast from '@app/components/Toast';
import { ArrowDownTrayIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { useParams } from 'next/navigation';
import { FormattedMessage, useIntl } from 'react-intl';

const UserPermissions = () => {
  const searchParams = useParams<{ userid: string }>();
  const intl = useIntl();
  const { user: currentUser } = useUser();
  const { user, revalidate: revalidateUser } = useUser({
    id: Number(searchParams.userid),
  });
  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<{ permissions?: number }>(
    user ? `/api/v1/user/${user?.id}/settings/permissions` : null
  );

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return (
      <Error
        statusCode={500}
        error={{ name: 'Error', message: 'No Data' }}
        reset={() => {}}
      />
    );
  }

  if (currentUser?.id !== 1 && currentUser?.id === user?.id) {
    return (
      <>
        <div className="mb-6 mt-3">
          <h3 className="text-2xl font-extrabold">
            <FormattedMessage
              id="settings.permissions"
              defaultMessage="Permissions"
            />
          </h3>
        </div>
        <Alert
          title={
            <FormattedMessage
              id="userSettings.cannotModifyOwnPermissions"
              defaultMessage="You cannot modify your own permissions"
            />
          }
          type="error"
        />
      </>
    );
  }

  return (
    <div className="mb-6 mt-3">
      <h3 className="text-2xl font-extrabold">
        <FormattedMessage
          id="settings.permissions"
          defaultMessage="Permissions"
        />
      </h3>
      <Formik
        initialValues={{
          currentPermissions: data?.permissions,
        }}
        enableReinitialize
        onSubmit={async (values) => {
          try {
            await axios.post(`/api/v1/user/${user?.id}/settings/permissions`, {
              permissions: values.currentPermissions ?? 0,
            });

            Toast({
              title: intl.formatMessage({
                id: 'userSettings.permissionsSaved',
                defaultMessage: 'Permissions saved successfully!',
              }),
              type: 'success',
              icon: <CheckBadgeIcon className="size-7" />,
            });
          } catch (e) {
            Toast({
              title: intl.formatMessage({
                id: 'settings.saveError',
                defaultMessage: 'Something went wrong while saving settings.',
              }),
              type: 'error',
              message: e.message,
            });
          } finally {
            revalidate();
            revalidateUser();
          }
        }}
      >
        {({ isSubmitting, setFieldValue, values }) => {
          return (
            <Form>
              <div className="mt-5 max-w-6xl space-y-5">
                <PermissionEdit
                  actingUser={currentUser}
                  currentUser={user}
                  currentPermission={values.currentPermissions ?? 0}
                  onUpdate={(newPermission) =>
                    setFieldValue('currentPermissions', newPermission)
                  }
                />
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <ArrowDownTrayIcon className="size-4 mr-2" />
                    <span>
                      {isSubmitting ? (
                        <FormattedMessage
                          id="common.saving"
                          defaultMessage="Saving..."
                        />
                      ) : (
                        <FormattedMessage
                          id="common.saveChanges"
                          defaultMessage="Save Changes"
                        />
                      )}
                    </span>
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

export default UserPermissions;
