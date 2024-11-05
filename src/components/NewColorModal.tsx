import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useTheme } from '../contexts/ThemeContext';
import { normalizeHexColor } from '../utils/colorUtils';
import { UNCATEGORIZED } from '../lib/categories';
import type { NewColorModalProps } from '../types';

export default function NewColorModal({ isOpen, onClose, onSave, categories }: NewColorModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#');
  const [category, setCategory] = useState('');
  const [recipe, setRecipe] = useState('');
  const [customers, setCustomers] = useState('');
  const [inStock, setInStock] = useState(true);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newColor = {
      name: name.trim(),
      hex: normalizeHexColor(hex.trim()),
      category: category || UNCATEGORIZED,
      recipe: recipe.trim() || null,
      customers: customers
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      inStock,
      notes: notes.trim() || null,
    };

    onSave(newColor);
    onClose();
    setName('');
    setHex('#');
    setCategory('');
    setRecipe('');
    setCustomers('');
    setInStock(true);
    setNotes('');
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
            Add New Color
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClasses}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>HEX Color</label>
              <div className="mt-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  pattern="^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$"
                  required
                  className={inputClasses}
                />
                <div
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: normalizeHexColor(hex) }}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClasses}>
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClasses}>Recipe</label>
              <textarea
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
                className={inputClasses}
                rows={3}
              />
            </div>

            <div>
              <label className={labelClasses}>Customers (comma separated)</label>
              <input
                type="text"
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClasses}
                rows={3}
                placeholder="Add additional notes here..."
              />
            </div>

            <div>
              <label className={labelClasses}>Stock Status</label>
              <select
                value={inStock.toString()}
                onChange={(e) => setInStock(e.target.value === 'true')}
                className={inputClasses}>
                <option value="true">In Stock</option>
                <option value="false">Out of Stock</option>
              </select>
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
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                Add
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
