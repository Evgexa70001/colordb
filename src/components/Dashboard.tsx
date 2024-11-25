import { useState, useEffect } from 'react';
import {
  Sun,
  Moon,
  Plus,
  FolderPlus,
  Trash2,
  ShieldAlert,
  LogOut,
  Menu,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ColorCard from './ColorCard';
import SkeletonColorCard from './SkeletonColorCard';
import NewColorModal from './NewColorModal';
import EditColorModal from './EditColorModal';
import ColorDetailsModal from './ColorDetails/ColorDetailsModal';
import NewCategoryModal from './NewCategoryModal';
import SortControls from './SortControls';
import { getColors, saveColor, updateColor, deleteColor, setOfflineMode } from '../lib/colors';
import { getCategories, addCategory, deleteCategory } from '../lib/categories';
import { getColorDistance, isValidHexColor } from '../utils/colorUtils';
import type { PantoneColor } from '../types';
import toast from 'react-hot-toast';

type SortField = 'name' | 'inStock' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type VerificationFilter = 'all' | 'verified' | 'unverified';

const SIMILAR_COLOR_THRESHOLD = 8;
const SKELETON_COUNT = 6;
const ITEMS_PER_PAGE = 18;
const INITIAL_CUSTOMERS_TO_SHOW = 10;
const CUSTOMERS_TO_LOAD_MORE = 10;

const getTimestamp = (color: PantoneColor): number => {
  if (!color.createdAt) return 0;

  // Handle Firestore Timestamp
  if (typeof color.createdAt === 'object' && 'seconds' in color.createdAt) {
    const timestamp = color.createdAt as {
      seconds: number;
      nanoseconds: number;
    };
    return timestamp.seconds * 1000;
  }

  // Handle string date
  return new Date(color.createdAt).getTime();
};

// Добавьте эти интерфейсы в начало файла или переместите в types.ts
interface RecipeItem {
  paint: string;
  amount: number;
}

interface Recipe {
  totalAmount: number;
  material: string;
  anilox?: string;
  comment?: string;
  items: RecipeItem[];
}

// Добавьте эту функцию для парсинга рецепта
const parseRecipe = (recipeString: string): Recipe[] => {
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

// Обновите функцию getSimilarRecipes
const getSimilarRecipes = (
  targetColor: PantoneColor,
  colors: PantoneColor[],
): Array<{
  color: PantoneColor;
  similarRecipes: Array<{
    recipe: Recipe;
    differences: Array<{ paint: string; difference: number }>;
  }>;
}> => {
  if (!targetColor.recipe) return [];

  const targetRecipes = parseRecipe(targetColor.recipe);
  const similarRecipesResults: Array<{
    color: PantoneColor;
    similarRecipes: Array<{
      recipe: Recipe;
      differences: Array<{ paint: string; difference: number }>;
    }>;
  }> = [];

  colors
    .filter((color) => color.id !== targetColor.id && color.recipe)
    .forEach((color) => {
      const comparisonRecipes = parseRecipe(color.recipe!);
      const similarRecipes: Array<{
        recipe: Recipe;
        differences: Array<{ paint: string; difference: number }>;
      }> = [];

      targetRecipes.forEach((targetRecipe) => {
        comparisonRecipes.forEach((comparisonRecipe) => {
          const differences: Array<{ paint: string; difference: number }> = [];

          // Создаем карты процентов для обоих рецептов
          const targetPercentages = new Map<string, number>();
          const targetPaints = new Set<string>();
          targetRecipe.items.forEach((item) => {
            const percentage = (item.amount / targetRecipe.totalAmount) * 100;
            targetPercentages.set(item.paint, percentage);
            targetPaints.add(item.paint);
          });

          const comparisonPercentages = new Map<string, number>();
          const comparisonPaints = new Set<string>();
          comparisonRecipe.items.forEach((item) => {
            const percentage = (item.amount / comparisonRecipe.totalAmount) * 100;
            comparisonPercentages.set(item.paint, percentage);
            comparisonPaints.add(item.paint);
          });

          // Проверяем, что наборы компонентов идентичны
          const targetPaintsArray = Array.from(targetPaints);
          const comparisonPaintsArray = Array.from(comparisonPaints);

          if (
            targetPaintsArray.length === comparisonPaintsArray.length &&
            targetPaintsArray.every((paint) => comparisonPaints.has(paint))
          ) {
            // Если наборы компонентов совпадают, проверяем разницу в процентах
            let isRecipeSimilar = true;

            targetPaintsArray.forEach((paint) => {
              const targetPercentage = targetPercentages.get(paint) || 0;
              const comparisonPercentage = comparisonPercentages.get(paint) || 0;
              const difference = Math.abs(targetPercentage - comparisonPercentage);

              if (difference <= 3) {
                differences.push({ paint, difference });
              } else {
                isRecipeSimilar = false;
              }
            });

            if (isRecipeSimilar && differences.length === targetPaintsArray.length) {
              similarRecipes.push({ recipe: comparisonRecipe, differences });
            }
          }
        });
      });

      if (similarRecipes.length > 0) {
        similarRecipesResults.push({ color, similarRecipes });
      }
    });

  return similarRecipesResults;
};

// Обновите функцию getSimilarColors, добавив параметр colors
const getSimilarColors = (
  targetColor: PantoneColor,
  colors: PantoneColor[],
): {
  similarColors: (PantoneColor & { distance?: number })[];
  similarRecipes: Array<{
    color: PantoneColor;
    similarRecipes: Array<{
      recipe: Recipe;
      differences: Array<{ paint: string; difference: number }>;
    }>;
  }>;
} => {
  const similarColors = !isValidHexColor(targetColor.hex)
    ? []
    : colors
        .filter((color) => color.id !== targetColor.id && isValidHexColor(color.hex))
        .map((color) => ({
          ...color,
          distance: getColorDistance(targetColor.hex, color.hex),
        }))
        .filter((color) => (color.distance || 0) <= SIMILAR_COLOR_THRESHOLD)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 6);

  const similarRecipes = getSimilarRecipes(targetColor, colors);

  return { similarColors, similarRecipes };
};

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [colors, setColors] = useState<PantoneColor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null);
  const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [visibleCustomersCount, setVisibleCustomersCount] = useState(INITIAL_CUSTOMERS_TO_SHOW);
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all');
  const [isVerificationDropdownOpen, setIsVerificationDropdownOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleOnline = async () => {
      try {
        await setOfflineMode(false);
        toast.success('Подключение восстановлено');
        loadData();
      } catch (error) {
        console.error('Error handling online state:', error);
      }
    };

    const handleOffline = async () => {
      try {
        await setOfflineMode(true);
        toast.error('Работаем в офлайн режиме');
      } catch (error) {
        console.error('Error handling offline state:', error);
      }
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedCustomer, sortField, sortOrder, verificationFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('customer-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
        setVisibleCustomersCount(INITIAL_CUSTOMERS_TO_SHOW);
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('category-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('verification-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsVerificationDropdownOpen(false);
      }
    };

    if (isVerificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVerificationDropdownOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedColors, fetchedCategories] = await Promise.all([getColors(), getCategories()]);
      setColors(fetchedColors);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSaveNewColor = async (newColor: Omit<PantoneColor, 'id'>) => {
    try {
      await saveColor(newColor);
      await loadData();
      setIsNewColorModalOpen(false);
      toast.success('Цвет успешно добавлен');
    } catch (error) {
      if (error instanceof Error && error.message !== 'offline') {
        console.error('Error saving color:', error);
        toast.error('Ошибка при сохранении цвета');
      }
    }
  };

  const handleUpdateColor = async (updatedColor: PantoneColor) => {
    try {
      await updateColor(updatedColor);
      await loadData();
      setIsEditModalOpen(false);
      toast.success('Цвет успешно обновлен');
    } catch (error) {
      if (error instanceof Error && error.message !== 'offline') {
        console.error('Error updating color:', error);
        toast.error('Ошибка при обновлении цвета');
      }
    }
  };

  const handleDeleteColor = async (colorId: string) => {
    try {
      await deleteColor(colorId);
      await loadData();
      toast.success('Цвет успешно удален');
    } catch (error) {
      if (error instanceof Error && error.message !== 'offline') {
        console.error('Error deleting color:', error);
        toast.error('Ошибка при удалении цвета');
      }
    }
  };

  const handleAddCategory = async (categoryName: string) => {
    try {
      await addCategory(categoryName);
      await loadData();
      setIsNewCategoryModalOpen(false);
      toast.success('Категория успешно добавлена');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Ошибка при добавлении категории');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    try {
      await deleteCategory(categoryName);
      await loadData();
      if (selectedCategory === categoryName) {
        setSelectedCategory('all');
      }
      toast.success('Категория успешно удалена');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Ошибка при удалении категории');
    }
  };

  const getAllCustomers = () => {
    const customersSet = new Set<string>();
    colors.forEach((color) => {
      color.customers?.forEach((customer) => {
        customersSet.add(customer);
      });
    });
    return Array.from(customersSet).sort();
  };

  const handleLoadMoreCustomers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleCustomersCount((prev) => prev + CUSTOMERS_TO_LOAD_MORE);
  };

  const filteredColors = colors
    .filter((color) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        color.name.toLowerCase().includes(searchLower) ||
        color.alternativeName?.toLowerCase().includes(searchLower) ||
        false ||
        color.hex.toLowerCase().includes(searchLower) ||
        color.customers?.some((customer) => customer.toLowerCase().includes(searchLower)) ||
        false;
      const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
      const matchesCustomer =
        selectedCustomer === 'all' || color.customers?.includes(selectedCustomer) || false;
      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && color.isVerified) ||
        (verificationFilter === 'unverified' && !color.isVerified);
      return matchesSearch && matchesCategory && matchesCustomer && matchesVerification;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortField === 'createdAt') {
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      } else {
        return sortOrder === 'asc'
          ? Number(b.inStock) - Number(a.inStock)
          : Number(a.inStock) - Number(b.inStock);
      }
    });

  const paginatedColors = filteredColors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const totalPages = Math.ceil(filteredColors.length / ITEMS_PER_PAGE);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 ${
          isDark ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
        } shadow-lg border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className={`lg:hidden p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3">
                <h1
                  className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                    isDark ? 'text-white' : 'text-gray-900'
                  } flex items-center gap-2`}>
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    Pantone Color Manager
                  </span>
                  {user?.isAdmin && (
                    <div className="flex items-center">
                      <ShieldAlert
                        className={`w-5 h-5 ${
                          isDark ? 'text-blue-400 animate-pulse' : 'text-blue-600 animate-pulse'
                        }`}
                      />
                    </div>
                  )}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                {isDark ? (
                  <Sun className="w-5 h-5 transform hover:rotate-12 transition-transform duration-200" />
                ) : (
                  <Moon className="w-5 h-5 transform hover:-rotate-12 transition-transform duration-200" />
                )}
              </button>

              <div className="h-6 w-px bg-gray-400/30" />

              <button
                onClick={() => signOut()}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600'
                    : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                }`}>
                <LogOut className="w-4 h-4" />
                <span>Выйти</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed left-0 z-40 w-72 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          isDark ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
        } border-r ${
          isDark ? 'border-gray-700/50' : 'border-gray-200/50'
        } top-16 bottom-0 shadow-xl`}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto py-6">
            {/* Поиск */}
            <div className="px-6 mb-6">
              <div className={`relative ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2.5 pl-10 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 placeholder-gray-400 border-gray-600 focus:bg-gray-700 focus:ring-2 focus:ring-blue-500'
                      : 'bg-gray-100/50 text-gray-900 placeholder-gray-500 border-gray-200 focus:bg-gray-100 focus:ring-2 focus:ring-blue-500'
                  } border outline-none`}
                />
                <svg
                  className="absolute left-3 top-3 w-4 h-4 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Кнопки админа */}
            {user?.isAdmin && (
              <div className="px-6 space-y-2 mb-6">
                <button
                  onClick={() => {
                    setIsNewColorModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg">
                  <Plus className="w-4 h-4" />
                  <span>Добавить цвет</span>
                </button>
                <button
                  onClick={() => {
                    setIsNewCategoryModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  }`}>
                  <FolderPlus className="w-4 h-4" />
                  <span>Добавить категорию</span>
                </button>
              </div>
            )}

            {/* Категории */}
            <div className="px-6 mb-6">
              <h2
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } uppercase tracking-wider`}>
                Категории
              </h2>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                    if (!isCategoryDropdownOpen) {
                      setIsCustomerDropdownOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" />
                    <span className="truncate">
                      {selectedCategory === 'all' ? 'Все категории' : selectedCategory}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 
                    ${isCategoryDropdownOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {isCategoryDropdownOpen && (
                  <div
                    id="category-dropdown"
                    className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setIsCategoryDropdownOpen(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
                          isDark
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                      Все категории
                    </button>

                    {categories.map((category) => (
                      <div key={category} className="flex items-center group">
                        <button
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsCategoryDropdownOpen(false);
                            setSidebarOpen(false);
                          }}
                          className={`flex-1 text-left px-4 py-2.5 transition-colors duration-200
                            ${
                              selectedCategory === category
                                ? isDark
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-900'
                                : isDark
                                ? 'hover:bg-gray-700/50 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}>
                          {category}
                        </button>
                        {user?.isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Вы точно хотите удалить категорию "${category}"?`)) {
                                handleDeleteCategory(category);
                              }
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Trash2
                              className={`w-4 h-4 ${
                                isDark ? 'text-red-400' : 'text-red-500'
                              } hover:text-red-600`}
                            />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Заказчики */}
            <div className="px-6 mb-6">
              <h2
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } uppercase tracking-wider`}>
                Заказчики
              </h2>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCustomerDropdownOpen(!isCustomerDropdownOpen);
                    if (!isCustomerDropdownOpen) {
                      setIsCategoryDropdownOpen(false);
                    } else {
                      setVisibleCustomersCount(INITIAL_CUSTOMERS_TO_SHOW);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="truncate">
                      {selectedCustomer === 'all' ? 'Все заказчики' : selectedCustomer}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 
                    ${isCustomerDropdownOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {isCustomerDropdownOpen && (
                  <div
                    id="customer-dropdown"
                    className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => {
                        setSelectedCustomer('all');
                        setIsCustomerDropdownOpen(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
                          isDark
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                      Все заказчики
                    </button>

                    {getAllCustomers()
                      .slice(0, visibleCustomersCount)
                      .map((customer) => (
                        <button
                          key={customer}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsCustomerDropdownOpen(false);
                            setSidebarOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                            ${
                              selectedCustomer === customer
                                ? isDark
                                  ? 'bg-gray-700 text-white'
                                  : 'bg-gray-100 text-gray-900'
                                : isDark
                                ? 'hover:bg-gray-700/50 text-gray-300'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}>
                          {customer}
                        </button>
                      ))}

                    {getAllCustomers().length > visibleCustomersCount && (
                      <button
                        onClick={handleLoadMoreCustomers}
                        className={`w-full text-center px-4 py-2.5 transition-colors duration-200 border-t
                          ${
                            isDark
                              ? 'hover:bg-gray-700/50 text-blue-400 border-gray-700'
                              : 'hover:bg-gray-100 text-blue-600 border-gray-200'
                          }`}>
                        Показать ещё
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Статус проверки */}
            <div className="px-6 mb-6">
              <h2
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } uppercase tracking-wider`}>
                Статус проверки
              </h2>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVerificationDropdownOpen(!isVerificationDropdownOpen);
                    if (!isVerificationDropdownOpen) {
                      setIsCustomerDropdownOpen(false);
                      setIsCategoryDropdownOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="truncate">
                      {verificationFilter === 'all'
                        ? 'Все цвета'
                        : verificationFilter === 'verified'
                        ? 'Проверенные'
                        : 'Непроверенные'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 
                    ${isVerificationDropdownOpen ? 'transform rotate-180' : ''}`}
                  />
                </button>

                {isVerificationDropdownOpen && (
                  <div
                    id="verification-dropdown"
                    className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
                    ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={() => {
                        setVerificationFilter('all');
                        setIsVerificationDropdownOpen(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
                          verificationFilter === 'all'
                            ? isDark
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                      Все цвета
                    </button>
                    <button
                      onClick={() => {
                        setVerificationFilter('verified');
                        setIsVerificationDropdownOpen(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
                          verificationFilter === 'verified'
                            ? isDark
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                      Проверенные
                    </button>
                    <button
                      onClick={() => {
                        setVerificationFilter('unverified');
                        setIsVerificationDropdownOpen(false);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
                          verificationFilter === 'unverified'
                            ? isDark
                              ? 'bg-gray-700 text-white'
                              : 'bg-gray-100 text-gray-900'
                            : isDark
                            ? 'hover:bg-gray-700/50 text-gray-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                      Непроверенные
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Сортировка */}
            <div className="px-6 mt-6">
              <h2
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } uppercase tracking-wider`}>
                Сортировка
              </h2>
              <SortControls
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field) => {
                  handleSortChange(field as SortField);
                  setSidebarOpen(false);
                }}
              />
            </div>

            {/* Кнопка выхода */}
            <button
              onClick={() => signOut()}
              className={`mt-auto mx-6 mb-6 sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
              }`}>
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-72 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <SkeletonColorCard key={index} />
              ))
            ) : filteredColors.length === 0 ? (
              <div
                className={`col-span-full text-center py-12 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                <p className="text-lg">Ничего не найдено</p>
              </div>
            ) : (
              paginatedColors.map((color) => (
                <ColorCard
                  key={color.id}
                  color={color}
                  colors={colors}
                  onEdit={() => {
                    if (user?.isAdmin) {
                      setSelectedColor(color);
                      setIsEditModalOpen(true);
                    }
                  }}
                  onClick={() => {
                    setSelectedColor(color);
                    setIsDetailsModalOpen(true);
                  }}
                  onDelete={() => {
                    if (user?.isAdmin && confirm('Вы точно хотите удалить этот цвет?')) {
                      handleDeleteColor(color.id);
                    }
                  }}
                  isAdmin={user?.isAdmin || false}
                />
              ))
            )}
          </div>

          {/* Добавьте пагинацию */}
          {!isLoading && filteredColors.length > 0 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                    : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
                }`}>
                Назад
              </button>

              <span className={`px-4 py-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {currentPage} из {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
                    : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
                }`}>
                Вперед
              </button>
            </div>
          )}
        </div>
      </main>

      {selectedColor && (
        <>
          <EditColorModal
            color={selectedColor}
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedColor(null);
            }}
            onSave={handleUpdateColor}
            categories={categories}
            existingCustomers={getAllCustomers()}
          />

          <ColorDetailsModal
            color={selectedColor}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedColor(null);
            }}
            similarColors={getSimilarColors(selectedColor, colors).similarColors}
            similarRecipes={getSimilarColors(selectedColor, colors).similarRecipes}
          />
        </>
      )}

      <NewColorModal
        isOpen={isNewColorModalOpen}
        onClose={() => setIsNewColorModalOpen(false)}
        onSave={handleSaveNewColor}
        categories={categories}
        existingCustomers={getAllCustomers()}
      />

      <NewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        onSave={handleAddCategory}
        existingCategories={categories}
      />
    </div>
  );
}
