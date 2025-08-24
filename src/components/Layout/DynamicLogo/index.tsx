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
        className="h-[45px] w-[190px] max-md:hidden object-contain object-left"
      />
      <Image
        src={logoSmallSrc}
        alt="logo"
        width={45}
        height={45}
        unoptimized
        className="w-[45px] h-[45px] md:hidden object-contain object-left"
      />
    </>
  );
};

export default DynamicLogo;
