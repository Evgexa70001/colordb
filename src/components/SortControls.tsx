import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

type SortField = 'name' | 'inStock';
type SortOrder = 'asc' | 'desc';

interface SortControlsProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
}

export default function SortControls({ sortField, sortOrder, onSortChange }: SortControlsProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSortChange('name')}
        className={`px-3 py-1.5 rounded flex items-center gap-1 text-sm ${
          sortField === 'name'
            ? isDark
              ? 'bg-blue-900 text-blue-100'
              : 'bg-blue-100 text-blue-700'
            : isDark
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}>
        <span>Название</span>
        <ArrowUpDown
          className={`w-4 h-4 ${sortField === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`}
        />
      </button>
      <button
        onClick={() => onSortChange('inStock')}
        className={`px-3 py-1.5 rounded flex items-center gap-1 text-sm ${
          sortField === 'inStock'
            ? isDark
              ? 'bg-blue-900 text-blue-100'
              : 'bg-blue-100 text-blue-700'
            : isDark
            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}>
        <span>В наличии</span>
        <ArrowUpDown
          className={`w-4 h-4 ${
            sortField === 'inStock' && sortOrder === 'desc' ? 'rotate-180' : ''
          }`}
        />
      </button>
    </div>
  );
}
