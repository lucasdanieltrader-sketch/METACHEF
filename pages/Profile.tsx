
import React, { useState } from 'react';
import { UserProfile, HealthGoal } from '../types';
import { CHALLENGES } from '../constants';
import { Settings, Award, Activity, CheckCircle, Play, Trash2, FileText, ChevronRight, Repeat, Check, Flame, Heart, RefreshCw, X, LogOut, Crown, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { saveUserToDb } from '../services/supabase';

interface ProfileProps {
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Profile: React.FC<ProfileProps> = ({ user, setUser }) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    const startChallenge = (challengeId: string) => {
        setUser(prev => ({ ...prev, activeChallenge: { challengeId, startDate: new Date().toISOString(), completedDays: [] } }));
    };

    const confirmExitChallenge = () => {
        setUser(prev => ({ ...prev, activeChallenge: null }));
        setShowConfirmDelete(false);
    };

    const toggleDay = (day: number) => {
        if (!user.activeChallenge) return;
        const currentDays = user.activeChallenge.completedDays;
        const newDays = currentDays.includes(day) ? currentDays.filter(d => d !== day) : [...currentDays, day];
        setUser(prev => prev.activeChallenge ? { ...prev, activeChallenge: { ...prev.activeChallenge, completedDays: newDays } } : prev);
    };

    const toggleGoal = (goal: HealthGoal) => {
        setUser(prev => {
            const currentGoals = Array.isArray(prev.goal) ? prev.goal : [prev.goal];
            return currentGoals.includes(goal) && currentGoals.length > 1
                ? { ...prev, goal: currentGoals.filter(g => g !== goal) }
                : { ...prev, goal: [...currentGoals, goal] };
        });
    };

    const handleRegeneratePlan = () => {
        if (!window.confirm("Isso levará você de volta ao início para ajustar seus dados e metas. Deseja continuar?")) return;

        // Atualiza o estado global. O App.tsx detectará hasOnboarded: false e redirecionará.
        setUser(prev => ({
            ...prev,
            hasOnboarded: false,
            dietPlan: undefined
        }));

        setShowSettings(false);
    };

    const handleResetApp = () => {
        if (window.confirm("⚠️ ATENÇÃO: Isso apagará TODOS os seus dados definitivamente. Confirmar reset total?")) {
            localStorage.clear();
            // Força o reload na raiz para garantir limpeza total
            window.location.href = window.location.origin + window.location.pathname;
        }
    };

    const activeChallengeData = user.activeChallenge ? CHALLENGES.find(c => c.id === user.activeChallenge?.challengeId) : null;
    const calculateProgress = () => !user.activeChallenge || !activeChallengeData ? 0 : Math.round((user.activeChallenge.completedDays.length / activeChallengeData.durationDays) * 100);
    const userGoals = Array.isArray(user.goal) ? user.goal : [user.goal];

    return (
        <div className="pb-32 min-h-screen bg-black relative text-white">
            {/* Header */}
            <div className="bg-neutral-900 p-8 pb-20 rounded-b-[3rem] shadow-lg border-b border-neutral-800">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-white">Meu Perfil</h1>
                    <button onClick={() => setShowSettings(true)} className="bg-neutral-800 p-2 rounded-full hover:bg-neutral-700 transition-all border border-neutral-700">
                        <Settings className="text-neutral-400" size={24} />
                    </button>
                </div>
                <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 bg-black rounded-full flex items-center justify-center text-3xl font-bold border-4 ${user.isPremium ? 'border-yellow-400 text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-neon-400 text-neon-400 shadow-[0_0_20px_rgba(204,255,0,0.3)]'}`}>
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {user.name}
                            {user.isPremium && <Crown size={18} className="text-yellow-400 fill-yellow-400" />}
                        </h2>
                        <p className={`text-sm font-medium ${user.isPremium ? 'text-yellow-500 font-bold' : 'text-neutral-500'}`}>
                            {user.isPremium ? 'Membro Premium' : 'Membro Gratuito'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-6 -mt-12 space-y-5">

                {/* PREMIUM BANNER */}
                {!user.isPremium && (
                    <div onClick={() => navigate('/premium')} className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-6 rounded-[2rem] shadow-[0_0_20px_rgba(234,179,8,0.3)] border border-yellow-400 cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-black text-xl mb-1 flex items-center gap-2"><Crown size={24} fill="currentColor" /> SEJA PRIME</h3>
                                <p className="text-black/80 font-bold text-xs leading-tight">Desbloqueie IA ilimitada e Rankings.</p>
                            </div>
                            <div className="bg-black/20 p-2 rounded-full">
                                <ChevronRight className="text-black" />
                            </div>
                        </div>
                    </div>
                )}

                <Link to="/daily-progress" className="bg-neutral-900 p-6 rounded-[2rem] shadow-lg border border-neutral-800 flex items-center justify-between group relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-neon-400/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="bg-black text-orange-500 p-4 rounded-full border border-neutral-800">
                            <Flame size={28} fill="currentColor" className="animate-pulse-slow" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-xl">Evolução Diária</h3>
                            <p className="text-sm text-neutral-400 font-medium flex items-center gap-1 mt-1">
                                <span className="bg-neutral-800 px-2 py-0.5 rounded text-neon-400 font-bold border border-neutral-700">{user.dailyProgress?.currentStreak || 0} dias</span> seguidos
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-neutral-600 group-hover:text-white transition-colors" />
                </Link>

                <div className="grid grid-cols-2 gap-4">
                    <Link to="/recipes" state={{ filter: 'favorites' }} className="bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-800 flex flex-col items-center justify-center text-center hover:border-rose-500/50 transition-all group cursor-pointer">
                        <div className="bg-black text-rose-500 p-3 rounded-full mb-3 border border-neutral-800 group-hover:border-rose-500">
                            <Heart size={28} fill="currentColor" />
                        </div>
                        <span className="text-3xl font-black text-white">{user.favorites.length}</span>
                        <span className="text-sm font-medium text-neutral-500 mt-1">Favoritas</span>
                    </Link>
                    <div className="bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-800 flex flex-col items-center justify-center text-center">
                        <div className="bg-black text-neon-400 p-3 rounded-full mb-3 border border-neutral-800">
                            <Award size={28} />
                        </div>
                        <span className="text-3xl font-black text-white">{user.activeChallenge ? 1 : 0}</span>
                        <span className="text-sm font-medium text-neutral-500 mt-1">Desafio Ativo</span>
                    </div>
                </div>

                <Link to="/diet-plan" className="bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-800 flex items-center justify-between group hover:border-neon-400/50 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="bg-black text-neon-400 p-4 rounded-2xl border border-neutral-800">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Meu Plano Alimentar</h3>
                            <p className="text-sm font-medium text-neutral-500 mt-0.5">Gerado por IA</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-neutral-600 group-hover:text-white transition-colors" />
                </Link>

                <Link to="/substitutions" className="bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-800 flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="bg-black text-emerald-500 p-4 rounded-2xl border border-neutral-800">
                            <Repeat size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">Substituições</h3>
                            <p className="text-sm font-medium text-neutral-500 mt-0.5">Guia de trocas</p>
                        </div>
                    </div>
                    <ChevronRight size={24} className="text-neutral-600 group-hover:text-white transition-colors" />
                </Link>

                <div className="bg-neutral-900 p-8 rounded-[2rem] shadow-sm border border-neutral-800 mt-8">
                    <h3 className="font-black text-2xl text-white mb-6 flex items-center gap-3">
                        <Activity size={28} className="text-neon-400" />
                        Meus Objetivos
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {Object.values(HealthGoal).map((goal) => {
                            const isSelected = userGoals.includes(goal);
                            return (
                                <button key={goal} onClick={() => toggleGoal(goal)} className={`p-4 rounded-2xl text-left transition-all border flex justify-between items-center ${isSelected ? 'bg-black border-neon-400 text-neon-400 font-bold shadow-[0_0_10px_rgba(204,255,0,0.2)]' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800 font-medium'}`}>
                                    <span className="text-lg">{goal}</span>
                                    {isSelected && <Check size={24} strokeWidth={3} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-neutral-900 p-8 rounded-[2rem] shadow-sm border border-neutral-800 mb-6">
                    <h3 className="font-black text-2xl text-white mb-6 flex items-center gap-3">
                        <Award size={28} className="text-orange-500" />
                        Desafio Atual
                    </h3>

                    {user.activeChallenge && activeChallengeData ? (
                        <div>
                            <div className="flex justify-between items-start mb-6 min-h-[3rem]">
                                <div>
                                    <h4 className="text-2xl font-bold text-white mb-1">{activeChallengeData.title}</h4>
                                    <p className="text-base font-medium text-neutral-400 leading-relaxed">{activeChallengeData.description}</p>
                                </div>

                                {showConfirmDelete ? (
                                    <div className="flex flex-col items-end gap-3 bg-red-900/20 p-3 rounded-xl border border-red-900/50">
                                        <span className="text-xs text-red-500 font-bold uppercase">Desistir?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => setShowConfirmDelete(false)} className="text-xs bg-neutral-800 text-neutral-300 px-4 py-2 rounded-lg border border-neutral-700 font-bold">Não</button>
                                            <button onClick={confirmExitChallenge} className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold">Sim</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => setShowConfirmDelete(true)} className="text-neutral-600 hover:text-red-500 p-3 rounded-full hover:bg-neutral-800 transition-colors">
                                        <Trash2 size={24} />
                                    </button>
                                )}
                            </div>
                            <div className="mb-6">
                                <div className="flex justify-between text-sm font-bold text-neutral-500 mb-2">
                                    <span>Progresso</span>
                                    <span className="text-white">{calculateProgress()}%</span>
                                </div>
                                <div className="w-full bg-neutral-800 rounded-full h-4">
                                    <div className={`h-4 rounded-full transition-all duration-500 ${activeChallengeData.color} shadow-lg`} style={{ width: `${calculateProgress()}%` }}></div>
                                </div>
                            </div>
                            <div className="bg-black rounded-2xl p-5 border border-neutral-800">
                                <div className="grid grid-cols-7 gap-2">
                                    {Array.from({ length: activeChallengeData.durationDays }, (_, i) => i + 1).map((day) => {
                                        const isCompleted = user.activeChallenge!.completedDays.includes(day);
                                        return (
                                            <button key={day} onClick={() => toggleDay(day)} className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold transition-all ${isCompleted ? `bg-neon-400 text-black shadow-lg scale-105` : 'bg-neutral-900 border border-neutral-800 text-neutral-600 hover:border-neon-400/50'}`}>
                                                {isCompleted ? <CheckCircle size={24} /> : day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {CHALLENGES.map(challenge => (
                                <div key={challenge.id} className="border border-neutral-800 rounded-2xl p-6 hover:shadow-neon/20 transition-all bg-neutral-900 hover:bg-black cursor-pointer group" onClick={() => startChallenge(challenge.id)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 pr-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-bold text-xl text-white group-hover:text-neon-400 transition-colors">{challenge.title}</h4>
                                                <span className={`text-[11px] px-3 py-1.5 rounded-lg text-white font-bold shadow-sm ${challenge.color}`}>{challenge.durationDays} dias</span>
                                            </div>
                                            <p className="text-base font-medium text-neutral-500 mb-3 leading-relaxed">{challenge.description}</p>
                                            <span className="text-sm text-neutral-400 font-bold bg-black px-3 py-1.5 rounded-lg border border-neutral-800 inline-block">Nível: {challenge.difficulty}</span>
                                        </div>
                                        <div className="bg-neon-400 text-black p-4 rounded-full shadow-lg mt-1"><Play size={24} fill="currentColor" className="ml-0.5" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowSettings(false)}>
                    <div className="bg-neutral-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-neutral-800" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
                            <h3 className="font-black text-xl text-white flex items-center gap-2">Configurações</h3>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-neon-400 uppercase tracking-wider ml-1">PLANO ALIMENTAR</p>
                                <button
                                    onClick={handleRegeneratePlan}
                                    className="w-full bg-black hover:bg-neutral-800 border border-neutral-700 text-white py-4 rounded-2xl font-bold flex items-center justify-between px-5 transition-all active:scale-95 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="text-neon-400 group-hover:rotate-180 transition-transform duration-500" size={20} />
                                        <span className="text-sm">Refazer Plano (Voltar ao Início)</span>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-600 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            <div className="pt-4 border-t border-neutral-800 space-y-3">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-wider ml-1">ZONA DE PERIGO</p>
                                <button
                                    onClick={handleResetApp}
                                    className="w-full bg-neutral-900 hover:bg-red-900/10 border border-neutral-800 hover:border-red-500/30 text-neutral-500 hover:text-red-500 py-4 rounded-2xl font-bold flex items-center justify-between px-5 transition-all active:scale-95 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                                        <span className="text-sm">Resetar Aplicativo</span>
                                    </div>
                                    <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
