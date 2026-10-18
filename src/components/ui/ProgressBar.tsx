import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100+
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'auto' | 'primary' | 'warning' | 'danger';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercent = true,
  size = 'md',
  variant = 'auto',
  className = '',
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  const isOverCapacity = value > max;

  // Determine color based on threshold if variant is 'auto'
  let barColor = 'bg-[#18217E]';
  if (variant === 'auto') {
    if (isOverCapacity || percentage >= 90) {
      barColor = 'bg-[#EA341F]'; // Alert red
    } else if (percentage >= 75) {
      barColor = 'bg-[#424989]'; // Secondary blue / warning
    } else {
      barColor = 'bg-[#18217E]'; // Normal primary brand
    }
  } else if (variant === 'danger') {
    barColor = 'bg-[#EA341F]';
  } else if (variant === 'warning') {
    barColor = 'bg-[#424989]';
  }

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          {label && <span className="font-medium text-[#070724]">{label}</span>}
          {showPercent && (
            <span className={`font-semibold ${isOverCapacity || percentage >= 90 ? 'text-[#EA341F]' : 'text-[#393A50]'}`}>
              {percentage}% {isOverCapacity && '(Over Capacity)'}
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-[#E5EBEE] rounded-full overflow-hidden ${heightStyles[size]}`}>
        <div
          className={`${barColor} ${heightStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
