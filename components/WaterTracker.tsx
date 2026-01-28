
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Droplets, Plus, Bell, BellOff, Trophy, RotateCcw, Check, X } from 'lucide-react';

interface WaterTrackerProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ user, setUser }) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const stats = user.waterStats;
  const progress = Math.min(100, (stats.current / stats.goal) * 100);
  
  const addWater = (amount: number) => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const isNewDay = stats.lastDrinkDate !== today;
    const newCurrent = isNewDay ? amount : stats.current + amount;
    
    // Disparar celebração apenas na transição para a meta batida
    if (newCurrent >= stats.goal && stats.current < stats.goal) {
      setShowCelebration(true);
    }

    setUser(prev => ({
      ...prev,
      waterStats: {
        ...prev.waterStats,
        current: newCurrent,
        lastDrinkDate: today
      }
    }));
  };

  const resetToday = () => {
    if (window.confirm("Deseja zerar o consumo de hoje?")) {
      setUser(prev => ({
        ...prev,
        waterStats: {
          ...prev.waterStats,
          current: 0,
          lastDrinkDate: new Date().toLocaleDateString('en-CA')
        }
      }));
      setShowCelebration(false);
    }
  };

  const toggleReminders = async () => {
    if (!stats.remindersEnabled) {
      if (typeof window !== "undefined" && "Notification" in window) {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            setUser(prev => ({
              ...prev,
              waterStats: { ...prev.waterStats, remindersEnabled: true }
            }));
            new Notification("Meta Chef IA", {
              body: "Lembretes de hidratação ativados com sucesso!",
              icon: "/favicon.ico"
            });
          } else {
            alert("As notificações estão bloqueadas. Por favor, libere-as nas configurações do seu navegador.");
          }
        } catch (e) {
          console.error("Erro ao solicitar notificações", e);
        }
      } else {
        alert("Seu navegador não suporta notificações nativas.");
      }
    } else {
      setUser(prev => ({
        ...prev,
        waterStats: { ...prev.waterStats, remindersEnabled: false }
      }));
    }
  };

  return (
    <div className="bg-neutral-900 rounded-[2.5rem] border border-cyan-500/20 p-6 relative overflow-hidden group shadow-2xl">
      {/* Background Effect - Wave filling up (Z-0) */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-cyan-500/10 transition-all duration-1000 ease-out z-0 pointer-events-none" 
        style={{ height: `${progress}%` }}
      >
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent to-cyan-500/20 blur-sm"></div>
      </div>

      {/* Main Content (Z-10) */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="pointer-events-none">
            <h3 className="text-xl font-black text-white flex items-center gap-2 italic">
              <Droplets className="text-cyan-400" size={20} /> BIO-HIDRATAÇÃO
            </h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Monitoramento IA Ativo</p>
          </div>
          
          {/* Top Control Buttons (Z-20 para garantir clique) */}
          <div className="flex gap-2 relative z-20">
            <button 
                type="button"
                onClick={resetToday}
                className="p-3.5 rounded-2xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 active:scale-90 transition-all cursor-pointer shadow-lg"
                title="Zerar hoje"
            >
                <RotateCcw size={20} />
            </button>
            <button 
                type="button"
                onClick={toggleReminders}
                className={`p-3.5 rounded-2xl border transition-all active:scale-90 cursor-pointer shadow-lg ${stats.remindersEnabled ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
                title={stats.remindersEnabled ? "Lembretes Ligados" : "Lembretes Desligados"}
            >
                {stats.remindersEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8 pointer-events-none">
          <div className="relative w-44 h-44">
            <svg className="w-full h-full -rotate-90 scale-110">
              <circle cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-neutral-800" />
              <circle 
                cx="50%" cy="50%" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all duration-1000" 
                strokeDasharray={440} 
                strokeDashoffset={440 - (440 * progress) / 100} 
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white leading-none tracking-tighter">{stats.current}</span>
              <div className="flex items-center gap-1 mt-1">
                 <span className="text-[10px] text-neutral-500 font-bold uppercase">de {stats.goal}ml</span>
                 {progress >= 100 && <Check size={12} className="text-cyan-400" />}
              </div>
            </div>
          </div>
        </div>

        {/* Adding Buttons (Z-20) */}
        <div className="grid grid-cols-3 gap-3 relative z-20">
          {[
            { ml: 250, label: 'Copo' },
            { ml: 500, label: 'Garrafa' },
            { ml: 1000, label: 'Max' }
          ].map((item) => (
            <button 
              key={item.ml}
              type="button"
              onClick={() => addWater(item.ml)}
              className="bg-black border border-neutral-800 rounded-2xl py-4 flex flex-col items-center gap-1 hover:border-cyan-400 hover:bg-cyan-500/5 transition-all active:scale-95 group/btn cursor-pointer shadow-md"
            >
              <Plus size={14} className="text-cyan-400 group-hover/btn:scale-125 transition-transform" />
              <span className="text-base font-black text-white">{item.ml}ml</span>
              <span className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Celebration Overlay (Z-30) */}
        {showCelebration && (
          <div className="absolute inset-0 bg-cyan-500/95 backdrop-blur-xl flex flex-col items-center justify-center text-black z-30 animate-fade-in p-6 text-center">
            <button onClick={() => setShowCelebration(false)} className="absolute top-6 right-6 p-2 bg-black/10 rounded-full text-black hover:bg-black/20"><X size={24}/></button>
            <Trophy size={64} className="mb-4 animate-bounce" />
            <h4 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">HIDRATAÇÃO CONCLUÍDA!</h4>
            <p className="text-xs font-bold uppercase tracking-widest mb-8 opacity-80 text-black/70">Você atingiu sua meta biológica de hoje.</p>
            
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                <button 
                  type="button"
                  onClick={() => setShowCelebration(false)} 
                  className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Continuar Bebendo
                </button>
                <button 
                  type="button"
                  onClick={resetToday}
                  className="w-full py-3 bg-white/20 text-black border border-black/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/40 transition-all"
                >
                  Reiniciar Hoje
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterTracker;
