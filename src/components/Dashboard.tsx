import React, { useState, useEffect } from 'react';
import { Sun, Moon, Plus, FolderPlus, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ColorCard from './ColorCard';
import NewColorModal from './NewColorModal';
import EditColorModal from './EditColorModal';
import ColorDetailsModal from './ColorDetailsModal';
import NewCategoryModal from './NewCategoryModal';
import SortControls from './SortControls';
import { getColors, saveColor, updateColor, deleteColor } from '../lib/colors';
import { getCategories, addCategory, deleteCategory } from '../lib/categories';
import { getColorDistance, isValidHexColor } from '../utils/colorUtils';
import type { PantoneColor } from '../types';

type SortField = 'name' | 'inStock';
type SortOrder = 'asc' | 'desc';

const SIMILAR_COLOR_THRESHOLD = 8; // Delta E threshold for similar colors

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [colors, setColors] = useState<PantoneColor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null);
  const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedColors, fetchedCategories] = await Promise.all([getColors(), getCategories()]);
      setColors(fetchedColors);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSimilarColors = (targetColor: PantoneColor): PantoneColor[] => {
    if (!isValidHexColor(targetColor.hex)) return [];

    return colors
      .filter((color) => color.id !== targetColor.id && isValidHexColor(color.hex))
      .map((color) => {
        const distance = getColorDistance(targetColor.hex, color.hex);
        return { ...color, distance };
      })
      .filter((color) => (color.distance || 0) <= SIMILAR_COLOR_THRESHOLD)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 6);
  };

  const handleSaveNewColor = async (newColor: Omit<PantoneColor, 'id'>) => {
    try {
      await saveColor(newColor);
      await loadData();
      setIsNewColorModalOpen(false);
    } catch (error) {
      console.error('Error saving color:', error);
      alert('Failed to save color');
    }
  };

  const handleUpdateColor = async (updatedColor: PantoneColor) => {
    try {
      await updateColor(updatedColor);
      await loadData();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating color:', error);
      alert('Failed to update color');
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    try {
      await deleteColor(colorId);
      await loadData();
    } catch (error) {
      console.error('Error deleting color:', error);
      alert('Failed to delete color');
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      await addCategory(categoryName);
      await loadData();
      setIsNewCategoryModalOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    try {
      await deleteCategory(categoryName);
      await loadData();
      if (selectedCategory === categoryName) {
        setSelectedCategory('all');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const filteredColors = colors
    .filter((color) => {
      const matchesSearch =
        color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        color.hex.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc'
          ? Number(b.inStock) - Number(a.inStock)
          : Number(a.inStock) - Number(b.inStock);
      }
    });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`py-4 px-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Pantone Color Manager
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => signOut()}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsNewColorModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              Создать цвет
            </button>
            <button
              onClick={() => setIsNewCategoryModalOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
              <FolderPlus className="w-4 h-4" />
              Создать категорию
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`rounded-md border-gray-300 pr-10 ${
                  isDark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-900'
                }`}>
                <option value="all">Все категории</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Вы уверены, что хотите удалить категорию "${selectedCategory}"? Это действие необратимо.`,
                      )
                    ) {
                      handleDeleteCategory(selectedCategory);
                    }
                  }}
                  className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Trash2
                    className={`w-4 h-4 ${
                      isDark ? 'text-red-400' : 'text-red-500'
                    } hover:text-red-600`}
                  />
                </button>
              )}
            </div>

            <SortControls
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Поиск цветов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg ${
              isDark
                ? 'bg-gray-700 text-gray-200 placeholder-gray-400 border-gray-600'
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColors.map((color) => (
            <ColorCard
              key={color.id}
              color={color}
              onEdit={() => {
                setSelectedColor(color);
                setIsEditModalOpen(true);
              }}
              onClick={() => {
                setSelectedColor(color);
                setIsDetailsModalOpen(true);
              }}
              onDelete={() => handleDeleteColor(color.id)}
            />
          ))}
        </div>

        {selectedColor && (
          <>
            <EditColorModal
              color={selectedColor}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedColor(null);
              }}
              onSave={handleUpdateColor}
              categories={categories}
            />

            <ColorDetailsModal
              color={selectedColor}
              isOpen={isDetailsModalOpen}
              onClose={() => {
                setIsDetailsModalOpen(false);
                setSelectedColor(null);
              }}
              similarColors={getSimilarColors(selectedColor)}
            />
          </>
        )}

        <NewColorModal
          isOpen={isNewColorModalOpen}
          onClose={() => setIsNewColorModalOpen(false)}
          onSave={handleSaveNewColor}
          categories={categories}
        />

        <NewCategoryModal
          isOpen={isNewCategoryModalOpen}
          onClose={() => setIsNewCategoryModalOpen(false)}
          onSave={handleAddCategory}
          existingCategories={categories}
        />
      </main>
    </div>
  );
}
