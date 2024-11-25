import { useTheme } from '../../contexts/ThemeContext';
import type { ColorInfo } from '../../utils/colorUtils';

interface ColorInfoProps {
  colorInfo: ColorInfo;
}

export default function ColorInfo({ colorInfo }: ColorInfoProps) {
  const { isDark } = useTheme();

  const sectionClass = `p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`;
  const titleClass = `text-lg font-semibold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;
  const labelClass = `text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const valueClass = `font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <div className="space-y-4">
      <div className={sectionClass}>
        <h3 className={titleClass}>RGB</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={labelClass}>R</p>
            <p className={valueClass}>{colorInfo.rgb.r}</p>
          </div>
          <div>
            <p className={labelClass}>G</p>
            <p className={valueClass}>{colorInfo.rgb.g}</p>
          </div>
          <div>
            <p className={labelClass}>B</p>
            <p className={valueClass}>{colorInfo.rgb.b}</p>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>CMYK</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className={labelClass}>C</p>
            <p className={valueClass}>{colorInfo.cmyk.c}%</p>
          </div>
          <div>
            <p className={labelClass}>M</p>
            <p className={valueClass}>{colorInfo.cmyk.m}%</p>
          </div>
          <div>
            <p className={labelClass}>Y</p>
            <p className={valueClass}>{colorInfo.cmyk.y}%</p>
          </div>
          <div>
            <p className={labelClass}>K</p>
            <p className={valueClass}>{colorInfo.cmyk.k}%</p>
          </div>
        </div>
      </div>

      <div className={sectionClass}>
        <h3 className={titleClass}>LAB</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={labelClass}>L</p>
            <p className={valueClass}>{colorInfo.lab.l}</p>
          </div>
          <div>
            <p className={labelClass}>a</p>
            <p className={valueClass}>{colorInfo.lab.a}</p>
          </div>
          <div>
            <p className={labelClass}>b</p>
            <p className={valueClass}>{colorInfo.lab.b}</p>
          </div>
        </div>
      </div>
    </div>
  );
}