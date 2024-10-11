'use client';
import Loading from '@app/app/loading';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';

const osPath = 'https://nickflixtv.com/request';

const RequestPage: NextPage = () => {
  const router = useRouter();
  if (osPath) {
    router.push(osPath);
    return <Loading />;
  } else {
    return <div>Overseerr Not initialized</div>;
  }
};
export default RequestPage;
