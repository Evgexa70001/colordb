import { useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogOut, Menu, ShieldAlert } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSidebarOpen?: () => void;
}

export default function Header({ onSidebarOpen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 ${
        isDark ? 'bg-gray-800/95 backdrop-blur-sm' : 'bg-white/95 backdrop-blur-sm'
      } shadow-lg border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            {onSidebarOpen && (
              <button
                onClick={onSidebarOpen}
                className={`lg:hidden p-2 rounded-xl transition-colors duration-200 ${
                  isDark
                    ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}>
                <Menu className="w-6 h-6" />
              </button>
            )}

            <div className="flex items-center gap-6">
              <h1
                className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                } flex items-center gap-2`}>
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Color Manager
                </span>
                {user?.isAdmin && (
                  <div className="flex items-center">
                    <ShieldAlert
                      className={`w-5 h-5 ${
                        isDark ? 'text-blue-400 animate-pulse' : 'text-blue-600 animate-pulse'
                      }`}
                    />
                  </div>
                )}
              </h1>

              <nav className="hidden sm:flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    location.pathname === '/'
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                  Pantone
                </button>
                <button
                  onClick={() => navigate('/equipment')}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    location.pathname === '/equipment'
                      ? isDark
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
                      : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}>
                  Оборудование
                </button>
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-200'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}>
              {isDark ? (
                <Sun className="w-5 h-5 transform hover:rotate-12 transition-transform duration-200" />
              ) : (
                <Moon className="w-5 h-5 transform hover:-rotate-12 transition-transform duration-200" />
              )}
            </button>

            <div className="h-6 w-px bg-gray-400/30" />

            <button
              onClick={() => signOut()}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
              }`}>
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
