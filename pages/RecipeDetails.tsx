import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MOCK_RECIPES } from '../constants';
import { ArrowLeft, Clock, Flame, ChefHat, List, Lightbulb, Heart, Wand2, Loader2, Soup, Salad, Coffee, Utensils, Carrot, Beef, Fish, CakeSlice, GlassWater, Drumstick, Package, Youtube } from 'lucide-react';
import { UserProfile, Recipe } from '../types';
import { generateRecipeImage } from '../services/geminiService';

interface RecipeDetailsProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const RecipeDetails: React.FC<RecipeDetailsProps> = ({ user, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const persistedCustom = user.customRecipes.find(r => r.id === id);
  const stateCustom = location.state?.customRecipe as Recipe | undefined;
  const mockRecipe = MOCK_RECIPES.find(r => r.id === id);
  
  const recipe = persistedCustom || stateCustom || mockRecipe;
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isFavorite = recipe ? user.favorites.includes(recipe.id) : false;

  const toggleFavorite = () => {
    if (!recipe) return;
    setUser(prev => {
        const isFav = prev.favorites.includes(recipe.id);
        let newFavorites = [...prev.favorites];
        let newCustomRecipes = [...prev.customRecipes];
        const isCustom = !MOCK_RECIPES.some(r => r.id === recipe.id);

        if (isFav) {
            newFavorites = newFavorites.filter(fid => fid !== recipe.id);
        } else {
            newFavorites.push(recipe.id);
            if (isCustom && !newCustomRecipes.some(r => r.id === recipe.id)) {
                newCustomRecipes.push(generatedImage ? { ...recipe, image: `data:image/jpeg;base64,${generatedImage}` } : recipe);
            }
        }
        return { ...prev, favorites: newFavorites, customRecipes: newCustomRecipes };
    });
  };

  const handleGenerateImage = async () => {
    if (isGenerating || !recipe) return;
    setIsGenerating(true);
    try {
        const base64Image = await generateRecipeImage(recipe.title);
        setGeneratedImage(base64Image);
    } catch (error) { console.error(error); } finally { setIsGenerating(false); }
  };

  const handleOpenVideo = () => {
    if (!recipe) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`receita ${recipe.title}`)}`, '_blank');
  };

  useEffect(() => {
    if (recipe) {
        const hasRealImage = recipe.image && (recipe.image.startsWith('http') || recipe.image.startsWith('data:'));
        if ((!hasRealImage && !generatedImage) || recipe.image === 'generate-image') handleGenerateImage();
    }
  }, [recipe?.id]);

  if (!recipe) return <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">Receita não encontrada</div>;

  const getIcon = (key: string) => {
      // Icons for fallback
      return <Utensils size={80} className="text-neutral-600" />;
  };

  const hasRealImage = generatedImage || (recipe.image && (recipe.image.startsWith('http') || recipe.image.startsWith('data:')));
  const isCustomRecipe = !MOCK_RECIPES.some(r => r.id === recipe.id);

  return (
    <div className="pb-32 bg-black min-h-screen relative animate-fade-in text-white">
      
      <div className={`relative w-full transition-all duration-700 ${hasRealImage ? 'h-[450px]' : 'h-[450px] flex items-center justify-center bg-neutral-900'}`}>
        {hasRealImage ? (
            <>
                <img src={generatedImage ? `data:image/jpeg;base64,${generatedImage}` : recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 z-10">
                    <span className="bg-neon-400 text-black text-xs uppercase font-black tracking-wider px-4 py-2 rounded-xl mb-4 inline-block shadow-[0_0_15px_rgba(204,255,0,0.5)]">{recipe.category}</span>
                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6 drop-shadow-lg text-white">{recipe.title}</h1>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 px-5 py-2.5 rounded-2xl">
                            <Clock size={24} className="text-neutral-400" />
                            <span className="text-lg font-bold text-white">{recipe.timeMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur border border-white/10 px-5 py-2.5 rounded-2xl">
                            <Flame size={24} className="text-orange-500 fill-orange-500" />
                            <span className="text-lg font-bold text-white">{recipe.calories} kcal</span>
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="text-center px-8 max-w-xl">
                <div className="bg-black p-12 rounded-full border border-neutral-800 shadow-2xl mb-8 mx-auto w-fit">{getIcon(recipe.image)}</div>
                <h1 className="text-3xl font-black text-white leading-tight mb-6">{recipe.title}</h1>
            </div>
        )}

        {isGenerating && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-30">
                <Loader2 size={64} className="animate-spin mb-6 text-neon-400" />
                <p className="font-bold text-2xl animate-pulse">Criando imagem...</p>
            </div>
        )}

        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-20">
            <button onClick={() => navigate(-1)} className="p-4 rounded-full bg-black/50 text-white backdrop-blur border border-white/10 hover:bg-black transition-all"><ArrowLeft size={28} /></button>
            <div className="flex gap-3">
                <button onClick={handleGenerateImage} disabled={isGenerating} className="px-5 py-3 rounded-full bg-black/50 text-neon-400 backdrop-blur border border-white/10 hover:bg-black transition-all flex items-center gap-2"><Wand2 size={24} /><span className="hidden sm:inline font-bold">Gerar Foto</span></button>
                <button onClick={toggleFavorite} className={`p-4 rounded-full bg-black/50 backdrop-blur border border-white/10 hover:bg-black transition-all ${isFavorite ? 'text-red-500' : 'text-white'}`}><Heart size={28} fill={isFavorite ? "currentColor" : "none"} /></button>
            </div>
        </div>
      </div>

      <div className="bg-black relative z-10 px-6 pt-10 pb-12">
          {isCustomRecipe && !isFavorite && (
             <div className="mb-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                <div className="bg-black p-3 rounded-full text-neon-400 border border-neutral-800"><Heart size={24} /></div>
                <div className="flex-1">
                    <p className="text-white font-bold text-lg">Gostou?</p>
                    <p className="text-neutral-400 text-sm">Salve nos favoritos!</p>
                </div>
                <button onClick={toggleFavorite} className="text-sm font-bold bg-neon-400 text-black px-5 py-3 rounded-xl hover:bg-neon-500 transition-colors shadow-[0_0_15px_rgba(204,255,0,0.3)]">Salvar</button>
             </div>
          )}

          <div className="flex gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar">
             {[
                 { icon: ChefHat, label: 'Ingredientes', val: recipe.ingredients.length, color: 'text-emerald-400' },
                 { icon: Clock, label: 'Preparo', val: `${recipe.timeMinutes}m`, color: 'text-blue-400' },
                 { icon: Flame, label: 'Calorias', val: recipe.calories, color: 'text-orange-500' }
             ].map((item, i) => (
                <div key={i} className="flex-1 min-w-[110px] bg-neutral-900 rounded-3xl p-5 flex flex-col items-center justify-center text-center border border-neutral-800">
                    <div className={`bg-black p-3 rounded-full ${item.color} mb-3 border border-neutral-800`}><item.icon size={28} strokeWidth={2.5} /></div>
                    <span className="text-xs text-neutral-500 uppercase font-black tracking-wider mb-1">{item.label}</span>
                    <span className="font-black text-white text-2xl leading-none">{item.val}</span>
                </div>
             ))}
          </div>

          <button onClick={handleOpenVideo} className="w-full mb-10 bg-neutral-900 hover:bg-red-900/20 text-red-500 border border-neutral-800 hover:border-red-900 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 transition-all"><Youtube size={32} /> Ver Vídeo</button>

          <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
                  <div className="bg-neutral-900 p-2 rounded-xl"><List size={28} className="text-neon-400" strokeWidth={3} /></div> Ingredientes
              </h2>
              <ul className="space-y-4">
                  {recipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-center gap-5 p-5 rounded-[1.2rem] bg-neutral-900 border border-neutral-800">
                          <div className="w-3 h-3 rounded-full bg-neon-400 shadow-[0_0_8px_rgba(204,255,0,0.6)] flex-shrink-0" />
                          <span className="text-neutral-300 font-medium text-lg leading-snug">{ing}</span>
                      </li>
                  ))}
              </ul>
          </div>

          {recipe.tip && (
            <div className="mb-12 bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] flex gap-5 items-start shadow-sm relative overflow-hidden">
                <div className="absolute -right-5 -top-5 w-24 h-24 bg-neon-400/10 rounded-full blur-xl"></div>
                <div className="bg-black p-3.5 rounded-full text-neon-400 flex-shrink-0 border border-neutral-800 z-10"><Lightbulb size={32} fill="currentColor" /></div>
                <div className="z-10">
                    <h3 className="font-black text-neon-400 text-base mb-2 uppercase tracking-wide">Dica do Chef</h3>
                    <p className="text-neutral-300 text-lg leading-relaxed font-medium">{recipe.tip}</p>
                </div>
            </div>
          )}

          <div className="pb-10">
              <h2 className="text-3xl font-black text-white mb-8 pl-2">Modo de Preparo</h2>
              <div className="space-y-10 relative before:absolute before:left-[28px] before:top-5 before:bottom-5 before:w-0.5 before:bg-neutral-800 before:rounded-full">
                  {recipe.steps.map((step, idx) => (
                      <div key={idx} className="relative pl-24 group">
                          <div className="absolute left-0 top-0 w-16 h-16 rounded-full bg-black border-4 border-neutral-800 text-neutral-500 flex items-center justify-center font-black text-xl z-10 group-hover:border-neon-400 group-hover:text-neon-400 group-hover:scale-110 transition-all shadow-lg">{idx + 1}</div>
                          <div className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 hover:border-neutral-700 hover:shadow-lg transition-all">
                            <p className="text-neutral-300 leading-relaxed text-lg font-medium">{step}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default RecipeDetails;