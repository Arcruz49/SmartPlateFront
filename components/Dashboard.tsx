
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Zap, Target, Coffee, Flame } from 'lucide-react';
import { api } from '../services/api';
import { UserInsights, Meal } from '../types';

interface DashboardProps {
  token: string;
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const [userInsights, dailyMeals] = await Promise.all([
          api.insights.get(token).catch(() => api.insights.generate(token)),
          api.meals.getForDate(token, dateStr)
        ]);
        setInsights(userInsights);
        setMeals(dailyMeals);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-pulse">
      <Zap size={48} className="mb-4 text-emerald-500" />
      <p className="text-lg">Calculating your daily stats...</p>
    </div>
  );

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein_g, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs_g, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat_g, 0);

  const caloriePercentage = insights ? Math.min(Math.round((totalCalories / insights.target_calories) * 100), 100) : 0;

  const macroData = [
    { name: 'Protein', current: totalProtein, target: insights?.protein_target_g || 0 },
    { name: 'Carbs', current: totalCarbs, target: insights?.carbs_target_g || 0 },
    { name: 'Fats', current: totalFat, target: insights?.fat_target_g || 0 },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Summary</h2>
          <p className="text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-medium">
          <Target size={18} />
          <span>Goal: {insights?.target_calories.toLocaleString()} kcal</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calorie Progress Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8">
          <div className="w-48 h-48 relative flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[{ value: totalCalories }, { value: Math.max(0, (insights?.target_calories || 0) - totalCalories) }]}
                   cx="50%" cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                   startAngle={90}
                   endAngle={450}
                 >
                   <Cell fill="#10b981" />
                   <Cell fill="#f1f5f9" />
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute flex flex-col items-center">
               <span className="text-3xl font-bold text-slate-800">{totalCalories.toLocaleString()}</span>
               <span className="text-xs text-slate-400 uppercase font-semibold">consumed</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <h3 className="text-lg font-semibold text-slate-700">Calorie Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Progress to Daily Goal</span>
                <span className="font-bold">{caloriePercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${caloriePercentage}%` }}
                ></div>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              You have <span className="font-bold text-emerald-600">{Math.max(0, (insights?.target_calories || 0) - totalCalories).toLocaleString()} kcal</span> remaining for today.
            </p>
          </div>
        </div>

        {/* Macros Mini Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Macronutrients</h3>
          <div className="space-y-4">
            {macroData.map((macro) => (
              <div key={macro.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 font-medium">{macro.name}</span>
                  <span className="text-slate-700">{macro.current}g / {macro.target}g</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-orange-400 h-2 rounded-full" 
                    style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="text-orange-500" />} label="Calories" value={`${totalCalories} kcal`} color="border-orange-200" />
        <StatCard icon={<Target className="text-blue-500" />} label="Protein" value={`${totalProtein}g`} color="border-blue-200" />
        <StatCard icon={<Coffee className="text-amber-600" />} label="Fats" value={`${totalFat}g`} color="border-amber-200" />
        <StatCard icon={<Zap className="text-purple-500" />} label="Carbs" value={`${totalCarbs}g`} color="border-purple-200" />
      </div>

      {/* Recent Meals Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-800">Today's Meals</h3>
        </div>
        
        {meals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center text-slate-400">
            <p className="text-lg mb-2">No meals recorded yet today.</p>
            <p className="text-sm">Start by logging your breakfast, lunch or snacks!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {meals.map((meal, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">{meal.mealName}</h4>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">{meal.meal_time}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{meal.description}</p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                   <div className="text-emerald-600 font-bold">{meal.calories} kcal</div>
                   <div className="flex gap-2 text-[10px] uppercase font-bold text-slate-400">
                     <span>P: {meal.protein_g}g</span>
                     <span>C: {meal.carbs_g}g</span>
                     <span>F: {meal.fat_g}g</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border-b-4 ${color} flex items-center gap-4`}>
    <div className="p-3 bg-slate-50 rounded-lg">{icon}</div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;
