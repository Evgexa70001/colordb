import { useTheme } from '@contexts/ThemeContext';

interface ColorInfoProps {
  colorInfo: {
    cmyk: { c: number; m: number; y: number; k: number };
  };
  labValues?: { l: number; a: number; b: number };
  isLabManual?: boolean;
}

export default function ColorInfo({ labValues, isLabManual }: ColorInfoProps) {
  const { isDark } = useTheme();

  const sectionClass = `p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`;
  const titleClass = `text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  const labelClass = `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="space-y-6">
      <div className={sectionClass}>
        <h3 className={titleClass}>LAB {isLabManual ? '(введено вручную)' : '(вычислено из HEX)'}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={labelClass}>L</p>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {labValues?.l.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={labelClass}>a</p>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {labValues?.a.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={labelClass}>b</p>
            <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              {labValues?.b.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
