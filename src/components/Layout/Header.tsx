import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import i18n from '../../i18n';
import clsx from 'clsx';

interface HeaderProps {
  currentModuleKey: string;
}

export function Header({ currentModuleKey }: HeaderProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(next);
    localStorage.setItem('app_language', next);
  };

  const roleLabels: Record<string, string> = {
    admin: t('roles.admin'),
    ksiegowa: t('roles.ksiegowa'),
    dyrektor: t('roles.dyrektor'),
    wolontariusz: t('roles.wolontariusz'),
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ksiegowa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dyrektor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    wolontariusz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t(currentModuleKey)}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('app.orgName')}</p>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={t('language.toggle')}
        >
          <Globe className="w-4 h-4" />
          <span>{i18n.language === 'pl' ? 'EN' : 'PL'}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={t('theme.toggle')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.displayName}</p>
              <p className={clsx('text-xs px-1.5 py-0.5 rounded-full font-medium leading-tight inline-block', user?.role ? roleColors[user.role] : '')}>
                {user?.role ? roleLabels[user.role] : ''}
              </p>
            </div>
            <ChevronDown className={clsx('w-4 h-4 text-gray-500 transition-transform hidden sm:block', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block', user?.role ? roleColors[user.role] : '')}>
                    {user?.role ? roleLabels[user.role] : ''}
                  </span>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
