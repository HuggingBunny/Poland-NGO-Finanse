import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Building2, Brain, Shield, Plus, Pencil, Trash2, Key,
  CheckCircle, XCircle, Loader2, Save, AlertTriangle, RefreshCw, Scale
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLegalUpdates } from '../../../contexts/LegalUpdatesContext';
import { mockOrganization } from '../../../data/mockData';
import type { User, UserRole } from '../../../types';
import clsx from 'clsx';

type SettingsTab = 'users' | 'organization' | 'ai' | 'legal';

const OLLAMA_MODELS = [
  'deepseek-r1:7b',
  'deepseek-r1:14b',
  'deepseek-r1:32b',
  'llama3.2:3b',
  'llama3.1:8b',
  'mistral:7b',
  'phi3:mini',
];

interface EditUserModalProps {
  user?: User;
  onClose: () => void;
  onSave: (user: User) => void;
}

function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    username: user?.username || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    role: (user?.role || 'wolontariusz') as UserRole,
    active: user?.active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saved: User = {
      id: user?.id || `u${Date.now()}`,
      username: form.username,
      displayName: form.displayName,
      email: form.email,
      role: form.role,
      active: form.active,
      createdAt: user?.createdAt || new Date().toISOString().split('T')[0],
      lastLogin: user?.lastLogin,
    };
    onSave(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? t('settings.editUser') : t('settings.addUser')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.username')} *</label>
            <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.displayName')} *</label>
            <input required value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.email')}</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.role')}</label>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="admin">{t('settings.role_admin')}</option>
              <option value="ksiegowa">{t('settings.role_ksiegowa')}</option>
              <option value="dyrektor">{t('settings.role_dyrektor')}</option>
              <option value="wolontariusz">{t('settings.role_wolontariusz')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">{t('settings.active')}</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('common.cancel')}
            </button>
            <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SettingsModule() {
  const { t } = useTranslation();
  const { user: currentUser, allUsers, updateUsers } = useAuth();
  const { updates, urgentCount, loading: legalLoading, dismiss, apply, refresh: refreshLegal } = useLegalUpdates();
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resetNotice, setResetNotice] = useState('');
  const [orgForm, setOrgForm] = useState({ ...mockOrganization });
  const [orgSaved, setOrgSaved] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('deepseek-r1:14b');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'testing'>('unknown');

  const isAdmin = currentUser?.role === 'admin';

  const handleResetPassword = (userId: string, username: string) => {
    setResetNotice(`Hasło użytkownika "${username}" zostało zresetowane do 'password'.`);
    setTimeout(() => setResetNotice(''), 4000);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    updateUsers(allUsers.filter(u => u.id !== userId));
  };

  const handleSaveUser = (user: User) => {
    const exists = allUsers.find(u => u.id === user.id);
    if (exists) {
      updateUsers(allUsers.map(u => u.id === user.id ? user : u));
    } else {
      updateUsers([...allUsers, user]);
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    await new Promise(r => setTimeout(r, 1500));
    setConnectionStatus(ollamaUrl.includes('localhost') || ollamaUrl.includes('127.0.0.1') ? 'connected' : 'disconnected');
  };

  const roleColors: Record<UserRole, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    ksiegowa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dyrektor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    wolontariusz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  const roleLabels: Record<UserRole, string> = {
    admin: t('settings.role_admin'),
    ksiegowa: t('settings.role_ksiegowa'),
    dyrektor: t('settings.role_dyrektor'),
    wolontariusz: t('settings.role_wolontariusz'),
  };

  const severityColors: Record<string, string> = {
    info: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
    warning: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
    critical: 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20',
  };

  const severityBadge: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };

  const TABS = [
    { id: 'users' as SettingsTab, label: t('settings.userManagement'), icon: Users },
    { id: 'organization' as SettingsTab, label: t('settings.orgSettings'), icon: Building2 },
    { id: 'ai' as SettingsTab, label: t('settings.aiSettings'), icon: Brain },
    { id: 'legal' as SettingsTab, label: t('settings.legalCompliance'), icon: Scale, badge: urgentCount > 0 ? urgentCount : undefined },
  ];

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">{t('settings.adminOnly')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className="ml-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notices */}
      {resetNotice && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {resetNotice}
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('settings.userManagement')}</h3>
            <button
              onClick={() => { setEditingUser(undefined); setShowEditModal(true); }}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('settings.addUser')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">Użytkownik</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('settings.email')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('settings.role')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('settings.lastLogin')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('settings.active')}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3 uppercase tracking-wide">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {allUsers.map(u => (
                  <tr key={u.id} className={clsx('transition-colors', !u.active ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', u.id === currentUser?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300')}>
                          {u.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{u.displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="px-3 py-3">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', roleColors[u.role])}>
                        {roleLabels[u.role]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={clsx('inline-flex items-center gap-1 text-xs font-medium',
                        u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                      )}>
                        {u.active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {u.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t('settings.editUser')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id, u.username)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title={t('settings.resetPassword')}
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('settings.deleteUser')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORGANIZATION TAB */}
      {activeTab === 'organization' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-5">{t('settings.orgSettings')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'name', label: t('settings.orgName'), fullWidth: true },
              { key: 'nip', label: t('settings.nip') },
              { key: 'krs', label: t('settings.krs') },
              { key: 'regon', label: t('settings.regon') },
              { key: 'address', label: t('settings.address'), fullWidth: true },
              { key: 'city', label: t('settings.city') },
              { key: 'postalCode', label: t('settings.postalCode') },
              { key: 'email', label: t('settings.email_org') },
              { key: 'phone', label: t('settings.phone') },
              { key: 'bankAccount', label: t('settings.bankAccount'), fullWidth: true },
              { key: 'bankName', label: t('settings.bankName'), fullWidth: true },
            ].map(field => (
              <div key={field.key} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                <input
                  value={(orgForm as any)[field.key]}
                  onChange={e => setOrgForm({...orgForm, [field.key]: e.target.value})}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => { setOrgSaved(true); setTimeout(() => setOrgSaved(false), 3000); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {t('settings.saveSettings')}
            </button>
            {orgSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                {t('settings.settingsSaved')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* AI SETTINGS TAB */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-5">
              <Brain className="w-5 h-5 text-blue-500" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('settings.aiSettings')}</h3>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-5 text-sm text-blue-800 dark:text-blue-300">
              {t('settings.aiNote')}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.ollamaUrl')}</label>
                <input
                  value={ollamaUrl}
                  onChange={e => { setOllamaUrl(e.target.value); setConnectionStatus('unknown'); }}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.ollamaModel')}</label>
                <select
                  value={ollamaModel}
                  onChange={e => setOllamaModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {OLLAMA_MODELS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    connectionStatus === 'testing'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  )}
                >
                  {connectionStatus === 'testing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t('settings.connectionTesting')}</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" />{t('settings.testConnection')}</>
                  )}
                </button>

                {connectionStatus === 'connected' && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {t('settings.connectionOk')}
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 font-medium">
                    <XCircle className="w-4 h-4" />
                    {t('settings.connectionFailed')}
                  </span>
                )}
              </div>

              {connectionStatus === 'connected' && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-sm">
                  <p className="text-emerald-800 dark:text-emerald-300 font-medium">Ollama działa poprawnie</p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs mt-1">Model {ollamaModel} dostępny. Klasyfikacja paragonów aktywna.</p>
                </div>
              )}

              {connectionStatus === 'disconnected' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 text-sm">
                  <p className="text-red-800 dark:text-red-300 font-medium">Nie można połączyć z Ollama</p>
                  <p className="text-red-700 dark:text-red-400 text-xs mt-1">Sprawdź czy Ollama działa: <code className="font-mono">ollama serve</code></p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Prompt klasyfikacji paragonów</h4>
            <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
{`Jesteś ekspertem ds. polskiej rachunkowości i podatków.
Przeanalizuj tekst OCR paragonu/faktury i zwróć JSON:

{
  "kategoria": "Biuro|Podróże|Catering|Sprzęt|Usługi|Inne",
  "stawka_vat": 23|8|5|0,
  "odliczenie_vat": true|false,
  "pewnosc": 0.0-1.0,
  "uzasadnienie": "krótkie wyjaśnienie po polsku"
}

Zasady:
- Transport PKP/PKS/MPK: VAT 8%, odliczenie TAK
- Artykuły spożywcze: VAT 5%, catering reprezentacyjny = NIE odliczaj
- Artykuły biurowe, IT, usługi: VAT 23%, odliczenie TAK
- Usługi edukacyjne fundacji: ZW (0%), nie odliczaj
- Jeśli paragon to koszt reprezentacyjny: odliczenie = NIE

Tekst OCR do analizy:
{ocr_text}`}
            </pre>
          </div>
        </div>
      )}

      {/* LEGAL COMPLIANCE TAB */}
      {activeTab === 'legal' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-500" />
              {t('settings.legalCompliance')}
            </h3>
            <button
              onClick={() => refreshLegal()}
              disabled={legalLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={clsx('w-4 h-4', legalLoading && 'animate-spin')} />
              {t('common.refresh')}
            </button>
          </div>

          {updates.length === 0 && !legalLoading && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('settings.legalNoUpdates')}</p>
            </div>
          )}

          {updates.map(({ change, days_until, dismissed }) => (
            <div
              key={change.id}
              className={clsx(
                'rounded-xl border p-5 transition-opacity',
                severityColors[change.severity] || severityColors.info,
                dismissed && 'opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full uppercase', severityBadge[change.severity] || severityBadge.info)}>
                      {change.severity === 'critical' ? t('common.warning') : change.severity === 'warning' ? t('common.warning') : t('common.info')}
                    </span>
                    {change.affects.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {t(`settings.affects_${a}`, { defaultValue: a })}
                      </span>
                    ))}
                    {dismissed && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                        {t('settings.dismissed')}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{change.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{change.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{t('settings.effectiveDate')}: <strong>{change.effective_date}</strong></span>
                    <span className={clsx(
                      'font-semibold',
                      days_until <= 30 ? 'text-red-600 dark:text-red-400' :
                      days_until <= 90 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400'
                    )}>
                      {days_until > 0
                        ? `${days_until} ${t('settings.daysUntil')}`
                        : t('settings.pastDue')}
                    </span>
                  </div>
                  {change.app_version_required && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('settings.requiresVersion')}: v{change.app_version_required}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {change.update_available && (
                    <button
                      onClick={() => apply(change.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('settings.applyUpdate')}
                    </button>
                  )}
                  {!dismissed && (
                    <button
                      onClick={() => dismiss(change.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {t('settings.dismiss')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditModal && (
        <EditUserModal
          user={editingUser}
          onClose={() => { setShowEditModal(false); setEditingUser(undefined); }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
