import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 
    | 'primary'
    | 'secondary'
    | 'on_route'
    | 'loading'
    | 'delayed'
    | 'delivered'
    | 'active'
    | 'inactive'
    | 'maintenance'
    | 'severity_low'
    | 'severity_medium'
    | 'severity_high'
    | 'critical'
    | 'neutral';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
  };

  const variantStyles: Record<string, string> = {
    primary: 'bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/20',
    secondary: 'bg-[#424989]/10 text-[#424989] border border-[#424989]/20',
    on_route: 'bg-[#0284C7] text-white shadow-xs font-bold border border-sky-300/30',
    loading: 'bg-[#D97706] text-white shadow-xs font-bold border border-amber-300/30',
    delayed: 'bg-[#EA341F] text-white shadow-xs font-bold border border-rose-300/30',
    delivered: 'bg-[#107C41] text-white shadow-xs font-bold border border-emerald-300/30',
    active: 'bg-[#0284C7] text-white shadow-xs font-bold border border-sky-300/30',
    inactive: 'bg-[#8A9995]/20 text-[#393A50] border border-[#8A9995]/40',
    maintenance: 'bg-[#8A9995] text-white',
    severity_low: 'bg-[#424989]/10 text-[#424989] border border-[#424989]/30',
    severity_medium: 'bg-[#18217E]/10 text-[#18217E] border border-[#18217E]/30',
    severity_high: 'bg-[#EA341F]/15 text-[#EA341F] border border-[#EA341F]/40 font-bold',
    critical: 'bg-[#8C2527] text-white font-bold tracking-wide',
    neutral: 'bg-white text-[#393A50] border border-[#D0D9DE]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase tracking-wider ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {children}
    </span>
  );
};
