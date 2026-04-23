import { useState, useMemo, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import { supabase } from './supabaseClient';

const CL = [
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#6366f1',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#e11d48',
  '#a855f7',
  '#0ea5e9',
  '#d946ef',
  '#facc15',
  '#fb923c',
  '#22d3ee',
  '#a3e635',
  '#f43f5e',
  '#818cf8',
];
const fmt = (n) => {
  if (!n && n !== 0) return '0';
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (a >= 1e5) return (n / 1e3).toFixed(0) + 'K';
  if (a >= 1e4) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
};
const ff = (n) => n?.toLocaleString?.() ?? '0';
const tC = (t) =>
  t === 'Income'
    ? '#10b981'
    : t === 'Expense'
    ? '#ef4444'
    : t.includes('Loan')
    ? '#f59e0b'
    : t.includes('Savings')
    ? '#8b5cf6'
    : '#6366f1';
const tB = (t) =>
  t === 'Income'
    ? 'rgba(16,185,129,.12)'
    : t === 'Expense'
    ? 'rgba(239,68,68,.12)'
    : t.includes('Loan')
    ? 'rgba(245,158,11,.12)'
    : t.includes('Savings')
    ? 'rgba(139,92,246,.12)'
    : 'rgba(99,102,241,.12)';
const cd = {
  background: 'rgba(255,255,255,.03)',
  borderRadius: 16,
  padding: 20,
  border: '1px solid rgba(255,255,255,.06)',
};
const ip = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  padding: '10px 14px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
};
const thS = {
  textAlign: 'left',
  padding: '10px 8px',
  color: '#64748b',
  fontWeight: 600,
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  borderBottom: '2px solid rgba(255,255,255,.08)',
};
const td = {
  padding: '10px 8px',
  fontSize: 12,
  borderBottom: '1px solid rgba(255,255,255,.03)',
};
const mn = { fontFamily: "'JetBrains Mono',monospace" };
const ts = {
  background: '#1e293b',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
};
const TABS = [
  { id: 'dashboard', l: 'Dashboard', i: '💰' },
  { id: 'transactions', l: 'Transactions', i: '📋' },
  { id: 'savings', l: 'Savings', i: '🏦' },
  { id: 'monthly', l: 'Monthly Summary', i: '📅' },
  { id: 'accounts', l: 'Account Summary', i: '🏧' },
  { id: 'savSummary', l: 'Savings Summary', i: '💎' },
  { id: 'loans', l: 'Loan Summary', i: '🤝' },
  { id: 'report', l: 'Monthly Report', i: '📊' },
  { id: 'settings', l: 'Settings', i: '⚙️' },
];

