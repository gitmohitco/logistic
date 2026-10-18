import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex flex-row items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none whitespace-nowrap';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[#18217E] hover:bg-[#121860] text-white shadow-sm focus:ring-[#18217E]',
    secondary: 'bg-[#424989] hover:bg-[#343a72] text-white shadow-sm focus:ring-[#424989]',
    outline: 'bg-white border border-[#D0D9DE] text-[#070724] hover:bg-[#F4F7F9] hover:border-[#424989] focus:ring-[#18217E]',
    danger: 'bg-[#EA341F] hover:bg-[#c92916] text-white shadow-sm focus:ring-[#EA341F]',
    ghost: 'bg-transparent text-[#393A50] hover:bg-[#E5EBEE] hover:text-[#070724] focus:ring-[#424989]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-0.5 mr-1 h-4 w-4 text-current flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : leftIcon ? (
        <span className="flex-shrink-0 inline-flex items-center">{leftIcon}</span>
      ) : null}
      <span className="inline-flex flex-row items-center gap-1.5 whitespace-nowrap">{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0 inline-flex items-center">{rightIcon}</span>}
    </button>
  );
};
