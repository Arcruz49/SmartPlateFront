
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface MealLoggerProps {
  token: string;
  onSuccess: () => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ token, onSuccess }) => {
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      if (imagePreview) {
        // Remove data:image/...;base64, prefix
        imageBytes = imagePreview.split(',')[1];
      }

      await api.meals.log(token, {
        mealName,
        description,
        imageBytes: imageBytes || undefined
      });
      
      // Reset form
      setMealName('');
      setDescription('');
      setImagePreview(null);
      onSuccess();
    } catch (err) {
      setError('Failed to log meal. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Camera className="text-emerald-500" />
          Log a New Meal
        </h2>
        <p className="text-sm text-slate-500 mt-1">Snap a photo and tell us what you're eating.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Meal Name</label>
              <input
                type="text"
                required
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g., Grilled Chicken Salad"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Details (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes like ingredients, portions..."
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Photo</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer relative overflow-hidden group"
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-sm font-bold">Change Image</span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-slate-600 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center p-6 text-slate-400">
                  <Upload size={32} className="mb-2" />
                  <p className="text-sm font-medium">Click to upload image</p>
                  <p className="text-xs">Supports JPG, PNG</p>
                </div>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading || !mealName}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              loading || !mealName 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Analyzing Nutrition...
              </>
            ) : (
              <>
                <Check size={20} /> Register Meal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MealLogger;
