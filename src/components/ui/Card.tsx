import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  noPadding?: boolean;
  compact?: boolean;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  action,
  noPadding = false,
  compact = false,
  bodyClassName = '',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[#D0D9DE] shadow-card transition-shadow duration-200 overflow-hidden ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className={`${compact ? 'px-3.5 py-2 gap-2' : 'px-5 py-3.5 gap-3'} border-b border-[#D0D9DE] flex flex-wrap items-center justify-between bg-white flex-shrink-0`}>
          <div className="min-w-0">
            {title && (
              <h3 className={`${compact ? 'text-xs font-bold' : 'text-sm font-semibold'} text-[#09104D] uppercase tracking-wider flex items-center gap-2`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-[#393A50] mt-0.5`}>{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={`${noPadding ? '' : compact ? 'p-3' : 'p-5'} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};
