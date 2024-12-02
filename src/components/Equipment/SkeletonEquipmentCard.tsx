import { useTheme } from '../../contexts/ThemeContext';

export default function SkeletonEquipmentCard() {
  const { isDark } = useTheme();

  return (
    <div
      className={`w-full h-[300px] rounded-2xl ${
        isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
      } border p-6 animate-pulse`}>
      <div className="h-full flex flex-col gap-4">
        {/* Skeleton для изображения */}
        <div className={`w-full h-40 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />

        <div className="flex-1">
          {/* Skeleton для заголовка и кнопок */}
          <div className="flex justify-between items-start mb-3">
            <div className={`h-6 w-48 rounded ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
            <div className="flex items-center gap-2 ml-4">
              <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
              <div className={`h-8 w-8 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
            </div>
          </div>

          {/* Skeleton для информации */}
          <div className="space-y-2">
            <div className={`h-4 w-36 rounded ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
            <div className={`h-4 w-24 rounded ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
            <div className={`h-4 w-32 rounded ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
