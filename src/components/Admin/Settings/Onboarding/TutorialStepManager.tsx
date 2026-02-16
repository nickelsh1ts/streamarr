'use client';
import Button from '@app/components/Common/Button';
import ImageUpload from '@app/components/Common/ImageUpload';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import { TUTORIAL_PRESETS } from '@app/utils/tutorialPresets';
import {
  PlusIcon,
  CursorArrowRippleIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import {
  PencilIcon,
  TrashIcon,
  CheckBadgeIcon,
  XCircleIcon,
  Bars3Icon,
} from '@heroicons/react/24/solid';
import type { TutorialStepResponse } from '@server/interfaces/api/onboardingInterfaces';
import { TutorialMode, TooltipPosition } from '@server/entity/TutorialStep';
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
import { useOnboardingContext } from '@app/context/OnboardingContext';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';

interface SortableStepProps {
  step: TutorialStepResponse;
  onEdit: (step: TutorialStepResponse) => void;
  onDelete: (id: number) => void;
}

const SortableStep = ({ step, onEdit, onDelete }: SortableStepProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });
  const { data: onboardingData } = useOnboardingContext();

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
      <div className="flex-shrink-0">
        {(step.mode === 'spotlight' &&
          onboardingData?.settings?.tutorialMode === 'both') ||
        onboardingData?.settings?.tutorialMode === 'spotlight' ? (
          <CursorArrowRippleIcon className="size-5 text-primary" />
        ) : (
          ((step.mode === 'wizard' &&
            onboardingData?.settings?.tutorialMode === 'both') ||
            onboardingData?.settings?.tutorialMode === 'wizard') && (
            <DocumentTextIcon className="size-5 text-primary" />
          )
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{step.title}</p>
        <p className="text-xs text-neutral truncate">
          {onboardingData?.settings?.tutorialMode !== 'wizard' &&
            step.targetSelector &&
            step.mode !== 'wizard' &&
            `Target: ${step.targetSelector}`}
          {onboardingData?.settings?.tutorialMode !== 'wizard' &&
            step.targetSelector &&
            step.mode !== 'wizard' &&
            step.route &&
            ' | '}
          {step.route && `Route: ${step.route}`}
        </p>
      </div>
      {(step.imageUrl || step.videoUrl || step.customHtml) && (
        <div className="flex-shrink-0 flex items-center gap-1 text-neutral">
          {step.imageUrl && <PhotoIcon className="size-4 text-primary" />}
          {step.imageUrl && step.videoUrl && <span>/</span>}
          {step.videoUrl && <VideoCameraIcon className="size-4 text-primary" />}
          {(step.imageUrl || step.videoUrl) && step.customHtml && (
            <span>/</span>
          )}
          {step.customHtml && (
            <CodeBracketIcon className="size-4 text-accent" />
          )}
        </div>
      )}
      <div className="flex-shrink-0">
        <span
          className={`badge ${step.enabled ? 'badge-success' : 'badge-neutral'}`}
        >
          {step.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="flex gap-1">
        <Button
          buttonSize="sm"
          buttonType="ghost"
          onClick={() => onEdit(step)}
          className="btn-square"
          aria-label="Edit"
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          buttonSize="sm"
          buttonType="ghost"
          onClick={() => onDelete(step.id)}
          className="btn-square text-error"
          aria-label="Delete"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
};

const TutorialStepManager = () => {
  const intl = useIntl();
  const {
    data,
    isLoading,
    mutate: revalidate,
  } = useSWR<TutorialStepResponse[]>('/api/v1/settings/onboarding/tutorial');
  // Fetch global settings to check tutorialMode
  const { data: settingsData } = useSWR<{ tutorialMode: string }>(
    '/api/v1/settings/onboarding'
  );
  const globalTutorialMode = settingsData?.tutorialMode ?? 'both';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<TutorialStepResponse | null>(
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

  const TutorialStepSchema = Yup.object().shape({
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
    mode: Yup.string().oneOf(['spotlight', 'wizard']).required(),
    targetSelector: Yup.string(),
    tooltipPosition: Yup.string().oneOf([
      'auto',
      'top',
      'bottom',
      'left',
      'right',
    ]),
    route: Yup.string(),
    imageUrl: Yup.string()
      .test('image-url', 'Invalid image URL', (value) => {
        if (!value) return true; // Allow empty/null
        // Accept relative paths for uploaded images or full URLs
        return (
          value.startsWith('/onboarding/') ||
          value.startsWith('http://') ||
          value.startsWith('https://')
        );
      })
      .nullable(),
    videoUrl: Yup.string()
      .url(
        intl.formatMessage({
          id: 'common.validation.invalidUrl',
          defaultMessage: 'Invalid URL',
        })
      )
      .nullable(),
    videoAutoplay: Yup.boolean(),
    customHtml: Yup.string().nullable(),
  });

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && data) {
        const oldIndex = data.findIndex((step) => step.id === active.id);
        const newIndex = data.findIndex((step) => step.id === over.id);

        const newOrder = arrayMove(data, oldIndex, newIndex);

        // Optimistic update
        revalidate(newOrder, false);

        try {
          await axios.post('/api/v1/settings/onboarding/tutorial/reorder', {
            items: newOrder.map((step, index) => ({
              id: step.id,
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
    setEditingStep(null);
    setModalOpen(true);
  };

  const handleEdit = (step: TutorialStepResponse) => {
    setEditingStep(step);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`/api/v1/settings/onboarding/tutorial/${id}`);
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

  const handleSubmit = async (values: Partial<TutorialStepResponse>) => {
    try {
      if (editingStep) {
        await axios.put(
          `/api/v1/settings/onboarding/tutorial/${editingStep.id}`,
          values
        );
      } else {
        await axios.post('/api/v1/settings/onboarding/tutorial', values);
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
              items={data.map((step) => step.id)}
              strategy={verticalListSortingStrategy}
            >
              {data.map((step) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteConfirm(id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 text-neutral">
            <FormattedMessage
              id="settings.onboarding.noTutorialSteps"
              defaultMessage="No tutorial steps configured. Add your first step to get started."
            />
          </div>
        )}
      </div>
      <Button buttonSize="sm" buttonType="primary" onClick={handleCreate}>
        <PlusIcon className="size-4 mr-2" />
        <FormattedMessage
          id="settings.onboarding.addStep"
          defaultMessage="Add Step"
        />
      </Button>
      <Modal
        title={intl.formatMessage({
          id: 'settings.onboarding.deleteTutorialTitle',
          defaultMessage: 'Delete Tutorial Step',
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
          title: editingStep?.title ?? '',
          description: editingStep?.description ?? '',
          enabled: editingStep?.enabled ?? true,
          mode: editingStep?.mode ?? TutorialMode.SPOTLIGHT,
          targetSelector: editingStep?.targetSelector ?? '',
          tooltipPosition: editingStep?.tooltipPosition ?? TooltipPosition.AUTO,
          route: editingStep?.route ?? '',
          imageUrl: editingStep?.imageUrl ?? '',
          videoUrl: editingStep?.videoUrl ?? '',
          videoAutoplay: editingStep?.videoAutoplay ?? false,
          customHtml: editingStep?.customHtml ?? '',
        }}
        validationSchema={TutorialStepSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({
          isSubmitting,
          isValid,
          errors,
          touched,
          handleSubmit,
          values,
          setFieldValue,
        }) => (
          <Modal
            title={
              editingStep
                ? intl.formatMessage({
                    id: 'settings.onboarding.editStep',
                    defaultMessage: 'Edit Step',
                  })
                : intl.formatMessage({
                    id: 'settings.onboarding.addAStep',
                    defaultMessage: 'Add a Step',
                  })
            }
            onOk={() => handleSubmit()}
            okText={
              isSubmitting
                ? intl.formatMessage({
                    id: 'common.saving',
                    defaultMessage: 'Saving...',
                  })
                : editingStep
                  ? intl.formatMessage({
                      id: 'common.saveChanges',
                      defaultMessage: 'Save Changes',
                    })
                  : intl.formatMessage({
                      id: 'settings.onboarding.addStep',
                      defaultMessage: 'Add Step',
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
              editingStep
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
              if (editingStep) {
                setFieldValue('enabled', !values.enabled);
                handleSubmit();
              }
            }}
            secondaryButtonType={
              editingStep && values.enabled ? 'warning' : 'success'
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
                  <FormattedMessage
                    id="common.description"
                    defaultMessage="Description"
                  />
                  <span className="text-error ml-1">*</span>
                </label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  rows={3}
                  className={`textarea textarea-primary w-full leading-normal ${
                    errors.description && touched.description
                      ? 'textarea-error'
                      : ''
                  }`}
                />
                {errors.description && touched.description && (
                  <span className="text-error">{errors.description}</span>
                )}
              </div>
              {globalTutorialMode === 'both' && (
                <div>
                  <label
                    htmlFor="mode"
                    className="block text-sm font-medium leading-6 text-left"
                  >
                    <span className="label-text">
                      <FormattedMessage
                        id="settings.onboarding.stepMode"
                        defaultMessage="Step Rendering Style"
                      />
                    </span>
                  </label>
                  <Field
                    as="select"
                    id="mode"
                    name="mode"
                    className="select select-sm select-primary w-full"
                  >
                    <option value="spotlight">
                      {intl.formatMessage({
                        id: 'settings.onboarding.mode.spotlight',
                        defaultMessage: 'Spotlight (Element Highlighting)',
                      })}
                    </option>
                    <option value="wizard">
                      {intl.formatMessage({
                        id: 'settings.onboarding.mode.wizard',
                        defaultMessage: 'Wizard (Carousel Slide)',
                      })}
                    </option>
                  </Field>
                  <span className="text-xs text-neutral mt-1 block">
                    <FormattedMessage
                      id="settings.onboarding.stepModeTip"
                      defaultMessage="Choose how this step renders: spotlight highlights an element, wizard shows a carousel slide."
                    />
                  </span>
                </div>
              )}
              {(globalTutorialMode === 'spotlight' ||
                (globalTutorialMode === 'both' &&
                  (values.mode === 'spotlight' || values.mode === 'both'))) && (
                <div>
                  <label
                    htmlFor="targetSelector"
                    className="block text-sm font-medium leading-6 text-left"
                  >
                    <span className="label-text">
                      <FormattedMessage
                        id="settings.onboarding.targetSelector"
                        defaultMessage="Target Selector"
                      />
                    </span>
                  </label>
                  <div className="flex gap-2 mb-2">
                    <select
                      className="select select-primary select-sm flex-1"
                      onChange={(e) => {
                        const preset = TUTORIAL_PRESETS.find(
                          (p) => p.id === e.target.value
                        );
                        if (preset) {
                          setFieldValue('targetSelector', preset.selector);
                          if (preset.route) {
                            setFieldValue('route', preset.route);
                          }
                        }
                      }}
                      value=""
                    >
                      <option value="" disabled>
                        {intl.formatMessage({
                          id: 'settings.onboarding.selectPreset',
                          defaultMessage: 'Select a preset...',
                        })}
                      </option>
                      {TUTORIAL_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} - {preset.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    type="text"
                    id="targetSelector"
                    name="targetSelector"
                    placeholder="[data-tutorial='my-element'], #my-id, .my-class"
                    className="input input-sm input-primary w-full font-mono text-sm"
                  />
                  <span className="text-xs text-neutral mt-1">
                    <FormattedMessage
                      id="settings.onboarding.targetSelectorTip"
                      defaultMessage="CSS selector or data-tutorial attribute name to highlight."
                    />
                  </span>
                </div>
              )}
              {(globalTutorialMode === 'spotlight' ||
                (globalTutorialMode === 'both' &&
                  (values.mode === 'spotlight' || values.mode === 'both'))) && (
                <div>
                  <label
                    htmlFor="tooltipPosition"
                    className="block text-sm font-medium leading-6 text-left"
                  >
                    <span className="label-text">
                      <FormattedMessage
                        id="settings.onboarding.tooltipPosition"
                        defaultMessage="Tooltip Position"
                      />
                    </span>
                  </label>
                  <Field
                    as="select"
                    id="tooltipPosition"
                    name="tooltipPosition"
                    className="select select-sm select-primary w-full"
                  >
                    <option value="auto">
                      {intl.formatMessage({
                        id: 'settings.onboarding.position.auto',
                        defaultMessage: 'Auto (Best Fit)',
                      })}
                    </option>
                    <option value="top">
                      {intl.formatMessage({
                        id: 'settings.onboarding.position.top',
                        defaultMessage: 'Top',
                      })}
                    </option>
                    <option value="bottom">
                      {intl.formatMessage({
                        id: 'settings.onboarding.position.bottom',
                        defaultMessage: 'Bottom',
                      })}
                    </option>
                    <option value="left">
                      {intl.formatMessage({
                        id: 'settings.onboarding.position.left',
                        defaultMessage: 'Left',
                      })}
                    </option>
                    <option value="right">
                      {intl.formatMessage({
                        id: 'settings.onboarding.position.right',
                        defaultMessage: 'Right',
                      })}
                    </option>
                  </Field>
                </div>
              )}
              <div>
                <label
                  htmlFor="route"
                  className="block text-sm font-medium leading-6 text-left"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="settings.onboarding.route"
                      defaultMessage="Route"
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
                  type="text"
                  id="route"
                  name="route"
                  placeholder="/watch"
                  className="input input-sm input-primary w-full font-mono text-sm"
                />
                <span className="text-xs text-neutral mt-1">
                  <FormattedMessage
                    id="settings.onboarding.routeTip"
                    defaultMessage="Navigate to this route when this step is active."
                  />
                </span>
              </div>
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium leading-6 text-left mb-2"
                >
                  <span className="label-text">
                    <FormattedMessage
                      id="common.image"
                      defaultMessage="Image"
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
                {editingStep?.id ? (
                  <ImageUpload
                    value={values.imageUrl}
                    onChange={(url) => setFieldValue('imageUrl', url)}
                    uploadEndpoint={`/api/v1/settings/onboarding/tutorial/${editingStep.id}/image`}
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

export default TutorialStepManager;
