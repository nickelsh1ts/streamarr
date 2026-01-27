import { useEffect, useCallback, useState } from 'react';
import axios from 'axios';
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

  const [data, setData] = useState<DownloadsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Track tab visibility to pause polling when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchDownloads = useCallback(
    async (isInitialLoad = false) => {
      if (!enabled) return;

      // Only show loading spinner on initial load, not on refreshes
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          ...(sort && { sort }),
          ...(sortDirection && { sortDirection }),
          ...(filter && { filter }),
          ...(clientFilter && { clientId: clientFilter.toString() }),
          ...(statusFilter && { status: statusFilter }),
        });

        const response = await axios.get<DownloadsResponse>(
          `/api/v1/downloads?${params}`
        );
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      page,
      pageSize,
      sort,
      sortDirection,
      filter,
      clientFilter,
      statusFilter,
      enabled,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchDownloads(true);
  }, [fetchDownloads]);

  // Poll at configured interval (but don't show loading state)
  // Pause polling when tab is hidden or user has paused
  useEffect(() => {
    if (!enabled || !refreshInterval || isPaused || !isTabVisible) return;

    const interval = setInterval(() => {
      fetchDownloads(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enabled, fetchDownloads, refreshInterval, isPaused, isTabVisible]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchDownloads,
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
      return response.data;
    },
    []
  );

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
  };
};
