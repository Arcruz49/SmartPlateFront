
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
      if (activeTab === 'ai') {
        let imageBytes = '';
        if (imagePreview) {
          imageBytes = imagePreview.split(',')[1];
        }

        await api.meals.log(token, {
          mealName,
          description,
          imageBytes: imageBytes || undefined,
          mealDate: mealDateTime 
        });
      } else {
        const [datePart, timePart] = mealDateTime.split('T');
        
        await api.meals.logManual(token, {
          mealName,
          mealDescription: description,
          mealDate: datePart,
          mealTime: `${timePart}:00`,
          calories: Math.round(manualMacros.calories),
          proteinG: manualMacros.protein,
          carbsG: manualMacros.carbs,
          fatG: manualMacros.fat
        });
      }
      
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      {/* Header Tabs */}
      <div className="flex justify-center mb-8">
         <div className="bg-[#242424] p-1 rounded-full flex">
            <TabButton 
               active={activeTab === 'ai'} 
               onClick={() => setActiveTab('ai')} 
               icon={<Sparkles size={16} />} 
               label="AI Analysis" 
            />
            <TabButton 
               active={activeTab === 'manual'} 
               onClick={() => setActiveTab('manual')} 
               icon={<Settings2 size={16} />} 
               label="Manual Entry" 
            />
         </div>
      </div>

      <div className="bg-[#181818] rounded-lg p-8 md:p-10 border border-[#282828] shadow-2xl">
        <h2 className="text-3xl font-black text-white mb-2 text-center">Log New Meal</h2>
        <p className="text-[#a7a7a7] text-center text-sm mb-8 font-medium">Track your nutrition to hit your daily goals.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-3 bg-[#e91429] text-white rounded-md text-sm font-bold text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <DarkInput label="Meal Name" value={mealName} onChange={setMealName} placeholder="e.g., Morning Oats" />
                  
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">Date & Time</label>
                     <div className="relative">
                        <input
                           type="datetime-local"
                           value={mealDateTime}
                           onChange={(e) => setMealDateTime(e.target.value)}
                           className="w-full bg-[#242424] text-white p-4 rounded-md outline-none focus:ring-2 focus:ring-white border border-transparent font-medium"
                        />
                        <CalendarClock className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a7a7a7] pointer-events-none" size={18} />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">Notes</label>
                     <textarea
                        value={description}
                        maxLength={2000}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add details..."
                        rows={4}
                        className="w-full bg-[#242424] text-white p-4 rounded-md outline-none focus:ring-2 focus:ring-white border border-transparent font-medium resize-none"
                     />
                  </div>
               </div>

               <div>
                  {activeTab === 'ai' ? (
                    <>
                      <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest block mb-2">Photo</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-[340px] border-2 border-dashed border-[#3e3e3e] rounded-xl flex flex-col items-center justify-center hover:bg-[#242424] hover:border-[#a7a7a7] transition-all cursor-pointer relative overflow-hidden group bg-[#121212]"
                      >
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                               <p className="text-white font-bold uppercase tracking-widest text-xs">Change Photo</p>
                            </div>
                            <button 
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                              className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-[#e91429]"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-6">
                             <div className="w-16 h-16 bg-[#242424] rounded-full flex items-center justify-center mx-auto mb-4 text-[#a7a7a7] group-hover:text-white transition-colors">
                                <Camera size={32} />
                             </div>
                             <p className="font-bold text-white mb-1">Upload Photo</p>
                             <p className="text-xs text-[#a7a7a7]">JPEG/PNG up to 10MB</p>
                          </div>
                        )}
                      </div>
                      <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                    </>
                  ) : (
                    <div className="space-y-6">
                       <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest block">Nutrition (Manual)</label>
                       <div className="grid grid-cols-2 gap-4">
                          <MacroInput label="Calories" icon={<Flame size={14} />} value={manualMacros.calories} onChange={(v:number) => setManualMacros({...manualMacros, calories: v})} color="text-orange-500" />
                          <MacroInput label="Protein" icon={<Target size={14} />} value={manualMacros.protein} onChange={(v:number) => setManualMacros({...manualMacros, protein: v})} color="text-blue-500" />
                          <MacroInput label="Carbs" icon={<Zap size={14} />} value={manualMacros.carbs} onChange={(v:number) => setManualMacros({...manualMacros, carbs: v})} color="text-purple-500" />
                          <MacroInput label="Fat" icon={<Coffee size={14} />} value={manualMacros.fat} onChange={(v:number) => setManualMacros({...manualMacros, fat: v})} color="text-orange-400" />
                       </div>
                       <div className="p-4 bg-[#242424] rounded-lg text-xs text-[#a7a7a7] italic">
                          Values entered here bypass AI analysis and are saved directly.
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="pt-6 flex justify-center">
               <button
                 type="submit"
                 disabled={loading || !mealName}
                 className="px-12 py-4 bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 active:scale-100 text-black font-bold rounded-full transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2 text-lg tracking-tight"
               >
                  {loading ? <Loader2 className="animate-spin" /> : <Check />}
                  {loading ? 'Processing...' : 'Save Meal'}
               </button>
            </div>
        </form>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
   <button 
     type="button"
     onClick={onClick}
     className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold transition-all ${active ? 'bg-[#3e3e3e] text-white' : 'text-[#a7a7a7] hover:text-white'}`}
   >
     {icon} {label}
   </button>
);

const DarkInput = ({ label, value, onChange, placeholder }: any) => (
   <div className="space-y-2">
      <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">{label}</label>
      <input
         type="text"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         placeholder={placeholder}
         className="w-full bg-[#242424] text-white p-4 rounded-md outline-none focus:ring-2 focus:ring-white border border-transparent font-medium placeholder-[#555]"
      />
   </div>
);

const MacroInput = ({ label, icon, value, onChange, color }: any) => (
   <div className="bg-[#242424] p-4 rounded-md border border-transparent focus-within:border-[#a7a7a7] transition-colors">
      <div className="flex items-center gap-2 mb-2">
         <span className={color}>{icon}</span>
         <span className="text-[10px] font-bold text-[#a7a7a7] uppercase">{label}</span>
      </div>
      <input 
         type="number"
         min="0"
         value={value || ''}
         placeholder="0"
         onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
         className="w-full bg-transparent text-white text-xl font-bold outline-none placeholder-[#333]"
      />
   </div>
);

export default MealLogger;
