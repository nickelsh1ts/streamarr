import { useCallback, useMemo } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import type {
  DownloadsResponse,
  TorrentActionRequest,
  AddTorrentRequest,
} from '@server/interfaces/api/downloadsInterfaces';

interface UseDownloadsOptions {
  page: number;
  pageSize: number;
  sort?: string;
  sortDirection?: 'asc' | 'desc';
  filter?: string;
  clientFilter?: number;
  statusFilter?: string;
  enabled?: boolean;
  refreshInterval?: number;
  isPaused?: boolean;
}

export const useDownloads = (options: UseDownloadsOptions) => {
  const {
    page,
    pageSize,
    sort,
    sortDirection = 'desc',
    filter,
    clientFilter,
    statusFilter,
    enabled = true,
    refreshInterval = 2000,
    isPaused = false,
  } = options;

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(sort && { sort }),
      ...(sortDirection && { sortDirection }),
      ...(filter && { filter }),
      ...(clientFilter !== undefined && {
        clientId: clientFilter.toString(),
      }),
      ...(statusFilter && { status: statusFilter }),
    });
    return params.toString();
  }, [page, pageSize, sort, sortDirection, filter, clientFilter, statusFilter]);

  const swrKey = enabled ? `/api/v1/downloads?${queryString}` : null;

  const { data, error, isLoading, isValidating, mutate } =
    useSWR<DownloadsResponse>(swrKey, {
      refreshInterval: isPaused ? 0 : refreshInterval,
      revalidateOnFocus: !isPaused,
      dedupingInterval: 1000,
    });

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    data: data ?? null,
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error: error ?? null,
    refetch,
  };
};

// Action hooks
export const useDownloadActions = () => {
  const performAction = useCallback(
    async (
      hash: string,
      clientId: number,
      action: TorrentActionRequest['action'],
      options?: Omit<TorrentActionRequest, 'clientId' | 'action'>
    ) => {
      const response = await axios.post(`/api/v1/downloads/${hash}/action`, {
        clientId,
        action,
        ...options,
      });

      const { mutate } = await import('swr');
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
      );

      return response.data.success;
    },
    []
  );

  const pause = useCallback(
    (hash: string, clientId: number) => performAction(hash, clientId, 'pause'),
    [performAction]
  );

  const resume = useCallback(
    (hash: string, clientId: number) => performAction(hash, clientId, 'resume'),
    [performAction]
  );

  const remove = useCallback(
    (hash: string, clientId: number, deleteFiles = false) =>
      performAction(hash, clientId, 'remove', { deleteFiles }),
    [performAction]
  );

  const forceRecheck = useCallback(
    (hash: string, clientId: number) =>
      performAction(hash, clientId, 'forceRecheck'),
    [performAction]
  );

  const queueUp = useCallback(
    (hash: string, clientId: number) =>
      performAction(hash, clientId, 'queueUp'),
    [performAction]
  );

  const queueDown = useCallback(
    (hash: string, clientId: number) =>
      performAction(hash, clientId, 'queueDown'),
    [performAction]
  );

  const topPriority = useCallback(
    (hash: string, clientId: number) =>
      performAction(hash, clientId, 'topPriority'),
    [performAction]
  );

  const bottomPriority = useCallback(
    (hash: string, clientId: number) =>
      performAction(hash, clientId, 'bottomPriority'),
    [performAction]
  );

  const addTorrent = useCallback(async (options: AddTorrentRequest) => {
    const response = await axios.post('/api/v1/downloads/add', options);

    const { mutate } = await import('swr');
    mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
    );

    return response.data;
  }, []);

  const getTorrentFiles = useCallback(
    async (hash: string, clientId: number) => {
      const response = await axios.get(`/api/v1/downloads/${hash}/files`, {
        params: { clientId },
      });
      return response.data.files;
    },
    []
  );

  const updateTorrent = useCallback(
    async (
      hash: string,
      clientId: number,
      updates: { category?: string; savePath?: string }
    ) => {
      const response = await axios.patch(`/api/v1/downloads/${hash}`, {
        clientId,
        ...updates,
      });

      const { mutate } = await import('swr');
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
      );

      return response.data;
    },
    []
  );

  const setFilePriority = useCallback(
    async (
      hash: string,
      clientId: number,
      fileIds: number[],
      priority: number
    ) => {
      const response = await axios.post(
        `/api/v1/downloads/${hash}/files/priority`,
        {
          clientId,
          fileIds,
          priority,
        }
      );

      const { mutate } = await import('swr');
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
      );

      return response.data;
    },
    []
  );

  const performBulkAction = useCallback(
    async (
      torrents: { hash: string; clientId: number }[],
      action:
        | 'pause'
        | 'resume'
        | 'forceRecheck'
        | 'remove'
        | 'queueUp'
        | 'queueDown'
        | 'topPriority'
        | 'bottomPriority',
      deleteFiles = false
    ) => {
      const response = await axios.post('/api/v1/downloads/action', {
        torrents,
        action,
        deleteFiles,
      });

      const { mutate } = await import('swr');
      mutate(
        (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
      );

      return response.data;
    },
    []
  );

  const retryClient = useCallback(async (clientId?: number) => {
    const endpoint = clientId
      ? `/api/v1/downloads/health/retry/${clientId}`
      : '/api/v1/downloads/health/retry';

    const response = await axios.post(endpoint);

    const { mutate } = await import('swr');
    mutate(
      (key) => typeof key === 'string' && key.startsWith('/api/v1/downloads')
    );

    return response.data;
  }, []);

  return {
    pause,
    resume,
    remove,
    forceRecheck,
    queueUp,
    queueDown,
    topPriority,
    bottomPriority,
    addTorrent,
    getTorrentFiles,
    updateTorrent,
    setFilePriority,
    performBulkAction,
    retryClient,
  };
};
