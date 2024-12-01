'use client';
import Tooltip from '@app/components/Common/ToolTip';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const BackButton = () => {
  const router = useRouter();
  return (
    <Tooltip tooltipConfig={{ placement: 'bottom' }} content="Back">
      <button
        onClick={() => router.back()}
        className="pwa-only pointer-events-auto hover:opacity-70 mr-0.5"
      >
        <ArrowLeftIcon className="size-7 m-2" />
      </button>
    </Tooltip>
  );
};
export default BackButton;
