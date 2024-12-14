import { useState, useEffect } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import Header from './Header';

import {
  EquipmentCard,
  EquipmentDataCard,
  NewEquipmentModal,
  SkeletonEquipmentCard,
  EquipmentSortControls,
} from './Equipment';

import { getEquipment } from '@lib/equipment';
import type { Equipment, PantoneColor } from '@/types';
import toast from 'react-hot-toast';
import { getColors } from '@lib/colors';

// Добавляем типы для сортировки
type SortField = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export default function Equipment() {
  const { isDark } = useTheme();
  const [isNewEquipmentModalOpen, setIsNewEquipmentModalOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | undefined>(undefined);
  const [cardCount, setCardCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [visibleCustomersCount, setVisibleCustomersCount] = useState(10);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [colors, setColors] = useState<PantoneColor[]>([]);

  const loadEquipment = async () => {
    try {
      setIsLoading(true);
      const data = await getEquipment();
      setEquipment(data);
      setCardCount(data.length);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    loadEquipment();
  };

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsNewEquipmentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewEquipmentModalOpen(false);
    setSelectedEquipment(undefined);
    loadEquipment();
  };

  useEffect(() => {
    loadEquipment();
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
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('customer-dropdown');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
        setVisibleCustomersCount(10);
      }
    };

    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

  const getAllCustomers = () => {
    const customersSet = new Set<string>();
    equipment.forEach((item) => {
      item.customers?.forEach((customer) => {
        customersSet.add(customer);
      });
    });
    return Array.from(customersSet).sort();
  };

  const handleLoadMoreCustomers = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleCustomersCount((prev) => prev + 10);
  };

  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredEquipment = equipment
    .filter((item) => {
      const matchesSearch = item.groups.some((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      const matchesCustomer =
        selectedCustomer === 'all' || item.customers?.includes(selectedCustomer) || false;
      return matchesSearch && matchesCustomer;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.groups[0]?.name || '';
        const nameB = b.groups[0]?.name || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else {
        // Обрабатываем Timestamp из Firebase
        const getTime = (date: any) => {
          if (date?.seconds) {
            return date.seconds * 1000;
          }
          return date instanceof Date ? date.getTime() : 0;
        };

        const timeA = getTime(a.createdAt);
        const timeB = getTime(b.createdAt);
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
    });

  useEffect(() => {
    const loadColors = async () => {
      const data = await getColors();
      setColors(data);
    };
    loadColors();
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header onSidebarOpen={() => setSidebarOpen(true)} />

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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* После поиска добавляем секцию заказчиков */}
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
                      setVisibleCustomersCount(10);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
                  } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <span className="truncate">
                    {selectedCustomer === 'all' ? 'Все заказчики' : selectedCustomer}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isCustomerDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
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

            {/* Сортировка */}
            <div className="px-6 mt-6">
              <h2
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                } uppercase tracking-wider`}>
                Сортировка
              </h2>
              <EquipmentSortControls
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={(field) => {
                  handleSortChange(field);
                  setSidebarOpen(false);
                }}
              />
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <EquipmentCard isAddCard onClick={() => setIsNewEquipmentModalOpen(true)} />
            {isLoading
              ? [...Array(cardCount)].map((_, index) => <SkeletonEquipmentCard key={index} />)
              : filteredEquipment.map((item) => (
                  <EquipmentDataCard
                    key={item.id}
                    equipment={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={handleDelete}
                    colors={colors}
                  />
                ))}
          </div>
        </div>
      </main>

      <NewEquipmentModal
        isOpen={isNewEquipmentModalOpen}
        onClose={handleCloseModal}
        initialData={selectedEquipment}
        colors={colors}
      />
    </div>
  );
}
