import React from 'react';
import { cn } from '@/utils/cn';
import { ButtonProps } from './Button.types';
import { buttonVariants } from './Button.styles';

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      justified = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          isLoading && 'opacity-70 cursor-not-allowed',
          className,
        )}
        disabled={isLoading || props.disabled}
        {...props}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Загрузка...
          </span>
        ) : (
          <span
            className={cn(
              'flex items-center w-full',
              justified ? 'justify-between' : 'justify-center gap-2',
            )}>
            <span className="flex items-center gap-2">
              {leftIcon && <span className="w-4 h-4">{leftIcon}</span>}
              {children}
            </span>
            {rightIcon && <span className="w-4 h-4">{rightIcon}</span>}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
