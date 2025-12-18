import type { AvailableLocale } from '@app/context/LanguageContext';
import { availableLanguages } from '@app/context/LanguageContext';
import useClickOutside from '@app/hooks/useClickOutside';
import useLocale from '@app/hooks/useLocale';
import { Transition } from '@headlessui/react';
import { LanguageIcon } from '@heroicons/react/24/solid';
import { useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';

const LanguagePicker = () => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locale, setLocale } = useLocale();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useClickOutside(dropdownRef, () => setDropdownOpen(false));

  const handleLanguageChange = (newLocale: AvailableLocale) => {
    setLocale?.(newLocale);
    setDropdownOpen(false);
  };

  return (
    <div className="relative z-10">
      <button
        className={`rounded-full p-1 hover:bg-primary/70 hover:text-white focus:bg-primary/80 focus:text-white focus:outline-none focus:ring-1 focus:ring-primary sm:p-2 ${
          isDropdownOpen ? 'bg-primary/60 text-white' : 'text-neutral'
        }`}
        aria-label="Language Picker"
        onClick={() => setDropdownOpen(!isDropdownOpen)}
      >
        <LanguageIcon className="h-6 w-6" />
      </button>

      <Transition
        show={isDropdownOpen}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md shadow-lg"
          ref={dropdownRef}
        >
          <div className="rounded-md bg-[#1f1f1f] px-3 py-2 ring-1 ring-black ring-opacity-5">
            <label
              htmlFor="language"
              className="block pb-2 text-sm font-bold leading-5 text-neutral"
            >
              <FormattedMessage
                id="common.displayLanguage"
                defaultMessage="Display Language"
              />
            </label>
            <select
              id="language"
              className="rounded-md select select-sm select-primary w-full"
              onChange={(e) =>
                handleLanguageChange(e.target.value as AvailableLocale)
              }
              value={locale}
            >
              {Object.entries(availableLanguages).map(
                ([key, { code, display }]) => (
                  <option key={key} value={code}>
                    {display}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </Transition>
    </div>
  );
};

export default LanguagePicker;
