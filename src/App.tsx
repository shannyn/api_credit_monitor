import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  RefreshCw,
  CreditCard,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Pencil,
  GripHorizontal
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types ---

interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  docsUrl: string;
  balancePath?: string; // path to the balance in the JSON response
  usagePath?: string;   // path to usage if balance isn't direct
  method?: 'GET' | 'POST';
  headers?: (key: string) => Record<string, string>;
  body?: (key: string) => any;
  transform?: (data: any) => { balance: number; currency: string; total?: number };
}

interface MonitorAccount {
  id: string;
  providerId: string;
  label: string;
  apiKey: string;
  customUrl?: string;
  customPath?: string;
  lastChecked?: string;
  balance?: number;
  total?: number;
  currency?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

// --- Presets ---

const PROVIDERS: Record<string, Provider> = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/user/balance',
    docsUrl: 'https://platform.deepseek.com/usage',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: parseFloat(data.balance_infos[0]?.total_balance || '0'),
      currency: 'CNY'
    })
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1/credits',
    docsUrl: 'https://openrouter.ai/settings/credits',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: data.data.total_credits - data.data.total_usage,
      currency: 'USD'
    })
  },
  moonshot: {
    id: 'moonshot',
    name: 'Kimi (Moonshot)',
    baseUrl: 'https://api.moonshot.cn/v1/users/me/balance',
    docsUrl: 'https://platform.moonshot.cn/console/info',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: data.data.available_balance || 0,
      currency: 'CNY'
    })
  },
  qwen: {
    id: 'qwen',
    name: 'Aliyun (DashScope/Qwen)',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1/user/usage',
    docsUrl: 'https://dashscope.console.aliyun.com/billing',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: data.balance || 0,
      currency: 'CNY'
    })
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    baseUrl: 'https://api.stripe.com/v1/balance',
    docsUrl: 'https://dashboard.stripe.com/balance',
    headers: (key) => ({ 'Authorization': `Basic ${btoa(key + ':')}` }),
    transform: (data) => ({
      balance: (data.available[0]?.amount || 0) / 100,
      currency: (data.available[0]?.currency || 'usd').toUpperCase()
    })
  },
  digitalocean: {
    id: 'digitalocean',
    name: 'DigitalOcean',
    baseUrl: 'https://api.digitalocean.com/v2/customers/my/balance',
    docsUrl: 'https://cloud.digitalocean.com/account/billing',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: Math.abs(parseFloat(data.month_to_date_balance || '0')),
      currency: 'USD (Usage)'
    })
  },
  resend: {
    id: 'resend',
    name: 'Resend (Email)',
    baseUrl: 'https://api.resend.com/emails',
    docsUrl: 'https://resend.com/settings/billing',
    headers: (key) => ({ 'Authorization': `Bearer ${key}` }),
    transform: (data) => ({
      balance: data.data?.length || 0,
      currency: 'Recent Emails'
    })
  },
  custom: {
    id: 'custom',
    name: 'Custom Provider',
    baseUrl: '',
    docsUrl: '',
  }
};

// --- Components ---

