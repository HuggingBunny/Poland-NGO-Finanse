import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  FilePlus,
  Users,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';
import clsx from 'clsx';

type Module = 'dashboard' | 'receipts' | 'bills' | 'invoicing' | 'payroll' | 'reports' | 'settings' | 'service-providers';

interface SidebarProps {
  activeModule: Module;
  onModuleChange: (module: Module) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: Module;
  icon: React.ElementType;
  labelKey: string;
  allowedRoles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', allowedRoles: ['admin', 'ksiegowa', 'dyrektor', 'wolontariusz'] },
  { id: 'receipts', icon: Receipt, labelKey: 'nav.receipts', allowedRoles: ['admin', 'ksiegowa', 'wolontariusz'] },
  { id: 'bills', icon: FileText, labelKey: 'nav.bills', allowedRoles: ['admin', 'ksiegowa'] },
  { id: 'service-providers', icon: Building2, labelKey: 'nav.serviceProviders', allowedRoles: ['admin', 'ksiegowa'] },
  { id: 'invoicing', icon: FilePlus, labelKey: 'nav.invoicing', allowedRoles: ['admin', 'ksiegowa'] },
  { id: 'payroll', icon: Users, labelKey: 'nav.payroll', allowedRoles: ['admin', 'ksiegowa'] },
  { id: 'reports', icon: BarChart3, labelKey: 'nav.reports', allowedRoles: ['admin', 'ksiegowa', 'dyrektor'] },
  { id: 'settings', icon: Settings, labelKey: 'nav.settings', allowedRoles: ['admin'] },
];

export function Sidebar({ activeModule, onModuleChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter(item =>
    user ? item.allowedRoles.includes(user.role) : false
  );

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-gray-900 dark:bg-gray-950 border-r border-gray-800 dark:border-gray-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center h-16 px-4 border-b border-gray-800', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight truncate">{t('app.name')}</p>
            <p className="text-blue-400 text-xs leading-tight truncate">{t('app.orgName')}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              title={collapsed ? t(item.labelKey) : undefined}
              className={clsx(
                'w-full flex items-center rounded-lg transition-colors text-left',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-gray-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
