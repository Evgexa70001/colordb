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
      className={`p-8 rounded-2xl ${
        isDark
          ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10'
          : 'bg-gradient-to-br from-blue-50 to-blue-100/50'
      } border ${isDark ? 'border-blue-800/30' : 'border-blue-100'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Beaker className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h3 className={`text-lg font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Сравнение рецептов
          </h3>
        </div>

        {allVariants.length > 1 && (
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {currentVariant + 1} / {allVariants.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={goToPrevVariant}
                disabled={currentVariant === 0}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-blue-900/60 disabled:opacity-30'
                    : 'hover:bg-blue-100 disabled:opacity-30'
                }`}>
                <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </button>
              <button
                onClick={goToNextVariant}
                disabled={currentVariant === allVariants.length - 1}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-blue-900/60 disabled:opacity-30'
                    : 'hover:bg-blue-100 disabled:opacity-30'
                }`}>
                <ChevronRight className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden">
        <div
          className="transition-transform duration-500 ease-in-out flex"
          style={{ transform: `translateX(-${currentVariant * 100}%)` }}>
          {allVariants.map((variant, index) => {
            const commonIngredients = getCommonIngredients(variant.recipe1, variant.recipe2);
            const uniqueIngredients1 = getUniqueIngredients(variant.recipe1, variant.recipe2);
            const uniqueIngredients2 = getUniqueIngredients(variant.recipe2, variant.recipe1);

            return (
              <div key={`${variant.index1}-${variant.index2}`} className="w-full flex-shrink-0">
                <div className="mb-10">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div
                      className={`p-5 rounded-xl backdrop-blur-sm ${
                        isDark ? 'bg-blue-900/40' : 'bg-white/70'
                      } shadow-lg`}>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-blue-200' : 'text-blue-700'
                        }`}>
                        Материал: {variant.recipe1.material}
                      </p>
                      {variant.recipe1.anilox && (
                        <p
                          className={`text-sm mt-2 ${
                            isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                          }`}>
                          Анилокс: {variant.recipe1.anilox}
                        </p>
                      )}
                    </div>
                    <div
                      className={`p-5 rounded-xl backdrop-blur-sm ${
                        isDark ? 'bg-blue-900/40' : 'bg-white/70'
                      } shadow-lg`}>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? 'text-blue-200' : 'text-blue-700'
                        }`}>
                        Материал: {variant.recipe2.material}
                      </p>
                      {variant.recipe2.anilox && (
                        <p
                          className={`text-sm mt-2 ${
                            isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                          }`}>
                          Анилокс: {variant.recipe2.anilox}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4
                        className={`text-xs font-semibold uppercase tracking-wider mb-5 ${
                          isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                        }`}>
                        Общие компоненты
                      </h4>
                      <div className="space-y-4">
                        {commonIngredients.map((item, i) => (
                          <div key={i}>
                            <div
                              className={`p-5 rounded-xl backdrop-blur-sm ${
                                isDark ? 'bg-blue-900/40' : 'bg-white/70'
                              } shadow-lg hover:shadow-xl transition-all duration-300`}>
                              <div className="flex items-center justify-between mb-4">
                                <span
                                  className={`font-medium ${
                                    isDark ? 'text-blue-200' : 'text-blue-800'
                                  }`}>
                                  {item.paint}
                                </span>
                                <div
                                  className={`text-sm font-medium rounded-full px-4 py-1.5 ${
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
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="w-20 text-right">
                                  <span
                                    className={`text-sm font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-700'
                                    }`}>
                                    {item.percentage1.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex-1 relative h-4">
                                  <div
                                    className={`absolute inset-0 ${
                                      isDark ? 'bg-blue-950/50' : 'bg-blue-100'
                                    } rounded-full`}
                                  />
                                  <div
                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                                      isDark
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                                        : 'bg-gradient-to-r from-blue-600 to-blue-500'
                                    }`}
                                    style={{
                                      width: `${Math.max(item.percentage1, item.percentage2)}%`,
                                    }}
                                  />
                                  <div
                                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                                      isDark
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-500'
                                    }`}
                                    style={{
                                      width: `${Math.min(item.percentage1, item.percentage2)}%`,
                                    }}
                                  />
                                </div>
                                <div className="w-20">
                                  <span
                                    className={`text-sm font-medium ${
                                      isDark ? 'text-blue-300' : 'text-blue-700'
                                    }`}>
                                    {item.percentage2.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              <div className="flex justify-between mt-2 text-xs">
                                <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                                  Рецепт 1
                                </span>
                                <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>
                                  Рецепт 2
                                </span>
                              </div>
                            </div>
                            {i < commonIngredients.length - 1 && (
                              <div className="flex items-center my-6">
                                <div
                                  className={`flex-1 h-px ${
                                    isDark ? 'bg-blue-800/30' : 'bg-blue-200/50'
                                  }`}></div>
                                <div
                                  className={`px-4 text-xs ${
                                    isDark ? 'text-blue-500/50' : 'text-blue-400/70'
                                  }`}>
                                  •
                                </div>
                                <div
                                  className={`flex-1 h-px ${
                                    isDark ? 'bg-blue-800/30' : 'bg-blue-200/50'
                                  }`}></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4
                          className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                            isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                          }`}>
                          Уникальные компоненты (Рецепт 1)
                        </h4>
                        <div
                          className={`p-5 rounded-xl backdrop-blur-sm ${
                            isDark ? 'bg-blue-900/40' : 'bg-white/70'
                          } shadow-lg`}>
                          {uniqueIngredients1.map((item, i) => (
                            <p
                              key={i}
                              className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                              {item.paint} - {item.percentage.toFixed(1)}%
                            </p>
                          ))}
                          {uniqueIngredients1.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Нет уникальных компонентов
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4
                          className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                            isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                          }`}>
                          Уникальные компоненты (Рецепт 2)
                        </h4>
                        <div
                          className={`p-5 rounded-xl backdrop-blur-sm ${
                            isDark ? 'bg-blue-900/40' : 'bg-white/70'
                          } shadow-lg`}>
                          {uniqueIngredients2.map((item, i) => (
                            <p
                              key={i}
                              className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                              {item.paint} - {item.percentage.toFixed(1)}%
                            </p>
                          ))}
                          {uniqueIngredients2.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Нет уникальных компонентов
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {index < allVariants.length - 1 && (
                  <div className="flex items-center my-8">
                    <div
                      className={`flex-1 h-0.5 ${
                        isDark
                          ? 'bg-gradient-to-r from-transparent via-blue-800/30 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-blue-200/50 to-transparent'
                      }`}></div>
                    <div
                      className={`px-6 text-base ${
                        isDark ? 'text-blue-500/50' : 'text-blue-400/70'
                      }`}>
                      ●
                    </div>
                    <div
                      className={`flex-1 h-0.5 ${
                        isDark
                          ? 'bg-gradient-to-r from-transparent via-blue-800/30 to-transparent'
                          : 'bg-gradient-to-r from-transparent via-blue-200/50 to-transparent'
                      }`}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
