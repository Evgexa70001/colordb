import { Dialog } from '@headlessui/react';
import { X, Beaker, UserCircle, StickyNote } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getColorInfo, normalizeHexColor } from '../../utils/colorUtils';
import ColorInfo from './ColorInfo';
import SimilarColors from './SimilarColors';
import type { ColorDetailsModalProps } from '../../types';

export default function ColorDetailsModal({
  color,
  isOpen,
  onClose,
  similarColors
}: ColorDetailsModalProps) {
  const { isDark } = useTheme();
  const normalizedHex = normalizeHexColor(color.hex);
  const colorInfo = getColorInfo(normalizedHex);

  const formatRecipe = (recipe: string) => {
    const lines = recipe.split('\n');
    const recipes: { totalAmount: number; material: string; anilox?: string; comment?: string; items: { paint: string; amount: number }[] }[] = [];
    let currentRecipe: { totalAmount: number; material: string; anilox?: string; comment?: string; items: { paint: string; amount: number }[] } | null = null;

    lines.forEach(line => {
      const totalAmountMatch = line.match(/Общее количество: (\d+)/);
      const materialMatch = line.match(/Материал: (.+)/);
      const aniloxMatch = line.match(/Анилокс: (.+)/);
      const commentMatch = line.match(/Комментарий:\n([\s\S]+?)(?=\nОбщее количество:|$)/);
      const paintMatch = line.match(/Краска: (.+), Количество: (\d+)/);

     if (totalAmountMatch) {
      if (currentRecipe) {
        recipes.push(currentRecipe);
      }
      currentRecipe = {
        totalAmount: parseInt(totalAmountMatch[1]),
        material: '',
        anilox: '',
        comment: '',
        items: []
      };
    } else if (materialMatch && currentRecipe) {
      currentRecipe.material = materialMatch[1];
    } else if (aniloxMatch && currentRecipe) {
      currentRecipe.anilox = aniloxMatch[1];
    } else if (commentMatch && currentRecipe) {
      currentRecipe.comment = commentMatch[1].trim();
    } else if (paintMatch && currentRecipe) {
      currentRecipe.items.push({
        paint: paintMatch[1],
        amount: parseInt(paintMatch[2])
      });
    }
    });

    if (currentRecipe) {
      recipes.push(currentRecipe);
    }

    const validRecipes = recipes.filter(recipe => 
      recipe.material.trim() !== '' && 
      recipe.items.length > 0 &&
      recipe.items.some(item => item.paint.trim() !== '' && item.amount > 0)
    );

    return validRecipes.map((recipe, index) => (
      <div key={index} className={`${index > 0 ? 'mt-3 pt-3 border-t border-blue-400/30' : ''}`}>
        <div className={`text-xs uppercase tracking-wider mb-1 ${
          isDark ? 'text-blue-300/70' : 'text-blue-600/70'
        }`}>
          Рецепт {index + 1}
        </div>
        <span className="block font-medium">Материал: {recipe.material}</span>
        {recipe.anilox && (
          <span className="block">Анилокс: {recipe.anilox}</span>
        )}
        {recipe.comment && (
          <div className="block italic text-sm">
            <span className="font-medium">Комментарий:</span>
            <pre className="mt-1 whitespace-pre-wrap font-sans">{recipe.comment}</pre>
          </div>
        )}
        {recipe.items
          .filter(item => item.paint.trim() !== '' && item.amount > 0)
          .map((item, itemIndex) => {
            const percentage = (item.amount / recipe.totalAmount * 100).toFixed(1);
            return (
              <span key={itemIndex} className="block text-sm">
                {item.paint} - {percentage}% ({item.amount} гр.)
              </span>
            );
          })}
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-4xl w-full rounded-lg p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } max-h-[90vh] overflow-y-auto custom-scrollbar`}
        >
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title
              className={`text-2xl font-bold ${
                isDark ? 'text-gray-100' : 'text-gray-900'
              }`}
            >
              {color.name}
            </Dialog.Title>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Preview */}
              <div className="space-y-4">
                <div
                  className="w-full aspect-square rounded-lg shadow-lg"
                  style={{ backgroundColor: normalizedHex }}
                />
                <p
                  className={`text-lg font-mono text-center ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {normalizedHex}
                </p>
              </div>

              {/* Color Information */}
              <ColorInfo colorInfo={colorInfo} />
            </div>

            {/* Category */}
            <div
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Категория
              </h3>
              <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                {color.category}
              </p>
            </div>

            {/* Recipe */}
            {color.recipe && formatRecipe(color.recipe).length > 0 && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-blue-900/30' : 'bg-blue-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Beaker className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    Рецепты:
                  </p>
                </div>
                <div className={`text-sm font-mono ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  {formatRecipe(color.recipe)}
                </div>
              </div>
            )}

            {/* Manager */}
            {color.manager && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'
              }`}>
                <div className="flex items-center gap-2">
                  <UserCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    Менеджер: {color.manager}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {color.notes && (
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-amber-900/30' : 'bg-amber-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <StickyNote className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <p className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    Заметки:
                  </p>
                </div>
                <p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
                  {color.notes}
                </p>
              </div>
            )}

            {/* Customers */}
            {color.customers && color.customers.length > 0 && (
              <div
                className={`p-4 rounded-lg ${
                  isDark ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
                >
                  Клиенты
                </h3>
                <div className="flex flex-wrap gap-2">
                  {color.customers.map((customer, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isDark
                          ? 'bg-gray-600 text-gray-200'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {customer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}
              >
                Статус
              </h3>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  color.inStock
                    ? isDark
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-green-100 text-green-800'
                    : isDark
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {color.inStock ? 'В наличии' : 'Отсутствует'}
              </span>
            </div>

            {/* Similar Colors */}
            <SimilarColors 
              similarColors={similarColors} 
              originalColor={color}
            />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}