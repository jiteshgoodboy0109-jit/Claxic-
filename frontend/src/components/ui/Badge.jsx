import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-mono uppercase tracking-wider rounded-full border font-semibold';

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1',
    md: 'text-[11px] px-3 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2',
  };

  const variantStyles = {
    default: 'bg-[#eef7f7] text-[#0B4F50] border-[#cbe4e4]',
    primary: 'bg-[#0B4F50] text-white border-[#0B4F50]',
    teal: 'bg-[#eef7f7] text-[#0B4F50] border-[#cbe4e4]',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-900 border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
    info: 'bg-teal-50 text-teal-800 border-teal-300',
    gold: 'bg-yellow-50 text-yellow-900 border-yellow-300 font-bold',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
