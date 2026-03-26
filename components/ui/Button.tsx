import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'violet' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  type = 'button'
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-accent text-black border-2 border-accent hover:bg-accent-dark hover:border-accent-dark hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(0,230,118,0.5)] active:scale-95",
    secondary: "bg-transparent text-foreground border-2 border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 hover:-translate-y-0.5 active:scale-95",
    dark: "bg-black text-white border-2 border-black hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-xl active:scale-95",
    violet: "bg-violet text-white border-2 border-violet hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(124,58,237,0.5)] active:scale-95",
    outline: "bg-transparent text-neutral-600 border-2 border-neutral-100 hover:border-neutral-300 hover:text-neutral-900 active:scale-95"
  };

  const sizes = {
    sm: "px-5 py-2 text-xs",
    md: "px-7 py-3 text-sm",
    lg: "px-9 py-4 text-base"
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button 
      type={type}
      className={combinedClasses} 
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  );
};
