
import React, { useState, useRef, useEffect } from 'react';
import { ShapeRecord, UserProfile, ShapeAnalysisResult } from '../types';
import { Camera, Upload, ArrowRight, CheckCircle2, AlertTriangle, ActivitySquare, Scale, Moon, Dumbbell, Utensils, AlertCircle, Loader2, ImagePlus, Trophy, Zap, Shield, Sparkles, TrendingUp, BarChart3, Ruler, Calendar, History, LineChart, Lock, Crown } from 'lucide-react';
import { analyzeShapeProgress } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface ShapeCheckinProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

interface CheckinFormData {
  week: number;
  dietAdherence: 'Sim' | 'Não' | 'Parcial';
  cheatMeals: string;
  cheatFrequency: number;
  workoutFrequency: number;
  weightStart: string;
  weightEnd: string;
  sleepHours: string;
  notes: string;
}

interface CheckinImages {
  front: string | null;
  back: string | null;
  left: string | null;
  right: string | null;
}

const DAILY_FREE_LIMIT = 2; // Definido como 2 usos conforme solicitado

const ShapeCheckin: React.FC<ShapeCheckinProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkin' | 'evolution'>('checkin');
  const [step, setStep] = useState(1); // 1: Form, 2: Photos, 3: Result
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShapeAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState<string | null>(null);
  
  const history = user.shapeHistory || [];
  const nextWeek = history.length > 0 ? Math.max(...history.map(h => h.week)) + 1 : 1;

  // Lógica de Uso Gratuito (Contador)
  const today = new Date().toISOString().split('T')[0];
  const lastCheckinDate = user.usageStats?.lastShapeCheckin ? user.usageStats.lastShapeCheckin.split('T')[0] : '';
  const checkinCount = lastCheckinDate === today ? (user.usageStats?.chefGenCount || 0) : 0; // Usando chefGenCount como placeholder ou adicionando lógica específica
  
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - checkinCount);
  const isLimitReached = !user.isPremium && remainingGens <= 0;

  const [formData, setFormData] = useState<CheckinFormData>({
    week: nextWeek,
    dietAdherence: 'Sim',
    cheatMeals: '',
    cheatFrequency: 0,
    workoutFrequency: 0,
    weightStart: user.weight || '',
    weightEnd: user.weight || '',
    sleepHours: '7',
    notes: ''
  });

  const [images, setImages] = useState<CheckinImages>({
    front: null,
    back: null,
    left: null,
    right: null
  });

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof CheckinFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        } else {
            resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, side: keyof CheckinImages) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressionStatus("Otimizando foto...");
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        try {
            const resizedBase64 = await resizeImage(rawBase64);
            setImages(prev => ({ ...prev, [side]: resizedBase64 }));
        } catch (err) {
            setImages(prev => ({ ...prev, [side]: rawBase64 }));
        } finally {
            setCompressionStatus(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = () => {
    return formData.weightStart && formData.weightEnd && formData.workoutFrequency >= 0 && formData.week > 0;
  };

  const areImagesValid = () => {
    return images.front && images.back && images.left && images.right;
  };

  const handleSubmit = async () => {
    if (!areImagesValid() || isLimitReached) return;
    setIsLoading(true);
    setError(null);
    try {
        const sortedHistory = [...history].sort((a, b) => b.week - a.week);
        const previousRecord = sortedHistory[0];

        const analysisData = await analyzeShapeProgress(user, formData, images, previousRecord);
        setResult(analysisData);
        
        const newRecord: ShapeRecord = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            week: formData.week,
            weight: parseFloat(formData.weightEnd),
            photos: images,
            analysis: analysisData
        };

        setUser(prev => ({
            ...prev,
            shapeHistory: [...(prev.shapeHistory || []), newRecord],
            weight: formData.weightEnd,
            usageStats: {
                ...prev.usageStats,
                lastShapeCheckin: new Date().toISOString(),
                chefGenCount: lastCheckinDate === today ? (prev.usageStats.chefGenCount + 1) : 1
            }
        }));

        setStep(3);
    } catch (err: any) {
        setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
        setIsLoading(false);
    }
  };

  const resetForm = () => {
      setStep(1); 
      setImages({ front: null, back: null, left: null, right: null }); 
      setResult(null); 
      setError(null);
      setFormData(prev => ({ ...prev, week: prev.week + 1 }));
  };

  const StatBar = ({ label, value, color = "bg-neon-400" }: { label: string, value: number, color?: string }) => (
      <div className="mb-3">
          <div className="flex justify-between mb-1">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
              <span className="text-xs font-bold text-white">{value}/100</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
              <div className={`h-full rounded-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out`} style={{ width: `${value}%` }}></div>
          </div>
      </div>
  );

  const renderFormStep = () => (
    <div className="animate-slide-up space-y-6">
       <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ActivitySquare className="text-neon-400" /> Relatório Semanal
            </h2>
            {!user.isPremium && (
                <div className={`px-2 py-1 rounded-lg border flex flex-col items-center ${remainingGens === 0 ? 'border-red-500 bg-red-500/10' : 'border-neon-400 bg-neon-400/10'}`}>
                    <span className="text-[8px] font-bold text-white uppercase opacity-70">Restam</span>
                    <span className={`text-xs font-black ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>0{remainingGens} usos</span>
                </div>
            )}
          </div>
          
          <div className="space-y-5">
             <div>
                <label className="block text-xs font-bold text-neon-400 uppercase mb-2">Semana do Check-in</label>
                <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="number" min={1} value={formData.week} onChange={e => handleInputChange('week', parseInt(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white font-bold text-lg outline-none focus:border-neon-400" />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 pl-1">Edite se estiver enviando uma semana anterior.</p>
             </div>

             <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Seguiu a dieta e calorias?</label>
                <div className="flex gap-2">
                   {['Sim', 'Parcial', 'Não'].map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => handleInputChange('dietAdherence', opt)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${formData.dietAdherence === opt ? 'bg-neon-400 border-neon-400 text-black' : 'bg-black border-neutral-800 text-neutral-500'}`}
                      >
                        {opt}
                      </button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Furos (Qtd)</label>
                    <div className="relative">
                        <AlertCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input type="number" value={formData.cheatFrequency} onChange={e => handleInputChange('cheatFrequency', parseInt(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Treinos (Qtd)</label>
                    <div className="relative">
                        <Dumbbell size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input type="number" value={formData.workoutFrequency} onChange={e => handleInputChange('workoutFrequency', parseInt(e.target.value))} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400" />
                    </div>
                 </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">O que comeu fora?</label>
                <div className="relative">
                    <Utensils size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="text" placeholder="Ex: Pizza, Hambúrguer..." value={formData.cheatMeals} onChange={e => handleInputChange('cheatMeals', e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400 placeholder:text-neutral-700" />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Peso Início (kg)</label>
                    <div className="relative">
                        <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input type="number" value={formData.weightStart} onChange={e => handleInputChange('weightStart', e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Peso Final (kg)</label>
                    <div className="relative">
                        <Scale size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                        <input type="number" value={formData.weightEnd} onChange={e => handleInputChange('weightEnd', e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400" />
                    </div>
                 </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Sono Médio (Horas)</label>
                <div className="relative">
                    <Moon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input type="number" value={formData.sleepHours} onChange={e => handleInputChange('sleepHours', e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl p-3 pl-9 text-white outline-none focus:border-neon-400" />
                </div>
             </div>

             <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase mb-2">Observações (Opcional)</label>
                <textarea rows={3} placeholder="Ex: Retenção, cansaço, dores..." value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} className="w-full bg-black border border-neutral-800 rounded-xl p-3 text-white outline-none focus:border-neon-400 placeholder:text-neutral-700 resize-none" />
             </div>
          </div>
       </div>

       <button onClick={() => setStep(2)} disabled={!isFormValid() || isLimitReached} className={`w-full py-4 rounded-xl font-black shadow-lg transition-all flex items-center justify-center gap-2 ${isLimitReached ? 'bg-neutral-800 text-neutral-500' : 'bg-white text-black hover:bg-neutral-200'}`}>
           {isLimitReached ? <Lock size={20} /> : <ArrowRight size={20} />}
           {isLimitReached ? 'Limite Diário Atingido' : 'Próximo: Fotos'}
       </button>
       
       {isLimitReached && (
            <p className="text-[10px] text-center text-neutral-500 font-bold flex items-center justify-center gap-2 uppercase tracking-widest mt-2">
                <Sparkles size={12} className="text-yellow-400" /> Assine Premium para avaliações ilimitadas
            </p>
       )}
    </div>
  );

  const renderPhotosStep = () => (
      <div className="animate-slide-up space-y-6">
          <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-lg text-center">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Camera className="text-neon-400" /> Registro Visual</h2>
              <p className="text-neutral-400 text-sm mb-6">Use roupas íntimas ou de banho. Boa iluminação.</p>
              
              {compressionStatus && (
                  <div className="mb-4 text-xs font-bold text-neon-400 animate-pulse bg-neon-400/10 py-2 rounded-lg">{compressionStatus}</div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  {[
                      { key: 'front', label: 'Frente', ref: frontInputRef },
                      { key: 'back', label: 'Costas', ref: backInputRef },
                      { key: 'left', label: 'Perfil Esq.', ref: leftInputRef },
                      { key: 'right', label: 'Perfil Dir.', ref: rightInputRef }
                  ].map((item) => {
                      const imgKey = item.key as keyof CheckinImages;
                      return (
                          <div key={item.key} onClick={() => item.ref.current?.click()} className={`aspect-[3/4] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${images[imgKey] ? 'border-neon-400 bg-black' : 'border-neutral-700 bg-black hover:bg-neutral-800'}`}>
                              {images[imgKey] ? (
                                  <>
                                    <img src={images[imgKey]!} alt={item.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-2 right-2 bg-neon-400 text-black p-1 rounded-full"><CheckCircle2 size={16} /></div>
                                  </>
                              ) : (
                                  <>
                                    <ImagePlus size={32} className="text-neutral-600 mb-2 group-hover:text-white transition-colors" />
                                    <span className="text-xs font-bold text-neutral-500 uppercase">{item.label}</span>
                                  </>
                              )}
                              <input type="file" ref={item.ref} onChange={(e) => handleImageUpload(e, imgKey)} accept="image/*" className="hidden" />
                          </div>
                      );
                  })}
              </div>
          </div>

          {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <p className="text-red-200 text-sm font-medium">{error}</p>
              </div>
          )}

          <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-neutral-800 text-white py-4 rounded-xl font-bold border border-neutral-700 hover:bg-neutral-700">Voltar</button>
              <button onClick={handleSubmit} disabled={!areImagesValid() || isLoading || !!compressionStatus || isLimitReached} className={`flex-[2] py-4 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 transition-all ${isLimitReached ? 'bg-neutral-800 text-neutral-500' : 'bg-neon-400 text-black'}`}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <ActivitySquare />}
                  {isLoading ? 'Analisando Shape...' : 'Avaliar Agora'}
              </button>
          </div>
      </div>
  );

  const renderResultStep = () => {
    if (!result) return null;
    return (
      <div className="animate-slide-up space-y-6">
          <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-neon-400/10 to-transparent"></div>
              <div className="p-8 pt-10 text-center relative z-10">
                  <div className="inline-flex items-center gap-2 bg-black border border-neon-400/50 rounded-full px-4 py-1.5 mb-4 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                      <Trophy size={16} className="text-neon-400 animate-bounce" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">{result.title}</span>
                  </div>
                  <div className="flex justify-center mb-6">
                      <div className="w-40 h-40 rounded-full border-[6px] border-neutral-800 flex items-center justify-center relative bg-black shadow-inner">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                              <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-800" />
                              <circle 
                                cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                className="text-neon-400 drop-shadow-[0_0_10px_rgba(204,255,0,0.6)]" 
                                strokeDasharray={440} 
                                strokeDashoffset={440 - (440 * result.overallScore) / 100} 
                                strokeLinecap="round"
                              />
                          </svg>
                          <div className="text-center">
                              <span className="text-5xl font-black text-white block leading-none">{result.overallScore}</span>
                              <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Score</span>
                          </div>
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/50 rounded-2xl p-3 border border-neutral-800">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Gordura Est.</p>
                          <p className="text-xl font-black text-white">{result.estimatedBodyFat}</p>
                      </div>
                      <div className="bg-black/50 rounded-2xl p-3 border border-neutral-800">
                          <p className="text-[10px] text-neutral-400 font-bold uppercase mb-1">Massa Muscular</p>
                          <p className="text-xl font-black text-white">{result.muscleTier}</p>
                      </div>
                  </div>
              </div>
          </div>
          {result.evolutionComparison && (
             <div className="bg-gradient-to-br from-neutral-900 to-black p-6 rounded-[2rem] border border-neon-400/30 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-neon-400 font-bold uppercase text-xs tracking-wider">
                    <History size={16} /> Evolução
                </div>
                <p className="text-neutral-200 font-medium leading-relaxed italic border-l-2 border-neon-400 pl-4">{result.evolutionComparison}</p>
             </div>
          )}
          <div className="bg-neutral-900 p-6 rounded-[2rem] border border-neutral-800 shadow-lg">
              <h3 className="font-bold text-white mb-5 flex items-center gap-2 text-lg">
                  <BarChart3 className="text-neon-400" /> Atributos do Shape
              </h3>
              <div className="space-y-4">
                  <StatBar label="Definição (Cortes)" value={result.stats.definition} color="bg-cyan-400 text-cyan-400" />
                  <StatBar label="Volume Muscular" value={result.stats.volume} color="bg-red-500 text-red-500" />
                  <StatBar label="Simetria" value={result.stats.symmetry} color="bg-purple-500 text-purple-500" />
                  <StatBar label="Proporção" value={result.stats.proportions} color="bg-orange-500 text-orange-500" />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-5 rounded-[2rem] border border-neutral-800">
                  <div className="flex items-center gap-2 mb-3 text-green-400 font-bold uppercase text-xs tracking-wider">
                      <Sparkles size={16} /> Pontos Fortes
                  </div>
                  <ul className="space-y-2">
                      {result.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-neutral-300 font-medium leading-tight">• {s}</li>
                      ))}
                  </ul>
              </div>
              <div className="bg-neutral-900 p-5 rounded-[2rem] border border-neutral-800">
                  <div className="flex items-center gap-2 mb-3 text-orange-400 font-bold uppercase text-xs tracking-wider">
                      <Ruler size={16} /> A Melhorar
                  </div>
                  <ul className="space-y-2">
                      {result.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm text-neutral-300 font-medium leading-tight">• {w}</li>
                      ))}
                  </ul>
              </div>
          </div>
          <div className="bg-neutral-900 p-6 rounded-[2rem] border border-neutral-800 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-neon-400"></div>
              <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                  <TrendingUp className="text-neon-400" /> Plano de Ação
              </h3>
              <div className="space-y-3">
                   {result.actionPlan.map((action, i) => (
                       <div key={i} className="bg-black p-4 rounded-xl border border-neutral-800 flex gap-3 items-start">
                           <div className="bg-neon-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">{i+1}</div>
                           <p className="text-neutral-300 text-sm font-medium">{action}</p>
                       </div>
                   ))}
              </div>
          </div>
          <div className="bg-black p-6 rounded-[2rem] border border-neutral-800 relative">
              <div className="absolute -top-3 left-6 bg-neutral-800 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-neutral-700">Coach IA</div>
              <p className="text-neutral-300 italic text-sm leading-relaxed">"{result.coachMessage}"</p>
          </div>
          <button onClick={resetForm} className="w-full bg-white text-black py-4 rounded-xl font-bold shadow-lg hover:bg-neutral-200 transition-all">
              Nova Avaliação
          </button>
      </div>
    );
  };

  const renderEvolutionStep = () => {
      if (!history || history.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="bg-neutral-900 p-4 rounded-full mb-4 text-neutral-500"><History size={32} /></div>
                  <p className="text-neutral-400 font-medium">Nenhum histórico disponível.</p>
                  <p className="text-neutral-500 text-sm mt-1">Faça seu primeiro check-in!</p>
                  <button onClick={() => setActiveTab('checkin')} className="mt-4 bg-neon-400 text-black px-6 py-2 rounded-xl font-bold text-sm">Iniciar Check-in</button>
              </div>
          );
      }
      const sortedHistory = [...history].sort((a, b) => a.week - b.week);
      const renderChart = (label: string, dataKey: 'weight' | 'overallScore', color: string) => {
          const values = sortedHistory.map(h => (dataKey === 'overallScore' ? h.analysis.overallScore : h.weight));
          const maxVal = Math.max(...values);
          const minVal = Math.min(...values);
          const range = maxVal - minVal || 1;
          return (
              <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 mb-4">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-white flex items-center gap-2"><LineChart size={16} className={color} /> {label}</h3>
                  </div>
                  <div className="h-32 flex items-end gap-2">
                      {sortedHistory.map((h, i) => {
                          const val = dataKey === 'overallScore' ? h.analysis.overallScore : h.weight;
                          const heightPct = 20 + ((val - minVal) / range) * 80; 
                          return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                  <div className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity absolute -mt-5 font-bold">{val}</div>
                                  <div style={{ height: `${heightPct}%` }} className={`w-full max-w-[20px] rounded-t-sm transition-all ${color.replace('text', 'bg')} opacity-80 group-hover:opacity-100 relative`}></div>
                                  <span className="text-[9px] text-neutral-500">S{h.week}</span>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )
      };
      return (
          <div className="animate-slide-up space-y-6">
               <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 mb-6 flex items-center justify-between">
                   <div>
                       <p className="text-xs font-bold text-neutral-500 uppercase">Início</p>
                       <p className="text-lg font-black text-white">{sortedHistory[0].weight}kg</p>
                   </div>
                   <ArrowRight size={20} className="text-neutral-600" />
                   <div className="text-right">
                       <p className="text-xs font-bold text-neon-400 uppercase">Atual</p>
                       <p className="text-lg font-black text-white">{sortedHistory[sortedHistory.length-1].weight}kg</p>
                   </div>
               </div>
               {renderChart("Peso Corporal (kg)", "weight", "text-blue-400")}
               {renderChart("Score Estético", "overallScore", "text-neon-400")}
               <div className="space-y-3">
                   <h3 className="font-bold text-white mb-2 ml-1">Histórico Detalhado</h3>
                   {sortedHistory.slice().reverse().map((rec) => (
                       <div key={rec.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <div className="bg-black w-10 h-10 rounded-lg flex items-center justify-center font-black text-neon-400 border border-neutral-800">S{rec.week}</div>
                               <div>
                                   <p className="font-bold text-white text-sm">{rec.analysis.title}</p>
                                   <p className="text-xs text-neutral-500">{new Date(rec.date).toLocaleDateString('pt-BR')}</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="font-black text-white">{rec.analysis.overallScore}</p>
                               <p className="text-[10px] text-neutral-500 uppercase font-bold">Score</p>
                           </div>
                       </div>
                   ))}
               </div>
          </div>
      )
  };

  return (
    <div className="pb-32 bg-black min-h-screen text-white">
        <div className="bg-neutral-900 p-6 pt-8 pb-10 rounded-b-[2.5rem] shadow-lg border-b border-neutral-800 relative z-10">
            <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-2">
                SHAPE CHECK
                <span className="text-xs font-bold bg-neon-400 text-black px-2 py-0.5 rounded ml-2">BETA</span>
            </h1>
            <p className="text-neutral-400 font-medium">Acompanhamento estético quinzenal.</p>
        </div>
        <div className="px-4 -mt-6 relative z-20">
            <div className="bg-neutral-900 p-1.5 rounded-2xl flex shadow-lg mb-6 border border-neutral-800">
                <button onClick={() => setActiveTab('checkin')} className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'checkin' ? 'bg-neon-400 text-black shadow-[0_0_15px_rgba(204,255,0,0.4)]' : 'text-neutral-400 hover:text-white'}`}>
                    <Camera size={16} /> Novo Check-in
                </button>
                <button onClick={() => setActiveTab('evolution')} className={`flex-1 py-3 px-2 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'evolution' ? 'bg-neon-400 text-black shadow-[0_0_15px_rgba(204,255,0,0.4)]' : 'text-neutral-400 hover:text-white'}`}>
                    <TrendingUp size={16} /> Evolução
                </button>
            </div>
            {activeTab === 'checkin' && (
                <>
                    {step === 1 && renderFormStep()}
                    {step === 2 && renderPhotosStep()}
                    {step === 3 && renderResultStep()}
                </>
            )}
            {activeTab === 'evolution' && renderEvolutionStep()}
        </div>
    </div>
  );
};

export default ShapeCheckin;
