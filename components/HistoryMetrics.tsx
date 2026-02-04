
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell 
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, Loader2, Zap, Flame, Target, Info } from 'lucide-react';
import { api } from '../services/api';
import { DailyMetrics } from '../types';

interface HistoryMetricsProps {
  token: string;
}

const HistoryMetrics: React.FC<HistoryMetricsProps> = ({ token }) => {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const data = await api.metrics.getMealMetrics(token, range);
        // Sort by date just in case
        const sorted = data.sort((a, b) => new Date(a.meal_date).getTime() - new Date(b.meal_date).getTime());
        setMetrics(sorted);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [token, range]);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const averages = metrics.length > 0 ? {
    calories: Math.round(metrics.reduce((acc, m) => acc + m.calories_total, 0) / metrics.length),
    protein: Math.round(metrics.reduce((acc, m) => acc + m.protein_g_total, 0) / metrics.length),
    carbs: Math.round(metrics.reduce((acc, m) => acc + m.carbs_g_total, 0) / metrics.length),
    fat: Math.round(metrics.reduce((acc, m) => acc + m.fat_g_total, 0) / metrics.length),
  } : null;

  if (loading && metrics.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
      <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
      <p className="font-medium">Synthesizing history data...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <BarChart3 size={32} />
            </div>
            Analytics
          </h2>
          <p className="text-slate-500 font-medium mt-1">Track your progress and nutritional trends.</p>
        </div>

        <div className="flex p-1 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
          <button 
            onClick={() => setRange('week')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${range === 'week' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setRange('month')}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${range === 'month' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Monthly
          </button>
        </div>
      </header>

      {metrics.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center text-slate-300">
          <TrendingUp size={64} className="mx-auto mb-6 opacity-20" />
          <p className="text-xl font-black mb-2 text-slate-400">Insufficent Data</p>
          <p className="text-sm font-medium">Log meals for a few more days to see trends.</p>
        </div>
      ) : (
        <>
          {/* Average Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricSummaryCard label="Avg. Calories" value={`${averages?.calories}`} unit="kcal" icon={<Flame className="text-orange-500" />} />
            <MetricSummaryCard label="Avg. Protein" value={`${averages?.protein}`} unit="g" icon={<Target className="text-blue-500" />} />
            <MetricSummaryCard label="Avg. Carbs" value={`${averages?.carbs}`} unit="g" icon={<Zap className="text-purple-500" />} />
            <MetricSummaryCard label="Avg. Fat" value={`${averages?.fat}`} unit="g" icon={<Info className="text-emerald-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calories Trend */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                <Flame size={18} className="text-orange-500" />
                Caloric Intake Trend
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="meal_date" 
                      tickFormatter={formatDateLabel} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                      labelFormatter={formatDateLabel}
                    />
                    <Area type="monotone" dataKey="calories_total" name="Calories" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macros Stacked Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                <Zap size={18} className="text-purple-500" />
                Macronutrient Balance
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="meal_date" 
                      tickFormatter={formatDateLabel} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      contentStyle={{borderRadius: '1.25rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontWeight: 'bold'}}
                      labelFormatter={formatDateLabel}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                    <Bar dataKey="protein_g_total" name="Protein" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="carbs_g_total" name="Carbs" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="fat_g_total" name="Fat" stackId="a" fill="#10b981" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const MetricSummaryCard = ({ label, value, unit, icon }: { label: string, value: string, unit: string, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-2xl shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{label}</p>
      <p className="text-xl font-black text-slate-800 leading-tight truncate">
        {value} <span className="text-xs font-bold text-slate-400">{unit}</span>
      </p>
    </div>
  </div>
);

export default HistoryMetrics;
