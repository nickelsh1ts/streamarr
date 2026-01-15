'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
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
  const { data: sonarrData } = useSWR<SonarrSettings[]>(
    '/api/v1/settings/sonarr'
  );

  // Wait for data to load
  if (!sonarrData || sonarrData.length === 0) {
    return <LoadingEllipsis />;
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
  const baseUrl =
    sonarrData.find((d) => d.id === Number(params?.id))?.baseUrl ??
    defaultInstance.baseUrl;

  const paramId = Array.isArray(params.id) ? params.id[0] : params.id;
  const newBaseUrl = `/admin/tv${Number(paramId) > 0 ? '/' + Number(paramId) : ''}`;

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
      ></DynamicFrame>
    </div>
  );
};
export default AdminTVShows;
