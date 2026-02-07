
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap, Target, Coffee, Flame, X, Trash2, Clock, Calendar, ChevronLeft, ChevronRight, Loader2, Info, Sparkles, MessageSquareQuote, Edit3, Save, Check } from 'lucide-react';
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
  
  // Manual Target Editing State
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
            alert("Please complete your profile to calculate your nutritional targets!");
            onRedirectToProfile();
            return;
          }
        }
      }

      if (userInsights) {
        setInsights(userInsights);
        setTargetForm({
          targetCalories: userInsights.target_calories,
          proteingTargetG: userInsights.protein_target_g,
          carbsTargetG: userInsights.carbs_target_g,
          fat_target_g: userInsights.fat_target_g, // types.ts might need alignment but we use the API fields
        } as any);
        
        // Ensure naming alignment for the form based on user request fields
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
      // Refresh calculations
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
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    setIsDeleting(true);
    try {
      await api.meals.delete(token, mealId);
      setSelectedMeal(null);
      await fetchData();
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) onLogout();
      alert('Failed to delete meal');
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
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 animate-pulse">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
        <Loader2 size={32} className="text-emerald-500 animate-spin" />
      </div>
      <p className="text-lg font-bold text-slate-400">Consulting SmartPlate...</p>
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-slate-800">Summary</h2>
            {isToday && <span className="text-[10px] bg-emerald-500 text-white px-3 py-1 rounded-full font-black uppercase tracking-wider">Today</span>}
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
             <button onClick={() => changeDate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600">
               <ChevronLeft size={20} />
             </button>
             <div className="relative flex items-center gap-2 px-4 font-black text-slate-600 text-sm">
               <Calendar size={16} className="text-emerald-500" />
               {formatDateEN(currentDate)}
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
             <button onClick={() => changeDate(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-emerald-600">
               <ChevronRight size={20} />
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-[1.5rem] font-black shadow-lg shadow-slate-200/50 border border-slate-50 relative group">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">Daily Target</p>
            <p className="text-lg text-slate-800">{insights?.target_calories.toLocaleString('en-US')} <span className="text-sm font-bold text-slate-400">kcal</span></p>
          </div>
          <button 
            onClick={() => setIsEditingTargets(true)}
            className="absolute -top-2 -right-2 p-2 bg-emerald-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-20"
          >
            <Edit3 size={14} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col md:flex-row items-center gap-10">
          <div className="w-52 h-52 relative flex items-center justify-center shrink-0">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={[{ value: totalCalories }, { value: Math.max(0.1, (insights?.target_calories || 0) - totalCalories) }]}
                   cx="50%" cy="50%"
                   innerRadius={75}
                   outerRadius={95}
                   paddingAngle={4}
                   dataKey="value"
                   startAngle={90}
                   endAngle={450}
                   stroke="none"
                 >
                   <Cell fill="#10b981" />
                   <Cell fill="#f1f5f9" />
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute flex flex-col items-center text-center">
               <span className="text-4xl font-black text-slate-800">{totalCalories.toLocaleString('en-US')}</span>
               <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">Consumed</span>
             </div>
          </div>
          
          <div className="flex-1 space-y-6 w-full">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Caloric Progress</h3>
              <p className="text-slate-400 text-sm font-bold">You've reached <span className="text-emerald-600">{caloriePercentage}%</span> of your daily objective.</p>
            </div>
            
            <div className="space-y-3">
              <div className="w-full bg-slate-100 rounded-2xl h-6 overflow-hidden shadow-inner p-1">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-xl transition-all duration-1000 ease-out shadow-md" 
                  style={{ width: `${caloriePercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                <span>Start</span>
                <span>{(Math.max(0, (insights?.target_calories || 0) - totalCalories)).toLocaleString('en-US')} kcal left</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col justify-between">
          <h3 className="text-xl font-black text-slate-800 mb-8">Macronutrients</h3>
          <div className="space-y-8">
            {macroData.map((macro) => (
              <div key={macro.name}>
                <div className="flex justify-between text-xs mb-3">
                  <span className="text-slate-400 font-black uppercase tracking-widest">{macro.name}</span>
                  <span className="text-slate-800 font-black">{Math.round(macro.current)}g <span className="text-slate-200 mx-1">/</span> {Math.round(macro.target)}g</span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`${macro.color} h-full rounded-full transition-all duration-1000 shadow-sm`} 
                    style={{ width: `${Math.min((macro.current / macro.target) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard icon={<Flame className="text-orange-500" />} label="Energy" value={`${totalCalories}`} unit="kcal" color="border-orange-400" />
        <TargetCard icon={<Target className="text-blue-500" />} label="Protein" value={`${Math.round(totalProtein)}`} unit="g" color="border-blue-400" />
        <StatCard icon={<Coffee className="text-amber-600" />} label="Fat" value={`${Math.round(totalFat)}`} unit="g" color="border-amber-400" />
        <StatCard icon={<Zap className="text-purple-500" />} label="Carbs" value={`${Math.round(totalCarbs)}`} unit="g" color="border-purple-400" />
      </div>

      <section className="pb-20">
        <h3 className="text-2xl font-black text-slate-800 mb-8">Today's Meals</h3>
        
        {loading && meals.length === 0 ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
        ) : meals.length === 0 ? (
          <div className="bg-white/50 p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center text-slate-300">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar size={40} className="opacity-20" />
            </div>
            <p className="text-xl font-black mb-2 text-slate-400">No records found</p>
            <p className="text-sm font-medium">History appears only for days with logged meals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {meals.map((meal, idx) => (
              <div 
                key={idx} 
                onClick={() => handleMealClick(meal)}
                className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:border-emerald-300 hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <h4 className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors text-lg leading-tight mb-1">{meal.mealName}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">
                      <Clock size={10} /> {formatTimeStr(meal.meal_time)}
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-xs font-black">
                    {meal.calories} <span className="opacity-60">kcal</span>
                  </div>
                </div>
                
                <p className="text-sm text-slate-400 mb-6 flex-grow font-medium leading-relaxed italic line-clamp-3">
                  "{meal.description || 'No additional details.'}"
                </p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                   <div className="flex flex-col">
                     <span className="text-[9px] uppercase font-black text-slate-300 tracking-tighter">Protein</span>
                     <span className="text-xs font-bold text-blue-500">{Math.round(meal.protein_g)}g</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] uppercase font-black text-slate-300 tracking-tighter">Carbs</span>
                     <span className="text-xs font-bold text-purple-500">{Math.round(meal.carbs_g)}g</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-[9px] uppercase font-black text-slate-300 tracking-tighter">Fat</span>
                     <span className="text-xs font-bold text-orange-500">{Math.round(meal.fat_g)}g</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Target Edit Modal */}
      {isEditingTargets && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="bg-emerald-600 p-8 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-2xl font-black">Manual Goals</h3>
                <button onClick={() => setIsEditingTargets(false)} className="text-white/60 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <p className="text-emerald-100 text-xs font-medium">Override nutritional targets manually (no AI).</p>
            </div>

            <form onSubmit={handleUpdateTargets} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Flame size={14} className="text-orange-500" /> Daily Calories (kcal)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="500"
                    max="10000"
                    value={targetForm.targetCalories}
                    onChange={e => setTargetForm({...targetForm, targetCalories: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} className="text-blue-500" /> Protein (g)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={targetForm.proteingTargetG}
                    onChange={e => setTargetForm({...targetForm, proteingTargetG: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-purple-500" /> Carbs (g)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={targetForm.carbsTargetG}
                    onChange={e => setTargetForm({...targetForm, carbsTargetG: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Coffee size={14} className="text-amber-600" /> Fat (g)
                  </label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={targetForm.fatTargetG}
                    onChange={e => setTargetForm({...targetForm, fatTargetG: parseInt(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 focus:bg-white outline-none font-bold transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsEditingTargets(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingTargets}
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {savingTargets ? <Loader2 size={18} className="animate-spin" /> : <><Check size={18} /> Save Goals</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full h-[94%] md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-[3rem] rounded-t-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-500 border border-white/20 flex flex-col relative">
            
            <div className="relative shrink-0 h-36 md:h-44 bg-emerald-600 p-8 md:p-10 flex flex-col justify-end shadow-lg z-10">
              <button 
                onClick={() => setSelectedMeal(null)}
                className="absolute top-5 right-5 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
              <h3 className="text-white text-3xl md:text-4xl font-black truncate leading-tight pr-10">{selectedMeal.mealName}</h3>
              <div className="flex gap-3 mt-3">
                <span className="bg-white/15 text-emerald-50 px-3 py-1.5 rounded-xl text-[10px] md:text-[11px] font-black flex items-center gap-2 backdrop-blur-md border border-white/10">
                   <Clock size={14} /> {formatTimeStr(selectedMeal.meal_time)}
                </span>
                <span className="bg-white/15 text-emerald-50 px-3 py-1.5 rounded-xl text-[10px] md:text-[11px] font-black flex items-center gap-2 backdrop-blur-md border border-white/10">
                   <Calendar size={14} /> {formatDateEN(currentDate)}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 pb-36 md:pb-32 space-y-10">
              
              <div className="grid grid-cols-4 gap-2 md:gap-4 pt-2">
                <MacroBadge label="Kcal" value={selectedMeal.calories} color="bg-emerald-500" />
                <MacroBadge label="Prot" value={Math.round(selectedMeal.protein_g)} unit="g" color="bg-blue-500" />
                <MacroBadge label="Carb" value={Math.round(selectedMeal.carbs_g)} unit="g" color="bg-purple-500" />
                <MacroBadge label="Fat" value={Math.round(selectedMeal.fat_g)} unit="g" color="bg-orange-500" />
              </div>

              <div className="space-y-10">
                {loadingMealDetail ? (
                  <div className="flex flex-col items-center py-16 text-slate-300">
                    <Loader2 size={48} className="animate-spin mb-4 text-emerald-500" />
                    <p className="font-black text-xs uppercase tracking-[0.2em] text-center px-10 text-slate-400">Analyzing...</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 text-emerald-600 border-b border-emerald-50 pb-3">
                        <Info size={22} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Nutritional Insight</h4>
                      </div>
                      <div className="text-slate-600 bg-emerald-50/10 p-6 md:p-8 rounded-[2rem] text-[15px] leading-relaxed border border-emerald-100/20 font-medium">
                        {selectedMeal.explanation || 'Detailed analysis unavailable.'}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center gap-3 text-amber-500 border-b border-amber-50 pb-3">
                        <Sparkles size={22} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">AI Coach Tip</h4>
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100/10 p-8 md:p-10 rounded-[2rem] border-2 border-amber-100/30 relative overflow-hidden">
                        <MessageSquareQuote className="absolute -top-1 -right-1 text-amber-200 opacity-20" size={60} />
                        <p className="text-amber-950 text-base md:text-lg italic font-bold leading-relaxed relative z-10 pr-2">
                          "{selectedMeal.advice || 'Your advice is being prepared.'}"
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 bg-white/95 backdrop-blur-lg border-t border-slate-100 flex gap-4 z-50 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] pb-8 md:pb-8">
              <button 
                onClick={() => handleDeleteMeal(selectedMeal.mealId)}
                disabled={isDeleting}
                className="flex-1 h-14 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 border border-red-100 text-sm md:text-base"
              >
                <Trash2 size={18} /> {isDeleting ? '...' : 'Remove'}
              </button>
              <button 
                onClick={() => setSelectedMeal(null)}
                className="flex-1 h-14 bg-slate-900 text-white hover:bg-black rounded-2xl font-black transition-all active:scale-95 shadow-xl shadow-slate-200 text-sm md:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @media (max-width: 768px) {
          .custom-scrollbar {
            padding-bottom: 120px !important;
          }
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode, label: string, value: string, unit: string, color: string }) => (
  <div className={`bg-white p-3 md:p-5 rounded-[1.25rem] shadow-sm border border-slate-100 border-l-[6px] ${color} flex items-center gap-2 md:gap-4 transition-all hover:shadow-lg overflow-hidden shrink-0`}>
    <div className="p-2 md:p-3 bg-slate-50 rounded-xl shrink-0">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-lg md:text-xl font-black text-slate-800 leading-none truncate">
        {value}
        <span className="text-[9px] md:text-[10px] font-bold text-slate-300 ml-1">{unit}</span>
      </p>
    </div>
  </div>
);

const TargetCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode, label: string, value: string, unit: string, color: string }) => (
  <div className={`bg-white p-3 md:p-5 rounded-[1.25rem] shadow-sm border border-slate-100 border-l-[6px] ${color} flex items-center gap-2 md:gap-4 transition-all hover:shadow-lg overflow-hidden shrink-0`}>
    <div className="p-2 md:p-3 bg-slate-50 rounded-xl shrink-0">
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-lg md:text-xl font-black text-slate-800 leading-none truncate">
        {value}
        <span className="text-[9px] md:text-[10px] font-bold text-slate-300 ml-1">{unit}</span>
      </p>
    </div>
  </div>
);

const MacroBadge = ({ label, value, unit = '', color }: { label: string, value: number, unit?: string, color: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-full aspect-square rounded-[1.25rem] md:rounded-[1.75rem] ${color} flex flex-col items-center justify-center text-white shadow-lg transition-transform hover:scale-105`}>
      <span className="text-base md:text-2xl font-black leading-none">{value}</span>
      {unit && <span className="text-[8px] md:text-[10px] font-black uppercase opacity-70 mt-1">{unit}</span>}
    </div>
    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{label}</span>
  </div>
);

export default Dashboard;
