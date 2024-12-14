import { useTheme } from '@contexts/ThemeContext';
import { Pencil, Trash2, Image } from 'lucide-react';
import type { Equipment, PantoneColor } from '@/types';
import { deleteEquipment } from '@/lib/equipment';
import toast from 'react-hot-toast';
import { useState } from 'react';

import { ImagePreviewModal, EquipmentDetailsModal } from '../Equipment';

interface EquipmentDataCardProps {
  equipment: Equipment;
  onEdit: () => void;
  onDelete: () => void;
  colors: PantoneColor[];
}

export default function EquipmentDataCard({
  equipment,
  onEdit,
  onDelete,
  colors,
}: EquipmentDataCardProps) {
  const { isDark } = useTheme();
  const firstGroup = equipment.groups[0];
  const [imageError, setImageError] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const hasImage = equipment.imageUrl && !imageError;

  const handleDelete = async () => {
    if (confirm('Вы уверены, что хотите удалить эти настройки?')) {
      try {
        await deleteEquipment(equipment.id);
        onDelete();
        toast.success('Настройки успешно удалены');
      } catch (error) {
        console.error('Error deleting equipment:', error);
        toast.error('Ошибка при удалении настроек');
      }
    }
  };

  return (
    <>
      <div
        onClick={() => setIsDetailsModalOpen(true)}
        className={`w-full h-[300px] rounded-2xl transition-all duration-200 cursor-pointer ${
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700'
            : 'bg-white hover:bg-gray-50 border-gray-200'
        } border shadow-sm hover:shadow-md p-6`}>
        <div className="h-full flex flex-col gap-4">
          {hasImage ? (
            <div
              className="w-full h-40 rounded-lg overflow-hidden cursor-pointer relative z-10"
              onClick={(e) => {
                e.stopPropagation();
                setIsImagePreviewOpen(true);
              }}>
              <img
                src={equipment.imageUrl}
                alt={`Preview of ${firstGroup.name}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  console.error('Image load error:', e);
                  setImageError(true);
                }}
                loading="lazy"
                crossOrigin="anonymous"
                referrerPolicy="origin"
              />
            </div>
          ) : (
            <div
              className={`w-full h-40 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
              <Image className={`w-12 h-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          )}

          <div className="flex-1 flex flex-col">
            <h3
              className={`font-medium text-lg ${isDark ? 'text-white' : 'text-gray-900'} truncate`}
              title={firstGroup.name}>
              {firstGroup.name}
            </h3>

            <div className={`mt-2 flex-1 space-y-1.5`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Материал:
                </span>
                <span
                  className={`text-sm font-medium ${
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  } truncate`}
                  title={firstGroup.material}>
                  {firstGroup.material}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Дата:
                </span>
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {new Date(firstGroup.date).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Секции:
                </span>
                <span
                  className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {firstGroup.sections.length}
                </span>
              </div>

              {equipment.groups.length > 1 && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-blue-500">
                    +{equipment.groups.length - 1} доп. настроек
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 mt-auto relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className={`p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    : 'bg-gray-100/50 text-gray-600 hover:text-gray-900'
                }`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className={`p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'bg-red-500/10 text-red-400 hover:text-red-300'
                    : 'bg-red-50 text-red-500 hover:text-red-600'
                }`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <EquipmentDetailsModal
        equipment={equipment}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        colors={colors}
      />

      {equipment.imageUrl && (
        <ImagePreviewModal
          isOpen={isImagePreviewOpen}
          onClose={() => setIsImagePreviewOpen(false)}
          imageUrl={equipment.imageUrl}
        />
      )}
    </>
  );
}
