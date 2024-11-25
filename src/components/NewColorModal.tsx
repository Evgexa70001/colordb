import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Plus, X, Search, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { normalizeHexColor } from '../utils/colorUtils';
import { UNCATEGORIZED } from '../lib/categories';
// import { UNCATEGORIZEDS } from '../lib/groups'
// import { colorSourceManager } from '../lib/colorSources/colorSourceManager'
import toast from 'react-hot-toast';
import type { NewColorModalProps } from '../types';
import { getPantoneHex } from '../lib/colorSources/pantoneParser';

// Часто используемые материалы и анилоксы
const COMMON_MATERIALS = ['Пленка Белая', 'Бумага'];

const COMMON_ANILOX = ['800', '500', '350'];

const COMMON_PAINTS = ['M', 'Y', 'C', 'K', 'Tr.W'];

const baseClasses = {
  input: `block w-full rounded-md shadow-sm transition-colors duration-200 ease-in-out`,
  button: `transition-colors duration-200 ease-in-out rounded-md font-medium w-full flex items-center justify-center gap-2`,
  panel: `mx-auto max-w-4xl w-full rounded-lg p-6 shadow-xl transition-colors duration-200 max-h-[90vh] overflow-y-auto`,
};

// Обновленные темные/светлые варианты
const themeClasses = {
  input: {
    light:
      'border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
    dark: 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
  },
  button: {
    primary: {
      light: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
      dark: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    },
    secondary: {
      light: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
      dark: 'bg-gray-600 text-gray-100 hover:bg-gray-500 active:bg-gray-400',
    },
  },
  recipe: {
    light: 'bg-white border border-gray-200',
    dark: 'bg-gray-700 border border-gray-600',
  },
  suggestions: {
    container: {
      light: 'bg-white border border-gray-200 shadow-lg',
      dark: 'bg-gray-700 border border-gray-600 shadow-lg',
    },
    item: {
      light: 'text-gray-700 hover:bg-gray-100',
      dark: 'text-gray-200 hover:bg-gray-600',
    },
  },
};

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
  existingCustomers,
}: NewColorModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [alternativeName, setAlternativeName] = useState('');
  const [hex, setHex] = useState('#');
  const [customers, setCustomers] = useState('');
  const [inStock, setInStock] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [manager, setManager] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false);
  const [showAniloxSuggestions, setShowAniloxSuggestions] = useState(false);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);
  const [showPaintSuggestions, setShowPaintSuggestions] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const resetForm = () => {
    setName('');
    setAlternativeName('');
    setHex('#');
    setCustomers('');
    setInStock(false);
    setIsVerified(false);
    setCategory('');
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
      const pantoneCode = name.trim().toUpperCase().replace('P', '');
      const hex = await getPantoneHex(pantoneCode);

      if (hex) {
        setHex(hex);
        toast.success('Цвет найден');
      } else {
        toast.error('Цвет не найден');
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

  const handlePaintSelect = (paint: string, recipeIndex: number, itemIndex: number) => {
    updateRecipeItem(recipeIndex, itemIndex, { paint });
    setShowPaintSuggestions(false);
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
      alternativeName: alternativeName.trim() || undefined,
      hex: finalHex,
      category: category || UNCATEGORIZED,
      recipe: recipeString || undefined,
      customers: customers
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      inStock,
      isVerified,
      notes: notes.trim() || undefined,
      manager: manager.trim() || undefined,
    });

    resetForm();
  };

  const inputClasses = `${baseClasses.input} ${
    isDark ? themeClasses.input.dark : themeClasses.input.light
  }`;

  const primaryButtonClasses = `${baseClasses.button} ${
    isDark ? themeClasses.button.primary.dark : themeClasses.button.primary.light
  } px-4 py-2 text-sm`;

  const secondaryButtonClasses = `${baseClasses.button} ${
    isDark ? themeClasses.button.secondary.dark : themeClasses.button.secondary.light
  } px-4 py-2 text-sm`;

  // Обновленные классы для рецептов
  const recipeClasses = `p-4 rounded-lg mb-4 ${
    isDark ? themeClasses.recipe.dark : themeClasses.recipe.light
  }`;

  const labelClasses = `block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  const suggestionClasses = `absolute z-50 mt-1 w-full rounded-md shadow-lg max-h-60 overflow-auto focus:outline-none ${
    isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
  }`;

  const suggestionItemClasses = `block w-full px-4 py-2 text-sm cursor-pointer text-left ${
    isDark
      ? 'text-gray-200 hover:bg-gray-600 focus:bg-gray-600'
      : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
  }`;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('customer-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`${baseClasses.panel} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
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
                    Название
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
                <div>
                  <label htmlFor="alternativeName" className={labelClasses}>
                    Альтернативное название
                  </label>
                  <input
                    type="text"
                    id="alternativeName"
                    value={alternativeName}
                    onChange={(e) => setAlternativeName(e.target.value)}
                    className={inputClasses}
                    placeholder="Необязательное поле"
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
              <label htmlFor="customers" className={labelClasses}>
                Клиенты
              </label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      id="customers"
                      value={customers}
                      onChange={(e) => setCustomers(e.target.value)}
                      placeholder="Введите имя заказчика"
                      className={`${inputClasses} rounded-r-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                      className={`absolute right-0 top-0 bottom-0 px-2 flex items-center ${
                        isDark
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 
                        ${isCustomerDropdownOpen ? 'transform rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {isCustomerDropdownOpen && (
                  <div
                    className={`absolute z-50 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-auto ${
                      isDark
                        ? 'bg-gray-800 border border-gray-700'
                        : 'bg-white border border-gray-200'
                    }`}>
                    {existingCustomers.map((customer) => (
                      <button
                        key={customer}
                        type="button"
                        onClick={() => {
                          const currentCustomers = customers
                            .split(',')
                            .map((c) => c.trim())
                            .filter(Boolean);

                          if (!currentCustomers.includes(customer)) {
                            const newCustomers = [...currentCustomers, customer];
                            setCustomers(newCustomers.join(', '));
                          }
                          setIsCustomerDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          isDark
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}>
                        {customer}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              <div className={recipeClasses}>
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
                          <div className="relative flex">
                            <input
                              type="text"
                              value={recipe.material}
                              onChange={(e) => {
                                updateRecipe(recipeIndex, {
                                  material: e.target.value,
                                });
                                setSelectedRecipeIndex(recipeIndex);
                              }}
                              className={`${inputClasses} rounded-r-none`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipeIndex(recipeIndex);
                                setShowMaterialSuggestions(!showMaterialSuggestions);
                                setShowAniloxSuggestions(false);
                                setShowPaintSuggestions(false);
                              }}
                              className={`px-2 border-l-0 rounded-l-none rounded-r-md ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-gray-400 hover:text-gray-300'
                                  : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
                              } border`}>
                              <ChevronDown
                                className={`w-4 h-4 transform transition-transform duration-200 ${
                                  showMaterialSuggestions && selectedRecipeIndex === recipeIndex
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>
                          </div>
                          {showMaterialSuggestions && selectedRecipeIndex === recipeIndex && (
                            <div className={suggestionClasses}>
                              <div className="py-1">
                                {COMMON_MATERIALS.map((material) => (
                                  <button
                                    key={material}
                                    type="button"
                                    className={suggestionItemClasses}
                                    onClick={() => handleMaterialSelect(material, recipeIndex)}>
                                    {material}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <label className={`${labelClasses} text-xs`}>Анилокс</label>
                          <div className="relative flex">
                            <input
                              type="text"
                              value={recipe.anilox || ''}
                              onChange={(e) => {
                                updateRecipe(recipeIndex, {
                                  anilox: e.target.value,
                                });
                                setSelectedRecipeIndex(recipeIndex);
                              }}
                              className={`${inputClasses} rounded-r-none`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipeIndex(recipeIndex);
                                setShowAniloxSuggestions(!showAniloxSuggestions);
                                setShowMaterialSuggestions(false);
                                setShowPaintSuggestions(false);
                              }}
                              className={`px-2 border-l-0 rounded-l-none rounded-r-md ${
                                isDark
                                  ? 'bg-gray-700 border-gray-600 text-gray-400 hover:text-gray-300'
                                  : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
                              } border`}>
                              <ChevronDown
                                className={`w-4 h-4 transform transition-transform duration-200 ${
                                  showAniloxSuggestions && selectedRecipeIndex === recipeIndex
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>
                          </div>
                          {showAniloxSuggestions && selectedRecipeIndex === recipeIndex && (
                            <div className={suggestionClasses}>
                              <div className="py-1">
                                {COMMON_ANILOX.map((anilox) => (
                                  <button
                                    key={anilox}
                                    type="button"
                                    className={suggestionItemClasses}
                                    onClick={() => handleAniloxSelect(anilox, recipeIndex)}>
                                    {anilox}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
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
                            className={`p-4 rounded-lg ${
                              isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'
                            }`}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <label className={`${labelClasses} text-xs`}>Название краски</label>
                                <div className="relative">
                                  <div className="flex">
                                    <input
                                      type="text"
                                      value={item.paint}
                                      onChange={(e) =>
                                        updateRecipeItem(recipeIndex, itemIndex, {
                                          paint: e.target.value,
                                        })
                                      }
                                      className={`${inputClasses} rounded-r-none`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRecipeIndex(recipeIndex);
                                        setSelectedItemIndex(itemIndex);
                                        setShowPaintSuggestions(!showPaintSuggestions);
                                        setShowMaterialSuggestions(false);
                                        setShowAniloxSuggestions(false);
                                      }}
                                      className={`px-2 border-l-0 rounded-l-none rounded-r-md ${
                                        isDark
                                          ? 'bg-gray-700 border-gray-600 text-gray-400 hover:text-gray-300'
                                          : 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
                                      } border`}>
                                      <ChevronDown
                                        className={`w-4 h-4 transform transition-transform duration-200 ${
                                          showPaintSuggestions &&
                                          selectedRecipeIndex === recipeIndex &&
                                          selectedItemIndex === itemIndex
                                            ? 'rotate-180'
                                            : ''
                                        }`}
                                      />
                                    </button>
                                  </div>
                                  {showPaintSuggestions &&
                                    selectedRecipeIndex === recipeIndex &&
                                    selectedItemIndex === itemIndex && (
                                      <div className={suggestionClasses}>
                                        <div className="py-1">
                                          {COMMON_PAINTS.map((paint) => (
                                            <button
                                              key={paint}
                                              type="button"
                                              className={suggestionItemClasses}
                                              onClick={() =>
                                                handlePaintSelect(paint, recipeIndex, itemIndex)
                                              }>
                                              {paint}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div className="w-full sm:w-32">
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
                                className={`self-end p-2.5 rounded-md ${
                                  isDark
                                    ? 'hover:bg-gray-500 text-gray-400 hover:text-gray-300'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}>
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addRecipeItem(recipeIndex)}
                          className={primaryButtonClasses}>
                          <Plus className="w-4 h-4" />
                          <span>Добавить компонент</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addRecipe} className={secondaryButtonClasses}>
                  <Plus className="w-4 h-4" />
                  <span>Добавить рецепт</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                  className={`rounded ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                  }`}
                />
                <label htmlFor="inStock" className={`ml-2 ${labelClasses}`}>
                  В наличии
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVerified"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className={`rounded ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
                  }`}
                />
                <label htmlFor="isVerified" className={`ml-2 ${labelClasses}`}>
                  Проверен
                </label>
              </div>
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
