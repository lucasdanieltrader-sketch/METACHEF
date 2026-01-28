import React, { useState } from 'react';
import { UserProfile } from '../types';
import { TROPHIES } from '../constants';
import { ArrowLeft, Flame, Calendar as CalIcon, Award, CheckCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyProgressProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const DailyProgress: React.FC<DailyProgressProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const progress = user.dailyProgress || { checkInDates: [], currentStreak: 0, lastCheckIn: null };
  const hasCheckedInToday = progress.checkInDates.includes(today);
  const currentDate = new Date();
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const totalCheckIns = progress.checkInDates.length;
  const unlockedTrophies = TROPHIES.filter(t => totalCheckIns >= t.day);
  const nextTrophy = TROPHIES.find(t => totalCheckIns + 1 === t.day);

  const handleCheckIn = () => {
    if (hasCheckedInToday) return;
    setJustCheckedIn(true);
    let newStreak = 1;
    if (progress.lastCheckIn) {
        const last = new Date(progress.lastCheckIn);
        const now = new Date(today);
        const diffDays = Math.ceil(Math.abs(now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)); 
        if (diffDays === 1) newStreak = progress.currentStreak + 1;
        else if (diffDays === 0) newStreak = progress.currentStreak;
    }
    setUser(prev => ({ ...prev, dailyProgress: { checkInDates: [...progress.checkInDates, today], currentStreak: newStreak, lastCheckIn: today } }));
    setTimeout(() => setJustCheckedIn(false), 3000);
  };

  return (
    <div className="pb-24 min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-neutral-900 to-transparent pointer-events-none" />
      
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors"><ArrowLeft size={20} /></button>
            <div className="flex items-center gap-2 bg-black border border-orange-500/50 px-3 py-1 rounded-full">
                <Flame size={18} className="text-orange-500 fill-orange-500 animate-pulse" />
                <span className="font-bold text-orange-400">{progress.currentStreak} Dias</span>
            </div>
        </div>

        <h1 className="text-3xl font-bold mb-1">Evolução</h1>
        <p className="text-neutral-400 text-sm mb-8">Consistência é a chave.</p>

        <div className="flex flex-col items-center justify-center mb-12 relative">
            <div className={`absolute inset-0 bg-neon-400/20 rounded-full blur-3xl transition-all duration-1000 ${justCheckedIn ? 'scale-150 opacity-0' : 'scale-100 opacity-50'}`} />
            <button onClick={handleCheckIn} disabled={hasCheckedInToday} className={`w-48 h-48 rounded-full flex flex-col items-center justify-center relative z-10 transition-all duration-500 shadow-[0_0_30px_rgba(204,255,0,0.1)] border-4 ${hasCheckedInToday ? 'bg-neutral-900 border-neutral-800 cursor-default scale-95' : 'bg-black border-neon-400 hover:scale-105 hover:shadow-[0_0_40px_rgba(204,255,0,0.4)] cursor-pointer animate-pulse-slow'}`}>
                {hasCheckedInToday ? (
                    <><CheckCircle size={48} className="text-neon-400 mb-2" /><span className="font-bold text-neutral-300">Completo</span></>
                ) : (
                    <><Award size={48} className="text-white mb-2" /><span className="font-bold text-xl text-neon-400">CHECK-IN</span></>
                )}
            </button>
        </div>

        <div className="mb-10">
            <div className="flex items-center gap-2 mb-4 text-neutral-300"><CalIcon size={18} /><span className="font-bold capitalize">Calendário</span></div>
            <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
                <div className="grid grid-cols-7 gap-2 text-center">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const isChecked = progress.checkInDates.some(str => new Date(str).getDate() === d && new Date(str).getMonth() === currentDate.getMonth());
                        return <div key={d} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${isChecked ? 'bg-neon-400 text-black shadow-[0_0_5px_rgba(204,255,0,0.5)]' : 'bg-black text-neutral-600 border border-neutral-800'}`}>{d}</div>;
                    })}
                </div>
            </div>
        </div>

        <div>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold flex items-center gap-2"><Award size={20} className="text-yellow-400" /> Troféus</h2><span className="text-xs text-black font-bold bg-neon-400 px-2 py-1 rounded-full">{unlockedTrophies.length} / {TROPHIES.length}</span></div>
            <div className="grid grid-cols-2 gap-3">
                {unlockedTrophies.slice().reverse().map((trophy) => (
                    <div key={trophy.day} className="bg-neutral-900 p-3 rounded-xl border border-neutral-800 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-black border border-neutral-700`}>{trophy.icon}</div>
                        <div><p className="font-bold text-sm text-white">{trophy.title}</p><p className="text-[10px] text-neutral-500">Dia {trophy.day}</p></div>
                    </div>
                ))}
                 {TROPHIES.slice(unlockedTrophies.length, unlockedTrophies.length + 2).map((trophy) => (
                    <div key={trophy.day} className="bg-black p-3 rounded-xl border border-neutral-800 flex items-center gap-3 opacity-50">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-600"><Lock size={14} /></div>
                         <div><p className="font-bold text-sm text-neutral-600">Bloqueado</p><p className="text-[10px] text-neutral-700">Dia {trophy.day}</p></div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProgress;