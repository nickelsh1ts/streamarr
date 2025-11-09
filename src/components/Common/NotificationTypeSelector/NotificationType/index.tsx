/* eslint-disable jsx-a11y/label-has-associated-control */
import type { NotificationItem } from '@app/components/Common/NotificationTypeSelector';
import { hasNotificationType } from '@app/components/Common/NotificationTypeSelector';

interface NotificationTypeProps {
  option: NotificationItem;
  currentTypes: number;
  parent?: NotificationItem;
  onUpdate: (newTypes: number) => void;
  agent?: string;
}

const NotificationType = ({
  option,
  currentTypes,
  onUpdate,
  parent,
  agent = '',
}: NotificationTypeProps) => {
  const agentId = agent ? `${agent}-${option.id}` : option.id;

  return (
    <>
      <div
        className={`relative mt-4 flex items-start first:mt-0 ${
          !!parent?.value && hasNotificationType(parent.value, currentTypes)
            ? 'opacity-50'
            : ''
        }`}
      >
        <div className="flex h-6 items-center">
          <input
            className="checkbox checkbox-primary rounded-md"
            id={agentId}
            name={agentId}
            type="checkbox"
            disabled={
              !!parent?.value && hasNotificationType(parent.value, currentTypes)
            }
            onClick={() => {
              onUpdate(
                hasNotificationType(option.value, currentTypes)
                  ? currentTypes - option.value
                  : currentTypes + option.value
              );
            }}
            defaultChecked={
              hasNotificationType(option.value, currentTypes) ||
              (!!parent?.value &&
                hasNotificationType(parent.value, currentTypes))
            }
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={agentId} className="block">
            <div className="flex flex-col">
              <span className="font-bold text-white">{option.name}</span>
              <span className="font-thin text-neutral-300">
                {option.description ?? ''}
              </span>
            </div>
          </label>
        </div>
      </div>
      {(option.children ?? []).map((child) => (
        <div
          key={`notification-type-child-${agent}-${child.id}`}
          className="mt-4 pl-6"
        >
          <NotificationType
            option={child}
            currentTypes={currentTypes}
            onUpdate={(newTypes) => onUpdate(newTypes)}
            parent={option}
            agent={agent}
          />
        </div>
      ))}
    </>
  );
};

export default NotificationType;
