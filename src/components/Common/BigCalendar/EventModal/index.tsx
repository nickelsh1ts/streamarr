'use client';
import type { eventProps } from '@app/components/Common/BigCalendar';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import useLocale from '@app/hooks/useLocale';
import { useUser, Permission } from '@app/hooks/useUser';
import { registerDatePickerLocale } from '@app/utils/datepickerLocale';
import { ClockIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { useIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import * as Yup from 'yup';

interface EventModalProps {
  selectedEvent: eventProps | null;
  open: boolean;
  subtitle: string;
  onClose: () => void;
  onDelete: () => void;
  onSave: () => void;
}

const DatePickerField = ({ values, ...props }) => {
  const { locale } = useLocale();
  const intl = useIntl();

  useEffect(() => {
    registerDatePickerLocale(locale);
  }, [locale]);

  const datePickerLocale = locale !== 'en' ? locale : undefined;
  const { setFieldValue } = useFormikContext();
  return (
    <>
      {values.allDay ? (
        <DatePicker
          {...props}
          selected={values.start ? new Date(values.start) : null}
          locale={datePickerLocale}
          showIcon
          toggleCalendarOnIconClick
          closeOnScroll
          onChange={(start: Date) => {
            const startDate = new Date(start);
            const endDate = new Date(start);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            setFieldValue('start', startDate);
            setFieldValue('end', endDate);
          }}
          startDate={values.start ? new Date(values.start) : null}
          showYearDropdown
          yearDropdownItemNumber={2}
          scrollableYearDropdown
          showMonthDropdown
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-primary"
            >
              <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
              <path
                fillRule="evenodd"
                d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      ) : (
        <>
          <DatePicker
            {...props}
            selected={values.start ? new Date(values.start) : null}
            locale={datePickerLocale}
            showIcon
            toggleCalendarOnIconClick
            closeOnScroll
            onChange={(dates) => {
              const [start, end] = dates;
              setFieldValue('start', start);
              setFieldValue('end', end);
            }}
            startDate={values.start ? new Date(values.start) : null}
            endDate={values.end ? new Date(values.end) : null}
            showYearDropdown
            yearDropdownItemNumber={2}
            scrollableYearDropdown
            showMonthDropdown
            selectsRange
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-primary-content"
              >
                <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                <path
                  fillRule="evenodd"
                  d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <div className="flex flex-row gap-2 mt-2">
            <DatePicker
              {...props}
              selected={values.start ? new Date(values.start) : null}
              locale={datePickerLocale}
              showIcon
              toggleCalendarOnIconClick
              closeOnScroll
              onChange={(date: Date | null) => {
                setFieldValue('start', date);
              }}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="h:mm aa"
              timeCaption={intl.formatMessage({
                id: 'common.startTime',
                defaultMessage: 'Start Time',
              })}
              icon={<ClockIcon className="text-primary-content" />}
            />
            <span className="text-primary text-xl font-bold mx-2"> - </span>
            <DatePicker
              {...props}
              selected={values.end ? new Date(values.end) : null}
              locale={datePickerLocale}
              showIcon
              toggleCalendarOnIconClick
              closeOnScroll
              onChange={(date: Date | null) => {
                setFieldValue('end', date);
              }}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              dateFormat="h:mm aa"
              timeCaption={intl.formatMessage({
                id: 'common.endTime',
                defaultMessage: 'End Time',
              })}
              icon={<ClockIcon className="text-primary-content" />}
            />
          </div>
        </>
      )}
    </>
  );
};

const EventModal = ({
  selectedEvent,
  subtitle,
  open,
  onClose,
  onDelete,
  onSave,
}: EventModalProps) => {
  const intl = useIntl();
  const { user, hasPermission } = useUser();

  const [edit, setEdit] = useState(false);

  const EventSchema = Yup.object().shape({
    summary: Yup.string().required(
      intl.formatMessage({
        id: 'event.summaryRequired',
        defaultMessage: 'You must provide a valid summary',
      })
    ),
    description: Yup.string().required(
      intl.formatMessage({
        id: 'event.descriptionRequired',
        defaultMessage: 'You must provide a valid description',
      })
    ),
    categories: Yup.string().required(
      intl.formatMessage({
        id: 'event.categoriesRequired',
        defaultMessage: 'You must provide at least one category',
      })
    ),
    start: Yup.date().required(
      intl.formatMessage({
        id: 'event.startDateRequired',
        defaultMessage: 'You must provide a valid start date',
      })
    ),
    end: Yup.date().when('allDay', {
      is: false,
      then: (schema) =>
        schema.required(
          intl.formatMessage({
            id: 'event.endDateRequired',
            defaultMessage:
              'You must provide a valid end date for non-all-day events',
          })
        ),
      otherwise: (schema) => schema.notRequired(),
    }),
    allDay: Yup.boolean(),
    sendNotification: Yup.boolean().test(
      'not-past-event',
      intl.formatMessage({
        id: 'event.sendNotificationPastEvent',
        defaultMessage: 'Cannot send notifications for past events',
      }),
      function (value) {
        const { start } = this.parent;
        // If sendNotification is true, ensure start date is not in the past
        if (value === true && start && moment(start).isBefore(moment())) {
          return false;
        }
        return true;
      }
    ),
  });

  // Determine if we're in view-only mode
  const isViewMode = selectedEvent && !edit;
  // Determine if we're creating a new event (no selectedEvent.id)
  const isNewEvent = !selectedEvent?.id;

  // View-only mode - no permissions check needed for the modal wrapper
  if (isViewMode) {
    return (
      <Modal
        onCancel={() => {
          onClose();
          setEdit(false);
        }}
        title={selectedEvent?.title || ''}
        subtitle={subtitle}
        show={open}
      >
        <div className="space-y-2">
          {selectedEvent.categories && selectedEvent.categories.length > 0 && (
            <div className="flex items-center text-neutral">
              <span>
                {Array.isArray(selectedEvent.categories)
                  ? selectedEvent.categories.join(', ')
                  : selectedEvent.categories}
              </span>
            </div>
          )}
          {selectedEvent.description && <div>{selectedEvent.description}</div>}
          {selectedEvent.status && (
            <div>
              <span className="font-semibold">
                <FormattedMessage
                  id="calendar.status"
                  defaultMessage="Status:"
                />
              </span>
              <span className="ml-2">{selectedEvent.status}</span>
            </div>
          )}
          {selectedEvent.type === 'local' &&
            hasPermission(
              [Permission.CREATE_EVENTS, Permission.MANAGE_EVENTS],
              { type: 'or' }
            ) && (
              <>
                <div>
                  <span className="font-semibold">
                    <FormattedMessage
                      id="calendar.createdBy"
                      defaultMessage="Created By:"
                    />
                  </span>
                  <span className="ml-2">
                    {selectedEvent.createdBy?.displayName}
                  </span>
                </div>
                {(hasPermission(Permission.MANAGE_EVENTS) ||
                  (hasPermission(Permission.CREATE_EVENTS) &&
                    selectedEvent?.createdBy.id === user?.id)) && (
                  <div className="flex place-content-end mt-2 gap-2">
                    <button
                      onClick={() => setEdit(true)}
                      className="btn btn-sm btn-primary"
                    >
                      <FormattedMessage
                        id="calendar.editEvent"
                        defaultMessage="Edit Event"
                      />
                    </button>
                    <ConfirmButton
                      buttonSize="sm"
                      onClick={() => onDelete()}
                      confirmText={intl.formatMessage({
                        id: 'common.areYouSure',
                        defaultMessage: 'Are you sure?',
                      })}
                    >
                      <TrashIcon className="size-5 mr-2" />
                      <span>
                        <FormattedMessage
                          id="calendar.deleteEvent"
                          defaultMessage="Delete Event"
                        />
                      </span>
                    </ConfirmButton>
                  </div>
                )}
              </>
            )}
          {selectedEvent.uid &&
            hasPermission([Permission.ADMIN], { type: 'or' }) && (
              <div className="flex items-center place-content-end text-xs mt-2 text-neutral">
                <span className="font-semibold">
                  <FormattedMessage id="calendar.uid" defaultMessage="UID:" />
                </span>
                <span className="ml-2">{selectedEvent.uid}</span>
              </div>
            )}
        </div>
      </Modal>
    );
  }

  // Check permissions for create/edit mode
  if (
    !hasPermission([Permission.MANAGE_EVENTS, Permission.CREATE_EVENTS], {
      type: 'or',
    }) ||
    !open
  ) {
    return (
      <Modal
        onCancel={() => {
          onClose();
          setEdit(false);
        }}
        title=""
        show={open}
      >
        <span>
          <FormattedMessage
            id="calendar.noEventSelected"
            defaultMessage="No event selected."
          />
        </span>
      </Modal>
    );
  }

  // Create/Edit mode with Formik
  return (
    <Formik
      enableReinitialize
      initialValues={{
        uid: selectedEvent?.uid ?? '',
        summary: selectedEvent?.title ?? '',
        description: selectedEvent?.description ?? '',
        start: selectedEvent?.start ?? new Date(),
        end:
          selectedEvent?.end ??
          (() => {
            const date = new Date();
            date.setHours(date.getHours() + 1);
            return date;
          })(),
        allDay: selectedEvent?.allDay ?? false,
        categories: selectedEvent?.categories ?? '',
        status: selectedEvent?.status ?? 'TENTATIVE',
        sendNotification: selectedEvent?.sendNotification ?? false,
      }}
      validationSchema={EventSchema}
      onSubmit={async (values, { resetForm }) => {
        try {
          const submission = {
            uid: values.uid ?? '',
            summary: values.summary,
            description: values.description,
            start: values.start,
            end: values.end,
            allDay: values.allDay,
            categories: values.categories,
            status: values.status,
            sendNotification: values.sendNotification,
          };
          if (!selectedEvent?.id) {
            await axios.post('/api/v1/calendar/local', submission);
          } else {
            await axios.put(
              `/api/v1/calendar/local/${selectedEvent.id}`,
              submission
            );
          }
          resetForm();
          onSave();
          setEdit(false);
        } catch (e) {
          Toast({
            title: intl.formatMessage({
              id: 'common.eventError',
              defaultMessage: 'Something went wrong while saving the event',
            }),
            message: e.message,
            type: 'error',
            icon: <XCircleIcon className="size-7" />,
          });
        }
      }}
    >
      {({ errors, touched, values, handleSubmit, isSubmitting, isValid }) => {
        return (
          <Modal
            onCancel={() => {
              if (isNewEvent) {
                // Close modal for new events
                onClose();
              } else {
                // Revert to view mode for existing events
                setEdit(false);
              }
            }}
            cancelText={intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
            cancelButtonType="default"
            okButtonType="primary"
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving...',
                  })
                : isNewEvent
                  ? intl.formatMessage({
                      id: 'common.createEvent',
                      defaultMessage: 'Create Event',
                    })
                  : intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
            }
            onOk={() => handleSubmit()}
            okDisabled={isSubmitting || !isValid}
            title={
              isNewEvent
                ? intl.formatMessage({
                    id: 'calendar.createEvent',
                    defaultMessage: 'Create an Event',
                  })
                : intl.formatMessage({
                    id: 'calendar.editEvent',
                    defaultMessage: 'Edit Event',
                  })
            }
            show={open}
          >
            <Form className="space-y-2">
              <div className="border-t border-primary pt-4">
                <label
                  htmlFor="summary"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="calendar.eventSummary"
                    defaultMessage="Summary"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <Field
                    id="summary"
                    name="summary"
                    type="text"
                    className={`input input-sm input-primary rounded-md w-full ${
                      errors.summary && touched.summary ? 'input-error' : ''
                    }`}
                  />
                  {errors.summary &&
                    touched.summary &&
                    typeof errors.summary === 'string' && (
                      <div className="text-error">{errors.summary}</div>
                    )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="allDay"
                  className="flex items-center text-sm font-medium leading-6 text-left gap-2"
                >
                  <Field
                    name="allDay"
                    id="allDay"
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <FormattedMessage
                    id="calendar.eventAllDay"
                    defaultMessage="All Day Event"
                  />
                </label>
              </div>
              <div>
                <label
                  htmlFor="dates"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  {!values.allDay ? (
                    <FormattedMessage
                      id="calendar.eventDates"
                      defaultMessage="Start & End Dates"
                    />
                  ) : (
                    <FormattedMessage
                      id="calendar.date"
                      defaultMessage="Date"
                    />
                  )}
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <DatePickerField
                    name="dates"
                    id="dates"
                    values={values}
                    className="input input-sm input-primary w-full"
                  />
                  {errors.start &&
                    touched.start &&
                    typeof errors.start === 'string' && (
                      <div className="text-error">{errors.start}</div>
                    )}
                  {errors.end &&
                    touched.end &&
                    typeof errors.end === 'string' && (
                      <div className="text-error">{errors.end}</div>
                    )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="categories"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="calendar.eventCategories"
                    defaultMessage="Categories"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <Field
                    id="categories"
                    name="categories"
                    className={`input input-sm input-primary rounded-md w-full ${
                      errors.categories && touched.categories
                        ? 'input-error'
                        : ''
                    }`}
                  />
                  {errors.categories &&
                    touched.categories &&
                    typeof errors.categories === 'string' && (
                      <div className="text-error">{errors.categories}</div>
                    )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="calendar.eventDescription"
                    defaultMessage="Description"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <div>
                  <Field
                    as="textarea"
                    id="description"
                    name="description"
                    rows={6}
                    className={`input input-sm input-primary rounded-md w-full h-32 leading-normal ${
                      errors.description && touched.description
                        ? 'input-error'
                        : ''
                    }`}
                  />
                  {errors.description &&
                    touched.description &&
                    typeof errors.description === 'string' && (
                      <div className="text-error">{errors.description}</div>
                    )}
                </div>
              </div>
              <div>
                <label
                  htmlFor="sendNotification"
                  className="flex items-center text-sm font-medium leading-6 text-left gap-2"
                >
                  <Field
                    name="sendNotification"
                    id="sendNotification"
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    disabled={
                      values.start &&
                      moment(values.start).isBefore(moment()) &&
                      !values.sendNotification
                    }
                  />
                  <FormattedMessage
                    id="common.sendNotification"
                    defaultMessage="Send Notification"
                  />
                </label>
                {errors.sendNotification && touched.sendNotification && (
                  <div className="text-error text-sm mt-1">
                    {errors.sendNotification}
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="common.status"
                    defaultMessage="Status"
                  />
                </label>
                <div>
                  <Field
                    as="select"
                    id="status"
                    name="status"
                    className="select select-sm select-primary w-full"
                  >
                    <option value="TENTATIVE">
                      {intl.formatMessage({
                        id: 'calendar.statusTentative',
                        defaultMessage: 'Tentative',
                      })}
                    </option>
                    <option value="CONFIRMED">
                      {intl.formatMessage({
                        id: 'calendar.statusConfirmed',
                        defaultMessage: 'Confirmed',
                      })}
                    </option>
                    <option value="CANCELLED">
                      {intl.formatMessage({
                        id: 'calendar.statusCancelled',
                        defaultMessage: 'Cancelled',
                      })}
                    </option>
                  </Field>
                </div>
              </div>
              <div>
                <label
                  htmlFor="uid"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage
                    id="calendar.eventId"
                    defaultMessage="UID"
                  />
                  <span className="text-neutral ml-2">
                    (
                    <FormattedMessage
                      id="common.optional"
                      defaultMessage="optional"
                    />
                    )
                  </span>
                </label>
                <div>
                  <Field
                    id="uid"
                    name="uid"
                    className="input input-sm input-primary rounded-md w-full"
                  />
                </div>
              </div>
            </Form>
          </Modal>
        );
      }}
    </Formik>
  );
};
export default EventModal;
