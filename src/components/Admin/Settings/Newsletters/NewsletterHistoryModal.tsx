'use client';
import Button from '@app/components/Common/Button';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Modal from '@app/components/Common/Modal';
import Table from '@app/components/Common/Table';
import { momentWithLocale as moment } from '@app/utils/momentLocale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import type { NewsletterHistoryResultsResponse } from '@server/interfaces/api/newsletterInterfaces';
import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import useSWR from 'swr';

const FILTER_SETTINGS_KEY = 'newsletter-history-filter-settings';

const readStoredPageSize = (): number => {
  if (typeof window === 'undefined') {
    return 5;
  }

  try {
    const stored = window.localStorage.getItem(FILTER_SETTINGS_KEY);
    return stored ? JSON.parse(stored).currentPageSize || 5 : 5;
  } catch {
    return 5;
  }
};

interface NewsletterHistoryModalProps {
  show: boolean;
  newsletterId: number | null;
  onClose: () => void;
}

const triggerLabel = (trigger: string) => {
  switch (trigger) {
    case 'schedule':
      return (
        <FormattedMessage
          id="newsletters.trigger.schedule"
          defaultMessage="Scheduled"
        />
      );
    case 'test':
      return (
        <FormattedMessage id="newsletters.trigger.test" defaultMessage="Test" />
      );
    default:
      return (
        <FormattedMessage
          id="newsletters.trigger.manual"
          defaultMessage="Manual"
        />
      );
  }
};

const NewsletterHistoryModal = ({
  show,
  newsletterId,
  onClose,
}: NewsletterHistoryModalProps) => {
  const intl = useIntl();
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] =
    useState<number>(readStoredPageSize);
  const pageIndex = page - 1;

  // Reset to the first page whenever a different newsletter's history is opened
  // (adjusting state during render, per React guidance, rather than an effect).
  const openKey = `${newsletterId}-${show}`;
  const [lastOpenKey, setLastOpenKey] = useState(openKey);

  if (openKey !== lastOpenKey) {
    setLastOpenKey(openKey);
    setPage(1);
  }

  // Persist the page-size selection.
  useEffect(() => {
    window.localStorage.setItem(
      FILTER_SETTINGS_KEY,
      JSON.stringify({ currentPageSize })
    );
  }, [currentPageSize]);

  const { data, error } = useSWR<NewsletterHistoryResultsResponse>(
    show && newsletterId !== null
      ? `/api/v1/settings/newsletter/${newsletterId}/history?take=${currentPageSize}&skip=${
          pageIndex * currentPageSize
        }`
      : null
  );

  const hasNextPage = data ? data.pageInfo.pages > pageIndex + 1 : false;
  const hasPrevPage = pageIndex > 0;

  return (
    <Modal
      show={show}
      onCancel={onClose}
      cancelText={intl.formatMessage({
        id: 'common.close',
        defaultMessage: 'Close',
      })}
      cancelButtonType="default"
      title={intl.formatMessage({
        id: 'newsletters.historyTitle',
        defaultMessage: 'Newsletter History',
      })}
    >
      {!data && !error && <LoadingEllipsis />}
      {data && data.results.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral">
          <FormattedMessage
            id="newsletters.noSends"
            defaultMessage="This newsletter has not been sent yet."
          />
        </p>
      )}
      {data && data.results.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Table.TH>
                <FormattedMessage id="common.date" defaultMessage="Date" />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="newsletters.triggeredBy"
                  defaultMessage="Trigger"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="newsletters.recipients"
                  defaultMessage="Recipients"
                />
              </Table.TH>
              <Table.TH>
                <FormattedMessage
                  id="newsletters.failures"
                  defaultMessage="Failures"
                />
              </Table.TH>
            </tr>
          </thead>
          <Table.TBody>
            {data.results.map((entry) => (
              <tr key={`newsletter-history-${entry.id}`}>
                <Table.TD>
                  <span className="text-sm">
                    {moment(entry.createdAt).format('lll')}
                  </span>
                </Table.TD>
                <Table.TD>
                  <span className="text-sm">
                    {triggerLabel(entry.triggeredBy)}
                  </span>
                </Table.TD>
                <Table.TD>
                  <span className="text-sm">{entry.recipientCount}</span>
                </Table.TD>
                <Table.TD>
                  <span
                    className={`text-sm ${
                      entry.failureCount > 0 ? 'text-error' : ''
                    }`}
                  >
                    {entry.failureCount}
                  </span>
                </Table.TD>
              </tr>
            ))}
            <tr>
              <Table.TD colSpan={4} noPadding>
                <nav
                  className="flex flex-col items-center gap-3 px-4 py-3"
                  aria-label="Pagination"
                >
                  <div className="flex flex-row items-center justify-between gap-2 w-full">
                    <p className="text-sm">
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
                    </p>
                    <div className="flex gap-2">
                      <Button
                        buttonSize="sm"
                        buttonType="primary"
                        disabled={!hasPrevPage}
                        onClick={() => setPage((current) => current - 1)}
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
                        disabled={!hasNextPage}
                        onClick={() => setPage((current) => current + 1)}
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
                  </div>
                  <span className="text-sm">
                    <FormattedMessage
                      id="common.resultsDisplay"
                      defaultMessage="Display {select} results per page"
                      values={{
                        select: (
                          <select
                            id="historyPageSize"
                            name="historyPageSize"
                            onChange={(e) => {
                              setCurrentPageSize(Number(e.target.value));
                              setPage(1);
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
                </nav>
              </Table.TD>
            </tr>
          </Table.TBody>
        </Table>
      )}
    </Modal>
  );
};

export default NewsletterHistoryModal;
