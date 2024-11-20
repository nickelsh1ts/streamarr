'use client';
export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  children?: PermissionItem[];
}

interface PermissionOptionProps {
  option: PermissionItem;
  parent?: PermissionItem;
  onUpdate: (newPermissions: number) => void;
}

const PermissionOption = ({ option, onUpdate }: PermissionOptionProps) => {
  const disabled = false;
  return (
    <>
      <div
        className={`relative mt-4 flex items-start first:mt-0 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <div className="flex h-6 items-center">
          <input
            className="checkbox checkbox-primary rounded-md"
            id={option.id}
            name="permissions"
            type="checkbox"
            disabled={disabled}
            onChange={() => {}}
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={option.id} className="block">
            <span className="sr-only">option: {option.name}</span>
            <div className="flex flex-col">
              <span className="font-bold text-white">{option.name}</span>
              <span className="font-thin text-neutral-300">
                {option.description}
              </span>
            </div>
          </label>
        </div>
      </div>
      {(option.children ?? []).map((child) => (
        <div key={`permission-child-${child.id}`} className="mt-4 pl-10">
          <PermissionOption
            option={child}
            onUpdate={(newPermission) => onUpdate(newPermission)}
            parent={option}
          />
        </div>
      ))}
    </>
  );
};
export default PermissionOption;
