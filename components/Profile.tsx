
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserData, BiologicalSex, TrainingType, TrainingIntensity, DailyActivityLevel, Goal } from '../types';
import { Save, User as UserIcon, Loader2, AlertCircle, Target, Sparkles, LogOut, Dumbbell, CalendarDays } from 'lucide-react';

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
        console.warn('Profile not found or error loading data.');
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
      setSuccessMsg('Nutritional targets calculated!');
      setShowInsightPrompt(false);
      setTimeout(() => setSuccessMsg(''), 5000);
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
    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
      <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
      <p className="font-medium">Loading profile...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-20 px-4 md:px-0">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600">
            <UserIcon size={32} />
          </div>
          My Profile
        </h2>
        <p className="text-slate-500 font-medium ml-1">Update your biometrics and lifestyle details for AI analysis.</p>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm">
          <Save size={18} /> <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle size={20} /> <span className="font-bold">{errorMsg}</span>
        </div>
      )}

      {showInsightPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-500">
              <Sparkles size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3">Recalculate Targets?</h3>
            <p className="text-slate-500 mb-8 font-medium">Profile updated! Shall we generate your new nutritional targets based on the fresh data?</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleGenerateInsights} disabled={generating} className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-100">
                {generating ? <Loader2 className="animate-spin" /> : <><Target /> Generate Now</>}
              </button>
              <button onClick={() => setShowInsightPrompt(false)} className="w-full h-14 bg-slate-50 text-slate-500 font-bold rounded-2xl hover:bg-slate-100 transition-colors">Keep Current Targets</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8 md:p-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Section 1: Body */}
          <div className="space-y-8">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.25em] pb-3 border-b border-slate-50">Biometrics</h3>
            <div className="grid grid-cols-2 gap-5">
              <FormGroup label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
              <FormGroup label="Weight (Kg)" name="weightKg" type="number" value={formData.weightKg} onChange={handleChange} />
              <FormGroup label="Height (Cm)" name="heightCm" type="number" value={formData.heightCm} onChange={handleChange} />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Biological Sex</label>
                <select name="biologicalSex" value={formData.biologicalSex} onChange={handleChange} className="form-input">
                  <option value={BiologicalSex.Male}>Male</option>
                  <option value={BiologicalSex.Female}>Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Primary Goal</label>
              <select name="goal" value={formData.goal} onChange={handleChange} className="form-input font-bold text-emerald-600">
                <option value={Goal.Maintenance}>Maintain Weight</option>
                <option value={Goal.MuscleGain}>Gain Muscle</option>
                <option value={Goal.WeightLoss}>Weight Loss</option>
                <option value={Goal.Performance}>Performance</option>
              </select>
            </div>
          </div>

          {/* Section 2: Physical Activity */}
          <div className="space-y-8">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.25em] pb-3 border-b border-slate-50">Physical Activity</h3>
            <div className="grid grid-cols-2 gap-5">
              <FormGroup label="Workouts/Week" name="workoutsPerWeek" type="number" value={formData.workoutsPerWeek} onChange={handleChange} />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Training Type</label>
                <select name="trainingType" value={formData.trainingType} onChange={handleChange} className="form-input">
                  <option value={TrainingType.Strength}>Strength</option>
                  <option value={TrainingType.Cardio}>Cardio</option>
                  <option value={TrainingType.Sports}>Sports</option>
                  <option value={TrainingType.Mixed}>Mixed</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Daily Activity Level</label>
              <select name="dailyActivityLevel" value={formData.dailyActivityLevel} onChange={handleChange} className="form-input">
                <option value={DailyActivityLevel.Sedentary}>Sedentary</option>
                <option value={DailyActivityLevel.Light}>Light</option>
                <option value={DailyActivityLevel.Moderate}>Moderate</option>
                <option value={DailyActivityLevel.Active}>Active</option>
                <option value={DailyActivityLevel.VeryActive}>Very Active</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                <Dumbbell size={14} className="text-slate-300" /> Workout Details
              </label>
              <div className="relative">
                <textarea 
                  name="workoutDetails"
                  maxLength={500}
                  value={formData.workoutDetails}
                  onChange={handleChange}
                  placeholder="Describe your training routine (e.g., Push/Pull/Legs, Heavy weights, 60min sessions...)"
                  className="form-input min-h-[100px] resize-none text-sm font-medium pr-10"
                />
                <span className={`absolute bottom-3 right-3 text-[9px] font-bold ${(formData.workoutDetails || '').length >= 500 ? 'text-red-500' : 'text-slate-300'}`}>
                  {(formData.workoutDetails || '').length}/500
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Lifestyle & Routine */}
        <div className="space-y-8">
          <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.25em] pb-3 border-b border-slate-50">Lifestyle & Routine</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <div className="space-y-8">
                <RangeGroup label="Sleep Quality" name="sleepQuality" value={formData.sleepQuality} onChange={handleChange} />
                <RangeGroup label="Stress Level" name="stressLevel" value={formData.stressLevel} onChange={handleChange} />
                <RangeGroup label="Routine Consistency" name="routineConsistency" value={formData.routineConsistency} onChange={handleChange} />
             </div>

             <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  <CalendarDays size={14} className="text-slate-300" /> Daily Activity Details
                </label>
                <div className="relative">
                  <textarea 
                    name="dailyActivityDetails"
                    maxLength={500}
                    value={formData.dailyActivityDetails}
                    onChange={handleChange}
                    placeholder="Describe your daily routine (e.g., Office job, walk 5km to work, stand most of the day...)"
                    className="form-input min-h-[150px] lg:min-h-[280px] resize-none text-sm font-medium pr-10"
                  />
                  <span className={`absolute bottom-3 right-3 text-[9px] font-bold ${(formData.dailyActivityDetails || '').length >= 500 ? 'text-red-500' : 'text-slate-300'}`}>
                    {(formData.dailyActivityDetails || '').length}/500
                  </span>
                </div>
             </div>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-50 flex flex-col md:flex-row gap-4 items-center">
          <button 
            type="submit" 
            disabled={saving} 
            className="w-full md:w-auto md:ml-auto h-16 md:px-12 bg-slate-900 text-white font-black rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 order-1"
          >
            {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Profile</>}
          </button>

          <button 
            type="button"
            onClick={onLogout}
            className="md:hidden w-full h-16 bg-red-50 text-red-600 font-black rounded-2xl border-2 border-red-100/50 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm order-2"
          >
            <div className="p-2 bg-red-100/30 rounded-xl">
              <LogOut size={20} />
            </div>
            Logout of my account
          </button>
        </div>
      </form>

      <style>{`
        .form-input { 
          width: 100%; 
          padding: 0.875rem 1.25rem; 
          background: #f8fafc; 
          border: 2.5px solid #f1f5f9; 
          border-radius: 1.25rem; 
          outline: none; 
          font-weight: 700; 
          color: #1e293b;
          transition: all 0.2s;
        }
        .form-input:focus { border-color: #10b981; background: #fff; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.05); }
      `}</style>
    </div>
  );
};

const FormGroup = ({ label, name, type, value, onChange }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{label}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} className="form-input" />
  </div>
);

const RangeGroup = ({ label, name, value, onChange }: any) => (
  <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
    <div className="flex justify-between items-center mb-5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <span className="bg-white px-4 py-1.5 rounded-xl border-2 border-slate-100 text-emerald-600 font-black shadow-sm text-sm">{value}</span>
    </div>
    <input type="range" min="1" max="5" name={name} value={value} onChange={onChange} className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
    <div className="flex justify-between text-[9px] font-black text-slate-300 mt-3 tracking-widest uppercase">
      <span>Low</span>
      <span>Excellent</span>
    </div>
  </div>
);

export default Profile;
