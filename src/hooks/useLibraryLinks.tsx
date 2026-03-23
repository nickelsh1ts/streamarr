'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '@app/components/Toast';
import { XCircleIcon } from '@heroicons/react/24/solid';
import type { PivotOption } from '@server/lib/settings';

export interface LibraryLink {
  id: string;
  name: string;
  type: 'movie' | 'show' | 'artist' | 'live TV' | 'photos' | 'other';
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
}

const useLibraryLinks = (sortBy: 'id' | 'name' | 'type' = 'id') => {
  const [libraryLinks, setLibraryLinks] = useState<LibraryLink[]>([]);
  const [machineId, setMachineId] = useState<string>('');
  const [enablePlaylists, setEnablePlaylists] = useState(false);
  const [defaultPivot, setDefaultPivot] = useState<PivotOption>('library');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<LibraryItemsResponse>(
          `/api/v1/libraries/items?sort=${sortBy}`
        );

        setLibraryLinks(response.data.libraries);
        setMachineId(response.data.machineId);
        setEnablePlaylists(response.data.enablePlaylists);
        setDefaultPivot(response.data.defaultPivot);
      } catch {
        Toast({
          title: 'Failed to load library links',
          type: 'error',
          icon: <XCircleIcon className="size-7" />,
          message: 'Unable to retrieve library links. Please try again.',
        });

        setError('Failed to fetch library links');
        setLibraryLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryLinks();
  }, [sortBy]);

  return {
    libraryLinks,
    machineId,
    enablePlaylists,
    defaultPivot,
    loading,
    error,
  };
};

export default useLibraryLinks;
