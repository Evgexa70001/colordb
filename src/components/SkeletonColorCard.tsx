import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function SkeletonColorCard() {
  const { isDark } = useTheme();

  const shimmerClass = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r ${
    isDark
      ? 'before:from-transparent before:via-gray-600/10 before:to-transparent'
      : 'before:from-transparent before:via-gray-300/50 before:to-transparent'
  }`;

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`h-40 ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className={`h-6 w-2/3 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-1/3 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>

        <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-4 w-4 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-4 w-1/4 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
          <div className={`h-4 w-full rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-3/4 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        </div>

        <div className={`p-3 rounded-lg space-y-2 ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`h-4 w-4 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-4 w-1/4 rounded ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className={`h-6 w-20 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-6 w-24 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-6 w-16 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`h-6 w-20 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          <div className="flex items-center space-x-2">
            <div className={`h-8 w-8 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
            <div className={`h-8 w-8 rounded-full ${shimmerClass} ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}