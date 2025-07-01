import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useTheme } from '@contexts/ThemeContext';
import type { NewCategoryModalProps } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
              <Input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                label="Название категории"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="secondary" type="button" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit">Добавить</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
