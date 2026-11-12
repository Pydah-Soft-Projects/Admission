import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  /** Smaller padding and label — for dense forms (e.g. joining edit). */
  compact?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className,
  id,
  icon,
  rightElement,
  compact = false,
  ...props
}) => {
  const inputId = id || `input-${props.name}`;

  return (
    <div className={cn('w-full', compact ? 'space-y-1' : 'space-y-1.5')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ml-1',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          {label}
        </label>
      )}
      <div className="relative group">
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border text-slate-900',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 rounded-xl',
            'placeholder:text-slate-400',
            'focus:outline-none focus:border-[var(--primary,#ea580c)] focus:ring-4 focus:ring-[var(--primary-light,#fff7ed)]',
            'transition-all duration-200',
            'hover:border-[var(--primary,#ea580c)]/60',
            'dark:text-slate-100 dark:placeholder:text-slate-500',
            error && 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-100 dark:border-red-800 dark:text-red-100 dark:focus:ring-red-900/20',
            icon && 'pl-11',
            rightElement && 'pr-11',
            className
          )}
          style={{
            backgroundColor: 'var(--surface, #ffffff)',
            borderColor: 'var(--border-strong, #cbd5e1)',
            color: 'var(--text-primary, #0f172a)',
          }}
          {...props}
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[var(--primary,#ea580c)] dark:text-slate-500">
            {icon}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400 ml-1 animate-in slide-in-from-left-1 fade-in duration-200">
          {error}
        </p>
      )}
    </div>
  );
};
