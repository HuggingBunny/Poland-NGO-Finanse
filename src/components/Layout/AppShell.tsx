import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DashboardModule } from '../modules/Dashboard/DashboardModule';
import { ReceiptsModule } from '../modules/Receipts/ReceiptsModule';
import { BillsModule } from '../modules/Bills/BillsModule';
import { InvoicingModule } from '../modules/Invoicing/InvoicingModule';
import { PayrollModule } from '../modules/Payroll/PayrollModule';
import { ReportsModule } from '../modules/Reports/ReportsModule';
import { SettingsModule } from '../modules/Settings/SettingsModule';
import { useAuth } from '../../contexts/AuthContext';

type Module = 'dashboard' | 'receipts' | 'bills' | 'invoicing' | 'payroll' | 'reports' | 'settings';

const MODULE_TITLE_KEYS: Record<Module, string> = {
  dashboard: 'nav.dashboard',
  receipts: 'nav.receipts',
  bills: 'nav.bills',
  invoicing: 'nav.invoicing',
  payroll: 'nav.payroll',
  reports: 'nav.reports',
  settings: 'nav.settings',
};

export function AppShell() {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Route protection: redirect to allowed module if current not allowed
  const getDefaultForRole = (): Module => {
    if (!user) return 'dashboard';
    if (user.role === 'dyrektor') return 'reports';
    return 'dashboard';
  };

  const handleModuleChange = (mod: Module) => {
    setActiveModule(mod);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardModule />;
      case 'receipts': return <ReceiptsModule />;
      case 'bills': return <BillsModule />;
      case 'invoicing': return <InvoicingModule />;
      case 'payroll': return <PayrollModule />;
      case 'reports': return <ReportsModule />;
      case 'settings': return <SettingsModule />;
      default: return <DashboardModule />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header currentModuleKey={MODULE_TITLE_KEYS[activeModule]} onNavigate={mod => handleModuleChange(mod as Module)} />
        <main className="flex-1 overflow-auto p-6">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
