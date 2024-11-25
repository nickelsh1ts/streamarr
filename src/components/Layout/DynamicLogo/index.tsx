const DynamicLogo = () => {
  return (
    <>
      <img
        src="/logo_full.png"
        alt="logo"
        className="w-40 sm:w-[190px] h-auto max-md:hidden"
      />
      <img
        src="/streamarr-logo-512x512.png"
        alt="logo"
        className="w-[36px] sm:w-[45px] h-auto md:hidden"
      />
    </>
  );
};
export default DynamicLogo;
