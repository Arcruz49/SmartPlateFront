
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import Profile from './components/Profile';
import HistoryMetrics from './components/HistoryMetrics';
import { AuthResponse } from './types';
import { api } from './services/api';
import { PieChart, Loader2, Apple, CheckCircle2, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('sp_auth');
    if (savedAuth) {
      try {
        setAuth(JSON.parse(savedAuth));
      } catch (e) {
        localStorage.removeItem('sp_auth');
      }
    }
  }, []);

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('sp_auth');
    setActiveTab('dashboard');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isLogin) {
        response = await api.auth.login({ email, password });
      } else {
        response = await api.auth.register({ name, email, password });
      }
      setAuth(response);
      localStorage.setItem('sp_auth', JSON.stringify(response));
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-[#f0f9f4] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-200/30 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white/80 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/40 animate-in fade-in zoom-in-95 duration-700 relative z-10">
          
          {/* Left Side: Branding & Info (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <PieChart size={32} />
                </div>
                <span className="text-2xl font-black tracking-tight">SmartPlate</span>
              </div>
              
              <h1 className="text-5xl font-black leading-tight mb-6">
                Elevate your <br />
                <span className="text-lime-300">nutrition</span> with AI.
              </h1>
              
              <div className="space-y-6 text-emerald-50">
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-lg mt-1"><Sparkles size={20} /></div>
                  <div>
                    <p className="font-bold text-lg">AI Meal Analysis</p>
                    <p className="text-sm opacity-80">Just snap a photo and let our AI calculate your calories and macros.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-lg mt-1"><CheckCircle2 size={20} /></div>
                  <div>
                    <p className="font-bold text-lg">Personalized Targets</p>
                    <p className="text-sm opacity-80">Nutritional goals based on your specific biometrics and routine.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-lg mt-1"><ShieldCheck size={20} /></div>
                  <div>
                    <p className="font-bold text-lg">Privacy First</p>
                    <p className="text-sm opacity-80">Your health data is secure and used only to improve your journey.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="p-8 md:p-14 lg:p-16 flex flex-col justify-center">
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <div className="bg-emerald-600 p-2 rounded-xl text-white">
                <PieChart size={24} />
              </div>
              <span className="text-xl font-black text-slate-800">SmartPlate</span>
            </div>

            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-800 mb-2">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-slate-500 font-medium">
                {isLogin ? 'Log in to your account to continue' : 'Start your healthy journey with us today'}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 animate-in shake duration-500">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      className="auth-input pl-5" 
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="auth-input pl-5" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="auth-input pl-5" 
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 text-lg py-4"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Join Now'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100 text-center">
              <p className="text-slate-400 font-bold mb-4">
                {isLogin ? "Don't have an account yet?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }} 
                className="text-emerald-600 font-black text-sm uppercase tracking-widest hover:text-emerald-700 transition-colors inline-flex items-center gap-2 group"
              >
                {isLogin ? 'Create a new account' : 'Sign in to existing account'}
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .auth-input { 
            width: 100%; 
            padding: 1rem 1.25rem; 
            background: #f8fafc; 
            border: 2px solid #f1f5f9; 
            border-radius: 1.25rem; 
            outline: none; 
            font-weight: 600; 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
            color: #1e293b;
          }
          .auth-input:focus { 
            border-color: #10b981; 
            background: #fff; 
            box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1); 
          }
          .auth-input::placeholder {
            color: #cbd5e1;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <Layout user={auth} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard 
          token={auth.token} 
          onLogout={handleLogout} 
          onRedirectToProfile={() => setActiveTab('profile')}
        />
      )}
      {activeTab === 'meals' && <MealLogger token={auth.token} onSuccess={() => setActiveTab('dashboard')} onLogout={handleLogout} />}
      {activeTab === 'metrics' && <HistoryMetrics token={auth.token} />}
      {activeTab === 'profile' && <Profile token={auth.token} onLogout={handleLogout} />}
    </Layout>
  );
};

export default App;
