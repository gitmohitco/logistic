import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-10 h-10 text-[#424989]" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-xl border border-dashed border-[#D0D9DE] ${className}`}>
      <div className="p-3 bg-[#E5EBEE] rounded-full mb-3 text-[#18217E]">
        {icon}
      </div>
      <h4 className="text-sm font-semibold text-[#070724] mb-1">{title}</h4>
      <p className="text-xs text-[#393A50] max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
