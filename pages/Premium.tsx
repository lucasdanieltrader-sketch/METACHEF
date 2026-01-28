
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile, SubscriptionPlan } from '../types';
import { Check, Star, Zap, Crown, Shield, X, ArrowRight, Lock, Map, MessageCircle, UserCheck, Users, Dumbbell, Sparkles } from 'lucide-react';

type PlanCategory = 'app' | 'personal';

interface ExtendedPlan extends SubscriptionPlan {
    category: PlanCategory;
    description?: string;
}

const APP_PLANS: ExtendedPlan[] = [
    { id: 'monthly_app', category: 'app', name: 'Mensal IA', price: 29.90, period: 'mês' },
    { id: 'annual_app', category: 'app', name: 'Anual IA', price: 19.90, period: 'mês', discount: 'Economize 33%' }
];

const PERSONAL_PLANS: ExtendedPlan[] = [
    { id: 'monthly_personal', category: 'personal', name: 'Mensal PRO', price: 150.00, period: 'mês', description: 'Consultoria Individual' },
    { id: 'quarterly_personal', category: 'personal', name: 'Trimestral PRO', price: 116.66, period: 'mês', discount: 'Economize R$ 100', description: 'Plano de 3 meses' }
];

const APP_BENEFITS = [
    { title: "Inteligência Artificial", desc: "Análise avançada e geração ilimitada.", icon: <Zap size={20} className="text-neon-400" /> },
    { title: "Rankings Locais", desc: "Compita com quem mora perto de você.", icon: <Crown size={20} className="text-neon-400" /> },
    { title: "Cardápio Ilimitado", desc: "Geração de dietas sem restrições.", icon: <Star size={20} className="text-neon-400" /> }
];

const PERSONAL_BENEFITS = [
    { title: "Personal Trainer Real", desc: "Acompanhamento humano individualizado (PF).", icon: <UserCheck size={20} className="text-yellow-400" /> },
    { title: "App Premium Total", desc: "IA ilimitada e todas as funções liberadas.", icon: <Sparkles size={20} className="text-yellow-400" /> },
    { title: "Chat Exclusivo", desc: "Suporte direto via WhatsApp para dúvidas.", icon: <MessageCircle size={20} className="text-yellow-400" /> },
    { title: "Treinos Sob Medida", desc: "Prescrição manual baseada na sua evolução.", icon: <Dumbbell size={20} className="text-yellow-400" /> }
];

