import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

interface DropdownProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerComponent?: React.ReactNode;
}

export function Dropdown({
  items,
  value,
  onChange,
  placeholder = 'Выберите значение',
  className = '',
  triggerComponent,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (item: string) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {triggerComponent ? (
        <div onClick={() => setIsOpen(!isOpen)} className="relative">
          {React.cloneElement(triggerComponent as React.ReactElement, {
            rightElement: (
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                } absolute right-3 top-1/2 -translate-y-1/2`}
              />
            ),
          })}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2 border rounded-md ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-gray-200'
              : 'bg-white border-gray-300 text-gray-700'
          }`}>
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-md shadow-lg max-h-60 overflow-auto ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border`}>
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-2 text-sm ${
                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
