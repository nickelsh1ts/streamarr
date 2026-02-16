'use client';
import Button from '@app/components/Common/Button';
import CachedImage from '@app/components/Common/CachedImage';
import Toast from '@app/components/Toast';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/24/solid';
import axios from 'axios';
import { useRef, useState, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  uploadEndpoint: string;
  className?: string;
  disabled?: boolean;
  maxSize?: number;
  accept?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  uploadEndpoint,
  className = '',
  disabled = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = 'image/jpeg,image/png,image/webp,image/gif',
}) => {
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (file.size > maxSize) {
        Toast({
          title: intl.formatMessage({
            id: 'imageUpload.fileTooLarge',
            defaultMessage: 'File is too large. Maximum size is 10MB.',
          }),
          icon: <XCircleIcon className="size-7" />,
          type: 'error',
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post<{ url: string }>(
          uploadEndpoint,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        onChange(response.data.url);
      } catch {
        Toast({
          title: intl.formatMessage({
            id: 'imageUpload.uploadFailed',
            defaultMessage: 'Failed to upload image.',
          }),
          icon: <XCircleIcon className="size-7" />,
          type: 'error',
        });
      } finally {
        setIsUploading(false);
      }
    },
    [uploadEndpoint, onChange, intl, maxSize]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      e.target.value = '';
    },
    [handleUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) {
        handleUpload(file);
      }
    },
    [disabled, isUploading, handleUpload]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        <div className="relative rounded-lg border border-primary/30 overflow-hidden">
          <div className="relative w-full h-32">
            <CachedImage
              src={value}
              alt="Uploaded image"
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-contain"
            />
          </div>
          <Button
            type="button"
            buttonSize="xs"
            buttonType="error"
            onClick={handleClear}
            disabled={disabled}
            className="absolute top-2 right-2 btn-circle"
            aria-label={intl.formatMessage({
              id: 'common.remove',
              defaultMessage: 'Remove',
            })}
          >
            <XMarkIcon className="size-4" />
          </Button>
          <Button
            type="button"
            buttonSize="xs"
            buttonType="ghost"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className="absolute bottom-2 right-2"
          >
            <FormattedMessage id="common.change" defaultMessage="Change" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed cursor-pointer
            transition-colors
            ${dragActive ? 'border-primary bg-primary/10' : 'border-base-content/20 hover:border-primary/50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-md text-primary" />
              <span className="text-sm text-neutral">
                <FormattedMessage
                  id="imageUpload.uploading"
                  defaultMessage="Uploading..."
                />
              </span>
            </div>
          ) : (
            <>
              <PhotoIcon className="size-8 text-neutral mb-2" />
              <span className="text-sm text-neutral text-center">
                <FormattedMessage
                  id="imageUpload.dropOrClick"
                  defaultMessage="Drop an image or click to upload"
                />
              </span>
              <span className="text-xs text-neutral/70 mt-1">
                <FormattedMessage
                  id="imageUpload.formats"
                  defaultMessage="JPG, PNG, WebP, GIF (max 5MB)"
                />
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
