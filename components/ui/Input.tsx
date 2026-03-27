import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="text-sm font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          px-4 py-3 rounded-xl border-2 transition-all outline-none text-sm
          ${error 
            ? 'border-red-500 focus:border-red-500' 
            : 'border-neutral-100 focus:border-accent'
          }
          bg-bg-card hover:bg-bg-card-hover focus:bg-white
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};
