
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { TrendingUp, BarChart3, Loader2, Zap, Flame, Target, Scale, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { DailyMetrics, BodyMetrics } from '../types';

interface HistoryMetricsProps {
  token: string;
}

const HistoryMetrics: React.FC<HistoryMetricsProps> = ({ token }) => {
  const [metrics, setMetrics] = useState<DailyMetrics[]>([]);
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics[]>([]);
  const [range, setRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllMetrics = async () => {
      setLoading(true);
      try {
        const [mealData, bodyData] = await Promise.all([
          api.metrics.getMealMetrics(token, range),
          api.metrics.getBodyMetrics(token)
        ]);
        
        const sortedMeal = mealData.sort((a, b) => new Date(a.meal_date).getTime() - new Date(b.meal_date).getTime());
        setMetrics(sortedMeal);

        const sortedBody = bodyData.sort((a, b) => new Date(a.metricDate).getTime() - new Date(b.metricDate).getTime());
        setBodyMetrics(sortedBody);
      } catch (err) {
        console.error("Failed to fetch metrics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllMetrics();
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

  const currentWeight = bodyMetrics.length > 0 ? bodyMetrics[bodyMetrics.length - 1].weightKg : null;
  const weightDiff = bodyMetrics.length > 1 ? (bodyMetrics[bodyMetrics.length - 1].weightKg - bodyMetrics[0].weightKg).toFixed(1) : '0';

  if (loading && metrics.length === 0) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-[#a7a7a7]">
      <Loader2 size={40} className="text-[#1ed760] animate-spin mb-4" />
      <p className="font-bold text-xs uppercase tracking-widest">Crunching Numbers</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#282828] pb-6">
        <div>
           <span className="text-xs font-bold text-[#1ed760] uppercase tracking-widest">Analytics</span>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Trends</h1>
        </div>

        <div className="bg-[#242424] p-1 rounded-full flex">
          <button 
            onClick={() => setRange('week')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${range === 'week' ? 'bg-[#3e3e3e] text-white' : 'text-[#a7a7a7] hover:text-white'}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => setRange('month')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${range === 'month' ? 'bg-[#3e3e3e] text-white' : 'text-[#a7a7a7] hover:text-white'}`}
          >
            Last 30 Days
          </button>
        </div>
      </header>

      {metrics.length === 0 && bodyMetrics.length === 0 ? (
        <div className="bg-[#181818] p-20 rounded-lg text-center text-[#a7a7a7]">
          <BarChart3 size={64} className="mx-auto mb-6 opacity-20" />
          <p className="text-xl font-bold text-white mb-2">No Data Yet</p>
          <p className="text-sm">Log some meals to see your stats visualised here.</p>
        </div>
      ) : (
        <>
          {/* Stats Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatBox label="Avg. Calories" value={averages?.calories} unit="kcal" />
            <StatBox label="Avg. Protein" value={averages?.protein} unit="g" />
            <StatBox label="Avg. Carbs" value={averages?.carbs} unit="g" />
            <StatBox label="Current Weight" value={currentWeight} unit="kg" />
            <StatBox label="Trend" value={weightDiff} unit="kg" colored={true} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calories Area Chart */}
            <div className="bg-[#181818] p-6 rounded-lg border border-[#282828]">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                 <Flame size={18} className="text-[#1ed760]" /> Caloric Intake
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics}>
                    <defs>
                      <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1ed760" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1ed760" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis 
                      dataKey="meal_date" 
                      tickFormatter={formatDateLabel} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#282828', borderRadius: '8px', border: 'none', color: 'white'}}
                      itemStyle={{color: '#1ed760'}}
                      labelStyle={{color: '#a7a7a7', fontWeight: 'bold'}}
                      labelFormatter={formatDateLabel}
                    />
                    <Area type="monotone" dataKey="calories_total" name="Calories" stroke="#1ed760" strokeWidth={2} fillOpacity={1} fill="url(#colorCal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weight Line Chart */}
            <div className="bg-[#181818] p-6 rounded-lg border border-[#282828]">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                 <Scale size={18} className="text-[#1ed760]" /> Weight Trend
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bodyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis 
                      dataKey="metricDate" 
                      tickFormatter={formatDateLabel} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#282828', borderRadius: '8px', border: 'none', color: 'white'}}
                      itemStyle={{color: '#1ed760'}}
                      labelStyle={{color: '#a7a7a7', fontWeight: 'bold'}}
                      labelFormatter={formatDateLabel}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weightKg" 
                      name="Weight" 
                      stroke="#fff" 
                      strokeWidth={2} 
                      dot={{ r: 4, fill: '#1ed760', strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: '#fff' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Macros Bar Chart */}
            <div className="bg-[#181818] p-6 rounded-lg border border-[#282828] lg:col-span-2">
              <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                 <Zap size={18} className="text-[#1ed760]" /> Macronutrient Balance
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis 
                      dataKey="meal_date" 
                      tickFormatter={formatDateLabel} 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{fill: '#a7a7a7', fontSize: 10, fontWeight: 700}}
                    />
                    <Tooltip 
                      cursor={{fill: '#282828', opacity: 0.5}}
                      contentStyle={{backgroundColor: '#282828', borderRadius: '8px', border: 'none', color: 'white'}}
                      labelStyle={{color: '#a7a7a7', fontWeight: 'bold'}}
                      labelFormatter={formatDateLabel}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="protein_g_total" name="Protein" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="carbs_g_total" name="Carbs" stackId="a" fill="#a855f7" />
                    <Bar dataKey="fat_g_total" name="Fat" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
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

const StatBox = ({ label, value, unit, colored }: any) => {
    let colorClass = "text-white";
    if (colored) {
        const num = parseFloat(value);
        if (num > 0) colorClass = "text-[#e91429]";
        if (num < 0) colorClass = "text-[#1ed760]";
    }

    return (
        <div className="bg-[#181818] p-4 rounded-lg border border-[#282828] flex flex-col items-center justify-center hover:bg-[#282828] transition-colors">
            <span className={`text-2xl font-bold ${colorClass}`}>{value || 0}</span>
            <span className="text-[10px] text-[#a7a7a7] uppercase font-bold mt-1">{label} ({unit})</span>
        </div>
    );
};

export default HistoryMetrics;
