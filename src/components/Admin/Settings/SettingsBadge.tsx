import Badge from '@app/components/Common/Badge';
import Tooltip from '@app/components/Common/ToolTip';

const SettingsBadge = ({
  badgeType,
  className,
}: {
  badgeType: 'advanced' | 'experimental' | 'restartRequired';
  className?: string;
}) => {
  switch (badgeType) {
    case 'advanced':
      return (
        <Tooltip
          content={
            'Incorrectly configuring this setting may result in broken functionality'
          }
        >
          <Badge badgeType="error" className={className}>
            Advanced
          </Badge>
        </Tooltip>
      );
    case 'experimental':
      return (
        <Tooltip
          content={
            'Enabling this setting may result in unexpected application behavior'
          }
        >
          <Badge badgeType="warning">Experimental</Badge>
        </Tooltip>
      );
    case 'restartRequired':
      return (
        <Tooltip
          content={
            'Streamarr must be restarted for changes to this setting to take effect'
          }
        >
          <Badge badgeType="primary" className={className}>
            Restart required
          </Badge>
        </Tooltip>
      );
    default:
      return null;
  }
};

export default SettingsBadge;
