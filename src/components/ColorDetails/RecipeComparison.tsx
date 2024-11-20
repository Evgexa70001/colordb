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

  return (
    <div
      className={`p-6 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${
        isDark ? 'border-blue-800/30' : 'border-blue-100'
      }`}>
      <div className="flex items-center gap-3 mb-6">
        <Beaker className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <h3 className={`text-base font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
          Сравнение рецептов
        </h3>
      </div>

      {recipes1.map((recipe1, index1) =>
        recipes2.map((recipe2, index2) => {
          const commonIngredients = getCommonIngredients(recipe1, recipe2);
          const uniqueIngredients1 = getUniqueIngredients(recipe1, recipe2);
          const uniqueIngredients2 = getUniqueIngredients(recipe2, recipe1);

          return (
            <div key={`${index1}-${index2}`} className="mb-8 last:mb-0">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'}`}>
                  <p
                    className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                    Материал: {recipe1.material}
                  </p>
                  {recipe1.anilox && (
                    <p
                      className={`text-sm mt-1 ${
                        isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                      }`}>
                      Анилокс: {recipe1.anilox}
                    </p>
                  )}
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'}`}>
                  <p
                    className={`text-sm font-medium ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                    Материал: {recipe2.material}
                  </p>
                  {recipe2.anilox && (
                    <p
                      className={`text-sm mt-1 ${
                        isDark ? 'text-blue-300/70' : 'text-blue-600/70'
                      }`}>
                      Анилокс: {recipe2.anilox}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4
                    className={`text-xs font-semibold uppercase tracking-wider mb-4 ${
                      isDark ? 'text-blue-300/80' : 'text-blue-600/80'
                    }`}>
                    Общие компоненты
                  </h4>
                  <div className="space-y-3">
                    {commonIngredients.map((item, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-lg ${
                          isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'
                        } hover:shadow-lg transition-all duration-200`}>
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                            {item.paint}
                          </span>
                          <div
                            className={`text-sm rounded-full px-3 py-1 ${
                              Math.abs(item.difference) < 1
                                ? 'bg-green-500/10 text-green-500'
                                : Math.abs(item.difference) < 3
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                            }`}>
                            Разница: {Math.abs(item.difference).toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-20 text-right">
                            <span
                              className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                              {item.percentage1.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex-1 relative h-3">
                            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                                item.percentage1 >= item.percentage2
                                  ? 'bg-blue-500'
                                  : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.max(item.percentage1, item.percentage2)}%` }}
                            />
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                                item.percentage1 >= item.percentage2
                                  ? 'bg-purple-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(item.percentage1, item.percentage2)}%` }}
                            />
                          </div>
                          <div className="w-20">
                            <span
                              className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                              {item.percentage2.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                            Рецепт 1
                          </span>
                          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                            Рецепт 2
                          </span>
                        </div>
                      </div>
                    ))}
                    {commonIngredients.length === 0 && (
                      <div
                        className={`p-4 rounded-lg ${
                          isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'
                        }`}>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                          Общие компоненты отсутствуют
                        </p>
                      </div>
                    )}
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
                      className={`space-y-2 p-4 rounded-lg ${
                        isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'
                      }`}>
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
                      className={`space-y-2 p-4 rounded-lg ${
                        isDark ? 'bg-blue-900/30' : 'bg-blue-100/50'
                      }`}>
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
          );
        }),
      )}
    </div>
  );
}
