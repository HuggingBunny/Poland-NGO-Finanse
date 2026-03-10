import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle, AlertTriangle, Clock, X, AlertCircle, TrendingDown } from 'lucide-react';
import { mockBills } from '../../../data/mockData';
import type { Bill, BillStatus } from '../../../types';
import clsx from 'clsx';

function formatPLN(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

function StatusBadge({ status }: { status: BillStatus }) {
  const { t } = useTranslation();
  const config = {
    nieoplacona: { icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    oplacona: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    przeterminowana: { icon: AlertTriangle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', c.color)}>
      <Icon className="w-3 h-3" />
      {t(`bills.status_${status}`)}
    </span>
  );
}

interface AddBillModalProps {
  onClose: () => void;
  onAdd: (bill: Bill) => void;
}

function AddBillModal({ onClose, onAdd }: AddBillModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    vendor: '',
    invoiceNumber: '',
    description: '',
    amount: '',
    vatAmount: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    category: 'Usługi',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: Bill = {
      id: `b${Date.now()}`,
      vendor: form.vendor,
      invoiceNumber: form.invoiceNumber,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      vatAmount: parseFloat(form.vatAmount) || 0,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: 'nieoplacona',
      category: form.category as Bill['category'],
      notes: form.notes,
    };
    onAdd(newBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('bills.addBillTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.vendor')} *</label>
              <input required value={form.vendor} onChange={e => setForm({...form, vendor: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.invoiceNumber')}</label>
              <input value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.category')}</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['Biuro', 'Podróże', 'Catering', 'Sprzęt', 'Usługi', 'Inne'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.amount')} (brutto PLN) *</label>
              <input required type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">VAT PLN</label>
              <input type="number" step="0.01" value={form.vatAmount} onChange={e => setForm({...form, vatAmount: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.issueDate')} *</label>
              <input required type="date" value={form.issueDate} onChange={e => setForm({...form, issueDate: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.dueDate')} *</label>
              <input required type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.description')}</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('bills.notes')}</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('common.cancel')}
            </button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BillsModule() {
  const { t } = useTranslation();
  const [bills, setBills] = useState<Bill[]>(mockBills);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleMarkPaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? {
      ...b,
      status: 'oplacona' as BillStatus,
      paidDate: new Date().toISOString().split('T')[0],
    } : b));
  };

  const handleAddBill = (bill: Bill) => {
    setBills(prev => [bill, ...prev]);
  };

  const filtered = filterStatus === 'all' ? bills : bills.filter(b => b.status === filterStatus);

  const totalUnpaid = bills.filter(b => b.status === 'nieoplacona' || b.status === 'przeterminowana').reduce((s, b) => s + b.amount, 0);
  const totalOverdue = bills.filter(b => b.status === 'przeterminowana').reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('bills.totalUnpaid')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPLN(totalUnpaid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('bills.totalOverdue')}</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatPLN(totalOverdue)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('bills.cashFlowImpact')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">-{formatPLN(totalUnpaid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('bills.title')}</h3>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('common.all')}</option>
              <option value="nieoplacona">{t('bills.status_nieoplacona')}</option>
              <option value="oplacona">{t('bills.status_oplacona')}</option>
              <option value="przeterminowana">{t('bills.status_przeterminowana')}</option>
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('bills.addBill')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('bills.vendor')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('bills.invoiceNumber')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('bills.amount')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('bills.issueDate')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('bills.dueDate')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('bills.status')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(bill => (
                <tr
                  key={bill.id}
                  className={clsx(
                    'transition-colors',
                    bill.status === 'przeterminowana'
                      ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  )}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {bill.status === 'przeterminowana' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{bill.vendor}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{bill.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">{bill.invoiceNumber || '—'}</td>
                  <td className="px-3 py-3 text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPLN(bill.amount)}</p>
                    {bill.vatAmount > 0 && <p className="text-xs text-gray-400">VAT: {formatPLN(bill.vatAmount)}</p>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{bill.issueDate}</td>
                  <td className="px-3 py-3">
                    <span className={clsx('text-sm', bill.status === 'przeterminowana' ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-400')}>
                      {bill.dueDate}
                    </span>
                    {bill.paidDate && <p className="text-xs text-emerald-600 dark:text-emerald-400">Opłacona: {bill.paidDate}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={bill.status} />
                    {bill.notes && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[180px] truncate" title={bill.notes}>{bill.notes}</p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {(bill.status === 'nieoplacona' || bill.status === 'przeterminowana') && (
                      <button
                        onClick={() => handleMarkPaid(bill.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors whitespace-nowrap"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('bills.markPaid')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddBillModal onClose={() => setShowAddModal(false)} onAdd={handleAddBill} />}
    </div>
  );
}
