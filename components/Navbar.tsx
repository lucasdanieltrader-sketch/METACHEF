
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Camera, User, Salad, Dumbbell, ActivitySquare, MessageSquare, Footprints } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path ? 'text-neon-400 scale-110 font-bold drop-shadow-[0_0_8px_rgba(204,255,0,0.5)]' : 'text-neutral-500 font-medium hover:text-white';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] pb-safe z-50">
      <div className="flex justify-between items-center h-24 px-2 sm:px-4 max-w-md mx-auto overflow-x-auto no-scrollbar">
        <Link to="/" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/')}`}>
          <LayoutDashboard size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Início</span>
        </Link>
        
        <Link to="/recipes" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/recipes')}`}>
          <Salad size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Receitas</span>
        </Link>

        <Link to="/chat" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/chat')}`}>
          <MessageSquare size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Chat</span>
        </Link>

        <Link to="/activity" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/activity')}`}>
          <Footprints size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Move</span>
        </Link>

        <Link to="/scan" className="relative -top-6 group mx-1 flex-shrink-0">
          <div className="bg-neon-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)] hover:shadow-[0_0_30px_rgba(204,255,0,0.6)] transition-all hover:-translate-y-1 border-[4px] border-black group-active:scale-95">
            <Camera size={26} strokeWidth={2.5} />
          </div>
        </Link>
        
        <Link to="/workout" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/workout')}`}>
          <Dumbbell size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Treino</span>
        </Link>

        <Link to="/shape-checkin" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/shape-checkin')}`}>
          <ActivitySquare size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Shape</span>
        </Link>

        <Link to="/profile" className={`flex flex-col items-center justify-center min-w-[3.5rem] h-full transition-all active:scale-95 ${isActive('/profile')}`}>
          <User size={20} strokeWidth={2.5} />
          <span className="text-[8px] mt-1.5 uppercase tracking-wide">Perfil</span>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
