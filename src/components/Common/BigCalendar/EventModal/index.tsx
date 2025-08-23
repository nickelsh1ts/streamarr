'use client';
import type { eventProps } from '@app/components/Common/BigCalendar';
import Button from '@app/components/Common/Button';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import useLocale from '@app/hooks/useLocale';
import { useUser, Permission } from '@app/hooks/useUser';
import { registerDatePickerLocale } from '@app/utils/datepickerLocale';
import {
  ArrowDownTrayIcon,
  ClockIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import axios from 'axios';
import { Field, Form, Formik, useFormikContext } from 'formik';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { useIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
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
              className=""
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
              icon={<ClockIcon className="text-primary" />}
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
              icon={<ClockIcon className="text-primary" />}
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
  });

  return (
    <Modal
      onCancel={() => {
        onClose();
        setEdit(false);
      }}
      title={edit ? 'Edit Event' : selectedEvent?.title || 'Create an Event'}
      subtitle={edit ? null : subtitle}
      show={open}
    >
      {selectedEvent && !edit ? (
        <div className="space-y-2">
          {selectedEvent.categories && selectedEvent.categories.length > 0 && (
            <div className="flex items-center text-neutral-400">
              <span>
                {Array.isArray(selectedEvent.categories)
                  ? selectedEvent.categories.join(', ')
                  : selectedEvent.categories}
              </span>
            </div>
          )}
          {selectedEvent.description && (
            <div className="text-primary-content">
              {selectedEvent.description}
            </div>
          )}
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
              <div className="flex items-center place-content-end text-xs mt-2 text-neutral-400">
                <span className="font-semibold">
                  <FormattedMessage id="calendar.uid" defaultMessage="UID:" />
                </span>
                <span className="ml-2">{selectedEvent.uid}</span>
              </div>
            )}
        </div>
      ) : !hasPermission([Permission.MANAGE_EVENTS, Permission.CREATE_EVENTS], {
          type: 'or',
        }) || !open ? (
        <span>
          <FormattedMessage
            id="calendar.noEventSelected"
            defaultMessage="No event selected."
          />
        </span>
      ) : (
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
          }}
          validationSchema={EventSchema}
          onSubmit={async (values) => {
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
              };
              if (!selectedEvent?.id) {
                await axios.post('/api/v1/calendar/local', submission);
              } else {
                await axios.put(
                  `/api/v1/calendar/local/${selectedEvent.id}`,
                  submission
                );
              }
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
          {({
            errors,
            touched,
            values,
            handleSubmit,
            isSubmitting,
            isValid,
          }) => (
            <Form className="space-y-2" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="summary">
                  <FormattedMessage
                    id="calendar.eventSummary"
                    defaultMessage="Summary"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      name="summary"
                      id="summary"
                      type="text"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.summary &&
                    touched.summary &&
                    typeof errors.summary === 'string' && (
                      <div className="text-error">{errors.summary}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="allDay">
                  <FormattedMessage
                    id="calendar.eventAllDay"
                    defaultMessage="All Day Event"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    name="allDay"
                    id="allDay"
                    type="checkbox"
                    className="checkbox checkbox-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="dates">
                  {!values.allDay ? (
                    <FormattedMessage
                      id="calendar.eventDates"
                      defaultMessage="Start & End Dates"
                    />
                  ) : (
                    <FormattedMessage
                      id="calendar.eventDate"
                      defaultMessage="Date"
                    />
                  )}
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="categories">
                  <FormattedMessage
                    id="calendar.eventCategories"
                    defaultMessage="Categories"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      name="categories"
                      id="categories"
                      className="input input-sm input-primary w-full"
                    />
                  </div>
                  {errors.categories &&
                    touched.categories &&
                    typeof errors.categories === 'string' && (
                      <div className="text-error">{errors.categories}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="description">
                  <FormattedMessage
                    id="calendar.eventDescription"
                    defaultMessage="Description"
                  />
                  <span className="text-error ml-2">*</span>
                </label>
                <div className="sm:col-span-2">
                  <div className="flex">
                    <Field
                      name="description"
                      id="description"
                      as="textarea"
                      className="textarea textarea-primary w-full leading-5"
                    />
                  </div>
                  {errors.description &&
                    touched.description &&
                    typeof errors.description === 'string' && (
                      <div className="text-error">{errors.description}</div>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="status">
                  <FormattedMessage
                    id="calendar.eventStatus"
                    defaultMessage="Status"
                  />
                </label>
                <div className="sm:col-span-2">
                  <Field
                    name="status"
                    id="status"
                    as="select"
                    className="select select-sm select-primary"
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
              <div className="grid grid-cols-1 sm:grid-cols-3 space-y-2 sm:space-x-2 sm:space-y-0">
                <label htmlFor="uid">
                  <FormattedMessage
                    id="calendar.eventId"
                    defaultMessage="UID"
                  />
                  <span className="text-sm font-light text-neutral-300 ml-2">
                    (
                    <FormattedMessage
                      id="common.optional"
                      defaultMessage="optional"
                    />
                    )
                  </span>
                </label>
                <div className="sm:col-span-2">
                  <Field
                    name="uid"
                    id="uid"
                    className="input input-sm input-primary w-full"
                  />
                </div>
              </div>
              <div className="divider divider-primary mb-0 col-span-full" />
              <div className="flex justify-end col-span-3 mt-4">
                <span className="ml-3 inline-flex rounded-md shadow-sm">
                  <Button
                    buttonType="primary"
                    buttonSize="sm"
                    type="submit"
                    disabled={isSubmitting || !isValid}
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
          )}
        </Formik>
      )}
    </Modal>
  );
};
export default EventModal;
