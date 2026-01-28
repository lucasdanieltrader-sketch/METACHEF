
import React, { useState } from 'react';
import { UserProfile, WorkoutItem, WorkoutJourney, WorkoutRoutine, WorkoutPhase, HealthGoal } from '../types';
import { Dumbbell, Timer, Zap, Youtube, ChevronRight, Lock, Trophy, RotateCcw, X, Loader2, Target, Calendar, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { generateSpecificWorkout, generateWorkoutJourney } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface WorkoutProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const DAILY_FREE_LIMIT = 3;

const Workout: React.FC<WorkoutProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'daily' | 'general' | 'specific'>('daily');
  const [muscleInput, setMuscleInput] = useState(user.lastSpecificWorkout?.target || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showJourneyCreator, setShowJourneyCreator] = useState(false);
  const [journeyGoal, setJourneyGoal] = useState('');
  const [journeyDuration, setJourneyDuration] = useState('90 Dias');
  const [isCreatingJourney, setIsCreatingJourney] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);

  const dailyWorkout = user.dietPlan?.dailyWorkout;
  const workoutJourney = user.workoutJourney;
  const specificWorkout = user.lastSpecificWorkout?.exercises || null;

  const today = new Date().toISOString().split('T')[0];
  const usage = user.usageStats || { lastWorkoutGenDate: '', workoutGenCount: 0 };
  const dailyCount = usage.lastWorkoutGenDate === today ? usage.workoutGenCount : 0;
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user.isPremium && remainingGens <= 0;

  const getLevelStyles = (level: number, isPremium?: boolean) => {
    if (isPremium) return { border: 'border-yellow-400', shadow: 'shadow-glow', icon: 'text-yellow-400', bg: 'bg-yellow-900/20', textColor: 'text-yellow-400' };
    return { border: 'border-neutral-700', shadow: 'shadow-none', icon: 'text-neutral-500', bg: 'bg-neutral-800', textColor: 'text-neutral-400' };
  };

  const levelStyle = getLevelStyles(user.level || 1, user.isPremium);

  const findMatchingRoutine = (scheduleText: string, detailedRoutines: WorkoutRoutine[] = []): WorkoutRoutine | null => {
      if (!scheduleText || !detailedRoutines || detailedRoutines.length === 0) return null;
      const normalizedSchedule = scheduleText.toLowerCase();
      if (normalizedSchedule.includes('descanso') || normalizedSchedule.includes('rest')) return null;

      let match = detailedRoutines.find(r => 
        normalizedSchedule.includes((r.key || "").toLowerCase()) || 
        normalizedSchedule.includes((r.title || "").toLowerCase())
      );
      
      return match || detailedRoutines[0] || null;
  };

  const handleScheduleClick = (scheduleText: string, detailedRoutines?: WorkoutRoutine[]) => {
      if (!scheduleText || !detailedRoutines) return;
      const routine = findMatchingRoutine(scheduleText, detailedRoutines);
      if (routine) setSelectedRoutine(routine);
  };

  const handleWeekToggle = (phaseIdx: number, weekNum: number) => {
    if (!workoutJourney) return;

    const newJourney = { ...workoutJourney };
    const phase = newJourney.phases[phaseIdx];
    
    if (weekNum === phase.completedWeeks + 1) {
        phase.completedWeeks = weekNum;
        if (phase.completedWeeks === phase.totalWeeks) {
            if (phaseIdx + 1 < newJourney.phases.length) {
                newJourney.phases[phaseIdx + 1].isUnlocked = true;
                alert(`🔥 FASE CONCLUÍDA! Você desbloqueou: ${newJourney.phases[phaseIdx+1].levelName}`);
            }
        }
    } else if (weekNum === phase.completedWeeks) {
        phase.completedWeeks = Math.max(0, weekNum - 1);
    }

    setUser(prev => ({ 
        ...prev, 
        workoutJourney: newJourney,
        level: Math.max(prev.level, phaseIdx + 1 + (phase.completedWeeks / phase.totalWeeks >= 1 ? 1 : 0))
    }));
  };

  const handleCreateJourney = async () => {
    if (!journeyGoal) return;
    if (isLimitReached) {
        navigate('/premium');
        return;
    }
    setIsCreatingJourney(true);
    try {
        const journey = await generateWorkoutJourney(journeyGoal, journeyDuration, user);
        if (journey.phases.length > 0) journey.phases[0].isUnlocked = true;
        setUser(prev => ({ 
            ...prev, 
            workoutJourney: journey,
            usageStats: {
                ...prev.usageStats,
                lastWorkoutGenDate: today,
                workoutGenCount: dailyCount + 1
            }
        }));
        setShowJourneyCreator(false);
    } catch (error) {
        alert("Erro ao criar jornada.");
    } finally {
        setIsCreatingJourney(false);
    }
  };

  const handleGenerateSpecific = async () => {
    if (!muscleInput || isLimitReached) return;
    setIsGenerating(true);
    try {
        const exercises = await generateSpecificWorkout(muscleInput, user);
        setUser(prev => ({
            ...prev,
            lastSpecificWorkout: { target: muscleInput, exercises },
            usageStats: {
                ...prev.usageStats,
                lastWorkoutGenDate: today,
                workoutGenCount: dailyCount + 1
            }
        }));
    } catch (error) {
        alert("Erro ao gerar treino.");
    } finally {
        setIsGenerating(false);
    }
  };

  const renderExerciseCard = (ex: WorkoutItem, idx: number) => (
    <div key={idx} className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800 mb-4 animate-fade-in relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-neon-400 opacity-50 group-hover:opacity-100"></div>
        <div className="flex justify-between items-start mb-3 pl-2">
            <h4 className="font-bold text-lg text-white">{ex.name}</h4>
            <div className="flex flex-col items-end gap-1">
                 <span className="text-[10px] font-bold bg-neutral-800 text-neutral-300 px-2 py-1 rounded border border-neutral-700">{ex.duration}</span>
                 <span className="text-[10px] font-bold bg-neutral-800 text-neon-400 px-2 py-1 rounded border border-neon-400/20">{ex.intensity}</span>
            </div>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed mb-4 pl-2 border-l border-neutral-800">{ex.description}</p>
        <button 
            onClick={() => window.open(`https://www.youtube.com/results?search_query=execução ${encodeURIComponent(ex.name)}`, '_blank')}
            className="w-full bg-neutral-800 text-neutral-300 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all"
        >
            <Youtube size={16} /> Ver execução
        </button>
    </div>
  );

  return (
    <div className="pb-28 min-h-screen bg-black text-white">
       {/* Modal de Rotina */}
       {selectedRoutine && (
           <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-neutral-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-neon-400 shadow-2xl h-[80vh] flex flex-col overflow-hidden">
                   <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                       <div>
                           <h3 className="text-xl font-black text-white">{selectedRoutine.key || 'Rotina'}</h3>
                           <p className="text-sm text-neutral-400">{selectedRoutine.title}</p>
                       </div>
                       <button onClick={() => setSelectedRoutine(null)} className="p-2 bg-neutral-800 rounded-full"><X size={20} /></button>
                   </div>
                   <div className="overflow-y-auto p-6 flex-1 bg-black no-scrollbar">
                       {selectedRoutine.exercises?.map((ex, i) => renderExerciseCard(ex, i))}
                   </div>
               </div>
           </div>
       )}

       {/* Header */}
       <div className={`p-8 pb-12 rounded-b-[2.5rem] relative overflow-hidden border-b transition-all duration-500 ${levelStyle.bg} ${levelStyle.border} ${levelStyle.shadow}`}>
            <h1 className="text-3xl font-black mb-1 flex items-center gap-2">
                <Dumbbell className={levelStyle.icon} size={32} />
                META GYM
            </h1>
            <p className="text-neutral-400 font-medium text-sm">Nível {user.level || 1}</p>
       </div>

       <div className="px-4 -mt-8 relative z-20">
            <div className="bg-neutral-900 p-1.5 rounded-2xl flex shadow-lg mb-6 border border-neutral-800">
                <button onClick={() => setActiveTab('daily')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'daily' ? 'bg-neon-400 text-black shadow-neon' : 'text-neutral-500'}`}>Diário</button>
                <button onClick={() => setActiveTab('general')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'general' ? 'bg-neon-400 text-black shadow-neon' : 'text-neutral-500'}`}>Jornada</button>
                <button onClick={() => setActiveTab('specific')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'specific' ? 'bg-neon-400 text-black shadow-neon' : 'text-neutral-500'}`}>Específico</button>
            </div>

            {activeTab === 'daily' && (
                <div className="animate-slide-up space-y-4">
                    {dailyWorkout ? (
                        <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white">{dailyWorkout.title}</h2>
                                <span className="bg-neon-400 text-black px-3 py-1 rounded-full text-xs font-bold">Hoje</span>
                            </div>
                            <div className="space-y-4">
                                {dailyWorkout.exercises.map((ex, i) => renderExerciseCard(ex, i))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-neutral-900 rounded-3xl p-10 text-center border border-neutral-800 border-dashed">
                            <Calendar size={48} className="text-neutral-700 mx-auto mb-4" />
                            <p className="text-neutral-500 font-medium">Nenhum treino diário gerado no seu plano nutricional.</p>
                            <button onClick={() => navigate('/diet-plan')} className="mt-4 text-neon-400 font-bold uppercase text-xs tracking-widest">Ver Plano Nutricional</button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'general' && (
                <div className="animate-slide-up">
                    {!workoutJourney && !showJourneyCreator ? (
                        <div className="bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-800 shadow-xl">
                            <Trophy size={48} className="text-neon-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Inicie sua Jornada</h2>
                            <p className="text-neutral-500 text-sm mb-6">Um plano de longo prazo adaptado ao seu objetivo.</p>
                            <button onClick={() => setShowJourneyCreator(true)} className="w-full bg-neon-400 text-black font-black py-4 rounded-xl shadow-glow">Criar Jornada IA</button>
                        </div>
                    ) : showJourneyCreator ? (
                        <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 animate-fade-in shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Target size={20} className="text-neon-400" /> Escolha sua Meta
                                </h2>
                                {!user.isPremium && (
                                    <div className={`px-2 py-1 rounded-lg border flex flex-col items-center ${remainingGens === 0 ? 'border-red-500 bg-red-500/10' : 'border-neon-400 bg-neon-400/10'}`}>
                                        <span className="text-[8px] font-bold text-white uppercase opacity-70">Restam</span>
                                        <span className={`text-xs font-black ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>0{remainingGens} usos</span>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 mb-8 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                                {[
                                    { id: 'cutting', label: 'Definição Extrema', icon: '🔥' },
                                    { id: 'bulking', label: 'Ganho de Massa', icon: '💪' },
                                    { id: 'lean_bulk', label: 'Lean Bulk Avançado', icon: '🚀' },
                                    { id: 'recomp', label: 'Recompensação Corporal', icon: '🔄' },
                                    { id: 'lean_gain', label: 'Lean Gain', icon: '💎' },
                                    { id: 'gluteos', label: 'Glúteos Gigantes', icon: '🍑' },
                                    { id: 'pernas', label: 'Pernas dos Deuses', icon: '⚡' },
                                    { id: 'abs', label: 'Abdômen de Aço', icon: '🛡️' },
                                    { id: 'comp', label: 'Fisiculturismo/Competição', icon: '🏆' },
                                    { id: 'power', label: 'Força Bruta', icon: '🧱' },
                                    { id: 'saude', label: 'Saúde & Longevidade', icon: '🍃' }
                                ].map(goal => (
                                    <button 
                                        key={goal.id} 
                                        onClick={() => setJourneyGoal(goal.label)} 
                                        className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all flex items-center justify-between ${journeyGoal === goal.label ? 'bg-neon-400 border-neon-400 text-black shadow-glow' : 'bg-black border-neutral-800 text-neutral-500 hover:border-neutral-700'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{goal.icon}</span>
                                            <span className="uppercase text-xs tracking-tight">{goal.label}</span>
                                        </div>
                                        {journeyGoal === goal.label && <Sparkles size={16} />}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={handleCreateJourney} 
                                disabled={!journeyGoal || isCreatingJourney || isLimitReached} 
                                className={`w-full font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-glow transition-all active:scale-95 ${isLimitReached ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black'}`}
                            >
                                {isCreatingJourney ? <Loader2 className="animate-spin" /> : isLimitReached ? <Lock size={20} /> : "Iniciar Jornada"}
                            </button>
                            {isLimitReached && (
                                <p className="text-center text-[10px] text-neutral-500 mt-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Sparkles size={12} className="text-yellow-400" /> Assine Premium para usos ilimitados
                                </p>
                            )}
                        </div>
                    ) : workoutJourney ? (
                        <div className="space-y-6">
                            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-400/5 rounded-full blur-3xl"></div>
                                <h2 className="text-2xl font-black text-white leading-tight mb-1 uppercase italic">{workoutJourney.title}</h2>
                                <p className="text-neon-400 font-bold text-xs uppercase tracking-widest">{workoutJourney.goal}</p>
                                <button onClick={() => setShowJourneyCreator(true)} className="mt-6 text-[10px] text-neutral-600 font-black uppercase flex items-center gap-1 hover:text-white transition-colors"><RotateCcw size={12}/> Reiniciar Plano</button>
                            </div>
                            
                            <div className="space-y-8">
                                {workoutJourney.phases?.map((phase, idx) => {
                                    const progress = (phase.completedWeeks / phase.totalWeeks) * 100;
                                    return (
                                        <div key={idx} className={`bg-neutral-900 p-6 rounded-[2rem] border transition-all ${phase.isUnlocked ? 'border-neutral-800 shadow-lg' : 'border-neutral-800 opacity-40'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-black text-lg text-white uppercase italic">{phase.levelName}</h3>
                                                    <p className="text-xs text-neutral-500 font-medium mb-2">{phase.duration} • {phase.description}</p>
                                                    {phase.isUnlocked && (
                                                        <div className="w-32 bg-black h-1.5 rounded-full overflow-hidden">
                                                            <div className="bg-neon-400 h-full transition-all" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    )}
                                                </div>
                                                {!phase.isUnlocked ? <Lock size={18} className="text-neutral-700" /> : <Trophy size={18} className={progress === 100 ? 'text-neon-400' : 'text-neutral-800'} />}
                                            </div>
                                            
                                            {/* Progressão de Semanas */}
                                            {phase.isUnlocked && (
                                                <div className="mb-6">
                                                    <p className="text-[10px] font-black text-neutral-600 uppercase mb-3 tracking-widest">Check-in de Semanas</p>
                                                    <div className="flex gap-2">
                                                        {Array.from({ length: phase.totalWeeks }, (_, i) => i + 1).map(wNum => {
                                                            const isCompleted = wNum <= phase.completedWeeks;
                                                            return (
                                                                <button 
                                                                    key={wNum}
                                                                    onClick={() => handleWeekToggle(idx, wNum)}
                                                                    className={`flex-1 aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${
                                                                        isCompleted ? 'bg-neon-400 border-neon-400 text-black' : 'bg-black border-neutral-800 text-neutral-500 hover:border-neutral-600'
                                                                    }`}
                                                                >
                                                                    {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-black">{wNum}</span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-neutral-800 pt-5">
                                                {phase.schedule?.map((day, dIdx) => {
                                                    const isRest = day.toLowerCase().includes('descanso') || day.toLowerCase().includes('rest');
                                                    return (
                                                        <button 
                                                            key={dIdx} 
                                                            disabled={!phase.isUnlocked || isRest}
                                                            onClick={() => handleScheduleClick(day, phase.detailedRoutines)}
                                                            className={`text-[10px] px-3 py-3 rounded-xl border font-black uppercase tracking-wider transition-all ${
                                                                isRest ? 'bg-black border-neutral-800 text-neutral-700' : 
                                                                phase.isUnlocked ? 'bg-neutral-800 border-neutral-700 text-white hover:border-neon-400' : 
                                                                'bg-neutral-800 border-neutral-800 text-neutral-600'
                                                            }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {activeTab === 'specific' && (
                <div className="animate-slide-up">
                    <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 mb-6 shadow-xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest ml-1">Qual grupo muscular hoje?</label>
                            {!user.isPremium && (
                                <div className={`px-2 py-1 rounded-lg border flex flex-col items-center ${remainingGens === 0 ? 'border-red-500 bg-red-500/10' : 'border-neon-400 bg-neon-400/10'}`}>
                                    <span className="text-[8px] font-bold text-white uppercase opacity-70">Restam</span>
                                    <span className={`text-xs font-black ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>0{remainingGens} usos</span>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Ex: Peito, Costas, Pernas..." 
                                value={muscleInput} 
                                onChange={(e) => setMuscleInput(e.target.value)} 
                                className="w-full bg-black border border-neutral-800 rounded-2xl py-5 px-6 text-white outline-none focus:border-neon-400 font-bold transition-all" 
                            />
                            <Target className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-700" size={24} />
                        </div>
                        <button 
                            onClick={handleGenerateSpecific} 
                            disabled={isGenerating || !muscleInput || isLimitReached} 
                            className={`w-full font-black py-5 rounded-2xl mt-4 disabled:opacity-50 transition-all active:scale-95 shadow-glow flex items-center justify-center gap-2 ${isLimitReached ? 'bg-neutral-800 text-neutral-500' : 'bg-neon-400 text-black'}`}
                        >
                            {isGenerating ? <Loader2 className="animate-spin mx-auto" /> : isLimitReached ? <Lock size={20}/> : "Gerar Treino de IA"}
                        </button>
                        
                        {isLimitReached && (
                             <p className="text-[10px] text-center text-neutral-500 font-bold mt-4 flex items-center justify-center gap-2 uppercase tracking-widest">
                                 <Sparkles size={12} className="text-yellow-400" /> Limite diário atingido. Assine o Premium.
                             </p>
                        )}
                    </div>
                    
                    {specificWorkout && (
                        <div className="space-y-4">
                            {specificWorkout.map((ex, i) => renderExerciseCard(ex, i))}
                        </div>
                    )}
                </div>
            )}
       </div>
    </div>
  );
};

export default Workout;
