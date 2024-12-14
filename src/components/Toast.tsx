import { Toaster } from 'react-hot-toast';
import { useTheme } from '@contexts/ThemeContext';

export default function Toast() {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: isDark ? '!bg-gray-800 !text-white' : '',
        duration: 3000,
        style: {
          background: isDark ? '#1f2937' : '#fff',
          color: isDark ? '#fff' : '#000',
        },
      }}
    />
  );
}
