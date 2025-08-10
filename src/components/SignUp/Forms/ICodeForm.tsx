import Button from '@app/components/Common/Button';
import { TicketIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import type { FormikHelpers, FormikProps } from 'formik';
import { Field, Form, Formik } from 'formik';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

const ICodeForm = ({ onComplete }: { onComplete: (code: string) => void }) => {
  const searchParams = useSearchParams();
  const icode = searchParams.get('icode');
  const [error, setError] = useState<string | null>(null);
  const formikRef = useRef<FormikProps<{ icode: string }> | null>(null);
  const intl = useIntl();

  const validate = (values: { icode: string }) => {
    const errors: { icode?: string } = {};
    if (!values.icode || values.icode.trim() === '') {
      errors.icode = intl.formatMessage({
        id: 'iCodeForm.inviteCodeRequired',
        defaultMessage: 'Invite code is required',
      });
    } else if (values.icode.length < 4) {
      errors.icode = intl.formatMessage({
        id: 'iCodeForm.inviteCodeTooShort',
        defaultMessage: 'Invite code is too short',
      });
    }
    return errors;
  };

  useEffect(() => {
    if (
      icode &&
      formikRef.current &&
      formikRef.current.values.icode === icode
    ) {
      formikRef.current.submitForm();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Formik
      innerRef={formikRef}
      initialValues={{ icode: icode ?? '' }}
      validate={validate}
      onSubmit={async (
        values,
        { setSubmitting }: FormikHelpers<{ icode: string }>
      ) => {
        setError(null);
        try {
          const response = await axios.get<{
            valid: boolean;
            message?: string;
          }>(`/api/v1/signup/validate/${values.icode}`);
          if (response.status === 200 && response.data.valid) {
            setError(null);
            onComplete(values.icode);
          } else {
            setError(response.data.message || 'Invalid invite code.');
          }
        } catch (e) {
          setError(e?.response?.data?.message || 'Invalid invite code.');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({
        errors,
        touched,
        isSubmitting,
        isValid,
        values,
        handleSubmit,
        setFieldValue,
      }) => (
        <Form>
          <div>
            <div className="mt-4 mb-2 sm:col-span-2">
              {(error ||
                (errors.icode &&
                  touched.icode &&
                  typeof errors.icode === 'string')) && (
                <div className="mb-2 text-error font-semibold text-sm md:text-base uppercase">
                  {error || errors.icode}
                </div>
              )}
              <div className="input input-bordered input-primary flex items-center mb-2 uppercase text-lg ">
                <TicketIcon className="size-7 mr-2" />
                <Field
                  id="icode"
                  name="icode"
                  type="text"
                  className="grow"
                  aria-label={intl.formatMessage({
                    id: 'invite.code',
                    defaultMessage: 'Invite Code',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'invite.code',
                    defaultMessage: 'Invite code',
                  })}
                  defaultValue={values.icode}
                  required
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setFieldValue('icode', e.target.value);
                    setError(null);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t border-primary pt-5 mb-4">
            <Button
              type="submit"
              buttonType="primary"
              disabled={isSubmitting || !isValid}
              className="w-full"
              onClick={() => handleSubmit()}
            >
              {isSubmitting ? (
                <FormattedMessage
                  id="iCodeForm.validatingInviteCode"
                  defaultMessage="Validating Invite Code..."
                />
              ) : (
                <FormattedMessage
                  id="iCodeForm.letsGetStarted"
                  defaultMessage="Let's Get Started"
                />
              )}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default ICodeForm;
