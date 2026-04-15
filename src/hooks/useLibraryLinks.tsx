'use client';
import useSWR from 'swr';
import type { PivotOption } from '@server/lib/settings';

interface LibraryLink {
  id: string;
  name: string;
  type: 'movie' | 'show' | 'artist' | 'live TV' | 'photo' | 'other';
  mediaCount: number;
  href: string;
  regExp: string;
  hasPlaylists: boolean;
}

interface LibraryItemsResponse {
  machineId: string;
  enablePlaylists: boolean;
  defaultPivot: PivotOption;
  libraries: LibraryLink[];
  plexHealth?: {
    status: 'healthy' | 'retrying' | 'unhealthy';
    lastSuccess?: string;
    cooldownUntil?: string;
  };
}

const useLibraryLinks = (sortBy: 'id' | 'name' | 'type' = 'id') => {
  const { data, isLoading } = useSWR<LibraryItemsResponse>(
    `/api/v1/libraries/items?sort=${sortBy}`,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 60000,
    }
  );

  return {
    libraryLinks: data?.libraries ?? [],
    machineId: data?.machineId ?? '',
    enablePlaylists: data?.enablePlaylists ?? false,
    defaultPivot: data?.defaultPivot ?? 'library',
    loading: isLoading,
    plexHealth: data?.plexHealth,
  };
};

export default useLibraryLinks;
