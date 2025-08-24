'use client';
import type { AdminRoute } from '@app/components/Common/AdminTabs';
import AdminTabs from '@app/components/Common/AdminTabs';
import DynamicFrame from '@app/components/Common/DynamicFrame';
import type { RadarrSettings } from '@server/lib/settings';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

const AdminMovies = () => {
  const [hostname, setHostname] = useState('');
  const params = useParams<{ id: string }>();
  const { data: radarrData } = useSWR<RadarrSettings[]>(
    '/api/v1/settings/radarr'
  );

  const radarrRoutes: AdminRoute[] = radarrData?.map((d) => {
    return {
      route: `/admin/movies/${d.id > 0 ? d.id : ''}`,
      text: d.name,
      regex: new RegExp(`^/admin/movies/?${d.id > 0 ? d.id : ''}/?`, 'gi'),
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(`${window?.location?.protocol}//${window?.location?.host}`);
    }
  }, [setHostname]);

  const baseUrl =
    radarrData?.find((d) => d.id === Number(params?.id))?.baseUrl ||
    radarrData[0].baseUrl;

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
