import CopyButton from '@app/components/Common/CopyButton';
import Modal from '@app/components/Common/Modal';
import Toast from '@app/components/Toast';
import useSettings from '@app/hooks/useSettings';
import { Permission, useUser } from '@app/hooks/useUser';
import { Input } from '@headlessui/react';
import { CheckIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type Invite from '@server/entity/Invite';
import type { QuotaResponse } from '@server/interfaces/api/userInterfaces';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { FormattedMessage, useIntl } from 'react-intl';

interface InviteShareModalProps {
  show: boolean;
  isNew: boolean;
  invite: Invite;
  onCreate: () => void;
  onCancel: () => void;
}

const InviteShareModal = ({
  show,
  isNew,
  invite,
  onCreate,
  onCancel,
}: InviteShareModalProps) => {
  const intl = useIntl();
  const { user: currentUser, hasPermission } = useUser();
  const { currentSettings } = useSettings();
  const [isCopied, setIsCopied] = useState(false);
  const [qrCodeBlobUrl, setQrCodeBlobUrl] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const userQuery = useParams<{ userid: string }>();
  const { user } = useUser({
    id: Number(userQuery?.userid),
  });

  const { data: quota } = useSWR<QuotaResponse>(
    user &&
      (user?.id === currentUser?.id || hasPermission(Permission.MANAGE_USERS))
      ? `/api/v1/user/${user?.id}/quota`
      : null
  );

  useEffect(() => {
    let url: string | null = null;
    const fetchQrCodeBlob = async () => {
      if (!invite?.id || !invite?.icode) return;
      try {
        const response = await axios.get(`/api/v1/invite/${invite.id}/qrcode`, {
          responseType: 'blob',
          withCredentials: true,
        });
        url = URL.createObjectURL(response.data);
        setQrCodeBlobUrl(url);
      } catch (e) {
        Toast({
          title: intl.formatMessage({
            id: 'inviteShare.qrCodeError',
            defaultMessage: 'Error generating QR code',
          }),
          type: 'error',
          message: e.message,
          icon: <XCircleIcon className="size-7" />,
        });
      }
    };
    if (show) fetchQrCodeBlob();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [invite?.id, invite?.icode, isNew, show, intl]);

  const handleShare = async () => {
    if (!invite?.id || !invite?.icode) return;
    setLoadingShare(true);
    const appTitle = currentSettings?.applicationTitle || 'Streamarr';
    const inviteUrl = `${currentSettings?.applicationUrl}/signup?icode=${invite.icode}`;
    const shareText = `Join ${appTitle} today!\n${inviteUrl}`;
    const shareSubject = `You're invited to join ${appTitle}!`;
    const fileName = `invite-${invite.icode}.png`;
    try {
      const imageResponse = await axios.get(
        `/api/v1/invite/${invite.id}/qrcode`,
        {
          responseType: 'blob',
          withCredentials: true,
        }
      );
      const qrBlob = imageResponse.data;
      const url = URL.createObjectURL(qrBlob);
      setQrCodeBlobUrl(url);
      const file = new File([qrBlob], fileName, { type: 'image/png' });
      const shareData: ShareData = {
        title: appTitle,
        text: shareText,
        url: inviteUrl,
        files: [file],
        // @ts-expect-error: subject is not standard but supported by some browsers
        subject: shareSubject,
      };
      // Prefer sharing with QR code image attached and custom options
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        await navigator.share({
          title: appTitle,
          text: shareText,
          url: inviteUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `${shareSubject}\n${shareText}\nQR: ${inviteUrl}`
        );
        Toast({
          title: intl.formatMessage(
            {
              id: 'common.copiedToClipboard',
              defaultMessage: 'Copied {item} to Clipboard!',
            },
            { item: 'Invite link' }
          ),
          type: 'success',
          message: intl.formatMessage({
            id: 'inviteShare.shareWithFriends',
            defaultMessage: 'Share it with your friends!',
          }),
          icon: <CheckIcon className="size-7" />,
        });
      }
    } catch (e) {
      Toast({
        title: intl.formatMessage({
          id: 'inviteShare.qrShareError',
          defaultMessage: 'Failed to share QR code',
        }),
        type: 'error',
        message: e?.message,
        icon: <XCircleIcon className="size-7" />,
      });
    }
    setLoadingShare(false);
  };

  return (
    <Modal
      show={show}
      onOk={() => {
        handleShare();
        onCancel();
      }}
      okText={
        loadingShare
          ? intl.formatMessage({
              id: 'inviteShare.sharing',
              defaultMessage: 'Sharing...',
            })
          : intl.formatMessage({
              id: 'invite.shareInvite',
              defaultMessage: 'Share Invite',
            })
      }
      okButtonType="primary"
      okDisabled={loadingShare}
      secondaryText={
        isNew
          ? intl.formatMessage({
              id: 'inviteShare.createAnother',
              defaultMessage: 'Create Another',
            })
          : intl.formatMessage({
              id: 'common.cancel',
              defaultMessage: 'Cancel',
            })
      }
      secondaryButtonType="default"
      secondaryDisabled={
        isNew
          ? !(
              quota?.invite.limit === -1 ||
              (quota?.invite.remaining ?? 0) > 0 ||
              hasPermission(
                [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
                { type: 'and' }
              )
            )
          : false
      }
      onSecondary={isNew ? onCreate : onCancel}
      onCancel={onCancel}
      title={
        isNew
          ? intl.formatMessage({
              id: 'inviteShare.inviteCreated',
              defaultMessage: 'Invite Created',
            })
          : intl.formatMessage({
              id: 'inviteShare.shareYourInvite',
              defaultMessage: 'Share Your Invite',
            })
      }
      subtitle={intl.formatMessage({
        id: 'inviteShare.shareDescription',
        defaultMessage: 'Share this invite link or QR code with your friends!',
      })}
    >
      <div className="gap-y-4 border-t border-primary pt-4">
        <div className="text-center gap-y-4">
          {isNew && !isCopied ? (
            <>
              <CheckIcon className="inline-block size-12 text-success" />
              <p className="text-lg mb-2">
                <FormattedMessage
                  id="inviteShare.successMessage"
                  defaultMessage="Successfully generated a new invite!"
                />
              </p>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeBlobUrl}
              alt={intl.formatMessage({
                id: 'inviteShare.qrCodeAlt',
                defaultMessage: 'Invite QR Code',
              })}
              width={228}
              height={228}
              className="mx-auto mb-4"
            />
          )}
          <div className="flex">
            <Input
              type="text"
              value={`${currentSettings?.applicationUrl}/signup?icode=${invite?.icode}`}
              className="input input-primary w-full rounded-r-none"
              readOnly
            />
            <CopyButton
              textToCopy={`${currentSettings?.applicationUrl}/signup?icode=${invite?.icode}`}
              itemTitle={intl.formatMessage({
                id: 'inviteShare.inviteLink',
                defaultMessage: 'Invite Link',
              })}
              size="md"
              onCopy={() => setIsCopied(true)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default InviteShareModal;
