import CachedImage from '@app/components/Common/CachedImage';
import type { User } from '@app/hooks/useUser';
import { useUser } from '@app/hooks/useUser';
import {
  Listbox,
  ListboxButton,
  Portal,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useParams } from 'next/navigation';
import { Fragment, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

const UserSelector = ({
  existingUser,
  userData,
  multiple = false,
  onChange,
  onBlur,
  name,
  valid = true,
}: {
  existingUser?: User | User[] | null;
  userData?: User[];
  multiple?: boolean;
  onChange?: (user: User | User[] | null) => void;
  onBlur?: () => void;
  name?: string;
  valid?: boolean;
}) => {
  const searchParams = useParams<{ userid: string }>();
  const { user } = useUser({
    id: searchParams.userid ? Number(searchParams.userid) : undefined,
  });

  // Initialize with proper type based on multiple flag
  const getInitialValue = () => {
    if (existingUser !== undefined) {
      return multiple && !Array.isArray(existingUser)
        ? existingUser
          ? [existingUser]
          : []
        : existingUser;
    }
    if (multiple) {
      return searchParams.userid &&
        user &&
        userData?.some((u) => u.id === user.id)
        ? [user]
        : [];
    }
    return user ?? null;
  };

  const [selectedUser, setSelectedUser] = useState<User | User[] | null>(
    getInitialValue()
  );

  // Notify parent of initial value when component mounts or when existingUser changes
  useEffect(() => {
    const initialValue = getInitialValue();
    if (
      onChange &&
      initialValue !== null &&
      (!Array.isArray(initialValue) || initialValue.length > 0)
    ) {
      onChange(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingUser]);

  // Handle value changes
  const handleChange = (value: User | User[] | null) => {
    setSelectedUser(value);
    if (onChange) {
      onChange(value);
    }
  };

  const buttonRef = useRef(null);
  const optionsRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
    openUp: false,
  });
  const [listboxOpen, setListboxOpen] = useState(false);
  const [dropdownMeasured, setDropdownMeasured] = useState(false);

  useEffect(() => {
    if (listboxOpen) {
      setDropdownMeasured(false);
    }
  }, [listboxOpen]);

  useEffect(() => {
    function updateDropdownPosition() {
      if (listboxOpen && optionsRef.current && buttonRef.current) {
        const dropdownRect = optionsRef.current.getBoundingClientRect();
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const margin = 8;
        if (dropdownRect.height > spaceBelow && spaceAbove > spaceBelow) {
          setDropdownPos((prev) => ({
            ...prev,
            top: buttonRect.top + window.scrollY - dropdownRect.height - margin,
            left: buttonRect.left + window.scrollX,
            width: buttonRect.width,
            openUp: true,
          }));
        } else {
          setDropdownPos((prev) => ({
            ...prev,
            top: buttonRect.bottom + window.scrollY + margin,
            left: buttonRect.left + window.scrollX,
            width: buttonRect.width,
            openUp: false,
          }));
        }
        setDropdownMeasured(true);
      }
    }

    if (listboxOpen) {
      updateDropdownPosition();
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [listboxOpen, dropdownPos.width]);

  // Guard against undefined userData
  const users = userData ?? [];

  return (
    <Listbox
      as="div"
      value={selectedUser}
      onChange={handleChange}
      className="space-y-1"
      multiple={multiple}
      onBlur={onBlur}
      name={name}
      invalid={!valid}
    >
      {({ open }) => {
        if (open !== listboxOpen) {
          setTimeout(() => setListboxOpen(open), 0);
        }
        return (
          <div className="relative">
            <span className="inline-block w-full relative rounded-md shadow-sm">
              <ListboxButton
                ref={buttonRef}
                className={`relative w-full cursor-default rounded-md border ${valid ? 'border-primary' : 'border-error'} bg-base-100 py-2 pl-3 pr-10 text-left text-white transition duration-150 ease-in-out focus:outline focus:outline-2 ${valid ? 'focus:outline-primary' : 'focus:outline-error'} focus:outline-offset-2 sm:text-sm sm:leading-5`}
              >
                {!multiple && !Array.isArray(selectedUser) && selectedUser ? (
                  <span className="flex items-center">
                    <CachedImage
                      src={selectedUser.avatar}
                      alt=""
                      className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                      width={24}
                      height={24}
                    />
                    <span className="ml-3 block">
                      {selectedUser.displayName}
                    </span>
                    {selectedUser.displayName.toLowerCase() !==
                      selectedUser.email && (
                      <span className="ml-1 truncate text-gray-400">
                        ({selectedUser.email})
                      </span>
                    )}
                  </span>
                ) : multiple &&
                  Array.isArray(selectedUser) &&
                  selectedUser.length > 0 ? (
                  <span className="flex items-center -space-x-2">
                    {selectedUser.map((user, idx) => (
                      <CachedImage
                        key={user?.id || idx}
                        src={user?.avatar}
                        alt=""
                        className="size-6 flex-shrink-0 rounded-full object-cover"
                        width={24}
                        height={24}
                      />
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    <FormattedMessage
                      id="selectUsers"
                      defaultMessage="Select Users"
                    />
                  </span>
                )}
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500">
                  <ChevronDownIcon className="h-5 w-5" />
                </span>
              </ListboxButton>
            </span>
            <Portal>
              {listboxOpen && (
                <ListboxOptions
                  ref={optionsRef}
                  className={`z-[9999] px-1 max-h-60 overflow-auto rounded-md bg-base-100 border ${valid ? 'border-primary' : 'border-error'} py-2 text-base leading-6 shadow-lg focus:outline-none sm:text-sm sm:leading-5`}
                  style={{
                    position: 'absolute',
                    top: dropdownMeasured ? dropdownPos.top : 0,
                    left: dropdownMeasured ? dropdownPos.left : 0,
                    width: dropdownMeasured ? dropdownPos.width : undefined,
                    visibility: dropdownMeasured ? 'visible' : 'hidden',
                    pointerEvents: dropdownMeasured ? 'auto' : 'none',
                  }}
                >
                  {users.map((user) => (
                    <ListboxOption key={user?.id} value={user} as={Fragment}>
                      {({ selected, focus }) => (
                        <div
                          className={`${
                            focus ? 'bg-primary text-white' : 'text-gray-300'
                          } relative cursor-default select-none py-2 pl-8 pr-4 rounded-md`}
                        >
                          <span
                            className={`${
                              selected ? 'font-semibold' : 'font-normal'
                            } flex items-center`}
                          >
                            <CachedImage
                              src={user.avatar}
                              alt=""
                              className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
                              width={24}
                              height={24}
                            />
                            <span className="ml-3 block flex-shrink-0">
                              {user.displayName}
                            </span>
                            {user.displayName.toLowerCase() !== user.email && (
                              <span className="ml-1 truncate text-gray-400">
                                ({user.email})
                              </span>
                            )}
                          </span>
                          {selected && (
                            <span
                              className={`${
                                focus ? 'text-white' : 'text-primary'
                              } absolute inset-y-0 left-0 flex items-center pl-1.5`}
                            >
                              <CheckIcon className="h-5 w-5" />
                            </span>
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              )}
            </Portal>
          </div>
        );
      }}
    </Listbox>
  );
};

export default UserSelector;
