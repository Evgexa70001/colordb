import { useState } from 'react';
import {
  Edit,
  Trash2,
  Beaker,
  Users,
  StickyNote,
  UserCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { PantoneColor } from '../types';

interface ColorCardProps {
  color: PantoneColor;
  onEdit: () => void;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

function formatDate(dateString?: string | { seconds: number; nanoseconds: number }): string {
  if (!dateString) return '';

  // Handle Firestore Timestamp
  if (typeof dateString === 'object' && 'seconds' in dateString) {
    const timestamp = dateString as { seconds: number; nanoseconds: number };
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Handle string date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ColorCard({ color, onEdit, onClick, onDelete, isAdmin }: ColorCardProps) {
  const { isDark } = useTheme();
  const [expandedRecipes, setExpandedRecipes] = useState<number[]>([]);

  const toggleRecipe = (index: number) => {
    setExpandedRecipes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const parseRecipes = (recipeString: string) => {
    const lines = recipeString.split('\n');
    const recipes: Array<{
      totalAmount: number;
      material: string;
      anilox?: string;
      comment?: string;
      items: Array<{ paint: string; amount: number }>;
    }> = [];

    let currentRecipe: (typeof recipes)[0] | null = null;

    lines.forEach((line) => {
      const totalAmountMatch = line.match(/^Общее количество: (\d+)/);
      const materialMatch = line.match(/^Материал: (.+)/);
      const aniloxMatch = line.match(/^Анилокс: (.+)/);
      const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/);
      const commentMatch = line.match(/^Комментарий: (.+)/);

      if (totalAmountMatch) {
        if (currentRecipe) recipes.push(currentRecipe);
        currentRecipe = {
          totalAmount: parseInt(totalAmountMatch[1]),
          material: '',
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

    if (currentRecipe) recipes.push(currentRecipe);
    return recipes;
  };

  return (
    <div
      className={`relative group cursor-pointer rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:scale-102 hover:shadow-xl ${
        isDark ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm'
      } border ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}
      onClick={onClick}>
      <div
        className="h-32 sm:h-40 relative group-hover:shadow-inner transition-all duration-300"
        style={{ backgroundColor: color.hex }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
          <p className="text-white text-lg font-mono font-bold tracking-wider shadow-sm">
            {color.hex}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <h3
            className={`text-base sm:text-lg font-semibold ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
            {color.name}
          </h3>
          <p
            className={`text-xs sm:text-sm font-mono ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {color.hex}
          </p>
          {color.createdAt && (
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatDate(color.createdAt)}
              </p>
            </div>
          )}
        </div>

        {color.recipe &&
          parseRecipes(color.recipe).map((recipe, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-800/30'
                  : 'bg-blue-50/80 hover:bg-blue-50 border border-blue-100'
              }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRecipe(index);
                }}
                className="w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Beaker className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p
                      className={`text-xs sm:text-sm font-medium ${
                        isDark ? 'text-blue-300' : 'text-blue-700'
                      }`}>
                      Рецепт {index + 1}
                    </p>
                  </div>
                  {expandedRecipes.includes(index) ? (
                    <ChevronUp
                      className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    />
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    />
                  )}
                </div>
              </button>

              {expandedRecipes.includes(index) && (
                <div
                  className={`mt-3 text-xs sm:text-sm space-y-2 ${
                    isDark ? 'text-blue-200' : 'text-blue-800'
                  }`}>
                  <div className="space-y-1">
                    <p className="font-medium">Материал: {recipe.material}</p>
                    {recipe.anilox && <p>Анилокс: {recipe.anilox}</p>}
                    {recipe.comment && (
                      <p className="mt-2 italic text-sm px-3 py-2 rounded-lg bg-blue-900/20">
                        {recipe.comment}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 mt-3">
                    {recipe.items.map((item, itemIndex) => {
                      const percentage = ((item.amount / recipe.totalAmount) * 100).toFixed(1);
                      return (
                        <div key={itemIndex} className="flex justify-between items-center">
                          <span>{item.paint}</span>
                          <span className="font-medium">
                            {percentage}% ({item.amount} гр.)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

        {color.customers && color.customers.length > 0 && (
          <div
            className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
              isDark
                ? 'bg-purple-900/20 hover:bg-purple-900/30 border border-purple-800/30'
                : 'bg-purple-50/80 hover:bg-purple-50 border border-purple-100'
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <p
                className={`text-xs sm:text-sm font-medium ${
                  isDark ? 'text-purple-300' : 'text-purple-700'
                }`}>
                Клиенты:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {color.customers.map((customer, index) => (
                <span
                  key={index}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'bg-purple-900/30 text-purple-200 border-purple-700/50'
                      : 'bg-purple-50 text-purple-900 border-purple-200'
                  } border`}>
                  {customer}
                </span>
              ))}
            </div>
          </div>
        )}

        {color.manager && (
          <div
            className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
              isDark
                ? 'bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-800/30'
                : 'bg-emerald-50/80 hover:bg-emerald-50 border border-emerald-100'
            }`}>
            <div className="flex items-center gap-2">
              <UserCircle
                className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
              />
              <p
                className={`text-xs sm:text-sm font-medium ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}>
                Менеджер: {color.manager}
              </p>
            </div>
          </div>
        )}

        {color.notes && (
          <div
            className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
              isDark
                ? 'bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/30'
                : 'bg-amber-50/80 hover:bg-amber-50 border border-amber-100'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <p
                className={`text-xs sm:text-sm font-medium ${
                  isDark ? 'text-amber-300' : 'text-amber-700'
                }`}>
                Заметки:
              </p>
            </div>
            <p
              className={`text-xs sm:text-sm whitespace-pre-wrap ${
                isDark ? 'text-amber-200' : 'text-amber-900'
              }`}>
              {color.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span
            className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
              color.inStock
                ? isDark
                  ? 'bg-green-900/30 text-green-300 border border-green-800/30'
                  : 'bg-green-50 text-green-800 border border-green-200'
                : isDark
                ? 'bg-red-900/30 text-red-300 border border-red-800/30'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {color.inStock ? 'В наличии' : 'Нет в наличии'}
          </span>
          {isAdmin && (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-gray-700/50 text-gray-300 hover:text-gray-100'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
                    : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                }`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
