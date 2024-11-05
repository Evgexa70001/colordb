import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useTheme } from '../contexts/ThemeContext';
import type { NewCategoryModalProps } from '../types';

export default function NewCategoryModal({
  isOpen,
  onClose,
  onSave,
  existingCategories,
}: NewCategoryModalProps) {
  const { isDark } = useTheme();
  const [category, setCategory] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingCategories.includes(category)) {
      alert('Такая категория уже существует');
      return;
    }
    onSave(category);
    onClose();
    setCategory('');
  };

  const inputClasses = `mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500'
      : 'border-gray-300 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-lg w-full rounded-lg p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
          <Dialog.Title
            className={`text-lg font-medium mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            Добавить новую категорию
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClasses}>Название категории</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputClasses}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Добавить
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
