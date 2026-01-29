'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import type { RadarrSettings } from '@server/lib/settings';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

const AdminMovies = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const params = useParams<{ id: string }>();
  const { data: radarrData } = useSWR<RadarrSettings[]>(
    '/api/v1/settings/radarr'
  );

  // Wait for data to load
  if (!radarrData || radarrData.length === 0) {
    return <LoadingEllipsis />;
  }

  const radarrRoutes: AdminRoute[] = radarrData.map((d) => {
    return {
      route: `/admin/movies/${d.id > 0 ? d.id : ''}`,
      text: d.name,
      regex: new RegExp(`^/admin/movies/?${d.id > 0 ? d.id : ''}/?`, 'gi'),
    };
  });

  // Find by param ID, or fall back to default instance, or first instance
  const defaultInstance = radarrData.find((d) => d.isDefault) ?? radarrData[0];
  const baseUrl =
    radarrData.find((d) => d.id === Number(params?.id))?.baseUrl ??
    defaultInstance.baseUrl;

  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const newBaseUrl = `/admin/movies${Number(paramId) > 0 ? '/' + Number(paramId) : ''}`;

  return (
    <div className="relative mt-2">
      {radarrData?.length > 1 && (
        <div className="m-4">
          <AdminTabs tabType="button" AdminRoutes={radarrRoutes} />
        </div>
      )}
      <DynamicFrame
        title={'movies'}
        domainURL={hostname}
        basePath={baseUrl}
        newBase={newBaseUrl}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMovies;
