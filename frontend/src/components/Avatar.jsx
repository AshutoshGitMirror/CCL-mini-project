import { useState } from 'react';

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const [error, setError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-[13px]',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size] || 'h-10 w-10 text-[13px]';

  const initials = (name || '??')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src && !error) {
    return (
      <img
        src={src}
        alt={name || 'Student avatar'}
        onError={() => setError(true)}
        className={`shrink-0 border-2 border-ink object-cover bg-fold ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center border-2 border-ink bg-fold font-bold text-ink select-none ${sizeClasses} ${className}`}
      title={name}
    >
      {initials}
    </span>
  );
}
