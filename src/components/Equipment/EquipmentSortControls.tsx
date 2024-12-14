import { useTheme } from '@contexts/ThemeContext';

type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface SortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

export default function EquipmentSortControls({
  sortField,
  sortOrder,
  onSortChange,
}: SortControlsProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col">
      <button
        onClick={() => onSortChange('name')}
        className={`flex items-center justify-between w-full px-4 py-2 ${
          sortField === 'name'
            ? isDark
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-blue-50 text-blue-600'
            : isDark
            ? 'text-gray-400 hover:bg-gray-700/50'
            : 'text-gray-600 hover:bg-gray-100'
        }`}>
        <span>По названию</span>
        {sortField === 'name' && (
          <svg
            className={`w-5 h-5 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>

      <button
        onClick={() => onSortChange('createdAt')}
        className={`flex items-center justify-between w-full px-4 py-2 ${
          sortField === 'createdAt'
            ? isDark
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-blue-50 text-blue-600'
            : isDark
            ? 'text-gray-400 hover:bg-gray-700/50'
            : 'text-gray-600 hover:bg-gray-100'
        }`}>
        <span>По дате создания</span>
        {sortField === 'createdAt' && (
          <svg
            className={`w-5 h-5 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </button>
    </div>
  );
}
