'use client';
import Toast from '@app/components/Toast';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';
import useClipboard from 'react-use-clipboard';

const CopyButton = ({
  textToCopy,
  size = 'md',
  grouped = true,
}: {
  textToCopy: string;
  size?: 'sm' | 'md' | 'lg';
  grouped?: boolean;
}) => {
  const [isCopied, setCopied] = useClipboard(textToCopy, {
    successDuration: 1000,
  });

  useEffect(() => {
    if (isCopied) {
      Toast({
        icon: <ClipboardDocumentCheckIcon className="size-7" />,
        title: 'Copied to clipboard!',
        type: 'primary',
      });
    }
  }, [isCopied]);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setCopied();
      }}
      className={`btn btn-primary btn-${size} ${grouped && 'rounded-none only:rounded-md last:rounded-r-md'}`}
    >
      <ClipboardDocumentIcon className="size-5" />
    </button>
  );
};

export default CopyButton;
