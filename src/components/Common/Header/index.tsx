interface HeaderProps {
  extraMargin?: number;
  subtext?: React.ReactNode;
  children: React.ReactNode;
}

const Header = ({ children, extraMargin = 0, subtext }: HeaderProps) => {
  return (
    <div className="mt-8 md:flex md:items-center md:justify-between">
      <div className={`min-w-0 flex-1 mx-${extraMargin}`}>
        <h2
          className="mb-4 truncate text-2xl font-bold leading-7 text-gray-100 sm:overflow-visible sm:text-4xl sm:leading-9 md:mb-0"
          data-testid="page-header"
        >
          <span className="text-primary">{children}</span>
        </h2>
        {subtext && <div className="mt-2 text-neutral-300">{subtext}</div>}
      </div>
    </div>
  );
};

export default Header;
