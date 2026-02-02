
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-emerald-600 text-white">
            <PieChart size={48} className="mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold">SmartPlate</h1>
            <p className="opacity-80">AI Nutrition Assistant</p>
          </div>
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6">{isLogin ? 'Log In' : 'Create Account'}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && <input type="text" placeholder="Name" required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl border" />}
              <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 rounded-xl border" />
              <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl border" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg disabled:opacity-50">
                {loading ? 'Wait...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>
            <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-emerald-600 font-bold hover:underline">
              {isLogin ? "Join us today" : "Have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={auth} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* Fix: removed onLogout as it is not present in DashboardProps */}
      {activeTab === 'dashboard' && <Dashboard token={auth.token} />}
      {/* Fix: removed onLogout as it is not present in MealLoggerProps */}
      {activeTab === 'meals' && <MealLogger token={auth.token} onSuccess={() => setActiveTab('dashboard')} />}
      {activeTab === 'profile' && <Profile token={auth.token} onLogout={handleLogout} />}
    </Layout>
  );
};

export default App;
