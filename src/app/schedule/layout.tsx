'use client';
import LoadingEllipsis from '@app/components/Common/LoadingEllipsis';
import useRouteGuard from '@app/hooks/useRouteGuard';
import { Permission, useUser } from '@app/hooks/useUser';

export default function ScheduleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { hasPermission } = useUser();
  useRouteGuard(
    [Permission.VIEW_SCHEDULE, Permission.STREAMARR, Permission.CREATE_EVENTS],
    {
      type: 'or',
    }
  );
  if (
    !hasPermission(
      [
        Permission.VIEW_SCHEDULE,
        Permission.STREAMARR,
        Permission.CREATE_EVENTS,
      ],
      {
        type: 'or',
      }
    )
  ) {
    return <LoadingEllipsis />;
  }

  return <section>{children}</section>;
}
