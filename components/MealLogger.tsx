
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, CalendarClock, Sparkles, Settings2, Flame, Target, Zap, Coffee, Image as ImageIcon, Barcode, ScanLine } from 'lucide-react';
import { api } from '../services/api';
import { Html5Qrcode } from 'html5-qrcode';

interface MealLoggerProps {
  token: string;
  onSuccess: () => void;
  onLogout?: () => void;
}

const MealLogger: React.FC<MealLoggerProps> = ({ token, onSuccess, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual' | 'barcode'>('ai');
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  
  // Barcode specific state
  const [isScanning, setIsScanning] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const scannerContainerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

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
  
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Barcode Scanning Logic
  useEffect(() => {
    if (activeTab === 'barcode' && isScanning && scannerContainerRef.current) {
      startScanner();
    } else {
      stopScanner();
    }
    // Fix: Return a function that doesn't return the promise from stopScanner
    return () => {
      stopScanner();
    };
  }, [isScanning, activeTab]);

  const startScanner = async () => {
    setScannerLoading(true);
    setError(null);
    try {
      if (scannerRef.current) await scannerRef.current.stop();
      
      const scanner = new Html5Qrcode("barcode-scanner-viewport");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        async (decodedText) => {
          await handleBarcodeScanned(decodedText);
        },
        (errorMessage) => {
          // Silent for scanning failures as they happen every frame
        }
      );
    } catch (err) {
      console.error("Scanner failed", err);
      setError("Could not access camera for scanning.");
      setIsScanning(false);
    } finally {
      setScannerLoading(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  const handleBarcodeScanned = async (code: string) => {
    setIsScanning(false); // Stop UI
    setLoading(true); // Loading API
    setError(null);
    
    try {
      const data = await api.meals.getByBarcode(token, code);
      setMealName(data.mealName || '');
      setDescription(data.description || '');
      setManualMacros({
        calories: data.calories,
        protein: data.protein_g,
        carbs: data.carbs_g,
        fat: data.fat_g
      });
      // Once data is loaded, we stay in the barcode tab but show the form
    } catch (err: any) {
      setError("Product not found in barcode database. Please try manual entry.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setShowSourceSelector(false);
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
        // Works for both Manual and Barcode-Confirmed entries
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
      
      resetForm();
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

  const resetForm = () => {
    setMealName('');
    setDescription('');
    setMealDateTime(getNowFormatted());
    setImagePreview(null);
    setManualMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    setIsScanning(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-2xl shadow-lg shadow-emerald-200">
              {activeTab === 'ai' ? <Sparkles size={24} /> : activeTab === 'manual' ? <Settings2 size={24} /> : <Barcode size={24} />}
            </div>
            Log Meal
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Record your daily intake easily.</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-2xl w-full lg:w-fit overflow-x-auto no-scrollbar">
          <button 
            type="button"
            onClick={() => { setActiveTab('ai'); setIsScanning(false); }}
            className={`flex-1 lg:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Sparkles size={14} /> AI
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('barcode'); setIsScanning(false); }}
            className={`flex-1 lg:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'barcode' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Barcode size={14} /> Barcode
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('manual'); setIsScanning(false); }}
            className={`flex-1 lg:flex-none whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings2 size={14} /> Manual
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-in shake duration-500 text-center">
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
                <CalendarClock size={12} className="text-slate-400" /> Date & Time
              </label>
              <div className="relative group">
                <input
                  type="datetime-local"
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
                  rows={4}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:bg-white bg-slate-50 outline-none transition-all font-bold resize-none pr-4 pb-8"
                />
                <span className={`absolute bottom-3 right-4 text-[9px] font-bold ${description.length >= 2000 ? 'text-red-500' : 'text-slate-300'}`}>
                  {description.length}/2000
                </span>
              </div>
            </div>
          </div>

          <div>
            {activeTab === 'ai' && (
              <>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Photo Upload</label>
                <div 
                  onClick={() => !imagePreview && setShowSourceSelector(true)}
                  className={`w-full h-[330px] flex flex-col items-center justify-center border-4 border-dashed rounded-3xl transition-all relative overflow-hidden group ${
                    imagePreview ? 'border-emerald-500' : 'border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/30 cursor-pointer'
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer" onClick={() => setShowSourceSelector(true)}>
                        <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                        className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-xl text-slate-600 hover:text-red-500 transition-all z-10"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center p-8 text-slate-300 group-hover:text-emerald-500 transition-colors">
                      <Camera size={40} className="mb-4" />
                      <p className="text-sm font-black uppercase tracking-widest">Add Meal Photo</p>
                      <p className="text-[10px] mt-2 font-bold opacity-50">Camera or Gallery</p>
                    </div>
                  )}
                </div>
                
                {/* Hidden Inputs */}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  ref={galleryInputRef} 
                  onChange={handleFileChange} 
                />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment" 
                  ref={cameraInputRef} 
                  onChange={handleFileChange} 
                />
              </>
            )}

            {activeTab === 'barcode' && (
              <div className="space-y-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Barcode Scanner</label>
                
                {!isScanning && !mealName ? (
                  <button 
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="w-full h-[330px] flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-slate-300 hover:text-emerald-600 group"
                  >
                    <div className="bg-slate-50 text-slate-300 p-6 rounded-3xl group-hover:bg-emerald-100 group-hover:text-emerald-600 group-hover:scale-110 transition-all mb-4">
                      <Barcode size={48} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">Start Scanning</span>
                    <p className="text-[10px] font-bold opacity-50 mt-2 text-center px-6">Point camera at product barcode to fetch nutritional facts.</p>
                  </button>
                ) : isScanning ? (
                  <div className="w-full h-[330px] bg-black rounded-3xl overflow-hidden relative shadow-2xl border-4 border-emerald-500/30">
                    <div id="barcode-scanner-viewport" className="w-full h-full"></div>
                    {scannerLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                        <Loader2 className="animate-spin text-white" size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      <div className="w-full h-full relative flex flex-col items-center justify-center">
                        <div className="w-[80%] h-[40%] border-2 border-emerald-500/50 rounded-2xl relative">
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl"></div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl"></div>
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl"></div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl"></div>
                          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-emerald-500/50 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                        </div>
                        <p className="mt-8 text-white font-black text-[10px] uppercase tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full backdrop-blur">Center barcode in frame</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setIsScanning(false)}
                      className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-2xl text-white transition-all z-20"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-2 rounded-xl">
                        <Check size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Product Found</p>
                        <p className="text-xs font-bold text-slate-700">Data pre-filled below</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { resetForm(); setIsScanning(true); }}
                        className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest bg-white px-3 py-2 rounded-xl shadow-sm border border-emerald-100"
                      >
                        Rescan
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <MacroInput label="Calories" icon={<Flame size={16} />} value={manualMacros.calories} unit="kcal" onChange={(v:number) => setManualMacros({...manualMacros, calories: v})} color="text-orange-500" bg="bg-orange-50" />
                      <MacroInput label="Protein" icon={<Target size={16} />} value={manualMacros.protein} unit="g" onChange={(v:number) => setManualMacros({...manualMacros, protein: v})} color="text-blue-500" bg="bg-blue-50" />
                      <MacroInput label="Carbs" icon={<Zap size={16} />} value={manualMacros.carbs} unit="g" onChange={(v:number) => setManualMacros({...manualMacros, carbs: v})} color="text-purple-500" bg="bg-purple-50" />
                      <MacroInput label="Fats" icon={<Coffee size={16} />} value={manualMacros.fat} unit="g" onChange={(v:number) => setManualMacros({...manualMacros, fat: v})} color="text-amber-600" bg="bg-amber-50" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nutritional Values</label>
                <div className="grid grid-cols-2 gap-4">
                  <MacroInput 
                    label="Calories" 
                    icon={<Flame size={16} />} 
                    value={manualMacros.calories} 
                    unit="kcal"
                    onChange={(val: number) => setManualMacros({...manualMacros, calories: val})} 
                    color="text-orange-500"
                    bg="bg-orange-50"
                  />
                  <MacroInput 
                    label="Protein" 
                    icon={<Target size={16} />} 
                    value={manualMacros.protein} 
                    unit="g"
                    onChange={(val: number) => setManualMacros({...manualMacros, protein: val})} 
                    color="text-blue-500"
                    bg="bg-blue-50"
                  />
                  <MacroInput 
                    label="Carbs" 
                    icon={<Zap size={16} />} 
                    value={manualMacros.carbs} 
                    unit="g"
                    onChange={(val: number) => setManualMacros({...manualMacros, carbs: val})} 
                    color="text-purple-500"
                    bg="bg-purple-50"
                  />
                  <MacroInput 
                    label="Fats" 
                    icon={<Coffee size={16} />} 
                    value={manualMacros.fat} 
                    unit="g"
                    onChange={(val: number) => setManualMacros({...manualMacros, fat: val})} 
                    color="text-amber-600"
                    bg="bg-amber-50"
                  />
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
                <Check size={24} /> Log Record
              </>
            )}
          </button>
        </div>
      </form>

      {/* Image Source Selector Modal (Mobile Action Sheet Style) */}
      {showSourceSelector && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full md:max-w-sm rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-slate-800">Add Meal Photo</h3>
                 <button onClick={() => setShowSourceSelector(false)} className="text-slate-400 hover:text-slate-600">
                   <X size={24} />
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 <button 
                   onClick={() => cameraInputRef.current?.click()}
                   className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-50 text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-100 transition-all text-left group"
                 >
                    <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                       <Camera size={24} />
                    </div>
                    <div>
                       <p className="font-black text-sm">Tirar Foto Agora</p>
                       <p className="text-[10px] font-bold opacity-60">Usa a câmera do dispositivo</p>
                    </div>
                 </button>

                 <button 
                   onClick={() => galleryInputRef.current?.click()}
                   className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 text-slate-700 border-2 border-slate-100 hover:bg-slate-100 transition-all text-left group"
                 >
                    <div className="bg-slate-200 text-slate-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                       <ImageIcon size={24} />
                    </div>
                    <div>
                       <p className="font-black text-sm">Escolher da Galeria</p>
                       <p className="text-[10px] font-bold opacity-60">Escolha uma foto salva</p>
                    </div>
                 </button>
              </div>

              <button 
                onClick={() => setShowSourceSelector(false)}
                className="w-full mt-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs"
              >
                Cancelar
              </button>
           </div>
        </div>
      )}
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
