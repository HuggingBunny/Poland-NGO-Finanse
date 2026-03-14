import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash2, Search, Building2, Loader2, X, Save,
} from 'lucide-react';
import { invoke } from '../../../lib/invoke';
import clsx from 'clsx';

interface ServiceProvider {
  id: string;
  name: string;
  nip?: string;
  krs?: string;
  regon?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  email?: string;
  phone?: string;
  bank_account?: string;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: '', label: '—' },
  { value: 'biuro', label: 'Biuro' },
  { value: 'catering', label: 'Catering' },
  { value: 'it', label: 'IT / Sprzęt' },
  { value: 'usługi', label: 'Usługi' },
  { value: 'transport', label: 'Transport' },
  { value: 'inne', label: 'Inne' },
];

const defaultForm: Omit<ServiceProvider, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  nip: '',
  krs: '',
  regon: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'PL',
  email: '',
  phone: '',
  bank_account: '',
  category: '',
  notes: '',
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

interface ProviderModalProps {
  provider?: ServiceProvider;
  onClose: () => void;
  onSave: () => void;
}

function ProviderModal({ provider, onClose, onSave }: ProviderModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<typeof defaultForm>(
    provider
      ? {
          name: provider.name,
          nip: provider.nip || '',
          krs: provider.krs || '',
          regon: provider.regon || '',
          address: provider.address || '',
          city: provider.city || '',
          postal_code: provider.postal_code || '',
          country: provider.country || 'PL',
          email: provider.email || '',
          phone: provider.phone || '',
          bank_account: provider.bank_account || '',
          category: provider.category || '',
          notes: provider.notes || '',
        }
      : { ...defaultForm }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('common.required'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await invoke('upsert_service_provider', {
        id: provider?.id,
        ...form,
      });
      onSave();
      onClose();
    } catch (err) {
      setError(String(err));
    }
    setSaving(false);
  };

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {provider ? t('serviceProviders.edit') : t('serviceProviders.addNew')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('serviceProviders.name')} *
            </label>
            <input
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* NIP / KRS / REGON */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.nip')}
              </label>
              <input value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.krs')}
              </label>
              <input value={form.krs} onChange={e => setForm({ ...form, krs: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.regon')}
              </label>
              <input value={form.regon} onChange={e => setForm({ ...form, regon: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('serviceProviders.address')}
            </label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputClass} />
          </div>

          {/* City / Postal / Country */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.city')}
              </label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.postalCode')}
              </label>
              <input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.country')}
              </label>
              <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.email')}
              </label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('serviceProviders.phone')}
              </label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Bank Account */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('serviceProviders.bankAccount')}
            </label>
            <input value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} className={inputClass} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('serviceProviders.category')}
            </label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClass}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('serviceProviders.notes')}
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className={clsx(inputClass, 'resize-none')}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export function ServiceProvidersModule() {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke<ServiceProvider[]>('get_service_providers');
      setProviders(data ?? []);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleDelete = async (id: string) => {
    try {
      await invoke('delete_service_provider', { id });
      setDeleteConfirmId(null);
      await fetchProviders();
    } catch (err) {
      setError(String(err));
    }
  };

  const filtered = providers.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.nip || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('serviceProviders.title')}
          </h2>
        </div>
        <button
          onClick={() => { setEditingProvider(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('serviceProviders.addNew')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={`${t('common.search')} (${t('serviceProviders.name')}, NIP, ${t('serviceProviders.city')})...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">
                  {t('serviceProviders.name')}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">
                  {t('serviceProviders.nip')}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">
                  {t('serviceProviders.city')}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">
                  {t('serviceProviders.category')}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">
                  {t('serviceProviders.email')}
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                    {t('serviceProviders.noProviders')}
                  </td>
                </tr>
              ) : (
                filtered.map(provider => (
                  <tr key={provider.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {provider.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {provider.nip || '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {provider.city || '—'}
                    </td>
                    <td className="px-3 py-3">
                      {provider.category ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {provider.category}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {provider.email || '—'}
                    </td>
                    <td className="px-5 py-3">
                      {deleteConfirmId === provider.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {t('serviceProviders.confirmDelete')}
                          </span>
                          <button
                            onClick={() => handleDelete(provider.id)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            {t('common.yes')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs rounded"
                          >
                            {t('common.no')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingProvider(provider); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t('serviceProviders.edit')}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(provider.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('serviceProviders.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-5 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            {filtered.length} / {providers.length}
          </div>
        )}
      </div>

      {showModal && (
        <ProviderModal
          provider={editingProvider}
          onClose={() => { setShowModal(false); setEditingProvider(undefined); }}
          onSave={fetchProviders}
        />
      )}
    </div>
  );
}
