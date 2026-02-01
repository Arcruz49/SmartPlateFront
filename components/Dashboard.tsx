
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap, Target, Coffee, Flame, X, Trash2, Clock, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { UserInsights, Meal } from '../types';

interface DashboardProps {
  token: string;
}

const Dashboard: React.FC<DashboardProps> = ({ token }) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleDeleteMeal = async (mealId: string) => {
    if (!window.confirm('Are you sure you want to remove this meal?')) return;
    setIsDeleting(true);
    try {
      await api.meals.delete(token, mealId);
      setSelectedMeal(null);
      await fetchData();
    } catch (err) {
      alert('Failed to delete meal');
    } finally {
      setIsDeleting(false);
    }
  };

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
    { name: 'Protein', current: totalProtein, target: insights?.protein_target_g || 0, color: 'bg-blue-500' },
    { name: 'Carbs', current: totalCarbs, target: insights?.carbs_target_g || 0, color: 'bg-purple-500' },
    { name: 'Fats', current: totalFat, target: insights?.fat_target_g || 0, color: 'bg-orange-500' },
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
             <div className="absolute flex flex-col items-center text-center">
               <span className="text-3xl font-bold text-slate-800">{totalCalories.toLocaleString()}</span>
               <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">consumed</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <h3 className="text-lg font-semibold text-slate-700">Calorie Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-500">Progress to Daily Goal</span>
                <span className="font-bold">{caloriePercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${caloriePercentage}%` }}
                ></div>
              </div>
            </div>
            <p className="text-slate-600 text-sm">
              You have <span className="font-bold text-emerald-600">{Math.max(0, (insights?.target_calories || 0) - totalCalories).toLocaleString()} kcal</span> remaining today.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Macronutrients</h3>
          <div className="space-y-4">
            {macroData.map((macro) => (
              <div key={macro.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 font-medium">{macro.name}</span>
                  <span className="text-slate-700 font-bold">{Math.round(macro.current)}g / {Math.round(macro.target)}g</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`${macro.color} h-2 rounded-full transition-all duration-700`} 
                    style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="text-orange-500" />} label="Calories" value={`${totalCalories}`} color="border-orange-400" />
        <StatCard icon={<Target className="text-blue-500" />} label="Protein" value={`${Math.round(totalProtein)}g`} color="border-blue-400" />
        <StatCard icon={<Coffee className="text-amber-600" />} label="Fats" value={`${Math.round(totalFat)}g`} color="border-amber-400" />
        <StatCard icon={<Zap className="text-purple-500" />} label="Carbs" value={`${Math.round(totalCarbs)}g`} color="border-purple-400" />
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map((meal, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedMeal(meal)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{meal.mealName}</h4>
                  <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold uppercase">{meal.meal_time}</span>
                </div>
                <p className="text-sm text-slate-500 mb-3 line-clamp-2 min-h-[40px]">{meal.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                   <div className="text-emerald-600 font-bold text-lg">{meal.calories} <span className="text-[10px] uppercase font-bold text-slate-400">kcal</span></div>
                   <div className="flex gap-2 text-[10px] uppercase font-extrabold text-slate-300">
                     <span className="text-blue-500/60">P:{Math.round(meal.protein_g)}</span>
                     <span className="text-purple-500/60">C:{Math.round(meal.carbs_g)}</span>
                     <span className="text-orange-500/60">F:{Math.round(meal.fat_g)}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative h-20 bg-emerald-600 p-6 flex items-center justify-between">
              <h3 className="text-white text-xl font-bold truncate pr-8">{selectedMeal.mealName}</h3>
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-6 right-6 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl">
                  <Clock size={18} />
                  <span className="text-sm font-semibold">{selectedMeal.meal_time}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 bg-slate-50 p-3 rounded-xl">
                  <Calendar size={18} />
                  <span className="text-sm font-semibold">{selectedMeal.meal_date}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                <p className="text-slate-600 bg-slate-50/50 p-4 rounded-xl italic border border-slate-100">
                  {selectedMeal.description || 'No additional details provided for this meal.'}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nutritional Info</h4>
                <div className="grid grid-cols-4 gap-4">
                  <MacroBadge label="Kcal" value={selectedMeal.calories} color="bg-emerald-500" />
                  <MacroBadge label="Prot" value={Math.round(selectedMeal.protein_g)} unit="g" color="bg-blue-500" />
                  <MacroBadge label="Carb" value={Math.round(selectedMeal.carbs_g)} unit="g" color="bg-purple-500" />
                  <MacroBadge label="Fat" value={Math.round(selectedMeal.fat_g)} unit="g" color="bg-orange-500" />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <button 
                  onClick={() => handleDeleteMeal(selectedMeal.mealId)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-6 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Trash2 size={20} /> {isDeleting ? 'Deleting...' : 'Delete Log'}
                </button>
                <button 
                  onClick={() => setSelectedMeal(null)}
                  className="flex-1 py-3 px-6 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) => (
  <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${color} flex items-center gap-3`}>
    <div className="p-2 bg-slate-50 rounded-lg scale-90 md:scale-100">{icon}</div>
    <div>
      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const MacroBadge = ({ label, value, unit = '', color }: { label: string, value: number, unit?: string, color: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-full aspect-square rounded-2xl ${color} flex flex-col items-center justify-center text-white shadow-lg`}>
      <span className="text-xl font-black">{value}</span>
      <span className="text-[10px] font-bold opacity-80">{unit}</span>
    </div>
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tighter mt-1">{label}</span>
  </div>
);

export default Dashboard;
