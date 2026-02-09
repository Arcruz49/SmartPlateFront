
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import MealLogger from './components/MealLogger';
import Profile from './components/Profile';
import HistoryMetrics from './components/HistoryMetrics';
import { AuthResponse } from './types';
import { api } from './services/api';
import { PieChart, Loader2, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-black flex flex-col text-white font-sans">
        {/* Header */}
        <div className="p-8 pb-4 flex items-center gap-2">
            <div className="bg-white text-black p-1 rounded-full">
               <PieChart size={24} fill="currentColor" strokeWidth={0} />
            </div>
            <span className="text-2xl font-bold tracking-tighter">SmartPlate</span>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-[450px] bg-[#121212] rounded-lg p-8 md:p-14 flex flex-col items-center">
            
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-center mb-10">
               {isLogin ? 'Log in to SmartPlate' : 'Sign up for free'}
            </h1>

            {error && (
              <div className="w-full mb-6 p-3 bg-[#e91429] text-white text-sm font-medium rounded-md flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="w-full space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-sm font-bold">What's your name?</label>
                  <input 
                    type="text" 
                    placeholder="Enter your profile name" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="spotify-input" 
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-bold">Email address</label>
                <input 
                  type="email" 
                  placeholder="name@domain.com" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="spotify-input" 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold">Password</label>
                <input 
                  type="password" 
                  placeholder="Password" 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="spotify-input" 
                />
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-3.5 bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 active:scale-100 transition-all text-black font-bold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 text-base tracking-wide"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    isLogin ? 'Log In' : 'Sign Up'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-[#292929] pt-8 w-full text-center">
              <p className="text-[#a7a7a7] font-medium mb-4">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }} 
                className="text-white hover:text-[#1ed760] font-bold text-sm uppercase tracking-widest transition-colors"
              >
                {isLogin ? 'Sign up for SmartPlate' : 'Log in'}
              </button>
            </div>
          </div>
        </div>
        <style>{`
          .spotify-input {
            width: 100%;
            padding: 0.875rem 1rem;
            background: #121212;
            border: 1px solid #727272;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            outline: none;
            transition: all 0.2s;
          }
          .spotify-input:focus {
            border-color: white;
            box-shadow: 0 0 0 1px white;
          }
          .spotify-input:hover:not(:focus) {
            border-color: #a7a7a7;
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
