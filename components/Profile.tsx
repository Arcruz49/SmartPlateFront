
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserData, BiologicalSex, TrainingType, TrainingIntensity, DailyActivityLevel, Goal } from '../types';
import { Save, User as UserIcon, Loader2, AlertCircle, Target, Sparkles, LogOut, Dumbbell, CalendarDays, Activity } from 'lucide-react';

interface ProfileProps {
  token: string;
  onLogout?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ token, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showInsightPrompt, setShowInsightPrompt] = useState(false);
  
  const [formData, setFormData] = useState<UserData>({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    biologicalSex: BiologicalSex.Male,
    workoutsPerWeek: 3,
    trainingType: TrainingType.Strength,
    trainingIntensity: TrainingIntensity.Moderate,
    dailyActivityLevel: DailyActivityLevel.Moderate,
    goal: Goal.Maintenance,
    sleepQuality: 3,
    stressLevel: 3,
    routineConsistency: 3,
    workoutDetails: '',
    dailyActivityDetails: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api.user.getData(token);
        if (data && data.age) {
          setFormData({
            ...data,
            workoutDetails: data.workoutDetails || '',
            dailyActivityDetails: data.dailyActivityDetails || ''
          });
        }
      } catch (err: any) {
        if (err.message === 'Unauthorized' && onLogout) onLogout();
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token, onLogout]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.user.saveData(token, formData);
      setSuccessMsg('Profile saved successfully!');
      setShowInsightPrompt(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) {
        onLogout();
        return;
      }
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setErrorMsg('');
    try {
      await api.insights.generate(token);
      setSuccessMsg('Targets recalculated successfully!');
      setShowInsightPrompt(false);
    } catch (err: any) {
      if (err.message === 'Unauthorized' && onLogout) {
        onLogout();
        return;
      }
      setErrorMsg('Data saved, but failed to generate targets.');
    } finally {
      setGenerating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' || type === 'range' ? parseFloat(value) : value
    }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-[#a7a7a7]">
      <Loader2 size={32} className="animate-spin text-[#1ed760] mb-2" />
      <p className="font-bold text-xs uppercase tracking-widest">Loading</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center text-[#a7a7a7] shadow-xl">
           <UserIcon size={32} />
        </div>
        <div>
           <span className="text-xs font-bold text-[#1ed760] uppercase tracking-widest">Profile</span>
           <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">My Account</h1>
        </div>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-[#1ed760]/10 border border-[#1ed760] text-[#1ed760] rounded-lg flex items-center gap-3 font-bold">
          <Check size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-[#e91429]/10 border border-[#e91429] text-[#e91429] rounded-lg flex items-center gap-3 font-bold">
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      {showInsightPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#181818] w-full max-w-md rounded-xl p-8 text-center border border-[#282828] shadow-2xl">
            <div className="w-16 h-16 bg-[#282828] rounded-full flex items-center justify-center mx-auto mb-6 text-[#1ed760]">
              <Target size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Recalculate Targets?</h3>
            <p className="text-[#a7a7a7] mb-8 text-sm leading-relaxed">Profile updated. Should we optimize your daily calorie and macro goals based on this new data?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleGenerateInsights} disabled={generating} className="w-full py-4 bg-[#1ed760] text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2">
                {generating ? <Loader2 className="animate-spin" /> : 'Yes, Update Targets'}
              </button>
              <button onClick={() => setShowInsightPrompt(false)} className="w-full py-4 bg-transparent text-white font-bold hover:underline transition-all">Not now</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Biometrics */}
        <div className="bg-[#181818] rounded-lg p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-[#282828] pb-4">
               <Activity className="text-[#a7a7a7]" size={20} /> Biometrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <DarkInput label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
                <DarkInput label="Weight (Kg)" name="weightKg" type="number" value={formData.weightKg} onChange={handleChange} />
                <DarkInput label="Height (Cm)" name="heightCm" type="number" value={formData.heightCm} onChange={handleChange} />
                <div className="space-y-2">
                   <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">Sex</label>
                   <select name="biologicalSex" value={formData.biologicalSex} onChange={handleChange} className="dark-select">
                      <option value={BiologicalSex.Male}>Male</option>
                      <option value={BiologicalSex.Female}>Female</option>
                   </select>
                </div>
            </div>
            <div className="mt-6">
                <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest mb-2 block">Primary Goal</label>
                <select name="goal" value={formData.goal} onChange={handleChange} className="dark-select text-[#1ed760]">
                    <option value={Goal.Maintenance}>Maintain Weight</option>
                    <option value={Goal.MuscleGain}>Gain Muscle</option>
                    <option value={Goal.WeightLoss}>Weight Loss</option>
                    <option value={Goal.Performance}>Performance</option>
                </select>
            </div>
        </div>

        {/* Section 2: Training */}
        <div className="bg-[#181818] rounded-lg p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-[#282828] pb-4">
               <Dumbbell className="text-[#a7a7a7]" size={20} /> Activity & Training
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <DarkInput label="Workouts / Week" name="workoutsPerWeek" type="number" value={formData.workoutsPerWeek} onChange={handleChange} />
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">Training Type</label>
                    <select name="trainingType" value={formData.trainingType} onChange={handleChange} className="dark-select">
                      <option value={TrainingType.Strength}>Strength</option>
                      <option value={TrainingType.Cardio}>Cardio</option>
                      <option value={TrainingType.Sports}>Sports</option>
                      <option value={TrainingType.Mixed}>Mixed</option>
                    </select>
                 </div>
            </div>
            <div className="mb-6">
                <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest mb-2 block">Daily Activity</label>
                <select name="dailyActivityLevel" value={formData.dailyActivityLevel} onChange={handleChange} className="dark-select">
                    <option value={DailyActivityLevel.Sedentary}>Sedentary (Office job, little movement)</option>
                    <option value={DailyActivityLevel.Light}>Light (Walking, standing occasionally)</option>
                    <option value={DailyActivityLevel.Moderate}>Moderate (Active job or daily movement)</option>
                    <option value={DailyActivityLevel.Active}>Active (Physical job + exercise)</option>
                    <option value={DailyActivityLevel.VeryActive}>Very Active (Athlete level)</option>
                </select>
            </div>
            <div>
               <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest mb-2 block">Routine Details</label>
               <textarea 
                  name="workoutDetails"
                  maxLength={500}
                  value={formData.workoutDetails}
                  onChange={handleChange}
                  placeholder="E.g. I do PPL split 6x a week..."
                  className="w-full bg-[#242424] text-white p-4 rounded-md outline-none focus:ring-1 focus:ring-white min-h-[100px] resize-none text-sm font-medium"
               />
            </div>
        </div>

        {/* Section 3: Lifestyle - Sliders */}
        <div className="bg-[#181818] rounded-lg p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-[#282828] pb-4">
               <Sparkles className="text-[#a7a7a7]" size={20} /> Lifestyle Factors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <RangeInput label="Sleep Quality" name="sleepQuality" value={formData.sleepQuality} onChange={handleChange} />
               <RangeInput label="Stress Levels" name="stressLevel" value={formData.stressLevel} onChange={handleChange} />
               <RangeInput label="Consistency" name="routineConsistency" value={formData.routineConsistency} onChange={handleChange} />
            </div>
        </div>

        <div className="flex justify-end pt-4">
           <button 
             type="submit" 
             disabled={saving} 
             className="bg-white hover:scale-105 active:scale-100 transition-all text-black font-bold text-lg px-12 py-4 rounded-full flex items-center gap-2"
           >
             {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
             Save Profile
           </button>
        </div>
      </form>

      <style>{`
        .dark-select { 
          width: 100%; 
          padding: 1rem; 
          background: #242424; 
          border: 1px solid transparent; 
          border-radius: 0.375rem; 
          outline: none; 
          font-weight: 600; 
          color: white;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a7a7a7%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 0.65em auto;
        }
        .dark-select:focus {
           border-color: white;
        }
      `}</style>
    </div>
  );
};

const DarkInput = ({ label, name, type, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">{label}</label>
    <input 
        type={type} 
        name={name} 
        value={value ?? ''} 
        onChange={onChange} 
        className="w-full bg-[#242424] text-white p-4 rounded-md outline-none focus:ring-1 focus:ring-white border border-transparent font-medium" 
    />
  </div>
);

const RangeInput = ({ label, name, value, onChange }: any) => (
  <div className="bg-[#242424] p-6 rounded-lg">
    <div className="flex justify-between items-center mb-4">
      <label className="text-xs font-bold text-[#a7a7a7] uppercase tracking-widest">{label}</label>
      <span className="text-white font-black text-xl">{value}/5</span>
    </div>
    <input 
        type="range" 
        min="1" 
        max="5" 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full h-1 bg-[#404040] rounded-lg appearance-none cursor-pointer accent-[#1ed760]" 
    />
    <div className="flex justify-between text-[10px] text-[#a7a7a7] font-bold mt-2 uppercase">
      <span>Poor</span>
      <span>Excellent</span>
    </div>
  </div>
);

// Helper for check icon
const Check = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

export default Profile;
