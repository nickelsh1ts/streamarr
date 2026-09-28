'use client';
import type { User } from '@app/hooks/useUser';
import axios from 'axios';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

const SWRProvider = ({
  initialUser,
  children,
}: {
  initialUser: User | undefined;
  children: ReactNode;
}) => (
  <SWRConfig
    value={{
      fetcher: (url: string) => axios.get(url).then((res) => res.data),
      fallback: { '/api/v1/auth/me': initialUser },
    }}
  >
    {children}
  </SWRConfig>
);

export default SWRProvider;
