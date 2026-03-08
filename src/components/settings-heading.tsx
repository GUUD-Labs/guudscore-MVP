import type { ReactNode } from 'react';

export const SettingsHeading = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="grid">
        <h4>{title}</h4>
        <span className="text-muted text-xs">{description}</span>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};
