
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import Profile from './components/Profile';
import { AuthResponse } from './types';
import { api } from './services/api';
import { PieChart, LogIn, UserPlus, ShieldCheck } from 'lucide-react';

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

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('sp_auth');
  };

  if (!auth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-emerald-600 text-white">
            <div className="inline-flex p-3 bg-white/20 rounded-2xl mb-4">
              <PieChart size={48} />
            </div>
            <h1 className="text-3xl font-extrabold">SmartPlate</h1>
            <p className="text-emerald-100">Your AI-Powered Healthy Journey</p>
          </div>
          
          <div className="p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              {isLogin ? <LogIn /> : <UserPlus />}
              {isLogin ? 'Welcome Back' : 'Join SmartPlate'}
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <ShieldCheck size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-emerald-600 font-semibold hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-8 text-slate-400 text-sm font-medium">© 2024 SmartPlate Nutrition Systems</p>
      </div>
    );
  }

  return (
    <Layout 
      user={auth} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {activeTab === 'dashboard' && <Dashboard token={auth.token} />}
      {activeTab === 'meals' && (
        <MealLogger 
          token={auth.token} 
          onSuccess={() => setActiveTab('dashboard')} 
        />
      )}
      {activeTab === 'profile' && <Profile token={auth.token} />}
    </Layout>
  );
};

export default App;
