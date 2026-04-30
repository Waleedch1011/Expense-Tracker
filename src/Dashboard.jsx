import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, Legend } from "recharts";
import { supabase } from "./supabaseClient";

const CL=["#10b981","#f59e0b","#ef4444","#6366f1","#ec4899","#14b8a6","#f97316","#8b5cf6","#06b6d4","#84cc16","#e11d48","#a855f7","#0ea5e9","#d946ef","#facc15","#fb923c","#22d3ee","#a3e635","#f43f5e","#818cf8"];
const fmt=n=>{if(!n&&n!==0)return"0";const a=Math.abs(n);if(a>=1e6)return(n/1e6).toFixed(1)+"M";if(a>=1e5)return(n/1e3).toFixed(0)+"K";if(a>=1e4)return(n/1e3).toFixed(1)+"K";return n.toLocaleString()};
const ff=n=>n?.toLocaleString?.() ?? "0";
const tC=t=>t==="Income"?"#10b981":t==="Expense"?"#ef4444":t.includes("Loan")?"#f59e0b":t.includes("Savings")?"#8b5cf6":"#6366f1";
const tB=t=>t==="Income"?"rgba(16,185,129,.12)":t==="Expense"?"rgba(239,68,68,.12)":t.includes("Loan")?"rgba(245,158,11,.12)":t.includes("Savings")?"rgba(139,92,246,.12)":"rgba(99,102,241,.12)";
const cd={background:"rgba(255,255,255,.03)",borderRadius:16,padding:20,border:"1px solid rgba(255,255,255,.06)"};
const ip={background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",color:"#e2e8f0",fontSize:13,outline:"none",width:"100%",fontFamily:"inherit"};
const thS={textAlign:"left",padding:"10px 8px",color:"#64748b",fontWeight:600,fontSize:10,textTransform:"uppercase",letterSpacing:.5,borderBottom:"2px solid rgba(255,255,255,.08)"};
const td={padding:"10px 8px",fontSize:12,borderBottom:"1px solid rgba(255,255,255,.03)"};
const mn={fontFamily:"'JetBrains Mono',monospace"};
const ts={background:"#1e293b",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,color:"#e2e8f0",fontSize:12};
const TABS=[{id:"dashboard",l:"Dashboard",i:"💰"},{id:"transactions",l:"Transactions",i:"📋"},{id:"savings",l:"Savings",i:"🏦"},{id:"monthly",l:"Monthly Summary",i:"📅"},{id:"accounts",l:"Account Summary",i:"🏧"},{id:"savSummary",l:"Savings Summary",i:"💎"},{id:"loans",l:"Loan Summary",i:"🤝"},{id:"report",l:"Monthly Report",i:"📊"},{id:"budget",l:"Budget",i:"🎯"},{id:"goals",l:"Goals",i:"🏆"},{id:"insights",l:"Insights",i:"💡"},{id:"recurring",l:"Recurring",i:"🔁"},{id:"settings",l:"Settings",i:"⚙️"}];

const DEFAULT_SETTINGS = {
  categories:["Rent","Office Expense","Utilities","Food","Travel","Subscriptions","Salary","Shopping","Bills","Fuel","For Me","Savings","Cash","My Accounts","Mama","Loan","Others","Splitwise","Fun","Snacks"],
  accounts:["Meezan","Alfalah","Allied","Cash","Easypaisa","JazzCash","Sadapay","Zindagi","Nayapay","Redotpay"],
  savings_locations:["Cash Backup","Easypaisa Savings","JazzCash Savings","Zindagi","Meezan Savings"],
  groups:["Office","Personal"],
  types:["Income","Expense","Transfer","Loan Given","Loan Taken","Loan Received Back","Loan Repaid","Savings Deposit","Savings Withdraw"],
  loan_people:["Sheikh","Hamza","Papa","Abdullah","Ali","Abdul Office","Fakhar","Shahbaz Bhai","Mughees Editor"],
  opening_balances:[{account:"Meezan",amount:1854},{account:"Alfalah",amount:191},{account:"Allied",amount:92},{account:"Cash",amount:300},{account:"Easypaisa",amount:1517},{account:"JazzCash",amount:33},{account:"Sadapay",amount:162},{account:"Zindagi",amount:189},{account:"Nayapay",amount:9},{account:"Redotpay",amount:266}],
  loan_opening:[{person:"Sheikh",given:0,taken:11550},{person:"Hamza",given:0,taken:50000},{person:"Papa",given:0,taken:5000},{person:"Abdullah",given:0,taken:0},{person:"Ali",given:0,taken:400000},{person:"Abdul Office",given:35000,taken:0},{person:"Fakhar",given:30000,taken:0},{person:"Shahbaz Bhai",given:23000,taken:0},{person:"Mughees Editor",given:10000,taken:0},{person:"Hamza 2",given:0,taken:1400000}],
  savings_opening:[{location:"Cash Backup",amount:10000},{location:"Easypaisa Savings",amount:0},{location:"JazzCash Savings",amount:0},{location:"Zindagi",amount:0},{location:"Meezan Savings",amount:0}],
};

function SettingsTab({ settings, setSettings, user, setError }) {
  const [inputs, setInputs] = useState({categories:'',accounts:'',savings_locations:'',groups:'',types:'',loan_people:''});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const saveSettings = async (newSettings) => {
    setSaving(true); setMsg('');
    try {
      const { error } = await supabase.from('user_settings').upsert({
        user_id: user.id,
        categories: newSettings.categories,
        accounts: newSettings.accounts,
        savings_locations: newSettings.savings_locations,
        groups: newSettings.groups,
        types: newSettings.types,
        loan_people: newSettings.loan_people,
        opening_balances: newSettings.opening_balances,
        loan_opening: newSettings.loan_opening,
        savings_opening: newSettings.savings_opening,
      });
      if (error) throw error;
      setSettings(newSettings);
      setMsg('✅ Saved!');
      setTimeout(() => setMsg(''), 2000);
    } catch(err) { setError('Save failed: ' + err.message); }
    finally { setSaving(false); }
  };

  const addItem = (key) => {
    const val = inputs[key].trim();
    if (!val || settings[key].includes(val)) return;
    const updated = {...settings, [key]: [...settings[key], val]};
    setInputs({...inputs, [key]: ''});
    saveSettings(updated);
  };

  const removeItem = (key, item) => {
    if (!confirm(`Delete "${item}"?`)) return;
    saveSettings({...settings, [key]: settings[key].filter(x => x !== item)});
  };

  const cd2 = {...{background:"rgba(255,255,255,.03)",borderRadius:16,padding:20,border:"1px solid rgba(255,255,255,.06)"}};
  const ip2 = {background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"8px 12px",color:"#e2e8f0",fontSize:12,outline:"none",fontFamily:"inherit",flex:1};
  const sections = [
    {key:'categories',icon:'🏷️',label:'Categories',color:'#6366f1'},
    {key:'accounts',icon:'🏧',label:'Accounts',color:'#10b981'},
    {key:'savings_locations',icon:'💎',label:'Savings Locations',color:'#8b5cf6'},
    {key:'groups',icon:'🏢',label:'Groups',color:'#f59e0b'},
    {key:'types',icon:'📝',label:'Transaction Types',color:null},
    {key:'loan_people',icon:'👥',label:'Loan People',color:'#ec4899'},
  ];

  return (
    <div>
      {msg && <div style={{marginBottom:16,padding:12,borderRadius:10,background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#10b981",fontSize:12,textAlign:"center"}}>{msg}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {sections.map(({key,icon,label,color})=>(
          <div key={key} style={cd2}>
            <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#a78bfa"}}>{icon} {label}</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14,minHeight:32}}>
              {settings[key].map((item,i)=>(
                <span key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,fontSize:11,fontWeight:600,background:color?`${color}1a`:"rgba(99,102,241,.12)",color:color||"#6366f1",border:`1px solid ${color||"#6366f1"}33`}}>
                  {item}
                  <button onClick={()=>removeItem(key,item)} style={{background:"none",border:"none",color:"#f87171",cursor:"pointer",fontSize:12,padding:"0 0 0 2px",lineHeight:1}}>×</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input
                value={inputs[key]}
                onChange={e=>setInputs({...inputs,[key]:e.target.value})}
                onKeyDown={e=>e.key==='Enter'&&addItem(key)}
                placeholder={`Naya ${label.slice(0,-1)} add karein...`}
                style={ip2}
              />
              <button
                onClick={()=>addItem(key)}
                disabled={saving||!inputs[key].trim()}
                style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:700,opacity:saving||!inputs[key].trim()?0.5:1}}
              >
                {saving?'...':'+ Add'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginTop:16}}>
        <div style={cd2}>
          <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#a78bfa"}}>💰 Account Opening Balances</h3>
          {settings.opening_balances.map((o,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
              <span style={{fontSize:12}}>{o.account}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="number" defaultValue={o.amount} onBlur={e=>{
                  const updated={...settings,opening_balances:settings.opening_balances.map((x,j)=>j===i?{...x,amount:parseFloat(e.target.value)||0}:x)};
                  saveSettings(updated);
                }} style={{...ip2,width:80,textAlign:"right",padding:"4px 8px"}}/>
              </div>
            </div>
          ))}
        </div>

        <div style={cd2}>
          <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#a78bfa"}}>🤝 Pre-April Loan Balances</h3>
          {settings.loan_opening.map((l,i)=>(
            <div key={i} style={{padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:4}}>{l.person}</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"#f59e0b",marginBottom:2}}>Given</div>
                  <input type="number" defaultValue={l.given} onBlur={e=>{
                    const updated={...settings,loan_opening:settings.loan_opening.map((x,j)=>j===i?{...x,given:parseFloat(e.target.value)||0}:x)};
                    saveSettings(updated);
                  }} style={{...ip2,padding:"4px 8px"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,color:"#ec4899",marginBottom:2}}>Taken</div>
                  <input type="number" defaultValue={l.taken} onBlur={e=>{
                    const updated={...settings,loan_opening:settings.loan_opening.map((x,j)=>j===i?{...x,taken:parseFloat(e.target.value)||0}:x)};
                    saveSettings(updated);
                  }} style={{...ip2,padding:"4px 8px"}}/>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={cd2}>
          <h3 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#a78bfa"}}>💎 Savings Opening Balances</h3>
          {settings.savings_opening.map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
              <span style={{fontSize:12}}>{s.location}</span>
              <input type="number" defaultValue={s.amount} onBlur={e=>{
                const updated={...settings,savings_opening:settings.savings_opening.map((x,j)=>j===i?{...x,amount:parseFloat(e.target.value)||0}:x)};
                saveSettings(updated);
              }} style={{...ip2,width:80,textAlign:"right",padding:"4px 8px"}}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0,10);
  const thisMonth = new Date().getMonth()+1;
  const thisYear = new Date().getFullYear();
  // Transaction tab filters
  const [txFilter, setTxFilter] = useState({type:'', category:'', group:'', account:'', search:''});
  const [txSort, setTxSort] = useState({col:'created_at', dir:'desc'});
  const [fromDate, setFromDate] = useState("2026-04-01");
  const [toDate, setToDate] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const emptyRow = () => ({id:Date.now()+Math.random(), d:today,t:"Expense",c:"Food",g:"Personal",desc:"",a:"",fa:"Alfalah",ta:"",p:"",n:""});
  const [rows, setRows] = useState([emptyRow()]);
  const [newTx, setNewTx] = useState({d:today,t:"Expense",c:"Food",g:"Personal",desc:"",a:"",fa:"Alfalah",ta:"",p:"",n:""});
  // New feature states
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [monthlyNotes, setMonthlyNotes] = useState({});
  const [recurring, setRecurring] = useState([]);
  const [quickTx, setQuickTx] = useState({d:today,t:"Expense",c:"Food",a:""});
  const [newGoal, setNewGoal] = useState({title:'',target_amount:'',deadline:'',color:'#6366f1'});
  const [newRecurring, setNewRecurring] = useState({d:1,t:"Expense",c:"Food",g:"Personal",description:'',a:'',fa:'Alfalah',ta:'',p:'',n:''});
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState(thisMonth);
  const [selectedBudgetYear, setSelectedBudgetYear] = useState(thisYear);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [txR, stR, budR, goalR, noteR, recR] = await Promise.all([
        supabase.from('transactions').select('*').order('d', {ascending:false}).order('created_at', {ascending:false}),
        supabase.from('user_settings').select('*').maybeSingle(),
        supabase.from('budgets').select('*'),
        supabase.from('goals').select('*').order('created_at',{ascending:false}),
        supabase.from('monthly_notes').select('*'),
        supabase.from('recurring').select('*').order('created_at',{ascending:false}),
      ]);
      if (txR.error) throw txR.error;
      setData(txR.data || []);
      if (!budR.error) setBudgets(budR.data||[]);
      if (!goalR.error) setGoals(goalR.data||[]);
      if (!noteR.error) {
        const notesMap = {};
        (noteR.data||[]).forEach(n=>{notesMap[`${n.year}-${n.month}`]=n.note;});
        setMonthlyNotes(notesMap);
      }
      if (!recR.error) setRecurring(recR.data||[]);
      if (stR.data) {
        setSettings({
          categories: stR.data.categories || DEFAULT_SETTINGS.categories,
          accounts: stR.data.accounts || DEFAULT_SETTINGS.accounts,
          savings_locations: stR.data.savings_locations || DEFAULT_SETTINGS.savings_locations,
          groups: stR.data.groups || DEFAULT_SETTINGS.groups,
          types: stR.data.types || DEFAULT_SETTINGS.types,
          loan_people: stR.data.loan_people || DEFAULT_SETTINGS.loan_people,
          opening_balances: stR.data.opening_balances || DEFAULT_SETTINGS.opening_balances,
          loan_opening: stR.data.loan_opening || DEFAULT_SETTINGS.loan_opening,
          savings_opening: stR.data.savings_opening || DEFAULT_SETTINGS.savings_opening,
        });
      }
    } catch(err) { setError("Failed to load: " + err.message); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    const valid = rows.filter(r => r.a && r.d);
    if (!valid.length) return;
    setSaving(true); setError("");
    try {
      const {data: ins, error} = await supabase.from('transactions').insert(
        valid.map(r => ({
          user_id:user.id, d:r.d, t:r.t, c:r.c, g:r.g,
          description:r.desc, a:parseFloat(r.a),
          fa:r.fa||'', ta:r.ta||'', p:r.p||'', n:r.n||'',
        }))
      ).select();
      if (error) throw error;
      setData(prev => [...(ins||[]).map(i=>({...i,desc:i.description||''})), ...prev]);
      setRows([emptyRow()]);
      setShowAdd(false);
    } catch(err) { setError("Save failed: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      const {error} = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(t => t.id !== id));
    } catch(err) { setError("Delete failed: " + err.message); }
  };

  const [editTx, setEditTx] = useState(null);
  const handleEditOpen = (tx) => {
    setEditTx({...tx, desc: tx.description||tx.desc||'', a: String(tx.a)});
    window.scrollTo({top:0, behavior:'smooth'});
  };
  const handleEditSave = async () => {
    if (!editTx.a || !editTx.d) return;
    setSaving(true); setError("");
    try {
      const {error} = await supabase.from('transactions').update({
        d:editTx.d, t:editTx.t, c:editTx.c, g:editTx.g,
        description:editTx.desc, a:parseFloat(editTx.a),
        fa:editTx.fa||'', ta:editTx.ta||'', p:editTx.p||'', n:editTx.n||'',
      }).eq('id', editTx.id);
      if (error) throw error;
      setData(prev => prev.map(tx => tx.id===editTx.id ? {...tx, ...editTx, description:editTx.desc, a:parseFloat(editTx.a)} : tx));
      setEditTx(null);
    } catch(err) { setError("Update failed: " + err.message); }
    finally { setSaving(false); }
  };

  // Quick Add (mobile)
  const handleQuickAdd = async () => {
    if (!quickTx.a) return;
    setSaving(true);
    try {
      const {data:ins,error} = await supabase.from('transactions').insert({
        user_id:user.id, d:quickTx.d||today, t:quickTx.t, c:quickTx.c, g:'Personal',
        description:'', a:parseFloat(quickTx.a), fa:'', ta:'', p:'', n:'',
      }).select().single();
      if (error) throw error;
      setData(prev=>[{...ins,desc:''},...prev]);
      setQuickTx({d:today,t:"Expense",c:"Food",a:""});
      setShowQuickAdd(false);
    } catch(err){setError("Failed: "+err.message);}
    finally{setSaving(false);}
  };

  // Budget
  const saveBudget = async (category, amount) => {
    try {
      const {error} = await supabase.from('budgets').upsert({
        user_id:user.id, category, amount:parseFloat(amount)||0,
        month:selectedBudgetMonth, year:selectedBudgetYear,
      });
      if (error) throw error;
      setBudgets(prev=>{
        const existing = prev.findIndex(b=>b.category===category&&b.month===selectedBudgetMonth&&b.year===selectedBudgetYear);
        if(existing>=0){const n=[...prev];n[existing]={...n[existing],amount:parseFloat(amount)||0};return n;}
        return [...prev,{user_id:user.id,category,amount:parseFloat(amount)||0,month:selectedBudgetMonth,year:selectedBudgetYear}];
      });
    } catch(err){setError("Budget save failed: "+err.message);}
  };

  // Goals
  const saveGoal = async () => {
    if (!newGoal.title||!newGoal.target_amount) return;
    try {
      const {data:g,error} = await supabase.from('goals').insert({
        user_id:user.id, title:newGoal.title,
        target_amount:parseFloat(newGoal.target_amount),
        deadline:newGoal.deadline||null, color:newGoal.color,
      }).select().single();
      if(error) throw error;
      setGoals(prev=>[g,...prev]);
      setNewGoal({title:'',target_amount:'',deadline:'',color:'#6366f1'});
    } catch(err){setError("Goal save failed: "+err.message);}
  };
  const deleteGoal = async (id) => {
    if(!confirm("Delete this goal?")) return;
    await supabase.from('goals').delete().eq('id',id);
    setGoals(prev=>prev.filter(g=>g.id!==id));
  };
  const updateGoalAmount = async (id, current_amount) => {
    await supabase.from('goals').update({current_amount}).eq('id',id);
    setGoals(prev=>prev.map(g=>g.id===id?{...g,current_amount}:g));
  };

  // Monthly Notes
  const saveNote = async (month, year, note) => {
    await supabase.from('monthly_notes').upsert({user_id:user.id,month,year,note});
    setMonthlyNotes(prev=>({...prev,[`${year}-${month}`]:note}));
  };

  // Recurring
  const saveRecurring = async () => {
    if (!newRecurring.a) return;
    try {
      const {data:r,error} = await supabase.from('recurring').insert({
        user_id:user.id, ...newRecurring, a:parseFloat(newRecurring.a),
      }).select().single();
      if(error) throw error;
      setRecurring(prev=>[r,...prev]);
      setNewRecurring({d:1,t:"Expense",c:"Food",g:"Personal",description:'',a:'',fa:'Alfalah',ta:'',p:'',n:''});
    } catch(err){setError("Recurring save failed: "+err.message);}
  };
  const toggleRecurring = async (id, active) => {
    await supabase.from('recurring').update({active}).eq('id',id);
    setRecurring(prev=>prev.map(r=>r.id===id?{...r,active}:r));
  };
  const deleteRecurring = async (id) => {
    if(!confirm("Delete?")) return;
    await supabase.from('recurring').delete().eq('id',id);
    setRecurring(prev=>prev.filter(r=>r.id!==id));
  };
  const addRecurringNow = async (rec) => {
    setSaving(true);
    try {
      const {data:ins,error} = await supabase.from('transactions').insert({
        user_id:user.id, d:today, t:rec.t, c:rec.c, g:rec.g,
        description:rec.description, a:rec.a, fa:rec.fa||'', ta:rec.ta||'', p:rec.p||'', n:rec.n||'',
      }).select().single();
      if(error) throw error;
      setData(prev=>[{...ins,desc:ins.description||''},...prev]);
      alert("Transaction added!");
    } catch(err){setError("Failed: "+err.message);}
    finally{setSaving(false);}
  };

  const norm = useMemo(() => data.map(tx => ({...tx, desc:tx.description||tx.desc||'', a:parseFloat(tx.a)||0})), [data]);
  const filtered = useMemo(() => norm.filter(tx => { if(fromDate&&tx.d<fromDate)return false; if(toDate&&tx.d>toDate)return false; return true; }), [norm,fromDate,toDate]);

  const stats = useMemo(() => {
    let r={income:0,expense:0,loanGiven:0,loanTaken:0,loanRepaid:0,loanBack:0,savings:0,transfer:0,offExp:0,perExp:0};
    filtered.forEach(tx=>{
      if(tx.t==="Income")r.income+=tx.a;
      else if(tx.t==="Expense"){r.expense+=tx.a;if(tx.g==="Office")r.offExp+=tx.a;else r.perExp+=tx.a}
      else if(tx.t==="Loan Given")r.loanGiven+=tx.a;
      else if(tx.t==="Loan Taken")r.loanTaken+=tx.a;
      else if(tx.t==="Loan Repaid")r.loanRepaid+=tx.a;
      else if(tx.t==="Loan Received Back")r.loanBack+=tx.a;
      else if(tx.t==="Savings Deposit")r.savings+=tx.a;
      else if(tx.t==="Transfer")r.transfer+=tx.a;
    });
    r.net=r.income-r.expense; r.loanImpact=r.loanTaken-r.loanRepaid-r.loanGiven+r.loanBack;
    return r;
  }, [filtered]);

  const catData=useMemo(()=>{const m={};filtered.filter(tx=>tx.t==="Expense").forEach(tx=>{m[tx.c]=(m[tx.c]||0)+tx.a});return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([name,value],i)=>({name,value,color:CL[i%CL.length]}));},[filtered]);
  const dailyData=useMemo(()=>{const m={};filtered.forEach(tx=>{if(!m[tx.d])m[tx.d]={date:tx.d,income:0,expense:0};if(tx.t==="Income")m[tx.d].income+=tx.a;else if(tx.t==="Expense")m[tx.d].expense+=tx.a});return Object.values(m).sort((a,b)=>a.date.localeCompare(b.date));},[filtered]);
  const groupData=useMemo(()=>{let o=0,p=0;filtered.filter(tx=>tx.t==="Expense").forEach(tx=>{if(tx.g==="Office")o+=tx.a;else p+=tx.a});return[{name:"Office",value:o,color:"#6366f1"},{name:"Personal",value:p,color:"#f59e0b"}];},[filtered]);

  const ACCOUNTS=useMemo(()=>{
    const bal={};
    settings.accounts.forEach(acc=>{const op=settings.opening_balances.find(o=>o.account===acc)?.amount||0;bal[acc]={name:acc,opening:op,moneyIn:0,moneyOut:0,balance:op};});
    norm.forEach(tx=>{if(tx.ta&&bal[tx.ta]){bal[tx.ta].moneyIn+=tx.a;bal[tx.ta].balance+=tx.a;}if(tx.fa&&bal[tx.fa]){bal[tx.fa].moneyOut+=tx.a;bal[tx.fa].balance-=tx.a;}});
    return Object.values(bal);
  },[norm,settings]);

  const LOANS=useMemo(()=>{
    const loans={};
    settings.loan_people.forEach(p=>{const op=settings.loan_opening.find(l=>l.person===p)||{given:0,taken:0};loans[p]={person:p,given:0,receivedBack:0,taken:0,repaid:0,openGiven:op.given||0,openTaken:op.taken||0};});
    norm.forEach(tx=>{if(!tx.p||!loans[tx.p])return;if(tx.t==="Loan Given")loans[tx.p].given+=tx.a;else if(tx.t==="Loan Received Back")loans[tx.p].receivedBack+=tx.a;else if(tx.t==="Loan Taken")loans[tx.p].taken+=tx.a;else if(tx.t==="Loan Repaid")loans[tx.p].repaid+=tx.a;});
    return Object.values(loans).map(l=>({...l,net:(l.openGiven+l.given-l.receivedBack)-(l.openTaken+l.taken-l.repaid)}));
  },[norm,settings]);

  const SAVINGS_DATA=useMemo(()=>norm.filter(tx=>tx.t==="Savings Deposit"||tx.t==="Savings Withdraw").map(tx=>({d:tx.d,mo:new Date(tx.d).toLocaleString('default',{month:'long'}),t:tx.t,loc:tx.c==="Savings"?"Cash Backup":tx.c,a:tx.a})),[norm]);

  const SAVINGS_SUMMARY=useMemo(()=>settings.savings_locations.map(loc=>{
    const op=settings.savings_opening.find(s=>s.location===loc)?.amount||0;
    const deps=SAVINGS_DATA.filter(s=>s.loc===loc&&s.t==="Savings Deposit").reduce((s,x)=>s+x.a,0);
    const withs=SAVINGS_DATA.filter(s=>s.loc===loc&&s.t==="Savings Withdraw").reduce((s,x)=>s+x.a,0);
    const lastTx=SAVINGS_DATA.filter(s=>s.loc===loc).sort((a,b)=>b.d.localeCompare(a.d))[0];
    return {location:loc,deposits:deps,withdraws:withs,netSavings:deps-withs,lastActivity:lastTx?.d||"—",openingBalance:op,totalBalance:op+deps-withs};
  }),[SAVINGS_DATA,settings]);

  const MONTHLY_SUMMARY=useMemo(()=>{
    const months=["January","February","March","April","May","June","July","August","September","October","November","December"];
    const totalOpening = settings.opening_balances.reduce((s,o)=>s+o.amount,0);
    const rows = months.map((month,mi)=>{
      const txs=norm.filter(tx=>new Date(tx.d).getMonth()===mi);
      let r={month,income:0,expense:0,loanGiven:0,loanTaken:0,loanRepaid:0,loanReceivedBack:0,officeExpense:0,personalExpense:0,transfer:0,savingsDeposit:0};
      txs.forEach(tx=>{
        if(tx.t==="Income")r.income+=tx.a;
        else if(tx.t==="Expense"){r.expense+=tx.a;if(tx.g==="Office")r.officeExpense+=tx.a;else r.personalExpense+=tx.a;}
        else if(tx.t==="Loan Given")r.loanGiven+=tx.a;
        else if(tx.t==="Loan Taken")r.loanTaken+=tx.a;
        else if(tx.t==="Loan Repaid")r.loanRepaid+=tx.a;
        else if(tx.t==="Loan Received Back")r.loanReceivedBack+=tx.a;
        else if(tx.t==="Transfer")r.transfer+=tx.a;
        else if(tx.t==="Savings Deposit")r.savingsDeposit+=tx.a;
      });
      r.netMovement=r.income-r.expense;
      r.loanImpact=r.loanTaken-r.loanRepaid-r.loanGiven+r.loanReceivedBack;
      r.opening=0; r.closing=0;
      return r;
    });
    // Closing = actual account balances up to end of that month
    // Running balance from opening
    const accounts = settings.accounts;
    months.forEach((month, mi) => {
      // Calculate actual total account balance at end of this month
      const bal = {};
      accounts.forEach(acc => {
        const op = settings.opening_balances.find(o=>o.account===acc)?.amount||0;
        bal[acc] = op;
      });
      // Apply all transactions up to end of this month
      norm.filter(tx => new Date(tx.d).getMonth() <= mi).forEach(tx => {
        if(tx.ta && bal[tx.ta]!==undefined){ bal[tx.ta] += tx.a; }
        if(tx.fa && bal[tx.fa]!==undefined){ bal[tx.fa] -= tx.a; }
      });
      rows[mi].closing = Object.values(bal).reduce((s,v)=>s+v, 0);
    });
    // Opening of each month = closing of previous month
    rows.forEach((r, i) => {
      r.opening = i === 0 ? totalOpening : rows[i-1].closing;
    });
    return rows;
  },[norm, settings]);

  const generatePDF = () => {
    const dateLabel = fromDate || toDate ? `${fromDate||'Start'} to ${toDate||'Today'}` : 'All Time';
    const totalAccountBal = ACCOUNTS.reduce((s,a)=>s+a.balance,0);
    const totalSavings = SAVINGS_SUMMARY.reduce((s,x)=>s+x.totalBalance,0);
    const netWorth = totalAccountBal + totalSavings;
    const catExp = {};
    filtered.filter(tx=>tx.t==="Expense").forEach(tx=>{catExp[tx.c]=(catExp[tx.c]||0)+tx.a;});
    const catList = Object.entries(catExp).sort((a,b)=>b[1]-a[1]);
    const totalExp = catList.reduce((s,[,v])=>s+v,0);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Expense Report — ${dateLabel}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;padding:28px;font-size:13px;}
  h1{font-size:24px;font-weight:800;color:#6366f1;margin-bottom:4px;}
  .subtitle{color:#64748b;font-size:12px;margin-bottom:20px;}
  .section{margin-bottom:24px;}
  .section-title{font-size:14px;font-weight:700;color:#6366f1;border-bottom:2px solid #e0e7ff;padding-bottom:5px;margin-bottom:12px;}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:8px;}
  .kpi{background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:12px;}
  .kpi-label{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-bottom:5px;}
  .kpi-value{font-size:18px;font-weight:800;color:#1e293b;font-family:monospace;}
  .green{color:#10b981;} .red{color:#ef4444;} .purple{color:#6366f1;} .blue{color:#06b6d4;}
  table{width:100%;border-collapse:collapse;font-size:11px;}
  th{background:#f1f5f9;padding:7px 8px;text-align:left;font-weight:700;font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;border-bottom:2px solid #e2e8f0;}
  td{padding:7px 8px;border-bottom:1px solid #f1f5f9;}
  .bar-wrap{background:#f1f5f9;border-radius:4px;height:7px;width:100%;margin-top:3px;}
  .bar{height:7px;border-radius:4px;background:linear-gradient(90deg,#6366f1,#a78bfa);}
  .amount{font-family:monospace;font-weight:600;}
  .badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:9px;font-weight:600;}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .box{background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:12px;}
  .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f1f5f9;}
  .footer{text-align:center;color:#94a3b8;font-size:10px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:12px;}
  @media print{body{padding:16px;}}
</style>
</head>
<body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
  <div>
    <h1>💰 Expense Report</h1>
    <div class="subtitle">Waleed's Finance Tracker &nbsp;•&nbsp; Period: <strong>${dateLabel}</strong> &nbsp;•&nbsp; ${filtered.length} transactions</div>
  </div>
  <div style="text-align:right;color:#94a3b8;font-size:10px;">Generated: ${new Date().toLocaleString('en-PK')}</div>
</div>
<div class="section">
  <div class="section-title">📊 Financial Summary</div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">💰 Total Income</div><div class="kpi-value green">₨ ${ff(stats.income)}</div></div>
    <div class="kpi"><div class="kpi-label">💸 Total Expense</div><div class="kpi-value red">₨ ${ff(stats.expense)}</div></div>
    <div class="kpi"><div class="kpi-label">📈 Net Balance</div><div class="kpi-value ${stats.net>=0?'green':'red'}">₨ ${ff(stats.net)}</div></div>
    <div class="kpi"><div class="kpi-label">💎 Total Savings</div><div class="kpi-value purple">₨ ${ff(stats.savings)}</div></div>
  </div>
  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-label">🏧 Account Balance</div><div class="kpi-value blue">₨ ${ff(totalAccountBal)}</div></div>
    <div class="kpi"><div class="kpi-label">📤 Others Owe Me</div><div class="kpi-value green">₨ ${ff(LOANS.filter(l=>l.net>0).reduce((s,l)=>s+l.net,0))}</div></div>
    <div class="kpi"><div class="kpi-label">📥 I Owe Others</div><div class="kpi-value red">₨ ${ff(Math.abs(LOANS.filter(l=>l.net<0).reduce((s,l)=>s+l.net,0)))}</div></div>
    <div class="kpi"><div class="kpi-label">🌟 Net Worth</div><div class="kpi-value ${netWorth>=0?'green':'red'}">₨ ${ff(netWorth)}</div></div>
  </div>
</div>
<div class="section">
  <div class="section-title">🏷️ Expense by Category</div>
  <table><thead><tr><th>#</th><th>Category</th><th>Amount</th><th>% of Total</th><th style="width:180px;">Bar</th></tr></thead>
  <tbody>
    ${catList.map(([cat,amt],i)=>`<tr><td style="color:#94a3b8;">${i+1}</td><td style="font-weight:600;">${cat}</td><td class="amount red">₨ ${ff(amt)}</td><td style="color:#64748b;">${totalExp?((amt/totalExp)*100).toFixed(1):0}%</td><td><div class="bar-wrap"><div class="bar" style="width:${totalExp?Math.round((amt/totalExp)*100):0}%"></div></div></td></tr>`).join('')}
    <tr style="background:#f1f5f9;font-weight:700;"><td colspan="2">TOTAL</td><td class="amount red">₨ ${ff(totalExp)}</td><td>100%</td><td></td></tr>
  </tbody></table>
</div>
<div class="section">
  <div class="two-col">
    <div class="box">
      <div class="section-title">🏢 Office vs Personal</div>
      <div class="row"><span>Office Expense</span><span class="amount red">₨ ${ff(stats.offExp||0)}</span></div>
      <div class="row"><span>Personal Expense</span><span class="amount red">₨ ${ff(stats.perExp||0)}</span></div>
      <div class="row" style="font-weight:700;border:none;"><span>Total</span><span class="amount">₨ ${ff(stats.expense)}</span></div>
    </div>
    <div class="box">
      <div class="section-title">🏧 Account Balances</div>
      ${ACCOUNTS.map(a=>`<div class="row"><span>${a.name}</span><span class="amount ${a.balance>=0?'green':'red'}">₨ ${ff(a.balance)}</span></div>`).join('')}
      <div class="row" style="font-weight:700;border:none;"><span>TOTAL</span><span class="amount green">₨ ${ff(totalAccountBal)}</span></div>
    </div>
  </div>
</div>
<div class="section">
  <div class="section-title">🤝 Loan Summary</div>
  <table><thead><tr><th>Person</th><th>Given</th><th>Received Back</th><th>Taken</th><th>Repaid</th><th>Net</th></tr></thead>
  <tbody>${LOANS.map(l=>`<tr><td style="font-weight:700;">${l.person}</td><td class="amount">${ff(l.given)}</td><td class="amount green">${ff(l.receivedBack)}</td><td class="amount">${ff(l.taken)}</td><td class="amount green">${ff(l.repaid)}</td><td class="amount ${l.net>0?'green':l.net<0?'red':''}"><strong>${l.net>=0?'+':''}${ff(l.net)}</strong></td></tr>`).join('')}</tbody>
  </table>
</div>
<div class="section">
  <div class="section-title">💎 Savings Summary</div>
  <table><thead><tr><th>Location</th><th>Opening</th><th>Deposits</th><th>Withdraws</th><th>Total Balance</th></tr></thead>
  <tbody>
    ${SAVINGS_SUMMARY.map(s=>`<tr><td style="font-weight:600;">${s.location}</td><td class="amount">${ff(s.openingBalance)}</td><td class="amount green">${ff(s.deposits)}</td><td class="amount red">${ff(s.withdraws)}</td><td class="amount purple" style="font-weight:700;">₨ ${ff(s.totalBalance)}</td></tr>`).join('')}
    <tr style="background:#f1f5f9;font-weight:700;"><td colspan="4">GRAND TOTAL</td><td class="amount purple">₨ ${ff(totalSavings)}</td></tr>
  </tbody></table>
</div>
<div class="section">
  <div class="section-title">📋 Transactions (${filtered.length})</div>
  <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Group</th><th>Description</th><th>Amount</th><th>From</th><th>To</th><th>Party</th></tr></thead>
  <tbody>${[...filtered].sort((a,b)=>b.d.localeCompare(a.d)).map(tx=>`<tr>
    <td style="font-family:monospace;color:#64748b;">${tx.d}</td>
    <td><span class="badge" style="background:${tB(tx.t)};color:${tC(tx.t)};">${tx.t}</span></td>
    <td style="font-weight:500;">${tx.c}</td>
    <td style="color:#64748b;">${tx.g}</td>
    <td style="color:#94a3b8;">${tx.desc||'—'}</td>
    <td class="amount" style="color:${tC(tx.t)};font-weight:700;">₨ ${ff(tx.a)}</td>
    <td style="color:#64748b;">${tx.fa||'—'}</td>
    <td style="color:#64748b;">${tx.ta||'—'}</td>
    <td style="color:#6366f1;">${tx.p||'—'}</td>
  </tr>`).join('')}</tbody></table>
</div>
<div class="footer">Waleed's Expense Tracker &nbsp;•&nbsp; ${new Date().toLocaleString('en-PK')} &nbsp;•&nbsp; ${filtered.length} transactions &nbsp;•&nbsp; ${dateLabel}</div>
</body></html>`;

    // Open in new tab using blob URL — works without popup blocker
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };


  const EXPENSE_CATS=useMemo(()=>{const m={};norm.filter(tx=>tx.t==="Expense").forEach(tx=>{m[tx.c]=(m[tx.c]||0)+tx.a;});return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([c,a])=>({c,a}));},[norm]);

  const MR=useMemo(()=>{
    const cm=new Date().getMonth();
    const txs=norm.filter(tx=>new Date(tx.d).getMonth()===cm);
    let r={totalIncome:0,totalExpense:0,loanGiven:0,loanTaken:0,loanRepaid:0,loanReceivedBack:0,transfer:0,savingsDeposit:0,savingsWithdraw:0};
    txs.forEach(tx=>{if(tx.t==="Income")r.totalIncome+=tx.a;else if(tx.t==="Expense")r.totalExpense+=tx.a;else if(tx.t==="Loan Given")r.loanGiven+=tx.a;else if(tx.t==="Loan Taken")r.loanTaken+=tx.a;else if(tx.t==="Loan Repaid")r.loanRepaid+=tx.a;else if(tx.t==="Loan Received Back")r.loanReceivedBack+=tx.a;else if(tx.t==="Transfer")r.transfer+=tx.a;else if(tx.t==="Savings Deposit")r.savingsDeposit+=tx.a;else if(tx.t==="Savings Withdraw")r.savingsWithdraw+=tx.a;});
    r.netBalance=r.totalIncome-r.totalExpense; r.adjustedNet=r.netBalance+r.loanTaken-r.loanRepaid-r.loanGiven+r.loanReceivedBack;
    r.savings=SAVINGS_SUMMARY.map(s=>({loc:s.location,opening:s.openingBalance,activity:s.deposits-s.withdraws}));
    r.accounts=ACCOUNTS.map(a=>({name:a.name,bal:a.balance}));
    return r;
  },[norm,SAVINGS_SUMMARY,ACCOUNTS]);

  const mV=(v)=>hidden?"••••••":v;
  const isMobile = window.innerWidth < 600;
  const KPI=({label,value,sub,color,icon})=>(<div style={{...cd,position:"relative",overflow:"hidden",minHeight:isMobile?80:95}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color,borderRadius:"16px 16px 0 0"}}/><div style={{fontSize:isMobile?9:11,color:"#94a3b8",fontWeight:600,letterSpacing:1,textTransform:"uppercase",marginBottom:isMobile?4:8}}>{icon} {label}</div><div style={{fontSize:hidden?(isMobile?18:24):(isMobile?16:28),fontWeight:800,color:"#f1f5f9",...mn,lineHeight:1.2,whiteSpace:"nowrap"}}>{mV(value)}</div>{sub&&!hidden&&<div style={{fontSize:9,color:"#64748b",marginTop:3}}>{sub}</div>}</div>);
  const ST=({children,icon})=><h3 style={{margin:"0 0 16px",fontSize:15,fontWeight:700,color:"#a78bfa"}}>{icon} {children}</h3>;
  const TW=({children})=><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>{children}</table></div>;
  const Bd=({text,color,bg})=><span style={{padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,background:bg,color}}>{text}</span>;

  if(loading)return(<div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c0f1a 0%,#111827 50%,#0f172a 100%)",color:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',-apple-system,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:32,marginBottom:10}}>💰</div><div style={{color:"#94a3b8"}}>Loading your finances...</div></div></div>);

  return(<div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0c0f1a 0%,#111827 50%,#0f172a 100%)",color:"#e2e8f0",fontFamily:"'Inter',-apple-system,sans-serif",padding:"20px 16px"}}>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:800,margin:0,background:"linear-gradient(135deg,#6366f1,#a78bfa,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Expense Dashboard</h1><p style={{color:"#64748b",fontSize:12,margin:"2px 0 0"}}>Waleed's Complete Finance Tracker — All 9 Sheets</p></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>setShowGlobalSearch(!showGlobalSearch)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#94a3b8",padding:"10px 14px",borderRadius:12,cursor:"pointer",fontSize:14}}>🔍</button>
        <button onClick={()=>setHidden(!hidden)} title={hidden?"Show amounts":"Hide amounts"} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#94a3b8",padding:"10px 14px",borderRadius:12,cursor:"pointer",fontSize:16}}>{hidden?"🙈":"👁️"}</button>
        <button onClick={generatePDF} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",color:"#fff",padding:"10px 16px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:12,boxShadow:"0 4px 20px rgba(245,158,11,.3)"}}>🖨️ Print</button>
        <button onClick={()=>setShowQuickAdd(true)} style={{background:"linear-gradient(135deg,#06b6d4,#0284c7)",border:"none",color:"#fff",padding:"10px 16px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:12}}>⚡ Quick</button>
        <button onClick={()=>setShowAdd(!showAdd)} style={{background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",padding:"10px 20px",borderRadius:12,cursor:"pointer",fontWeight:700,fontSize:13,boxShadow:"0 4px 20px rgba(16,185,129,.3)"}}>+ Add</button>
        <button onClick={onLogout} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",padding:"10px 16px",borderRadius:12,cursor:"pointer",fontWeight:600,fontSize:12}}>Logout</button>
      </div>
    </div>
    {error&&<div style={{marginBottom:16,padding:12,borderRadius:10,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",fontSize:12}}>⚠️ {error}</div>}

    {/* Global Search */}
    {showGlobalSearch&&<div style={{...cd,marginBottom:16,borderColor:"rgba(99,102,241,.3)"}}>
      <input autoFocus placeholder="🔍 Search transactions, categories, parties..." value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}
        style={{...ip,fontSize:14}} onKeyDown={e=>e.key==='Escape'&&setShowGlobalSearch(false)}/>
      {globalSearch.trim()&&<div style={{marginTop:10,maxHeight:300,overflowY:'auto'}}>
        {norm.filter(tx=>[tx.desc,tx.c,tx.p,tx.n,tx.t,tx.fa,tx.ta].join(' ').toLowerCase().includes(globalSearch.toLowerCase())).slice(0,20).map((tx,i)=>(
          <div key={i} onClick={()=>{setTab('transactions');setTxFilter({...txFilter,search:globalSearch});setShowGlobalSearch(false);}} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,cursor:'pointer',marginBottom:4,background:'rgba(255,255,255,.02)',border:'1px solid rgba(255,255,255,.04)'}}>
            <div><span style={{fontSize:10,color:tC(tx.t),...{padding:'2px 6px',borderRadius:4,background:tB(tx.t),fontWeight:600}}}>{tx.t}</span> <span style={{fontSize:12,marginLeft:6}}>{tx.c}</span> {tx.desc&&<span style={{fontSize:11,color:'#64748b'}}> — {tx.desc}</span>}</div>
            <span style={{...mn,fontSize:12,fontWeight:600,color:tC(tx.t)}}>₨{ff(tx.a)}</span>
          </div>
        ))}
        {norm.filter(tx=>[tx.desc,tx.c,tx.p,tx.n,tx.t].join(' ').toLowerCase().includes(globalSearch.toLowerCase())).length===0&&<div style={{color:'#64748b',fontSize:12,padding:8}}>No results found</div>}
      </div>}
    </div>}

    {/* Quick Add Modal (Mobile) */}
    {showQuickAdd&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:1000,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowQuickAdd(false)}>
      <div style={{background:'#1e293b',borderRadius:'20px 20px 0 0',padding:24,width:'100%',maxWidth:480}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:16,color:'#e2e8f0'}}>⚡ Quick Add</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>TYPE</label>
            <select value={quickTx.t} onChange={e=>setQuickTx({...quickTx,t:e.target.value})} style={ip}>
              {settings.types.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>CATEGORY</label>
            <select value={quickTx.c} onChange={e=>setQuickTx({...quickTx,c:e.target.value})} style={ip}>
              {settings.categories.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>AMOUNT (PKR)</label>
          <input type="number" placeholder="0" value={quickTx.a} onChange={e=>setQuickTx({...quickTx,a:e.target.value})} style={{...ip,fontSize:24,fontWeight:700,textAlign:'center'}} autoFocus/>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={handleQuickAdd} disabled={saving||!quickTx.a} style={{flex:1,background:'linear-gradient(135deg,#10b981,#059669)',border:'none',color:'#fff',padding:'14px',borderRadius:12,cursor:'pointer',fontWeight:700,fontSize:15,opacity:saving||!quickTx.a?.6:1}}>
            {saving?'Saving...':'💾 Save'}
          </button>
          <button onClick={()=>setShowQuickAdd(false)} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'#94a3b8',padding:'14px 20px',borderRadius:12,cursor:'pointer',fontWeight:600}}>Cancel</button>
        </div>
      </div>
    </div>}

    {/* Overspending Alerts */}
    {(()=>{
      const curMonthBudgets = budgets.filter(b=>b.month===thisMonth&&b.year===thisYear);
      if(!curMonthBudgets.length) return null;
      const alerts = curMonthBudgets.map(b=>{
        const spent = norm.filter(tx=>tx.t==="Expense"&&tx.c===b.category&&new Date(tx.d).getMonth()===thisMonth-1&&new Date(tx.d).getFullYear()===thisYear).reduce((s,tx)=>s+tx.a,0);
        const pct = b.amount>0?(spent/b.amount)*100:0;
        return {...b,spent,pct};
      }).filter(b=>b.pct>=80);
      if(!alerts.length) return null;
      return <div style={{marginBottom:16,display:'flex',flexDirection:'column',gap:6}}>
        {alerts.map((a,i)=><div key={i} style={{padding:'10px 14px',borderRadius:10,background:a.pct>=100?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)',border:`1px solid ${a.pct>=100?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,fontWeight:600,color:a.pct>=100?'#f87171':'#fbbf24'}}>{a.pct>=100?'🔴':'🟡'} {a.category}: ₨{ff(a.spent)} / ₨{ff(a.amount)} ({a.pct.toFixed(0)}%{a.pct>=100?' — OVER BUDGET!':' — Near Limit'})</span>
        </div>)}
      </div>;
    })()}

    {editTx&&<div style={{...cd,marginBottom:20,borderColor:"rgba(245,158,11,.4)",boxShadow:"0 0 40px rgba(245,158,11,.1)"}}><ST icon="✏️">Edit Transaction</ST><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:12}}>{[["Date","d","date"],["Type","t","select",settings.types],["Category","c","select",settings.categories],["Group","g","select",settings.groups],["Amount (PKR)","a","number"],["Description","desc","text"],["From Account","fa","select",["—",...settings.accounts]],["To Account","ta","select",["—",...settings.accounts]],["Party","p","select",["—",...settings.loan_people]],["Notes","n","text"]].map(([label,key,type,opts])=><div key={key}><label style={{fontSize:10,color:"#94a3b8",display:"block",marginBottom:5,fontWeight:600}}>{label}</label>{type==="select"?<select value={editTx[key]||''} onChange={e=>setEditTx({...editTx,[key]:e.target.value==="—"?"":e.target.value})} style={{...ip,width:"100%",boxSizing:"border-box"}}>{(opts||[]).map(o=><option key={o} value={o==="—"?"":o}>{o}</option>)}</select>:<input type={type} value={editTx[key]||''} onChange={e=>setEditTx({...editTx,[key]:e.target.value})} style={{...ip,width:"100%",boxSizing:"border-box"}}/>}</div>)}</div><div style={{display:"flex",gap:10}}><button onClick={handleEditSave} disabled={saving} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",color:"#fff",padding:"10px 24px",borderRadius:10,cursor:saving?"wait":"pointer",fontWeight:700,fontSize:13,opacity:saving?.6:1}}>{saving?"Saving...":"Update"}</button><button onClick={()=>setEditTx(null)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#94a3b8",padding:"10px 24px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button></div></div>}
    {showAdd&&<div style={{...cd,marginBottom:20,borderColor:"rgba(99,102,241,.3)",boxShadow:"0 0 40px rgba(99,102,241,.08)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <ST icon="✏️">Add Transactions ({rows.length} rows)</ST>
        <button onClick={()=>{setRows(r=>[...r,emptyRow()]);}} style={{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",color:"#a78bfa",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>+ Add Row</button>
      </div>
      {/* Column headers */}
      <div style={{display:"grid",gridTemplateColumns:"110px 130px 130px 100px 110px 140px 110px 110px 110px 110px 30px",gap:6,marginBottom:6}}>
        {["Date","Type","Category","Group","Amount","Description","From Acct","To Acct","Party","Notes",""].map(h=><div key={h} style={{fontSize:9,color:"#64748b",fontWeight:700,textTransform:"uppercase",letterSpacing:.5,padding:"0 4px"}}>{h}</div>)}
      </div>
      {/* Rows */}
      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
        {rows.map((row,ri)=>(
          <div key={row.id} style={{display:"grid",gridTemplateColumns:"110px 130px 130px 100px 110px 140px 110px 110px 110px 110px 30px",gap:6,alignItems:"center",padding:"6px 8px",background:"rgba(255,255,255,.02)",borderRadius:8,border:"1px solid rgba(255,255,255,.04)"}}>
            {[["d","date"],["t","select",settings.types],["c","select",settings.categories],["g","select",settings.groups],["a","number"],["desc","text"],["fa","select",["—",...settings.accounts]],["ta","select",["—",...settings.accounts]],["p","select",["—",...settings.loan_people]],["n","text"]].map(([key,type,opts])=>(
              <div key={key}>
                {type==="select"
                  ?<select value={row[key]||''} onChange={e=>{const v=e.target.value==="—"?"":e.target.value;setRows(rs=>rs.map((r,i)=>i===ri?{...r,[key]:v}:r))}} style={{...ip,padding:"6px 8px",fontSize:11,width:"100%",boxSizing:"border-box"}}>{(opts||[]).map(o=><option key={o} value={o==="—"?"":o}>{o}</option>)}</select>
                  :<input type={type} placeholder={key==="a"?"Amount":key==="d"?"Date":"..."} value={row[key]||''} onChange={e=>{const v=e.target.value;setRows(rs=>rs.map((r,i)=>i===ri?{...r,[key]:v}:r))}} style={{...ip,padding:"6px 8px",fontSize:11,width:"100%",boxSizing:"border-box"}}/>
                }
              </div>
            ))}
            <button onClick={()=>setRows(rs=>rs.length===1?rs:rs.filter((_,i)=>i!==ri))} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",padding:"4px",borderRadius:6,cursor:"pointer",fontSize:12,textAlign:"center"}}>✕</button>
          </div>
        ))}
      </div>
      <div style={{marginTop:14,display:"flex",gap:10,alignItems:"center"}}>
        <button onClick={handleAdd} disabled={saving} style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",border:"none",color:"#fff",padding:"10px 28px",borderRadius:10,cursor:saving?"wait":"pointer",fontWeight:700,fontSize:13,opacity:saving?.6:1,boxShadow:"0 4px 20px rgba(99,102,241,.3)"}}>
          {saving?`Saving ${rows.filter(r=>r.a&&r.d).length} transactions...`:`💾 Save All (${rows.filter(r=>r.a&&r.d).length})`}
        </button>
        <button onClick={()=>setRows(r=>[...r,emptyRow()])} style={{background:"rgba(16,185,129,.1)",border:"1px solid rgba(16,185,129,.2)",color:"#10b981",padding:"10px 18px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13}}>+ Row</button>
        <button onClick={()=>{setShowAdd(false);setRows([emptyRow()]);}} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#94a3b8",padding:"10px 18px",borderRadius:10,cursor:"pointer",fontWeight:600,fontSize:13}}>Cancel</button>
        <span style={{fontSize:11,color:"#475569"}}>{rows.filter(r=>!r.a||!r.d).length>0&&`⚠️ ${rows.filter(r=>!r.a||!r.d).length} rows missing amount/date`}</span>
      </div>
    </div>}
    <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center",flexWrap:"wrap"}}>
      {[["FROM",fromDate,setFromDate],["TO",toDate,setToDate]].map(([l,v,s])=><div key={l} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.03)",padding:"6px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.06)"}}><span style={{fontSize:11,color:"#94a3b8",fontWeight:700}}>{l}</span><input type="date" value={v} onChange={e=>s(e.target.value)} style={{...ip,width:"auto",padding:"4px 8px",background:"transparent",border:"none"}}/></div>)}
      <button onClick={()=>{setFromDate("");setToDate("");}} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",padding:"6px 14px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}>Clear</button>
      {/* Date Shortcuts */}
      {[
        ["This Month",()=>{const d=new Date();setFromDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`);setToDate('');}],
        ["Last Month",()=>{const d=new Date();d.setMonth(d.getMonth()-1);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0');const last=new Date(y,d.getMonth()+1,0).getDate();setFromDate(`${y}-${m}-01`);setToDate(`${y}-${m}-${last}`);}],
        ["3 Months",()=>{const d=new Date();d.setMonth(d.getMonth()-2);setFromDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`);setToDate('');}],
        ["This Year",()=>{setFromDate(`${new Date().getFullYear()}-01-01`);setToDate('');}],
      ].map(([label,fn])=><button key={label} onClick={fn} style={{background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.2)",color:"#a78bfa",padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600}}>{label}</button>)}
      <span style={{fontSize:11,color:"#475569",...mn}}>{filtered.length} records</span>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:22,flexWrap:"wrap"}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",cursor:"pointer",borderRadius:10,fontSize:11,fontWeight:600,whiteSpace:"nowrap",background:tab===t.id?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,.04)",color:tab===t.id?"#fff":"#94a3b8",border:tab===t.id?"none":"1px solid rgba(255,255,255,.06)",transition:"all .3s"}}>{t.i} {t.l}</button>)}</div>

    {tab==="dashboard"&&<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:20}}><KPI label="Total Income" value={"₨ "+fmt(stats.income)} color="#10b981" icon="💰"/><KPI label="Total Expense" value={"₨ "+fmt(stats.expense)} color="#ef4444" icon="💸"/><KPI label="Net Balance" value={"₨ "+fmt(stats.net)} sub={stats.net>=0?"Surplus":"Deficit"} color={stats.net>=0?"#10b981":"#ef4444"} icon="📊"/><KPI label="Total Savings" value={"₨ "+fmt(stats.savings)} color="#8b5cf6" icon="💎"/><KPI label="Account Balance" value={"₨ "+fmt(ACCOUNTS.reduce((s,a)=>s+a.balance,0))} color="#06b6d4" icon="🏧"/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}><KPI label="Others Owe Me" value={"₨ "+fmt(LOANS.filter(l=>l.net>0).reduce((s,l)=>s+l.net,0))} color="#f59e0b" icon="📤"/><KPI label="I Owe Others" value={"₨ "+fmt(Math.abs(LOANS.filter(l=>l.net<0).reduce((s,l)=>s+l.net,0)))} color="#ec4899" icon="📥"/><KPI label="Net Loan" value={"₨ "+fmt(LOANS.reduce((s,l)=>s+l.net,0))} color="#f97316" icon="🔄"/><KPI label="Loan Impact" value={"₨ "+fmt(stats.loanImpact)} color="#14b8a6" icon="⚡"/></div>
      <div style={{...cd,marginBottom:20}}><ST icon="📈">Daily Income vs Expense</ST><ResponsiveContainer width="100%" height={260}><AreaChart data={dailyData}><defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/><XAxis dataKey="date" tick={{fill:"#64748b",fontSize:9}} tickFormatter={v=>v.slice(5)}/><YAxis tick={{fill:"#64748b",fontSize:9}} tickFormatter={fmt}/><Tooltip contentStyle={ts} formatter={v=>"₨ "+ff(v)}/><Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#gi)" strokeWidth={2} name="Income"/><Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#ge)" strokeWidth={2} name="Expense"/><Legend/></AreaChart></ResponsiveContainer></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <div style={cd}><ST icon="📊">Expense by Category</ST><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={catData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={2}>{catData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={ts} formatter={v=>"₨ "+ff(v)}/></PieChart></ResponsiveContainer><div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>{catData.slice(0,10).map((c,i)=><span key={i} style={{fontSize:9,color:"#94a3b8",display:"flex",alignItems:"center",gap:3}}><span style={{width:7,height:7,borderRadius:4,background:c.color,display:"inline-block"}}/>{c.name}: {fmt(c.value)}</span>)}</div></div>
        <div style={cd}><ST icon="🏢">Office vs Personal</ST><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={groupData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>{groupData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip contentStyle={ts} formatter={v=>"₨ "+ff(v)}/></PieChart></ResponsiveContainer><div style={{display:"flex",gap:16,justifyContent:"center",marginTop:6}}>{groupData.map((g,i)=><span key={i} style={{fontSize:11,color:"#94a3b8",display:"flex",alignItems:"center",gap:5}}><span style={{width:9,height:9,borderRadius:5,background:g.color,display:"inline-block"}}/>{g.name}: ₨ {fmt(g.value)}</span>)}</div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        <div style={cd}><ST icon="🏦">Account Balances</ST>{ACCOUNTS.map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:12,fontWeight:500}}>{a.name}</span><span style={{...mn,fontSize:12,fontWeight:600,color:a.balance>0?"#10b981":"#64748b"}}>{ff(a.balance)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid rgba(255,255,255,.08)",marginTop:4}}><span style={{fontWeight:700}}>TOTAL</span><span style={{...mn,fontWeight:800,color:"#10b981"}}>{ff(ACCOUNTS.reduce((s,a)=>s+a.balance,0))}</span></div></div>
        <div style={cd}><ST icon="🤝">Loan Positions</ST>{LOANS.map((l,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:12}}>{l.person}</span><span style={{...mn,fontSize:12,fontWeight:600,color:l.net>0?"#10b981":l.net<0?"#f87171":"#64748b"}}>{l.net>=0?"+":""}{ff(l.net)}</span></div>)}</div>
        <div style={cd}><ST icon="📊">Expense by Category</ST>{EXPENSE_CATS.map((c,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:12}}>{c.c}</span><span style={{...mn,fontSize:12,fontWeight:600}}>{ff(c.a)}</span></div>)}</div>
      </div>
    </>}

    {tab==="transactions"&&(()=>{
      const sf=ip => ip.toLowerCase();
      let txList = [...filtered];
      if(txFilter.type) txList=txList.filter(tx=>tx.t===txFilter.type);
      if(txFilter.category) txList=txList.filter(tx=>tx.c===txFilter.category);
      if(txFilter.group) txList=txList.filter(tx=>tx.g===txFilter.group);
      if(txFilter.account) txList=txList.filter(tx=>tx.fa===txFilter.account||tx.ta===txFilter.account);
      if(txFilter.search) txList=txList.filter(tx=>sf(tx.desc||'').includes(sf(txFilter.search))||sf(tx.c).includes(sf(txFilter.search))||sf(tx.p||'').includes(sf(txFilter.search))||sf(tx.n||'').includes(sf(txFilter.search)));
      const sortDir = txSort.dir==='asc'?1:-1;
      txList.sort((a,b)=>{
        if(txSort.col==='created_at') return sortDir*((a.created_at||'').localeCompare(b.created_at||''));
        if(txSort.col==='d') return sortDir*a.d.localeCompare(b.d);
        if(txSort.col==='a') return sortDir*(a.a-b.a);
        if(txSort.col==='t') return sortDir*a.t.localeCompare(b.t);
        if(txSort.col==='c') return sortDir*a.c.localeCompare(b.c);
        return 0;
      });
      const SortBtn=({col,label})=><span onClick={()=>setTxSort(s=>({col,dir:s.col===col&&s.dir==='desc'?'asc':'desc'}))} style={{cursor:'pointer',userSelect:'none',color:txSort.col===col?'#a78bfa':'#64748b'}}>{label} {txSort.col===col?(txSort.dir==='desc'?'↓':'↑'):'↕'}</span>;
      const selSt={...ip,padding:'6px 10px',fontSize:11,width:'auto'};
      return <div style={cd}>
        <ST icon="📋">Transactions ({txList.length})</ST>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16,padding:14,background:'rgba(255,255,255,.02)',borderRadius:12,border:'1px solid rgba(255,255,255,.05)'}}>
          <input placeholder="🔍 Search..." value={txFilter.search} onChange={e=>setTxFilter({...txFilter,search:e.target.value})} style={{...ip,width:160,padding:'6px 10px',fontSize:11}}/>
          <select value={txFilter.type} onChange={e=>setTxFilter({...txFilter,type:e.target.value})} style={selSt}><option value="">All Types</option>{settings.types.map(t=><option key={t}>{t}</option>)}</select>
          <select value={txFilter.category} onChange={e=>setTxFilter({...txFilter,category:e.target.value})} style={selSt}><option value="">All Categories</option>{settings.categories.map(c=><option key={c}>{c}</option>)}</select>
          <select value={txFilter.group} onChange={e=>setTxFilter({...txFilter,group:e.target.value})} style={selSt}><option value="">All Groups</option>{settings.groups.map(g=><option key={g}>{g}</option>)}</select>
          <select value={txFilter.account} onChange={e=>setTxFilter({...txFilter,account:e.target.value})} style={selSt}><option value="">All Accounts</option>{settings.accounts.map(a=><option key={a}>{a}</option>)}</select>
          {(txFilter.type||txFilter.category||txFilter.group||txFilter.account||txFilter.search)&&<button onClick={()=>setTxFilter({type:'',category:'',group:'',account:'',search:''})} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171',padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600}}>✕ Clear</button>}
          <span style={{fontSize:11,color:'#475569',display:'flex',alignItems:'center',...mn}}>{txList.length} results</span>
        </div>
        <TW>
          <thead><tr>
            <th style={thS}><SortBtn col="d" label="Date"/></th>
            <th style={thS}><SortBtn col="created_at" label="Added"/></th>
            <th style={thS}><SortBtn col="t" label="Type"/></th>
            <th style={thS}><SortBtn col="c" label="Category"/></th>
            <th style={thS}>Group</th>
            <th style={thS}>Description</th>
            <th style={thS}><SortBtn col="a" label="Amount"/></th>
            <th style={thS}>From</th>
            <th style={thS}>To</th>
            <th style={thS}>Party</th>
            <th style={thS}>Notes</th>
            <th style={thS}></th>
          </tr></thead>
          <tbody>{txList.map((tx,i)=><tr key={tx.id||i} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <td style={{...td,...mn,fontSize:11,color:"#94a3b8"}}>{tx.d}</td>
            <td style={{...td,...mn,fontSize:10,color:"#475569"}}>{tx.created_at?new Date(tx.created_at).toLocaleString('en-PK',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}):"—"}</td>
            <td style={td}><Bd text={tx.t} color={tC(tx.t)} bg={tB(tx.t)}/></td>
            <td style={{...td,fontWeight:500}}>{tx.c}</td>
            <td style={td}><Bd text={tx.g} color={tx.g==="Office"?"#a5b4fc":"#fbbf24"} bg={tx.g==="Office"?"rgba(99,102,241,.12)":"rgba(245,158,11,.12)"}/></td>
            <td style={{...td,color:"#94a3b8",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.desc||"—"}</td>
            <td style={{...td,...mn,fontWeight:600,color:tC(tx.t)}}>{ff(tx.a)}</td>
            <td style={{...td,fontSize:11,color:"#64748b"}}>{tx.fa||"—"}</td>
            <td style={{...td,fontSize:11,color:"#64748b"}}>{tx.ta||"—"}</td>
            <td style={{...td,fontSize:11,color:"#a78bfa"}}>{tx.p||"—"}</td>
            <td style={{...td,fontSize:10,color:"#475569"}}>{tx.n||"—"}</td>
            <td style={td}>{tx.id&&<div style={{display:"flex",gap:4}}>
              <button onClick={()=>handleEditOpen(tx)} style={{background:"rgba(245,158,11,.1)",border:"1px solid rgba(245,158,11,.2)",color:"#fbbf24",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:10}}>✎</button>
              <button onClick={()=>handleDelete(tx.id)} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.2)",color:"#f87171",padding:"3px 8px",borderRadius:6,cursor:"pointer",fontSize:10}}>✕</button>
            </div>}</td>
          </tr>)}</tbody>
        </TW>
      </div>;
    })()}

    {tab==="savings"&&<div style={cd}><ST icon="🏦">Savings Transactions</ST><TW><thead><tr>{["Date","Month","Type","Location","Amount"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead><tbody>{SAVINGS_DATA.map((s,i)=><tr key={i}><td style={{...td,...mn,fontSize:11,color:"#94a3b8"}}>{s.d}</td><td style={{...td,fontWeight:500}}>{s.mo}</td><td style={td}><Bd text={s.t} color="#a78bfa" bg="rgba(139,92,246,.12)"/></td><td style={{...td,fontWeight:600}}>{s.loc}</td><td style={{...td,...mn,fontWeight:600,color:"#10b981"}}>{ff(s.a)}</td></tr>)}</tbody></TW><div style={{marginTop:16,padding:14,background:"rgba(139,92,246,.08)",borderRadius:12,border:"1px solid rgba(139,92,246,.15)",display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:"#a78bfa"}}>Total Savings Deposited</span><span style={{...mn,fontWeight:700,color:"#10b981"}}>₨ {ff(SAVINGS_DATA.filter(s=>s.t==="Savings Deposit").reduce((s,x)=>s+x.a,0))}</span></div></div>}

    {tab==="monthly"&&<div style={cd}><ST icon="📅">Monthly Summary (Jan–Dec)</ST><TW><thead><tr>{["Month","Opening","Income","Expense","Net","Loan Impact","Acct Net","Closing","Office Exp","Personal Exp","Loan Given","Loan Taken","Loan Repaid","Loan Back","Notes"].map(h=><th key={h} style={{...thS,fontSize:9}}>{h}</th>)}</tr></thead><tbody>{MONTHLY_SUMMARY.map((m,i)=><tr key={i} style={{opacity:m.income||m.expense?1:.4}}><td style={{...td,fontWeight:600}}>{m.month}</td><td style={{...td,...mn,fontSize:11,color:"#64748b"}}>{ff(m.opening)}</td><td style={{...td,...mn,fontSize:11,color:"#10b981"}}>{ff(m.income)}</td><td style={{...td,...mn,fontSize:11,color:"#f87171"}}>{ff(m.expense)}</td><td style={{...td,...mn,fontSize:11,fontWeight:700,color:m.netMovement>=0?"#10b981":"#f87171"}}>{ff(m.netMovement)}</td><td style={{...td,...mn,fontSize:11,color:m.loanImpact>=0?"#10b981":"#f87171"}}>{ff(m.loanImpact)}</td><td style={{...td,...mn,fontSize:11}}>{ff(m.accountNet)}</td><td style={{...td,...mn,fontSize:11,fontWeight:700,color:m.closing>=0?"#10b981":"#f87171"}}>{ff(m.closing)}</td><td style={{...td,...mn,fontSize:11,color:"#a5b4fc"}}>{ff(m.officeExpense)}</td><td style={{...td,...mn,fontSize:11,color:"#fbbf24"}}>{ff(m.personalExpense)}</td><td style={{...td,...mn,fontSize:11}}>{ff(m.loanGiven)}</td><td style={{...td,...mn,fontSize:11}}>{ff(m.loanTaken)}</td><td style={{...td,...mn,fontSize:11}}>{ff(m.loanRepaid)}</td><td style={{...td,...mn,fontSize:11}}>{ff(m.loanReceivedBack)}</td><td style={td}><input defaultValue={monthlyNotes[`${thisYear}-${i+1}`]||''} placeholder="Add note..." onBlur={e=>saveNote(i+1,thisYear,e.target.value)} style={{background:'transparent',border:'none',borderBottom:'1px solid rgba(255,255,255,.1)',color:'#94a3b8',fontSize:11,outline:'none',width:120,fontFamily:'inherit'}}/></td></tr>)}</tbody></TW></div>}

    {tab==="accounts"&&<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:20}}>{ACCOUNTS.map((a,i)=><div key={i} style={{...cd,position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:3,background:CL[i%CL.length]}}/><div style={{fontSize:15,fontWeight:700,marginBottom:10}}>{a.name}</div><div style={{fontSize:22,fontWeight:800,...mn,color:a.balance>0?"#10b981":"#ef4444",marginBottom:10}}>₨ {ff(a.balance)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:10}}><div><span style={{color:"#64748b"}}>Opening</span><br/><span style={{color:"#94a3b8",...mn}}>{ff(a.opening)}</span></div><div><span style={{color:"#64748b"}}>Money In</span><br/><span style={{color:"#10b981",...mn}}>{fmt(a.moneyIn)}</span></div><div><span style={{color:"#64748b"}}>Money Out</span><br/><span style={{color:"#f87171",...mn}}>{fmt(a.moneyOut)}</span></div><div><span style={{color:"#64748b"}}>Change</span><br/><span style={{color:a.balance-a.opening>=0?"#10b981":"#f87171",...mn}}>{a.balance-a.opening>=0?"+":""}{ff(a.balance-a.opening)}</span></div></div></div>)}</div><div style={cd}><ST icon="📊">Account Balances Chart</ST><ResponsiveContainer width="100%" height={280}><BarChart data={ACCOUNTS.filter(a=>a.balance>0)}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/><XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:11}}/><YAxis tick={{fill:"#64748b",fontSize:10}} tickFormatter={fmt}/><Tooltip contentStyle={ts} formatter={v=>"₨ "+ff(v)}/><Bar dataKey="balance" radius={[6,6,0,0]} name="Balance">{ACCOUNTS.filter(a=>a.balance>0).map((e,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></>}

    {tab==="savSummary"&&<div style={cd}><ST icon="💎">Savings Summary</ST><TW><thead><tr>{["Location","Deposits","Withdraws","Net Savings","Last Activity","Opening","Total Balance"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead><tbody>{SAVINGS_SUMMARY.map((s,i)=><tr key={i} style={{opacity:s.totalBalance?1:.45}}><td style={{...td,fontWeight:600}}>{s.location}</td><td style={{...td,...mn,color:"#10b981"}}>{ff(s.deposits)}</td><td style={{...td,...mn,color:"#f87171"}}>{ff(s.withdraws)}</td><td style={{...td,...mn,fontWeight:600,color:s.netSavings>=0?"#10b981":"#f87171"}}>{ff(s.netSavings)}</td><td style={{...td,...mn,fontSize:11,color:"#94a3b8"}}>{s.lastActivity}</td><td style={{...td,...mn}}>{ff(s.openingBalance)}</td><td style={{...td,...mn,fontWeight:700,color:"#a78bfa"}}>{ff(s.totalBalance)}</td></tr>)}</tbody></TW><div style={{marginTop:16,padding:14,background:"rgba(139,92,246,.08)",borderRadius:12,border:"1px solid rgba(139,92,246,.15)",display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:600,color:"#a78bfa"}}>Grand Total Savings</span><span style={{...mn,fontWeight:700,fontSize:18,color:"#10b981"}}>₨ {ff(SAVINGS_SUMMARY.reduce((s,x)=>s+x.totalBalance,0))}</span></div></div>}

    {tab==="loans"&&<div style={cd}><ST icon="🤝">Loan Summary</ST><TW><thead><tr>{["Person","Given","Received Back","Taken","Repaid","Net Position","Open Given","Open Taken"].map(h=><th key={h} style={thS}>{h}</th>)}</tr></thead><tbody>{LOANS.map((l,i)=><tr key={i}><td style={{...td,fontWeight:700}}>{l.person}</td><td style={{...td,...mn,color:l.given?"#f59e0b":"#475569"}}>{ff(l.given)}</td><td style={{...td,...mn,color:l.receivedBack?"#10b981":"#475569"}}>{ff(l.receivedBack)}</td><td style={{...td,...mn,color:l.taken?"#ec4899":"#475569"}}>{ff(l.taken)}</td><td style={{...td,...mn,color:l.repaid?"#14b8a6":"#475569"}}>{ff(l.repaid)}</td><td style={{...td,...mn,fontWeight:700,color:l.net>0?"#10b981":l.net<0?"#f87171":"#64748b"}}>{l.net>=0?"+":""}{ff(l.net)}</td><td style={{...td,...mn,fontSize:11,color:"#94a3b8"}}>{ff(l.openGiven)}</td><td style={{...td,...mn,fontSize:11,color:"#94a3b8"}}>{ff(l.openTaken)}</td></tr>)}</tbody></TW><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:16}}><div style={{padding:14,background:"rgba(16,185,129,.08)",borderRadius:12,border:"1px solid rgba(16,185,129,.15)"}}><div style={{fontSize:12,color:"#10b981",fontWeight:600,marginBottom:4}}>Others Owe Me</div><div style={{...mn,fontSize:20,fontWeight:800,color:"#10b981"}}>₨ {ff(LOANS.filter(l=>l.net>0).reduce((s,l)=>s+l.net,0))}</div></div><div style={{padding:14,background:"rgba(239,68,68,.08)",borderRadius:12,border:"1px solid rgba(239,68,68,.15)"}}><div style={{fontSize:12,color:"#f87171",fontWeight:600,marginBottom:4}}>I Owe Others</div><div style={{...mn,fontSize:20,fontWeight:800,color:"#f87171"}}>₨ {ff(Math.abs(LOANS.filter(l=>l.net<0).reduce((s,l)=>s+l.net,0)))}</div></div></div></div>}

    {tab==="report"&&<><div style={{...cd,marginBottom:20}}><ST icon="📊">Monthly Report — {new Date().toLocaleString('default',{month:'long',year:'numeric'})}</ST><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:20}}>{[["Total Income",MR.totalIncome,"#10b981"],["Total Expense",MR.totalExpense,"#ef4444"],["Net Balance",MR.netBalance,"#6366f1"],["Loan Given",MR.loanGiven,"#f59e0b"],["Loan Taken",MR.loanTaken,"#ec4899"],["Loan Repaid",MR.loanRepaid,"#14b8a6"],["Loan Received Back",MR.loanReceivedBack,"#8b5cf6"],["Transfer",MR.transfer,"#06b6d4"],["Savings Deposit",MR.savingsDeposit,"#84cc16"],["Savings Withdraw",MR.savingsWithdraw,"#64748b"],["Adjusted Net",MR.adjustedNet,"#f97316"]].map(([l,v,c],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"rgba(255,255,255,.02)",borderRadius:10,border:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>{l}</span><span style={{...mn,fontSize:14,fontWeight:700,color:c}}>{ff(v)}</span></div>)}</div></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
      <div style={cd}><ST icon="💎">Savings</ST>{MR.savings.map((s,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><div><div style={{fontSize:12,fontWeight:500}}>{s.loc}</div><div style={{fontSize:10,color:"#64748b"}}>Opening: {ff(s.opening)}</div></div><span style={{...mn,fontSize:12,fontWeight:600,color:s.activity?"#10b981":"#475569"}}>{ff(s.activity)}</span></div>)}</div>
      <div style={cd}><ST icon="🏧">Account Balances</ST>{MR.accounts.map((a,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:12}}>{a.name}</span><span style={{...mn,fontSize:12,fontWeight:600,color:a.bal>0?"#10b981":"#64748b"}}>{ff(a.bal)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"2px solid rgba(255,255,255,.08)",marginTop:4}}><span style={{fontWeight:700}}>TOTAL</span><span style={{...mn,fontWeight:800,color:"#10b981"}}>{ff(MR.accounts.reduce((s,a)=>s+a.bal,0))}</span></div></div>
      <div style={cd}><ST icon="📊">Expense by Category</ST>{EXPENSE_CATS.map((c,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}><span style={{fontSize:12}}>{c.c}</span><span style={{...mn,fontSize:12,fontWeight:600}}>{ff(c.a)}</span></div>)}</div>
    </div>
    <div style={{...cd,marginTop:20}}><ST icon="📈">Expense by Category Chart</ST><ResponsiveContainer width="100%" height={380}><BarChart data={EXPENSE_CATS} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/><XAxis type="number" tick={{fill:"#64748b",fontSize:10}} tickFormatter={fmt}/><YAxis type="category" dataKey="c" tick={{fill:"#94a3b8",fontSize:11}} width={110}/><Tooltip contentStyle={ts} formatter={v=>"₨ "+ff(v)}/><Bar dataKey="a" radius={[0,6,6,0]} name="Amount">{EXPENSE_CATS.map((e,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></>}

    {tab==="settings"&&<SettingsTab settings={settings} setSettings={setSettings} user={user} setError={setError}/>}

    {/* BUDGET TAB */}
    {tab==="budget"&&(()=>{
      const monthNames=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const curBudgets = budgets.filter(b=>b.month===selectedBudgetMonth&&b.year===selectedBudgetYear);
      const getBudget = (cat) => curBudgets.find(b=>b.category===cat)?.amount||0;
      const getSpent = (cat) => norm.filter(tx=>tx.t==="Expense"&&tx.c===cat&&new Date(tx.d).getMonth()===selectedBudgetMonth-1&&new Date(tx.d).getFullYear()===selectedBudgetYear).reduce((s,tx)=>s+tx.a,0);
      const totalBudget = curBudgets.reduce((s,b)=>s+b.amount,0);
      const totalSpent = settings.categories.reduce((s,cat)=>s+getSpent(cat),0);
      return <div>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
          <h3 style={{margin:0,fontSize:15,fontWeight:700,color:'#a78bfa'}}>🎯 Budget vs Actual</h3>
          <select value={selectedBudgetMonth} onChange={e=>setSelectedBudgetMonth(Number(e.target.value))} style={{...ip,width:'auto',padding:'6px 12px'}}>
            {monthNames.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
          </select>
          <select value={selectedBudgetYear} onChange={e=>setSelectedBudgetYear(Number(e.target.value))} style={{...ip,width:'auto',padding:'6px 12px'}}>
            {[2025,2026,2027].map(y=><option key={y}>{y}</option>)}
          </select>
          <span style={{fontSize:12,color:'#64748b'}}>Total Budget: <strong style={{color:'#a78bfa'}}>₨{ff(totalBudget)}</strong> | Spent: <strong style={{color:totalSpent>totalBudget?'#f87171':'#10b981'}}>₨{ff(totalSpent)}</strong></span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {settings.categories.map(cat=>{
            const budget=getBudget(cat), spent=getSpent(cat);
            const pct=budget>0?Math.min((spent/budget)*100,100):0;
            const over=budget>0&&spent>budget;
            return <div key={cat} style={{...cd,position:'relative'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:600}}>{cat}</span>
                <span style={{fontSize:11,...mn,color:over?'#f87171':'#94a3b8'}}>₨{fmt(spent)}{budget>0&&<> / ₨{fmt(budget)}</>}</span>
              </div>
              {budget>0&&<>
                <div style={{background:'rgba(255,255,255,.05)',borderRadius:6,height:8,marginBottom:6,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:6,width:`${pct}%`,background:over?'linear-gradient(90deg,#ef4444,#dc2626)':pct>80?'linear-gradient(90deg,#f59e0b,#d97706)':'linear-gradient(90deg,#10b981,#059669)',transition:'width .3s'}}/>
                </div>
                <div style={{fontSize:10,color:over?'#f87171':pct>80?'#fbbf24':'#64748b'}}>{over?`Over by ₨${fmt(spent-budget)}`:`${pct.toFixed(0)}% used`}</div>
              </>}
              <input type="number" placeholder="Set budget..." defaultValue={budget||''} onBlur={e=>e.target.value&&saveBudget(cat,e.target.value)}
                style={{...ip,marginTop:8,padding:'6px 10px',fontSize:11,opacity:.7}} />
            </div>;
          })}
        </div>
      </div>;
    })()}

    {/* GOALS TAB */}
    {tab==="goals"&&<div>
      <div style={{...cd,marginBottom:20,borderColor:'rgba(99,102,241,.3)'}}>
        <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:'#a78bfa'}}>🏆 Add New Goal</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
          {[['Title','title','text'],['Target Amount','target_amount','number'],['Deadline','deadline','date']].map(([label,key,type])=>(
            <div key={key}><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>{label}</label>
              <input type={type} placeholder={label} value={newGoal[key]} onChange={e=>setNewGoal({...newGoal,[key]:e.target.value})} style={ip}/></div>
          ))}
          <div><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>Color</label>
            <div style={{display:'flex',gap:6,marginTop:4}}>
              {['#6366f1','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6'].map(c=>(
                <div key={c} onClick={()=>setNewGoal({...newGoal,color:c})} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',border:newGoal.color===c?'2px solid #fff':'2px solid transparent'}}/>
              ))}
            </div>
          </div>
        </div>
        <button onClick={saveGoal} style={{marginTop:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>+ Add Goal</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
        {goals.map(g=>{
          const pct=g.target_amount>0?Math.min((g.current_amount/g.target_amount)*100,100):0;
          const remaining=g.target_amount-g.current_amount;
          return <div key={g.id} style={{...cd,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:g.color}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div style={{fontSize:14,fontWeight:700}}>{g.title}</div>
              <button onClick={()=>deleteGoal(g.id)} style={{background:'none',border:'none',color:'#475569',cursor:'pointer',fontSize:14}}>✕</button>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
              <span style={{fontSize:12,color:'#94a3b8'}}>Progress</span>
              <span style={{...mn,fontSize:13,fontWeight:700,color:g.color}}>₨{fmt(g.current_amount)} / ₨{fmt(g.target_amount)}</span>
            </div>
            <div style={{background:'rgba(255,255,255,.05)',borderRadius:8,height:12,marginBottom:8,overflow:'hidden'}}>
              <div style={{height:'100%',borderRadius:8,width:`${pct}%`,background:`linear-gradient(90deg,${g.color},${g.color}99)`,transition:'width .3s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:11,color:'#64748b'}}>
              <span>{pct.toFixed(1)}% complete</span>
              {remaining>0&&<span>₨{fmt(remaining)} remaining</span>}
              {g.deadline&&<span>📅 {g.deadline}</span>}
            </div>
            <div style={{display:'flex',gap:6}}>
              <input type="number" placeholder="Update amount..." style={{...ip,padding:'6px 10px',fontSize:11,flex:1}}
                onKeyDown={e=>e.key==='Enter'&&updateGoalAmount(g.id, parseFloat(e.target.value)||0)}/>
              <button onClick={e=>updateGoalAmount(g.id, parseFloat(e.target.previousSibling.value)||0)} style={{background:`${g.color}22`,border:`1px solid ${g.color}44`,color:g.color,padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600}}>Update</button>
            </div>
          </div>;
        })}
        {goals.length===0&&<div style={{...cd,color:'#64748b',textAlign:'center',padding:40}}>No goals yet. Add your first financial goal above! 🎯</div>}
      </div>
    </div>}

    {/* INSIGHTS TAB */}
    {tab==="insights"&&(()=>{
      const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      // Month over month data (last 6 months)
      const last6 = Array.from({length:6},(_,i)=>{
        const d=new Date(); d.setMonth(d.getMonth()-5+i);
        const m=d.getMonth(), y=d.getFullYear();
        const txs=norm.filter(tx=>new Date(tx.d).getMonth()===m&&new Date(tx.d).getFullYear()===y);
        const income=txs.filter(t=>t.t==="Income").reduce((s,t)=>s+t.a,0);
        const expense=txs.filter(t=>t.t==="Expense").reduce((s,t)=>s+t.a,0);
        return {month:months[m],income,expense,net:income-expense};
      });
      // Top categories this month
      const thisMonthTxs=norm.filter(tx=>new Date(tx.d).getMonth()===thisMonth-1&&new Date(tx.d).getFullYear()===thisYear&&tx.t==="Expense");
      const catTotals={};
      thisMonthTxs.forEach(tx=>{catTotals[tx.c]=(catTotals[tx.c]||0)+tx.a;});
      const topCats=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const totalThisMonth=thisMonthTxs.reduce((s,tx)=>s+tx.a,0);
      // Net worth timeline
      const netWorthData=Array.from({length:6},(_,i)=>{
        const d=new Date(); d.setMonth(d.getMonth()-5+i);
        const m=d.getMonth(), y=d.getFullYear();
        const bal={};
        settings.accounts.forEach(acc=>{bal[acc]=(settings.opening_balances.find(o=>o.account===acc)?.amount||0);});
        norm.filter(tx=>new Date(tx.d).getMonth()<=m&&new Date(tx.d).getFullYear()<=y).forEach(tx=>{
          if(tx.ta&&bal[tx.ta]!==undefined)bal[tx.ta]+=tx.a;
          if(tx.fa&&bal[tx.fa]!==undefined)bal[tx.fa]-=tx.a;
        });
        const accTotal=Object.values(bal).reduce((s,v)=>s+v,0);
        const savTotal=SAVINGS_SUMMARY.reduce((s,x)=>s+x.totalBalance,0);
        return {month:months[m],netWorth:accTotal+savTotal};
      });
      // Smart insights
      const prevMonthTxs=norm.filter(tx=>new Date(tx.d).getMonth()===thisMonth-2&&new Date(tx.d).getFullYear()===thisYear);
      const prevExp=prevMonthTxs.filter(t=>t.t==="Expense").reduce((s,t)=>s+t.a,0);
      const savingRate=stats.income>0?((stats.income-stats.expense)/stats.income*100).toFixed(1):0;
      return <div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12,marginBottom:20}}>
          {[
            ["💡 Saving Rate",`${savingRate}%`,savingRate>20?'#10b981':savingRate>10?'#f59e0b':'#ef4444'],
            ["📉 Biggest Expense",topCats[0]?`${topCats[0][0]}: ₨${fmt(topCats[0][1])}`:'—','#f59e0b'],
            ["📊 Avg Monthly Exp",`₨${fmt(Math.round(last6.reduce((s,m)=>s+m.expense,0)/6))}`,'#ef4444'],
            ["💰 Avg Monthly Inc",`₨${fmt(Math.round(last6.reduce((s,m)=>s+m.income,0)/6))}`,'#10b981'],
            ["📈 vs Last Month",prevExp?`${totalThisMonth>prevExp?'+':''}${(((totalThisMonth-prevExp)/prevExp)*100).toFixed(1)}%`:'First month',totalThisMonth>prevExp?'#f87171':'#10b981'],
          ].map(([l,v,c],i)=><div key={i} style={{...cd,textAlign:'center',padding:16}}><div style={{fontSize:11,color:'#64748b',marginBottom:6}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,...mn}}>{v}</div></div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div style={cd}>
            <h3 style={{margin:'0 0 14px',fontSize:14,fontWeight:700,color:'#a78bfa'}}>📊 6-Month Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last6}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/><XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}}/><YAxis tick={{fill:'#64748b',fontSize:9}} tickFormatter={fmt}/><Tooltip contentStyle={ts} formatter={v=>"₨"+ff(v)}/><Bar dataKey="income" fill="#10b981" radius={[4,4,0,0]} name="Income"/><Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense"/><Legend/></BarChart>
            </ResponsiveContainer>
          </div>
          <div style={cd}>
            <h3 style={{margin:'0 0 14px',fontSize:14,fontWeight:700,color:'#a78bfa'}}>🌟 Net Worth Timeline</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={netWorthData}><defs><linearGradient id="gnw" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)"/><XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}}/><YAxis tick={{fill:'#64748b',fontSize:9}} tickFormatter={fmt}/><Tooltip contentStyle={ts} formatter={v=>"₨"+ff(v)}/><Area type="monotone" dataKey="netWorth" stroke="#6366f1" fill="url(#gnw)" strokeWidth={2} name="Net Worth"/></AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={cd}>
          <h3 style={{margin:'0 0 14px',fontSize:14,fontWeight:700,color:'#a78bfa'}}>🏷️ Top Categories This Month</h3>
          {topCats.map(([cat,amt],i)=>{
            const pct=totalThisMonth>0?((amt/totalThisMonth)*100).toFixed(1):0;
            return <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
              <span style={{fontSize:12,fontWeight:600,width:120}}>{cat}</span>
              <div style={{flex:1,background:'rgba(255,255,255,.05)',borderRadius:4,height:8,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,width:`${pct}%`,background:`linear-gradient(90deg,${CL[i]},${CL[i]}99)`}}/>
              </div>
              <span style={{...mn,fontSize:12,fontWeight:600,width:80,textAlign:'right'}}>₨{fmt(amt)}</span>
              <span style={{fontSize:11,color:'#64748b',width:40}}>{pct}%</span>
            </div>;
          })}
        </div>
      </div>;
    })()}

    {/* RECURRING TAB */}
    {tab==="recurring"&&<div>
      <div style={{...cd,marginBottom:20,borderColor:'rgba(6,182,212,.3)'}}>
        <h3 style={{margin:'0 0 14px',fontSize:15,fontWeight:700,color:'#a78bfa'}}>🔁 Add Recurring Transaction</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
          {[['Day of Month','d','number'],['Type','t','select',settings.types],['Category','c','select',settings.categories],['Group','g','select',settings.groups],['Amount','a','number'],['Description','description','text'],['From Account','fa','select',['—',...settings.accounts]],['Party','p','select',['—',...settings.loan_people]]].map(([label,key,type,opts])=>(
            <div key={key}><label style={{fontSize:10,color:'#94a3b8',display:'block',marginBottom:4}}>{label}</label>
              {type==='select'?<select value={newRecurring[key]||''} onChange={e=>setNewRecurring({...newRecurring,[key]:e.target.value==='—'?'':e.target.value})} style={ip}>{opts.map(o=><option key={o} value={o==='—'?'':o}>{o}</option>)}</select>
              :<input type={type} placeholder={label} value={newRecurring[key]||''} onChange={e=>setNewRecurring({...newRecurring,[key]:e.target.value})} style={ip}/>}
            </div>
          ))}
        </div>
        <button onClick={saveRecurring} style={{marginTop:12,background:'linear-gradient(135deg,#06b6d4,#0284c7)',border:'none',color:'#fff',padding:'10px 24px',borderRadius:10,cursor:'pointer',fontWeight:700,fontSize:13}}>+ Add Recurring</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
        {recurring.map(r=>(
          <div key={r.id} style={{...cd,opacity:r.active?1:.5,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:r.active?tC(r.t):'#475569'}}/>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div><div style={{fontSize:13,fontWeight:700}}>{r.description||r.c}</div><div style={{fontSize:11,color:'#64748b',marginTop:2}}>Every month on day {r.d} • {r.c} • {r.g}</div></div>
              <div style={{fontSize:16,fontWeight:800,...mn,color:tC(r.t)}}>₨{fmt(r.a)}</div>
            </div>
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <button onClick={()=>addRecurringNow(r)} style={{flex:1,background:'rgba(16,185,129,.1)',border:'1px solid rgba(16,185,129,.2)',color:'#10b981',padding:'6px',borderRadius:8,cursor:'pointer',fontSize:11,fontWeight:600}}>+ Add Now</button>
              <button onClick={()=>toggleRecurring(r.id,!r.active)} style={{background:r.active?'rgba(245,158,11,.1)':'rgba(99,102,241,.1)',border:`1px solid ${r.active?'rgba(245,158,11,.2)':'rgba(99,102,241,.2)'}`,color:r.active?'#fbbf24':'#a78bfa',padding:'6px 12px',borderRadius:8,cursor:'pointer',fontSize:11}}>{r.active?'Pause':'Resume'}</button>
              <button onClick={()=>deleteRecurring(r.id)} style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#f87171',padding:'6px 10px',borderRadius:8,cursor:'pointer',fontSize:11}}>✕</button>
            </div>
          </div>
        ))}
        {recurring.length===0&&<div style={{...cd,color:'#64748b',textAlign:'center',padding:40}}>No recurring transactions yet. Add your first one above! 🔁</div>}
      </div>
    </div>}

    <div style={{marginTop:28,padding:16,background:"rgba(255,255,255,.02)",borderRadius:16,border:"1px solid rgba(255,255,255,.04)",textAlign:"center"}}>
      <div style={{fontSize:10,color:"#475569",marginBottom:3}}>Total Account Balance</div>
      <div style={{fontSize:28,fontWeight:800,...mn,background:"linear-gradient(135deg,#10b981,#06b6d4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{mV("₨ "+ff(ACCOUNTS.reduce((s,a)=>s+a.balance,0)))}</div>
      <div style={{fontSize:10,color:"#475569",marginTop:3}}>{ACCOUNTS.length} Accounts • Savings: {mV("₨ "+ff(SAVINGS_SUMMARY.reduce((s,x)=>s+x.totalBalance,0)))} • {filtered.length} Transactions</div>
    </div>
  </div>);
}