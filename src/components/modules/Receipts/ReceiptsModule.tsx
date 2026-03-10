import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload, FileText, CheckCircle, Clock, XCircle, AlertCircle,
  Brain, ChevronRight, Download, Filter, Search, Check, X
} from 'lucide-react';
import { mockReceipts } from '../../../data/mockData';
import type { Receipt, ReceiptStatus } from '../../../types';
import clsx from 'clsx';

function formatPLN(amount: number) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(amount);
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  const { t } = useTranslation();
  const config = {
    oczekuje: { icon: Clock, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', label: t('receipts.status_oczekuje') },
    zaklasyfikowany: { icon: Brain, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: t('receipts.status_zaklasyfikowany') },
    zatwierdzony: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: t('receipts.status_zatwierdzony') },
    odrzucony: { icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: t('receipts.status_odrzucony') },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', c.color)}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className={clsx('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{pct}%</span>
    </div>
  );
}

export function ReceiptsModule() {
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadNotice, setUploadNotice] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setUploadNotice(`${t('receipts.filesUploaded')} (${files.map(f => f.name).join(', ')})`);
      setTimeout(() => setUploadNotice(''), 4000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadNotice(`${t('receipts.filesUploaded')} (${files.map(f => f.name).join(', ')})`);
      setTimeout(() => setUploadNotice(''), 4000);
    }
  };

  const handleApprove = (id: string) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'zatwierdzony' as ReceiptStatus } : r));
    if (selectedReceipt?.id === id) setSelectedReceipt(prev => prev ? { ...prev, status: 'zatwierdzony' } : null);
  };

  const handleReject = (id: string) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'odrzucony' as ReceiptStatus } : r));
    if (selectedReceipt?.id === id) setSelectedReceipt(prev => prev ? { ...prev, status: 'odrzucony' } : null);
  };

  const filtered = receipts.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !searchQuery || r.vendor.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const vatEligibleTotal = receipts.filter(r => r.vatEligible && r.status === 'zatwierdzony').reduce((s, r) => s + r.vatAmount, 0);

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        )}
      >
        <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={handleFileSelect} />
        <Upload className={clsx('w-10 h-10 mx-auto mb-3', dragOver ? 'text-blue-500' : 'text-gray-400')} />
        <p className="text-base font-medium text-gray-700 dark:text-gray-300">{t('receipts.uploadZone')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('receipts.uploadZoneSub')}</p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-400">
          <Brain className="w-3.5 h-3.5 text-blue-500" />
          {t('receipts.aiPromptText')}
        </div>
      </div>

      {uploadNotice && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {uploadNotice}
        </div>
      )}

      {/* VAT summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-blue-800 dark:text-blue-300">
          VAT do odliczenia (zatwierdzone paragony):
        </span>
        <span className="text-sm font-bold text-blue-900 dark:text-blue-200">{formatPLN(vatEligibleTotal)}</span>
      </div>

      {/* Main content */}
      <div className="flex gap-4 h-[600px]">
        {/* Left: receipt list */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search') + '...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('common.all')}</option>
              <option value="oczekuje">{t('receipts.status_oczekuje')}</option>
              <option value="zaklasyfikowany">{t('receipts.status_zaklasyfikowany')}</option>
              <option value="zatwierdzony">{t('receipts.status_zatwierdzony')}</option>
              <option value="odrzucony">{t('receipts.status_odrzucony')}</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 dark:bg-gray-700/80 backdrop-blur">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2.5 uppercase tracking-wide">{t('receipts.date')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2.5 uppercase tracking-wide">{t('receipts.vendor')}</th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2.5 uppercase tracking-wide">{t('receipts.amount')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2.5 uppercase tracking-wide">{t('receipts.category')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2.5 uppercase tracking-wide">{t('receipts.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(receipt => (
                  <tr
                    key={receipt.id}
                    onClick={() => setSelectedReceipt(receipt)}
                    className={clsx(
                      'cursor-pointer transition-colors',
                      selectedReceipt?.id === receipt.id
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{receipt.date}</td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{receipt.vendor}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{receipt.description}</div>
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-right text-gray-900 dark:text-white whitespace-nowrap">
                      {formatPLN(receipt.amountGross)}
                      <div className="text-xs text-gray-400 font-normal">VAT {receipt.vatRate}%</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {receipt.category}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={receipt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: detail panel */}
        <div className="w-96 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
          {selectedReceipt ? (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{selectedReceipt.vendor}</h3>
                <StatusBadge status={selectedReceipt.status} />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('receipts.date')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReceipt.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.gross')}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPLN(selectedReceipt.amountGross)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.net')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatPLN(selectedReceipt.amountNet)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('common.vat')} {selectedReceipt.vatRate}%</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatPLN(selectedReceipt.vatAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('receipts.category')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedReceipt.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('receipts.vatEligible')}</p>
                    <p className={clsx('text-sm font-medium', selectedReceipt.vatEligible ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {selectedReceipt.vatEligible ? 'Tak' : 'Nie'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {t('receipts.uploadedBy')}: {selectedReceipt.uploadedBy} · {selectedReceipt.uploadedAt?.split('T')[0]}
                </div>

                {/* OCR text */}
                {selectedReceipt.ocrText && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('receipts.ocrText')}</p>
                    </div>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed border border-gray-100 dark:border-gray-600">
                      {selectedReceipt.ocrText}
                    </pre>
                  </div>
                )}

                {/* AI classification */}
                {selectedReceipt.aiClassification && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-500" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{t('receipts.aiResult')}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">{t('receipts.confidence')}</span>
                        <div className="w-32">
                          <ConfidenceBar confidence={selectedReceipt.aiClassification.confidence} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">{t('receipts.suggestedCategory')}:</span>
                          <span className="ml-1 font-medium text-blue-900 dark:text-blue-200">{selectedReceipt.aiClassification.suggestedCategory}</span>
                        </div>
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">VAT:</span>
                          <span className="ml-1 font-medium text-blue-900 dark:text-blue-200">{selectedReceipt.aiClassification.suggestedVatRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-0.5">{t('receipts.reasoning')}:</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{selectedReceipt.aiClassification.reasoning}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-blue-500 dark:text-blue-500">
                        <span>{selectedReceipt.aiClassification.model}</span>
                        <span>{selectedReceipt.aiClassification.processedAt?.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {(selectedReceipt.status === 'zaklasyfikowany' || selectedReceipt.status === 'oczekuje') && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                  <button
                    onClick={() => handleApprove(selectedReceipt.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    {t('receipts.approve')}
                  </button>
                  <button
                    onClick={() => handleReject(selectedReceipt.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    {t('receipts.reject')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('receipts.selectReceipt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
