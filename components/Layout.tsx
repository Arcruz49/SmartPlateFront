
import React from 'react';
import { LogOut, Home, User, PlusCircle, PieChart, BarChart3, Menu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string } | null;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  return (
    <div className="h-screen flex bg-black text-white overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-[280px] bg-black p-2 gap-2">
        {/* Top Block: Logo & Nav */}
        <div className="bg-[#121212] rounded-lg p-6 flex flex-col gap-6">
          <h1 className="text-xl font-bold flex items-center gap-2 text-white tracking-tight">
            <div className="bg-white text-black p-1 rounded-full">
              <PieChart size={20} fill="currentColor" strokeWidth={0} />
            </div>
            SmartPlate
          </h1>
          
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<Home size={24} />} 
              label="Home" 
            />
            <NavItem 
              active={activeTab === 'metrics'} 
              onClick={() => setActiveTab('metrics')} 
              icon={<BarChart3 size={24} />} 
              label="Analytics" 
            />
            <NavItem 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
              icon={<User size={24} />} 
              label="Profile" 
            />
          </nav>
        </div>

        {/* Bottom Block: Actions (Simulating Playlist/Library Area) */}
        <div className="bg-[#121212] rounded-lg flex-1 p-4 flex flex-col">
          <div className="flex items-center justify-between text-[#a7a7a7] font-bold mb-4 px-2">
            <span className="flex items-center gap-2"><Menu size={24} /> Your Library</span>
            <PlusCircle size={20} className="hover:text-white transition-colors cursor-pointer" onClick={() => setActiveTab('meals')} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
             {/* Action Card */}
             <div 
               onClick={() => setActiveTab('meals')}
               className="bg-[#242424] p-4 rounded-lg cursor-pointer hover:bg-[#2a2a2a] transition-colors group"
             >
               <p className="font-bold text-white mb-1">Log a meal</p>
               <p className="text-sm text-[#a7a7a7] mb-3">Keep track of your macros effortlessly.</p>
               <span className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold scale-95 group-hover:scale-100 transition-transform inline-block">
                 Log now
               </span>
             </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#282828]">
             <button 
               onClick={onLogout}
               className="flex items-center gap-3 text-[#a7a7a7] hover:text-white transition-colors text-sm font-bold px-2"
             >
               <LogOut size={20} /> Logout
             </button>
             <div className="mt-4 px-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center text-black font-bold text-xs">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-bold text-white">{user?.name}</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 m-2 bg-[#121212] rounded-lg overflow-y-auto relative scroll-smooth custom-scrollbar">
        {/* Ambient Gradient Background */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#1e4030] to-[#121212] pointer-events-none opacity-60" />
        
        <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto pb-32 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-10 pb-4 px-4 z-50 flex justify-around items-end">
        <div className="bg-[#121212] w-full border border-[#282828] rounded-2xl flex justify-around p-3 backdrop-blur-md bg-opacity-95">
          <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={24} />} />
          <MobileNavItem active={activeTab === 'meals'} onClick={() => setActiveTab('meals')} icon={<PlusCircle size={24} />} />
          <MobileNavItem active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} icon={<BarChart3 size={24} />} />
          <MobileNavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={24} />} />
        </div>
      </nav>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group ${active ? 'text-white' : 'text-[#a7a7a7] hover:text-white'}`}
  >
    <span className={`transition-colors ${active ? 'text-white' : 'text-[#a7a7a7] group-hover:text-white'}`}>
      {React.cloneElement(icon, { 
        fill: active ? "currentColor" : "none",
        strokeWidth: active ? 0 : 2
      })}
    </span>
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon }: any) => (
  <button 
    onClick={onClick}
    className={`p-3 rounded-full transition-all ${active ? 'text-white bg-[#1ed760]/20' : 'text-[#a7a7a7]'}`}
  >
    {React.cloneElement(icon, { 
      fill: active ? "currentColor" : "none", 
      className: active ? "text-[#1ed760]" : "text-[#a7a7a7]"
    })}
  </button>
);

export default Layout;
