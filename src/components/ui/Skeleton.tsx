import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-[#D0D9DE]/60 rounded ${className}`} />
  );
};
