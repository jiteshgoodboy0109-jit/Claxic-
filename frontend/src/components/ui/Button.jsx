import React from 'react';
import { LoadingSpinner } from './LoadingSpinner.jsx';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#EE2D02]/20 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-full sm:rounded-xl cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 font-semibold',
    md: 'text-sm px-4.5 py-2.5 gap-2 font-semibold',
    lg: 'text-sm px-6 py-3 gap-2 font-bold',
  };

  const variantStyles = {
    primary:
      'bg-[#EE2D02] text-white hover:bg-[#D02600] active:bg-[#B52000] border border-[#EE2D02] shadow-xs hover:shadow-md transition-all active:scale-[0.99]',
    secondary:
      'bg-[#FFF1EE] text-[#EE2D02] hover:bg-[#FFE5E0] active:bg-[#FFD4CC] border border-[#FFD4CC] shadow-2xs font-semibold',
    outline:
      'bg-white text-[#EE2D02] hover:text-[#D02600] border border-slate-200 hover:border-[#FFD4CC] hover:bg-slate-50 shadow-2xs',
    ghost:
      'bg-transparent text-[#EE2D02] hover:text-[#D02600] hover:bg-[#FFF1EE]',
    danger:
      'bg-red-700 text-white hover:bg-red-800 border border-red-700 shadow-2xs',
    success:
      'bg-emerald-700 text-white hover:bg-emerald-800 border border-emerald-700 shadow-2xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  const spinnerVariant =
    variant === 'secondary' || variant === 'outline' || variant === 'ghost'
      ? 'brand'
      : 'white';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="xs" variant={spinnerVariant} inline className="-ml-1 mr-2" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
