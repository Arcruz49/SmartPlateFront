
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserData, BiologicalSex, TrainingType, TrainingIntensity, DailyActivityLevel, Goal } from '../types';
import { Save, User as UserIcon, Settings, ChevronRight } from 'lucide-react';

interface ProfileProps {
  token: string;
}

const Profile: React.FC<ProfileProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState<UserData>({
    weightKg: 70,
    heightCm: 170,
    age: 25,
    biologicalSex: BiologicalSex.Male,
    workoutsPerWeek: 3,
    trainingType: TrainingType.Strength,
    trainingIntensity: TrainingIntensity.Moderate,
    dailyActivityLevel: DailyActivityLevel.LightlyActive,
    goal: Goal.Maintenance,
    sleepQuality: 7,
    stressLevel: 5,
    routineConsistency: 5
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api.user.getData(token);
        setFormData(data);
      } catch (err) {
        console.error('No existing profile found');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      await api.user.saveData(token, formData);
      await api.insights.generate(token); // Re-generate insights based on new data
      setSuccessMsg('Profile and insights updated successfully!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserIcon className="text-emerald-500" /> My Profile & Goals
        </h2>
        <p className="text-slate-500">Your information is used to calculate personalized nutritional targets.</p>
      </header>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-3 animate-in fade-in duration-300">
          <Save size={20} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section 1: Physical */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 pb-2 border-b">
              <ChevronRight size={18} className="text-emerald-500" /> Physical Data
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Age (Years)</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Weight (Kg)</label>
              <input type="number" name="weightKg" value={formData.weightKg} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Height (Cm)</label>
              <input type="number" name="heightCm" value={formData.heightCm} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Biological Sex</label>
              <select name="biologicalSex" value={formData.biologicalSex} onChange={handleChange} className="form-input">
                <option value={BiologicalSex.Male}>Male</option>
                <option value={BiologicalSex.Female}>Female</option>
              </select>
            </div>
          </div>

          {/* Section 2: Activity */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 pb-2 border-b">
              <ChevronRight size={18} className="text-emerald-500" /> Activity & Goals
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Weekly Workouts</label>
              <input type="number" name="workoutsPerWeek" value={formData.workoutsPerWeek} onChange={handleChange} className="form-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Activity Level</label>
              <select name="dailyActivityLevel" value={formData.dailyActivityLevel} onChange={handleChange} className="form-input">
                <option value={DailyActivityLevel.Sedentary}>Sedentary</option>
                <option value={DailyActivityLevel.LightlyActive}>Lightly Active</option>
                <option value={DailyActivityLevel.ModeratelyActive}>Moderately Active</option>
                <option value={DailyActivityLevel.VeryActive}>Very Active</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Primary Goal</label>
              <select name="goal" value={formData.goal} onChange={handleChange} className="form-input">
                <option value={Goal.WeightLoss}>Weight Loss</option>
                <option value={Goal.Maintenance}>Maintenance</option>
                <option value={Goal.MuscleGain}>Muscle Gain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Training Type</label>
              <select name="trainingType" value={formData.trainingType} onChange={handleChange} className="form-input">
                <option value={TrainingType.Strength}>Strength</option>
                <option value={TrainingType.Cardio}>Cardio</option>
                <option value={TrainingType.Crossfit}>Crossfit</option>
                <option value={TrainingType.Other}>Other</option>
              </select>
            </div>
          </div>

          {/* Section 3: Lifestyle */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2 pb-2 border-b">
              <ChevronRight size={18} className="text-emerald-500" /> Lifestyle (1-10)
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Sleep Quality: {formData.sleepQuality}</label>
              <input type="range" min="1" max="10" name="sleepQuality" value={formData.sleepQuality} onChange={handleChange} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Stress Level: {formData.stressLevel}</label>
              <input type="range" min="1" max="10" name="stressLevel" value={formData.stressLevel} onChange={handleChange} className="w-full accent-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Consistency: {formData.routineConsistency}</label>
              <input type="range" min="1" max="10" name="routineConsistency" value={formData.routineConsistency} onChange={handleChange} className="w-full accent-emerald-500" />
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Updating...' : <><Save size={20} /> Update Profile & Targets</>}
          </button>
        </div>
      </form>

      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Profile;
