import Image from 'next/image';

//TODO create an app setting and upload of custom logo functionality instead of using environment variables

const DynamicLogo = () => {
  return (
    <>
      <Image
        src={`${process.env.NEXT_PUBLIC_LOGO ? process.env.NEXT_PUBLIC_LOGO : '/logo_full.png'}`}
        alt="logo"
        width={190}
        height={55}
        className="w-40 sm:w-[190px] h-auto max-md:hidden"
      />
      <Image
        src={`${process.env.NEXT_PUBLIC_LOGO_SM ? process.env.NEXT_PUBLIC_LOGO_SM : '/streamarr-logo-512x512.png'}`}
        alt="logo"
        width={45}
        height={45}
        className="w-[36px] sm:w-[45px] h-auto md:hidden"
      />
    </>
  );
};
export default DynamicLogo;
