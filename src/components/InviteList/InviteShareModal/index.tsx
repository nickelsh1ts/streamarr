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
  const { user: currentUser, hasPermission } = useUser();
  const { currentSettings } = useSettings();
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
          title: 'Error fetching QR code:',
          type: 'error',
          message: e.message,
          icon: <XCircleIcon className="size-7" />,
        });
      }
    };
    if (!isNew && show) fetchQrCodeBlob();
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [invite?.id, invite?.icode, isNew, show]);

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
          title: 'Invite link copied!',
          type: 'success',
          message: 'Share it with your friends!',
          icon: <CheckIcon className="size-7" />,
        });
      }
    } catch (e) {
      Toast({
        title: 'Failed to share QR code',
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
      onOk={
        isNew
          ? onCreate
          : () => {
              handleShare();
              onCancel();
            }
      }
      okText={
        isNew ? 'Create Another' : loadingShare ? 'Sharing...' : 'Share Invite'
      }
      okButtonType="primary"
      okDisabled={
        isNew
          ? !(
              quota?.invite.limit === -1 ||
              (quota?.invite.remaining ?? 0) > 0 ||
              hasPermission(
                [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
                { type: 'and' }
              )
            )
          : loadingShare
      }
      secondaryText={isNew ? 'Share Invite' : 'Create Another'}
      secondaryButtonType="default"
      secondaryDisabled={
        !isNew
          ? !(
              quota?.invite.limit === -1 ||
              (quota?.invite.remaining ?? 0) > 0 ||
              hasPermission(
                [Permission.MANAGE_USERS, Permission.MANAGE_INVITES],
                { type: 'and' }
              )
            )
          : loadingShare
      }
      onSecondary={
        isNew
          ? () => {
              handleShare();
              onCancel();
            }
          : onCreate
      }
      onCancel={onCancel}
      title={isNew ? 'Invite Created' : 'Share Your Invite'}
      subtitle={
        'Share this invite link or QR code with your friends to have them signup!'
      }
    >
      <div className="gap-y-4 border-t border-primary pt-4">
        <div className="text-center gap-y-4">
          {isNew ? (
            <>
              <CheckIcon className="inline-block size-12 text-success" />
              <p className="text-lg mb-2">
                Successfully generated a new invite!
              </p>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrCodeBlobUrl}
              alt="Invite QR Code"
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
              itemTitle="Invite Link"
              size="md"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default InviteShareModal;
