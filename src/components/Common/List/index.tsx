import { withProperties } from '@app/utils/typeHelpers';

interface ListItemProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

const ListItem = ({ title, className, children }: ListItemProps) => {
  return (
    <div>
      <div className="max-w-6xl py-4 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-neutral block text-sm font-bold">{title}</dt>
        <dd className="flex text-sm sm:col-span-2 sm:mt-0">
          <span className={`grow overflow-hidden ${className}`}>
            {children}
          </span>
        </dd>
      </div>
    </div>
  );
};

interface ListProps {
  title: string;
  subTitle?: string;
  children: React.ReactNode;
}

const List = ({ title, subTitle, children }: ListProps) => {
  return (
    <>
      <div>
        <h3 className="text-2xl font-bold">{title}</h3>
        {subTitle && <p className="description">{subTitle}</p>}
      </div>
      <div className="mt-6 mb-10">
        <dl className="divide-primary divide-y">{children}</dl>
      </div>
    </>
  );
};

export default withProperties(List, { Item: ListItem });
