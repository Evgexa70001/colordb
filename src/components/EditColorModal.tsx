import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Plus, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { normalizeHexColor } from '../utils/colorUtils';
import { UNCATEGORIZED } from '../lib/categories';
import type { ColorModalProps, Recipe, RecipeItem } from '../types';

export default function EditColorModal({
  color,
  isOpen,
  onClose,
  onSave,
  categories,
}: ColorModalProps) {
  const { isDark } = useTheme();
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const [customers, setCustomers] = useState(color.customers?.join(', ') || '');
  const [inStock, setInStock] = useState(color.inStock);
  const [category, setCategory] = useState(
    color.category === UNCATEGORIZED ? '' : color.category
  );
  const [notes, setNotes] = useState(color.notes || '');
  const [manager, setManager] = useState(color.manager || '');
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    setName(color.name);
    setHex(color.hex);
    setCustomers(color.customers?.join(', ') || '');
    setInStock(color.inStock);
    setCategory(color.category === UNCATEGORIZED ? '' : color.category);
    setNotes(color.notes || '');
    setManager(color.manager || '');

    if (color.recipe) {
      const lines = color.recipe.split('\n');
      const parsedRecipes: Recipe[] = [];
      let currentRecipe: Recipe | null = null;

      lines.forEach((line) => {
        const totalAmountMatch = line.match(/^Общее количество: (\d+)/);
        const materialMatch = line.match(/^Материал: (.+)/);
        const aniloxMatch = line.match(/^Анилокс: (.+)/);
        const commentMatch = line.match(/^Комментарий: (.+)/);
        const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/);

        if (totalAmountMatch) {
          if (currentRecipe) {
            parsedRecipes.push(currentRecipe);
          }
          currentRecipe = {
            totalAmount: parseInt(totalAmountMatch[1]),
            material: '',
            anilox: '',
            comment: '',
            items: [],
          };
        } else if (materialMatch && currentRecipe) {
          currentRecipe.material = materialMatch[1];
        } else if (aniloxMatch && currentRecipe) {
          currentRecipe.anilox = aniloxMatch[1];
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

      setRecipes(
        parsedRecipes.length > 0
          ? parsedRecipes
          : [
              {
                totalAmount: 0,
                material: '',
                anilox: '',
                comment: '',
                items: [{ paint: '', amount: 0 }],
              },
            ]
      );
    } else {
      setRecipes([
        {
          totalAmount: 0,
          material: '',
          anilox: '',
          comment: '',
          items: [{ paint: '', amount: 0 }],
        },
      ]);
    }
  }, [color]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalHex = normalizeHexColor(hex.trim());

    const recipeString = recipes
      .map((recipe) => {
        const lines = [
          `Общее количество: ${recipe.totalAmount}`,
          `Материал: ${recipe.material}`,
        ];

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
      ...color,
      name: name.trim(),
      hex: finalHex,
      recipe: recipeString || null,
      category: category || UNCATEGORIZED,
      customers: customers
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      inStock,
      notes: notes.trim() || null,
      manager: manager.trim() || null,
    });
  };

  const addRecipeItem = (recipeIndex: number) => {
    const newRecipes = [...recipes];
    newRecipes[recipeIndex].items.push({ paint: '', amount: 0 });
    setRecipes(newRecipes);
  };

  const removeRecipeItem = (recipeIndex: number, itemIndex: number) => {
    const newRecipes = [...recipes];
    if (newRecipes[recipeIndex].items.length > 1) {
      newRecipes[recipeIndex].items.splice(itemIndex, 1);
      setRecipes(newRecipes);
    }
  };

  const addNewRecipe = () => {
    setRecipes([
      ...recipes,
      {
        totalAmount: 0,
        material: '',
        anilox: '',
        comment: '',
        items: [{ paint: '', amount: 0 }],
      },
    ]);
  };

  const removeRecipe = (index: number) => {
    if (recipes.length > 1) {
      const newRecipes = recipes.filter((_, i) => i !== index);
      setRecipes(newRecipes);
    }
  };

  const updateRecipe = (
    recipeIndex: number,
    field: keyof Recipe,
    value: string | number
  ) => {
    const newRecipes = [...recipes];
    if (field === 'totalAmount') {
      newRecipes[recipeIndex].totalAmount = Number(value);
    } else if (field === 'material') {
      newRecipes[recipeIndex].material = value as string;
    } else if (field === 'anilox') {
      newRecipes[recipeIndex].anilox = value as string;
    } else if (field === 'comment') {
      newRecipes[recipeIndex].comment = value as string;
    }
    setRecipes(newRecipes);
  };

  const updateRecipeItem = (
    recipeIndex: number,
    itemIndex: number,
    field: keyof RecipeItem,
    value: string | number
  ) => {
    const newRecipes = [...recipes];
    if (field === 'amount') {
      newRecipes[recipeIndex].items[itemIndex].amount = Number(value);
    } else {
      newRecipes[recipeIndex].items[itemIndex].paint = value as string;
    }
    setRecipes(newRecipes);
  };

  const inputClasses = `mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500'
      : 'border-gray-300 focus:border-blue-500'
  }`;

  const labelClasses = `block text-sm font-medium ${
    isDark ? 'text-gray-200' : 'text-gray-700'
  }`;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-lg w-full rounded-lg ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } max-h-[90vh] overflow-hidden flex flex-col`}
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <Dialog.Title
              className={`text-lg font-medium ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              Редактировать: {color.name}
            </Dialog.Title>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClasses}>Название</label>
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
                <label className={labelClasses}>Категория</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputClasses}
                >
                  <option value="">Без категории</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className={labelClasses}>Рецепт</label>
                {recipes.map((recipe, recipeIndex) => (
                  <div
                    key={recipeIndex}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClasses}>Общее количество</label>
                        <input
                          type="number"
                          value={recipe.totalAmount}
                          onChange={(e) =>
                            updateRecipe(
                              recipeIndex,
                              'totalAmount',
                              e.target.value
                            )
                          }
                          className={inputClasses}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className={labelClasses}>Материал</label>
                        <input
                          type="text"
                          value={recipe.material}
                          onChange={(e) =>
                            updateRecipe(
                              recipeIndex,
                              'material',
                              e.target.value
                            )
                          }
                          className={inputClasses}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Анилокс (не обязательно)
                      </label>
                      <input
                        type="text"
                        value={recipe.anilox}
                        onChange={(e) =>
                          updateRecipe(recipeIndex, 'anilox', e.target.value)
                        }
                        className={inputClasses}
                      />
                    </div>

                    <div>
                      <label className={labelClasses}>
                        Комментарий (не обязательно)
                      </label>
                      <textarea
                        value={recipe.comment}
                        onChange={(e) =>
                          updateRecipe(recipeIndex, 'comment', e.target.value)
                        }
                        className={inputClasses}
                        rows={3}
                      />
                    </div>

                    {recipe.items.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="grid grid-cols-2 gap-4 items-end"
                      >
                        <div>
                          <label className={labelClasses}>Краска</label>
                          <input
                            type="text"
                            value={item.paint}
                            onChange={(e) =>
                              updateRecipeItem(
                                recipeIndex,
                                itemIndex,
                                'paint',
                                e.target.value
                              )
                            }
                            className={inputClasses}
                          />
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className={labelClasses}>Количество</label>
                            <input
                              type="number"
                              value={item.amount}
                              onChange={(e) =>
                                updateRecipeItem(
                                  recipeIndex,
                                  itemIndex,
                                  'amount',
                                  e.target.value
                                )
                              }
                              className={inputClasses}
                              min="0"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeRecipeItem(recipeIndex, itemIndex)
                            }
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => addRecipeItem(recipeIndex)}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                      >
                        <Plus className="w-4 h-4" /> Добавить краску
                      </button>
                      {recipes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecipe(recipeIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Удалить рецепт
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNewRecipe}
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" /> Добавить новый рецепт
                </button>
              </div>

              <div>
                <label className={labelClasses}>
                  Заказчики (через запятую)
                </label>
                <input
                  type="text"
                  value={customers}
                  onChange={(e) => setCustomers(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div>
                <label className={labelClasses}>Менеджер (необязательно)</label>
                <input
                  type="text"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className={inputClasses}
                  placeholder="Укажите имя менеджера..."
                />
              </div>

              <div>
                <label className={labelClasses}>Заметки (необязательно)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClasses}
                  rows={3}
                  placeholder="Добавьте заметки..."
                />
              </div>

              <div>
                <label className={labelClasses}>Статус</label>
                <select
                  value={inStock.toString()}
                  onChange={(e) => setInStock(e.target.value === 'true')}
                  className={inputClasses}
                >
                  <option value="true">В наличии</option>
                  <option value="false">Отсутствует</option>
                </select>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Отменить
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Сохранить
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
