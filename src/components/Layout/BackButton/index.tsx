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
        className="pwa-only text-base-content pointer-events-auto mr-0.5 hover:cursor-pointer hover:opacity-70"
      >
        <ArrowLeftIcon className="m-2 size-7" />
      </button>
    </Tooltip>
  );
};
export default BackButton;
