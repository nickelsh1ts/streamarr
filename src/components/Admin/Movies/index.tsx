'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ServiceNotConfigured } from '@app/components/Common/ServiceError';
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
  const { data: radarrData, isLoading } = useSWR<RadarrSettings[]>(
    '/api/v1/settings/radarr'
  );

  // Wait for data to load
  if (isLoading) {
    return <LoadingEllipsis />;
  }

  if (!radarrData || radarrData.length === 0) {
    return (
      <ServiceNotConfigured
        serviceName="Radarr"
        settingsPath="/admin/settings/services/radarr"
      />
    );
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
  const currentInstance =
    radarrData.find((d) => d.id === Number(params?.id)) ?? defaultInstance;
  const baseUrl = currentInstance.baseUrl;

  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const newBaseUrl = `/admin/movies${Number(paramId) > 0 ? '/' + Number(paramId) : ''}`;

  const isConfigured = !!(
    currentInstance.hostname &&
    currentInstance.port &&
    currentInstance.apiKey
  );

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
        serviceName={currentInstance.name || 'Radarr'}
        settingsPath="/admin/settings/services/radarr"
        isConfigured={isConfigured}
      ></DynamicFrame>
    </div>
  );
};
export default AdminMovies;
