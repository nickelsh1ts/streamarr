interface LoadingProps {
  fixed?: boolean;
  text?: string;
}

export const SmallLoadingEllipsis = ({
  fixed,
  text = 'Loading',
}: LoadingProps) => {
  return (
    <div
      className={`${fixed && 'fixed '}inset-0 flex items-center justify-center text-primary-content gap-1 text-sm`}
    >
      {text}
      <span className="loading loading-dots loading-xs text-primary mt-2"></span>
    </div>
  );
};

const LoadingEllipsis = ({ fixed, text = 'Loading' }: LoadingProps) => {
  return (
    <div
      className={`${fixed ? 'fixed ' : ''}inset-0 flex items-center justify-center text-primary-content text-lg gap-1`}
    >
      {text}
      <span className="loading loading-dots loading-md text-primary mt-2"></span>
    </div>
  );
};

export default LoadingEllipsis;
