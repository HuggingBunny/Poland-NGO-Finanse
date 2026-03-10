import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Globe, Eye, EyeOff, Building2, Lock, User } from 'lucide-react';
import { demoCredentials } from '../../data/mockData';
import i18n from '../../i18n';

export function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ok = await login(username, password);
    if (!ok) {
      setError(t('auth.loginError'));
    }
    setLoading(false);
  };

  const fillDemo = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
    setError('');
  };

  const toggleLang = () => {
    const next = i18n.language === 'pl' ? 'en' : 'pl';
    i18n.changeLanguage(next);
    localStorage.setItem('app_language', next);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      {/* Controls top right */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 shadow text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'pl' ? 'EN' : 'PL'}
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col justify-center p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('app.name')}</h1>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{t('app.orgName')}</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">{t('app.tagline')}</p>

          <div className="space-y-4">
            {[
              { icon: '🧾', text: i18n.language === 'pl' ? 'Automatyczna klasyfikacja paragonów przez AI' : 'Automatic receipt classification via AI' },
              { icon: '📊', text: i18n.language === 'pl' ? 'Raporty finansowe zgodne z polskim prawem' : 'Financial reports compliant with Polish law' },
              { icon: '👥', text: i18n.language === 'pl' ? 'Zarządzanie płacami i składkami ZUS' : 'Payroll and ZUS contribution management' },
              { icon: '📋', text: i18n.language === 'pl' ? 'Fakturowanie z obsługą KSeF (2026)' : 'Invoicing with KSeF support (2026)' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/10 rounded-lg backdrop-blur-sm">
                <span className="text-xl">{item.icon}</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
            <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              {i18n.language === 'pl'
                ? '🔒 Dane przetwarzane lokalnie. Żadne informacje nie wychodzą poza sieć organizacji.'
                : '🔒 Data processed locally. No information leaves your organization\'s network.'}
            </p>
          </div>
        </div>

        {/* Right: Login form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{t('app.name')}</h1>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('app.orgName')}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('auth.login')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {i18n.language === 'pl' ? 'Wprowadź dane logowania aby kontynuować.' : 'Enter your credentials to continue.'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={i18n.language === 'pl' ? 'np. admin' : 'e.g. admin'}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : t('auth.loginButton')}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">{t('auth.demoAccounts')}</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="space-y-2">
              {demoCredentials.map((cred, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillDemo(cred.username, cred.password)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white font-mono">{cred.username}</span>
                    <span className="text-xs text-gray-400 mx-1">/</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{cred.password}</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {i18n.language === 'pl' ? cred.role : cred.roleEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
