import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  description?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  style,
  title,
  description,
  onClick,
  noPadding = false
}) => {
  return (
    <div
      className={cn(
        'group relative rounded-2xl border shadow-sm transition-all duration-300',
        'hover:shadow-md',
        'bg-[var(--surface,#ffffff)] border-[var(--border,#e2e8f0)] text-[var(--text-primary,#0f172a)]',
        noPadding ? 'p-0' : 'p-6 sm:p-8',
        onClick ? 'cursor-pointer hover:scale-[1.01]' : '',
        className
      )}
      style={style}
      onClick={onClick}
    >
      {(title || description) && (
        <div className={cn("mb-6 space-y-1.5", noPadding && "px-6 pt-6 sm:px-8 sm:pt-8")}>
          {title && (
            <h3 
              className="text-xl font-bold text-[var(--text-primary,#0f172a)]"
            >
              {title}
            </h3>
          )}
          {description && (
            <p 
              className="text-sm font-medium text-[var(--text-secondary,#64748b)]"
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
