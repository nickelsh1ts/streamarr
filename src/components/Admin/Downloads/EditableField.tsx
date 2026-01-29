import React, { useState, useRef, useEffect, useCallback } from 'react';
import useClickOutside from '@app/hooks/useClickOutside';
import { PencilIcon } from '@heroicons/react/24/solid';

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  placeholder,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editValueRef = useRef(editValue);
  const justSavedRef = useRef(false);
  const isSavingRef = useRef(false);
  const valueRef = useRef(value);

  // Keep refs in sync with state
  useEffect(() => {
    editValueRef.current = editValue;
  }, [editValue]);

  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Update editValue when the external value changes, but skip if we just saved
  useEffect(() => {
    if (!isEditing && !justSavedRef.current) {
      setEditValue(value);
    }
    // Reset the flag after the parent has had a chance to update
    if (justSavedRef.current) {
      justSavedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Intentionally not including isEditing to prevent reset during editing

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(async () => {
    // Prevent multiple simultaneous saves using ref
    if (isSavingRef.current) {
      return;
    }

    // Capture the value to save from ref to avoid stale closures
    const valueToSave = editValueRef.current.trim();
    const originalValue = valueRef.current;

    // Don't save if value hasn't changed
    if (valueToSave === originalValue) {
      setIsEditing(false);
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    justSavedRef.current = true; // Mark that we just saved
    try {
      await onSave(valueToSave);
      // Update to the saved value so it displays correctly when we exit edit mode
      setEditValue(valueToSave);
      setIsEditing(false);
    } catch {
      // Error handling done by parent
      justSavedRef.current = false; // Clear flag on error
      setEditValue(originalValue); // Reset on error
      setIsEditing(false);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [onSave]);

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleClickOutside = useCallback(() => {
    const currentlyEditing = isEditing;
    const currentlySaving = isSavingRef.current;
    if (currentlyEditing && !currentlySaving) {
      handleSave();
    }
  }, [isEditing, handleSave]);

  useClickOutside(containerRef, handleClickOutside);

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex flex-grow items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isSaving}
          className="input input-sm input-primary flex-grow"
        />
        {isSaving && (
          <span className="loading loading-spinner loading-xs"></span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={() => !disabled && setIsEditing(true)}
        disabled={disabled}
        className="font-medium text-left underline underline-offset-4 hover:underline-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center"
        title={disabled ? '' : 'Click to edit'}
      >
        <span>{value || placeholder || 'Not set'}</span>
        {!disabled && (
          <PencilIcon className="w-3 opacity-50 sm:w-0 h-3 ml-1 sm:opacity-0 sm:group-hover:w-3 sm:group-hover:opacity-50 sm:group-hover:ml-1 transition-all duration-150 overflow-visible" />
        )}
      </button>
    </div>
  );
};

export default EditableField;
