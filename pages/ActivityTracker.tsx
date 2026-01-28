
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ActivityRecord } from '../types';
import { Play, Pause, Square, MapPin, Footprints, Bike, Wind, Flame, Timer, TrendingUp, Trophy, Share2, Heart, Shield, Lock, ChevronUp, Zap, BarChart3, Map as MapIcon, X, Camera, Download, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logActivityToDb } from '../services/supabase';

interface ActivityTrackerProps {
    user: UserProfile;
    setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
}

type ActivityType = 'run' | 'walk' | 'bike';

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ user, setUser }) => {
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedType, setSelectedType] = useState<ActivityType>('run');
    const [timer, setTimer] = useState(0);
    const [distance, setDistance] = useState(0.00);
    const [calories, setCalories] = useState(0);

    // Share States
    const [showSummary, setShowSummary] = useState(false);
    const [lastActivity, setLastActivity] = useState<ActivityRecord | null>(null);
    const [shareImage, setShareImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (isRecording && !isPaused) {
            timerRef.current = window.setInterval(() => {
                setTimer(prev => prev + 1);
                const speedFactor = selectedType === 'run' ? 0.0028 : selectedType === 'walk' ? 0.0014 : 0.0055;
                const variation = (Math.random() - 0.5) * 0.0002;
                setDistance(prev => Math.max(0, prev + speedFactor + variation));
                setCalories(prev => prev + (selectedType === 'bike' ? 0.15 : 0.2));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording, isPaused, selectedType]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const hrs = Math.floor(mins / 60);
        return hrs > 0
            ? `${hrs}:${(mins % 60).toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getPace = () => {
        if (distance === 0) return "--:--";
        const totalMinutes = timer / 60;
        const pace = totalMinutes / distance;
        const paceMins = Math.floor(pace);
        const paceSecs = Math.round((pace - paceMins) * 60);
        return `${paceMins}'${paceSecs.toString().padStart(2, '0')}"`;
    };

    const finishActivity = () => {
        const activity: ActivityRecord = {
            id: Date.now().toString(),
            type: selectedType,
            date: new Date().toISOString(),
            durationSeconds: timer,
            distanceKm: distance,
            calories: Math.round(calories),
            pace: getPace(),
            kudos: 0
        };

        // Log to Supabase (non-blocking)
        logActivityToDb(user.id, selectedType, activity);

        setIsRecording(false);
        setIsPaused(false);
        setLastActivity(activity);
        setShowSummary(true);

        setUser(prev => ({
            ...prev,
            activityHistory: [activity, ...(prev.activityHistory || [])]
        }));

        // Reset internal states but keep lastActivity for summary
        setTimer(0);
        setDistance(0);
        setCalories(0);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setShareImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const generateShareCard = async () => {
        if (!canvasRef.current || !shareImage || !lastActivity) return;
        setIsGenerating(true);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.src = shareImage;

        img.onload = () => {
            // 1. Setup Canvas (9:16 aspect ratio for stories)
            canvas.width = 1080;
            canvas.height = 1920;

            // 2. Draw Background Image (Cover style)
            const imgRatio = img.width / img.height;
            const canvasRatio = canvas.width / canvas.height;
            let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

            if (imgRatio > canvasRatio) {
                drawHeight = canvas.height;
                drawWidth = img.width * (canvas.height / img.height);
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = img.height * (canvas.width / img.width);
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // 3. Add Dark Overlays for readability
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
            gradient.addColorStop(0.2, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.7, 'rgba(0,0,0,0)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 4. Draw Header (Logo)
            ctx.font = '900 60px Inter';
            ctx.fillStyle = '#ccff00';
            ctx.textAlign = 'center';
            ctx.fillText('META MOVE', canvas.width / 2, 120);

            ctx.font = '600 30px Inter';
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.fillText('ACOMPANHAMENTO IA', canvas.width / 2, 165);

            // 5. Draw Simplified Route Line (Middle)
            ctx.strokeStyle = '#ccff00';
            ctx.lineWidth = 8;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.beginPath();
            // Simulação de trajeto baseado em curvas de Bezier
            ctx.moveTo(300, 1100);
            ctx.bezierCurveTo(400, 1000, 600, 1200, 700, 1100);
            ctx.bezierCurveTo(800, 1000, 600, 800, 500, 900);
            ctx.stroke();

            // Glow effect for route
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ccff00';
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 6. Draw Main Stat (Distance)
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ccff00';
            ctx.font = '900 240px Inter';
            ctx.fillText(lastActivity.distanceKm.toFixed(2), canvas.width / 2, 1600);

            ctx.fillStyle = '#ffffff';
            ctx.font = '800 60px Inter';
            ctx.fillText('QUILÔMETROS', canvas.width / 2, 1680);

            // 7. Draw Footer Stats
            const footerY = 1820;
            ctx.textAlign = 'left';

            // Time
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '700 30px Inter';
            ctx.fillText('TEMPO', 100, footerY - 50);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 50px Inter';
            ctx.fillText(formatTime(lastActivity.durationSeconds), 100, footerY);

            // Pace
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '700 30px Inter';
            ctx.fillText('RITMO', canvas.width / 2, footerY - 50);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 50px Inter';
            ctx.fillText(lastActivity.pace, canvas.width / 2, footerY);

            // Kcal
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '700 30px Inter';
            ctx.fillText('CALORIAS', canvas.width - 100, footerY - 50);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 50px Inter';
            ctx.fillText(`${lastActivity.calories} kcal`, canvas.width - 100, footerY);

            setIsGenerating(false);
        };
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `MetaMove_Treino_${new Date().getTime()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleShare = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve));
            if (blob && navigator.share) {
                const file = new File([blob], "treino.png", { type: "image/png" });
                await navigator.share({
                    files: [file],
                    title: 'Meu Treino no Meta Move',
                    text: `Concluí ${lastActivity?.distanceKm.toFixed(2)}km hoje! #MetaMove`
                });
            } else {
                handleDownload();
            }
        } catch (err) {
            console.error("Erro ao compartilhar:", err);
        }
    };

    // Trigger regeneration whenever image or activity changes
    useEffect(() => {
        if (shareImage && lastActivity) {
            generateShareCard();
        }
    }, [shareImage, lastActivity]);

    const activities = user.activityHistory && user.activityHistory.length > 0 ? user.activityHistory : [];

    return (
        <div className="bg-black min-h-screen pb-28 relative font-sans overflow-x-hidden">

            {/* SUMMARY MODAL / OVERLAY */}
            {showSummary && lastActivity && (
                <div className="fixed inset-0 z-[60] bg-black animate-fade-in flex flex-col overflow-y-auto no-scrollbar">
                    <div className="p-6 flex justify-between items-center bg-neutral-900 border-b border-neutral-800">
                        <h2 className="text-xl font-black text-white">RESUMO DO TREINO</h2>
                        <button onClick={() => { setShowSummary(false); setShareImage(null); }} className="p-2 bg-neutral-800 rounded-full"><X size={20} /></button>
                    </div>

                    <div className="p-6 flex-1 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 text-center">
                                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Distância</p>
                                <p className="text-4xl font-black text-white">{lastActivity.distanceKm.toFixed(2)}<span className="text-sm">km</span></p>
                            </div>
                            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 text-center">
                                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Tempo</p>
                                <p className="text-4xl font-black text-white">{formatTime(lastActivity.durationSeconds)}</p>
                            </div>
                            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 text-center">
                                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Ritmo Médio</p>
                                <p className="text-4xl font-black text-white">{lastActivity.pace}</p>
                            </div>
                            <div className="bg-neutral-900 p-6 rounded-3xl border border-neutral-800 text-center">
                                <p className="text-xs font-bold text-neutral-500 uppercase mb-1">Calorias</p>
                                <p className="text-4xl font-black text-white">{lastActivity.calories}<span className="text-sm">kcal</span></p>
                            </div>
                        </div>

                        {/* Share Card Generator Section */}
                        <div className="bg-neutral-900 rounded-[2.5rem] border border-neutral-800 p-6 overflow-hidden">
                            <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                                <ImageIcon size={20} className="text-neon-400" /> GERAR CARD DE TREINO
                            </h3>

                            {!shareImage ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-[9/16] bg-black rounded-3xl border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-neon-400 transition-all group"
                                >
                                    <div className="bg-neutral-800 p-6 rounded-full group-hover:bg-neon-400 group-hover:text-black transition-all">
                                        <Camera size={40} />
                                    </div>
                                    <div className="text-center px-8">
                                        <p className="text-white font-bold">Escolha uma foto</p>
                                        <p className="text-xs text-neutral-500 mt-1">Para sobrepor os dados do seu treino</p>
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-neutral-800">
                                        <canvas ref={canvasRef} className="w-full h-full object-contain" />
                                        {isGenerating && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <Loader2 className="animate-spin text-neon-400 mb-2" size={32} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Criando Card...</span>
                                            </div>
                                        )}
                                        <button onClick={() => setShareImage(null)} className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10"><X size={16} /></button>
                                    </div>

                                    <div className="flex gap-3">
                                        <button onClick={handleDownload} className="flex-1 bg-neutral-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-700">
                                            <Download size={20} /> Salvar
                                        </button>
                                        <button onClick={handleShare} className="flex-[2] bg-neon-400 text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-neon active:scale-95 transition-all">
                                            <Share2 size={20} /> COMPARTILHAR
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setShowSummary(false)} className="w-full py-4 bg-white text-black rounded-2xl font-black mb-8">
                            VOLTAR AO INÍCIO
                        </button>
                    </div>
                </div>
            )}

            {/* MAP BACKGROUND (Always Visible & Free) */}
            <div className={`fixed inset-0 z-0 transition-opacity duration-700 ${isRecording ? 'opacity-20' : 'opacity-40'}`}>
                <div className="w-full h-[60vh] bg-neutral-900 relative overflow-hidden">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M10,90 Q30,80 50,50 T90,10" fill="none" stroke="#ccff00" strokeWidth="2" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-6 h-6 bg-neon-400 rounded-full shadow-[0_0_20px_rgba(204,255,0,0.8)] animate-pulse"></div>
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black"></div>
            </div>

            {/* HEADER */}
            <div className="fixed top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/90 to-transparent flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-1">
                        META <span className="text-neon-400">MOVE</span>
                    </h1>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full w-fit backdrop-blur-md">
                        <MapPin size={10} className="text-neon-400" /> {user.hasOnboarded ? 'São Paulo, BR' : 'Localizando...'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {!user.isPremium && (
                        <button onClick={() => navigate('/premium')} className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-1">
                            <Lock size={10} /> DESBLOQUEAR IA
                        </button>
                    )}
                </div>
            </div>

            {/* RECORDING INTERFACE */}
            {isRecording ? (
                <div className="relative z-10 flex flex-col items-center justify-center h-screen pt-20 pb-40 px-6 animate-fade-in">
                    <div className="text-center mb-8 w-full">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Gravando</span>
                        </div>

                        <div className="text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] leading-none mb-1">
                            {formatTime(timer)}
                        </div>
                        <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">Tempo Total</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-full mb-12">
                        <div className="bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                            <Footprints className="text-neon-400 mx-auto mb-1 opacity-80" size={18} />
                            <p className="text-xl font-black text-white tabular-nums">{distance.toFixed(2)}</p>
                            <p className="text-[9px] text-neutral-400 uppercase font-bold">Km</p>
                        </div>
                        <div className="bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                            <Wind className="text-blue-400 mx-auto mb-1 opacity-80" size={18} />
                            <p className="text-xl font-black text-white tabular-nums">{getPace()}</p>
                            <p className="text-[9px] text-neutral-400 uppercase font-bold">Min/Km</p>
                        </div>
                        <div className="bg-neutral-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center">
                            <Flame className="text-orange-500 mx-auto mb-1 opacity-80" size={18} />
                            <p className="text-xl font-black text-white tabular-nums">{Math.round(calories)}</p>
                            <p className="text-[9px] text-neutral-400 uppercase font-bold">Kcal</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-8">
                        {isPaused ? (
                            <>
                                <button onClick={() => setIsPaused(false)} className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-black shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform">
                                    <Play size={32} fill="currentColor" className="ml-1" />
                                </button>
                                <button onDoubleClick={finishActivity} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-105 transition-transform border-4 border-black relative group">
                                    <Square size={28} fill="currentColor" />
                                    <span className="absolute -bottom-8 text-[10px] text-neutral-400 w-max opacity-0 group-hover:opacity-100 transition-opacity">Toque 2x para parar</span>
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsPaused(true)} className="w-24 h-24 bg-neutral-900 border-4 border-neon-400/50 rounded-full flex items-center justify-center text-white shadow-[0_0_40px_rgba(204,255,0,0.1)] hover:bg-neutral-800 transition-all active:scale-95">
                                <Pause size={32} fill="currentColor" />
                            </button>
                        )}
                    </div>

                    <button className="absolute bottom-24 right-6 bg-neutral-900/50 backdrop-blur p-3 rounded-full text-neutral-500 border border-white/10 hover:text-red-500 hover:border-red-500 transition-colors">
                        <Shield size={20} />
                    </button>
                </div>
            ) : (
                /* DASHBOARD INTERFACE */
                <div className="relative z-10 pt-[40vh] px-4 animate-slide-up">

                    {/* QUICK START BUTTON */}
                    <div className="bg-neutral-900/90 backdrop-blur-xl rounded-[2.5rem] p-6 border border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] mb-8">
                        <div className="flex justify-between items-center bg-black/60 rounded-full p-1.5 border border-white/5 mb-6">
                            {(['run', 'walk', 'bike'] as ActivityType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`flex-1 py-3 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${selectedType === type ? 'bg-neon-400 text-black shadow-lg' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {type === 'run' && <Wind size={14} />}
                                    {type === 'walk' && <Footprints size={14} />}
                                    {type === 'bike' && <Bike size={14} />}
                                    <span className="hidden sm:inline">{type === 'run' ? 'Corrida' : type === 'walk' ? 'Caminhada' : 'Pedal'}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setIsRecording(true)} className="flex-1 bg-neon-400 hover:bg-neon-500 text-black py-5 rounded-2xl font-black text-xl uppercase tracking-wide shadow-[0_0_25px_rgba(204,255,0,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3">
                                <div className="bg-black/20 p-1.5 rounded-full"><Play size={20} fill="currentColor" /></div> INICIAR
                            </button>
                            <button className="w-16 bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center text-white hover:border-neon-400 hover:text-neon-400 transition-colors">
                                <TrendingUp size={24} />
                            </button>
                        </div>
                    </div>

                    {/* COMPETITION & ANALYSIS */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <button onClick={() => user.isPremium ? alert("Em breve!") : navigate('/premium')} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-yellow-500/50 transition-colors group relative overflow-hidden">
                            <div className="bg-black p-3 rounded-full text-yellow-500 mb-1 z-10"><Trophy size={20} /></div>
                            <span className="text-xs font-bold text-white z-10">Ranking Bairro</span>
                            {!user.isPremium && <div className="absolute top-2 right-2 text-yellow-500"><Lock size={12} /></div>}
                            {!user.isPremium && <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0"></div>}
                        </button>
                        <button onClick={() => user.isPremium ? alert("Em breve!") : navigate('/premium')} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-purple-500/50 transition-colors group relative overflow-hidden">
                            <div className="bg-black p-3 rounded-full text-purple-500 mb-1 z-10"><BarChart3 size={20} /></div>
                            <span className="text-xs font-bold text-white z-10">Performance IA</span>
                            {!user.isPremium && <div className="absolute top-2 right-2 text-purple-500"><Lock size={12} /></div>}
                            {!user.isPremium && <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-0"></div>}
                        </button>
                    </div>

                    {/* HISTORY FEED */}
                    <div className="space-y-6 pb-8">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                Histórico <span className="bg-neutral-800 text-neutral-400 text-[10px] px-2 py-0.5 rounded border border-neutral-700">{activities.length}</span>
                            </h2>
                        </div>

                        {activities.length > 0 ? activities.map((act) => (
                            <div key={act.id} className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800 shadow-sm relative overflow-hidden group hover:border-neutral-700 transition-all">
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${act.type === 'run' ? 'bg-neon-400' : act.type === 'walk' ? 'bg-blue-400' : 'bg-orange-500'}`}></div>
                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full bg-black border border-neutral-800 ${act.type === 'run' ? 'text-neon-400' : act.type === 'walk' ? 'text-blue-400' : 'text-orange-500'}`}>
                                            {act.type === 'run' ? <Wind size={18} /> : act.type === 'walk' ? <Footprints size={18} /> : <Bike size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white capitalize">{act.type === 'run' ? 'Corrida' : act.type === 'walk' ? 'Caminhada' : 'Pedal'}</h3>
                                            <p className="text-xs text-neutral-500">{new Date(act.date).toLocaleDateString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    {act.distanceKm > 5 && <Trophy size={16} className="text-yellow-400" />}
                                </div>
                                <div className="grid grid-cols-3 gap-2 pl-3 mb-4">
                                    <div>
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Distância</p>
                                        <p className="text-lg font-black text-white">{act.distanceKm.toFixed(2)} <span className="text-xs font-medium text-neutral-600">km</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Ritmo</p>
                                        <p className="text-lg font-black text-white">{act.pace} <span className="text-xs font-medium text-neutral-600">/km</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Tempo</p>
                                        <p className="text-lg font-black text-white">{Math.floor(act.durationSeconds / 60)} <span className="text-xs font-medium text-neutral-600">min</span></p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pl-3 pt-3 border-t border-neutral-800">
                                    <button
                                        onClick={() => { setLastActivity(act); setShowSummary(true); }}
                                        className="flex items-center gap-2 text-xs font-bold text-neon-400 bg-neon-400/10 px-3 py-1.5 rounded-lg border border-neon-400/20 hover:bg-neon-400/20 transition-all"
                                    >
                                        <Share2 size={12} /> Gerar Card
                                    </button>
                                    <div className="flex items-center gap-2 text-neutral-500">
                                        <Heart size={14} /> <span className="text-[10px] font-bold">{act.kudos}</span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-20 bg-neutral-900/50 rounded-3xl border border-dashed border-neutral-800">
                                <MapIcon size={40} className="text-neutral-700 mx-auto mb-3" />
                                <p className="text-neutral-500 font-medium">Nenhuma atividade registrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityTracker;
