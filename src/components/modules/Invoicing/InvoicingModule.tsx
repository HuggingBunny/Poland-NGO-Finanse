import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, FileText, X, AlertCircle, CheckCircle, Clock, Download, Send } from 'lucide-react';
import { mockInvoices, mockOrganization } from '../../../data/mockData';
import type { Invoice, InvoiceStatus, InvoiceLineItem } from '../../../types';
import clsx from 'clsx';

function formatPLN(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  const config = {
    szkic: { icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
    wystawiona: { icon: Send, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    oplacona: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    anulowana: { icon: X, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', c.color)}>
      <Icon className="w-3 h-3" />
      {t(`invoicing.status_${status}`)}
    </span>
  );
}

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
}

function InvoiceDetail({ invoice, onClose, onMarkPaid }: InvoiceDetailProps) {
  const { t } = useTranslation();
  const [ksefTooltip, setKsefTooltip] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">FAKTURA VAT</h2>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{invoice.number}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Dates */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('invoicing.issueDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{invoice.issueDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('invoicing.saleDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{invoice.saleDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{t('invoicing.dueDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{invoice.dueDate}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('invoicing.seller')}</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{invoice.seller.name}</p>
              {invoice.seller.nip && <p className="text-xs text-gray-600 dark:text-gray-400">NIP: {invoice.seller.nip}</p>}
              {invoice.seller.krs && <p className="text-xs text-gray-600 dark:text-gray-400">KRS: {invoice.seller.krs}</p>}
              {invoice.seller.regon && <p className="text-xs text-gray-600 dark:text-gray-400">REGON: {invoice.seller.regon}</p>}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{invoice.seller.address}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{invoice.seller.postalCode} {invoice.seller.city}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('invoicing.buyer')}</p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{invoice.buyer.name}</p>
              {invoice.buyer.nip && <p className="text-xs text-gray-600 dark:text-gray-400">NIP: {invoice.buyer.nip}</p>}
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{invoice.buyer.address}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{invoice.buyer.postalCode} {invoice.buyer.city}</p>
            </div>
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('invoicing.lineItems')}</p>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs">
                    <th className="text-left px-4 py-2 font-semibold text-gray-500 dark:text-gray-400">{t('invoicing.description')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">{t('invoicing.quantity')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">{t('invoicing.unitPrice')}</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">VAT%</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-500 dark:text-gray-400">{t('invoicing.grossAmount')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {invoice.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white">{item.description}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{formatPLN(item.unitPriceNet)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 dark:text-gray-400">{item.vatRate === 0 ? 'ZW' : `${item.vatRate}%`}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white">{formatPLN(item.grossAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Totals */}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-end gap-4">
                <span className="text-gray-500 dark:text-gray-400">{t('invoicing.netTotal')}:</span>
                <span className="font-medium text-gray-900 dark:text-white w-28 text-right">{formatPLN(invoice.netTotal)}</span>
              </div>
              <div className="flex justify-end gap-4">
                <span className="text-gray-500 dark:text-gray-400">{t('invoicing.vatTotal')}:</span>
                <span className="font-medium text-gray-900 dark:text-white w-28 text-right">{formatPLN(invoice.vatTotal)}</span>
              </div>
              <div className="flex justify-end gap-4 pt-1 border-t border-gray-200 dark:border-gray-700">
                <span className="font-bold text-gray-900 dark:text-white">{t('invoicing.grossTotal')}:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg w-28 text-right">{formatPLN(invoice.grossTotal)} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-sm space-y-1">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Forma płatności</p>
            <p className="text-gray-900 dark:text-white">{t(`invoicing.${invoice.paymentMethod}`)}</p>
            {invoice.bankAccount && (
              <p className="font-mono text-xs text-gray-600 dark:text-gray-400">{invoice.bankAccount}</p>
            )}
          </div>

          {invoice.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
              <p className="text-xs font-semibold mb-1">Uwagi:</p>
              <p>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {/* KSeF button with tooltip */}
            <div className="relative">
              <button
                onMouseEnter={() => setKsefTooltip(true)}
                onMouseLeave={() => setKsefTooltip(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed opacity-60"
              >
                <Send className="w-4 h-4" />
                {t('invoicing.exportKsef')}
              </button>
              {ksefTooltip && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg p-2 shadow-lg z-10">
                  {t('invoicing.ksefTooltip')}
                </div>
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              {t('invoicing.exportPdf')}
            </button>
          </div>
          <div className="flex gap-2">
            {invoice.status === 'wystawiona' && (
              <button
                onClick={() => { onMarkPaid(invoice.id); onClose(); }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {t('invoicing.markPaid')}
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoicingModule() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleMarkPaid = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? {
      ...inv,
      status: 'oplacona' as InvoiceStatus,
      paidDate: new Date().toISOString().split('T')[0],
    } : inv));
  };

  const filtered = filterStatus === 'all' ? invoices : invoices.filter(inv => inv.status === filterStatus);

  const totalIssued = invoices.filter(i => i.status === 'wystawiona').reduce((s, i) => s + i.grossTotal, 0);
  const totalPaid = invoices.filter(i => i.status === 'oplacona').reduce((s, i) => s + i.grossTotal, 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wszystkich faktur</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{invoices.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Oczekuje na zapłatę</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatPLN(totalIssued)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Zapłacone (w tym roku)</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatPLN(totalPaid)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('invoicing.invoiceList')}</h3>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('common.all')}</option>
              <option value="szkic">{t('invoicing.status_szkic')}</option>
              <option value="wystawiona">{t('invoicing.status_wystawiona')}</option>
              <option value="oplacona">{t('invoicing.status_oplacona')}</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              {t('invoicing.createInvoice')}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('invoicing.invoiceNumber')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('invoicing.buyer')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('invoicing.issueDate')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('invoicing.dueDate')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('invoicing.grossTotal')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('invoicing.status')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(invoice => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{invoice.number}</p>
                    <p className="text-xs text-gray-400">{invoice.currency}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.buyer.name}</p>
                    {invoice.buyer.nip && <p className="text-xs text-gray-500 dark:text-gray-400">NIP: {invoice.buyer.nip}</p>}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{invoice.issueDate}</td>
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.dueDate}</p>
                    {invoice.paidDate && <p className="text-xs text-emerald-600 dark:text-emerald-400">Zapłacona: {invoice.paidDate}</p>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPLN(invoice.grossTotal)}</p>
                    {invoice.vatTotal > 0 && <p className="text-xs text-gray-400">VAT: {formatPLN(invoice.vatTotal)}</p>}
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={invoice.status} /></td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('common.preview')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  );
}
