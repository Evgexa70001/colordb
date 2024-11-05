import React from 'react';
import { Edit, Trash2, Beaker, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { PantoneColor } from '../types';

interface ColorCardProps {
  color: PantoneColor;
  onEdit: () => void;
  onClick: () => void;
  onDelete: () => void;
}

export default function ColorCard({ color, onEdit, onClick, onDelete }: ColorCardProps) {
  const { isDark } = useTheme();

  const formatRecipe = (recipe: string) => {
    return recipe.split('\n').map((line, index) => (
      <span key={index} className="block">
        {line.trim()}
      </span>
    ));
  };

  return (
    <div
      className={`relative group cursor-pointer rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      onClick={onClick}>
      <div className="h-40" style={{ backgroundColor: color.hex }} />
      <div className="p-4 space-y-3">
        <div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {color.name}
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{color.hex}</p>
        </div>

        {color.recipe && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Beaker className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Рецепт:
              </p>
            </div>
            <div className={`text-sm font-mono ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              {formatRecipe(color.recipe)}
            </div>
          </div>
        )}

        {color.customers && color.customers.length > 0 && (
          <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <p
                className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                Клиенты:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {color.customers.map((customer, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 text-sm rounded-full shadow-sm ${
                    isDark
                      ? 'bg-gray-700 text-gray-200 border-purple-700'
                      : 'bg-white text-gray-900 border-purple-200'
                  } border`}>
                  {customer}
                </span>
              ))}
            </div>
          </div>
        )}

        {color.notes && (
          <div className={`p-2 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Заметки:
            </p>
            <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {color.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              color.inStock
                ? isDark
                  ? 'bg-green-900/50 text-green-300'
                  : 'bg-green-100 text-green-800'
                : isDark
                ? 'bg-red-900/50 text-red-300'
                : 'bg-red-100 text-red-800'
            }`}>
            {color.inStock ? 'В наличии' : 'Нет в наличии'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}>
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Вы уверены, что хотите удалить этот цвет?')) {
                  onDelete();
                }
              }}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                  : 'hover:bg-gray-100 text-red-600 hover:text-red-700'
              }`}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
