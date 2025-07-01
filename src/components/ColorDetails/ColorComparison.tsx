import { useTheme } from '@contexts/ThemeContext';
import { normalizeHexColor, hexToRgb } from '@utils/colorUtils';

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
    Math.round((rgb1[2] + rgb2[2]) / 2),
  ];

  const mixedColor = `rgb(${mixedRgb[0]}, ${mixedRgb[1]}, ${mixedRgb[2]})`;

  return (
    <div
      className={`p-6 rounded-xl border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
      <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
        Визуальное сравнение
      </h3>

      <div className="space-y-8">
        {/* Цвета рядом */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div
              className="aspect-square w-full rounded-xl shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: hex1 }}
            />
            <p
              className={`text-sm font-semibold text-center ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
              {name1}
            </p>
            <p
              className={`text-xs font-mono text-center ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {hex1}
            </p>
          </div>
          <div className="space-y-3">
            <div
              className="aspect-square w-full rounded-xl shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: hex2 }}
            />
            <p
              className={`text-sm font-semibold text-center ${
                isDark ? 'text-gray-200' : 'text-gray-700'
              }`}>
              {name2}
            </p>
            <p
              className={`text-xs font-mono text-center ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {hex2}
            </p>
          </div>
        </div>

        {/* Градиент между цветами */}
        <div className="space-y-3">
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Градиент перехода:
          </p>
          <div
            className="h-16 rounded-xl shadow-lg"
            style={{
              background: `linear-gradient(to right, ${hex1}, ${hex2})`,
            }}
          />
        </div>

        {/* Смешанный цвет */}
        <div className="space-y-3">
          <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Смешанный цвет (50/50):
          </p>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-xl shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: mixedColor }}
            />
            <div className="bg-opacity-10 rounded-lg p-3">
              <p className={`text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                R: {mixedRgb[0]}
                <br />
                G: {mixedRgb[1]}
                <br />
                B: {mixedRgb[2]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
