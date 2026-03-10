import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as PieTooltip,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Wallet, Receipt, FileText, CreditCard } from 'lucide-react';
import { mockMonthlyData, mockExpensePieData, mockTransactions } from '../../../data/mockData';
import clsx from 'clsx';

function formatPLN(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

interface SummaryCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function SummaryCard({ title, value, change, icon: Icon, color, subtitle }: SummaryCardProps) {
  const isPositive = change >= 0;
  const TrendIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={clsx('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          isPositive ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/30'
        )}>
          <TrendIcon className="w-3 h-3" />
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatPLN(value)}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatPLN(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DashboardModule() {
  const { t } = useTranslation();

  const summaryCards = [
    {
      title: t('dashboard.income'),
      value: 35800,
      change: 14.7,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      subtitle: t('dashboard.thisMonth'),
    },
    {
      title: t('dashboard.expenses'),
      value: 26300,
      change: -6.1,
      icon: CreditCard,
      color: 'bg-red-500',
      subtitle: t('dashboard.thisMonth'),
    },
    {
      title: t('dashboard.balance'),
      value: 78420,
      change: 8.3,
      icon: Wallet,
      color: 'bg-blue-500',
      subtitle: 'Stan na dziś',
    },
    {
      title: t('dashboard.pendingInvoices'),
      value: 22972.50,
      change: 0,
      icon: FileText,
      color: 'bg-amber-500',
      subtitle: '3 faktury wystawione',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <SummaryCard key={i} {...card} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line chart - cash flow */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.cashFlow')}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mockMonthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t('dashboard.income_label')}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={t('dashboard.expense_label')}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                name="Saldo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.expensesByCategory')}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={mockExpensePieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {mockExpensePieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <PieTooltip formatter={(value: number) => formatPLN(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {mockExpensePieData.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">{formatPLN(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('dashboard.recentTransactions')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('common.date')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('dashboard.transaction')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('dashboard.vendor')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('common.category')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('common.amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {mockTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{tx.date}</td>
                  <td className="px-3 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                    <div className="truncate">{tx.description}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{tx.vendor}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-right whitespace-nowrap">
                    <span className={tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                      {tx.type === 'income' ? '+' : '-'}{formatPLN(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
