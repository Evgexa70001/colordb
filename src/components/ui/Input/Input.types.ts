export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  type?: 'text' | 'number' | 'checkbox' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  rows?: number | string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
}
