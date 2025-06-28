import { ChevronDown } from 'lucide-react';
import { ReactNode } from 'react';
import { useTheme } from '@contexts/ThemeContext';

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownSelectProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
  title?: string;
  customOptionRender?: (option: DropdownOption) => ReactNode;
  showMoreButton?: {
    show: boolean;
    onClick: (e: React.MouseEvent) => void;
    label: string;
  };
}

export function DropdownSelect({
  value,
  options,
  onChange,
  icon,
  label,
  isOpen,
  onToggle,
  id,
  title,
  customOptionRender,
  showMoreButton,
}: DropdownSelectProps) {
  const { isDark } = useTheme();

  return (
    <div>
      {title && (
        <h2
          className={`text-sm font-semibold mb-3 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          } uppercase tracking-wider`}>
          {title}
        </h2>
      )}

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
            isDark
              ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
              : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
          } border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            {icon}
            <span className="truncate">
              {options.find((opt) => opt.id === value)?.label || label}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 
            ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            id={id}
            className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
            transform transition-all duration-300 ease-out origin-top
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            ${
              isOpen
                ? 'opacity-100 scale-y-100 translate-y-0'
                : 'opacity-0 scale-y-0 -translate-y-2'
            }`}>
            {options.map((option) =>
              customOptionRender ? (
                customOptionRender(option)
              ) : (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    onToggle();
                  }}
                  className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                    ${
                      value === option.id
                        ? isDark
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDark
                        ? 'hover:bg-gray-700/50 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}>
                  {option.label}
                </button>
              ),
            )}

            {showMoreButton?.show && (
              <button
                onClick={showMoreButton.onClick}
                className={`w-full text-center px-4 py-2.5 transition-colors duration-200 border-t
                  ${
                    isDark
                      ? 'hover:bg-gray-700/50 text-blue-400 border-gray-700'
                      : 'hover:bg-gray-100 text-blue-600 border-gray-200'
                  }`}>
                {showMoreButton.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