const Premium: React.FC<{ user: UserProfile, setUser: React.Dispatch<React.SetStateAction<UserProfile>> }> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<PlanCategory>('app');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Define plano inicial ao trocar categoria
  React.useEffect(() => {
    if (activeCategory === 'app') setSelectedPlanId('annual_app');
    else setSelectedPlanId('quarterly_personal');
  }, [activeCategory]);

  const handleSubscribe = () => {
      setIsProcessing(true);
      setTimeout(() => {
          const isPersonal = activeCategory === 'personal';
          setUser(prev => ({ 
              ...prev, 
              isPremium: true, 
              premiumSince: new Date().toISOString(),
              level: isPersonal ? Math.max(prev.level, 10) : prev.level 
          }));
          alert(isPersonal ? "👑 Consultoria PRO Ativada! O Personal Trainer entrará em contato para sua primeira avaliação. O App Premium também já está liberado!" : "Parabéns! Você agora é Meta Prime 👑");
          navigate('/profile');
          setIsProcessing(false);
      }, 2000);
  };

  const currentPlans = activeCategory === 'app' ? APP_PLANS : PERSONAL_PLANS;
  const currentBenefits = activeCategory === 'app' ? APP_BENEFITS : PERSONAL_BENEFITS;
  const selectedPlan = currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0];
  
  const getTotalValue = () => {
      if (selectedPlanId === 'annual_app') return "R$ 238,80";
      if (selectedPlanId === 'monthly_app') return "R$ 29,90";
      if (selectedPlanId === 'monthly_personal') return "R$ 150,00";
      if (selectedPlanId === 'quarterly_personal') return "R$ 350,00";
      return "";
  };

  return (
    <div className="bg-black min-h-screen relative text-white flex flex-col">
        {/* Fundo dinâmico */}
        <div className={`absolute top-0 left-0 right-0 h-[60vh] transition-all duration-700 pointer-events-none ${activeCategory === 'personal' ? 'bg-gradient-to-b from-yellow-600/20 to-transparent' : 'bg-gradient-to-b from-neon-400/10 to-transparent'}`}></div>

        {/* Header */}
        <div className="p-6 flex justify-between items-center relative z-10">
            <button onClick={() => navigate(-1)} className="p-2 bg-neutral-900/50 rounded-full hover:bg-neutral-800 transition-colors">
                <X size={24} className="text-neutral-400" />
            </button>
            <div className="flex gap-1 bg-neutral-900/80 p-1 rounded-full border border-neutral-800">
                <button 
                    onClick={() => setActiveCategory('app')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'app' ? 'bg-neon-400 text-black shadow-neon' : 'text-neutral-500'}`}
                >
                    Plano IA
                </button>
                <button 
                    onClick={() => setActiveCategory('personal')}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'personal' ? 'bg-yellow-500 text-black shadow-glow' : 'text-neutral-500'}`}
                >
                    Personal Trainer
                </button>
            </div>
        </div>

        <div className="flex-1 px-6 pb-8 relative z-10 flex flex-col">
            <div className="text-center mb-6">
                {activeCategory === 'personal' ? (
                    <Users size={64} className="text-yellow-400 mx-auto mb-4 animate-pulse" />
                ) : (
                    <Crown size={64} className="text-neon-400 mx-auto mb-4 animate-bounce" />
                )}
                <h1 className="text-4xl font-black mb-2 leading-tight">
                    {activeCategory === 'personal' ? (
                        <>Consultoria <br/><span className="text-yellow-400">Personalizada</span></>
                    ) : (
                        <>Desbloqueie sua <br/><span className="text-neon-400">Melhor Versão</span></>
                    )}
                </h1>
                <p className="text-neutral-400 font-medium text-sm">
                    {activeCategory === 'personal' ? 'Acompanhamento humano + App Premium incluso.' : 'A potência da IA no seu bolso.'}
                </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-2.5 mb-8">
                {currentBenefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-4 p-3.5 rounded-2xl border bg-neutral-900/50 border-neutral-800/50">
                        <div className="bg-black p-2.5 rounded-xl border border-neutral-800">
                            {b.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-sm">{b.title}</h3>
                            <p className="text-[11px] text-neutral-500 leading-tight">{b.desc}</p>
                        </div>
                        <Check size={18} className={activeCategory === 'personal' ? 'text-yellow-500' : 'text-neon-400'} />
                    </div>
                ))}
            </div>

            {/* Plans Selection */}
            <div className="mt-auto">
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {currentPlans.map(plan => (
                        <div 
                            key={plan.id}
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all ${selectedPlanId === plan.id ? (activeCategory === 'personal' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-neon-400/10 border-neon-400 shadow-neon') : 'bg-neutral-900 border-neutral-800 opacity-60 hover:opacity-100'}`}
                        >
                            {plan.discount && (
                                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-1 rounded-full whitespace-nowrap ${activeCategory === 'personal' ? 'bg-yellow-500 text-black' : 'bg-neon-400 text-black'}`}>
                                    {plan.discount}
                                </span>
                            )}
                            <p className="text-[10px] font-bold text-neutral-400 mb-1 uppercase tracking-tighter">{plan.name}</p>
                            <p className="text-xl font-black text-white">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                            <p className="text-[10px] text-neutral-500 font-medium">/{plan.period}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-neutral-900/80 backdrop-blur-md rounded-2xl p-4 mb-4 text-center border border-neutral-800">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Total a pagar agora:</p>
                    <p className="text-2xl font-black text-white">{getTotalValue()}</p>
                    {activeCategory === 'personal' && (
                        <p className="text-[10px] text-yellow-500 mt-2 font-bold uppercase flex items-center justify-center gap-1">
                            <Star size={10} fill="currentColor" /> Inclui Todas as Funções Premium do App
                        </p>
                    )}
                </div>

                <button 
                    onClick={handleSubscribe} 
                    disabled={isProcessing}
                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${activeCategory === 'personal' ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-neon-400 text-black hover:bg-neon-500'}`}
                >
                    {isProcessing ? "Processando..." : (activeCategory === 'personal' ? 'ASSINAR CONSULTORIA' : 'ASSINAR AGORA')} <ArrowRight size={20} />
                </button>
                <p className="text-[9px] text-center text-neutral-600 mt-4 px-4 leading-tight uppercase font-bold tracking-widest">
                    Cancele a qualquer momento nas configurações. Suporte via WhatsApp incluso.
                </p>
            </div>
        </div>
    </div>
  );
};

export default Premium;
