
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2, CalendarClock, Sparkles, Settings2, Flame, Target, Zap, Coffee } from 'lucide-react';
import { api } from '../services/api';

interface MealLoggerProps {
  token: string;
  onSuccess: () => void;
  onLogout?: () => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ token, onSuccess, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  
  // Get current local date/time in YYYY-MM-DDTHH:mm format
  const getNowFormatted = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [mealDateTime, setMealDateTime] = useState(getNowFormatted());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Manual macro state
  const [manualMacros, setManualMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName) return;

    setLoading(true);
    setError(null);
    try {
      let imageBytes = '';
      if (imagePreview && activeTab === 'ai') {
        imageBytes = imagePreview.split(',')[1];
      }

      // Step 1: Create the meal
      const meal = await api.meals.log(token, {
        mealName,
        description,
        imageBytes: imageBytes || undefined,
        mealDate: mealDateTime 
      });

      // Step 2: If manual, override nutritional data
      if (activeTab === 'manual') {
        await api.meals.updateMealMacros(token, {
          mealId: meal.mealId,
          targetCalories: manualMacros.calories,
          proteinTargetG: manualMacros.protein,
          carbsTargetG: manualMacros.carbs,
          fatTargetG: manualMacros.fat
        });
      }
      
      // Success Cleanup
      setMealName('');
      setDescription('');
      setMealDateTime(getNowFormatted());
      setImagePreview(null);
      setManualMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      onSuccess();
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) {
        onLogout();
        return;
      }
      setError('Failed to log meal. Please check your data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-2xl shadow-lg shadow-emerald-200">
              <Camera size={24} />
            </div>
            Log New Meal
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Choose how you want to record your nutrition.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full md:w-fit self-start md:self-center">
          <button 
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Sparkles size={14} /> AI Analysis
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={14} /> Manual Entry
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-in shake duration-500">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Meal Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Grilled Salmon & Salad"
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:bg-white bg-slate-50 outline-none transition-all font-bold pr-16"
                />
                <span className={`absolute bottom-4 right-4 text-[9px] font-bold ${mealName.length >= 255 ? 'text-red-500' : 'text-slate-300'}`}>
                  {mealName.length}/255
                </span>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CalendarClock size={12} className="text-slate-400" /> Date & Time (24h)
              </label>
              <div className="relative group">
                <input
                  type="datetime-local"
                  lang="pt-BR"
                  max={getNowFormatted()}
                  value={mealDateTime}
                  onChange={(e) => setMealDateTime(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:bg-white bg-slate-50 outline-none transition-all font-bold text-sm cursor-pointer"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-emerald-500 transition-colors bg-white pl-2">
                  <CalendarClock size={18} />
                </div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Optional Notes</label>
              <div className="relative">
                <textarea
                  value={description}
                  maxLength={2000}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe portions or ingredients..."
                  rows={activeTab === 'manual' ? 4 : 4}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:bg-white bg-slate-50 outline-none transition-all font-bold resize-none pr-4 pb-8"
                />
                <span className={`absolute bottom-3 right-4 text-[9px] font-bold ${description.length >= 2000 ? 'text-red-500' : 'text-slate-300'}`}>
                  {description.length}/2000
                </span>
              </div>
            </div>
          </div>

          <div>
            {activeTab === 'ai' ? (
              <>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Photo Upload</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[330px] flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer relative overflow-hidden group"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-xl text-slate-600 hover:text-red-500 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center p-8 text-slate-300 group-hover:text-emerald-500 transition-colors">
                      <Upload size={40} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Click to Upload</p>
                      <p className="text-[10px] mt-2 font-bold opacity-50">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
              </>
            ) : (
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nutritional Values</label>
                <div className="grid grid-cols-2 gap-4">
                  <MacroInput 
                    label="Calories" 
                    icon={<Flame size={16} />} 
                    value={manualMacros.calories} 
                    unit="kcal"
                    onChange={(val) => setManualMacros({...manualMacros, calories: val})} 
                    color="text-orange-500"
                    bg="bg-orange-50"
                  />
                  <MacroInput 
                    label="Protein" 
                    icon={<Target size={16} />} 
                    value={manualMacros.protein} 
                    unit="g"
                    onChange={(val) => setManualMacros({...manualMacros, protein: val})} 
                    color="text-blue-500"
                    bg="bg-blue-50"
                  />
                  <MacroInput 
                    label="Carbs" 
                    icon={<Zap size={16} />} 
                    value={manualMacros.carbs} 
                    unit="g"
                    onChange={(val) => setManualMacros({...manualMacros, carbs: val})} 
                    color="text-purple-500"
                    bg="bg-purple-50"
                  />
                  <MacroInput 
                    label="Fats" 
                    icon={<Coffee size={16} />} 
                    value={manualMacros.fat} 
                    unit="g"
                    onChange={(val) => setManualMacros({...manualMacros, fat: val})} 
                    color="text-amber-600"
                    bg="bg-amber-50"
                  />
                </div>
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 mt-4">
                  <p className="text-[10px] font-bold text-emerald-700 leading-relaxed italic">
                    Note: Manual values will override AI estimation for this meal.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-50">
          <button
            type="submit"
            disabled={loading || !mealName}
            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl active:scale-[0.98] ${
              loading || !mealName 
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={24} className="animate-spin" /> {activeTab === 'ai' ? 'Analyzing...' : 'Saving...'}
              </>
            ) : (
              <>
                <Check size={24} /> {activeTab === 'ai' ? 'Log with AI' : 'Save Manual Record'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

const MacroInput = ({ label, icon, value, unit, onChange, color, bg }: any) => (
  <div className={`p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-300 transition-all ${bg}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className={`${color}`}>
        {icon}
      </div>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <input 
        type="number"
        min="0"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-transparent outline-none font-black text-lg text-slate-800"
      />
      <span className="text-[10px] font-bold text-slate-300">{unit}</span>
    </div>
  </div>
);

export default MealLogger;
