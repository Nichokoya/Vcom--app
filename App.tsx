
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare, 
  GraduationCap,
  Plus,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Send,
  Trash2,
  Trophy,
  Loader2,
  Bell,
  ExternalLink,
  Info,
  LogOut,
  User as UserIcon,
  Medal,
  TrendingUp,
  LogIn
} from 'lucide-react';
import { ViewState, SoulRecord, ChatMessage, User, LeaderboardEntry } from './types';
import { VCOM_MANDATE, VCOM_VISIONARY } from './constants';
import { geminiService, ChatResponse } from './services/geminiService';

// --- Utils ---
const getWeekKey = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo}`;
};

// --- Components ---

const LoginView: React.FC<{ onLogin: (name: string) => void }> = ({ onLogin }) => {
  const [name, setName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onLogin(name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-900 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-12 h-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 italic">VCOM</h1>
          <p className="text-slate-500 mt-2">Voice Crying Outreach Mandate</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Enter Your Name</label>
            <input 
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <LogIn size={20} /> Sign In to Mission
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-slate-400 italic">
          "The harvest truly is plenteous, but the labourers are few."
        </p>
      </div>
    </div>
  );
};

const Navbar: React.FC<{ currentView: ViewState, setView: (view: ViewState) => void, user: User }> = ({ currentView, setView, user }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'mandate', label: 'Mandate', icon: BookOpen },
    { id: 'outreach', label: 'Outreach', icon: Users },
    { id: 'leaderboard', label: 'Rankings', icon: Trophy },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'ai-mentor', label: 'Mentor', icon: MessageSquare },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:top-0 md:bottom-auto md:h-16 md:px-8">
      <div className="flex justify-around items-center h-full max-w-6xl mx-auto md:justify-between">
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-indigo-700 text-xl">
            <ShieldCheck className="w-8 h-8" />
            <span>VCOM</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <button 
            onClick={() => setView('profile')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <UserIcon size={16} />
            </div>
            <span className="text-sm font-semibold">{user.name}</span>
          </button>
        </div>
        <div className="flex w-full justify-around md:w-auto md:gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-colors md:flex-row md:gap-2 ${
                currentView === item.id 
                  ? 'text-indigo-600 border-t-2 border-indigo-600 md:border-t-0 md:border-b-2' 
                  : 'text-slate-500 hover:text-indigo-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium md:text-sm">{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setView('profile')}
            className={`md:hidden flex flex-col items-center justify-center py-2 px-1 text-slate-500`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const LeaderboardView: React.FC<{ records: SoulRecord[], users: User[] }> = ({ records, users }) => {
  const currentWeekKey = getWeekKey(new Date());

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const weeklyRecords = records.filter(r => getWeekKey(new Date(r.datePreached)) === currentWeekKey);
    const userMap = new Map<string, number>();
    
    weeklyRecords.forEach(r => {
      userMap.set(r.userId, (userMap.get(r.userId) || 0) + 1);
    });

    const entries: LeaderboardEntry[] = users.map(u => ({
      userId: u.id,
      userName: u.name,
      soulCount: userMap.get(u.id) || 0
    })).sort((a, b) => b.soulCount - a.soulCount);

    return entries;
  }, [records, users, currentWeekKey]);

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4 animate-in fade-in duration-500">
      <header className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Weekly Leaderboard</h2>
        <p className="text-indigo-600 font-semibold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
          <Medal size={16} /> Week of {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {leaderboard.map((entry, idx) => (
          <div 
            key={entry.userId} 
            className={`flex items-center justify-between p-6 border-b border-slate-50 last:border-0 transition-colors ${idx === 0 ? 'bg-amber-50/50' : ''}`}
          >
            <div className="flex items-center gap-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                idx === 0 ? 'bg-amber-400 text-white shadow-lg' :
                idx === 1 ? 'bg-slate-300 text-white shadow-md' :
                idx === 2 ? 'bg-orange-300 text-white shadow-md' :
                'bg-slate-100 text-slate-500'
              }`}>
                {idx + 1}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{entry.userName}</p>
                <p className="text-xs text-slate-400">Mission Participant</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-indigo-600">{entry.soulCount}</p>
              <p className="text-[10px] font-bold text-indigo-300 uppercase">Souls Won</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl flex items-center gap-6">
        <div className="p-4 bg-white/20 rounded-2xl">
          <TrendingUp size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold">Rise to the Top</h3>
          <p className="text-indigo-100 text-sm leading-relaxed mt-1 italic">
            "The highest souls won and followed up in the week will lead the team into phase 2 of growth for greater multiplication."
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ user: User, records: SoulRecord[], onSignOut: () => void }> = ({ user, records, onSignOut }) => {
  const userRecords = records.filter(r => r.userId === user.id);
  const established = userRecords.filter(r => r.status === 'established').length;

  return (
    <div className="max-w-md mx-auto py-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center">
        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
          <UserIcon size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-sm text-slate-400 mb-8">Member since {new Date(user.joinedAt).toLocaleDateString()}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-2xl font-black text-indigo-600">{userRecords.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Souls</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-2xl font-black text-green-600">{established}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Established</p>
          </div>
        </div>

        <button 
          onClick={onSignOut}
          className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </div>
  );
};

const HomeView: React.FC<{ setView: (view: ViewState) => void, stats: { souls: number, following: number, dueFollowUps: number }, user: User, leaderboard: LeaderboardEntry[] }> = ({ setView, stats, user, leaderboard }) => {
  const topRank = leaderboard.findIndex(e => e.userId === user.id) + 1;
  const isWinner = topRank === 1 && leaderboard[0].soulCount > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="relative overflow-hidden rounded-3xl bg-indigo-700 p-8 text-white shadow-xl shadow-indigo-100">
        <div className="relative z-10 max-w-lg">
          <p className="text-indigo-200 font-bold mb-2 uppercase tracking-widest text-xs">Welcome back, {user.name}</p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 italic">
            Voice Crying Outreach Mandate
          </h1>
          <p className="text-indigo-100 text-lg mb-6 leading-relaxed">
            "Go ye into all the world, and preach the gospel to every creature."
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setView('outreach')}
              className="bg-white text-indigo-700 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Start Outreach <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
          <ShieldCheck size={300} />
        </div>
      </header>

      {/* Harvest Tree Section */}
      <section className="relative h-64 md:h-80 w-full overflow-hidden rounded-3xl shadow-lg border border-slate-200">
        <img 
          src="https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&q=80&w=1200" 
          alt="Ripe fruits on a tree ready for harvest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-1 italic">The Harvest is Ripe</h2>
          <p className="text-indigo-100 text-sm md:text-base italic font-medium">"The harvest truly is plenteous, but the labourers are few." — Matthew 9:37</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-xl">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Your Souls</p>
            <p className="text-3xl font-bold text-slate-800">{stats.souls}</p>
          </div>
        </div>
        
        <div 
          onClick={() => setView('leaderboard')}
          className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
            isWinner ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'
          }`}
        >
          <div className={`p-4 rounded-xl ${isWinner ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
            <Medal className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Week Rank</p>
            <p className="text-3xl font-bold text-slate-800">#{topRank}</p>
          </div>
        </div>

        <div 
          onClick={() => setView('outreach')}
          className={`p-6 rounded-2xl border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${
            stats.dueFollowUps > 0 
            ? 'bg-red-50 border-red-100 hover:bg-red-100' 
            : 'bg-green-50 border-green-100'
          }`}
        >
          <div className={`p-4 rounded-xl ${stats.dueFollowUps > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
            <Bell className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm">Follow-ups</p>
            <p className="text-3xl font-bold text-slate-800">{stats.dueFollowUps}</p>
          </div>
        </div>
        
        <div 
          onClick={() => setView('ai-mentor')}
          className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-indigo-100 transition-colors"
        >
          <div className="p-4 bg-indigo-600 rounded-xl">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-indigo-800 font-semibold">AI Mentor</p>
            <p className="text-indigo-600 text-[10px]">Soul-winning AI</p>
          </div>
          <ChevronRight className="text-indigo-300 w-4 h-4" />
        </div>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-slate-100">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 italic">The Mandate</h2>
        <p className="text-slate-600 leading-relaxed italic mb-6">
          "{VCOM_MANDATE.about}"
        </p>
        <div className="flex items-center justify-end">
          <button 
            onClick={() => setView('mandate')}
            className="text-indigo-600 font-semibold flex items-center gap-2 hover:underline"
          >
            Read Full Mandate <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

const OutreachView: React.FC<{ 
  records: SoulRecord[], 
  onAdd: (r: Omit<SoulRecord, 'id' | 'userId'>) => void,
  onDelete: (id: string) => void,
  onUpdateStatus: (id: string, status: SoulRecord['status']) => void,
  user: User
}> = ({ records, onAdd, onDelete, onUpdateStatus, user }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    churchRecommended: '',
    followUpDays: 7,
    notes: ''
  });

  const userRecords = useMemo(() => records.filter(r => r.userId === user.id), [records, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...formData,
      datePreached: new Date().toISOString().split('T')[0],
      status: 'new'
    });
    setFormData({ name: '', phone: '', location: '', churchRecommended: '', followUpDays: 7, notes: '' });
    setShowForm(false);
  };

  const inputClasses = "w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-400";

  const isDueForFollowUp = (record: SoulRecord) => {
    const preachedDate = new Date(record.datePreached);
    const dueDate = new Date(preachedDate);
    dueDate.setDate(dueDate.getDate() + record.followUpDays);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today >= dueDate && record.status !== 'established';
  };

  const sortedRecords = useMemo(() => {
    return [...userRecords].sort((a, b) => {
      const aDue = isDueForFollowUp(a);
      const bDue = isDueForFollowUp(b);
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return new Date(b.datePreached).getTime() - new Date(a.datePreached).getTime();
    });
  }, [userRecords]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Harvest Log</h2>
          <p className="text-sm text-slate-500">Managing the souls you've reached.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          {showForm ? 'Cancel' : <><Plus className="w-5 h-5" /> New Record</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 p-6 rounded-3xl border border-indigo-900 shadow-2xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Soul's Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className={inputClasses} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number</label>
              <input 
                required
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className={inputClasses} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className={inputClasses} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Church Recommended</label>
              <input 
                type="text" 
                value={formData.churchRecommended}
                onChange={e => setFormData({...formData, churchRecommended: e.target.value})}
                className={inputClasses} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Follow-up Reminder (Days after)</label>
              <input 
                type="number" 
                value={formData.followUpDays}
                onChange={e => setFormData({...formData, followUpDays: parseInt(e.target.value) || 0})}
                className={inputClasses} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Initial Contact Notes</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className={`${inputClasses} h-24`}
              placeholder="How did the interaction go?"
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">
            Register Soul
          </button>
        </form>
      )}

      <div className="space-y-4">
        {sortedRecords.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No records yet. Your name is waiting to be on the leaderboard!</p>
          </div>
        ) : (
          sortedRecords.map(record => {
            const due = isDueForFollowUp(record);
            return (
              <div key={record.id} className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${due ? 'border-red-200 bg-red-50/30 ring-2 ring-red-100' : 'border-slate-100'}`}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-slate-800 italic">{record.name}</h3>
                    {due && (
                      <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        <Bell size={10} /> FOLLOW UP DUE
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-indigo-400" /> Preached: {record.datePreached}</span>
                    <select 
                      value={record.status} 
                      onChange={(e) => onUpdateStatus(record.id, e.target.value as SoulRecord['status'])}
                      className={`px-2 py-0.5 rounded uppercase border-none cursor-pointer text-[10px] font-bold ${
                        record.status === 'new' ? 'bg-indigo-50 text-indigo-600' : 
                        record.status === 'following' ? 'bg-amber-50 text-amber-600' : 
                        'bg-green-50 text-green-600'
                      }`}
                    >
                      <option value="new">New</option>
                      <option value="following">Following Up</option>
                      <option value="established">Established</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-600 italic">"{record.notes || 'No notes added'}"</p>
                  <div className="text-xs text-slate-400 font-medium">
                    📍 {record.location || 'Location not specified'} • ⛪ {record.churchRecommended || 'No church assigned'}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{record.phone}</p>
                    <a href={`tel:${record.phone}`} className="text-[10px] text-indigo-600 hover:underline">Call now</a>
                  </div>
                  <button 
                    onClick={() => onDelete(record.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vcom_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vcom_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<ViewState>('home');
  const [records, setRecords] = useState<SoulRecord[]>(() => {
    const saved = localStorage.getItem('vcom_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vcom_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('vcom_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('vcom_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const handleLogin = (name: string) => {
    let user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
    if (!user) {
      user = { id: crypto.randomUUID(), name, joinedAt: new Date().toISOString() };
      setUsers([...users, user]);
    }
    setCurrentUser(user);
    setView('home');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setView('home');
  };

  const addRecord = (newRecord: Omit<SoulRecord, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const record: SoulRecord = {
      ...newRecord,
      userId: currentUser.id,
      id: crypto.randomUUID()
    };
    setRecords([record, ...records]);
    setView('outreach');
  };

  const deleteRecord = (id: string) => {
    if (confirm('Are you sure you want to remove this record?')) {
      setRecords(records.filter(r => r.id !== id));
    }
  };

  const updateRecordStatus = (id: string, status: SoulRecord['status']) => {
    setRecords(records.map(r => r.id === id ? { ...r, status } : r));
  };

  const stats = useMemo(() => {
    if (!currentUser) return { souls: 0, following: 0, dueFollowUps: 0 };
    
    const userRecords = records.filter(r => r.userId === currentUser.id);
    const souls = userRecords.length;
    const following = userRecords.filter(r => r.status === 'following').length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueFollowUps = userRecords.filter(record => {
      const preachedDate = new Date(record.datePreached);
      const dueDate = new Date(preachedDate);
      dueDate.setDate(dueDate.getDate() + record.followUpDays);
      return today >= dueDate && record.status !== 'established';
    }).length;

    return { souls, following, dueFollowUps };
  }, [records, currentUser]);

  const weeklyLeaderboard = useMemo(() => {
    const currentWeekKey = getWeekKey(new Date());
    const weeklyRecords = records.filter(r => getWeekKey(new Date(r.datePreached)) === currentWeekKey);
    const userMap = new Map<string, number>();
    weeklyRecords.forEach(r => userMap.set(r.userId, (userMap.get(r.userId) || 0) + 1));
    return users.map(u => ({
      userId: u.id,
      userName: u.name,
      soulCount: userMap.get(u.id) || 0
    })).sort((a, b) => b.soulCount - a.soulCount);
  }, [records, users]);

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-0 md:pt-16">
      <Navbar currentView={view} setView={setView} user={currentUser} />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {view === 'home' && <HomeView setView={setView} stats={stats} user={currentUser} leaderboard={weeklyLeaderboard} />}
        {view === 'mandate' && <MandateView />}
        {view === 'outreach' && (
          <OutreachView 
            records={records} 
            onAdd={addRecord} 
            onDelete={deleteRecord} 
            onUpdateStatus={updateRecordStatus}
            user={currentUser}
          />
        )}
        {view === 'leaderboard' && <LeaderboardView records={records} users={users} />}
        {view === 'training' && <TrainingView />}
        {view === 'ai-mentor' && <AiMentorView />}
        {view === 'profile' && <ProfileView user={currentUser} records={records} onSignOut={handleSignOut} />}
      </main>
    </div>
  );
};

// Re-import existing views that weren't changed to satisfy full content requirement
// (Note: MandateView, TrainingView, AiMentorView are assumed as per previous files provided)
// ... Rest of component code from App.tsx in previous messages for completeness ...

const MandateView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-2 italic">VCOM Mandate</h1>
        <p className="text-indigo-600 font-medium">Under the leadership of {VCOM_VISIONARY}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-indigo-800 border-l-4 border-indigo-500 pl-4">Vision & Mission</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
          <p className="text-xl font-medium text-slate-700 mb-6 italic">"{VCOM_MANDATE.vision}"</p>
          <ul className="space-y-4">
            {VCOM_MANDATE.mission.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-slate-600">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl font-bold text-indigo-800 border-l-4 border-indigo-500 pl-4">Introduction to Evangelism</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50 space-y-4 text-slate-600 leading-relaxed">
          <p>{VCOM_MANDATE.introduction.definition}</p>
          <p>{VCOM_MANDATE.introduction.context}</p>
          <p>{VCOM_MANDATE.introduction.purpose}</p>
          <blockquote className="border-l-4 border-amber-300 pl-4 italic text-slate-500 font-serif bible-quote">
            {VCOM_MANDATE.introduction.scripture}
          </blockquote>
          <div className="pt-4">
            <h3 className="font-bold text-slate-800 mb-3 italic">Various Forms of Practice:</h3>
            <div className="flex flex-wrap gap-2">
              {VCOM_MANDATE.forms.map((form, idx) => (
                <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                  {form}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-indigo-800 border-l-4 border-indigo-500 pl-4 italic">Benefits of Evangelism</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VCOM_MANDATE.benefits.map((benefit, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <span className="text-indigo-400 font-bold mb-2 block">{idx + 1}.</span>
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors italic">
                {benefit.title}
              </h3>
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">{benefit.description}</p>
              <p className="text-xs text-indigo-500 italic bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-serif">
                {benefit.scripture}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-12 text-slate-400 text-sm italic">
        Adapted from JETS Jesus End Time Soul Winners
      </footer>
    </div>
  );
};

const TrainingView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
      <header className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold text-slate-800 italic">Preparation & Modalities</h2>
        <p className="text-slate-500 max-w-xl mx-auto">Equipping you for the harvest field with the right mindset and strategy under the VCOM visionary leadership.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-2xl font-bold text-indigo-700 flex items-center gap-2 italic">
            <ShieldCheck className="w-6 h-6" /> Guidelines
          </h3>
          <ul className="space-y-4">
            {VCOM_MANDATE.modalities.map((item, idx) => (
              <li key={idx} className="flex gap-4 items-start">
                <span className="mt-1 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-slate-600 leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-2 italic">
            <GraduationCap className="w-6 h-6" /> Preparation
          </h3>
          <p className="text-indigo-50 text-lg leading-relaxed italic">
            "{VCOM_MANDATE.preparation}"
          </p>
          <div className="bg-indigo-500/30 p-4 rounded-xl border border-indigo-400/30">
            <h4 className="font-bold mb-2 uppercase text-xs tracking-widest">Long-term Objective:</h4>
            <p className="text-sm text-indigo-100">
              {VCOM_MANDATE.objective}
            </p>
          </div>
        </section>
      </div>

      <section className="bg-amber-50 border border-amber-100 p-8 rounded-3xl">
        <h3 className="text-2xl font-bold text-amber-800 mb-4 italic">The Heart of a Soul Winner</h3>
        <p className="text-amber-900/70 leading-relaxed italic">
          Evangelism is not just a duty; it's an overflow of God's love in our hearts. As you prepare, remember that you are a co-worker with Christ, continuing the work He started on Earth.
        </p>
      </section>
    </div>
  );
};

const AiMentorView: React.FC = () => {
  const [messages, setMessages] = useState<(ChatMessage & { sources?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    let fullResponse: ChatResponse = { text: "" };
    
    await geminiService.sendMessageStream(userMsg, (update) => {
      fullResponse = update;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'model') {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: update.text, sources: update.sources };
          return newMsgs;
        } else {
          return [...prev, { role: 'model', text: update.text, sources: update.sources }];
        }
      });
    });
    
    setIsTyping(false);
  };

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
      <header className="bg-indigo-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold italic">VCOM AI Mentor</h3>
            <p className="text-[10px] text-indigo-100 italic">Visionary Leadership Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-[10px] font-bold">
          <Info size={12} /> SEARCH ACTIVE
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <ShieldCheck className="w-12 h-12 text-indigo-200 mx-auto" />
            <div className="space-y-2">
              <p className="text-slate-500 font-medium italic">Welcome to the Outreach Mentorship.</p>
              <p className="text-slate-400 text-sm px-8 italic">"How can I help you fulfill the VCOM mandate today?"</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center px-4">
               {["Recent soul-winning news", "Bible verses for healing", "How to preach to youth?"].map(hint => (
                 <button 
                  key={hint} 
                  onClick={() => setInput(hint)}
                  className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-600 hover:border-indigo-400 shadow-sm"
                 >
                   {hint}
                 </button>
               ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
            }`}>
              {msg.text}
              
              {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase">
                    <ExternalLink size={10} /> Sources Found
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[10px] bg-slate-50 hover:bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-slate-100 flex items-center gap-1 transition-colors"
                      >
                        {s.title || 'Source'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span className="text-xs text-slate-400">Mentor is searching and thinking...</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything about evangelism..."
          className="flex-1 bg-indigo-600 text-white placeholder:text-indigo-200 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
        />
        <button 
          disabled={!input.trim() || isTyping}
          type="submit" 
          className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default App;
