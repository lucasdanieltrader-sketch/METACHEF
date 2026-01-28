
import React, { useState } from 'react';
import { UserProfile, HealthGoal } from '../types';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity, User, Ruler, Weight, Check, Loader2, Dumbbell, Ban, Sparkles, ChevronLeft } from 'lucide-react';
import { generateDietPlan } from '../services/geminiService';
import { saveUserToDb, getUserByEmail } from '../services/supabase';

interface OnboardingProps {
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const Onboarding: React.FC<OnboardingProps> = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // Start at Step 0 (Email Check)
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);

    const [formData, setFormData] = useState({
        name: user.name === 'Visitante' ? '' : user.name,
        email: user.email || '',
        age: user.age || '',
        weight: user.weight || '',
        height: user.height || '',
        gender: user.gender || 'Masculino',
        activityLevel: user.activityLevel || 'Moderado',
        allergies: user.allergies || [],
        mealsPerDay: user.mealsPerDay || 4,
        goal: user.goal || []
    });

    const updateForm = (key: string, value: any) => setFormData(prev => ({ ...prev, [key]: value }));

    const toggleAllergy = (allergy: string) => {
        setFormData(prev => {
            const current = prev.allergies;
            return current.includes(allergy)
                ? { ...prev, allergies: current.filter(a => a !== allergy) }
                : { ...prev, allergies: [...current, allergy] };
        });
    };

    const toggleGoal = (goal: HealthGoal) => setFormData(prev => {
        const currentGoals = prev.goal;
        return currentGoals.includes(goal)
            ? { ...prev, goal: currentGoals.filter(g => g !== goal) }
            : { ...prev, goal: [...currentGoals, goal] };
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const checkEmailAndProceed = async () => {
        if (!formData.email) return;
        setIsCheckingEmail(true);
        try {
            const existingUser = await getUserByEmail(formData.email);
            if (existingUser && existingUser.profile_data) {
                // User found! Load their data and login
                console.log("Usuário encontrado, logando...", existingUser);
                const restoredUser = { ...existingUser.profile_data, id: existingUser.id };
                setUser(restoredUser);
                navigate('/diet-plan'); // Or Home
            } else {
                // User not found, proceed to registration
                setStep(1);
            }
        } catch (error) {
            console.error("Erro ao verificar email:", error);
            // On error, let them proceed to register anyway or show alert
            setStep(1);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleFinish = async () => {
        setIsLoading(true);
        const finalGoals = formData.goal.length > 0 ? formData.goal : [HealthGoal.GENERAL];

        // Cálculo da meta de água: 35ml por kg de peso corporal
        const weightNum = parseFloat(formData.weight) || 70;
        const waterGoal = Math.round(weightNum * 35);

        const updatedUser: UserProfile = {
            ...user,
            ...formData,
            goal: finalGoals,
            hasOnboarded: true,
            waterStats: {
                ...user.waterStats,
                goal: waterGoal,
                current: 0,
                lastDrinkDate: new Date().toISOString().split('T')[0]
            }
        };

        try {
            // Save initial user profile to Supabase
            const savedUser = await saveUserToDb(updatedUser);

            // If saved successfully, update user with the new ID
            if (savedUser && savedUser.id) {
                updatedUser.id = savedUser.id;
            }

            const dietPlan = await generateDietPlan(updatedUser);
            setUser({ ...updatedUser, dietPlan });
            navigate('/diet-plan');
        } catch (error) {
            console.error("Erro no Plano:", error);
            setUser(updatedUser);
            navigate('/');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-8 text-center">
            <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-neutral-800 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-neon-400 rounded-full absolute top-0 left-0 border-t-transparent animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-400" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Análise Nutricional</h2>
            <p className="text-neutral-400 text-sm">A IA Meta Chef está calculando sua taxa metabólica, macros e bio-hidratação ideal...</p>
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6 animate-fade-in text-center px-4">
                        <div className="mb-12">
                            <div className="bg-black border-2 border-neon-400 w-24 h-24 rounded-3xl rotate-3 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(204,255,0,0.3)]">
                                <Activity size={40} className="text-neon-400" />
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Meta <span className="text-neon-400">Chef</span></h2>
                            <p className="text-neutral-400 text-sm font-medium">Sua jornada de transformação começa aqui.</p>
                        </div>

                        <div className="space-y-4 max-w-xs mx-auto">
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-2 ml-1">Para começar, qual seu e-mail?</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => updateForm('email', e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white focus:border-neon-400 outline-none font-bold placeholder-neutral-700 transition-colors"
                                    placeholder="exemplo@email.com"
                                />
                            </div>
                            <button
                                onClick={checkEmailAndProceed}
                                disabled={!formData.email || isCheckingEmail}
                                className="w-full bg-white text-black py-4 rounded-2xl font-black shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2 uppercase active:scale-95 transition-all text-sm"
                            >
                                {isCheckingEmail ? <Loader2 className="animate-spin" size={20} /> : <>Continuar <ChevronRight size={20} /></>}
                            </button>
                            <p className="text-[10px] text-neutral-600 mt-4">Ao continuar, verificaremos se você já possui cadastro.</p>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Criar Cadastro</h2>
                            <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-widest mt-1">Olá! Vamos criar seu perfil.</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-2 ml-1">E-mail Confirmado</label>
                                <div className="w-full p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-neutral-400 font-bold flex items-center justify-between">
                                    {formData.email}
                                    <Check size={16} className="text-green-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
                                <input type="text" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-white focus:border-neon-400 outline-none font-bold placeholder-neutral-700" placeholder="Seu Nome" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-2 ml-1">Gênero Biológico</label>
                                <div className="flex gap-3">
                                    {['Masculino', 'Feminino'].map(g => (
                                        <button key={g} onClick={() => updateForm('gender', g)} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${formData.gender === g ? 'bg-neon-400 border-neon-400 text-black shadow-glow' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>{g.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleNext} disabled={!formData.name} className="w-full bg-white text-black py-5 rounded-2xl font-black shadow-lg disabled:opacity-30 mt-8 flex items-center justify-center gap-2 uppercase active:scale-95 transition-all">Continuar <ChevronRight size={20} /></button>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-white uppercase italic">Suas Medidas</h2>
                            <p className="text-neutral-500 text-sm font-medium">Dados fundamentais para calcular sua TMB.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest ml-1">Idade</label>
                                <input type="number" value={formData.age} onChange={(e) => updateForm('age', e.target.value)} className="w-full p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-center text-2xl font-black focus:border-neon-400 outline-none" placeholder="25" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest ml-1">Peso (kg)</label>
                                <input type="number" step="0.1" value={formData.weight} onChange={(e) => updateForm('weight', e.target.value)} className="w-full p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-center text-2xl font-black focus:border-neon-400 outline-none" placeholder="70" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                            <input type="number" value={formData.height} onChange={(e) => updateForm('height', e.target.value)} className="w-full p-5 rounded-2xl bg-neutral-900 border border-neutral-800 text-white text-center text-2xl font-black focus:border-neon-400 outline-none" placeholder="170" />
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={handleBack} className="flex-1 bg-neutral-900 text-neutral-500 py-5 rounded-2xl font-black border border-neutral-800 uppercase tracking-wider"><ChevronLeft className="inline mr-1" />Voltar</button>
                            <button onClick={handleNext} disabled={!formData.age || !formData.weight || !formData.height} className="flex-[2] bg-neon-400 text-black py-5 rounded-2xl font-black shadow-glow uppercase tracking-wider disabled:opacity-30">Próximo</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-white uppercase italic">Ritmo de Vida</h2>
                            <p className="text-neutral-500 text-sm">Seu nível de gasto calórico diário.</p>
                        </div>
                        <div className="space-y-3">
                            {['Sedentário', 'Leve', 'Moderado', 'Intenso'].map((level) => (
                                <button key={level} onClick={() => updateForm('activityLevel', level)} className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-center gap-4 ${formData.activityLevel === level ? 'bg-neon-400 border-neon-400 text-black' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                                    <Dumbbell size={20} className={formData.activityLevel === level ? 'text-black' : 'text-neutral-700'} />
                                    <span className="font-black uppercase text-sm">{level}</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBack} className="flex-1 bg-neutral-900 text-neutral-500 py-5 rounded-2xl font-black border border-neutral-800 uppercase">Voltar</button>
                            <button onClick={handleNext} className="flex-[2] bg-neon-400 text-black py-5 rounded-2xl font-black shadow-glow uppercase">Próximo</button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-white uppercase italic">Hábitos Atuais</h2>
                            <p className="text-neutral-500 text-sm">Restrições e frequência de alimentação.</p>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-3 ml-1">Restrições Alimentares</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Lactose', 'Glúten', 'Frutos do Mar', 'Ovo', 'Açúcar'].map(a => (
                                        <button key={a} onClick={() => toggleAllergy(a)} className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black transition-all ${formData.allergies.includes(a) ? 'bg-red-500 border-red-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}>
                                            {a.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-neon-400 uppercase tracking-widest mb-3 ml-1">Refeições p/ Dia: <span className="text-white text-base">{formData.mealsPerDay}</span></label>
                                <input type="range" min="3" max="6" value={formData.mealsPerDay} onChange={(e) => updateForm('mealsPerDay', parseInt(e.target.value))} className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neon-400" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={handleBack} className="flex-1 bg-neutral-900 text-neutral-500 py-5 rounded-2xl font-black border border-neutral-800 uppercase">Voltar</button>
                            <button onClick={handleNext} className="flex-[2] bg-neon-400 text-black py-5 rounded-2xl font-black shadow-glow uppercase">Próximo</button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-white uppercase italic">Seus Objetivos</h2>
                        </div>
                        <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                            {Object.values(HealthGoal).map((goal) => (
                                <button key={goal} onClick={() => toggleGoal(goal)} className={`w-full p-4 rounded-2xl text-left border-2 flex justify-between items-center ${formData.goal.includes(goal) ? 'bg-black border-neon-400 text-neon-400' : 'bg-neutral-900 border-neutral-800 text-neutral-600'}`}>
                                    <span className="font-black uppercase text-xs">{goal}</span>
                                    {formData.goal.includes(goal) && <Check size={18} />}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button onClick={handleBack} className="flex-1 bg-neutral-900 text-neutral-500 py-5 rounded-2xl font-black border border-neutral-800 uppercase">Voltar</button>
                            <button onClick={handleFinish} disabled={formData.goal.length === 0} className="flex-[2] bg-white text-black py-5 rounded-2xl font-black shadow-lg uppercase tracking-widest disabled:opacity-30">Gerar Plano IA</button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
            <div className="flex-1 flex flex-col justify-center relative z-10">{renderStep()}</div>
            <div className="flex justify-center gap-2 py-8 relative z-10">
                {[0, 1, 2, 3, 4, 5].map(i => (
                    i === 0 ? null : // Don't show step indicator for login
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-neon-400' : 'w-4 bg-neutral-900'}`} />
                ))}
            </div>
        </div>
    );
};

export default Onboarding;
