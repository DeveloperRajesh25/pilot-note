import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'violet' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

export const Button = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  type = 'button',
  title,
}: ButtonProps) => {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-medium rounded-full overflow-hidden transition-[transform,background-color,color,border-color,box-shadow] duration-300 ease-out active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none cursor-pointer';

  const variants = {
    // Default — solid black, white text. Hover: emerald glow ring + slight lift.
    primary:
      'bg-neutral-900 text-white border border-neutral-900 hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(16,185,129,0.45),0_8px_20px_-8px_rgba(10,10,10,0.35)] hover:ring-1 hover:ring-emerald-400/40',

    // Light outlined — white bg, black border. Hover: invert to black bg.
    secondary:
      'bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:-translate-y-0.5',

    // Alias for primary
    dark:
      'bg-neutral-900 text-white border border-neutral-900 hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(10,10,10,0.4)]',

    // Highlight / "go" variant — emerald
    violet:
      'bg-emerald-500 text-white border border-emerald-500 hover:bg-emerald-600 hover:border-emerald-600 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-12px_rgba(16,185,129,0.6)]',

    // Subtle outline
    outline:
      'bg-transparent text-neutral-700 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900',

    // Ghost text-only
    ghost:
      'bg-transparent text-neutral-700 border border-transparent hover:text-neutral-900 hover:bg-neutral-100',
  } as const;

  const sizes = {
    sm: 'px-4 py-2 text-xs tracking-wide',
    md: 'px-6 py-3 text-sm tracking-wide',
    lg: 'px-8 py-4 text-[15px] tracking-wide',
  } as const;

  const combined = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combined} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={combined} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
};
