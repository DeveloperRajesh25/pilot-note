import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
}

export const Input = ({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}: InputProps) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.14em]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          px-4 py-3.5 rounded-xl border transition-all outline-none text-sm font-medium
          bg-white text-neutral-900 placeholder:text-neutral-400
          ${error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
            : 'border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-100'
          }
        `}
        {...props}
      />
      {hint && !error && <p className="text-[11px] text-neutral-400">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
};
