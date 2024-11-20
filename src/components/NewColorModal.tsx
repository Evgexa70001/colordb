import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Plus, X, Search } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { normalizeHexColor } from '../utils/colorUtils';
import { UNCATEGORIZED } from '../lib/categories';
import { UNCATEGORIZEDS } from '../lib/groups';
import { colorSourceManager } from '../lib/colorSources/colorSourceManager';
import toast from 'react-hot-toast';
import type { NewColorModalProps } from '../types';

// Часто используемые материалы и анилоксы
const COMMON_MATERIALS = ['Пленка Белая', 'Бумага'];

const COMMON_ANILOX = ['800', '500', '350'];

interface Recipe {
  totalAmount: number;
  material: string;
  anilox?: string;
  comment?: string;
  items: {
    paint: string;
    amount: number;
  }[];
}

export default function NewColorModal({
  isOpen,
  onClose,
  onSave,
  categories,
  groups,
}: NewColorModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#');
  const [customers, setCustomers] = useState('');
  const [inStock, setInStock] = useState(true);
  const [category, setCategory] = useState('');
  const [group, setGroup] = useState('');
  const [notes, setNotes] = useState('');
  const [manager, setManager] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false);
  const [showAniloxSuggestions, setShowAniloxSuggestions] = useState(false);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);

  const resetForm = () => {
    setName('');
    setHex('#');
    setCustomers('');
    setInStock(true);
    setCategory('');
    setGroup('');
    setNotes('');
    setManager('');
    setRecipes([]);
  };

  const searchPantoneColor = async () => {
    if (!name.trim()) {
      toast.error('Введите код Pantone для поиска');
      return;
    }

    setIsSearching(true);
    try {
      const result = await colorSourceManager.getHexByCode(name);
      if (result.hex) {
        setHex(result.hex);
        toast.success(`Цвет найден в ${result.source}`);
      } else {
        toast.error(result.error || 'Цвет не найден');
      }
    } catch (error) {
      toast.error('Ошибка при поиске цвета');
    } finally {
      setIsSearching(false);
    }
  };

  const addRecipe = () => {
    setRecipes([
      ...recipes,
      {
        totalAmount: 0,
        material: '',
        items: [{ paint: '', amount: 0 }],
      },
    ]);
  };

  const removeRecipe = (index: number) => {
    setRecipes(recipes.filter((_, i) => i !== index));
  };

  const updateRecipe = (index: number, updates: Partial<Recipe>) => {
    setRecipes(recipes.map((recipe, i) => (i === index ? { ...recipe, ...updates } : recipe)));
  };

  const addRecipeItem = (recipeIndex: number) => {
    setRecipes(
      recipes.map((recipe, i) =>
        i === recipeIndex
          ? { ...recipe, items: [...recipe.items, { paint: '', amount: 0 }] }
          : recipe,
      ),
    );
  };

  const removeRecipeItem = (recipeIndex: number, itemIndex: number) => {
    setRecipes(
      recipes.map((recipe, i) =>
        i === recipeIndex
          ? { ...recipe, items: recipe.items.filter((_, j) => j !== itemIndex) }
          : recipe,
      ),
    );
  };

  const updateRecipeItem = (
    recipeIndex: number,
    itemIndex: number,
    updates: Partial<{ paint: string; amount: number }>,
  ) => {
    setRecipes(
      recipes.map((recipe, i) =>
        i === recipeIndex
          ? {
              ...recipe,
              items: recipe.items.map((item, j) =>
                j === itemIndex ? { ...item, ...updates } : item,
              ),
            }
          : recipe,
      ),
    );
  };

  const handleMaterialSelect = (material: string, recipeIndex: number) => {
    updateRecipe(recipeIndex, { material });
    setShowMaterialSuggestions(false);
  };

  const handleAniloxSelect = (anilox: string, recipeIndex: number) => {
    updateRecipe(recipeIndex, { anilox });
    setShowAniloxSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalHex = normalizeHexColor(hex.trim());

    const recipeString = recipes
      .map((recipe) => {
        const lines = [`Общее количество: ${recipe.totalAmount}`, `Материал: ${recipe.material}`];

        if (recipe.anilox) {
          lines.push(`Анилокс: ${recipe.anilox}`);
        }

        if (recipe.comment) {
          lines.push(`Комментарий: ${recipe.comment}`);
        }

        recipe.items
          .filter((item) => item.paint.trim() !== '' && item.amount > 0)
          .forEach((item) => {
            lines.push(`Краска: ${item.paint}, Количество: ${item.amount}`);
          });

        return lines.join('\n');
      })
      .join('\n\n');

    onSave({
      name: name.trim(),
      hex: finalHex,
      category: category || UNCATEGORIZED,
      group: group || UNCATEGORIZEDS,
      recipe: recipeString || undefined,
      customers: customers
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      inStock,
      notes: notes.trim() || undefined,
      manager: manager.trim() || undefined,
    });

    resetForm();
  };

  const inputClasses = `mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500'
      : 'border-gray-300 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  const suggestionClasses = `absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md py-1 text-sm`;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-4xl w-full rounded-lg p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } max-h-[90vh] overflow-y-auto custom-scrollbar`}>
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title
              className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              Добавить новый цвет
            </Dialog.Title>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="name" className={labelClasses}>
                    Название / Код Pantone
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClasses}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={searchPantoneColor}
                    disabled={isSearching}
                    className={`px-4 py-2 rounded-md ${
                      isDark
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}>
                    {isSearching ? 'Поиск...' : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label htmlFor="hex" className={labelClasses}>
                  HEX код
                </label>
                <input
                  type="text"
                  id="hex"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  required
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  className={inputClasses}
                />
              </div>
              <div
                className="w-10 h-10 rounded-md border shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: normalizeHexColor(hex),
                  borderColor: isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(209, 213, 219, 1)',
                }}
              />
            </div>

            <div>
              <label htmlFor="category" className={labelClasses}>
                Категория
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClasses}>
                <option value="">Без категории</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="group" className={labelClasses}>
                Группа
              </label>
              <select
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className={inputClasses}>
                <option value="">Без группы</option>
                {groups.map((gr) => (
                  <option key={gr} value={gr}>
                    {gr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="customers" className={labelClasses}>
                Клиенты (через запятую)
              </label>
              <input
                type="text"
                id="customers"
                value={customers}
                onChange={(e) => setCustomers(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="manager" className={labelClasses}>
                Менеджер
              </label>
              <input
                type="text"
                id="manager"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor="notes" className={labelClasses}>
                Заметки
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={inputClasses}
              />
            </div>

            <div>
              <label className={labelClasses}>Рецепты</label>
              <div className="mt-2 space-y-4">
                {recipes.map((recipe, recipeIndex) => (
                  <div
                    key={recipeIndex}
                    className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Рецепт {recipeIndex + 1}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeRecipe(recipeIndex)}
                        className={`p-1 rounded-full ${
                          isDark
                            ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
                            : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                        }`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                          <label className={`${labelClasses} text-xs`}>Материал</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={recipe.material}
                              onChange={(e) => {
                                updateRecipe(recipeIndex, {
                                  material: e.target.value,
                                });
                                setSelectedRecipeIndex(recipeIndex);
                                setShowMaterialSuggestions(true);
                              }}
                              onFocus={() => {
                                setSelectedRecipeIndex(recipeIndex);
                                setShowMaterialSuggestions(true);
                              }}
                              className={inputClasses}
                            />
                            {showMaterialSuggestions && selectedRecipeIndex === recipeIndex && (
                              <div className={suggestionClasses}>
                                {COMMON_MATERIALS.map((material) => (
                                  <button
                                    key={material}
                                    type="button"
                                    className={`block w-full text-left px-4 py-2 ${
                                      isDark
                                        ? 'hover:bg-gray-600 text-gray-200'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                    onClick={() => handleMaterialSelect(material, recipeIndex)}>
                                    {material}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <label className={`${labelClasses} text-xs`}>Анилокс</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={recipe.anilox || ''}
                              onChange={(e) => {
                                updateRecipe(recipeIndex, {
                                  anilox: e.target.value,
                                });
                                setSelectedRecipeIndex(recipeIndex);
                                setShowAniloxSuggestions(true);
                              }}
                              onFocus={() => {
                                setSelectedRecipeIndex(recipeIndex);
                                setShowAniloxSuggestions(true);
                              }}
                              className={inputClasses}
                            />
                            {showAniloxSuggestions && selectedRecipeIndex === recipeIndex && (
                              <div className={suggestionClasses}>
                                {COMMON_ANILOX.map((anilox) => (
                                  <button
                                    key={anilox}
                                    type="button"
                                    className={`block w-full text-left px-4 py-2 ${
                                      isDark
                                        ? 'hover:bg-gray-600 text-gray-200'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                    onClick={() => handleAniloxSelect(anilox, recipeIndex)}>
                                    {anilox}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className={`${labelClasses} text-xs`}>Общее количество (гр.)</label>
                        <input
                          type="number"
                          value={recipe.totalAmount}
                          onChange={(e) =>
                            updateRecipe(recipeIndex, {
                              totalAmount: parseInt(e.target.value),
                            })
                          }
                          min="0"
                          className={inputClasses}
                        />
                      </div>

                      <div>
                        <label className={`${labelClasses} text-xs`}>Комментарий</label>
                        <input
                          type="text"
                          value={recipe.comment || ''}
                          onChange={(e) =>
                            updateRecipe(recipeIndex, {
                              comment: e.target.value,
                            })
                          }
                          className={inputClasses}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`${labelClasses} text-xs`}>Компоненты</label>
                        {recipe.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`p-4 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className={`${labelClasses} text-xs`}>Название краски</label>
                                <input
                                  type="text"
                                  value={item.paint}
                                  onChange={(e) =>
                                    updateRecipeItem(recipeIndex, itemIndex, {
                                      paint: e.target.value,
                                    })
                                  }
                                  className={inputClasses}
                                />
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className={`${labelClasses} text-xs`}>
                                    Количество (гр.)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) =>
                                      updateRecipeItem(recipeIndex, itemIndex, {
                                        amount: parseInt(e.target.value),
                                      })
                                    }
                                    min="0"
                                    className={inputClasses}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRecipeItem(recipeIndex, itemIndex)}
                                  className={`self-end p-3 rounded-md ${
                                    isDark
                                      ? 'hover:bg-gray-500 text-gray-400 hover:text-gray-300'
                                      : 'hover:bg-gray-300 text-gray-500 hover:text-gray-700'
                                  }`}>
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addRecipeItem(recipeIndex)}
                          className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-md text-sm w-full justify-center ${
                            isDark
                              ? 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}>
                          <Plus className="w-4 h-4" />
                          <span>Добавить компонент</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecipe}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md w-full justify-center ${
                    isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                  <Plus className="w-4 h-4" />
                  <span>Добавить рецепт</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className={`rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
              />
              <label htmlFor="inStock" className={`ml-2 ${labelClasses}`}>
                В наличии
              </label>
            </div>

            <div className="flex justify-end space-x-3">
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
                Сохранить
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