const DEFAULT_SETTINGS = {
  categories: [
    'Rent',
    'Office Expense',
    'Utilities',
    'Food',
    'Travel',
    'Subscriptions',
    'Salary',
    'Shopping',
    'Bills',
    'Fuel',
    'For Me',
    'Savings',
    'Cash',
    'My Accounts',
    'Mama',
    'Loan',
    'Others',
    'Splitwise',
    'Fun',
    'Snacks',
  ],
  accounts: [
    'Meezan',
    'Alfalah',
    'Allied',
    'Cash',
    'Easypaisa',
    'JazzCash',
    'Sadapay',
    'Zindagi',
    'Nayapay',
    'Redotpay',
  ],
  savings_locations: [
    'Cash Backup',
    'Easypaisa Savings',
    'JazzCash Savings',
    'Zindagi',
    'Meezan Savings',
  ],
  groups: ['Office', 'Personal'],
  types: [
    'Income',
    'Expense',
    'Transfer',
    'Loan Given',
    'Loan Taken',
    'Loan Received Back',
    'Loan Repaid',
    'Savings Deposit',
    'Savings Withdraw',
  ],
  loan_people: [
    'Sheikh',
    'Hamza',
    'Papa',
    'Abdullah',
    'Ali',
    'Abdul Office',
    'Fakhar',
    'Shahbaz Bhai',
    'Mughees Editor',
  ],
  opening_balances: [
    { account: 'Meezan', amount: 1854 },
    { account: 'Alfalah', amount: 191 },
    { account: 'Allied', amount: 92 },
    { account: 'Cash', amount: 300 },
    { account: 'Easypaisa', amount: 1517 },
    { account: 'JazzCash', amount: 33 },
    { account: 'Sadapay', amount: 162 },
    { account: 'Zindagi', amount: 189 },
    { account: 'Nayapay', amount: 9 },
    { account: 'Redotpay', amount: 266 },
  ],
  loan_opening: [
    { person: 'Sheikh', given: 0, taken: 11550 },
    { person: 'Hamza', given: 0, taken: 50000 },
    { person: 'Papa', given: 0, taken: 5000 },
    { person: 'Abdullah', given: 0, taken: 0 },
    { person: 'Ali', given: 0, taken: 400000 },
    { person: 'Abdul Office', given: 35000, taken: 0 },
    { person: 'Fakhar', given: 30000, taken: 0 },
    { person: 'Shahbaz Bhai', given: 23000, taken: 0 },
    { person: 'Mughees Editor', given: 10000, taken: 0 },
    { person: 'Hamza 2', given: 0, taken: 1400000 },
  ],
  savings_opening: [
    { location: 'Cash Backup', amount: 10000 },
    { location: 'Easypaisa Savings', amount: 0 },
    { location: 'JazzCash Savings', amount: 0 },
    { location: 'Zindagi', amount: 0 },
    { location: 'Meezan Savings', amount: 0 },
  ],
};

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(today);
  const [showAdd, setShowAdd] = useState(false);
  const [newTx, setNewTx] = useState({
    d: today,
    t: 'Expense',
    c: 'Food',
    g: 'Personal',
    desc: '',
    a: '',
    fa: 'Alfalah',
    ta: '',
    p: '',
    n: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [txR, stR] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('d', { ascending: false }),
        supabase.from('user_settings').select('*').maybeSingle(),
      ]);
      if (txR.error) throw txR.error;
      setData(txR.data || []);
      if (stR.data) {
        setSettings({
          categories: stR.data.categories || DEFAULT_SETTINGS.categories,
          accounts: stR.data.accounts || DEFAULT_SETTINGS.accounts,
          savings_locations:
            stR.data.savings_locations || DEFAULT_SETTINGS.savings_locations,
          groups: stR.data.groups || DEFAULT_SETTINGS.groups,
          types: stR.data.types || DEFAULT_SETTINGS.types,
          loan_people: stR.data.loan_people || DEFAULT_SETTINGS.loan_people,
          opening_balances:
            stR.data.opening_balances || DEFAULT_SETTINGS.opening_balances,
          loan_opening: stR.data.loan_opening || DEFAULT_SETTINGS.loan_opening,
          savings_opening:
            stR.data.savings_opening || DEFAULT_SETTINGS.savings_opening,
        });
      }
    } catch (err) {
      setError('Failed to load: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTx.a || !newTx.d) return;
    setSaving(true);
    setError('');
    try {
      const { data: ins, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          d: newTx.d,
          t: newTx.t,
          c: newTx.c,
          g: newTx.g,
          description: newTx.desc,
          a: parseFloat(newTx.a),
          fa: newTx.fa || '',
          ta: newTx.ta || '',
          p: newTx.p || '',
          n: newTx.n || '',
        })
        .select()
        .single();
      if (error) throw error;
      setData((prev) => [ins, ...prev]);
      setNewTx({
        d: today,
        t: 'Expense',
        c: 'Food',
        g: 'Personal',
        desc: '',
        a: '',
        fa: 'Alfalah',
        ta: '',
        p: '',
        n: '',
      });
      setShowAdd(false);
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setData((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError('Delete failed: ' + err.message);
    }
  };

  const norm = useMemo(
    () =>
      data.map((tx) => ({
        ...tx,
        desc: tx.description || tx.desc || '',
        a: parseFloat(tx.a) || 0,
      })),
    [data]
  );
  const filtered = useMemo(
    () =>
      norm.filter((tx) => {
        if (fromDate && tx.d < fromDate) return false;
        if (toDate && tx.d > toDate) return false;
        return true;
      }),
    [norm, fromDate, toDate]
  );

  const stats = useMemo(() => {
    let r = {
      income: 0,
      expense: 0,
      loanGiven: 0,
      loanTaken: 0,
      loanRepaid: 0,
      loanBack: 0,
      savings: 0,
      transfer: 0,
      offExp: 0,
      perExp: 0,
    };
    filtered.forEach((tx) => {
      if (tx.t === 'Income') r.income += tx.a;
      else if (tx.t === 'Expense') {
        r.expense += tx.a;
        if (tx.g === 'Office') r.offExp += tx.a;
        else r.perExp += tx.a;
      } else if (tx.t === 'Loan Given') r.loanGiven += tx.a;
      else if (tx.t === 'Loan Taken') r.loanTaken += tx.a;
      else if (tx.t === 'Loan Repaid') r.loanRepaid += tx.a;
      else if (tx.t === 'Loan Received Back') r.loanBack += tx.a;
      else if (tx.t === 'Savings Deposit') r.savings += tx.a;
      else if (tx.t === 'Transfer') r.transfer += tx.a;
    });
    r.net = r.income - r.expense;
    r.loanImpact = r.loanTaken - r.loanRepaid - r.loanGiven + r.loanBack;
    return r;
  }, [filtered]);

  const catData = useMemo(() => {
    const m = {};
    filtered
      .filter((tx) => tx.t === 'Expense')
      .forEach((tx) => {
        m[tx.c] = (m[tx.c] || 0) + tx.a;
      });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: CL[i % CL.length] }));
  }, [filtered]);
  const dailyData = useMemo(() => {
    const m = {};
    filtered.forEach((tx) => {
      if (!m[tx.d]) m[tx.d] = { date: tx.d, income: 0, expense: 0 };
      if (tx.t === 'Income') m[tx.d].income += tx.a;
      else if (tx.t === 'Expense') m[tx.d].expense += tx.a;
    });
    return Object.values(m).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);
  const groupData = useMemo(() => {
    let o = 0,
      p = 0;
    filtered
      .filter((tx) => tx.t === 'Expense')
      .forEach((tx) => {
        if (tx.g === 'Office') o += tx.a;
        else p += tx.a;
      });
    return [
      { name: 'Office', value: o, color: '#6366f1' },
      { name: 'Personal', value: p, color: '#f59e0b' },
    ];
  }, [filtered]);

  const ACCOUNTS = useMemo(() => {
    const bal = {};
    settings.accounts.forEach((acc) => {
      const op =
        settings.opening_balances.find((o) => o.account === acc)?.amount || 0;
      bal[acc] = {
        name: acc,
        opening: op,
        moneyIn: 0,
        moneyOut: 0,
        balance: op,
      };
    });
    norm.forEach((tx) => {
      if (tx.ta && bal[tx.ta]) {
        bal[tx.ta].moneyIn += tx.a;
        bal[tx.ta].balance += tx.a;
      }
      if (tx.fa && bal[tx.fa]) {
        bal[tx.fa].moneyOut += tx.a;
        bal[tx.fa].balance -= tx.a;
      }
    });
    return Object.values(bal);
  }, [norm, settings]);

  const LOANS = useMemo(() => {
    const loans = {};
    settings.loan_people.forEach((p) => {
      const op = settings.loan_opening.find((l) => l.person === p) || {
        given: 0,
        taken: 0,
      };
      loans[p] = {
        person: p,
        given: 0,
        receivedBack: 0,
        taken: 0,
        repaid: 0,
        openGiven: op.given || 0,
        openTaken: op.taken || 0,
      };
    });
    norm.forEach((tx) => {
      if (!tx.p || !loans[tx.p]) return;
      if (tx.t === 'Loan Given') loans[tx.p].given += tx.a;
      else if (tx.t === 'Loan Received Back') loans[tx.p].receivedBack += tx.a;
      else if (tx.t === 'Loan Taken') loans[tx.p].taken += tx.a;
      else if (tx.t === 'Loan Repaid') loans[tx.p].repaid += tx.a;
    });
    return Object.values(loans).map((l) => ({
      ...l,
      net:
        l.openGiven +
        l.given -
        l.receivedBack -
        (l.openTaken + l.taken - l.repaid),
    }));
  }, [norm, settings]);

  const SAVINGS_DATA = useMemo(
    () =>
      norm
        .filter(
          (tx) => tx.t === 'Savings Deposit' || tx.t === 'Savings Withdraw'
        )
        .map((tx) => ({
          d: tx.d,
          mo: new Date(tx.d).toLocaleString('default', { month: 'long' }),
          t: tx.t,
          loc: tx.c === 'Savings' ? 'Cash Backup' : tx.c,
          a: tx.a,
        })),
    [norm]
  );

  const SAVINGS_SUMMARY = useMemo(
    () =>
      settings.savings_locations.map((loc) => {
        const op =
          settings.savings_opening.find((s) => s.location === loc)?.amount || 0;
        const deps = SAVINGS_DATA.filter(
          (s) => s.loc === loc && s.t === 'Savings Deposit'
        ).reduce((s, x) => s + x.a, 0);
        const withs = SAVINGS_DATA.filter(
          (s) => s.loc === loc && s.t === 'Savings Withdraw'
        ).reduce((s, x) => s + x.a, 0);
        const lastTx = SAVINGS_DATA.filter((s) => s.loc === loc).sort((a, b) =>
          b.d.localeCompare(a.d)
        )[0];
        return {
          location: loc,
          deposits: deps,
          withdraws: withs,
          netSavings: deps - withs,
          lastActivity: lastTx?.d || '—',
          openingBalance: op,
          totalBalance: op + deps - withs,
        };
      }),
    [SAVINGS_DATA, settings]
  );

  const MONTHLY_SUMMARY = useMemo(
    () =>
      [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ].map((month, mi) => {
        const txs = norm.filter((tx) => new Date(tx.d).getMonth() === mi);
        let r = {
          month,
          income: 0,
          expense: 0,
          loanGiven: 0,
          loanTaken: 0,
          loanRepaid: 0,
          loanReceivedBack: 0,
          officeExpense: 0,
          personalExpense: 0,
          transfer: 0,
        };
        txs.forEach((tx) => {
          if (tx.t === 'Income') r.income += tx.a;
          else if (tx.t === 'Expense') {
            r.expense += tx.a;
            if (tx.g === 'Office') r.officeExpense += tx.a;
            else r.personalExpense += tx.a;
          } else if (tx.t === 'Loan Given') r.loanGiven += tx.a;
          else if (tx.t === 'Loan Taken') r.loanTaken += tx.a;
          else if (tx.t === 'Loan Repaid') r.loanRepaid += tx.a;
          else if (tx.t === 'Loan Received Back') r.loanReceivedBack += tx.a;
          else if (tx.t === 'Transfer') r.transfer += tx.a;
        });
        r.netMovement = r.income - r.expense;
        r.loanImpact =
          r.loanTaken - r.loanRepaid - r.loanGiven + r.loanReceivedBack;
        r.accountNet = r.netMovement + r.loanImpact;
        r.closingBalance = r.accountNet;
        return r;
      }),
    [norm]
  );

  const EXPENSE_CATS = useMemo(() => {
    const m = {};
    norm
      .filter((tx) => tx.t === 'Expense')
      .forEach((tx) => {
        m[tx.c] = (m[tx.c] || 0) + tx.a;
      });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([c, a]) => ({ c, a }));
  }, [norm]);

  const MR = useMemo(() => {
    const cm = new Date().getMonth();
    const txs = norm.filter((tx) => new Date(tx.d).getMonth() === cm);
    let r = {
      totalIncome: 0,
      totalExpense: 0,
      loanGiven: 0,
      loanTaken: 0,
      loanRepaid: 0,
      loanReceivedBack: 0,
      transfer: 0,
      savingsDeposit: 0,
      savingsWithdraw: 0,
    };
    txs.forEach((tx) => {
      if (tx.t === 'Income') r.totalIncome += tx.a;
      else if (tx.t === 'Expense') r.totalExpense += tx.a;
      else if (tx.t === 'Loan Given') r.loanGiven += tx.a;
      else if (tx.t === 'Loan Taken') r.loanTaken += tx.a;
      else if (tx.t === 'Loan Repaid') r.loanRepaid += tx.a;
      else if (tx.t === 'Loan Received Back') r.loanReceivedBack += tx.a;
      else if (tx.t === 'Transfer') r.transfer += tx.a;
      else if (tx.t === 'Savings Deposit') r.savingsDeposit += tx.a;
      else if (tx.t === 'Savings Withdraw') r.savingsWithdraw += tx.a;
    });
    r.netBalance = r.totalIncome - r.totalExpense;
    r.adjustedNet =
      r.netBalance +
      r.loanTaken -
      r.loanRepaid -
      r.loanGiven +
      r.loanReceivedBack;
    r.savings = SAVINGS_SUMMARY.map((s) => ({
      loc: s.location,
      opening: s.openingBalance,
      activity: s.deposits - s.withdraws,
    }));
    r.accounts = ACCOUNTS.map((a) => ({ name: a.name, bal: a.balance }));
    return r;
  }, [norm, SAVINGS_SUMMARY, ACCOUNTS]);

  const KPI = ({ label, value, sub, color, icon }) => (
    <div style={{ ...cd, position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: color,
          borderRadius: '16px 16px 0 0',
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: '#94a3b8',
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {icon} {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', ...mn }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
          {sub}
        </div>
      )}
    </div>
  );
  const ST = ({ children, icon }) => (
    <h3
      style={{
        margin: '0 0 16px',
        fontSize: 15,
        fontWeight: 700,
        color: '#a78bfa',
      }}
    >
      {icon} {children}
    </h3>
  );
  const TW = ({ children }) => (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
      >
        {children}
      </table>
    </div>
  );
  const Bd = ({ text, color, bg }) => (
    <span
      style={{
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {text}
    </span>
  );

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(180deg,#0c0f1a 0%,#111827 50%,#0f172a 100%)',
          color: '#e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter',-apple-system,sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
          <div style={{ color: '#94a3b8' }}>Loading your finances...</div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg,#0c0f1a 0%,#111827 50%,#0f172a 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter',-apple-system,sans-serif",
        padding: '20px 16px',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg,#6366f1,#a78bfa,#ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Expense Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>
            Waleed's Complete Finance Tracker — All 9 Sheets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              background: 'linear-gradient(135deg,#10b981,#059669)',
              border: 'none',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              boxShadow: '0 4px 20px rgba(16,185,129,.3)',
            }}
          >
            + Add Transaction
          </button>
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.2)',
              color: '#f87171',
              padding: '10px 16px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            Logout
          </button>
        </div>
      </div>
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 10,
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.2)',
            color: '#f87171',
            fontSize: 12,
          }}
        >
          ⚠️ {error}
        </div>
      )}
      {showAdd && (
        <div
          style={{
            ...cd,
            marginBottom: 20,
            borderColor: 'rgba(99,102,241,.3)',
          }}
        >
          <ST icon="✏️">New Transaction</ST>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
              gap: 10,
            }}
          >
            {[
              ['Date', 'd', 'date'],
              ['Type', 't', 'select', settings.types],
              ['Category', 'c', 'select', settings.categories],
              ['Group', 'g', 'select', settings.groups],
              ['Amount (PKR)', 'a', 'number'],
              ['Description', 'desc', 'text'],
              ['From Account', 'fa', 'select', ['—', ...settings.accounts]],
              ['To Account', 'ta', 'select', ['—', ...settings.accounts]],
              ['Party', 'p', 'select', ['—', ...settings.loan_people]],
              ['Notes', 'n', 'text'],
            ].map(([label, key, type, opts]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: 10,
                    color: '#94a3b8',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  {label}
                </label>
                {type === 'select' ? (
                  <select
                    value={newTx[key]}
                    onChange={(e) =>
                      setNewTx({
                        ...newTx,
                        [key]: e.target.value === '—' ? '' : e.target.value,
                      })
                    }
                    style={ip}
                  >
                    {opts.map((o) => (
                      <option key={o} value={o === '—' ? '' : o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={type}
                    placeholder={type === 'number' ? '0' : '...'}
                    value={newTx[key]}
                    onChange={(e) =>
                      setNewTx({ ...newTx, [key]: e.target.value })
                    }
                    style={ip}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <button
              onClick={handleAdd}
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border: 'none',
                color: '#fff',
                padding: '10px 24px',
                borderRadius: 10,
                cursor: saving ? 'wait' : 'pointer',
                fontWeight: 700,
                fontSize: 13,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                background: 'rgba(255,255,255,.06)',
                border: '1px solid rgba(255,255,255,.1)',
                color: '#94a3b8',
                padding: '10px 24px',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 18,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {[
          ['FROM', fromDate, setFromDate],
          ['TO', toDate, setToDate],
        ].map(([l, v, s]) => (
          <div
            key={l}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,.03)',
              padding: '6px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,.06)',
            }}
          >
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
              {l}
            </span>
            <input
              type="date"
              value={v}
              onChange={(e) => s(e.target.value)}
              style={{
                ...ip,
                width: 'auto',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
              }}
            />
          </div>
        ))}
        <button
          onClick={() => {
            setFromDate('');
            setToDate('');
          }}
          style={{
            background: 'rgba(239,68,68,.1)',
            border: '1px solid rgba(239,68,68,.2)',
            color: '#f87171',
            padding: '6px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          Clear
        </button>
        <span style={{ fontSize: 11, color: '#475569', ...mn }}>
          {filtered.length} records
        </span>
      </div>
      <div
        style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              cursor: 'pointer',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background:
                tab === t.id
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : 'rgba(255,255,255,.04)',
              color: tab === t.id ? '#fff' : '#94a3b8',
              border: tab === t.id ? 'none' : '1px solid rgba(255,255,255,.06)',
              transition: 'all .3s',
            }}
          >
            {t.i} {t.l}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <KPI
              label="Total Income"
              value={'₨ ' + fmt(stats.income)}
              color="#10b981"
              icon="💰"
            />
            <KPI
              label="Total Expense"
              value={'₨ ' + fmt(stats.expense)}
              color="#ef4444"
              icon="💸"
            />
            <KPI
              label="Net Balance"
              value={'₨ ' + fmt(stats.net)}
              sub={stats.net >= 0 ? 'Surplus' : 'Deficit'}
              color={stats.net >= 0 ? '#10b981' : '#ef4444'}
              icon="📊"
            />
            <KPI
              label="Total Savings"
              value={'₨ ' + fmt(stats.savings)}
              color="#8b5cf6"
              icon="💎"
            />
            <KPI
              label="Account Balance"
              value={'₨ ' + ff(ACCOUNTS.reduce((s, a) => s + a.balance, 0))}
              color="#06b6d4"
              icon="🏧"
            />
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <KPI
              label="Others Owe Me"
              value={
                '₨ ' +
                ff(
                  LOANS.filter((l) => l.net > 0).reduce((s, l) => s + l.net, 0)
                )
              }
              color="#f59e0b"
              icon="📤"
            />
            <KPI
              label="I Owe Others"
              value={
                '₨ ' +
                fmt(
                  Math.abs(
                    LOANS.filter((l) => l.net < 0).reduce(
                      (s, l) => s + l.net,
                      0
                    )
                  )
                )
              }
              color="#ec4899"
              icon="📥"
            />
            <KPI
              label="Net Loan"
              value={'₨ ' + ff(LOANS.reduce((s, l) => s + l.net, 0))}
              color="#f97316"
              icon="🔄"
            />
            <KPI
              label="Loan Impact"
              value={'₨ ' + ff(stats.loanImpact)}
              color="#14b8a6"
              icon="⚡"
            />
          </div>
          <div style={{ ...cd, marginBottom: 20 }}>
            <ST icon="📈">Daily Income vs Expense</ST>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  tickFormatter={fmt}
                />
                <Tooltip contentStyle={ts} formatter={(v) => '₨ ' + ff(v)} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fill="url(#gi)"
                  strokeWidth={2}
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  fill="url(#ge)"
                  strokeWidth={2}
                  name="Expense"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div style={cd}>
              <ST icon="📊">Expense by Category</ST>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={catData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {catData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ts} formatter={(v) => '₨ ' + ff(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 5,
                  marginTop: 6,
                }}
              >
                {catData.slice(0, 10).map((c, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 9,
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        background: c.color,
                        display: 'inline-block',
                      }}
                    />
                    {c.name}: {fmt(c.value)}
                  </span>
                ))}
              </div>
            </div>
            <div style={cd}>
              <ST icon="🏢">Office vs Personal</ST>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={groupData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {groupData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={ts} formatter={(v) => '₨ ' + ff(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  justifyContent: 'center',
                  marginTop: 6,
                }}
              >
                {groupData.map((g, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 5,
                        background: g.color,
                        display: 'inline-block',
                      }}
                    />
                    {g.name}: ₨ {fmt(g.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div style={cd}>
              <ST icon="🏦">Account Balances</ST>
              {ACCOUNTS.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500 }}>
                    {a.name}
                  </span>
                  <span
                    style={{
                      ...mn,
                      fontSize: 12,
                      fontWeight: 600,
                      color: a.balance > 0 ? '#10b981' : '#64748b',
                    }}
                  >
                    {ff(a.balance)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '2px solid rgba(255,255,255,.08)',
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 700 }}>TOTAL</span>
                <span style={{ ...mn, fontWeight: 800, color: '#10b981' }}>
                  {ff(ACCOUNTS.reduce((s, a) => s + a.balance, 0))}
                </span>
              </div>
            </div>
            <div style={cd}>
              <ST icon="🤝">Loan Positions</ST>
              {LOANS.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{l.person}</span>
                  <span
                    style={{
                      ...mn,
                      fontSize: 12,
                      fontWeight: 600,
                      color:
                        l.net > 0
                          ? '#10b981'
                          : l.net < 0
                          ? '#f87171'
                          : '#64748b',
                    }}
                  >
                    {l.net >= 0 ? '+' : ''}
                    {ff(l.net)}
                  </span>
                </div>
              ))}
            </div>
            <div style={cd}>
              <ST icon="📊">Expense by Category</ST>
              {EXPENSE_CATS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{c.c}</span>
                  <span style={{ ...mn, fontSize: 12, fontWeight: 600 }}>
                    {ff(c.a)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'transactions' && (
        <div style={cd}>
          <ST icon="📋">All Transactions ({filtered.length})</ST>
          <TW>
            <thead>
              <tr>
                {[
                  'Date',
                  'Type',
                  'Category',
                  'Group',
                  'Description',
                  'Amount',
                  'From',
                  'To',
                  'Party',
                  'Notes',
                  '',
                ].map((h) => (
                  <th key={h} style={thS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filtered]
                .sort((a, b) => b.d.localeCompare(a.d))
                .map((tx, i) => (
                  <tr
                    key={tx.id || i}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,.02)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <td
                      style={{ ...td, ...mn, fontSize: 11, color: '#94a3b8' }}
                    >
                      {tx.d.slice(5)}
                    </td>
                    <td style={td}>
                      <Bd text={tx.t} color={tC(tx.t)} bg={tB(tx.t)} />
                    </td>
                    <td style={{ ...td, fontWeight: 500 }}>{tx.c}</td>
                    <td style={td}>
                      <Bd
                        text={tx.g}
                        color={tx.g === 'Office' ? '#a5b4fc' : '#fbbf24'}
                        bg={
                          tx.g === 'Office'
                            ? 'rgba(99,102,241,.12)'
                            : 'rgba(245,158,11,.12)'
                        }
                      />
                    </td>
                    <td
                      style={{
                        ...td,
                        color: '#94a3b8',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tx.desc || '—'}
                    </td>
                    <td
                      style={{ ...td, ...mn, fontWeight: 600, color: tC(tx.t) }}
                    >
                      {ff(tx.a)}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: '#64748b' }}>
                      {tx.fa || '—'}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: '#64748b' }}>
                      {tx.ta || '—'}
                    </td>
                    <td style={{ ...td, fontSize: 11, color: '#a78bfa' }}>
                      {tx.p || '—'}
                    </td>
                    <td style={{ ...td, fontSize: 10, color: '#475569' }}>
                      {tx.n || '—'}
                    </td>
                    <td style={td}>
                      {tx.id && (
                        <button
                          onClick={() => handleDelete(tx.id)}
                          style={{
                            background: 'rgba(239,68,68,.1)',
                            border: '1px solid rgba(239,68,68,.2)',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 10,
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </TW>
        </div>
      )}

      {tab === 'savings' && (
        <div style={cd}>
          <ST icon="🏦">Savings Transactions</ST>
          <TW>
            <thead>
              <tr>
                {['Date', 'Month', 'Type', 'Location', 'Amount'].map((h) => (
                  <th key={h} style={thS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAVINGS_DATA.map((s, i) => (
                <tr key={i}>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#94a3b8' }}>
                    {s.d}
                  </td>
                  <td style={{ ...td, fontWeight: 500 }}>{s.mo}</td>
                  <td style={td}>
                    <Bd text={s.t} color="#a78bfa" bg="rgba(139,92,246,.12)" />
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{s.loc}</td>
                  <td
                    style={{ ...td, ...mn, fontWeight: 600, color: '#10b981' }}
                  >
                    {ff(s.a)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TW>
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'rgba(139,92,246,.08)',
              borderRadius: 12,
              border: '1px solid rgba(139,92,246,.15)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600, color: '#a78bfa' }}>
              Total Savings Deposited
            </span>
            <span style={{ ...mn, fontWeight: 700, color: '#10b981' }}>
              ₨{' '}
              {ff(
                SAVINGS_DATA.filter((s) => s.t === 'Savings Deposit').reduce(
                  (s, x) => s + x.a,
                  0
                )
              )}
            </span>
          </div>
        </div>
      )}

      {tab === 'monthly' && (
        <div style={cd}>
          <ST icon="📅">Monthly Summary (Jan–Dec)</ST>
          <TW>
            <thead>
              <tr>
                {[
                  'Month',
                  'Income',
                  'Expense',
                  'Loan Given',
                  'Loan Taken',
                  'Loan Repaid',
                  'Loan Back',
                  'Net',
                  'Loan Impact',
                  'Acct Net',
                  'Office',
                  'Personal',
                ].map((h) => (
                  <th key={h} style={{ ...thS, fontSize: 9 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY_SUMMARY.map((m, i) => (
                <tr
                  key={i}
                  style={{ opacity: m.income || m.expense ? 1 : 0.4 }}
                >
                  <td style={{ ...td, fontWeight: 600 }}>{m.month}</td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#10b981' }}>
                    {ff(m.income)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#f87171' }}>
                    {ff(m.expense)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11 }}>
                    {ff(m.loanGiven)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11 }}>
                    {ff(m.loanTaken)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11 }}>
                    {ff(m.loanRepaid)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11 }}>
                    {ff(m.loanReceivedBack)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      fontSize: 11,
                      fontWeight: 700,
                      color: m.netMovement >= 0 ? '#10b981' : '#f87171',
                    }}
                  >
                    {ff(m.netMovement)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      fontSize: 11,
                      color: m.loanImpact >= 0 ? '#10b981' : '#f87171',
                    }}
                  >
                    {ff(m.loanImpact)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11 }}>
                    {ff(m.accountNet)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#a5b4fc' }}>
                    {ff(m.officeExpense)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#fbbf24' }}>
                    {ff(m.personalExpense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TW>
        </div>
      )}

      {tab === 'accounts' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {ACCOUNTS.map((a, i) => (
              <div
                key={i}
                style={{ ...cd, position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: CL[i % CL.length],
                  }}
                />
                <div
                  style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}
                >
                  {a.name}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    ...mn,
                    color: a.balance > 0 ? '#10b981' : '#ef4444',
                    marginBottom: 10,
                  }}
                >
                  ₨ {ff(a.balance)}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    fontSize: 10,
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b' }}>Opening</span>
                    <br />
                    <span style={{ color: '#94a3b8', ...mn }}>
                      {ff(a.opening)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Money In</span>
                    <br />
                    <span style={{ color: '#10b981', ...mn }}>
                      {fmt(a.moneyIn)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Money Out</span>
                    <br />
                    <span style={{ color: '#f87171', ...mn }}>
                      {fmt(a.moneyOut)}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Change</span>
                    <br />
                    <span
                      style={{
                        color:
                          a.balance - a.opening >= 0 ? '#10b981' : '#f87171',
                        ...mn,
                      }}
                    >
                      {a.balance - a.opening >= 0 ? '+' : ''}
                      {ff(a.balance - a.opening)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={cd}>
            <ST icon="📊">Account Balances Chart</ST>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ACCOUNTS.filter((a) => a.balance > 0)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,.05)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={fmt}
                />
                <Tooltip contentStyle={ts} formatter={(v) => '₨ ' + ff(v)} />
                <Bar dataKey="balance" radius={[6, 6, 0, 0]} name="Balance">
                  {ACCOUNTS.filter((a) => a.balance > 0).map((e, i) => (
                    <Cell key={i} fill={CL[i % CL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'savSummary' && (
        <div style={cd}>
          <ST icon="💎">Savings Summary</ST>
          <TW>
            <thead>
              <tr>
                {[
                  'Location',
                  'Deposits',
                  'Withdraws',
                  'Net Savings',
                  'Last Activity',
                  'Opening',
                  'Total Balance',
                ].map((h) => (
                  <th key={h} style={thS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAVINGS_SUMMARY.map((s, i) => (
                <tr key={i} style={{ opacity: s.totalBalance ? 1 : 0.45 }}>
                  <td style={{ ...td, fontWeight: 600 }}>{s.location}</td>
                  <td style={{ ...td, ...mn, color: '#10b981' }}>
                    {ff(s.deposits)}
                  </td>
                  <td style={{ ...td, ...mn, color: '#f87171' }}>
                    {ff(s.withdraws)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      fontWeight: 600,
                      color: s.netSavings >= 0 ? '#10b981' : '#f87171',
                    }}
                  >
                    {ff(s.netSavings)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#94a3b8' }}>
                    {s.lastActivity}
                  </td>
                  <td style={{ ...td, ...mn }}>{ff(s.openingBalance)}</td>
                  <td
                    style={{ ...td, ...mn, fontWeight: 700, color: '#a78bfa' }}
                  >
                    {ff(s.totalBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TW>
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: 'rgba(139,92,246,.08)',
              borderRadius: 12,
              border: '1px solid rgba(139,92,246,.15)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontWeight: 600, color: '#a78bfa' }}>
              Grand Total Savings
            </span>
            <span
              style={{ ...mn, fontWeight: 700, fontSize: 18, color: '#10b981' }}
            >
              ₨ {ff(SAVINGS_SUMMARY.reduce((s, x) => s + x.totalBalance, 0))}
            </span>
          </div>
        </div>
      )}

      {tab === 'loans' && (
        <div style={cd}>
          <ST icon="🤝">Loan Summary</ST>
          <TW>
            <thead>
              <tr>
                {[
                  'Person',
                  'Given',
                  'Received Back',
                  'Taken',
                  'Repaid',
                  'Net Position',
                  'Open Given',
                  'Open Taken',
                ].map((h) => (
                  <th key={h} style={thS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LOANS.map((l, i) => (
                <tr key={i}>
                  <td style={{ ...td, fontWeight: 700 }}>{l.person}</td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      color: l.given ? '#f59e0b' : '#475569',
                    }}
                  >
                    {ff(l.given)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      color: l.receivedBack ? '#10b981' : '#475569',
                    }}
                  >
                    {ff(l.receivedBack)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      color: l.taken ? '#ec4899' : '#475569',
                    }}
                  >
                    {ff(l.taken)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      color: l.repaid ? '#14b8a6' : '#475569',
                    }}
                  >
                    {ff(l.repaid)}
                  </td>
                  <td
                    style={{
                      ...td,
                      ...mn,
                      fontWeight: 700,
                      color:
                        l.net > 0
                          ? '#10b981'
                          : l.net < 0
                          ? '#f87171'
                          : '#64748b',
                    }}
                  >
                    {l.net >= 0 ? '+' : ''}
                    {ff(l.net)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#94a3b8' }}>
                    {ff(l.openGiven)}
                  </td>
                  <td style={{ ...td, ...mn, fontSize: 11, color: '#94a3b8' }}>
                    {ff(l.openTaken)}
                  </td>
                </tr>
              ))}
            </tbody>
          </TW>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 16,
            }}
          >
            <div
              style={{
                padding: 14,
                background: 'rgba(16,185,129,.08)',
                borderRadius: 12,
                border: '1px solid rgba(16,185,129,.15)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#10b981',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Others Owe Me
              </div>
              <div
                style={{
                  ...mn,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#10b981',
                }}
              >
                ₨{' '}
                {ff(
                  LOANS.filter((l) => l.net > 0).reduce((s, l) => s + l.net, 0)
                )}
              </div>
            </div>
            <div
              style={{
                padding: 14,
                background: 'rgba(239,68,68,.08)',
                borderRadius: 12,
                border: '1px solid rgba(239,68,68,.15)',
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: '#f87171',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                I Owe Others
              </div>
              <div
                style={{
                  ...mn,
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#f87171',
                }}
              >
                ₨{' '}
                {ff(
                  Math.abs(
                    LOANS.filter((l) => l.net < 0).reduce(
                      (s, l) => s + l.net,
                      0
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <>
          <div style={{ ...cd, marginBottom: 20 }}>
            <ST icon="📊">
              Monthly Report —{' '}
              {new Date().toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
            </ST>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {[
                ['Total Income', MR.totalIncome, '#10b981'],
                ['Total Expense', MR.totalExpense, '#ef4444'],
                ['Net Balance', MR.netBalance, '#6366f1'],
                ['Loan Given', MR.loanGiven, '#f59e0b'],
                ['Loan Taken', MR.loanTaken, '#ec4899'],
                ['Loan Repaid', MR.loanRepaid, '#14b8a6'],
                ['Loan Received Back', MR.loanReceivedBack, '#8b5cf6'],
                ['Transfer', MR.transfer, '#06b6d4'],
                ['Savings Deposit', MR.savingsDeposit, '#84cc16'],
                ['Savings Withdraw', MR.savingsWithdraw, '#64748b'],
                ['Adjusted Net', MR.adjustedNet, '#f97316'],
              ].map(([l, v, c], i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,.02)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,.04)',
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}
                  >
                    {l}
                  </span>
                  <span
                    style={{ ...mn, fontSize: 14, fontWeight: 700, color: c }}
                  >
                    {ff(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
            }}
          >
            <div style={cd}>
              <ST icon="💎">Savings</ST>
              {MR.savings.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{s.loc}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      Opening: {ff(s.opening)}
                    </div>
                  </div>
                  <span
                    style={{
                      ...mn,
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.activity ? '#10b981' : '#475569',
                    }}
                  >
                    {ff(s.activity)}
                  </span>
                </div>
              ))}
            </div>
            <div style={cd}>
              <ST icon="🏧">Account Balances</ST>
              {MR.accounts.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{a.name}</span>
                  <span
                    style={{
                      ...mn,
                      fontSize: 12,
                      fontWeight: 600,
                      color: a.bal > 0 ? '#10b981' : '#64748b',
                    }}
                  >
                    {ff(a.bal)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '2px solid rgba(255,255,255,.08)',
                  marginTop: 4,
                }}
              >
                <span style={{ fontWeight: 700 }}>TOTAL</span>
                <span style={{ ...mn, fontWeight: 800, color: '#10b981' }}>
                  {ff(MR.accounts.reduce((s, a) => s + a.bal, 0))}
                </span>
              </div>
            </div>
            <div style={cd}>
              <ST icon="📊">Expense by Category</ST>
              {EXPENSE_CATS.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{c.c}</span>
                  <span style={{ ...mn, fontSize: 12, fontWeight: 600 }}>
                    {ff(c.a)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...cd, marginTop: 20 }}>
            <ST icon="📈">Expense by Category Chart</ST>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={EXPENSE_CATS} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,.05)"
                />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={fmt}
                />
                <YAxis
                  type="category"
                  dataKey="c"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  width={110}
                />
                <Tooltip contentStyle={ts} formatter={(v) => '₨ ' + ff(v)} />
                <Bar dataKey="a" radius={[0, 6, 6, 0]} name="Amount">
                  {EXPENSE_CATS.map((e, i) => (
                    <Cell key={i} fill={CL[i % CL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {tab === 'settings' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
              gap: 16,
            }}
          >
            {[
              ['🏷️', 'Categories', settings.categories, '#6366f1'],
              ['🏧', 'Accounts', settings.accounts, '#10b981'],
              [
                '💎',
                'Savings Locations',
                settings.savings_locations,
                '#8b5cf6',
              ],
              ['🏢', 'Groups', settings.groups, '#f59e0b'],
              ['📝', 'Transaction Types', settings.types, null],
              ['👥', 'Loan People', settings.loan_people, '#ec4899'],
            ].map(([icon, title, items, color], idx) => (
              <div key={idx} style={cd}>
                <ST icon={icon}>{title}</ST>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {items.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: color ? `${color}1a` : tB(item),
                        color: color || tC(item),
                        border: `1px solid ${color || tC(item)}33`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              marginTop: 16,
            }}
          >
            <div style={cd}>
              <ST icon="💰">Account Opening Balances</ST>
              {settings.opening_balances.map((o, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{o.account}</span>
                  <span style={{ ...mn, fontSize: 12, fontWeight: 600 }}>
                    {ff(o.amount)}
                  </span>
                </div>
              ))}
            </div>
            <div style={cd}>
              <ST icon="🤝">Pre-April Loan Balances</ST>
              {settings.loan_opening.map((l, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{l.person}</span>
                  <div style={{ textAlign: 'right' }}>
                    {l.given > 0 && (
                      <div style={{ fontSize: 10, color: '#f59e0b' }}>
                        Given: {ff(l.given)}
                      </div>
                    )}
                    {l.taken > 0 && (
                      <div style={{ fontSize: 10, color: '#ec4899' }}>
                        Taken: {ff(l.taken)}
                      </div>
                    )}
                    {!l.given && !l.taken && (
                      <div style={{ fontSize: 10, color: '#475569' }}>—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={cd}>
              <ST icon="💎">Savings Opening Balances</ST>
              {settings.savings_opening.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,.03)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>{s.location}</span>
                  <span
                    style={{
                      ...mn,
                      fontSize: 12,
                      fontWeight: 600,
                      color: s.amount ? '#10b981' : '#475569',
                    }}
                  >
                    {ff(s.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: 28,
          padding: 16,
          background: 'rgba(255,255,255,.02)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,.04)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>
          Total Account Balance
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            ...mn,
            background: 'linear-gradient(135deg,#10b981,#06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ₨ {ff(ACCOUNTS.reduce((s, a) => s + a.balance, 0))}
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
          {ACCOUNTS.length} Accounts • Savings: ₨{' '}
          {ff(SAVINGS_SUMMARY.reduce((s, x) => s + x.totalBalance, 0))} •{' '}
          {filtered.length} Transactions
        </div>
      </div>
    </div>
  );
}
