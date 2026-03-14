import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Building2, Brain, Shield, Plus, Pencil, Trash2, Key,
  CheckCircle, XCircle, Loader2, Save, RefreshCw, Scale,
  Mail, HardDrive, ScrollText,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLegalUpdates } from '../../../contexts/LegalUpdatesContext';
import { invoke } from '../../../lib/invoke';
import type { User, UserRole, Organization } from '../../../types';
import clsx from 'clsx';

type SettingsTab = 'users' | 'organization' | 'ai' | 'legal' | 'email' | 'backups' | 'logs';

const defaultOrg: Organization = {
  name: '', nip: '', krs: '', regon: '', address: '',
  city: '', postalCode: '', country: 'Polska', email: '',
  phone: '', bankAccount: '', bankName: '',
};

const OLLAMA_MODELS = [
  'deepseek-r1:7b',
  'deepseek-r1:14b',
  'deepseek-r1:32b',
  'llama3.2:3b',
  'llama3.1:8b',
  'mistral:7b',
  'phi3:mini',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  from_address: string;
  from_name: string;
  enabled: boolean;
}

interface BackupConfig {
  id: string;
  name: string;
  backup_type: string;
  path: string;
  enabled: boolean;
  last_backup_at?: string;
  created_at: string;
}

interface BackupFile {
  file_name: string;
  file_path: string;
  size_bytes: number;
  created_at: string;
  source: string;
}

interface AdminLog {
  id: string;
  level: string;
  module: string;
  message: string;
  user_id?: string;
  metadata?: string;
  created_at: string;
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────

interface EditUserModalProps {
  user?: User;
  onClose: () => void;
  onSave: (user: User, password?: string) => void;
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
  const [password, setPassword] = useState('');

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
    onSave(saved, !user ? password : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user ? t('settings.editUser') : t('settings.addUser')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.username')} *</label>
            <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              disabled={!!user}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.displayName')} *</label>
            <input required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.email')}</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.role')}</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="admin">{t('settings.role_admin')}</option>
              <option value="ksiegowa">{t('settings.role_ksiegowa')}</option>
              <option value="dyrektor">{t('settings.role_dyrektor')}</option>
              <option value="wolontariusz">{t('settings.role_wolontariusz')}</option>
            </select>
          </div>
          {!user && (
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hasło *</label>
              <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="min. 8 znaków"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })}
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

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Hasło musi mieć co najmniej 8 znaków'); return; }
    if (password !== confirm) { setError('Hasła nie są zgodne'); return; }
    setLoading(true);
    try {
      await invoke('reset_password', { user_id: user.id, new_password: password });
      setDone(true);
      setTimeout(onClose, 1500);
    } catch {
      setError('Błąd przy zmianie hasła. Spróbuj ponownie.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reset hasła</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user.displayName} ({user.username})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        {done ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Hasło zostało zmienione</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nowe hasło *</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="min. 8 znaków"
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Powtórz hasło *</label>
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <XCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Anuluj
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Zapisuję...</> : <><Key className="w-4 h-4" />Zmień hasło</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Add Backup Config Modal ──────────────────────────────────────────────────

interface AddBackupConfigModalProps {
  onClose: () => void;
  onSave: () => void;
}

function AddBackupConfigModal({ onClose, onSave }: AddBackupConfigModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', backup_type: 'local', path: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke('upsert_backup_config', form);
      onSave();
      onClose();
    } catch {}
    setSaving(false);
  };

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('backups.addDestination')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('backups.name')} *</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('backups.type')}</label>
            <select value={form.backup_type} onChange={e => setForm({ ...form, backup_type: e.target.value })} className={inputClass}>
              <option value="local">{t('backups.types.local')}</option>
              <option value="usb">{t('backups.types.usb')}</option>
              <option value="smb">{t('backups.types.smb')}</option>
              <option value="google_drive">{t('backups.types.google_drive')}</option>
            </select>
          </div>
          {form.backup_type === 'google_drive' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 text-xs text-yellow-800 dark:text-yellow-300">
              {t('backups.googleDriveNote')}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('backups.path')} *</label>
            <input required value={form.path} onChange={e => setForm({ ...form, path: e.target.value })}
              placeholder={form.backup_type === 'smb' ? '\\\\server\\share' : '/path/to/backup/dir'}
              className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
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

