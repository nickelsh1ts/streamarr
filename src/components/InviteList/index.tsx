'use client';
import Header from 'components/Common/Header';
import {
  FunnelIcon,
  BarsArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission } from '@server/lib/permissions';
import { useUser } from '@app/hooks/useUser';
import { FormattedMessage, useIntl } from 'react-intl';
import type { InviteResultsResponse } from '@server/interfaces/api/inviteInterfaces';
import useSWR from 'swr';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import Button from '@app/components/Common/Button';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import InviteCard from '@app/components/InviteList/InvitesCard';
import ProgressCircle from '@app/components/Common/ProgressCircle';
import InviteModal from '@app/components/InviteList/InviteModal';
import axios from 'axios';
import type Invite from '@server/entity/Invite';
import Toast from '@app/components/Toast';
import InviteShareModal from '@app/components/InviteList/InviteShareModal';
import useSettings from '@app/hooks/useSettings';
import Alert from '@app/components/Common/Alert';

enum Filter {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  DELETED = 'deleted',
  REDEEMED = 'redeemed',
}

type Sort = 'created' | 'modified';

const InviteList = () => {
  useRouteGuard(
    [
      Permission.CREATE_INVITES,
      Permission.MANAGE_INVITES,
      Permission.VIEW_INVITES,
      Permission.STREAMARR,
      Permission.ADVANCED_INVITES,
    ],
    { type: 'or' }
  );
  const router = useRouter();
  const pathname = usePathname();
  const { currentSettings } = useSettings();
  const [editInviteModal, setEditInviteModal] = useState<{
    show: boolean;
    Invite?: Invite | null;
  }>({
    show: false,
    Invite: null,
  });
  const [shareInviteModal, setShareInviteModal] = useState<{
    show: boolean;
    isNew: boolean;
    Invite: Invite | null;
  }>({
    show: false,
    isNew: false,
    Invite: null,
  });
  const searchParams = useSearchParams();
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(userQuery?.userid),
  });
  const { user: currentUser, hasPermission } = useUser();
  const intl = useIntl();
  const [currentFilter, setCurrentFilter] = useState<Filter>(Filter.ALL);
  const [currentSort, setCurrentSort] = useState<Sort>('created');
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);

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

  const {
    data,
    error,
    mutate: revalidate,
  } = useSWR<InviteResultsResponse>(
    `/api/v1/invite?take=${currentPageSize}&skip=${
      pageIndex * currentPageSize
    }&filter=${currentFilter}&sort=${currentSort}${
      pathname.startsWith('/profile')
        ? `&createdBy=${currentUser?.id}`
        : userQuery?.userid
          ? `&createdBy=${userQuery?.userid}`
          : ''
    }`
  );

  const { data: quota, mutate: revalidateQuota } = useSWR<QuotaResponse>(
    user &&
      (user?.id === currentUser?.id || hasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${user?.id}/quota`
      : null
  );

  const deleteInvite = async (inviteId: number) => {
    try {
      await axios.delete(`/api/v1/invite/${inviteId}/qrcode`);
      await axios.delete(`/api/v1/invite/${inviteId}`);
      Toast({
        title: intl.formatMessage({
          id: 'inviteList.inviteDeletedSuccess',
          defaultMessage: 'Invite Deleted Successfully',
        }),
        type: 'success',
        icon: <CheckBadgeIcon className="size-7" />,
      });
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'inviteList.inviteDeleteError',
          defaultMessage: 'Something went wrong while deleting the invite.',
        }),
        type: 'error',
        icon: <XCircleIcon className="size-7" />,
        message: e.message,
      });
    } finally {
      revalidate();
      revalidateQuota();
    }
  };

  // Restore last set filter values on component mount
  useEffect(() => {
    const filterString = window.localStorage.getItem('il-filter-settings');

    if (filterString) {
      const filterSettings = JSON.parse(filterString);

      setCurrentFilter(filterSettings.currentFilter);
      setCurrentSort(filterSettings.currentSort);
      setCurrentPageSize(filterSettings.currentPageSize);
    }

    // If filter value is provided in query, use that instead
    if (Object.values(Filter).includes(searchParams.get('filter') as Filter)) {
      setCurrentFilter(searchParams.get('filter') as Filter);
    }
    if (
      Object.values(['created', 'modified']).includes(
        searchParams.get('sort') as Sort
      )
    ) {
      setCurrentSort(searchParams.get('sort') as Sort);
    }
  }, [searchParams]);

  // Set filter values to local storage any time they are changed
  useEffect(() => {
    window.localStorage.setItem(
      'il-filter-settings',
      JSON.stringify({
        currentFilter,
        currentSort,
        currentPageSize,
      })
    );
  }, [currentFilter, currentSort, currentPageSize]);

  if (!data && !error) {
    return <LoadingEllipsis />;
  }

  if (!data) {
    return <LoadingEllipsis />;
  }

  const hasNextPage = (data?.pageInfo.pages ?? 0) > pageIndex + 1;
  const hasPrevPage = pageIndex > 0;

  const subtextItems: React.ReactNode[] =
    user?.id != currentUser?.id
      ? [
          <span key={0}>{user?.displayName}</span>,
          <div key={1}>
            {quota?.invite.limit > 0 ? (
              <span className="flex items-center">
                <div>
                  <span className="font-semibold">
                    {quota?.invite.remaining} / {quota?.invite.limit}
                  </span>{' '}
                  <FormattedMessage
                    id="common.remaining"
                    defaultMessage="remaining"
                  />
                </div>
              </span>
            ) : (
              <span className="font-semibold">
                {quota?.invite.limit === -1 && (
                  <FormattedMessage
                    id="common.unlimited"
                    defaultMessage="Unlimited"
                  />
                )}
              </span>
            )}
          </div>,
        ]
      : [
          <>
            {quota?.invite.limit > 0 ? (
              <div className="flex items-center">
                <ProgressCircle
                  progress={Math.round(
                    ((quota?.invite.remaining ?? 0) /
                      (quota?.invite.limit ?? 1)) *
                      100
                  )}
                  useHeatLevel
                  className="mr-2 h-8 w-8"
                />
                <div>
                  <span className="font-semibold">
                    {quota?.invite.remaining} of {quota?.invite.limit}
                  </span>{' '}
                  <FormattedMessage
                    id="common.remaining"
                    defaultMessage="remaining"
                  />
                </div>
              </div>
            ) : (
              <span className="font-semibold">
                {quota?.invite.limit === -1 && (
                  <FormattedMessage
                    id="common.unlimited"
                    defaultMessage="Unlimited"
                  />
                )}
              </span>
            )}
          </>,
        ];

  return (
    <>
      <div className="w-full self-center mb-4">
        <div className="flex flex-col justify-between lg:flex-row lg:items-end">
          <Header
            subtext={subtextItems?.reduce((prev, curr) => (
              <div className="flex space-x-2">
                {prev} <span>|</span> {curr}
              </div>
            ))}
          >
            <FormattedMessage
              id="inviteList.inviteAFriend"
              defaultMessage="Invite a Friend"
            />
          </Header>
          <div className="mt-2 flex flex-grow flex-col sm:flex-row lg:flex-grow-0">
            <div className="mb-2 flex flex-grow sm:mb-0 sm:mr-2 lg:flex-grow-0">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-sm text-primary-content">
                <FunnelIcon className="h-6 w-6" />
              </span>
              <select
                id="filter"
                name="filter"
                value={currentFilter}
                onChange={(e) => {
                  setCurrentFilter(e.target.value as Filter);
                }}
                className="select select-sm select-primary rounded-l-none w-full flex-1"
              >
                <option value="all">
                  <FormattedMessage id="common.all" defaultMessage="All" />
                </option>
                <option value="active">
                  <FormattedMessage
                    id="common.active"
                    defaultMessage="Active"
                  />
                </option>
                <option value="inactive">
                  <FormattedMessage
                    id="common.inactive"
                    defaultMessage="Inactive"
                  />
                </option>
                <option value="expired">
                  <FormattedMessage
                    id="common.expired"
                    defaultMessage="Expired"
                  />
                </option>
                <option value="redeemed">
                  <FormattedMessage
                    id="common.redeemed"
                    defaultMessage="Redeemed"
                  />
                </option>
              </select>
            </div>
            <div className="mb-2 flex flex-grow sm:mb-0 lg:flex-grow-0 sm:mr-2">
              <span className="inline-flex cursor-default items-center rounded-l-md border border-r-0 border-primary bg-base-100 px-3 text-primary-content sm:text-sm">
                <BarsArrowDownIcon className="h-6 w-6" />
              </span>
              <select
                id="sort"
                name="sort"
                onChange={(e) => {
                  setCurrentSort(e.target.value as Sort);
                }}
                value={currentSort}
                className="select select-sm select-primary rounded-l-none block w-full flex-1"
              >
                <option value="created">
                  <FormattedMessage
                    id="inviteList.sortMostRecent"
                    defaultMessage="Most Recent"
                  />
                </option>
                <option value="modified">
                  <FormattedMessage
                    id="inviteList.sortLastModified"
                    defaultMessage="Last Modified"
                  />
                </option>
              </select>
            </div>
            <Button
              buttonSize="sm"
              buttonType="primary"
              onClick={() => setEditInviteModal({ show: true, Invite: null })}
              disabled={
                (quota?.invite.limit === -1
                  ? quota?.invite.limit
                  : (quota?.invite.remaining ?? 0)) === 0 ||
                !hasPermission(
                  [Permission.CREATE_INVITES, Permission.STREAMARR],
                  { type: 'or' }
                ) ||
                !currentSettings?.enableSignUp
              }
            >
              <FormattedMessage
                id="invite.create"
                defaultMessage="Create Invite"
              />
            </Button>
          </div>
        </div>
        <InviteModal
          show={editInviteModal.show}
          onComplete={(newInvite) => {
            setEditInviteModal({ show: false, Invite: newInvite });
            setShareInviteModal({
              show: true,
              Invite: newInvite,
              isNew: true,
            });
            revalidate();
            revalidateQuota();
          }}
          invite={editInviteModal.Invite}
          onCancel={() => {
            setEditInviteModal({ show: false, Invite: null });
          }}
        />
        <InviteShareModal
          show={
            shareInviteModal.show &&
            shareInviteModal.Invite !== null &&
            shareInviteModal.Invite !== undefined &&
            !!shareInviteModal.Invite?.id &&
            !!shareInviteModal.Invite?.icode
          }
          invite={shareInviteModal.Invite}
          onCancel={() => {
            setShareInviteModal({ show: false, Invite: null, isNew: false });
            setEditInviteModal({ show: false, Invite: null });
          }}
          onCreate={() => {
            setShareInviteModal({ show: false, Invite: null, isNew: false });
            setEditInviteModal({ show: true, Invite: null });
          }}
          isNew={shareInviteModal.isNew}
        />
        <div className="mt-4 w-full">
          {!currentSettings?.enableSignUp && (
            <Alert
              type="warning"
              title={intl.formatMessage({
                id: 'inviteList.signUpDisabled',
                defaultMessage: 'Sign Up Disabled',
              })}
            >
              <p className="ml-3 text-sm leading-5">
                <FormattedMessage
                  id="inviteList.signUpDisabledMessage"
                  defaultMessage="The admin has currently disabled the sign up feature. No new invites can be created."
                />
              </p>
            </Alert>
          )}
          <ul id="invitesList">
            {data?.results.map((invite) => {
              return (
                <InviteCard
                  key={`invite-list-${invite?.id}`}
                  invite={invite}
                  onShare={() =>
                    setShareInviteModal({
                      show: true,
                      Invite: invite,
                      isNew: false,
                    })
                  }
                  onEdit={() =>
                    setEditInviteModal({ show: true, Invite: invite })
                  }
                  onDelete={() => deleteInvite(invite?.id)}
                />
              );
            })}
          </ul>
        </div>
      </div>
      {data?.results.length === 0 && (
        <div className="flex flex-col items-center justify-center p-6 md:w-full">
          <span className="text-base">
            <FormattedMessage
              id="common.noResults"
              defaultMessage="No Results"
            />
          </span>
          {currentFilter !== Filter.ALL && (
            <div className="mt-4">
              <Button
                buttonSize="sm"
                buttonType="primary"
                onClick={() => setCurrentFilter(Filter.ALL)}
              >
                <FormattedMessage
                  id="common.showAll"
                  defaultMessage="Show All"
                />
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="mt-8 mb-4 border-t border-primary pt-5">
        <nav
          className="flex flex-col items-center space-x-4 space-y-3 px-6 py-3 sm:flex-row sm:space-y-0 md:w-full"
          aria-label="Pagination"
        >
          <div className="hidden lg:flex lg:flex-1">
            <p className="text-sm">
              {(data?.results.length ?? 0) > 0 && (
                <FormattedMessage
                  id="common.showingResults"
                  defaultMessage="Showing {start} to {end} of {total} results"
                  values={{
                    start: pageIndex * currentPageSize + 1,
                    end:
                      (data?.results.length ?? 0 < currentPageSize)
                        ? pageIndex * currentPageSize +
                          (data?.results.length ?? 0)
                        : (pageIndex + 1) * currentPageSize,
                    total: data?.pageInfo.results ?? 0,
                  }}
                />
              )}
            </p>
          </div>
          <div className="flex justify-center sm:flex-1 sm:justify-start md:justify-center">
            <span className="-mt-3 items-center text-sm sm:-ml-4 sm:mt-0 md:ml-0">
              <FormattedMessage
                id="common.resultsDisplay"
                defaultMessage="Display {select} results per page"
                values={{
                  select: (
                    <select
                      id="pageSize"
                      name="pageSize"
                      onChange={(e) => {
                        setCurrentPageSize(Number(e.target.value));
                      }}
                      value={currentPageSize}
                      className="select select-sm select-primary mx-1"
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
          </div>
          <div className="flex flex-auto justify-center space-x-2 sm:flex-1 sm:justify-end">
            <Button
              buttonSize="sm"
              buttonType="primary"
              disabled={!hasPrevPage}
              onClick={() => updateQueryParams('page', (page - 1).toString())}
            >
              <ChevronLeftIcon className="size-5" />
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
              onClick={() => updateQueryParams('page', (page + 1).toString())}
            >
              <span>
                <FormattedMessage id="common.next" defaultMessage="Next" />
              </span>
              <ChevronRightIcon className="size-5" />
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
};
export default InviteList;
