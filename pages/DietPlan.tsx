
import React, { useState, useMemo } from 'react';
import { UserProfile, MealSuggestion, Recipe, HealthGoal } from '../types';
import { MOCK_RECIPES } from '../constants';
import RecipeCard from '../components/RecipeCard';
import WaterTracker from '../components/WaterTracker';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Flame, Utensils, Award, Info, CalendarRange, Droplet, Scale, Calendar, RefreshCw, Loader2, Dumbbell, Timer, Zap, List, Search, X, Filter, ChevronRight, Clock, Soup, Salad, Coffee, CakeSlice, Fish, Drumstick, Beef, Carrot, Package, GlassWater, Lock } from 'lucide-react';
import { generateDailyPlan, generateSingleMeal } from '../services/geminiService';

interface DietPlanProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>; 
}

const DAILY_FREE_LIMIT = 3;

const DietPlan: React.FC<DietPlanProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentPlan, setCurrentPlan] = useState(user.dietPlan);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);

  // Manual Selection State
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [targetMealSlot, setTargetMealSlot] = useState<'breakfast' | 'lunch' | 'snacks' | 'dinner' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Freemium Logic
  const today = new Date().toISOString().split('T')[0];
  const usage = user.usageStats || { lastDietGenDate: '', dietGenCount: 0 };
  const dailyCount = usage.lastDietGenDate === today ? usage.dietGenCount : 0;
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user.isPremium && remainingGens === 0;

  const updateDietUsage = () => {
      setUser(prev => ({
          ...prev,
          usageStats: {
              ...prev.usageStats,
              lastDietGenDate: today,
              dietGenCount: (prev.usageStats.lastDietGenDate === today ? prev.usageStats.dietGenCount : 0) + 1
          }
      }));
  };

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const allRecipes = useMemo(() => {
      return [...MOCK_RECIPES, ...user.customRecipes];
  }, [user.customRecipes]);

  // Helper to map meal slots to recipe categories
  const getCategoriesForSlot = (slot: string | null) => {
      switch(slot) {
          case 'breakfast': return ['Café da Manhã', 'Sucos'];
          case 'lunch': return ['Almoço', 'Marmitas'];
          case 'dinner': return ['Jantar', 'Sopas', 'Almoço', 'Marmitas'];
          case 'snacks': return ['Lanches', 'Sucos', 'Sobremesas'];
          default: return [];
      }
  };

  const getSlotTitle = (slot: string | null) => {
      switch(slot) {
          case 'breakfast': return 'Café da Manhã';
          case 'lunch': return 'Almoço';
          case 'dinner': return 'Jantar';
          case 'snacks': return 'Lanches';
          default: return 'Refeição';
      }
  };

  const getRecipeVisual = (recipe: Recipe) => {
    const visualKey = recipe.image;
    if (visualKey.startsWith('data:') || visualKey.startsWith('http')) {
        return { type: 'image', src: visualKey }; 
    }

    switch (visualKey) {
        case 'icon:soup': 
            return { type: 'icon', icon: <Soup size={32} />, bg: 'bg-amber-900/30', text: 'text-amber-500' };
        case 'icon:salad': 
            return { type: 'icon', icon: <Salad size={32} />, bg: 'bg-green-900/30', text: 'text-neon-400' };
        case 'icon:juice-green': 
            return { type: 'icon', icon: <GlassWater size={32} />, bg: 'bg-green-900/30', text: 'text-neon-400' };
        case 'icon:juice-red': 
            return { type: 'icon', icon: <GlassWater size={32} />, bg: 'bg-rose-900/30', text: 'text-rose-500' };
        case 'icon:juice-orange': 
            return { type: 'icon', icon: <GlassWater size={32} />, bg: 'bg-orange-900/30', text: 'text-orange-500' };
        case 'icon:breakfast': 
            return { type: 'icon', icon: <Coffee size={32} />, bg: 'bg-stone-800', text: 'text-stone-400' };
        case 'icon:dessert': 
            return { type: 'icon', icon: <CakeSlice size={32} />, bg: 'bg-pink-900/30', text: 'text-pink-500' };
        case 'icon:fish': 
            return { type: 'icon', icon: <Fish size={32} />, bg: 'bg-cyan-900/30', text: 'text-cyan-400' };
        case 'icon:chicken': 
            return { type: 'icon', icon: <Drumstick size={32} />, bg: 'bg-yellow-900/30', text: 'text-yellow-500' };
        case 'icon:meat': 
            return { type: 'icon', icon: <Beef size={32} />, bg: 'bg-red-900/30', text: 'text-red-500' };
        case 'icon:veggie': 
            return { type: 'icon', icon: <Carrot size={32} />, bg: 'bg-emerald-900/30', text: 'text-emerald-400' };
        case 'icon:marmita': 
            return { type: 'icon', icon: <Package size={32} />, bg: 'bg-indigo-900/30', text: 'text-indigo-400' }; 
        case 'icon:pasta': 
            return { type: 'icon', icon: <Utensils size={32} />, bg: 'bg-orange-900/30', text: 'text-orange-400' };
        default: 
            return { type: 'icon', icon: <Utensils size={32} />, bg: 'bg-neutral-800', text: 'text-neutral-500' };
    }
  };

  const getSmartIconForDescription = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('ovo') || t.includes('omelete') || t.includes('café') || t.includes('pão')) return 'icon:breakfast';
    if (t.includes('salada') || t.includes('verde') || t.includes('folhas')) return 'icon:salad';
    if (t.includes('suco') || t.includes('vitamina') || t.includes('shake')) return 'icon:juice-green';
    if (t.includes('sopa') || t.includes('caldo') || t.includes('creme')) return 'icon:soup';
    if (t.includes('frango') || t.includes('galinha')) return 'icon:chicken';
    if (t.includes('peixe') || t.includes('salmão') || t.includes('tilápia')) return 'icon:fish';
    if (t.includes('carne') || t.includes('bife') || t.includes('hambúrguer')) return 'icon:meat';
    if (t.includes('doce') || t.includes('bolo') || t.includes('chocolate')) return 'icon:dessert';
    if (t.includes('macarrão') || t.includes('massa')) return 'icon:pasta';
    return 'icon:marmita';
  };

  const filteredRecipes = useMemo(() => {
      if (searchTerm) {
          return allRecipes.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      if (targetMealSlot) {
          const allowedCategories = getCategoriesForSlot(targetMealSlot);
          return allRecipes.filter(r => allowedCategories.includes(r.category));
      }
      return allRecipes;
  }, [allRecipes, searchTerm, targetMealSlot]);

  const handleDateSelect = (date: Date) => setSelectedDate(date);

  const handleGenerateForDate = async () => {
    if (isLimitReached) {
        navigate('/premium');
        return;
    }
    
    setIsGenerating(true);
    try {
        const newPlan = await generateDailyPlan(user, selectedDate);
        setCurrentPlan(newPlan);
        if (setUser) setUser(prev => ({ ...prev, dietPlan: newPlan }));
        updateDietUsage();
    } catch (error) {
        alert("Erro ao gerar plano.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRegenerateMeal = async (mealKey: 'breakfast' | 'lunch' | 'snacks' | 'dinner') => {
      if (regeneratingMeal) return;
      
      if (isLimitReached) {
          navigate('/premium');
          return;
      }

      setRegeneratingMeal(mealKey);
      try {
          const newMeal = await generateSingleMeal(user, mealKey);
          setCurrentPlan(prev => {
              if (!prev) return prev;
              const updatedPlan = { ...prev, meals: { ...prev.meals, [mealKey]: newMeal } };
              if (setUser) setUser(u => ({ ...u, dietPlan: updatedPlan }));
              return updatedPlan;
          });
          updateDietUsage();
      } catch (error) {
          alert("Erro ao regenerar.");
      } finally {
          setRegeneratingMeal(null);
      }
  };

  const openRecipeSelector = (mealKey: 'breakfast' | 'lunch' | 'snacks' | 'dinner') => {
      setTargetMealSlot(mealKey);
      setSearchTerm('');
      setIsSelectorOpen(true);
  };

  const handleManualSelection = (recipe: Recipe) => {
      if (!targetMealSlot || !currentPlan) return;
      const newMeal: MealSuggestion = {
          description: recipe.title, 
          recipeIds: [recipe.id]
      };
      const updatedPlan = { 
          ...currentPlan, 
          meals: { ...currentPlan.meals, [targetMealSlot]: newMeal } 
      };
      setCurrentPlan(updatedPlan);
      if (setUser) setUser(prev => ({ ...prev, dietPlan: updatedPlan }));
      setIsSelectorOpen(false);
      setTargetMealSlot(null);
  };

  const getSuggestedRecipes = (ids: string[]) => {
    if (!ids || ids.length === 0) return [];
    return allRecipes.filter(r => ids.includes(r.id));
  };

  const renderMealSection = (title: string, meal: MealSuggestion, mealKey: 'breakfast' | 'lunch' | 'snacks' | 'dinner') => {
    const recipes = getSuggestedRecipes(meal.recipeIds);
    let mainRecipe = recipes[0];
    const isLoading = regeneratingMeal === mealKey;

    if (!mainRecipe && meal.description) {
        mainRecipe = {
            id: `temp-${Date.now()}-${Math.random()}`,
            title: meal.description.split('.')[0].substring(0, 50) + (meal.description.length > 50 ? '...' : ''),
            description: meal.description,
            image: getSmartIconForDescription(meal.description),
            timeMinutes: 15, 
            calories: 300,
            tags: [HealthGoal.GENERAL],
            isQuick: true,
            category: title,
            ingredients: ["Ingredientes baseados na descrição sugerida."],
            steps: ["Siga as instruções da descrição acima.", meal.description],
            tip: "Ajuste as porções conforme sua necessidade calórica."
        } as unknown as Recipe;
    }

    return (
        <div className="p-5 border-b border-neutral-800 last:border-0 relative group">
            {isLoading && (
                <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-neon-400" />
                </div>
            )}
            
            <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold text-black uppercase bg-neon-400 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                    {title}
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => openRecipeSelector(mealKey)}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-700 hover:border-neutral-500 px-2 py-1 rounded-lg transition-all"
                    >
                        <List size={12} />
                        Escolher
                    </button>
                    <button 
                        onClick={() => handleRegenerateMeal(mealKey)}
                        disabled={!!regeneratingMeal}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 hover:text-white bg-neutral-900 border border-neutral-700 hover:border-neutral-500 px-2 py-1 rounded-lg transition-all"
                    >
                        {isLimitReached ? <Lock size={10} className="text-orange-500" /> : <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />}
                        Trocar
                    </button>
                </div>
            </div>
            
            {mainRecipe ? (
                <div 
                    onClick={() => navigate(`/recipe/${mainRecipe.id}`, { state: { customRecipe: mainRecipe } })}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 cursor-pointer hover:border-neon-400/60 hover:bg-neutral-800/50 transition-all group/card relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover/card:opacity-100 transition-opacity">
                         <ChevronRight size={20} className="text-neon-400" />
                    </div>

                    <div className="flex gap-4 items-start mb-3">
                        <div className="shrink-0">
                             {(() => {
                                 const visual = getRecipeVisual(mainRecipe);
                                 if (visual.type === 'image') {
                                     return <img src={visual.src} className="w-16 h-16 rounded-xl object-cover border border-neutral-700" alt="" />;
                                 }
                                 return (
                                     <div className={`w-16 h-16 rounded-xl flex items-center justify-center border border-neutral-800 ${visual.bg} ${visual.text}`}>
                                         {visual.icon}
                                     </div>
                                 );
                             })()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-base leading-tight mb-2 group-hover/card:text-neon-400 transition-colors line-clamp-2">
                                {mainRecipe.title}
                            </h4>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-black px-1.5 py-0.5 rounded border border-neutral-800">
                                    <Clock size={10} /> {mainRecipe.timeMinutes} min
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-black px-1.5 py-0.5 rounded border border-neutral-800">
                                    <Flame size={10} /> {mainRecipe.calories} kcal
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-neutral-800 pt-3 mt-1">
                        <p className="text-neutral-400 text-sm leading-relaxed line-clamp-4">
                            {meal.description}
                        </p>
                    </div>
                </div>
            ) : null}
        </div>
    );
  };

  const weekday = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' });

  return (
    <div className="pb-24 bg-black min-h-screen">
      
      {/* RECIPE SELECTOR MODAL */}
      {isSelectorOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-fade-in">
              <div className="p-4 bg-neutral-900 border-b border-neutral-800 flex items-center gap-4 shadow-lg sticky top-0 z-10">
                  <button onClick={() => setIsSelectorOpen(false)} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700 text-white"><ChevronLeft size={24} /></button>
                  <div className="flex-1 relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input 
                        type="text" 
                        placeholder={`Buscar em ${getSlotTitle(targetMealSlot)}...`} 
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black border border-neutral-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-neutral-600 outline-none focus:border-neon-400"
                      />
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid grid-cols-1 gap-4">
                      {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => (
                          <div key={recipe.id} onClick={() => handleManualSelection(recipe)} className="flex items-center gap-4 bg-neutral-900 p-3 rounded-2xl border border-neutral-800 hover:border-neon-400 cursor-pointer transition-all group">
                              <div className="w-16 h-16 rounded-xl bg-black overflow-hidden flex-shrink-0 relative">
                                  {recipe.image.startsWith('icon:') ? (
                                      <div className="w-full h-full flex items-center justify-center text-neutral-600"><Utensils size={24} /></div>
                                  ) : (
                                      <img src={recipe.image} className="w-full h-full object-cover opacity-80" alt="" />
                                  )}
                              </div>
                              <div className="flex-1">
                                  <h4 className="font-bold text-white text-sm line-clamp-1">{recipe.title}</h4>
                                  <div className="flex gap-2 mt-1">
                                      <span className="text-[10px] bg-black px-2 py-0.5 rounded text-neutral-400">{recipe.calories} kcal</span>
                                  </div>
                              </div>
                              <ChevronRight size={16} className="text-neutral-600" />
                          </div>
                      )) : null}
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="bg-neutral-900 p-8 pb-12 rounded-b-[3rem] shadow-lg relative overflow-hidden border-b border-neutral-800">
        <div className="relative z-10">
            {!isHomePage && (
                <div className="flex items-center gap-2 mb-6 opacity-80 cursor-pointer hover:opacity-100 transition-opacity w-fit text-white" onClick={() => navigate('/profile')}>
                    <ChevronLeft size={20} />
                    <span className="text-sm font-medium">Voltar</span>
                </div>
            )}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-white mb-2">{isHomePage ? `Olá, ${user.name}!` : 'Seu Plano'}</h1>
                    <div className="flex flex-wrap gap-2">
                        {Array.isArray(user.goal) ? user.goal.map((g, i) => (
                            <span key={i} className="text-[10px] bg-black border border-neutral-800 px-2 py-1 rounded text-neutral-400 font-bold uppercase">
                                {g}
                            </span>
                        )) : null}
                    </div>
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
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-20 space-y-4 animate-fade-in">
        
        {/* Calendar Strip */}
        <div className="bg-neutral-900 p-4 rounded-2xl shadow-lg border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <Calendar size={18} className="text-neon-400" />
                    Selecione o Dia
                </h3>
                <span className="text-xs font-bold text-black bg-neon-400 px-2 py-1 rounded capitalize">
                    {weekday}
                </span>
            </div>
            <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
                {calendarDays.map((date, idx) => {
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    return (
                        <button
                            key={idx}
                            onClick={() => handleDateSelect(date)}
                            className={`flex flex-col items-center justify-center min-w-[3rem] p-2 rounded-xl transition-all border ${
                                isSelected 
                                ? 'bg-neon-400 text-black border-neon-400 shadow-[0_0_10px_rgba(204,255,0,0.4)] scale-105' 
                                : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-600'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                            <span className="text-lg font-black">{date.getDate()}</span>
                        </button>
                    )
                })}
            </div>

            <button 
                onClick={handleGenerateForDate}
                disabled={isGenerating || isLimitReached}
                className={`w-full mt-4 text-black py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-70 ${isLimitReached ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white hover:bg-neutral-200'}`}
            >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : isLimitReached ? <Lock size={18} /> : <RefreshCw size={18} />}
                <span>{isLimitReached ? 'Limite Diário Atingido' : 'Gerar Cardápio Diário'}</span>
            </button>
        </div>

        {/* BIO-HIDRATAÇÃO CARD */}
        <WaterTracker user={user} setUser={setUser} />

        {/* Calories Card */}
        {currentPlan && (
          <>
            <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg flex items-center justify-between border border-neutral-800">
                <div>
                    <p className="text-neon-400 text-xs font-bold uppercase tracking-wider mb-1">Meta Calórica Diária</p>
                    <h2 className="text-4xl font-black text-white tracking-tight">{currentPlan.calories} <span className="text-sm font-bold text-neutral-500">kcal</span></h2>
                </div>
                <Flame size={32} className="text-orange-500 fill-orange-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-3">
                {['Proteína', 'Carbos', 'Gorduras'].map((m, i) => {
                     const values = [currentPlan.macros.protein, currentPlan.macros.carbs, currentPlan.macros.fats];
                     return (
                        <div key={i} className="bg-neutral-900 p-4 rounded-2xl shadow-sm text-center border border-neutral-800">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">{m}</p>
                            <p className="text-lg font-bold text-white">{values[i]}</p>
                        </div>
                     )
                })}
            </div>

            {currentPlan.dailyWorkout && (
                <div className="bg-neutral-900 rounded-2xl shadow-lg border border-neutral-800 overflow-hidden text-white mt-2">
                    <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black/30">
                        <div className="flex items-center gap-2">
                            <Dumbbell size={18} className="text-neon-400" />
                            <h3 className="font-bold">Treino do Dia</h3>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        {currentPlan.dailyWorkout.exercises.slice(0, 3).map((ex, i) => (
                             <div key={i} className="flex justify-between items-center text-sm border-b border-neutral-800 pb-2 last:border-0 last:pb-0">
                                <span className="font-medium text-neutral-300 flex-1">{ex.name}</span>
                                <span className="flex items-center gap-1 text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">
                                    <Timer size={10} /> {ex.duration}
                                </span>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-neutral-900 rounded-2xl shadow-sm border border-neutral-800 overflow-hidden mt-4">
                <div className="p-4 border-b border-neutral-800 bg-black/20 flex items-center gap-2">
                    <Utensils size={18} className="text-neon-400" />
                    <h3 className="font-bold text-white">Cardápio Sugerido</h3>
                </div>
                <div className="divide-y divide-neutral-800">
                    {renderMealSection("Café da Manhã", currentPlan.meals.breakfast, 'breakfast')}
                    {renderMealSection("Almoço", currentPlan.meals.lunch, 'lunch')}
                    {renderMealSection("Lanches", currentPlan.meals.snacks, 'snacks')}
                    {renderMealSection("Jantar", currentPlan.meals.dinner, 'dinner')}
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DietPlan;
