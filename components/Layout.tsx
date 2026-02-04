
import React from 'react';
import { LogOut, Home, User, PlusCircle, PieChart, BarChart3 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string } | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-slate-900">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
            <PieChart size={28} />
            SmartPlate
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Home size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('meals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'meals' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <PlusCircle size={20} /> Log Meal
          </button>
          <button 
            onClick={() => setActiveTab('metrics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'metrics' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart3 size={20} /> Metrics
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <User size={20} /> Profile
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex flex-col mb-4">
            <span className="text-[10px] uppercase font-black text-slate-300 tracking-widest mb-1">User</span>
            <span className="text-sm font-bold text-slate-700 truncate">Welcome, {user?.name}</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50">
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 transition-colors ${activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <Home size={24} />
        </button>
        <button onClick={() => setActiveTab('meals')} className={`p-2 transition-colors ${activeTab === 'meals' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <PlusCircle size={24} />
        </button>
        <button onClick={() => setActiveTab('metrics')} className={`p-2 transition-colors ${activeTab === 'metrics' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <BarChart3 size={24} />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`p-2 transition-colors ${activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-400'}`}>
          <User size={24} />
        </button>
      </nav>
    </div>
  );
};

export default Layout;
