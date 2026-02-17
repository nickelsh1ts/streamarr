'use client';
import Button from '@app/components/Common/Button';
import ImageUpload from '@app/components/Common/ImageUpload';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import {
  PlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import {
  CheckBadgeIcon,
  PencilIcon,
  TrashIcon,
  XCircleIcon,
  Bars3Icon,
} from '@heroicons/react/24/solid';
import type { WelcomeContentResponse } from '@server/interfaces/api/onboardingInterfaces';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { Formik, Form, Field } from 'formik';
import { useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import * as Yup from 'yup';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';

interface SortableItemProps {
  item: WelcomeContentResponse;
  onEdit: (item: WelcomeContentResponse) => void;
  onDelete: (id: number) => void;
}

const SortableItem = ({ item, onEdit, onDelete }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-base-200 rounded-lg ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-neutral hover:text-base-content touch-none"
        aria-label="Drag to reorder"
      >
        <Bars3Icon className="size-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-xs text-neutral truncate">
          {item.description || 'No description'}
        </p>
      </div>
      {(item.imageUrl || item.videoUrl || item.customHtml) && (
        <div className="flex-shrink-0 flex items-center gap-1 text-neutral">
          {item.imageUrl && <PhotoIcon className="size-4 text-primary" />}
          {item.imageUrl && item.videoUrl && <span>/</span>}
          {item.videoUrl && <VideoCameraIcon className="size-4 text-primary" />}
          {(item.imageUrl || item.videoUrl) && item.customHtml && (
            <span>/</span>
          )}
          {item.customHtml && (
            <CodeBracketIcon className="size-4 text-accent" />
          )}
        </div>
      )}
      <div className="flex-shrink-0">
        <span
          className={`badge ${item.enabled ? 'badge-success' : 'badge-neutral'}`}
        >
          {item.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          buttonSize="sm"
          buttonType="ghost"
          onClick={() => onEdit(item)}
          className="btn-square"
          aria-label="Edit"
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          buttonSize="sm"
          buttonType="ghost"
          onClick={() => onDelete(item.id)}
          className="btn-square text-error"
          aria-label="Delete"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

const WelcomeContentManager = () => {
  const intl = useIntl();
  const {
    data,
    isLoading,
    mutate: revalidate,
  } = useSWR<WelcomeContentResponse[]>('/api/v1/settings/onboarding/welcome');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WelcomeContentResponse | null>(
    null
  );
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const WelcomeContentSchema = Yup.object().shape({
    title: Yup.string().required(
      intl.formatMessage({
        id: 'common.validation.titleRequired',
        defaultMessage: 'You must provide a valid title',
      })
    ),
    description: Yup.string().required(
      intl.formatMessage({
        id: 'common.validation.descriptionRequired',
        defaultMessage: 'You must provide a valid description',
      })
    ),
    enabled: Yup.boolean(),
    imageUrl: Yup.string()
      .test('image-url', 'Invalid image URL', (value) => {
        if (!value) return true; // Allow empty/null
        // Accept relative paths for uploaded images or full URLs
        // Must match sanitizeImageUrl logic: check for path traversal including encoded forms
        if (value.startsWith('/')) {
          // Decode to catch encoded path traversal attempts
          let decodedValue = value;
          try {
            decodedValue = decodeURIComponent(value);
          } catch {
            return false; // Invalid encoding
          }

          // Check for path traversal like sanitizeImageUrl does
          if (decodedValue.includes('..')) {
            return false;
          }

          // Reject paths containing backslashes (Windows directory traversal)
          if (decodedValue.includes('\\')) {
            return false;
          }

          // Simple path normalization (basic duplicate/trailing slash removal)
          // Note: This doesn't handle all cases that path.posix.normalize handles (e.g., /./../)
          // but provides basic consistency. Server will perform full validation with path.posix.normalize.
          const normalizedPath = decodedValue
            .replace(/\/+/g, '/') // Replace multiple slashes with single slash
            .replace(/\/$/, ''); // Remove trailing slash (unless it's the root "/")

          // After normalization, ensure it still starts with /
          if (!normalizedPath || !normalizedPath.startsWith('/')) {
            return false;
          }

          return true;
        }
        // For external URLs, validate http/https protocol
        return value.startsWith('http://') || value.startsWith('https://');
      })
      .nullable(),
    videoUrl: Yup.string().url().nullable(),
    videoAutoplay: Yup.boolean(),
    customHtml: Yup.string(),
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && data) {
        const oldIndex = data.findIndex((item) => item.id === active.id);
        const newIndex = data.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(data, oldIndex, newIndex);

        // Optimistic update
        revalidate(newOrder, false);

        try {
          await axios.post('/api/v1/settings/onboarding/welcome/reorder', {
            items: newOrder.map((item, index) => ({
              id: item.id,
              order: index,
            })),
          });
          revalidate();
        } catch {
          // Revert on error
          revalidate();
          Toast({
            title: intl.formatMessage({
              id: 'settings.onboarding.reorderError',
              defaultMessage: 'Failed to reorder items.',
            }),
            icon: <XCircleIcon className="size-7" />,
            type: 'error',
          });
        }
      }
    },
    [data, intl, revalidate]
  );

  const handleCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: WelcomeContentResponse) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/v1/settings/onboarding/welcome/${id}`);
      revalidate();
      setDeleteConfirm(null);
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.deleteSuccess',
          defaultMessage: 'Item deleted successfully.',
        }),
        icon: <CheckBadgeIcon className="size-7" />,
        type: 'success',
      });
    } catch {
      Toast({
        title: intl.formatMessage({
          id: 'settings.onboarding.deleteError',
          defaultMessage: 'Failed to delete item.',
        }),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    }
  };

  const handleSubmit = async (values: Partial<WelcomeContentResponse>) => {
    try {
      if (editingItem) {
        await axios.put(
          `/api/v1/settings/onboarding/welcome/${editingItem.id}`,
          values
        );
      } else {
        await axios.post('/api/v1/settings/onboarding/welcome', values);
      }
      revalidate();
      setModalOpen(false);
      Toast({
        title: intl.formatMessage(
          {
            id: 'common.settingsSaveSuccess',
            defaultMessage: '{appName} settings saved successfully',
          },
          { appName: 'Onboarding' }
        ),
        icon: <CheckBadgeIcon className="size-7" />,
        type: 'success',
      });
    } catch {
      Toast({
        title: intl.formatMessage(
          {
            id: 'common.settingsSaveError',
            defaultMessage:
              'Something went wrong while saving {appName} settings.',
          },
          { appName: 'onboarding' }
        ),
        icon: <XCircleIcon className="size-7" />,
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return <LoadingEllipsis />;
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {data && data.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {data.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-neutral">
            <FormattedMessage
              id="settings.onboarding.noWelcomeContent"
              defaultMessage="No welcome content configured. Add your first slide to get started."
            />
          </div>
        )}
      </div>
      <Button buttonSize="sm" buttonType="primary" onClick={handleCreate}>
        <PlusIcon className="size-4 mr-2" />
        <FormattedMessage
          id="settings.onboarding.addSlide"
          defaultMessage="Add Slide"
        />
      </Button>
      <Modal
        title={intl.formatMessage({
          id: 'settings.onboarding.deleteWelcomeTitle',
          defaultMessage: 'Delete Welcome Content',
        })}
        onCancel={() => setDeleteConfirm(null)}
        onOk={() => deleteConfirm && handleDelete(deleteConfirm)}
        okText={intl.formatMessage({
          id: 'common.delete',
          defaultMessage: 'Delete',
        })}
        okButtonType="error"
        show={deleteConfirm !== null}
      >
        <FormattedMessage
          id="settings.onboarding.deleteConfirm"
          defaultMessage="Are you sure you want to delete this item? This action cannot be undone."
        />
      </Modal>
      <Formik
        initialValues={{
          title: editingItem?.title ?? '',
          description: editingItem?.description ?? '',
          enabled: editingItem?.enabled ?? true,
          imageUrl: editingItem?.imageUrl ?? '',
          videoUrl: editingItem?.videoUrl ?? '',
          videoAutoplay: editingItem?.videoAutoplay ?? false,
          customHtml: editingItem?.customHtml ?? '',
        }}
        validationSchema={WelcomeContentSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          isSubmitting,
          errors,
          touched,
          isValid,
          handleSubmit,
          values,
          setFieldValue,
        }) => (
          <Modal
            title={
              editingItem
                ? intl.formatMessage({
                    id: 'settings.onboarding.editSlide',
                    defaultMessage: 'Edit Slide',
                  })
                : intl.formatMessage({
                    id: 'settings.onboarding.addASlide',
                    defaultMessage: 'Add a Slide',
                  })
            }
            onOk={() => handleSubmit()}
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving...',
                  })
                : editingItem
                  ? intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
                  : intl.formatMessage({
                      id: 'settings.onboarding.addSlide',
                      defaultMessage: 'Add Slide',
                    })
            }
            okDisabled={isSubmitting || !isValid}
            show={modalOpen}
            cancelText={intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })}
            cancelButtonType="default"
            onCancel={() => setModalOpen(false)}
            secondaryText={
              editingItem
                ? values.enabled
                  ? intl.formatMessage({
                      id: 'common.disable',
                      defaultMessage: 'Disable',
                    })
                  : intl.formatMessage({
                      id: 'common.enable',
                      defaultMessage: 'Enable',
                    })
                : null
            }
            onSecondary={() => {
              if (editingItem) {
                setFieldValue('enabled', !values.enabled);
                handleSubmit();
              }
            }}
            secondaryButtonType={
              editingItem && values.enabled ? 'warning' : 'success'
            }
            secondaryDisabled={isSubmitting || !isValid}
          >
            <Form className="space-y-2">
              <div className="border-t border-primary pt-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <FormattedMessage id="common.title" defaultMessage="Title" />
                  <span className="text-error ml-1">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  className={`input input-sm input-primary w-full ${
                    errors.title && touched.title ? 'input-error' : ''
                  }`}
                />
                {errors.title && touched.title && (
                  <span className="text-error">{errors.title}</span>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="common.description"
                      defaultMessage="Description"
                    />
                    <span className="text-error ml-1">*</span>
                  </span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows={3}
                  className={`textarea textarea-primary w-full h-32 leading-normal ${
                    errors.description && touched.description
                      ? 'textarea-error'
                      : ''
                  }`}
                />
                {errors.description &&
                  touched.description &&
                  typeof errors.description === 'string' && (
                    <div className="text-error">{errors.description}</div>
                  )}
              </div>
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium leading-6 text-left mb-2"
                >
                  <FormattedMessage id="common.image" defaultMessage="Image" />
                  <span className="text-neutral ml-1">
                    (
                    <FormattedMessage
                      id="common.optional"
                      defaultMessage="optional"
                    />
                    )
                  </span>
                </label>
                {editingItem?.id ? (
                  <ImageUpload
                    value={values.imageUrl}
                    onChange={(url) => setFieldValue('imageUrl', url)}
                    uploadEndpoint={`/api/v1/settings/onboarding/welcome/${editingItem.id}/image`}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-base-content/20 bg-base-300/30">
                    <span className="text-sm text-neutral">
                      <FormattedMessage
                        id="settings.onboarding.imageAvailableAfterSave"
                        defaultMessage="Image upload will be available after saving."
                      />
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="videoUrl"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="common.videoUrl"
                      defaultMessage="Video URL"
                    />
                    <span className="text-neutral ml-1">
                      (
                      <FormattedMessage
                        id="common.optional"
                        defaultMessage="optional"
                      />
                      )
                    </span>
                  </span>
                </label>
                <Field
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input input-sm input-primary w-full"
                />
                <span className="text-xs text-neutral mt-1">
                  <FormattedMessage
                    id="settings.onboarding.videoUrlTip"
                    defaultMessage="YouTube video URL (will be embedded securely)."
                  />
                </span>
              </div>
              <div>
                <label
                  htmlFor="videoAutoplay"
                  className="flex items-center text-sm font-medium leading-6 text-left gap-2"
                >
                  <Field
                    type="checkbox"
                    id="videoAutoplay"
                    name="videoAutoplay"
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <FormattedMessage
                    id="settings.onboarding.videoAutoplay"
                    defaultMessage="Autoplay Video"
                  />
                  <span className="text-neutral">
                    (
                    <FormattedMessage
                      id="common.muted"
                      defaultMessage="muted"
                    />
                    )
                  </span>
                </label>
              </div>
              <div className="space-y-0">
                <label
                  htmlFor="customHtml"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="settings.onboarding.customHtml"
                      defaultMessage="Custom HTML"
                    />
                    <span className="text-neutral ml-1">
                      (
                      <FormattedMessage
                        id="common.optional"
                        defaultMessage="optional"
                      />
                      )
                    </span>
                  </span>
                </label>
                <Field
                  as="textarea"
                  id="customHtml"
                  name="customHtml"
                  rows={4}
                  className="textarea textarea-primary w-full font-mono text-sm h-32 leading-normal"
                />
                <span className="text-xs text-neutral">
                  <FormattedMessage
                    id="settings.onboarding.customHtmlTip"
                    defaultMessage="Custom HTML content."
                  />
                </span>
              </div>
            </Form>
          </Modal>
        )}
      </Formik>
    </div>
  );
};

export default WelcomeContentManager;
