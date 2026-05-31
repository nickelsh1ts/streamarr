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
            className="checkbox checkbox-sm checkbox-primary rounded-md"
            id={agentId}
            name={agentId}
            type="checkbox"
            disabled={
              !!parent?.value && hasNotificationType(parent.value, currentTypes)
            }
            checked={
              Boolean(currentTypes & option.value) ||
              (!!parent?.value &&
                hasNotificationType(parent.value, currentTypes))
            }
            onChange={(event) => {
              onUpdate(
                event.target.checked
                  ? currentTypes | option.value
                  : currentTypes & ~option.value
              );
            }}
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={agentId} className="block">
            <div className="flex flex-col">
              <span className="font-bold">{option.name}</span>
              <span className="font-thin text-neutral">
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
