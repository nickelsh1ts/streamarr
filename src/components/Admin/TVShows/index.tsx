'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import { ServiceNotConfigured } from '@app/components/Common/ServiceError';
import type { SonarrSettings } from '@server/lib/settings';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';

const AdminTVShows = () => {
  const [hostname] = useState(() =>
    typeof window !== 'undefined'
      ? `${window?.location?.protocol}//${window?.location?.host}`
      : ''
  );
  const params = useParams<{ id: string }>();
  const { data: sonarrData, isLoading } = useSWR<SonarrSettings[]>(
    '/api/v1/settings/sonarr'
  );

  // Wait for data to load
  if (isLoading) {
    return <LoadingEllipsis />;
  }

  if (!sonarrData || sonarrData.length === 0) {
    return (
      <ServiceNotConfigured
        serviceName="Sonarr"
        settingsPath="/admin/settings/services/sonarr"
      />
    );
  }

  const sonarrRoutes: AdminRoute[] = sonarrData.map((d) => {
    return {
      route: `/admin/tv/${d.id > 0 ? d.id : ''}`,
      text: d.name,
      regex: new RegExp(`^/admin/tv/?${d.id > 0 ? d.id : ''}/?`, 'gi'),
    };
  });

  // Find by param ID, or fall back to default instance, or first instance
  const defaultInstance = sonarrData.find((d) => d.isDefault) ?? sonarrData[0];
  const currentInstance =
    sonarrData.find((d) => d.id === Number(params?.id)) ?? defaultInstance;
  const baseUrl = currentInstance.baseUrl;

  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const newBaseUrl = `/admin/tv${Number(paramId) > 0 ? '/' + Number(paramId) : ''}`;

  const isConfigured = !!(
    currentInstance.hostname &&
    currentInstance.port &&
    currentInstance.apiKey
  );

  return (
    <div className="relative mt-2">
      {sonarrData?.length > 1 && (
        <div className="m-4">
          <AdminTabs tabType="button" AdminRoutes={sonarrRoutes} />
        </div>
      )}
      <DynamicFrame
        title={'tvshows'}
        domainURL={hostname}
        basePath={baseUrl}
        newBase={newBaseUrl}
        serviceName={currentInstance.name || 'Sonarr'}
        settingsPath="/admin/settings/services/sonarr"
        isConfigured={isConfigured}
      ></DynamicFrame>
    </div>
  );
};
export default AdminTVShows;
