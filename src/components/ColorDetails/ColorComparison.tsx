import { useTheme } from '../../contexts/ThemeContext';
import { normalizeHexColor, hexToRgb } from '../../utils/colorUtils';

interface ColorComparisonProps {
  color1: string;
  color2: string;
  name1: string;
  name2: string;
}

export default function ColorComparison({ color1, color2, name1, name2 }: ColorComparisonProps) {
  const { isDark } = useTheme();
  const hex1 = normalizeHexColor(color1);
  const hex2 = normalizeHexColor(color2);
  
  // Получаем RGB значения для смешивания цветов
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  // Смешиваем цвета (простое усреднение)
  const mixedRgb = [
    Math.round((rgb1[0] + rgb2[0]) / 2),
    Math.round((rgb1[1] + rgb2[1]) / 2),
    Math.round((rgb1[2] + rgb2[2]) / 2)
  ];
  
  const mixedColor = `rgb(${mixedRgb[0]}, ${mixedRgb[1]}, ${mixedRgb[2]})`;

  return (
    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        isDark ? 'text-gray-200' : 'text-gray-700'
      }`}>
        Визуальное сравнение
      </h3>
      
      <div className="space-y-6">
        {/* Цвета рядом */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div 
              className="aspect-square w-full rounded-lg shadow-md" 
              style={{ backgroundColor: hex1 }}
            />
            <p className={`text-sm font-medium text-center ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {name1}
            </p>
            <p className={`text-xs font-mono text-center ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {hex1}
            </p>
          </div>
          <div className="space-y-2">
            <div 
              className="aspect-square w-full rounded-lg shadow-md" 
              style={{ backgroundColor: hex2 }}
            />
            <p className={`text-sm font-medium text-center ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {name2}
            </p>
            <p className={`text-xs font-mono text-center ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {hex2}
            </p>
          </div>
        </div>

        {/* Градиент между цветами */}
        <div className="space-y-2">
          <p className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Градиент перехода:
          </p>
          <div 
            className="h-12 rounded-lg shadow-md"
            style={{
              background: `linear-gradient(to right, ${hex1}, ${hex2})`
            }}
          />
        </div>

        {/* Смешанный цвет */}
        <div className="space-y-2">
          <p className={`text-sm font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Смешанный цвет (50/50):
          </p>
          <div className="flex items-center gap-4">
            <div 
              className="w-20 h-20 rounded-lg shadow-md"
              style={{ backgroundColor: mixedColor }}
            />
            <div>
              <p className={`text-xs font-mono ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                R: {mixedRgb[0]}<br/>
                G: {mixedRgb[1]}<br/>
                B: {mixedRgb[2]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}