export function SettingsModule() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const { updates, urgentCount, loading: legalLoading, dismiss, apply, refresh: refreshLegal } = useLegalUpdates();

  const [activeTab, setActiveTab] = useState<SettingsTab>('users');

  // ── Users state ──────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [showEditModal, setShowEditModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | undefined>(undefined);
  const [showResetModal, setShowResetModal] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await invoke<User[]>('get_users');
      setUsers(data);
    } catch {}
    setLoadingUsers(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSaveUser = async (user: User, password?: string) => {
    const isNew = !users.find(u => u.id === user.id);
    try {
      if (isNew) {
        await invoke('create_user', {
          username: user.username,
          display_name: user.displayName,
          email: user.email,
          role: user.role,
          password: password || 'changeme',
        });
      } else {
        await invoke('update_user', {
          id: user.id,
          username: user.username,
          display_name: user.displayName,
          email: user.email,
          role: user.role,
          active: user.active,
        });
      }
      await fetchUsers();
    } catch {}
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return;
    const u = users.find(u => u.id === userId);
    if (!u) return;
    try {
      await invoke('update_user', {
        id: u.id,
        username: u.username,
        display_name: u.displayName,
        email: u.email,
        role: u.role,
        active: false,
      });
      await fetchUsers();
    } catch {}
  };

  // ── Org state ────────────────────────────────────────────────────────────
  const [orgForm, setOrgForm] = useState<Organization>({ ...defaultOrg });
  const [orgSaved, setOrgSaved] = useState(false);

  useEffect(() => {
    invoke<Organization>('get_organization').then(data => {
      if (data) setOrgForm(data);
    }).catch(() => {});
  }, []);

  // ── AI state ─────────────────────────────────────────────────────────────
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('deepseek-r1:14b');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'testing'>('unknown');

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const ok = await invoke<boolean>('test_ollama_connection');
      setConnectionStatus(ok ? 'connected' : 'disconnected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  // ── Email state ──────────────────────────────────────────────────────────
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: '', smtp_port: '587', smtp_user: '', smtp_pass: '',
    from_address: '', from_name: '', enabled: false,
  });
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    if (activeTab === 'email') {
      invoke<EmailSettings>('get_email_settings').then(data => {
        if (data) setEmailSettings(data);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    try {
      await invoke('save_email_settings', emailSettings as unknown as Record<string, unknown>);
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 3000);
    } catch {}
    setEmailSaving(false);
  };

  // ── Backup state ─────────────────────────────────────────────────────────
  const [backupConfigs, setBackupConfigs] = useState<BackupConfig[]>([]);
  const [showAddBackup, setShowAddBackup] = useState(false);
  const [expandedBackup, setExpandedBackup] = useState<string | null>(null);
  const [backupFiles, setBackupFiles] = useState<Record<string, BackupFile[]>>({});
  const [runningBackup, setRunningBackup] = useState<string | null>(null);
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<BackupFile | null>(null);
  const [backupMessage, setBackupMessage] = useState('');

  const fetchBackupConfigs = useCallback(async () => {
    try {
      const data = await invoke<BackupConfig[]>('get_backup_configs');
      setBackupConfigs(data ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === 'backups') fetchBackupConfigs();
  }, [activeTab, fetchBackupConfigs]);

  const handleRunBackup = async (configId: string) => {
    setRunningBackup(configId);
    try {
      const path = await invoke<string>('run_backup', { config_id: configId });
      setBackupMessage(`${t('backups.backupSuccess')}: ${path}`);
      setTimeout(() => setBackupMessage(''), 5000);
      await fetchBackupConfigs();
    } catch (err) {
      setBackupMessage(`${t('common.error')}: ${String(err)}`);
    }
    setRunningBackup(null);
  };

  const handleViewFiles = async (configId: string) => {
    if (expandedBackup === configId) {
      setExpandedBackup(null);
      return;
    }
    setExpandedBackup(configId);
    try {
      const files = await invoke<BackupFile[]>('list_backups', { config_id: configId });
      setBackupFiles(prev => ({ ...prev, [configId]: files ?? [] }));
    } catch {}
  };

  const handleRestoreBackup = async (file: BackupFile) => {
    try {
      await invoke('restore_backup', { backup_file_path: file.file_path });
      setRestoreConfirmFile(null);
      setBackupMessage(t('backups.restoreSuccess'));
      setTimeout(() => setBackupMessage(''), 5000);
    } catch (err) {
      setBackupMessage(`${t('common.error')}: ${String(err)}`);
    }
  };

  // ── Logs state ───────────────────────────────────────────────────────────
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [cleanupResult, setCleanupResult] = useState<number | null>(null);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const data = await invoke<AdminLog[]>('get_admin_logs', {
        limit: 500,
        level: levelFilter || undefined,
      });
      setAdminLogs(data ?? []);
    } catch {}
    setLogsLoading(false);
  }, [levelFilter]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  // Auto-refresh every 30s on logs tab
  useEffect(() => {
    if (activeTab !== 'logs') return;
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchLogs]);

  const handleCleanupLogs = async () => {
    try {
      const count = await invoke<number>('cleanup_old_logs');
      setCleanupResult(count);
      await fetchLogs();
      setTimeout(() => setCleanupResult(null), 4000);
    } catch {}
  };

  // ── Shared ───────────────────────────────────────────────────────────────
  const isAdmin = currentUser?.role === 'admin';

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

  const levelBadge: Record<string, string> = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    debug: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  const TABS = [
    { id: 'users' as SettingsTab, label: t('settings.userManagement'), icon: Users },
    { id: 'organization' as SettingsTab, label: t('settings.orgSettings'), icon: Building2 },
    { id: 'ai' as SettingsTab, label: t('settings.aiSettings'), icon: Brain },
    { id: 'legal' as SettingsTab, label: t('settings.legalCompliance'), icon: Scale, badge: urgentCount > 0 ? urgentCount : undefined },
    { id: 'email' as SettingsTab, label: t('email.title'), icon: Mail },
    { id: 'backups' as SettingsTab, label: t('backups.title'), icon: HardDrive },
    { id: 'logs' as SettingsTab, label: t('logs.title'), icon: ScrollText },
  ];

  const inputClass = 'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

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

      {/* USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('settings.userManagement')}</h3>
              {loadingUsers && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
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
                {users.map(u => (
                  <tr key={u.id} className={clsx('transition-colors', !u.active ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                          u.id === currentUser?.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300')}>
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
                        u.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500')}>
                        {u.active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {u.active ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t('settings.editUser')}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { setResetTarget(u); setShowResetModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                          title={t('settings.resetPassword')}>
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('settings.deleteUser')}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loadingUsers && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                      Brak użytkowników
                    </td>
                  </tr>
                )}
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
                  value={(orgForm as unknown as Record<string, string>)[field.key]}
                  onChange={e => setOrgForm({ ...orgForm, [field.key]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={() => {
                invoke('save_organization', orgForm as unknown as Record<string, unknown>).then(() => {
                  setOrgSaved(true);
                  setTimeout(() => setOrgSaved(false), 3000);
                }).catch(() => {});
              }}
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
                  className={clsx(inputClass, 'font-mono')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('settings.ollamaModel')}</label>
                <select value={ollamaModel} onChange={e => setOllamaModel(e.target.value)} className={inputClass}>
                  {OLLAMA_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleTestConnection} disabled={connectionStatus === 'testing'}
                  className={clsx('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    connectionStatus === 'testing'
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white')}>
                  {connectionStatus === 'testing'
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{t('settings.connectionTesting')}</>
                    : <><RefreshCw className="w-4 h-4" />{t('settings.testConnection')}</>}
                </button>
                {connectionStatus === 'connected' && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle className="w-4 h-4" />{t('settings.connectionOk')}
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 font-medium">
                    <XCircle className="w-4 h-4" />{t('settings.connectionFailed')}
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
            <button onClick={() => refreshLegal()} disabled={legalLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
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
            <div key={change.id}
              className={clsx('rounded-xl border p-5 transition-opacity',
                severityColors[change.severity] || severityColors.info, dismissed && 'opacity-50')}>
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
                    <span className={clsx('font-semibold',
                      days_until <= 30 ? 'text-red-600 dark:text-red-400' :
                      days_until <= 90 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400')}>
                      {days_until > 0 ? `${days_until} ${t('settings.daysUntil')}` : t('settings.pastDue')}
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
                    <button onClick={() => apply(change.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t('settings.applyUpdate')}
                    </button>
                  )}
                  {!dismissed && (
                    <button onClick={() => dismiss(change.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
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

      {/* EMAIL TAB */}
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-blue-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('email.title')}</h3>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
            {t('email.futureNote')}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.smtpHost')}</label>
              <input value={emailSettings.smtp_host} onChange={e => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })} className={inputClass} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.smtpPort')}</label>
              <input value={emailSettings.smtp_port} onChange={e => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })} className={inputClass} placeholder="587" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.username')}</label>
              <input value={emailSettings.smtp_user} onChange={e => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.password')}</label>
              <input type="password" value={emailSettings.smtp_pass} onChange={e => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.fromAddress')}</label>
              <input type="email" value={emailSettings.from_address} onChange={e => setEmailSettings({ ...emailSettings, from_address: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email.fromName')}</label>
              <input value={emailSettings.from_name} onChange={e => setEmailSettings({ ...emailSettings, from_name: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="email_enabled" checked={emailSettings.enabled} onChange={e => setEmailSettings({ ...emailSettings, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="email_enabled" className="text-sm text-gray-700 dark:text-gray-300">{t('email.enabled')}</label>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveEmail} disabled={emailSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {emailSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('settings.saveSettings')}
            </button>
            {emailSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                {t('email.savedSuccess')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* BACKUPS TAB */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-500" />
              {t('backups.title')}
            </h3>
            <button onClick={() => setShowAddBackup(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
              {t('backups.addDestination')}
            </button>
          </div>

          {backupMessage && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
              {backupMessage}
            </div>
          )}

          {backupConfigs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
              <HardDrive className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('backups.noConfigs')}</p>
            </div>
          ) : (
            backupConfigs.map(config => (
              <div key={config.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{config.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {t(`backups.types.${config.backup_type}` as `backups.types.local`, { defaultValue: config.backup_type })}
                        </span>
                        {!config.enabled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500">{t('common.inactive')}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{config.path}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t('backups.lastBackup')}: {config.last_backup_at ? new Date(config.last_backup_at).toLocaleString('pl-PL') : t('backups.never')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleViewFiles(config.id)}
                      className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      {t('backups.viewBackups')}
                    </button>
                    <button onClick={() => handleRunBackup(config.id)} disabled={runningBackup === config.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                      {runningBackup === config.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                      {t('backups.runNow')}
                    </button>
                    <button onClick={async () => { await invoke('delete_backup_config', { id: config.id }); fetchBackupConfigs(); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedBackup === config.id && (
                  <div className="border-t border-gray-100 dark:border-gray-700 p-5">
                    {(backupFiles[config.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('backups.noBackups')}</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                            <th className="pb-2 font-semibold uppercase tracking-wide">{t('backups.name')}</th>
                            <th className="pb-2 font-semibold uppercase tracking-wide">{t('backups.size')}</th>
                            <th className="pb-2 font-semibold uppercase tracking-wide">{t('backups.created')}</th>
                            <th className="pb-2 font-semibold uppercase tracking-wide"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {(backupFiles[config.id] || []).map(file => (
                            <tr key={file.file_name}>
                              <td className="py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{file.file_name}</td>
                              <td className="py-2 text-gray-600 dark:text-gray-400">{(file.size_bytes / 1024 / 1024).toFixed(2)} MB</td>
                              <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">{new Date(file.created_at).toLocaleString('pl-PL')}</td>
                              <td className="py-2 text-right">
                                {restoreConfirmFile?.file_path === file.file_path ? (
                                  <div className="flex items-center gap-2 justify-end">
                                    <span className="text-xs text-red-600 dark:text-red-400">{t('backups.confirmRestore')}</span>
                                    <button onClick={() => handleRestoreBackup(file)}
                                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded">
                                      {t('common.yes')}
                                    </button>
                                    <button onClick={() => setRestoreConfirmFile(null)}
                                      className="px-2 py-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs rounded">
                                      {t('common.no')}
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setRestoreConfirmFile(file)}
                                    className="px-3 py-1 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg transition-colors">
                                    {t('backups.restore')}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-blue-500" />
              {t('logs.title')}
            </h3>
            <div className="flex items-center gap-2">
              <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); }}
                className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('logs.allLevels')}</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
                <option value="debug">debug</option>
              </select>
              <button onClick={fetchLogs} disabled={logsLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50">
                <RefreshCw className={clsx('w-4 h-4', logsLoading && 'animate-spin')} />
                {t('common.refresh')}
              </button>
              <button onClick={handleCleanupLogs}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                {t('logs.cleanup')}
              </button>
            </div>
          </div>

          {cleanupResult !== null && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
              {t('logs.cleanupResult')}: {cleanupResult}
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-3 uppercase tracking-wide">{t('logs.timestamp')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('logs.level')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('logs.module')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-3 uppercase tracking-wide">{t('logs.message')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      </td>
                    </tr>
                  ) : adminLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        {t('logs.noLogs')}
                      </td>
                    </tr>
                  ) : (
                    adminLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                          {new Date(log.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'medium' })}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', levelBadge[log.level] || levelBadge.info)}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400 font-mono">{log.module}</td>
                        <td className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300">{log.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && (
        <EditUserModal
          user={editingUser}
          onClose={() => { setShowEditModal(false); setEditingUser(undefined); }}
          onSave={handleSaveUser}
        />
      )}
      {showResetModal && resetTarget && (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => { setShowResetModal(false); setResetTarget(undefined); }}
        />
      )}
      {showAddBackup && (
        <AddBackupConfigModal
          onClose={() => setShowAddBackup(false)}
          onSave={fetchBackupConfigs}
        />
      )}
    </div>
  );
}
