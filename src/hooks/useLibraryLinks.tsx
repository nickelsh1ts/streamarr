'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '@app/components/Toast';
import { XCircleIcon } from '@heroicons/react/24/solid';

export interface LibraryLink {
  id: string;
  name: string;
  type: 'movie' | 'show' | 'artist' | 'live TV' | 'photos' | 'other';
  mediaCount: number;
  href: string;
  regExp: string;
}

const useLibraryLinks = (sortBy: 'id' | 'name' | 'type' = 'id') => {
  const [libraryLinks, setLibraryLinks] = useState<LibraryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibraryLinks = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<LibraryLink[]>(
          `/api/v1/libraries/items?sort=${sortBy}`
        );

        setLibraryLinks(response.data);
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

  return { libraryLinks, loading, error };
};

export default useLibraryLinks;
