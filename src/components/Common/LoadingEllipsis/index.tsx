interface LoadingProps {
  fixed?: boolean;
}

export const SmallLoadingEllipsis = ({ fixed }: LoadingProps) => {
  return (
    <div
      className={`${fixed && 'fixed '}inset-0 flex items-center justify-center text-primary-content gap-1 text-sm`}
    >
      Loading
      <span className="loading loading-dots loading-xs text-primary mt-2"></span>
    </div>
  );
};

const LoadingEllipsis = ({ fixed }: LoadingProps) => {
  return (
    <div
      className={`${fixed && 'fixed '}inset-0 flex items-center justify-center text-primary-content text-lg gap-1`}
    >
      Loading
      <span className="loading loading-dots loading-md text-primary mt-2"></span>
    </div>
  );
};

export default LoadingEllipsis;
