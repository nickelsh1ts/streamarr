import useSettings from '@app/hooks/useSettings';
import Image from 'next/image';

const DynamicLogo = () => {
  const { currentSettings } = useSettings();

  const logoSrc = currentSettings.customLogo || '/logo_full.png';
  const logoSmallSrc =
    currentSettings.customLogoSmall || '/streamarr-logo-512x512.png';

  return (
    <>
      <Image
        src={logoSrc}
        alt="logo"
        width={190}
        height={35}
        unoptimized
        className="h-11.25 w-47.5 object-contain object-left max-md:hidden"
      />
      <Image
        src={logoSmallSrc}
        alt="logo"
        width={45}
        height={45}
        unoptimized
        className="h-11.25 w-11.25 object-contain object-left md:hidden"
      />
    </>
  );
};

export default DynamicLogo;
