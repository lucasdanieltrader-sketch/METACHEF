
import React, { useState, useMemo } from 'react';
import { UserProfile, Recipe, HealthGoal } from '../types';
import RecipeCard from '../components/RecipeCard';
import { MOCK_RECIPES } from '../constants';
import { Search, Package, Loader2, Sparkles, ChefHat, Wand2, ArrowRight, Lock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateCustomRecipe } from '../services/geminiService';

interface HomeProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const DAILY_FREE_LIMIT = 3;

const Home: React.FC<HomeProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chefIngredients, setChefIngredients] = useState<string>('');
  const [isChefGenerating, setIsChefGenerating] = useState(false);
  
  const isAllRecipesMode = location.pathname === '/recipes';

  // Lógica de Uso Freemium para o Chef IA
  const today = new Date().toISOString().split('T')[0];
  const usage = user.usageStats || { lastChefGenDate: '', chefGenCount: 0 };
  const dailyCount = usage.lastChefGenDate === today ? usage.chefGenCount : 0;
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user.isPremium && remainingGens <= 0;

  const displayedRecipes = useMemo(() => {
    let recipes = [...(MOCK_RECIPES || []), ...(user.customRecipes || [])];

    if (activeCategory) {
      if (activeCategory === 'Favoritos') {
        recipes = recipes.filter(r => user.favorites.includes(r.id));
      } else if (activeCategory === 'Low Carb') {
        recipes = recipes.filter(r => r.tags?.includes(HealthGoal.LOW_CARB));
      } else if (activeCategory === 'Marmitas') {
        recipes = recipes.filter(r => r.tags?.includes(HealthGoal.MARMITA));
      } else {
        recipes = recipes.filter(r => r.category === activeCategory);
      }
    }

    if (searchQuery && searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      recipes = recipes.filter(r => 
        (r.title || "").toLowerCase().includes(lowerQuery) || 
        (r.category || "").toLowerCase().includes(lowerQuery)
      );
    } else if (!activeCategory && !isAllRecipesMode) {
      const userGoals = Array.isArray(user.goal) ? user.goal : [user.goal];
      recipes = recipes.filter(r => r.tags?.some(tag => userGoals.includes(tag)));
    }
    
    return recipes;
  }, [activeCategory, user.goal, searchQuery, isAllRecipesMode, user.favorites, user.customRecipes]);

  const handleChefIA = async () => {
      if (!chefIngredients.trim()) return;
      
      if (isLimitReached) {
          navigate('/premium');
          return;
      }

      setIsChefGenerating(true);
      try {
          const newRecipe = await generateCustomRecipe(chefIngredients, user);
          
          setUser(prev => ({
              ...prev,
              customRecipes: [newRecipe, ...prev.customRecipes],
              usageStats: {
                  ...prev.usageStats,
                  lastChefGenDate: today,
                  chefGenCount: dailyCount + 1
              }
          }));
          
          navigate(`/recipe/${newRecipe.id}`, { state: { customRecipe: newRecipe } });
      } catch (error) {
          alert("O Chef IA se atrapalhou nos temperos. Tente novamente!");
      } finally {
          setIsChefGenerating(false);
          setChefIngredients('');
      }
  };

  return (
    <div className="pb-28 pt-10 px-6 bg-black min-h-screen animate-fade-in">
      <header className="mb-6 flex justify-between items-end">
          <div>
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">
                  {isAllRecipesMode ? 'Receitas' : `Olá, ${user.name}!`}
              </h1>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  {isAllRecipesMode ? 'Cardápio Inteligente' : 'O que vamos cozinhar hoje?'}
              </p>
          </div>
          <div className="bg-neutral-900 p-2 rounded-xl border border-neutral-800">
              <ChefHat size={24} className="text-neon-400" />
          </div>
      </header>

      {/* CHEF IA - CARD FIXO E DESTACADO COM CONTADOR */}
      <section className="mb-8">
          <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-[2.5rem] border border-neon-400/20 p-6 shadow-neon/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-neon-400/5 rounded-full blur-3xl group-hover:bg-neon-400/10 transition-all duration-700"></div>
              
              <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-black text-white flex items-center gap-2">
                          <Sparkles className="text-neon-400 animate-pulse" size={20} /> CHEF IA
                      </h3>
                      
                      <div className="flex items-center gap-2">
                          {!user.isPremium && (
                              <div className={`px-2 py-1 rounded-lg border flex flex-col items-center ${remainingGens === 0 ? 'border-red-500 bg-red-500/10' : 'border-neon-400 bg-neon-400/10'}`}>
                                  <span className="text-[8px] font-black text-white uppercase opacity-70">Restam</span>
                                  <span className={`text-xs font-black ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>
                                      {remainingGens} usos
                                  </span>
                              </div>
                          )}
                          <span className="text-[10px] font-black text-neon-400 border border-neon-400/30 px-2 py-1 rounded-lg uppercase tracking-widest bg-black/40 hidden xs:block">Modo Mágico</span>
                      </div>
                  </div>

                  <p className="text-xs text-neutral-400 font-medium mb-4 leading-relaxed">
                      Digite os ingredientes que você tem na geladeira e eu crio uma receita saudável exclusiva para você.
                  </p>
                  
                  <div className="relative">
                      <textarea 
                        value={chefIngredients}
                        onChange={(e) => setChefIngredients(e.target.value)}
                        placeholder="Ex: Frango, brócolis, queijo cottage, batata doce..."
                        className="w-full bg-black border border-neutral-800 rounded-2xl p-4 text-white text-sm outline-none focus:border-neon-400 min-h-[100px] resize-none placeholder:text-neutral-700 transition-all mb-4"
                      />
                      <button 
                        onClick={handleChefIA}
                        disabled={isChefGenerating || !chefIngredients.trim()}
                        className={`w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-neon active:scale-95 disabled:opacity-50 transition-all group/btn ${isLimitReached ? 'bg-neutral-800 text-neutral-500' : 'bg-neon-400 text-black hover:bg-neon-500'}`}
                      >
                        {isChefGenerating ? (
                            <Loader2 className="animate-spin" />
                        ) : isLimitReached ? (
                            <Lock size={20} />
                        ) : (
                            <Wand2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                        )}
                        
                        {isChefGenerating ? 'MAGIA EM ANDAMENTO...' : isLimitReached ? 'LIMITE DIÁRIO ATINGIDO' : 'CRIAR RECEITA AGORA'}
                        
                        {!isChefGenerating && !isLimitReached && (
                            <ArrowRight size={18} className="ml-1 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                        )}
                      </button>
                      
                      {isLimitReached && (
                          <p onClick={() => navigate('/premium')} className="text-center text-[10px] text-neutral-500 mt-3 font-bold uppercase tracking-widest cursor-pointer hover:text-neon-400 transition-colors flex items-center justify-center gap-1">
                              <Sparkles size={10} /> Assine Premium para uso ilimitado
                          </p>
                      )}
                  </div>
              </div>
          </div>
      </section>

      {/* Filtros e Busca */}
      <div className="space-y-6 mb-8">
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar no catálogo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-5 rounded-3xl border border-neutral-800 bg-neutral-900 text-white placeholder:text-neutral-600 focus:ring-2 focus:ring-neon-400 transition-all font-medium"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500" size={24} />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
            {['Favoritos', 'Low Carb', 'Marmitas', 'Café da Manhã', 'Almoço', 'Jantar', 'Lanches', 'Sucos', 'Sobremesas'].map((cat) => (
              <button 
                key={cat} 
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`flex-shrink-0 px-6 py-3 rounded-full font-bold text-sm transition-all border ${activeCategory === cat ? 'bg-white text-black border-white shadow-lg scale-105' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>
      </div>

      {/* Grid de Receitas */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
            <h2 className="text-2xl font-black text-white">
                {searchQuery ? 'Resultados' : activeCategory || 'Sugestões Meta Chef'}
            </h2>
            {(activeCategory || searchQuery) && (
                <button 
                  onClick={() => { setActiveCategory(null); setSearchQuery(''); }} 
                  className="text-[10px] text-neutral-500 font-black uppercase tracking-widest hover:text-neon-400"
                >
                    Limpar Filtros
                </button>
            )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => navigate(`/recipe/${recipe.id}`)} />
          ))}
          {displayedRecipes.length === 0 && (
              <div className="col-span-full text-center py-24 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
                  <Package size={48} className="text-neutral-800 mx-auto mb-4" />
                  <p className="text-neutral-500 font-bold uppercase text-xs tracking-widest">Nenhuma receita encontrada.</p>
                  <p className="text-neutral-700 text-[10px] mt-2">Tente buscar por outro termo ou categoria.</p>
              </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
