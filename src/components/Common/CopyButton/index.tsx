'use client';
import Tooltip from '@app/components/Common/ToolTip';
import Toast from '@app/components/Toast';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useEffect } from 'react';
import useClipboard from 'react-use-clipboard';
import { useIntl } from 'react-intl';

const CopyButton = ({
  textToCopy,
  itemTitle,
  size = 'md',
  grouped = true,
  onCopy,
}: {
  textToCopy: string;
  itemTitle?: string;
  size?: 'sm' | 'md' | 'lg';
  grouped?: boolean;
  onCopy?: () => void;
}) => {
  const [isCopied, setCopied] = useClipboard(textToCopy, {
    successDuration: 1000,
  });
  const intl = useIntl();

  useEffect(() => {
    if (isCopied) {
      Toast({
        icon: <ClipboardDocumentCheckIcon className="size-7" />,
        title: itemTitle
          ? intl.formatMessage(
              {
                id: 'common.copiedToClipboard',
                defaultMessage: 'Copied {item} to clipboard!',
              },
              { item: itemTitle }
            )
          : intl.formatMessage({
              id: 'common.copied',
              defaultMessage: 'Copied to clipboard',
            }),
        type: 'primary',
      });
    }
  }, [isCopied, itemTitle, intl]);

  return (
    <Tooltip
      content={intl.formatMessage({
        id: 'copyButton.tooltip',
        defaultMessage: 'Copy to Clipboard',
      })}
      tooltipConfig={{ followCursor: true, placement: 'top-end' }}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          setCopied();
          if (onCopy) {
            onCopy();
          }
        }}
        className={`btn btn-primary btn-${size} ${grouped && 'rounded-none only:rounded-md last:rounded-r-md'}`}
      >
        <ClipboardDocumentIcon className="size-5" />
      </button>
    </Tooltip>
  );
};

export default CopyButton;
