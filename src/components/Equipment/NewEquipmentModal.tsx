import { Dialog } from '@headlessui/react';
import { useTheme } from '@contexts/ThemeContext';
import { Plus, X, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { saveEquipment, updateEquipment } from '@lib/equipment';
import toast from 'react-hot-toast';
import type { Equipment } from '@/types';
import { uploadToImgur } from '@lib/imgur';
import { getCustomers } from '@lib/customers';
import type { PantoneColor } from '@/types';

interface Section {
  anilox: string;
  paint: string;
  additionalInfo: string;
  imageUrl?: string;
}

interface SectionGroup {
  name: string;
  material: string;
  date: string;
  imageUrl?: string;
  sections: Section[];
}

interface NewEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Equipment;
  colors: PantoneColor[];
}

export default function NewEquipmentModal({
  isOpen,
  onClose,
  initialData,
  colors,
}: NewEquipmentModalProps) {
  const { isDark } = useTheme();

  const [paintSuggestions, setPaintSuggestions] = useState<PantoneColor[]>([]);

  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>([]);
  // const [customers, setCustomers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const loadedCustomers = await getCustomers();
      setExistingCustomers(loadedCustomers);
    };
    loadCustomers();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSectionGroups(
          initialData.groups.map((group) => ({
            ...group,
            imageUrl: group === initialData.groups[0] ? initialData.imageUrl : undefined,
          })),
        );
        setSelectedCustomers(initialData.customers || []);
      } else {
        setSectionGroups([{ name: '', material: '', date: '', sections: [] }]);
        setSelectedCustomers([]);
      }
    }
  }, [isOpen, initialData]);

  const addSectionGroup = () => {
    setSectionGroups([...sectionGroups, { name: '', material: '', date: '', sections: [] }]);
  };

  const addSection = (groupIndex: number) => {
    setSectionGroups(
      sectionGroups.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              sections: [
                ...group.sections,
                { anilox: '', paint: '', additionalInfo: '', imageUrl: '' },
              ],
            }
          : group,
      ),
    );
  };

  const updateSection = (groupIndex: number, sectionIndex: number, updates: Partial<Section>) => {
    setSectionGroups(
      sectionGroups.map((group, gIndex) =>
        gIndex === groupIndex
          ? {
              ...group,
              sections: group.sections.map((section, sIndex) =>
                sIndex === sectionIndex ? { ...section, ...updates } : section,
              ),
            }
          : group,
      ),
    );
  };

  const removeSection = (groupIndex: number, sectionIndex: number) => {
    setSectionGroups(
      sectionGroups.map((group, gIndex) =>
        gIndex === groupIndex
          ? {
              ...group,
              sections: group.sections.filter((_, index) => index !== sectionIndex),
            }
          : group,
      ),
    );
  };

  const updateGroupField = (groupIndex: number, field: keyof SectionGroup, value: string) => {
    setSectionGroups(
      sectionGroups.map((group, index) =>
        index === groupIndex ? { ...group, [field]: value } : group,
      ),
    );
  };

  const uploadImage = async (file: File, groupIndex: number) => {
    try {
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error('Размер файла не должен превышать 10MB');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Поддерживаются только форматы JPG и PNG');
        return;
      }

      toast.loading('Загрузка изображения...', { id: 'uploadImage' });
      const imageUrl = await uploadToImgur(file);

      setSectionGroups((prevGroups) =>
        prevGroups.map((group, index) =>
          index === groupIndex
            ? {
                ...group,
                imageUrl,
              }
            : group,
        ),
      );

      toast.success('Изображение успешно загружено', { id: 'uploadImage' });
    } catch (error) {
      console.error('Ошибка при загрузке изображения:', error);
      toast.error(error instanceof Error ? error.message : 'Ошибка при загрузке изображения', {
        id: 'uploadImage',
      });
    }
  };

  const handleSave = async () => {
    try {
      if (!sectionGroups.some((group) => group.name.trim())) {
        toast.error('Добавьте название хотя бы для одной грппы');
        return;
      }

      const imageUrl = sectionGroups[0]?.imageUrl || '';

      const validGroups = sectionGroups
        .filter((group) => group.name.trim())
        .map(({ imageUrl: _, ...group }) => ({
          ...group,
          sections: group.sections.map((section) => ({
            anilox: section.anilox || '',
            paint: section.paint || '',
            additionalInfo: section.additionalInfo || '',
          })),
        }));

      const equipmentData = {
        groups: validGroups,
        imageUrl,
        customers: selectedCustomers,
        createdAt: new Date(),
      };

      if (initialData) {
        await updateEquipment(initialData.id, equipmentData);
        toast.success('Настройки успешно обновлены');
      } else {
        await saveEquipment(equipmentData);
        toast.success('Настройки успешно сохранены');
      }

      onClose();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error('Ошибка при сохранении настроек');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-xl w-full rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
          <Dialog.Title
            className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {initialData ? 'Редактировать настройки' : 'Добавить настройки'}
          </Dialog.Title>

          <div className="space-y-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                Заказчики
              </label>
              <div className="space-y-2">
                <select
                  multiple
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    setSelectedCustomers((prev) => [...new Set([...prev, ...selected])]);
                  }}>
                  {existingCustomers
                    .filter((customer) => !selectedCustomers.includes(customer))
                    .map((customer) => (
                      <option key={customer} value={customer}>
                        {customer}
                      </option>
                    ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  {selectedCustomers.map((customer) => (
                    <div
                      key={customer}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center gap-2 ${
                        isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {customer}
                      <button
                        onClick={() =>
                          setSelectedCustomers((prev) => prev.filter((c) => c !== customer))
                        }
                        className="hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {sectionGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-4">
                {groupIndex > 0 && (
                  <div className={`h-px w-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} my-6`} />
                )}

                <div className="flex justify-between items-start">
                  <label
                    htmlFor={`name-${groupIndex}`}
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Название
                  </label>
                  {groupIndex > 0 && (
                    <button
                      onClick={() => {
                        setSectionGroups(sectionGroups.filter((_, index) => index !== groupIndex));
                      }}
                      className={`p-2 rounded-xl transition-colors duration-200 ${
                        isDark
                          ? 'bg-red-500/10 text-red-400 hover:text-red-300'
                          : 'bg-red-50 text-red-500 hover:text-red-600'
                      }`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    id={`name-${groupIndex}`}
                    value={group.name}
                    onChange={(e) => updateGroupField(groupIndex, 'name', e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Введите название этикетки"
                  />
                </div>

                {groupIndex === 0 && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      Изображение
                    </label>
                    <div className="flex gap-4 items-start">
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            uploadImage(files[0], groupIndex);
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl border ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {group.imageUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden">
                          <img
                            src={group.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Preview image load error:', e);
                              e.currentTarget.src = '';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor={`material-${groupIndex}`}
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Материал
                  </label>
                  <input
                    list="materials"
                    id={`material-${groupIndex}`}
                    value={group.material}
                    onChange={(e) => updateGroupField(groupIndex, 'material', e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Выберите или введите материал"
                  />
                  <datalist id="materials">
                    <option value="PP" />
                    <option value="PE" />
                    <option value="PET" />
                  </datalist>
                </div>

                <div>
                  <label
                    htmlFor={`date-${groupIndex}`}
                    className={`block text-sm font-medium mb-1 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Дата
                  </label>
                  <input
                    type="date"
                    id={`date-${groupIndex}`}
                    value={group.date}
                    onChange={(e) => updateGroupField(groupIndex, 'date', e.target.value)}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {group.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className={`p-4 rounded-lg border ${
                      isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Секция {sectionIndex + 1}
                      </h3>
                      <button
                        type="button"
                        onClick={() => removeSection(groupIndex, sectionIndex)}
                        className={`p-1 rounded-full ${
                          isDark
                            ? 'hover:bg-gray-600 text-gray-400'
                            : 'hover:bg-gray-200 text-gray-500'
                        }`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                          Анилокс
                        </label>
                        <input
                          list="aniloxes"
                          value={section.anilox}
                          onChange={(e) =>
                            updateSection(groupIndex, sectionIndex, { anilox: e.target.value })
                          }
                          className={`w-full px-4 py-2 rounded-xl border ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          placeholder="Выберите или введите анилокс"
                        />
                        <datalist id="aniloxes">
                          <option value="4.5" />
                          <option value="3.5" />
                          <option value="2.5" />
                        </datalist>
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                          Краска
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={section.paint}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateSection(groupIndex, sectionIndex, { paint: value });
                              // Фильтруем краски при вводе
                              const suggestions = colors
                                .filter(
                                  (color) =>
                                    color.name.toLowerCase().includes(value.toLowerCase()) ||
                                    (color.alternativeName &&
                                      color.alternativeName
                                        .toLowerCase()
                                        .includes(value.toLowerCase())),
                                )
                                .slice(0, 5);
                              setPaintSuggestions(suggestions);
                            }}
                            onFocus={() => {
                              // Показываем все краски при фокусе, если поле пустое
                              if (!section.paint) {
                                setPaintSuggestions(colors.slice(0, 5));
                              }
                            }}
                            className={`w-full px-4 py-2 rounded-xl border ${
                              isDark
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Введите название краски"
                          />
                          {paintSuggestions.length > 0 && (
                            <div
                              className={`absolute z-50 w-full mt-1 rounded-xl border shadow-lg ${
                                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                              {paintSuggestions.map((color, index) => (
                                <button
                                  key={index}
                                  className={`w-full text-left px-4 py-2 first:rounded-t-xl last:rounded-b-xl flex items-center gap-3 ${
                                    isDark
                                      ? 'text-white hover:bg-gray-600'
                                      : 'text-gray-900 hover:bg-gray-50'
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateSection(groupIndex, sectionIndex, { paint: color.name });
                                    setPaintSuggestions([]);
                                  }}>
                                  <div
                                    className="w-4 h-4 rounded-md border"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                  <span>{color.name}</span>
                                  {color.alternativeName && (
                                    <span
                                      className={`text-sm ${
                                        isDark ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                      ({color.alternativeName})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}>
                          Дополнительная информация
                        </label>
                        <textarea
                          value={section.additionalInfo}
                          onChange={(e) =>
                            updateSection(groupIndex, sectionIndex, {
                              additionalInfo: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-2 rounded-xl border ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          rows={3}
                          placeholder="Введите дополнительную информацию"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSection(groupIndex)}
                  className="w-full px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Добавить секцию
                  </span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addSectionGroup}
              className={`w-full px-4 py-2 rounded-xl ${
                isDark
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } transition-colors duration-200`}>
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Добавить другие настройки
              </span>
            </button>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl transition-colors duration-200 ${
                  isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                Отмена
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200">
                Добавить
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
