import { Dialog } from '@headlessui/react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Equipment } from '../../types';

interface EquipmentDetailsModalProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentDetailsModal({
  equipment,
  isOpen,
  onClose,
}: EquipmentDetailsModalProps) {
  const { isDark } = useTheme();

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-3xl w-full rounded-2xl ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } p-6 shadow-xl max-h-[90vh] overflow-y-auto`}>
          <div className="space-y-6">
            {equipment.imageUrl && (
              <div className="mb-6">
                <img
                  src={equipment.imageUrl}
                  alt="Preview"
                  className="w-full max-h-[300px] object-contain rounded-lg"
                  loading="lazy"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {equipment.groups.map((group, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl ${
                  isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                } border`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {group.name}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Материал:
                        </span>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                          {group.material}
                        </p>
                      </div>
                      <div>
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          Дата:
                        </span>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                          {new Date(group.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4
                      className={`text-sm font-medium mb-3 ${
                        isDark ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                      Секции ({group.sections.length})
                    </h4>
                    <div className="space-y-4">
                      {group.sections.map((section, sectionIndex) => (
                        <div
                          key={sectionIndex}
                          className={`p-4 rounded-lg ${
                            isDark ? 'bg-gray-700' : 'bg-white'
                          } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className="mb-3">
                            <h5
                              className={`text-sm font-medium ${
                                isDark ? 'text-gray-200' : 'text-gray-700'
                              }`}>
                              Секция {sectionIndex + 1}
                            </h5>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span
                                className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Анилокс:
                              </span>
                              <p
                                className={`text-sm font-medium ${
                                  isDark ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                {section.anilox}
                              </p>
                            </div>
                            <div>
                              <span
                                className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Краска:
                              </span>
                              <p
                                className={`text-sm font-medium ${
                                  isDark ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                {section.paint}
                              </p>
                            </div>
                          </div>
                          {section.additionalInfo && (
                            <div className="mt-2">
                              <span
                                className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Дополнительная информация:
                              </span>
                              <p
                                className={`text-sm font-medium mt-1 ${
                                  isDark ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                {section.additionalInfo}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