function SortableCard({
  account,
  fetchBalance,
  openEdit,
  removeAccount
}: {
  account: MonitorAccount;
  fetchBalance: (a: MonitorAccount) => void;
  openEdit: (a: MonitorAccount) => void;
  removeAccount: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative group"
    >
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripHorizontal className="w-4 h-4" />
        </div>
        <button
          onClick={() => openEdit(account)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => fetchBalance(account)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md"
          title="Refresh this account"
        >
          <RefreshCw className={`w-4 h-4 ${account.status === 'loading' ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => removeAccount(account.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-md"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 pr-24">
        <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <CreditCard className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-none truncate">{account.label}</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block truncate">
            {PROVIDERS[account.providerId]?.name}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Balance</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tracking-tight">
              {account.status === 'loading' ? '...' : (account.balance?.toFixed(2) || '0.00')}
            </span>
            <span className="text-sm font-medium text-slate-500">{account.currency || '$'}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Last: {account.lastChecked || 'Never'}</span>
          </div>

          {account.status === 'success' && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sync</span>
            </div>
          )}
          {account.status === 'error' && (
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400" title={account.errorMessage}>
              <AlertCircle className="w-3 h-3" />
              <span>Err</span>
            </div>
          )}
        </div>

        {account.status === 'error' && account.errorMessage && (
          <p className="text-[10px] text-rose-500 line-clamp-2 mt-1 italic">
            {account.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function App() {
  const [accounts, setAccounts] = useState<MonitorAccount[]>(() => {
    const saved = localStorage.getItem('api_monitor_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAccounts((items) => {
        const oldIndex = items.findIndex((a) => a.id === active.id);
        const newIndex = items.findIndex((a) => a.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    editId?: string;
  }>({ isOpen: false, mode: 'add' });

  const [formState, setFormState] = useState({
    providerId: 'deepseek',
    label: '',
    apiKey: '',
    customUrl: '',
    customPath: ''
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('api_monitor_accounts', JSON.stringify(accounts));
  }, [accounts]);

  const fetchBalance = useCallback(async (account: MonitorAccount) => {
    const provider = PROVIDERS[account.providerId];
    if (!provider) return;

    setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, status: 'loading', errorMessage: undefined } : a));

    try {
      const url = account.providerId === 'custom' ? account.customUrl || '' : provider.baseUrl;
      if (!url) throw new Error('No API endpoint URL provided');

      const response = await fetch(url, {
        method: provider.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(provider.headers ? provider.headers(account.apiKey) : { 'Authorization': `Bearer ${account.apiKey}` })
        },
        body: provider.body ? JSON.stringify(provider.body(account.apiKey)) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let result;

      if (account.providerId === 'custom' && account.customPath) {
        // Simple value extraction for custom path like "data.balance"
        const path = account.customPath.split('.');
        let val = data;
        for (const p of path) {
          val = val?.[p];
        }
        result = { balance: parseFloat(val || '0'), currency: '?', total: undefined as number | undefined };
      } else {
        result = provider.transform
          ? provider.transform(data)
          : { balance: data.balance || 0, currency: data.currency || '$', total: undefined as number | undefined };
      }

      setAccounts(prev => prev.map(a =>
        a.id === account.id
          ? {
              ...a,
              balance: result.balance,
              total: 'total' in result ? result.total : undefined,
              currency: result.currency,
              status: 'success',
              lastChecked: new Date().toLocaleTimeString()
            }
          : a
      ));
    } catch (error: any) {
      console.error(`Error fetching ${account.label}:`, error);
      let msg = error.message;
      if (msg.includes('Failed to fetch')) {
        msg = 'Connection failed (likely CORS issue). Open browser with --disable-web-security or use a proxy.';
      }
      setAccounts(prev => prev.map(a =>
        a.id === account.id
          ? { ...a, status: 'error', errorMessage: msg, lastChecked: new Date().toLocaleTimeString() }
          : a
      ));
    }
  }, []);

  const refreshAll = useCallback(() => {
    accounts.forEach(acc => fetchBalance(acc));
  }, [accounts, fetchBalance]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    refreshAll();
    const timer = setInterval(refreshAll, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []); // Initial load only

  const handleSave = () => {
    if (!formState.label || !formState.apiKey) return;

    if (modalState.mode === 'add') {
      const account: MonitorAccount = {
        id: crypto.randomUUID(),
        providerId: formState.providerId,
        label: formState.label,
        apiKey: formState.apiKey,
        customUrl: formState.customUrl,
        customPath: formState.customPath,
        status: 'idle'
      };
      const newAccounts = [...accounts, account];
      setAccounts(newAccounts);
      fetchBalance(account);
    } else if (modalState.mode === 'edit' && modalState.editId) {
      const updatedAccounts: MonitorAccount[] = accounts.map(a =>
        a.id === modalState.editId
          ? {
              ...a,
              providerId: formState.providerId,
              label: formState.label,
              apiKey: formState.apiKey,
              customUrl: formState.customUrl,
              customPath: formState.customPath,
              status: 'idle' as const
            }
          : a
      );
      setAccounts(updatedAccounts);
      const updatedAccount = updatedAccounts.find(a => a.id === modalState.editId);
      if (updatedAccount) fetchBalance(updatedAccount);
    }

    setModalState({ isOpen: false, mode: 'add' });
    setFormState({ providerId: 'deepseek', label: '', apiKey: '', customUrl: '', customPath: '' });
  };

  const openAdd = () => {
    setFormState({ providerId: 'deepseek', label: '', apiKey: '', customUrl: '', customPath: '' });
    setModalState({ isOpen: true, mode: 'add' });
  };

  const openEdit = (account: MonitorAccount) => {
    setFormState({
      providerId: account.providerId,
      label: account.label,
      apiKey: account.apiKey,
      customUrl: account.customUrl || '',
      customPath: account.customPath || ''
    });
    setModalState({ isOpen: true, mode: 'edit', editId: account.id });
  };

  const removeAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Credit Monitor</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Track your AI service balances in one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshAll}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh All</span>
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dashboard</span>
            </button>
          </div>
        </header>

        {/* Proxy Warning */}
        <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex gap-3 text-amber-800 dark:text-amber-200 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">CORS Notice</p>
            <p className="mt-1 opacity-90">
              Most direct API calls from browsers are blocked by CORS. For this pure frontend tool to work, you may need to use a browser extension that disables CORS or run a local proxy.
              API keys are stored <span className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">only in your browser's local storage</span>.
            </p>
          </div>
        </div>

        {/* Dashboard Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SortableContext
              items={accounts.map(a => a.id)}
              strategy={rectSortingStrategy}
            >
              {accounts.map(account => (
                <SortableCard
                  key={account.id}
                  account={account}
                  fetchBalance={fetchBalance}
                  openEdit={openEdit}
                  removeAccount={removeAccount}
                />
              ))}
            </SortableContext>

            {/* Empty State / Add Placeholder */}
            {accounts.length === 0 && !modalState.isOpen && (
              <div className="col-span-full py-20 bg-slate-100/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                <CreditCard className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">No dashboards added yet</p>
                <button
                  onClick={openAdd}
                  className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  Create your first monitor
                </button>
              </div>
            )}
          </div>
        </DndContext>

        {/* Footer info */}
        <footer className="mt-20 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
          <p>Built with React & Tailwind. All data stays in your browser.</p>
        </footer>
      </div>

      {/* Modal Overlay */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">{modalState.mode === 'add' ? 'Add' : 'Edit'} Monitor</h2>
              <button
                onClick={() => setModalState({ ...modalState, isOpen: false })}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Provider</label>
                <select
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.providerId}
                  onChange={e => setFormState({...formState, providerId: e.target.value})}
                >
                  {Object.values(PROVIDERS).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {formState.providerId === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">API Endpoint URL</label>
                    <input
                      type="text"
                      placeholder="https://api.example.com/v1/balance"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formState.customUrl}
                      onChange={e => setFormState({...formState, customUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Balance JSON Path (e.g. data.amount)</label>
                    <input
                      type="text"
                      placeholder="data.balance"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formState.customPath}
                      onChange={e => setFormState({...formState, customPath: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">Label (e.g. Work API)</label>
                <input
                  type="text"
                  placeholder="Personal OpenAI"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.label}
                  onChange={e => setFormState({...formState, label: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="sk-..."
                    className="w-full p-2.5 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={formState.apiKey}
                    onChange={e => setFormState({...formState, apiKey: e.target.value})}
                  />
                  <Shield className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                </div>
                <p className="mt-2 text-[11px] text-slate-400 flex gap-1.5 items-start">
                  <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  Your key is saved locally in your browser cache and never sent to any server except the provider's API.
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setModalState({ ...modalState, isOpen: false })}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formState.label || !formState.apiKey}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalState.mode === 'add' ? 'Add' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
