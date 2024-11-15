import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Beaker } from 'lucide-react';

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

interface RecipeComparisonProps {
  recipe1: string;
  recipe2: string;
}

function parseRecipe(recipeString: string): Recipe[] {
  const lines = recipeString.split('\n');
  const recipes: Recipe[] = [];
  let currentRecipe: Recipe | null = null;

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

  return recipes;
}

export default function RecipeComparison({ recipe1, recipe2 }: RecipeComparisonProps) {
  const { isDark } = useTheme();
  const recipes1 = parseRecipe(recipe1);
  const recipes2 = parseRecipe(recipe2);

  const getCommonIngredients = (r1: Recipe, r2: Recipe) => {
    return r1.items.map(item1 => {
      const item2 = r2.items.find(i => i.paint === item1.paint);
      if (item2) {
        const percentage1 = (item1.amount / r1.totalAmount * 100);
        const percentage2 = (item2.amount / r2.totalAmount * 100);
        return {
          paint: item1.paint,
          percentage1,
          percentage2,
          difference: percentage1 - percentage2
        };
      }
      return null;
    }).filter(Boolean);
  };

  const getUniqueIngredients = (r1: Recipe, r2: Recipe) => {
    return r1.items.filter(item1 => 
      !r2.items.some(item2 => item2.paint === item1.paint)
    ).map(item => ({
      paint: item.paint,
      percentage: (item.amount / r1.totalAmount * 100)
    }));
  };

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Beaker className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          Сравнение рецептов
        </h3>
      </div>

      {recipes1.map((recipe1, index1) => 
        recipes2.map((recipe2, index2) => (
          <div key={`${index1}-${index2}`} className="mb-6 last:mb-0">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Материал: {recipe1.material}
                </p>
                {recipe1.anilox && (
                  <p className={`text-sm ${isDark ? 'text-blue-300/70' : 'text-blue-600/70'}`}>
                    Анилокс: {recipe1.anilox}
                  </p>
                )}
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  Материал: {recipe2.material}
                </p>
                {recipe2.anilox && (
                  <p className={`text-sm ${isDark ? 'text-blue-300/70' : 'text-blue-600/70'}`}>
                    Анилокс: {recipe2.anilox}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                  isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                }`}>
                  Общие компоненты
                </h4>
                <div className="space-y-2">
                  {getCommonIngredients(recipe1, recipe2).map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        {item.paint}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          {item.percentage1.toFixed(1)}%
                        </span>
                        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded">
                          <div
                            className={`h-full rounded ${
                              Math.abs(item.difference) < 1
                                ? 'bg-green-500'
                                : Math.abs(item.difference) < 3
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.abs(item.difference)}%` }}
                          />
                        </div>
                        <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          {item.percentage2.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                    isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                  }`}>
                    Уникальные компоненты (Рецепт 1)
                  </h4>
                  <div className="space-y-1">
                    {getUniqueIngredients(recipe1, recipe2).map((item, i) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        {item.paint} - {item.percentage.toFixed(1)}%
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                    isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                  }`}>
                    Уникальные компоненты (Рецепт 2)
                  </h4>
                  <div className="space-y-1">
                    {getUniqueIngredients(recipe2, recipe1).map((item, i) => (
                      <p key={i} className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                        {item.paint} - {item.percentage.toFixed(1)}%
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}