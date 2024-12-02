import { useTheme } from '../../contexts/ThemeContext';
import { Pencil, Trash2 } from 'lucide-react';
import type { Equipment } from '../../types';
import { deleteEquipment } from '../../lib/equipment';
import toast from 'react-hot-toast';

interface EquipmentDataCardProps {
  equipment: Equipment;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EquipmentDataCard({ equipment, onEdit, onDelete }: EquipmentDataCardProps) {
  const { isDark } = useTheme();
  const firstGroup = equipment.groups[0];

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
    <div
      className={`w-full h-[200px] rounded-2xl transition-all duration-200 ${
        isDark
          ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700'
          : 'bg-white hover:bg-gray-50 border-gray-200'
      } border shadow-sm hover:shadow-md p-6`}>
      <div className="h-full flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <h3
              className={`font-medium text-lg ${
                isDark ? 'text-white' : 'text-gray-900'
              } truncate flex-1`}
              title={firstGroup.name}>
              {firstGroup.name}
            </h3>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={onEdit}
                className={`p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className={`p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'hover:bg-red-500/10 text-red-400 hover:text-red-300'
                    : 'hover:bg-red-50 text-red-500 hover:text-red-600'
                }`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="truncate" title={`Материал: ${firstGroup.material}`}>
              Материал: {firstGroup.material}
            </p>
            <p>Дата: {new Date(firstGroup.date).toLocaleDateString()}</p>
            <p>Количество секций: {firstGroup.sections.length}</p>
            {equipment.groups.length > 1 && (
              <p className="mt-2 text-blue-500">+{equipment.groups.length - 1} доп. настроек</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
