import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { normalizeHexColor } from '../../utils/colorUtils';
import RecipeComparison from './RecipeComparison';
import ColorComparison from './ColorComparison';
import type { PantoneColor } from '../../types';

interface SimilarColorsProps {
  similarColors: (PantoneColor & { distance?: number })[];
  originalColor: PantoneColor;
}

export default function SimilarColors({ similarColors, originalColor }: SimilarColorsProps) {
  const { isDark } = useTheme();
  const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null);

  if (similarColors.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDark ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Похожие цвета
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {similarColors.map((similarColor) => (
            <div 
              key={similarColor.id} 
              className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-600' : 'bg-white'
              } shadow-sm space-y-3 cursor-pointer transition-transform hover:scale-105 ${
                selectedColor?.id === similarColor.id ? 
                  isDark ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-400' 
                  : ''
              }`}
              onClick={() => setSelectedColor(
                selectedColor?.id === similarColor.id ? null : similarColor
              )}
            >
              <div className="space-y-2">
                <p className={`text-sm font-medium truncate ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {similarColor.name}
                </p>
                <div 
                  className="aspect-square w-full rounded-lg shadow-sm" 
                  style={{ backgroundColor: normalizeHexColor(similarColor.hex) }}
                />
                <p className={`text-xs font-mono ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {normalizeHexColor(similarColor.hex)}
                </p>
              </div>
              <div className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <p>Delta E: {similarColor.distance?.toFixed(2)}</p>
                <p className="mt-1">
                  {similarColor.distance && similarColor.distance < 1
                    ? 'Не различимо человеческим глазом'
                    : similarColor.distance && similarColor.distance < 2
                    ? 'Едва заметное различие'
                    : similarColor.distance && similarColor.distance < 3
                    ? 'Заметное различие при близком рассмотрении'
                    : similarColor.distance && similarColor.distance < 5
                    ? 'Заметное различие'
                    : 'Явное различие'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedColor && (
        <>
          <ColorComparison
            color1={originalColor.hex}
            color2={selectedColor.hex}
            name1={originalColor.name}
            name2={selectedColor.name}
          />
          {originalColor.recipe && selectedColor.recipe && (
            <RecipeComparison 
              recipe1={originalColor.recipe} 
              recipe2={selectedColor.recipe}
            />
          )}
        </>
      )}
    </div>
  );
}