
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, AlertTriangle, Info, Lock, Sparkles } from 'lucide-react';
import { analyzeFoodImage } from '../services/geminiService';
import { FoodAnalysis, UserProfile } from '../types';
import { useNavigate } from 'react-router-dom';

interface ScanFoodProps {
  user: UserProfile;
  setUser?: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const DAILY_FREE_LIMIT = 3;

const ScanFood: React.FC<ScanFoodProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Freemium Logic
  const today = new Date().toISOString().split('T')[0];
  const usage = user.usageStats || { lastScanDate: '', scanCount: 0 };
  const dailyCount = usage.lastScanDate === today ? usage.scanCount : 0;
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user.isPremium && remainingGens === 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLimitReached) {
        navigate('/premium');
        return;
    }

    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        handleAnalyze(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (base64Img: string) => {
    setLoading(true); setError(null); setResult(null);
    const base64Data = base64Img.split(',')[1];
    try {
      const analysis = await analyzeFoodImage(base64Data, Array.isArray(user.goal) ? user.goal : [user.goal]);
      setResult(analysis);
      
      // Update Usage Stats
      if (setUser) {
          setUser(prev => ({
              ...prev,
              usageStats: {
                  ...prev.usageStats,
                  lastScanDate: today,
                  scanCount: (prev.usageStats.lastScanDate === today ? prev.usageStats.scanCount : 0) + 1
              }
          }));
      }
      
    } catch (err) { setError("Erro ao analisar imagem."); } finally { setLoading(false); }
  };

  const resetScan = () => { setImage(null); setResult(null); setError(null); };

  return (
    <div className="pb-24 min-h-screen bg-black text-white">
      <div className="bg-neutral-900 p-4 sticky top-0 z-10 shadow-lg border-b border-neutral-800 flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold">Meta Scan IA</h1>
            <p className="text-neutral-500 text-sm">Descubra o que você está comendo</p>
        </div>
        
        {!user.isPremium && (
            <div className="bg-neutral-800 border border-neutral-700 px-2 py-1.5 rounded-lg flex flex-col items-center">
                <span className="text-[9px] text-neutral-400 font-bold uppercase">Restam</span>
                <span className={`text-base font-black leading-none ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>
                    {remainingGens}
                </span>
            </div>
        )}
      </div>

      <div className="p-4">
        {!image ? (
          <div className="flex flex-col items-center justify-center h-[60vh] border-2 border-dashed border-neutral-800 rounded-3xl bg-neutral-900 m-4">
            <div className="text-center p-8">
              <div className="bg-black border border-neon-400 p-6 rounded-full inline-block mb-6 shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                <Camera size={48} className="text-neon-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Tirar foto do alimento</h3>
              <p className="text-neutral-500 mb-6">Identifique calorias e macros</p>
              
              <button 
                onClick={() => {
                    if (isLimitReached) navigate('/premium');
                    else fileInputRef.current?.click();
                }}
                className={`font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(204,255,0,0.4)] transition-all flex items-center gap-2 mx-auto ${isLimitReached ? 'bg-neutral-800 text-neutral-500' : 'bg-neon-400 text-black hover:bg-neon-500'}`}
              >
                {isLimitReached ? <Lock size={20} /> : <Upload size={20} />} 
                {isLimitReached ? 'Limite Atingido' : 'Selecionar Foto'}
              </button>
              
              {isLimitReached && (
                <p className="text-xs text-center text-neutral-500 mt-4 flex items-center justify-center gap-1 cursor-pointer hover:text-neon-400 transition-colors" onClick={() => navigate('/premium')}>
                    <Sparkles size={12} /> Quer mais? Seja Premium.
                </p>
              )}

              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLimitReached} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-lg max-h-80 mx-auto border border-neutral-800">
              <img src={image} alt="Food Preview" className="w-full h-full object-cover" />
              {!loading && <button onClick={resetScan} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black">✕</button>}
            </div>

            {loading && (
              <div className="bg-neutral-900 p-8 rounded-3xl shadow-sm text-center border border-neutral-800">
                <Loader2 className="animate-spin text-neon-400 mx-auto mb-4" size={40} />
                <p className="text-lg font-medium text-white">Analisando alimento...</p>
                <p className="text-sm text-neutral-500">Calculando macros e benefícios</p>
              </div>
            )}

            {result && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-800">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase">{result.foodName}</h2>
                            <p className="text-neutral-400">{result.portionSize}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-bold ${result.isHealthy ? 'bg-black text-neon-400 border border-neon-400' : 'bg-black text-orange-500 border border-orange-500'}`}>
                            {result.isHealthy ? 'Saudável' : 'Moderado'}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center mb-6">
                        {['Kcal', 'Carb', 'Prot', 'Gord'].map((label, idx) => (
                            <div key={label} className="bg-black p-3 rounded-2xl border border-neutral-800">
                                <div className="text-xs text-neutral-500 font-bold uppercase">{label}</div>
                                <div className="text-lg font-black text-white">{[result.calories, result.macros.carbs, result.macros.protein, result.macros.fats][idx]}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-4">
                        <h4 className="font-bold text-neutral-300 mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-neon-400" /> Benefícios</h4>
                        <ul className="text-sm text-neutral-400 space-y-1 pl-7 list-disc">
                            {result.benefits.map((b, i) => <li key={i}>{b}</li>)}
                        </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-black border border-neutral-800">
                        <h4 className="font-bold text-sm mb-1 flex items-center gap-2 text-white">
                            {result.isHealthy ? <Info size={16} className="text-neon-400"/> : <AlertTriangle size={16} className="text-orange-500"/>} Análise
                        </h4>
                        <p className="text-sm text-neutral-400 leading-relaxed">{result.suitability}</p>
                    </div>
                </div>
                <button onClick={resetScan} className="w-full py-4 bg-white text-black rounded-2xl font-bold shadow-lg hover:bg-neutral-200 transition-colors">Escanear Outro</button>
              </div>
            )}

            {error && (
                <div className="bg-red-900/20 text-red-500 p-4 rounded-2xl text-center border border-red-900/50">
                    <p>{error}</p>
                    <button onClick={resetScan} className="mt-2 font-bold underline">Tentar Novamente</button>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanFood;
