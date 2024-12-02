import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Beaker, ChevronLeft, ChevronRight } from 'lucide-react';

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

interface CommonIngredient {
  paint: string;
  percentage1: number;
  percentage2: number;
  difference: number;
}

function parseRecipe(recipeString: string): Recipe[] {
  const lines = recipeString.split('\n');
  const recipes: Recipe[] = [];
  let currentRecipe: Recipe | null = null;

  lines.forEach((line) => {
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
    recipes.push(currentRecipe);
  }

  return recipes;
}

const getCommonIngredients = (r1: Recipe, r2: Recipe): CommonIngredient[] => {
  return r1.items
    .map((item1) => {
      const item2 = r2.items.find((i) => i.paint === item1.paint);
      if (item2) {
        const percentage1 = (item1.amount / r1.totalAmount) * 100;
        const percentage2 = (item2.amount / r2.totalAmount) * 100;
        return {
          paint: item1.paint,
          percentage1,
          percentage2,
          difference: percentage1 - percentage2,
        };
      }
      return null;
    })
    .filter((item): item is CommonIngredient => item !== null);
};

const getUniqueIngredients = (r1: Recipe, r2: Recipe) => {
  return r1.items
    .filter((item1) => !r2.items.some((item2) => item2.paint === item1.paint))
    .map((item) => ({
      paint: item.paint,
      percentage: (item.amount / r1.totalAmount) * 100,
    }));
};

export default function RecipeComparison({ recipe1, recipe2 }: RecipeComparisonProps) {
  const { isDark } = useTheme();
  const recipes1 = parseRecipe(recipe1);
  const recipes2 = parseRecipe(recipe2);
  const [currentVariant, setCurrentVariant] = useState(0);

  const allVariants = recipes1.flatMap((r1, i1) =>
    recipes2.map((r2, i2) => ({ recipe1: r1, recipe2: r2, index1: i1, index2: i2 })),
  );

  const goToNextVariant = () => {
    if (currentVariant < allVariants.length - 1) {
      setCurrentVariant((prev) => prev + 1);
    }
  };

  const goToPrevVariant = () => {
    if (currentVariant > 0) {
      setCurrentVariant((prev) => prev - 1);
    }
  };

  return (
    <div
      className={`p-4 sm:p-8 rounded-2xl ${
        isDark
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10'
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50'
      } border ${isDark ? 'border-blue-800/30' : 'border-blue-100'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Beaker
            className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
          />
          <h3
            className={`text-base sm:text-lg font-semibold ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>
            Сравнение рецептов
          </h3>
        </div>

        {allVariants.length > 1 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className={`text-xs sm:text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {currentVariant + 1} / {allVariants.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={goToPrevVariant}
                disabled={currentVariant === 0}
                className={`p-1 sm:p-1.5 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-blue-900/60 disabled:opacity-30'
                    : 'hover:bg-blue-100 disabled:opacity-30'
                }`}>
                <ChevronLeft
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                />
              </button>
              <button
                onClick={goToNextVariant}
                disabled={currentVariant === allVariants.length - 1}
                className={`p-1 sm:p-1.5 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-blue-900/60 disabled:opacity-30'
                    : 'hover:bg-blue-100 disabled:opacity-30'
                }`}>
                <ChevronRight
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          className="transition-transform duration-500 ease-in-out flex"
          style={{ transform: `translateX(-${currentVariant * 100}%)` }}>
          {allVariants.map((variant) => {
            const commonIngredients = getCommonIngredients(variant.recipe1, variant.recipe2);
            const uniqueIngredients1 = getUniqueIngredients(variant.recipe1, variant.recipe2);
            const uniqueIngredients2 = getUniqueIngredients(variant.recipe2, variant.recipe1);

            return (
              <div key={`${variant.index1}-${variant.index2}`} className="w-full flex-shrink-0">
                <div className="space-y-6">
                  {/* Рецепты в одну линию на больших экранах */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Рецепт 1 */}
                    <div
                      className={`p-4 rounded-xl ${
                        isDark ? 'bg-blue-900/40' : 'bg-white/70'
                      } shadow-lg`}>
                      <h4
                        className={`text-sm font-medium mb-3 ${
                          isDark ? 'text-blue-300' : 'text-blue-700'
                        }`}>
                        Рецепт 1
                      </h4>
                      <p className="text-sm mb-2">Материал: {variant.recipe1.material}</p>
                      {variant.recipe1.anilox && (
                        <p className="text-sm mb-2">Анилокс: {variant.recipe1.anilox}</p>
                      )}
                    </div>

                    {/* Рецепт 2 */}
                    <div
                      className={`p-4 rounded-xl ${
                        isDark ? 'bg-purple-900/40' : 'bg-purple-50/70'
                      } shadow-lg`}>
                      <h4
                        className={`text-sm font-medium mb-3 ${
                          isDark ? 'text-purple-300' : 'text-purple-700'
                        }`}>
                        Рецепт 2
                      </h4>
                      <p className="text-sm mb-2">Материал: {variant.recipe2.material}</p>
                      {variant.recipe2.anilox && (
                        <p className="text-sm mb-2">Анилокс: {variant.recipe2.anilox}</p>
                      )}
                    </div>
                  </div>

                  {/* Общие компоненты */}
                  <div className="space-y-4">
                    <h4
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                      }`}>
                      Общие компоненты
                    </h4>
                    {commonIngredients.map((item, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl ${
                          isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                        } shadow-lg`}>
                        <div className="flex justify-between items-center mb-3">
                          <span
                            className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {item.paint}
                          </span>
                          <span
                            className={`text-sm px-3 py-1 rounded-full ${
                              Math.abs(item.difference) < 1
                                ? isDark
                                  ? 'bg-green-900/20 text-green-400'
                                  : 'bg-green-100 text-green-600'
                                : Math.abs(item.difference) < 3
                                ? isDark
                                  ? 'bg-yellow-900/20 text-yellow-400'
                                  : 'bg-yellow-100 text-yellow-600'
                                : isDark
                                ? 'bg-red-900/20 text-red-400'
                                : 'bg-red-100 text-red-600'
                            }`}>
                            Разница: {Math.abs(item.difference).toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isDark ? 'bg-blue-500' : 'bg-blue-600'
                              }`}
                            />
                            <span
                              className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                              {item.paint}: {item.percentage1.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isDark ? 'bg-purple-500' : 'bg-purple-600'
                              }`}
                            />
                            <span
                              className={`text-sm ${
                                isDark ? 'text-purple-300' : 'text-purple-700'
                              }`}>
                              {item.paint}: {item.percentage2.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Уникальные компоненты */}
                  <div className="space-y-4">
                    {(uniqueIngredients1.length > 0 || uniqueIngredients2.length > 0) && (
                      <h4
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                        }`}>
                        Уникальные компоненты
                      </h4>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {uniqueIngredients1.length > 0 && (
                        <div
                          className={`p-4 rounded-xl ${
                            isDark
                              ? 'bg-gray-800/80 border border-blue-900/30'
                              : 'bg-white border border-blue-200'
                          } shadow-lg`}>
                          <p
                            className={`text-sm font-medium mb-2 ${
                              isDark ? 'text-blue-300' : 'text-blue-700'
                            }`}>
                            Рецепт 1:
                          </p>
                          {uniqueIngredients1.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isDark ? 'bg-blue-500' : 'bg-blue-600'
                                }`}
                              />
                              <p
                                className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                                {item.paint} - {item.percentage.toFixed(1)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {uniqueIngredients2.length > 0 && (
                        <div
                          className={`p-4 rounded-xl ${
                            isDark
                              ? 'bg-gray-800/80 border border-purple-900/30'
                              : 'bg-white border border-purple-200'
                          } shadow-lg`}>
                          <p
                            className={`text-sm font-medium mb-2 ${
                              isDark ? 'text-purple-300' : 'text-purple-700'
                            }`}>
                            Рецепт 2:
                          </p>
                          {uniqueIngredients2.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  isDark ? 'bg-purple-500' : 'bg-purple-600'
                                }`}
                              />
                              <p
                                className={`text-sm ${
                                  isDark ? 'text-purple-200' : 'text-purple-800'
                                }`}>
                                {item.paint} - {item.percentage.toFixed(1)}%
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
