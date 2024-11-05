import React from 'react';
import { Dialog } from '@headlessui/react';
import { useTheme } from '../contexts/ThemeContext';
import { getColorInfo, normalizeHexColor } from '../utils/colorUtils';
import type { ColorDetailsModalProps } from '../types';

export default function ColorDetailsModal({
  color,
  isOpen,
  onClose,
  similarColors,
}: ColorDetailsModalProps) {
  const { isDark } = useTheme();
  const normalizedHex = normalizeHexColor(color.hex);
  const colorInfo = getColorInfo(normalizedHex);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`mx-auto max-w-4xl w-full rounded-lg p-6 ${
            isDark ? 'bg-gray-800' : 'bg-white'
          } max-h-[90vh] overflow-y-auto custom-scrollbar`}>
          <div className="flex justify-between items-start mb-6">
            <Dialog.Title
              className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {color.name}
            </Dialog.Title>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                isDark
                  ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}>
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Preview */}
              <div className="space-y-4">
                <div
                  className="w-full aspect-square rounded-lg shadow-lg"
                  style={{ backgroundColor: normalizedHex }}
                />
                <p
                  className={`text-lg font-mono text-center ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                  {normalizedHex}
                </p>
              </div>

              {/* Color Information */}
              <div className="space-y-4">
                {/* RGB Values */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    RGB
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>R</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.rgb.r}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>G</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.rgb.g}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>B</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.rgb.b}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CMYK Values */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    CMYK
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>C</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.cmyk.c}%
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>M</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.cmyk.m}%
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Y</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.cmyk.y}%
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>K</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.cmyk.k}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* LAB Values */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    LAB
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>L</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.lab.l}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>a</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.lab.a}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>b</p>
                      <p className={`font-mono ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        {colorInfo.lab.b}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                    Category
                  </h3>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>{color.category}</p>
                </div>
              </div>
            </div>

            {/* Recipe */}
            {color.recipe && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Recipe
                </h3>
                <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {color.recipe}
                </p>
              </div>
            )}

            {/* Customers */}
            {color.customers && color.customers.length > 0 && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Customers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {color.customers.map((customer, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${
                        isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                      }`}>
                      {customer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status */}
            <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3
                className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                Status
              </h3>
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm ${
                  color.inStock
                    ? isDark
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-green-100 text-green-800'
                    : isDark
                    ? 'bg-red-900/50 text-red-300'
                    : 'bg-red-100 text-red-800'
                }`}>
                {color.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Similar Colors */}
            {similarColors.length > 0 && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                  Similar Colors
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {similarColors.map((similarColor) => (
                    <div key={similarColor.id} className="space-y-2">
                      <p
                        className={`text-sm font-medium text-center truncate ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        {similarColor.name}
                      </p>
                      <div
                        className="aspect-square w-full rounded-lg shadow-sm"
                        style={{ backgroundColor: normalizeHexColor(similarColor.hex) }}
                      />
                      <p
                        className={`text-xs font-mono text-center ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        {normalizeHexColor(similarColor.hex)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
