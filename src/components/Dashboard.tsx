import { useState, useEffect } from 'react';
import { Sun, Moon, Plus, FolderPlus, Trash2, ShieldAlert, LogOut, Menu } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ColorCard from './ColorCard';
import SkeletonColorCard from './SkeletonColorCard';
import NewColorModal from './NewColorModal';
import EditColorModal from './EditColorModal';
import ColorDetailsModal from './ColorDetails/ColorDetailsModal';
import NewCategoryModal from './NewCategoryModal';
import NewGroupModal from './NewGroupModal';
import SortControls from './SortControls';
import { getColors, saveColor, updateColor, deleteColor, setOfflineMode } from '../lib/colors';
import { getCategories, addCategory, deleteCategory } from '../lib/categories';
import { getGroups, addGroup, deleteGroup } from '../lib/groups';
import { getColorDistance, isValidHexColor } from '../utils/colorUtils';
import type { PantoneColor } from '../types';
import toast from 'react-hot-toast';

type SortField = 'name' | 'inStock' | 'createdAt';
type SortOrder = 'asc' | 'desc';

const SIMILAR_COLOR_THRESHOLD = 8;
const SKELETON_COUNT = 6;

const getTimestamp = (color: PantoneColor): number => {
  if (!color.createdAt) return 0;

  // Handle Firestore Timestamp
  if (typeof color.createdAt === 'object' && 'seconds' in color.createdAt) {
    const timestamp = color.createdAt as { seconds: number; nanoseconds: number };
    return timestamp.seconds * 1000;
  }

  // Handle string date
  return new Date(color.createdAt).getTime();
};

export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [colors, setColors] = useState<PantoneColor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null);
  const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedColors, fetchedCategories, fetchedGroups] = await Promise.all([
        getColors(),
        getCategories(),
        getGroups(),
      ]);
      setColors(fetchedColors);
      setCategories(fetchedCategories);
      setGroups(fetchedGroups);
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

  const getSimilarColors = (
    targetColor: PantoneColor,
  ): (PantoneColor & { distance?: number })[] => {
    if (!isValidHexColor(targetColor.hex)) return [];

    return colors
      .filter((color) => color.id !== targetColor.id && isValidHexColor(color.hex))
      .map((color) => ({
        ...color,
        distance: getColorDistance(targetColor.hex, color.hex),
      }))
      .filter((color) => (color.distance || 0) <= SIMILAR_COLOR_THRESHOLD)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 6);
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

  const handleAddGroup = async (groupName: string) => {
    try {
      await addGroup(groupName);
      await loadData();
      setIsNewGroupModalOpen(false);
      toast.success('Группа успешно добавлена');
    } catch (error) {
      console.error('Error adding group:', error);
      toast.error('Ошибка при добавлении группы');
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    try {
      await deleteGroup(groupName);
      await loadData();
      if (selectedGroup === groupName) {
        setSelectedGroup('all');
      }
      toast.success('Группа успешно удалена');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Ошибка при удалении группы');
    }
  };

  const filteredColors = colors
    .filter((color) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        color.name.toLowerCase().includes(searchLower) ||
        color.hex.toLowerCase().includes(searchLower) ||
        color.customers?.some((customer) => customer.toLowerCase().includes(searchLower)) ||
        false;
      const matchesCategory = selectedCategory === 'all' || color.category === selectedCategory;
      const matchesGroup = selectedGroup === 'all' || color.group === selectedGroup;
      return matchesSearch && matchesCategory && matchesGroup;
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

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 py-4 px-4 sm:px-6 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-md`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-700">
              <Menu className="w-6 h-6" />
            </button>
            <h1
              className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              } flex items-center gap-2`}>
              Color Manager
              {user?.isAdmin && (
                <ShieldAlert className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${
                isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => signOut()}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}>
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isDark ? 'bg-gray-800' : 'bg-white'} border-r ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        } top-16 bottom-0`}>
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-4">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg ${
                  isDark
                    ? 'bg-gray-700 text-gray-200 placeholder-gray-400 border-gray-600'
                    : 'bg-white text-gray-900 placeholder-gray-500 border-gray-300'
                }`}
              />
            </div>

            {user?.isAdmin && (
              <div className="px-4 space-y-2 mb-4">
                <button
                  onClick={() => {
                    setIsNewColorModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  <span>Добавить цвет</span>
                </button>
                <button
                  onClick={() => {
                    setIsNewCategoryModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                  <FolderPlus className="w-4 h-4" />
                  <span>Добавить категорию</span>
                </button>
                <button
                  onClick={() => {
                    setIsNewGroupModalOpen(true);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-md ${
                    isDark
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}>
                  <FolderPlus className="w-4 h-4" />
                  <span>Добавить группу</span>
                </button>
              </div>
            )}

            <div className="px-4">
              <h2
                className={`text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Категории
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedCategory === 'all'
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                  Все категории
                </button>
                {categories.map((category) => (
                  <div key={category} className="flex items-center">
                    <button
                      onClick={() => {
                        setSelectedCategory(category);
                        setSidebarOpen(false);
                      }}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm ${
                        selectedCategory === category
                          ? isDark
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-200 text-gray-900'
                          : isDark
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      {category}
                    </button>
                    {user?.isAdmin && selectedCategory === category && (
                      <button
                        onClick={() => {
                          if (confirm(`Вы точно хотите удалить категорию "${category}"?`)) {
                            handleDeleteCategory(category);
                          }
                        }}
                        className="p-2">
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
            </div>
            <div className="px-4">
              <h2
                className={`text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                Группы
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedGroup('all');
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    selectedGroup === 'all'
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                  Все группы
                </button>
                {groups.map((group) => (
                  <div key={group} className="flex items-center">
                    <button
                      onClick={() => {
                        setSelectedGroup(group);
                        setSidebarOpen(false);
                      }}
                      className={`flex-1 text-left px-3 py-2 rounded-md text-sm ${
                        selectedGroup === group
                          ? isDark
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-200 text-gray-900'
                          : isDark
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                      {group}
                    </button>
                    {user?.isAdmin && selectedGroup === group && (
                      <button
                        onClick={() => {
                          if (confirm(`Вы точно хотите удалить группу "${group}"?`)) {
                            handleDeleteGroup(group);
                          }
                        }}
                        className="p-2">
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
            </div>

            <div className="px-4 mt-6">
              <h2
                className={`text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
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
          </div>

          <button
            onClick={() => signOut()}
            className={`mt-auto mx-4 mb-4 sm:hidden flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
              isDark
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
            <LogOut className="w-4 h-4" />
            <span>Выйти</span>
          </button>
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
      <main className="lg:pl-64 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              filteredColors.map((color) => (
                <ColorCard
                  key={color.id}
                  color={color}
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
            groups={groups}
          />

          <ColorDetailsModal
            color={selectedColor}
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedColor(null);
            }}
            similarColors={getSimilarColors(selectedColor)}
          />
        </>
      )}

      <NewColorModal
        isOpen={isNewColorModalOpen}
        onClose={() => setIsNewColorModalOpen(false)}
        onSave={handleSaveNewColor}
        categories={categories}
        groups={groups}
      />

      <NewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={() => setIsNewCategoryModalOpen(false)}
        onSave={handleAddCategory}
        existingCategories={categories}
      />
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        onSave={handleAddGroup}
        existingGroups={groups}
      />
    </div>
  );
}
