
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap, Target, Coffee, Flame, X, Trash2, Clock, Calendar, ChevronLeft, ChevronRight, Loader2, Info, Sparkles, MessageSquareQuote, Edit3, Save, Check, Play, Utensils } from 'lucide-react';
import { api } from '../services/api';
import { UserInsights, Meal } from '../types';

interface DashboardProps {
  token: string;
  onLogout?: () => void;
  onRedirectToProfile?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ token, onLogout, onRedirectToProfile }) => {
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [loadingMealDetail, setLoadingMealDetail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetForm, setTargetForm] = useState({
    targetCalories: 2000,
    proteingTargetG: 150,
    carbsTargetG: 200,
    fatTargetG: 60
  });

  const formatDateForApi = (date: Date) => date.toLocaleDateString('sv-SE');

  const formatDateEN = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatTimeStr = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateStr = formatDateForApi(currentDate);
      let userInsights: UserInsights | null = null;
      
      try {
        userInsights = await api.insights.get(token);
      } catch (e) {
        try {
          userInsights = await api.insights.generate(token);
        } catch (genError) {
          console.error("Failed to fetch or generate insights", genError);
          if (onRedirectToProfile) {
            onRedirectToProfile();
            return;
          }
        }
      }

      if (userInsights) {
        setInsights(userInsights);
        // Fix: Use 'fatTargetG' to match the state interface property name.
        setTargetForm({
          targetCalories: userInsights.target_calories,
          proteingTargetG: userInsights.protein_target_g,
          carbsTargetG: userInsights.carbs_target_g,
          fatTargetG: userInsights.fat_target_g
        });

        const dailyMeals = await api.meals.getForDate(token, dateStr);
        setMeals(dailyMeals);
      }
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) onLogout();
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, currentDate]);

  const handleUpdateTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTargets(true);
    try {
      const updated = await api.insights.updateTargets(token, targetForm);
      setInsights(updated);
      setIsEditingTargets(false);
      await fetchData();
    } catch (err) {
      alert("Failed to update goals.");
      console.error(err);
    } finally {
      setSavingTargets(false);
    }
  };

  const handleMealClick = async (meal: Meal) => {
    setLoadingMealDetail(true);
    setSelectedMeal(meal); 
    try {
      const detailedMeal = await api.meals.getById(token, meal.mealId);
      setSelectedMeal(detailedMeal);
    } catch (err) {
      console.error("Error fetching meal details", err);
    } finally {
      setLoadingMealDetail(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!window.confirm('Remove this meal?')) return;
    setIsDeleting(true);
    try {
      await api.meals.delete(token, mealId);
      setSelectedMeal(null);
      await fetchData();
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) onLogout();
    } finally {
      setIsDeleting(false);
    }
  };

  const changeDate = (offset: number) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + offset);
    setCurrentDate(nextDate);
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  if (loading && meals.length === 0 && !insights) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-[#a7a7a7]">
      <Loader2 size={40} className="text-[#1ed760] animate-spin mb-4" />
      <p className="text-sm font-bold tracking-widest uppercase text-white">Loading Dashboard</p>
    </div>
  );

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein_g, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs_g, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat_g, 0);

  const caloriePercentage = insights ? Math.min(Math.round((totalCalories / insights.target_calories) * 100), 100) : 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      
      {/* Date Header */}
      <div className="flex items-end justify-between border-b border-[#282828] pb-8">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1ed760] mb-3">Health Profile</h2>
          <div className="flex items-center gap-6">
             <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                {isToday ? 'Today' : formatDateEN(currentDate)}
             </h1>
             <div className="flex items-center gap-2">
                 <button onClick={() => changeDate(-1)} className="p-3 rounded-full bg-[#181818] hover:bg-[#282828] text-white transition-all hover:scale-110 active:scale-95">
                    <ChevronLeft size={24} />
                 </button>
                 <div className="relative group">
                     <button className="p-3 rounded-full bg-[#181818] hover:bg-[#282828] text-white transition-all group-hover:text-[#1ed760]">
                        <Calendar size={24} />
                     </button>
                     <input 
                        type="date" 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full" 
                        value={formatDateForApi(currentDate)}
                        onChange={(e) => {
                            const [year, month, day] = e.target.value.split('-').map(Number);
                            setCurrentDate(new Date(year, month - 1, day));
                        }}
                    />
                 </div>
                 <button onClick={() => changeDate(1)} className="p-3 rounded-full bg-[#181818] hover:bg-[#282828] text-white transition-all hover:scale-110 active:scale-95">
                    <ChevronRight size={24} />
                 </button>
             </div>
          </div>
        </div>

        <button 
           onClick={() => setIsEditingTargets(true)}
           className="hidden md:flex items-center gap-2.5 px-6 py-3 bg-[#181818] rounded-full text-xs font-bold text-white hover:bg-[#282828] transition-all border border-transparent hover:border-[#333]"
        >
            <Edit3 size={14} /> Adjust Targets
        </button>
      </div>

      {/* Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Calorie Ring Card */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#181818] to-[#121212] p-8 rounded-2xl border border-[#222] flex flex-col items-center justify-center text-center group transition-all">
            <div className="w-56 h-56 relative mb-8 group-hover:scale-105 transition-transform duration-700">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={[{ value: totalCalories }, { value: Math.max(0.1, (insights?.target_calories || 0) - totalCalories) }]}
                       cx="50%" cy="50%"
                       innerRadius={70}
                       outerRadius={95}
                       startAngle={90}
                       endAngle={-270}
                       dataKey="value"
                       stroke="none"
                     >
                       <Cell fill="#1ed760" /> 
                       <Cell fill="#222" />
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white">{totalCalories}</span>
                    <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mt-1">Calories Consumed</span>
                 </div>
            </div>
            
            <div className="space-y-2">
                <h3 className="text-white font-black text-xl">Daily Progress</h3>
                <p className="text-[#666] text-sm font-medium">Goal: {insights?.target_calories} kcal</p>
                <div className="pt-4 flex justify-center">
                    <div className="px-5 py-1.5 bg-[#1ed760] text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#1ed760]/10">
                        {caloriePercentage}% Achieved
                    </div>
                </div>
            </div>
        </div>

        {/* Macro Progress Columns */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <MacroCard label="Protein" current={totalProtein} target={insights?.protein_target_g || 0} icon={<Target size={20} />} color="text-blue-500" barColor="bg-blue-500" />
               <MacroCard label="Carbs" current={totalCarbs} target={insights?.carbs_target_g || 0} icon={<Zap size={20} />} color="text-purple-500" barColor="bg-purple-500" />
               <MacroCard label="Fats" current={totalFat} target={insights?.fat_target_g || 0} icon={<Coffee size={20} />} color="text-orange-500" barColor="bg-orange-500" />
               <div className="bg-[#181818] p-6 rounded-xl border border-[#222] flex flex-col justify-center">
                   <div className="flex items-center justify-between mb-4">
                       <span className="text-xs font-black uppercase tracking-widest text-[#666]">Avg. Consumption</span>
                       <Flame size={18} className="text-red-500" />
                   </div>
                   <p className="text-2xl font-black text-white">{(totalCalories / Math.max(1, meals.length)).toFixed(0)} <span className="text-sm font-bold text-[#666]">kcal/meal</span></p>
               </div>
             </div>

             <div className="bg-[#181818] p-2 rounded-2xl border border-[#222] flex flex-wrap gap-2">
                <MiniIndicator label="Weight Trend" value="Stable" color="text-emerald-400" />
                <MiniIndicator label="Active Streak" value="3 Days" color="text-amber-400" />
                <MiniIndicator label="Hydration" value="Optimal" color="text-blue-400" />
             </div>
        </div>
      </div>

      {/* Meals Section - Re-designed Cards */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2 border-l-4 border-[#1ed760] pl-6">
            <div>
              <h3 className="text-2xl font-black text-white">Meal Log</h3>
              <p className="text-sm font-medium text-[#666]">Detailed nutritional history for today.</p>
            </div>
            <span className="px-4 py-1.5 bg-[#222] rounded-full text-[10px] font-black text-white uppercase tracking-widest">{meals.length} Records</span>
        </div>

        {loading && meals.length === 0 ? (
           <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#1ed760] w-10 h-10" /></div>
        ) : meals.length === 0 ? (
           <div className="bg-[#121212] rounded-3xl border-2 border-dashed border-[#222] p-24 text-center">
               <Utensils size={48} className="mx-auto mb-6 text-[#333]" />
               <h4 className="text-white font-bold text-xl mb-2">The plate is empty</h4>
               <p className="text-[#666] text-sm">You haven't recorded any meals for this date.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {meals.map((meal) => (
                   <div 
                     key={meal.mealId}
                     onClick={() => handleMealClick(meal)}
                     className="bg-[#181818] p-6 rounded-2xl border border-[#282828] hover:border-[#444] hover:bg-[#222] transition-all group cursor-pointer relative flex flex-col shadow-lg shadow-black/20"
                   >
                       <div className="flex justify-between items-start mb-6">
                           <div className="bg-[#282828] p-3 rounded-xl text-[#1ed760] group-hover:scale-110 transition-transform">
                               <Utensils size={20} />
                           </div>
                           <div className="flex flex-col items-end">
                               <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-1">{formatTimeStr(meal.meal_time)}</span>
                               <div className="text-[#1ed760] font-black text-sm">{meal.calories} kcal</div>
                           </div>
                       </div>
                       
                       <h4 className="text-white font-black text-xl mb-3 truncate pr-8">{meal.mealName}</h4>
                       <p className="text-[#666] text-sm line-clamp-2 mb-8 italic font-medium">
                          "{meal.description || 'No additional details provided.'}"
                       </p>

                       <div className="mt-auto pt-6 border-t border-[#282828] grid grid-cols-3 gap-4">
                           <MacroMini label="Prot" value={Math.round(meal.protein_g)} color="text-blue-500" />
                           <MacroMini label="Carb" value={Math.round(meal.carbs_g)} color="text-purple-500" />
                           <MacroMini label="Fat" value={Math.round(meal.fat_g)} color="text-orange-500" />
                       </div>

                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteMeal(meal.mealId); }}
                         className="absolute top-6 right-6 text-[#444] hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg"
                       >
                         <Trash2 size={16} />
                       </button>
                   </div>
               ))}
           </div>
        )}
      </section>

      {/* Target Modal */}
      {isEditingTargets && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-[#121212] w-full max-w-lg rounded-2xl p-10 border border-[#282828] shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black text-white">Goals</h3>
                 <button onClick={() => setIsEditingTargets(false)} className="p-2 hover:bg-[#222] rounded-full text-[#666] hover:text-white transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateTargets} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                      <FormInput label="Calories" value={targetForm.targetCalories} onChange={v => setTargetForm({...targetForm, targetCalories: parseInt(v)})} />
                      <FormInput label="Protein (g)" value={targetForm.proteingTargetG} onChange={v => setTargetForm({...targetForm, proteingTargetG: parseInt(v)})} />
                      <FormInput label="Carbs (g)" value={targetForm.carbsTargetG} onChange={v => setTargetForm({...targetForm, carbsTargetG: parseInt(v)})} />
                      <FormInput label="Fat (g)" value={targetForm.fatTargetG} onChange={v => setTargetForm({...targetForm, fatTargetG: parseInt(v)})} />
                  </div>
                  <button type="submit" className="w-full bg-[#1ed760] text-black font-black text-base py-4 rounded-full hover:scale-105 active:scale-95 transition-all mt-6 shadow-xl shadow-[#1ed760]/10">
                      {savingTargets ? 'Updating...' : 'Save Objectives'}
                  </button>
              </form>
           </div>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 animate-in zoom-in-95 duration-300">
           <div className="bg-[#121212] w-full max-w-4xl max-h-[92vh] rounded-2xl overflow-hidden flex flex-col border border-[#282828] shadow-2xl shadow-black">
              
              <div className="bg-gradient-to-b from-[#222] to-[#121212] p-12 relative border-b border-[#222]">
                  <button onClick={() => setSelectedMeal(null)} className="absolute top-8 right-8 bg-[#121212]/80 hover:bg-white hover:text-black p-3 rounded-full text-white transition-all"><X size={24} /></button>
                  <span className="text-[#1ed760] font-black text-xs uppercase tracking-[0.3em] mb-4 block">Analyzing Meal</span>
                  <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-none tracking-tighter">{selectedMeal.mealName}</h1>
                  <div className="flex items-center gap-6 text-sm font-bold text-[#666]">
                      <span className="flex items-center gap-2 bg-[#121212]/50 px-4 py-2 rounded-xl"><Clock size={16} /> {formatTimeStr(selectedMeal.meal_time)}</span>
                      <span className="flex items-center gap-2 bg-[#121212]/50 px-4 py-2 rounded-xl"><Flame size={16} /> {selectedMeal.calories} kcal</span>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                      <MacroBox label="ENERGY" value={selectedMeal.calories} unit="kcal" color="text-white" />
                      <MacroBox label="PROTEIN" value={Math.round(selectedMeal.protein_g)} unit="g" color="text-blue-500" />
                      <MacroBox label="CARBS" value={Math.round(selectedMeal.carbs_g)} unit="g" color="text-purple-500" />
                      <MacroBox label="FAT" value={Math.round(selectedMeal.fat_g)} unit="g" color="text-orange-500" />
                  </div>

                  {loadingMealDetail ? (
                      <div className="py-20 flex flex-col items-center gap-4 text-[#666]">
                        <Loader2 className="animate-spin text-[#1ed760] w-12 h-12" />
                        <span className="text-xs font-black uppercase tracking-widest">Generating detailed coach data...</span>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-[#181818] p-8 rounded-2xl border border-[#222]">
                              <h4 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 opacity-60"><Info size={16} /> Nutrition Context</h4>
                              <p className="text-[#999] leading-relaxed text-lg italic">
                                  {selectedMeal.explanation || 'Detailed breakdown unavailable.'}
                              </p>
                          </div>
                          <div className="bg-gradient-to-br from-[#1ed760]/5 to-transparent p-8 rounded-2xl border border-[#1ed760]/10">
                              <h4 className="text-[#1ed760] font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2"><Sparkles size={16} /> Meal Coach Recommendation</h4>
                              <p className="text-white font-bold leading-relaxed text-2xl">
                                  "{selectedMeal.advice || 'Nutritional advice pending...'}"
                              </p>
                          </div>
                      </div>
                  )}
              </div>

              <div className="p-8 border-t border-[#222] bg-[#121212] flex justify-end gap-6">
                  <button 
                    onClick={() => handleDeleteMeal(selectedMeal.mealId)}
                    disabled={isDeleting}
                    className="px-8 py-3 rounded-full text-[#666] hover:text-white font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all"
                  >
                     {isDeleting ? 'Wait...' : 'Discard Record'}
                  </button>
                  <button 
                    onClick={() => setSelectedMeal(null)}
                    className="bg-white text-black font-black px-12 py-4 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                  >
                     Keep Tracking
                  </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
         .custom-scrollbar::-webkit-scrollbar { width: 6px; }
         .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
         .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
         .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
};

const MacroCard = ({ label, current, target, color, icon, barColor }: any) => (
  <div className="bg-[#181818] p-6 rounded-xl border border-[#222] hover:bg-[#222] transition-all group">
     <div className="flex justify-between items-start mb-4">
         <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest text-[#666] mb-1">{label}</span>
             <span className="text-xl font-black text-white">{Math.round(current)}<span className="text-xs text-[#666] ml-1">/ {Math.round(target)}g</span></span>
         </div>
         <div className={`${color} opacity-30 group-hover:opacity-100 transition-opacity`}>{icon}</div>
     </div>
     <div className="w-full bg-[#121212] rounded-full h-1.5 overflow-hidden">
         <div 
            className={`h-full ${barColor} rounded-full transition-all duration-1000 shadow-lg`} 
            style={{ width: `${Math.min((current / target) * 100, 100)}%` }}
         />
     </div>
  </div>
);

const MacroMini = ({ label, value, color }: any) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black text-[#444] uppercase tracking-tighter">{label}</span>
    <span className={`text-sm font-black ${color}`}>{value}g</span>
  </div>
);

const MacroBox = ({ label, value, unit, color }: any) => (
  <div className="bg-[#181818] p-6 rounded-2xl border border-[#222] text-center">
    <span className={`text-3xl font-black block ${color}`}>{value}</span>
    <span className="text-[10px] font-black text-[#666] uppercase tracking-widest mt-2 block">{label} ({unit})</span>
  </div>
);

const MiniIndicator = ({ label, value, color }: any) => (
  <div className="bg-[#121212] px-4 py-2 rounded-xl flex items-center gap-3 border border-[#222]">
    <span className="text-[9px] font-black text-[#666] uppercase tracking-widest">{label}</span>
    <span className={`text-xs font-black ${color}`}>{value}</span>
  </div>
);

const FormInput = ({ label, value, onChange }: any) => (
    <div className="space-y-3">
        <label className="block text-[10px] font-black text-[#666] uppercase tracking-widest">{label}</label>
        <input 
          type="number" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="w-full bg-[#181818] text-white p-4 rounded-xl border-2 border-transparent focus:border-[#1ed760] outline-none font-black text-lg transition-all" 
        />
    </div>
);

export default Dashboard;
