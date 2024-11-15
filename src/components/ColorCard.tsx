import React from 'react';
import { Edit, Trash2, Beaker, Users, StickyNote, UserCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { PantoneColor } from '../types';

interface ColorCardProps {
  color: PantoneColor;
  onEdit: () => void;
  onClick: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

export default function ColorCard({ color, onEdit, onClick, onDelete, isAdmin }: ColorCardProps) {
  const { isDark } = useTheme();

  const formatRecipe = (recipe: string) => {
    const lines = recipe.split('\n');
    const recipes: { totalAmount: number; material: string; anilox?: string; comment?: string; items: { paint: string; amount: number }[] }[] = [];
    let currentRecipe: { totalAmount: number; material: string; anilox?: string; comment?: string; items: { paint: string; amount: number }[] } | null = null;

    lines.forEach(line => {
      const totalAmountMatch = line.match(/^Общее количество: (\d+)/);
      const materialMatch = line.match(/^Материал: (.+)/);
      const aniloxMatch = line.match(/^Анилокс: (.+)/);
      const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/);
      const commentMatch = line.match(/^Комментарий: (.+)/);

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
        currentRecipe.comment = commentMatch[1];
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
          <div className="block mt-1 mb-2">
            <span className="font-medium">Комментарий:</span>
            <p className="mt-1 text-sm italic">{recipe.comment}</p>
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
    <div 
      className={`relative group cursor-pointer rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      onClick={onClick}
    >
      <div 
        className="h-32 sm:h-40" 
        style={{ backgroundColor: color.hex }}
      />
      <div className="p-3 sm:p-4 space-y-3">
        <div>
          <h3 className={`text-base sm:text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            {color.name}
          </h3>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {color.hex}
          </p>
        </div>

        {color.recipe && formatRecipe(color.recipe).length > 0 && (
          <div className={`p-2 sm:p-3 rounded-lg text-sm ${
            isDark ? 'bg-blue-900/30' : 'bg-blue-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Beaker className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                Рецепты:
              </p>
            </div>
            <div className={`text-xs sm:text-sm font-mono ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              {formatRecipe(color.recipe)}
            </div>
          </div>
        )}

        {color.customers && color.customers.length > 0 && (
          <div className={`p-2 sm:p-3 rounded-lg ${
            isDark ? 'bg-purple-900/30' : 'bg-purple-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Users className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                Клиенты:
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {color.customers.map((customer, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm rounded-full shadow-sm ${
                    isDark 
                      ? 'bg-gray-700 text-gray-200 border-purple-700'
                      : 'bg-white text-gray-900 border-purple-200'
                  } border`}
                >
                  {customer}
                </span>
              ))}
            </div>
          </div>
        )}

        {color.manager && (
          <div className={`p-2 sm:p-3 rounded-lg ${
            isDark ? 'bg-emerald-900/30' : 'bg-emerald-50'
          }`}>
            <div className="flex items-center gap-2">
              <UserCircle className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                Менеджер: {color.manager}
              </p>
            </div>
          </div>
        )}

        {color.notes && (
          <div className={`p-2 sm:p-3 rounded-lg ${
            isDark ? 'bg-amber-900/30' : 'bg-amber-50'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
              <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                Заметки:
              </p>
            </div>
            <p className={`text-xs sm:text-sm whitespace-pre-wrap ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
              {color.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs ${
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
          {isAdmin && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className={`p-1.5 sm:p-2 rounded-full ${
                  isDark
                    ? 'hover:bg-gray-700 text-gray-300 hover:text-gray-100'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className={`p-1.5 sm:p-2 rounded-full ${
                  isDark
                    ? 'hover:bg-gray-700 text-red-400 hover:text-red-300'
                    : 'hover:bg-gray-100 text-red-600 hover:text-red-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}