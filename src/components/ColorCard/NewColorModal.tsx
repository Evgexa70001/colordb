import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { normalizeHexColor } from '@utils/colorUtils';
import { UNCATEGORIZED } from '@lib/categories';

import type { ColorData } from '@/types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown/Dropdown';

// Часто используемые материалы и анилоксы
const COMMON_MATERIALS = ['Пленка Белая', 'Бумага'];

const COMMON_PAINTS = ['M', 'Y', 'C', 'K', 'Tr.W'];

const baseClasses = {
  input: `block w-full rounded-md shadow-sm transition-colors duration-200 ease-in-out`,
  button: `transition-colors duration-200 ease-in-out rounded-md font-medium w-full flex items-center justify-center gap-2`,
  panel: `mx-auto max-w-4xl w-full rounded-lg p-6 shadow-xl transition-colors duration-200 max-h-[90vh] overflow-y-auto`,
};

// Обновленны темные/светлые варианты
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
  comment?: string;
  items: {
    paint: string;
    amount: number;
  }[];
}

// Обновляем интерфейс пропсов
interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: ColorData) => void;
  categories: string[];
  existingCustomers: string[];
  initialData?: ColorData; // Добавляем опциональные начальные данные
}

export default function NewColorModal({
  isOpen,
  onClose,
  onSave,
  categories,
  existingCustomers,
  initialData, // Добавляем в параметры
}: ColorModalProps) {
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
    // setShowMaterialSuggestions(false);
  };

  const handlePaintSelect = (paint: string, recipeIndex: number, itemIndex: number) => {
    updateRecipeItem(recipeIndex, itemIndex, { paint });
    // setShowPaintSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalHex = normalizeHexColor(hex.trim());

    const recipeString = recipes
      .map((recipe) => {
        const lines = [`Общее количество: ${recipe.totalAmount}`, `Материал: ${recipe.material}`];

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

  // Обновленные классы для рецептов
  const recipeClasses = `p-4 rounded-lg mb-4 ${
    isDark ? themeClasses.recipe.dark : themeClasses.recipe.light
  }`;

  const labelClasses = `block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

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

  // Обновляем useEffect для инициализации формы
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Если есть начальные данные, заполняем форму
        setName(initialData.name);
        setAlternativeName(initialData.alternativeName || '');
        setHex(initialData.hex);
        setCustomers(initialData.customers?.join(', ') || '');
        setInStock(initialData.inStock);
        setIsVerified(initialData.isVerified || false);
        setCategory(initialData.category === UNCATEGORIZED ? '' : initialData.category);
        setNotes(initialData.notes || '');
        setManager(initialData.manager || '');

        // Парсим рецепты если они есть
        if (initialData.recipe) {
          const lines = initialData.recipe.split('\n');
          const parsedRecipes: Recipe[] = [];
          let currentRecipe: Recipe | null = null;

          lines.forEach((line: string) => {
            const totalAmountMatch = line.match(/^Общее количество: (\d+)/);
            const materialMatch = line.match(/^Материал: (.+)/);
            const commentMatch = line.match(/^Комментарий: (.+)/);
            const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/);

            if (totalAmountMatch) {
              if (currentRecipe) {
                parsedRecipes.push(currentRecipe);
              }
              currentRecipe = {
                totalAmount: parseInt(totalAmountMatch[1]),
                material: '',
                items: [],
              };
            } else if (materialMatch && currentRecipe) {
              currentRecipe.material = materialMatch[1];
            } else if (commentMatch && currentRecipe) {
              currentRecipe.comment = commentMatch[1];
            } else if (paintMatch && currentRecipe) {
              currentRecipe.items.push({
                paint: paintMatch[1],
                amount: parseInt(paintMatch[2]),
              });
            }
          });

          if (currentRecipe) {
            parsedRecipes.push(currentRecipe);
          }

          setRecipes(parsedRecipes);
        }
      } else {
        // Если начальных данных нет, сбрасываем форму
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`${baseClasses.panel} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title
              className={`text-lg font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {initialData ? 'Редактировать цвет' : 'Добавить новый цвет'}
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
            {/* Название */}
            <div>
              <div className="flex gap-2">
                <div className="w-full">
                  <Input
                    id="name"
                    value={name}
                    type="text"
                    onChange={(e) => setName(e.target.value)}
                    required
                    label="Название"
                  />
                </div>
                <div className="w-full">
                  <Input
                    id="alternativeName"
                    value={alternativeName}
                    type="text"
                    onChange={(e) => setAlternativeName(e.target.value)}
                    label="Альтернативное название"
                    placeholder="Необязательное поле"
                  />
                </div>
              </div>
            </div>
            {/* HEX */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Input
                  id="hex"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  required
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  label="HEX код"
                  placeholder="Пример: #000000"
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
              <label className={labelClasses}>Категория</label>
              <Dropdown
                items={[UNCATEGORIZED, ...categories]}
                value={category || UNCATEGORIZED}
                onChange={setCategory}
                placeholder="Без категории"
                className="mt-1"
              />
            </div>
            {/* аказчики */}
            <div>
              <Dropdown
                items={existingCustomers}
                value={customers}
                onChange={(value) => {
                  const currentCustomers = customers
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean);

                  if (!currentCustomers.includes(value)) {
                    const newCustomers = [...currentCustomers, value];
                    setCustomers(newCustomers.join(', '));
                  }
                }}
                placeholder="Выберите клиента"
                triggerComponent={
                  <Input
                    id="customers"
                    value={customers}
                    onChange={(e) => setCustomers(e.target.value)}
                    placeholder="Введите имя заказчика"
                    label="Клиенты"
                    rightElement={
                      <ChevronDown
                        className={`w-4 h-4 transform transition-transform duration-200`}
                      />
                    }
                  />
                }
              />
            </div>
            {/* Менеджеры */}
            <div>
              <Input
                id="manager"
                value={manager}
                type="text"
                onChange={(e) => setManager(e.target.value)}
                label="Менеджер"
              />
            </div>
            {/* Заметки */}
            <div>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                label="Заметки"
                type="textarea"
                rows={3}
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
                          <Dropdown
                            items={COMMON_MATERIALS}
                            value={recipe.material}
                            onChange={(value) => handleMaterialSelect(value, recipeIndex)}
                            placeholder="Выберите материал"
                            triggerComponent={
                              <Input
                                id="material"
                                type="text"
                                value={recipe.material}
                                label="Материал"
                                rightElement={
                                  <ChevronDown
                                    className={`w-4 h-4 transform transition-transform duration-200`}
                                  />
                                }
                                onChange={(e) => {
                                  updateRecipe(recipeIndex, {
                                    material: e.target.value,
                                  });
                                }}
                              />
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Input
                          type="number"
                          id="totalAmount"
                          value={recipe.totalAmount}
                          onChange={(e) =>
                            updateRecipe(recipeIndex, {
                              totalAmount: parseInt(e.target.value),
                            })
                          }
                          min="0"
                          label="Общее количество (гр.)"
                        />
                      </div>

                      <div>
                        <Input
                          type="text"
                          id="comment"
                          value={recipe.comment || ''}
                          onChange={(e) =>
                            updateRecipe(recipeIndex, {
                              comment: e.target.value,
                            })
                          }
                          label="Комментарий"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className={`${labelClasses} text-sm`}>Компоненты</label>
                        {recipe.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className={`p-4 rounded-lg ${
                              isDark ? 'bg-gray-600' : 'bg-white border border-gray-200'
                            }`}>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <div className="flex-1">
                                <div className="relative">
                                  <Dropdown
                                    items={COMMON_PAINTS}
                                    value={item.paint}
                                    onChange={(value) =>
                                      handlePaintSelect(value, recipeIndex, itemIndex)
                                    }
                                    placeholder="Выберите краску"
                                    triggerComponent={
                                      <Input
                                        type="text"
                                        value={item.paint}
                                        onChange={(e) =>
                                          updateRecipeItem(recipeIndex, itemIndex, {
                                            paint: e.target.value,
                                          })
                                        }
                                        label="Название краски"
                                        rightElement={
                                          <ChevronDown
                                            className={`w-4 h-4 transform transition-transform duration-200`}
                                          />
                                        }
                                      />
                                    }
                                  />
                                </div>
                              </div>
                              <div className="w-full sm:w-32">
                                <Input
                                  type="number"
                                  value={item.amount}
                                  onChange={(e) =>
                                    updateRecipeItem(recipeIndex, itemIndex, {
                                      amount: parseInt(e.target.value),
                                    })
                                  }
                                  min="0"
                                  label="Количество (гр.)"
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
                        <Button
                          className="w-full"
                          type="button"
                          onClick={() => addRecipeItem(recipeIndex)}
                          leftIcon={<Plus className="w-4 h-4" />}>
                          Добавить компонент
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full"
                  type="button"
                  variant="outline"
                  onClick={addRecipe}
                  leftIcon={<Plus className="w-4 h-4" />}>
                  Добавить рецепт
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Input
                  id="inStock"
                  checked={inStock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setInStock(e.target.checked)
                  }
                  label="В наличии"
                  type="checkbox"
                />
              </div>

              <div className="flex items-center">
                <Input
                  id="isVerified"
                  checked={isVerified}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIsVerified(e.target.checked)
                  }
                  label="Проверен"
                  type="checkbox"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button variant="secondary" type="button" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit">{initialData ? 'Сохранить изменения' : 'Сохранить'}</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
