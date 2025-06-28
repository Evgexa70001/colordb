import React from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { InputProps } from './Input.types';
import { styles } from './Input.styles';

export const Input = React.forwardRef<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  InputProps
>(({ label, error, rightElement, className = '', ...props }, ref) => {
  const { isDark } = useTheme();
  const theme = isDark ? styles.theme.dark : styles.theme.light;

  return (
    <div className={styles.base.wrapper}>
      {props.type === 'checkbox' ? (
        <div className="flex items-center gap-2">
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type="checkbox"
            className={`
              ${styles.base.checkbox}
              ${theme.checkbox}
              ${error ? styles.states.error : ''}
            `}
            {...props}
          />
          {label && (
            <label
              htmlFor={props.id}
              className={`${styles.base.label} ${theme.label} cursor-pointer`}>
              {label}
            </label>
          )}
        </div>
      ) : (
        <>
          {label && <label className={`${styles.base.label} ${theme.label}`}>{label}</label>}
          <div className="relative">
            {props.type === 'select' ? (
              <select
                ref={ref as React.Ref<HTMLSelectElement>}
                className={`${styles.base.input} ${theme.input} ${className}`}
                value={props.value}
                onChange={props.onChange}>
                {props.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : props.type === 'textarea' ? (
              <textarea
                ref={ref as React.Ref<HTMLTextAreaElement>}
                className={`${styles.base.input} ${theme.input} ${className}`}
                rows={props.rows ? Number(props.rows) : undefined}
                value={props.value}
                onChange={props.onChange}
              />
            ) : (
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                className={`
                    ${styles.base.input}
                    ${theme.input}
                    ${rightElement ? styles.states.withRightElement : ''}
                    ${error ? styles.states.error : ''}
                    ${className}
                  `}
                {...props}
              />
            )}
            {rightElement && <div className="absolute inset-y-0 right-0">{rightElement}</div>}
          </div>
        </>
      )}
      {error && <span className={`text-sm ${theme.error}`}>{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';
