
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserData, BiologicalSex, TrainingType, TrainingIntensity, DailyActivityLevel, Goal } from '../types';
import { Save, User as UserIcon, Loader2, AlertCircle, Target, Sparkles, LogOut } from 'lucide-react';

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
    routineConsistency: 3
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api.user.getData(token);
        if (data && data.age) {
          setFormData(data);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <UserIcon className="text-emerald-500" size={32} /> My Profile
          </h2>
          <p className="text-slate-500 font-medium">Update your 12 biometric and lifestyle factors.</p>
        </div>
        <button 
          onClick={onLogout}
          className="md:hidden p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-2 font-bold"
        >
          <LogOut size={20} /> Logout
        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95">
            <Sparkles className="text-emerald-500 mx-auto mb-4" size={48} />
            <h3 className="text-2xl font-black text-slate-800 mb-2">Recalculate Goals?</h3>
            <p className="text-slate-500 mb-8">Profile updated! Shall we generate your new nutritional targets now?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleGenerateInsights} disabled={generating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                {generating ? <Loader2 className="animate-spin" /> : <><Target /> Generate Now</>}
              </button>
              <button onClick={() => setShowInsightPrompt(false)} className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-2xl">Keep Current Goals</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Section 1: Body */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b">Biometrics</h3>
            <div className="space-y-4">
              <FormGroup label="Age" name="age" type="number" value={formData.age} onChange={handleChange} />
              <FormGroup label="Weight (Kg)" name="weightKg" type="number" value={formData.weightKg} onChange={handleChange} />
              <FormGroup label="Height (Cm)" name="heightCm" type="number" value={formData.heightCm} onChange={handleChange} />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sex</label>
                <select name="biologicalSex" value={formData.biologicalSex} onChange={handleChange} className="form-input">
                  <option value={BiologicalSex.Male}>Male</option>
                  <option value={BiologicalSex.Female}>Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Goals */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b">Fitness & Activity</h3>
            <div className="space-y-4">
              <FormGroup label="Workouts/Week" name="workoutsPerWeek" type="number" value={formData.workoutsPerWeek} onChange={handleChange} />
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Training Type</label>
                <select name="trainingType" value={formData.trainingType} onChange={handleChange} className="form-input">
                  <option value={TrainingType.Strength}>Strength</option>
                  <option value={TrainingType.Cardio}>Cardio</option>
                  <option value={TrainingType.Sports}>Sports</option>
                  <option value={TrainingType.Mixed}>Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Training Intensity</label>
                <select name="trainingIntensity" value={formData.trainingIntensity} onChange={handleChange} className="form-input">
                  <option value={TrainingIntensity.Low}>Low</option>
                  <option value={TrainingIntensity.Moderate}>Moderate</option>
                  <option value={TrainingIntensity.High}>High</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Goal</label>
                <select name="goal" value={formData.goal} onChange={handleChange} className="form-input font-bold text-emerald-600">
                  <option value={Goal.Maintenance}>Maintain</option>
                  <option value={Goal.MuscleGain}>Gain Muscle</option>
                  <option value={Goal.WeightLoss}>Lose Fat</option>
                  <option value={Goal.Performance}>Performance</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Daily Activity</label>
                <select name="dailyActivityLevel" value={formData.dailyActivityLevel} onChange={handleChange} className="form-input">
                  <option value={DailyActivityLevel.Sedentary}>Sedentary</option>
                  <option value={DailyActivityLevel.Light}>Light</option>
                  <option value={DailyActivityLevel.Moderate}>Moderate</option>
                  <option value={DailyActivityLevel.Active}>Active</option>
                  <option value={DailyActivityLevel.VeryActive}>Very Active</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Lifestyle */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pb-2 border-b">Lifestyle (1-5)</h3>
            <div className="space-y-8">
              <RangeGroup label="Sleep Quality" name="sleepQuality" value={formData.sleepQuality} onChange={handleChange} />
              <RangeGroup label="Stress Level" name="stressLevel" value={formData.stressLevel} onChange={handleChange} />
              <RangeGroup label="Routine Consistency" name="routineConsistency" value={formData.routineConsistency} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t flex justify-end">
          <button type="submit" disabled={saving} className="w-full md:w-auto bg-slate-800 text-white font-black py-4 px-12 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50">
            {saving ? <Loader2 className="animate-spin" /> : <><Save className="inline mr-2" /> Save Profile Data</>}
          </button>
        </div>
      </form>

      <style>{`
        .form-input { width: 100%; padding: 0.75rem 1rem; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 1rem; outline: none; font-weight: 600; }
        .form-input:focus { border-color: #10b981; background: #fff; }
      `}</style>
    </div>
  );
};

const FormGroup = ({ label, name, type, value, onChange }: any) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} className="form-input" />
  </div>
);

const RangeGroup = ({ label, name, value, onChange }: any) => (
  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
    <div className="flex justify-between items-center mb-3">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      <span className="bg-white px-3 py-1 rounded-lg border text-emerald-600 font-black">{value}</span>
    </div>
    <input type="range" min="1" max="5" name={name} value={value} onChange={onChange} className="w-full accent-emerald-500" />
    <div className="flex justify-between text-[9px] font-bold text-slate-300 mt-2"><span>POOR</span><span>EXCELLENT</span></div>
  </div>
);

export default Profile;
