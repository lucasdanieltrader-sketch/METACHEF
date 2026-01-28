import React from 'react';
import { Recipe } from '../types';
import { Clock, Flame, Soup, Salad, Coffee, Utensils, Carrot, Beef, Fish, CakeSlice, GlassWater, Drumstick, Package } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  
  const getVisuals = (visualKey: string) => {
    if (visualKey.startsWith('data:') || visualKey.startsWith('http')) {
        return null; 
    }

    // Adaptado para Dark Mode: Ícones coloridos sobre fundo escuro
    switch (visualKey) {
        case 'icon:soup': 
            return { icon: <Soup size={48} />, bg: 'bg-neutral-800', text: 'text-amber-500' };
        case 'icon:salad': 
            return { icon: <Salad size={48} />, bg: 'bg-neutral-800', text: 'text-neon-400' };
        case 'icon:juice-green': 
            return { icon: <GlassWater size={48} />, bg: 'bg-neutral-800', text: 'text-neon-400' };
        case 'icon:juice-red': 
            return { icon: <GlassWater size={48} />, bg: 'bg-neutral-800', text: 'text-rose-500' };
        case 'icon:juice-orange': 
            return { icon: <GlassWater size={48} />, bg: 'bg-neutral-800', text: 'text-orange-500' };
        case 'icon:breakfast': 
            return { icon: <Coffee size={48} />, bg: 'bg-neutral-800', text: 'text-stone-400' };
        case 'icon:dessert': 
            return { icon: <CakeSlice size={48} />, bg: 'bg-neutral-800', text: 'text-pink-500' };
        case 'icon:fish': 
            return { icon: <Fish size={48} />, bg: 'bg-neutral-800', text: 'text-cyan-400' };
        case 'icon:chicken': 
            return { icon: <Drumstick size={48} />, bg: 'bg-neutral-800', text: 'text-yellow-500' };
        case 'icon:meat': 
            return { icon: <Beef size={48} />, bg: 'bg-neutral-800', text: 'text-red-500' };
        case 'icon:veggie': 
            return { icon: <Carrot size={48} />, bg: 'bg-neutral-800', text: 'text-emerald-400' };
        case 'icon:marmita': 
            return { icon: <Package size={48} />, bg: 'bg-neutral-800', text: 'text-indigo-400' }; 
        case 'icon:pasta': 
            return { icon: <Utensils size={48} />, bg: 'bg-neutral-800', text: 'text-orange-400' };
        default: 
            return { icon: <Utensils size={48} />, bg: 'bg-neutral-800', text: 'text-neutral-500' };
    }
  };

  const visual = getVisuals(recipe.image);

  return (
    <div 
      onClick={onClick}
      className="group bg-neutral-900 rounded-[2rem] shadow-lg hover:shadow-neon/20 border border-neutral-800 overflow-hidden hover:-translate-y-1 transition-all duration-300 cursor-pointer mb-6 flex flex-col h-full relative"
    >
      {/* Visual Header */}
      <div className="relative h-60 w-full flex items-center justify-center overflow-hidden bg-neutral-950">
        {visual ? (
            <div className={`w-full h-full flex items-center justify-center transition-all duration-500 ${visual.bg}`}>
                <div className={`w-24 h-24 rounded-3xl rotate-3 flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/5 shadow-2xl ${visual.text} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                    {visual.icon}
                </div>
            </div>
        ) : (
            <div className="w-full h-full overflow-hidden">
                <img 
                    src={recipe.image} 
                    alt={recipe.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
            </div>
        )}
        
        {recipe.isQuick && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur text-neon-400 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-neon-400/30 z-10">
            Rápida
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between relative">
        <div>
            {/* Tags compactas */}
            <div className="flex flex-wrap gap-2 mb-3">
                {recipe.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 bg-neutral-800 px-3 py-1 rounded-lg border border-neutral-700">
                        {tag}
                    </span>
                ))}
            </div>
            <h3 className="font-black text-xl text-white mb-6 leading-snug line-clamp-2 group-hover:text-neon-400 transition-colors tracking-tight">
                {recipe.title}
            </h3>
        </div>
        
        {/* Footer: Tempo e Calorias */}
        <div className="flex items-center gap-3 mt-auto">
          {/* Tempo */}
          <div className="flex-1 bg-neutral-800 rounded-xl px-3 py-3 flex items-center justify-center gap-2 border border-neutral-700">
            <Clock size={16} strokeWidth={2.5} className="text-neutral-500" />
            <span className="text-sm font-bold text-neutral-300">{recipe.timeMinutes} min</span>
          </div>
          
          {/* Calorias */}
          <div className="flex-1 bg-neutral-800 rounded-xl px-3 py-3 flex items-center justify-center gap-2 border border-neutral-700">
            <Flame size={16} strokeWidth={2.5} className="fill-orange-500 text-orange-500" />
            <span className="text-sm font-bold text-neutral-300">{recipe.calories} kcal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;