
import React, { useState } from 'react';
import { UserProfile, ShoppingItem, SmartListResponse, SuggestedItem } from '../types';
import { Plus, Trash2, Check, ShoppingCart, Filter, X, DollarSign, Wand2, MapPin, Calendar, Users, Loader2, Receipt, Store, Lock, Sparkles } from 'lucide-react';
import { generateBudgetShoppingList } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface ShoppingListProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type FilterType = 'all' | 'pending' | 'completed';

const DAILY_FREE_LIMIT = 3;

const ShoppingList: React.FC<ShoppingListProps> = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  const [showSmartGenerator, setShowSmartGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState({ city: '', budget: '', days: '', people: '' });
  const [generatedResult, setGeneratedResult] = useState<SmartListResponse | null>(null);

  // Freemium Logic
  const today = new Date().toISOString().split('T')[0];
  const usage = user.usageStats || { lastListGenDate: '', listGenCount: 0 };
  const dailyCount = usage.lastListGenDate === today ? usage.listGenCount : 0;
  const remainingGens = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const isLimitReached = !user.isPremium && remainingGens === 0;

  const addItem = () => {
    if (newItemName.trim()) {
      const newItem: ShoppingItem = { id: Date.now().toString(), name: newItemName.trim(), quantity: newItemQuantity.trim(), checked: false };
      setUser(prev => ({ ...prev, shoppingList: [...prev.shoppingList, newItem] }));
      setNewItemName(''); setNewItemQuantity('');
    }
  };

  const toggleCheck = (id: string) => {
    setUser(prev => ({ ...prev, shoppingList: prev.shoppingList.map(item => item.id === id ? { ...item, checked: !item.checked } : item) }));
  };

  const removeItem = (id: string) => {
    setUser(prev => ({ ...prev, shoppingList: prev.shoppingList.filter(item => item.id !== id) }));
  };

  const handleSmartGeneration = async () => {
    if (!genConfig.city || !genConfig.budget) return;
    
    if (isLimitReached) {
        navigate('/premium');
        return;
    }

    setIsGenerating(true);
    try {
        const result = await generateBudgetShoppingList(genConfig.city, parseFloat(genConfig.budget), parseInt(genConfig.days), parseInt(genConfig.people), Array.isArray(user.goal) ? user.goal : [user.goal]);
        setGeneratedResult(result);
        
        setUser(prev => ({
            ...prev,
            usageStats: {
                ...prev.usageStats,
                lastListGenDate: today,
                listGenCount: (prev.usageStats.lastListGenDate === today ? prev.usageStats.listGenCount : 0) + 1
            }
        }));

    } catch (error) { alert("Erro ao gerar lista."); } finally { setIsGenerating(false); }
  };

  const addSmartListToMain = () => {
    if (!generatedResult || !generatedResult.items) return;
    const newItems: ShoppingItem[] = generatedResult.items.map(item => ({ id: Date.now() + Math.random().toString(), name: item.name, quantity: item.quantity, checked: false, estimatedPrice: item.estimatedPrice }));
    setUser(prev => ({ ...prev, shoppingList: [...prev.shoppingList, ...newItems] }));
    setShowSmartGenerator(false); setGeneratedResult(null); setGenConfig({ city: '', budget: '', days: '', people: '' });
  };

  const filteredList = user.shoppingList.filter(item => {
    if (filter === 'pending') return !item.checked;
    if (filter === 'completed') return item.checked;
    return true;
  });

  const totalEstimated = user.shoppingList.reduce((acc, item) => (item.estimatedPrice && !item.checked) ? acc + item.estimatedPrice : acc, 0);

  return (
    <div className="pb-32 min-h-screen bg-black relative text-white">
      
      {/* Header */}
      <div className="bg-neutral-900 pt-6 pb-4 px-6 sticky top-0 z-20 shadow-lg border-b border-neutral-800">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Minha Lista</h1>
                <p className="text-neutral-400 text-xs font-medium">Planejamento Inteligente</p>
            </div>
            <button onClick={() => setShowSmartGenerator(true)} className="group relative flex items-center gap-2 bg-neon-400 text-black pr-4 pl-3 py-2 rounded-full shadow-[0_0_15px_rgba(204,255,0,0.3)] hover:bg-neon-500 transition-all active:scale-95">
                <Wand2 size={14} />
                <span className="text-xs font-bold">Gerar com IA</span>
            </button>
        </div>

        {/* Cost Summary Card */}
        {totalEstimated > 0 && (
            <div className="bg-neutral-800 border border-neutral-700 p-4 rounded-2xl flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="bg-black p-2 rounded-full text-green-400 border border-neutral-700">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Estimativa (Pendentes)</p>
                        <p className="text-xl font-black text-white">R$ {totalEstimated.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-2">
            <Filter size={14} className="text-neutral-500 flex-shrink-0" />
            {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                        filter === f 
                        ? 'bg-neutral-800 text-white border-neutral-700 shadow-md' 
                        : 'bg-black text-neutral-500 border-neutral-800 hover:border-neutral-700'
                    }`}
                >
                    {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Comprados'}
                </button>
            ))}
        </div>
      </div>

      {/* List Content */}
      <div className="p-4 space-y-3">
        {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="bg-neutral-900 p-6 rounded-full mb-4">
                    <ShoppingCart size={32} className="text-neutral-500" />
                </div>
                <p className="text-neutral-500 font-medium">Sua lista está vazia.</p>
            </div>
        ) : (
            filteredList.map((item, idx) => {
                const isLegacy = typeof item === 'string';
                const name = isLegacy ? (item as unknown as string) : item.name;
                const qty = isLegacy ? '' : item.quantity;
                const isChecked = isLegacy ? false : item.checked;
                const id = isLegacy ? idx.toString() : item.id;
                const price = !isLegacy && item.estimatedPrice ? item.estimatedPrice : null;

                return (
                <div 
                    key={id} 
                    onClick={() => !isLegacy && toggleCheck(id)}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${
                        isChecked 
                        ? 'bg-neutral-900 border-transparent opacity-40' 
                        : 'bg-neutral-900 border-neutral-800 shadow-sm hover:border-neon-400/50'
                    }`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isChecked 
                            ? 'bg-neon-400 border-neon-400 scale-110' 
                            : 'border-neutral-600 group-hover:border-neon-400'
                        }`}>
                            {isChecked && <Check size={12} className="text-black" strokeWidth={4} />}
                        </div>
                        <div>
                            <span className={`font-bold text-sm transition-all ${isChecked ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                {name}
                            </span>
                            {(qty || price) && (
                                <div className="flex items-center gap-2 mt-1">
                                    {qty && <span className="text-[10px] font-bold bg-black text-neutral-400 px-2 py-0.5 rounded border border-neutral-800">{qty}</span>}
                                    {price && <span className="text-[10px] font-bold bg-neutral-800 text-green-400 px-2 py-0.5 rounded border border-neutral-700">R$ {price.toFixed(2)}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); removeItem(id); }}
                        className="p-2 text-neutral-600 hover:text-red-500 hover:bg-neutral-800 rounded-full transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                );
            })
        )}
      </div>

      <div className="fixed bottom-[5rem] left-0 right-0 px-4 z-20">
         <div className="max-w-md mx-auto bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-700 p-2 pl-4 flex items-center gap-2">
            <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Adicionar item..."
                className="flex-1 bg-transparent outline-none text-white placeholder:text-neutral-600 font-medium text-sm py-3"
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <div className="w-px h-6 bg-neutral-700"></div>
            <input
                type="text"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Qtd"
                className="w-16 bg-transparent outline-none text-white placeholder:text-neutral-600 font-medium text-sm text-center py-3"
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <button 
                onClick={addItem}
                disabled={!newItemName.trim()}
                className="bg-neon-400 text-black w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neon-500 active:scale-95 transition-all disabled:opacity-50"
            >
                <Plus size={20} />
            </button>
         </div>
      </div>

      {showSmartGenerator && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fade-in">
            <div className="bg-neutral-900 w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden border border-neutral-800">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-black border border-neon-400 p-2 rounded-xl text-neon-400">
                            {generatedResult ? <Receipt size={24} /> : <Wand2 size={24} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{generatedResult ? 'Lista Gerada' : 'Gerador IA'}</h2>
                        </div>
                    </div>
                    
                    {!user.isPremium && !generatedResult && (
                        <div className="bg-neutral-800 border border-neutral-700 px-2 py-1 rounded-lg flex flex-col items-center ml-auto mr-3">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">Restam</span>
                            <span className={`text-sm font-black leading-none ${remainingGens === 0 ? 'text-red-500' : 'text-neon-400'}`}>
                                {remainingGens}
                            </span>
                        </div>
                    )}

                    <button onClick={() => setShowSmartGenerator(false)} className="text-neutral-500 hover:text-white p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 bg-black">
                    {!generatedResult ? (
                        <div className="space-y-5">
                            <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-neon-400 uppercase mb-1.5 block ml-1">Onde você está?</label>
                                    <div className="relative">
                                        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Ex: São Paulo, SP"
                                            value={genConfig.city}
                                            disabled={isLimitReached}
                                            onChange={e => setGenConfig({...genConfig, city: e.target.value})}
                                            className="w-full pl-10 p-3.5 rounded-xl bg-black border border-neutral-700 text-white focus:border-neon-400 outline-none disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-neon-400 uppercase mb-1.5 block ml-1">Orçamento</label>
                                        <div className="relative">
                                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input type="number" placeholder="300" value={genConfig.budget} disabled={isLimitReached} onChange={e => setGenConfig({...genConfig, budget: e.target.value})} className="w-full pl-9 p-3.5 rounded-xl bg-black border border-neutral-700 text-white focus:border-neon-400 outline-none disabled:opacity-50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neon-400 uppercase mb-1.5 block ml-1">Pessoas</label>
                                        <div className="relative">
                                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input type="number" placeholder="2" value={genConfig.people} disabled={isLimitReached} onChange={e => setGenConfig({...genConfig, people: e.target.value})} className="w-full pl-9 p-3.5 rounded-xl bg-black border border-neutral-700 text-white focus:border-neon-400 outline-none disabled:opacity-50" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neon-400 uppercase mb-1.5 block ml-1">Duração (Dias)</label>
                                    <div className="relative">
                                        <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                        <input type="number" placeholder="7" value={genConfig.days} disabled={isLimitReached} onChange={e => setGenConfig({...genConfig, days: e.target.value})} className="w-full pl-10 p-3.5 rounded-xl bg-black border border-neutral-700 text-white focus:border-neon-400 outline-none disabled:opacity-50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-md">
                            <h3 className="font-bold text-black uppercase mb-4 border-b pb-2">Lista Otimizada</h3>
                             {generatedResult.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0 text-gray-800">
                                    <span>{item.quantity} {item.name}</span>
                                    <span className="font-mono">R$ {item.estimatedPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-neutral-900 border-t border-neutral-800 z-10">
                    {!generatedResult ? (
                        <>
                        <button 
                            onClick={handleSmartGeneration}
                            disabled={isGenerating || !genConfig.city || isLimitReached}
                            className={`w-full py-4 rounded-2xl font-black shadow-[0_0_15px_rgba(204,255,0,0.4)] flex items-center justify-center gap-2 disabled:opacity-70 ${isLimitReached ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-neon-400 text-black'}`}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : isLimitReached ? <Lock size={20} /> : <Wand2 />}
                            {isLimitReached ? 'Limite Diário Atingido' : 'Gerar Lista'}
                        </button>
                        {isLimitReached && (
                            <p className="text-xs text-center text-neutral-500 mt-3 flex items-center justify-center gap-1 cursor-pointer hover:text-neon-400 transition-colors" onClick={() => navigate('/premium')}>
                                <Sparkles size={12} /> Quer mais? Seja Premium.
                            </p>
                        )}
                        </>
                    ) : (
                        <div className="flex gap-3">
                            <button onClick={() => setGeneratedResult(null)} className="flex-1 bg-neutral-800 text-white py-4 rounded-2xl font-bold">Voltar</button>
                            <button onClick={addSmartListToMain} className="flex-[2] bg-neon-400 text-black py-4 rounded-2xl font-black shadow-[0_0_15px_rgba(204,255,0,0.4)] flex items-center justify-center gap-2">
                                <Check size={20} /> Adicionar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingList;
