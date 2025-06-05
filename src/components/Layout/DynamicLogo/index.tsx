const DynamicLogo = () => {
  return (
    <>
      <img
        src={`${process.env.NEXT_PUBLIC_LOGO ? process.env.NEXT_PUBLIC_LOGO : '/logo_full.png'}`}
        alt="logo"
        className="w-40 sm:w-[190px] h-auto max-md:hidden"
      />
      <img
        src={`${process.env.NEXT_PUBLIC_LOGO_SM ? process.env.NEXT_PUBLIC_LOGO_SM : '/streamarr-logo-512x512.png'}`}
        alt="logo"
        className="w-[36px] sm:w-[45px] h-auto md:hidden"
      />
    </>
  );
};
export default DynamicLogo;
