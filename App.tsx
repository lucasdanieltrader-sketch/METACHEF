
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ScanFood from './pages/ScanFood';
import ShoppingList from './pages/ShoppingList';
import Profile from './pages/Profile';
import RecipeDetails from './pages/RecipeDetails';
import Onboarding from './pages/Onboarding';
import DietPlan from './pages/DietPlan';
import Substitutions from './pages/Substitutions';
import DailyProgress from './pages/DailyProgress';
import Workout from './pages/Workout';
import ShapeCheckin from './pages/ShapeCheckin';
import ActivityTracker from './pages/ActivityTracker';
import Premium from './pages/Premium';
import ChatChef from './pages/ChatChef';
import { UserProfile } from './types';
import { DEFAULT_USER } from './constants';
import { saveUserToDb } from './services/supabase';

const AppContent: React.FC<{ user: UserProfile, setUser: React.Dispatch<React.SetStateAction<UserProfile>> }> = ({ user, setUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbar = location.pathname === '/onboarding' || location.pathname === '/premium';

  // Ref para rastrear o tempo da última notificação enviada
  const lastReminderRef = useRef<number>(0);

  useEffect(() => {
    if (!user.hasOnboarded && location.pathname !== '/onboarding') {
      navigate('/onboarding');
    }
  }, [user.hasOnboarded, location.pathname, navigate]);

  // Lógica de Monitoramento de Água em Segundo Plano
  useEffect(() => {
    if (user.waterStats.remindersEnabled && "Notification" in window && Notification.permission === "granted") {
      const checkHydration = () => {
        const now = Date.now();
        const intervalMs = user.waterStats.reminderIntervalMinutes * 60 * 1000;
        const hour = new Date().getHours();

        // Só notifica entre 08h e 22h para não incomodar à noite
        if (hour >= 8 && hour < 22) {
          if (now - lastReminderRef.current >= intervalMs) {
            // Se ainda não bateu a meta, manda o lembrete
            if (user.waterStats.current < user.waterStats.goal) {
              try {
                new Notification("Meta Chef IA: Hidratação", {
                  body: `Está na hora de um copo d'água! Você consumiu ${user.waterStats.current}ml de ${user.waterStats.goal}ml até agora.`,
                  icon: "/favicon.ico"
                });
                lastReminderRef.current = now;
              } catch (e) {
                console.warn("Navegador impediu a notificação automática.");
              }
            }
          }
        }
      };

      // Inicia a verificação a cada 1 minuto
      const intervalId = window.setInterval(checkHydration, 60000);
      return () => clearInterval(intervalId);
    }
  }, [user.waterStats.remindersEnabled, user.waterStats.current, user.waterStats.goal, user.waterStats.reminderIntervalMinutes]);

  return (
    <div className="w-full mx-auto bg-black h-[100dvh] shadow-2xl overflow-hidden relative flex flex-col">
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-black w-full relative flex flex-col">
        <Routes>
          <Route path="/" element={user.hasOnboarded ? <DietPlan user={user} setUser={setUser} /> : <Navigate to="/onboarding" />} />
          <Route path="/onboarding" element={<Onboarding user={user} setUser={setUser} />} />
          <Route path="/recipes" element={<Home user={user} setUser={setUser} />} />
          <Route path="/recipe/:id" element={<RecipeDetails user={user} setUser={setUser} />} />
          <Route path="/scan" element={<ScanFood user={user} setUser={setUser} />} />
          <Route path="/diet-plan" element={<DietPlan user={user} setUser={setUser} />} />
          <Route path="/workout" element={<Workout user={user} setUser={setUser} />} />
          <Route path="/substitutions" element={<Substitutions />} />
          <Route path="/daily-progress" element={<DailyProgress user={user} setUser={setUser} />} />
          <Route path="/shopping-list" element={<ShoppingList user={user} setUser={setUser} />} />
          <Route path="/shape-checkin" element={<ShapeCheckin user={user} setUser={setUser} />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/activity" element={<ActivityTracker user={user} setUser={setUser} />} />
          <Route path="/premium" element={<Premium user={user} setUser={setUser} />} />
          <Route path="/chat" element={<ChatChef user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {!hideNavbar && <Navbar />}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('metaChefUser');
      const base = JSON.parse(JSON.stringify(DEFAULT_USER));
      const today = new Date().toLocaleDateString('en-CA');

      if (saved) {
        const parsed = JSON.parse(saved);
        const waterStats = parsed.waterStats || base.waterStats;

        // Lógica de Reset Diário Automático no carregamento
        if (waterStats.lastDrinkDate !== today) {
          waterStats.current = 0;
          waterStats.lastDrinkDate = today;
        }

        return {
          ...base,
          ...parsed,
          waterStats: waterStats
        };
      }
    } catch (e) {
      console.error("Erro ao restaurar dados:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_USER));
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('metaChefUser', JSON.stringify(user));

      // Debounced Save to Supabase (Global Auto-Sync)
      const timeoutId = setTimeout(() => {
        if (user.email && user.hasOnboarded) { // Only save if meaningful data exists
          saveUserToDb(user);
        }
      }, 2000); // 2 seconds debounce

      return () => clearTimeout(timeoutId);
    }
  }, [user]);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} />
    </Router>
  );
};

export default App;
