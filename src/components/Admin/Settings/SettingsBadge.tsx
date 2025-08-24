import Badge from '@app/components/Common/Badge';
import Tooltip from '@app/components/Common/ToolTip';
import { useIntl } from 'react-intl';

const SettingsBadge = ({
  badgeType,
  className,
}: {
  badgeType: 'advanced' | 'experimental' | 'restartRequired';
  className?: string;
}) => {
  const intl = useIntl();

  switch (badgeType) {
    case 'advanced':
      return (
        <Tooltip
          content={intl.formatMessage({
            id: 'settingsBadge.advanced.tooltip',
            defaultMessage:
              'Incorrectly configuring this setting may result in broken functionality',
          })}
        >
          <Badge badgeType="error" className={className}>
            {intl.formatMessage({
              id: 'common.advanced',
              defaultMessage: 'Advanced',
            })}
          </Badge>
        </Tooltip>
      );
    case 'experimental':
      return (
        <Tooltip
          content={intl.formatMessage({
            id: 'settingsBadge.experimental.tooltip',
            defaultMessage:
              'Enabling this setting may result in unexpected application behavior',
          })}
        >
          <Badge badgeType="warning">
            {intl.formatMessage({
              id: 'settingsBadge.experimental.label',
              defaultMessage: 'Experimental',
            })}
          </Badge>
        </Tooltip>
      );
    case 'restartRequired':
      return (
        <Tooltip
          content={intl.formatMessage({
            id: 'settingsBadge.restartRequired.tooltip',
            defaultMessage:
              'Streamarr must be restarted for changes to this setting to take effect',
          })}
        >
          <Badge badgeType="primary" className={className}>
            {intl.formatMessage({
              id: 'settingsBadge.restartRequired.label',
              defaultMessage: 'Restart required',
            })}
          </Badge>
        </Tooltip>
      );
    default:
      return null;
  }
};

export default SettingsBadge;
