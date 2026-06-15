'use client';
import Badge from '@app/components/Common/Badge';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Table from '@app/components/Common/Table';
import NewsletterHistoryModal from '@app/components/Admin/Settings/Newsletters/NewsletterHistoryModal';
import NewsletterModal from '@app/components/Admin/Settings/Newsletters/NewsletterModal';
import Toast from '@app/components/Toast';
import {
  BarsArrowDownIcon,
  BeakerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import type { NewsletterResultsResponse } from '@server/interfaces/api/newsletterInterfaces';
import type Newsletter from '@server/entity/Newsletter';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import axios from 'axios';
import cronstrue from 'cronstrue';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';
import ConfirmButton from '@app/components/Common/ConfirmButton';
import Tooltip from '@app/components/Common/ToolTip';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

enum Filter {
  ALL = 'all',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  IMPORTANT = 'important',
}

type Sort = 'created' | 'modified' | 'name';

const FILTER_SETTINGS_KEY = 'newsletters-filter-settings';

const readFilterSettings = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(FILTER_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const Newsletters = () => {
  const intl = useIntl();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [currentFilter, setCurrentFilter] = useState<Filter>(
    () => readFilterSettings()?.currentFilter || Filter.ALL
  );
  const [currentSort, setCurrentSort] = useState<Sort>(
    () => readFilterSettings()?.currentSort || 'modified'
  );
  const [currentPageSize, setCurrentPageSize] = useState<number>(
    () => readFilterSettings()?.currentPageSize || 10
  );

  const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const pageIndex = page - 1;

  const updateQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      router.push(pathname + '?' + params.toString());
    },
    [pathname, router, searchParams]
  );

  const { data, error, mutate } = useSWR<NewsletterResultsResponse>(
    `/api/v1/settings/newsletter?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}&sort=${currentSort}`
  );

  // Allow filter/sort to be driven by query params, keeping state in sync.
  const queryFilter = searchParams.get('filter') as Filter;
  const querySort = searchParams.get('sort') as Sort;
  const [prevQueryFilter, setPrevQueryFilter] = useState(queryFilter);
  const [prevQuerySort, setPrevQuerySort] = useState(querySort);
  if (prevQueryFilter !== queryFilter) {
    setPrevQueryFilter(queryFilter);
    if (Object.values(Filter).includes(queryFilter)) {
      setCurrentFilter(queryFilter);
    }
  }
  if (prevQuerySort !== querySort) {
    setPrevQuerySort(querySort);
    if (['created', 'modified', 'name'].includes(querySort)) {
      setCurrentSort(querySort);
    }
  }

  // Persist the filter/sort/page-size selections.
  useEffect(() => {
    window.localStorage.setItem(
      FILTER_SETTINGS_KEY,
      JSON.stringify({ currentFilter, currentSort, currentPageSize })
    );
  }, [currentFilter, currentSort, currentPageSize]);

  const [editState, setEditState] = useState<{
    open: boolean;
    newsletter: Newsletter | null;
  }>({ open: false, newsletter: null });
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const describeSchedule = (newsletter: Newsletter) => {
    if (newsletter.scheduleType === 'once') {
      return newsletter.sendAt
        ? moment(newsletter.sendAt).format('lll')
        : intl.formatMessage({
            id: 'newsletters.notScheduled',
            defaultMessage: 'Not scheduled',
          });
    }

    if (!newsletter.cronSchedule && !newsletter.sendAt) {
      return intl.formatMessage({
        id: 'newsletters.notScheduled',
        defaultMessage: 'Not scheduled',
      });
    }

    try {
      return cronstrue.toString(newsletter.cronSchedule ?? '');
    } catch {
      return newsletter.cronSchedule;
    }
  };

  const sendNow = async (newsletter: Newsletter) => {
    setBusyId(newsletter.id);
    try {
      const response = await axios.post(
        `/api/v1/settings/newsletter/${newsletter.id}/send`
      );
      Toast({
        title: intl.formatMessage({
          id: 'newsletters.sent',
          defaultMessage: 'Newsletter sent',
        }),
        message: intl.formatMessage(
          {
            id: 'newsletters.sentSummary',
            defaultMessage:
              'Delivered to {count} recipient(s){failures, plural, =0 {} other {, # failed}}.',
          },
          {
            count: response.data.recipientCount,
            failures: response.data.failureCount,
          }
        ),
        type: 'success',
        icon: <PaperAirplaneIcon className="size-7" />,
      });
      mutate();
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'newsletters.sendError',
          defaultMessage: 'Failed to send newsletter',
        }),
        message:
          e?.response?.data?.message ?? (e instanceof Error ? e.message : ''),
        type: 'error',
        icon: <PaperAirplaneIcon className="size-7" />,
      });
    } finally {
      setBusyId(null);
    }
  };

  const sendTest = async (newsletter: Newsletter) => {
    setBusyId(newsletter.id);
    try {
      await axios.post(`/api/v1/settings/newsletter/${newsletter.id}/test`);
      Toast({
        title: intl.formatMessage({
          id: 'newsletters.testSent',
          defaultMessage: 'Test newsletter sent to your email',
        }),
        type: 'success',
        icon: <PaperAirplaneIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'newsletters.testError',
          defaultMessage: 'Failed to send test newsletter',
        }),
        message:
          e?.response?.data?.message ?? (e instanceof Error ? e.message : ''),
        type: 'error',
        icon: <PaperAirplaneIcon className="size-7" />,
      });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (newsletter: Newsletter) => {
    try {
      await axios.delete(`/api/v1/settings/newsletter/${newsletter.id}`);
      mutate();
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'newsletters.deleteError',
          defaultMessage: 'Failed to delete newsletter',
        }),
        message:
          e?.response?.data?.message ?? (e instanceof Error ? e.message : ''),
        type: 'error',
        icon: <TrashIcon className="size-7" />,
      });
    }
  };

  return (
    <div className="w-full my-6">
      <div className="flex flex-col justify-between md:flex-row md:items-start gap-4">
        <div className="">
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <FormattedMessage
              id="common.newsletterManagement"
              defaultMessage="Newsletter Management"
            />
          </h1>
          <p>
            <FormattedMessage
              id="newsletters.description"
              defaultMessage="Compose, schedule, and send newsletters to your users."
            />
          </p>
        </div>
        <div className="mt-2 flex grow flex-col sm:flex-row md:grow-0">
          <div className="mb-2 flex grow sm:mb-0 sm:mr-2 md:grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm">
              <FunnelIcon className="h-6 w-6" />
            </span>
            <select
              id="filter"
              name="filter"
              value={currentFilter}
              onChange={(e) => {
                setCurrentFilter(e.target.value as Filter);
                updateQueryParams('page', '1');
              }}
              className="select select-sm select-primary rounded-l-none w-full flex-1"
            >
              <option value="all">
                {intl.formatMessage({
                  id: 'common.all',
                  defaultMessage: 'All',
                })}
              </option>
              <option value="enabled">
                {intl.formatMessage({
                  id: 'newsletters.statusEnabled',
                  defaultMessage: 'Scheduled',
                })}
              </option>
              <option value="disabled">
                {intl.formatMessage({
                  id: 'newsletters.statusDisabled',
                  defaultMessage: 'Draft',
                })}
              </option>
              <option value="important">
                {intl.formatMessage({
                  id: 'newsletters.important',
                  defaultMessage: 'Important',
                })}
              </option>
            </select>
          </div>
          <div className="mb-2 flex grow sm:mb-0 sm:mr-2 md:grow-0">
            <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 sm:text-sm">
              <BarsArrowDownIcon className="h-6 w-6" />
            </span>
            <select
              id="sort"
              name="sort"
              value={currentSort}
              onChange={(e) => {
                setCurrentSort(e.target.value as Sort);
                updateQueryParams('page', '1');
              }}
              className="select select-sm select-primary rounded-l-none w-full flex-1"
            >
              <option value="modified">
                {intl.formatMessage({
                  id: 'newsletters.sortLastModified',
                  defaultMessage: 'Last Modified',
                })}
              </option>
              <option value="created">
                {intl.formatMessage({
                  id: 'newsletters.sortMostRecent',
                  defaultMessage: 'Most Recent',
                })}
              </option>
              <option value="name">
                {intl.formatMessage({
                  id: 'newsletters.sortName',
                  defaultMessage: 'Name',
                })}
              </option>
            </select>
          </div>
          <Button
            buttonType="primary"
            buttonSize="sm"
            onClick={() => setEditState({ open: true, newsletter: null })}
          >
            <PlusIcon className="size-5 mr-1" />
            <FormattedMessage
              id="newsletters.create"
              defaultMessage="Create Newsletter"
            />
          </Button>
        </div>
      </div>

      {!data && !error && <LoadingEllipsis />}

      {data && data.results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 md:w-full my-6">
          <span className="text-neutral">
            {currentFilter === Filter.ALL ? (
              <FormattedMessage
                id="newsletters.empty"
                defaultMessage="No newsletters yet. Create one to get started."
              />
            ) : (
              <FormattedMessage
                id="newsletters.noResults"
                defaultMessage="No newsletters match the current filter."
              />
            )}
          </span>
        </div>
      )}

      {data && data.results.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Table.TH>
                <FormattedMessage id="common.name" defaultMessage="Name" />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="newsletters.schedule"
                  defaultMessage="Schedule"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="newsletters.lastSent"
                  defaultMessage="Last Sent"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage id="common.status" defaultMessage="Status" />
              </Table.TH>
              <Table.TH className="hidden md:table-cell"></Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data.results.map((newsletter, index) => {
              const isLast = index === data.results.length - 1;
              const actions = (
                <>
                  <ConfirmButton
                    buttonSize="sm"
                    buttonType="primary"
                    disabled={busyId === newsletter.id}
                    confirmText={intl.formatMessage({
                      id: 'common.areYouSure',
                      defaultMessage: 'Are you sure?',
                    })}
                    onClick={() => sendNow(newsletter)}
                    className="max-xl:grow"
                  >
                    <PaperAirplaneIcon className="size-5 mr-1" />
                    <FormattedMessage
                      id="newsletters.sendNow"
                      defaultMessage="Send Now"
                    />
                  </ConfirmButton>
                  <Button
                    buttonSize="sm"
                    buttonType="warning"
                    disabled={busyId === newsletter.id}
                    onClick={() => sendTest(newsletter)}
                    className="max-xl:grow"
                  >
                    <BeakerIcon className="size-5 mr-1" />
                    <FormattedMessage
                      id="newsletters.test"
                      defaultMessage="Test"
                    />
                  </Button>
                  <Button
                    buttonSize="sm"
                    buttonType="info"
                    onClick={() => setEditState({ open: true, newsletter })}
                    className="max-xl:grow"
                  >
                    <PencilIcon className="size-5 mr-1" />
                    <FormattedMessage id="common.edit" defaultMessage="Edit" />
                  </Button>
                  <Button
                    buttonSize="sm"
                    buttonType="default"
                    onClick={() => setHistoryId(newsletter.id)}
                    className="max-xl:grow"
                  >
                    <ClockIcon className="size-5 mr-1" />
                    <FormattedMessage
                      id="newsletters.history"
                      defaultMessage="History"
                    />
                  </Button>
                  <ConfirmButton
                    buttonSize="sm"
                    confirmText={intl.formatMessage({
                      id: 'common.areYouSure',
                      defaultMessage: 'Are you sure?',
                    })}
                    onClick={() => remove(newsletter)}
                    className="max-xl:grow"
                  >
                    <TrashIcon className="size-5 mr-1" />
                    <FormattedMessage
                      id="common.delete"
                      defaultMessage="Delete"
                    />
                  </ConfirmButton>
                </>
              );

              return (
                <Fragment key={`newsletter-${newsletter.id}`}>
                  <tr className={isLast ? 'border-b-0' : 'max-md:border-b-0'}>
                    <Table.TD>
                      <div className="inline-flex items-center gap-2 text-sm font-medium leading-5">
                        {newsletter.name}
                        {newsletter.isImportant && (
                          <Tooltip
                            content={intl.formatMessage({
                              id: 'newsletters.important',
                              defaultMessage: 'Important',
                            })}
                          >
                            <ExclamationTriangleIcon className="size-5 text-error shrink-0" />
                          </Tooltip>
                        )}
                      </div>
                    </Table.TD>
                    <Table.TD>
                      <span className="text-sm">
                        {describeSchedule(newsletter)}
                      </span>
                    </Table.TD>
                    <Table.TD>
                      <span className="text-sm">
                        {newsletter.lastSentAt
                          ? moment(newsletter.lastSentAt).from(moment())
                          : '—'}
                      </span>
                    </Table.TD>
                    <Table.TD>
                      <Badge
                        badgeType={newsletter.enabled ? 'success' : 'default'}
                        className="uppercase"
                      >
                        {newsletter.enabled ? (
                          <FormattedMessage
                            id="newsletters.statusEnabled"
                            defaultMessage="Scheduled"
                          />
                        ) : (
                          <FormattedMessage
                            id="newsletters.statusDisabled"
                            defaultMessage="Draft"
                          />
                        )}
                      </Badge>
                    </Table.TD>
                    <Table.TD
                      alignText="right"
                      className="hidden md:table-cell"
                    >
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {actions}
                      </div>
                    </Table.TD>
                  </tr>
                  <tr className="md:hidden">
                    <td colSpan={5} className="px-4 pb-4 pt-1">
                      <div className="flex flex-wrap gap-2 items-center">
                        {actions}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            <tr className="bg-base-100">
              <Table.TD colSpan={5} noPadding>
                <nav
                  className="flex w-full flex-col items-center gap-3 px-4 py-3 sm:flex-row sm:justify-between sm:gap-0"
                  aria-label="Pagination"
                >
                  <p className="text-sm">
                    {data.results.length > 0 && (
                      <FormattedMessage
                        id="common.showingResults"
                        defaultMessage="Showing {start} to {end} of {total} results"
                        values={{
                          start: pageIndex * currentPageSize + 1,
                          end:
                            pageIndex * currentPageSize + data.results.length,
                          total: data.pageInfo.results,
                        }}
                      />
                    )}
                  </p>
                  <span className="text-sm">
                    <FormattedMessage
                      id="common.resultsDisplay"
                      defaultMessage="Display {select} results per page"
                      values={{
                        select: (
                          <select
                            id="newsletterPageSize"
                            name="newsletterPageSize"
                            onChange={(e) => {
                              setCurrentPageSize(Number(e.target.value));
                              updateQueryParams('page', '1');
                            }}
                            value={currentPageSize}
                            className="select select-primary select-sm mx-1 w-auto min-w-20"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        ),
                      }}
                    />
                  </span>
                  <div className="flex gap-2">
                    <Button
                      buttonSize="sm"
                      buttonType="primary"
                      disabled={pageIndex <= 0}
                      onClick={() =>
                        updateQueryParams('page', (page - 1).toString())
                      }
                    >
                      <ChevronLeftIcon className="size-4" />
                      <span>
                        <FormattedMessage
                          id="common.previous"
                          defaultMessage="Previous"
                        />
                      </span>
                    </Button>
                    <Button
                      buttonSize="sm"
                      buttonType="primary"
                      disabled={data.pageInfo.pages <= pageIndex + 1}
                      onClick={() =>
                        updateQueryParams('page', (page + 1).toString())
                      }
                    >
                      <span>
                        <FormattedMessage
                          id="common.next"
                          defaultMessage="Next"
                        />
                      </span>
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </nav>
              </Table.TD>
            </tr>
          </Table.TBody>
        </Table>
      )}

      <NewsletterModal
        show={editState.open}
        newsletter={editState.newsletter}
        onClose={() => setEditState({ open: false, newsletter: null })}
        onSave={() => {
          setEditState({ open: false, newsletter: null });
          mutate();
        }}
      />

      <NewsletterHistoryModal
        show={historyId !== null}
        newsletterId={historyId}
        onClose={() => setHistoryId(null)}
      />
    </div>
  );
};

export default Newsletters;
