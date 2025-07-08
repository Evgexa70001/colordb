export const styles = {
  base: {
    wrapper: 'flex flex-col gap-1.5',
    label: 'text-sm font-medium',
    input: 'w-full rounded-md transition-colors duration-200',
    checkbox: 'h-4 w-4 rounded transition-colors duration-200 cursor-pointer',
  },
  theme: {
    dark: {
      label: 'text-gray-200',
      input:
        'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
      error: 'text-red-400',
      checkbox:
        'bg-gray-700 border-gray-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800',
    },
    light: {
      label: 'text-gray-700',
      input:
        'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
      error: 'text-red-500',
      checkbox: 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500',
    },
  },
  states: {
    withRightElement: 'pr-10',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
  },
};
