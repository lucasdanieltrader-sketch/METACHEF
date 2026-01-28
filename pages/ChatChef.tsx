
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Send, Bot, User, Loader2, Sparkles, ChefHat, Trash2, ChevronLeft } from 'lucide-react';
import { askChefIA } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

// Componente para formatar e harmonizar o texto da IA
const FormattedMessage: React.FC<{ text: string; isStreaming?: boolean }> = ({ text, isStreaming }) => {
    // Processa o texto para lidar com negritos e quebras de linha
    const formatPart = (part: string) => {
        const subParts = part.split(/(\*\*.*?\*\*)/g);
        return subParts.map((sub, i) => {
            if (sub.startsWith('**') && sub.endsWith('**')) {
                return <strong key={i} className="text-neon-400 font-black">{sub.replace(/\*\*/g, '')}</strong>;
            }
            return sub;
        });
    };

    const lines = text.split('\n');
    
    return (
        <div className="space-y-4">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                // Títulos (###)
                if (trimmed.startsWith('###')) {
                    return (
                        <h3 key={idx} className="text-lg font-black text-white mt-6 mb-2 border-l-4 border-neon-400 pl-3 uppercase tracking-tight">
                            {formatPart(trimmed.replace('###', ''))}
                        </h3>
                    );
                }

                // Listas (- ou *)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    return (
                        <div key={idx} className="flex gap-3 pl-2 py-1">
                            <span className="text-neon-400 font-bold">•</span>
                            <p className="text-neutral-300 text-sm leading-relaxed">
                                {formatPart(trimmed.substring(2))}
                            </p>
                        </div>
                    );
                }

                // Parágrafo Normal
                return (
                    <p key={idx} className="text-neutral-300 text-sm leading-relaxed font-medium">
                        {formatPart(line)}
                        {isStreaming && idx === lines.length - 1 && (
                            <span className="inline-block w-2 h-4 bg-neon-400 ml-1 animate-pulse shadow-neon" />
                        )}
                    </p>
                );
            })}
        </div>
    );
};

const ChatChef: React.FC<{ user: UserProfile }> = ({ user }) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'model', text: `### Bem-vindo, ${user.name}!\n\nSou seu **Meta Chef de Elite**. Estou aqui para transformar sua nutrição em alta performance.\n\nComo posso ajudar você a atingir seus objetivos hoje?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const aiMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: aiMsgId, role: 'model', text: '' }]);

        try {
            await askChefIA(input, user, (chunk) => {
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg.id === aiMsgId) {
                        return [...prev.slice(0, -1), { ...lastMsg, text: lastMsg.text + chunk }];
                    }
                    return prev;
                });
            });
        } catch (error) {
            setMessages(prev => [...prev, { id: 'err', role: 'model', text: '### Erro Crítico\n\nMeus sensores culinários falharam. Por favor, tente novamente em alguns instantes.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white pb-24">
            {/* Header Harmonizado */}
            <header className="p-6 bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-800 flex justify-between items-center sticky top-0 z-30 shadow-2xl">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500 transition-colors">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-neon-400 p-2 rounded-xl text-black shadow-neon">
                            <ChefHat size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter">META CHAT</h1>
                            <p className="text-[10px] text-neon-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-neon-400 rounded-full animate-pulse" />
                                IA de Elite Ativa
                            </p>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={() => setMessages([{ id: '1', role: 'model', text: `### Chat Reiniciado\n\nPronto para uma nova consultoria, **${user.name}**. O que tem em mente?` }])}
                  className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                  title="Limpar Histórico"
                >
                    <Trash2 size={20} />
                </button>
            </header>

            {/* Messages Area - Dividida e Espaçada */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[radial-gradient(circle_at_top_right,_#111,_#000)]">
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-4 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${msg.role === 'user' ? 'bg-neutral-800 border-neutral-700 shadow-lg' : 'bg-black border-neon-400 text-neon-400 shadow-neon/20'}`}>
                            {msg.role === 'user' ? <User size={20} /> : <Bot size={20} className="animate-pulse-slow" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[85%] p-5 rounded-[2rem] transition-all duration-500 shadow-2xl ${
                            msg.role === 'user' 
                            ? 'bg-neutral-900 border border-neutral-800 text-white rounded-tr-none' 
                            : 'bg-white/[0.03] backdrop-blur-md border border-white/10 text-neutral-200 rounded-tl-none'
                        }`}>
                            <FormattedMessage 
                                text={msg.text} 
                                isStreaming={isLoading && index === messages.length - 1} 
                            />
                        </div>
                    </div>
                ))}
                
                {/* Loader discreto quando o streaming ainda não começou */}
                {isLoading && messages[messages.length - 1].text === '' && (
                    <div className="flex gap-4 animate-fade-in">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-black border-neon-400 text-neon-400 shadow-neon/20">
                            <Bot size={20} className="animate-pulse" />
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-[2rem] rounded-tl-none">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-neon-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area Harmonizada */}
            <div className="p-6 bg-neutral-950/90 backdrop-blur-xl border-t border-neutral-900 sticky bottom-24">
                <div className="max-w-md mx-auto relative group">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pergunte sobre receitas, macros ou treinos..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-[2rem] py-5 pl-7 pr-16 text-white placeholder:text-neutral-600 outline-none focus:border-neon-400 transition-all shadow-2xl group-hover:border-neutral-700"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-neon-400 text-black p-3.5 rounded-full shadow-neon active:scale-95 disabled:opacity-50 transition-all hover:bg-neon-500"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
                <p className="text-[9px] text-center text-neutral-600 mt-4 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Sparkles size={10} className="text-neon-400" /> 
                    Consultoria Estratégica Meta Chef
                </p>
            </div>
        </div>
    );
};

export default ChatChef;
