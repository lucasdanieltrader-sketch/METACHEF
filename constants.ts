
import { HealthGoal, UserProfile, Recipe } from "./types";

export const DEFAULT_USER: UserProfile = {
  name: 'Visitante',
  level: 1,
  goal: [HealthGoal.GENERAL],
  favorites: [],
  customRecipes: [],
  shoppingList: [],
  activeChallenge: null,
  hasOnboarded: false,
  age: '',
  height: '',
  weight: '',
  gender: 'Masculino',
  activityLevel: 'Moderado',
  allergies: [],
  mealsPerDay: 4,
  dailyProgress: {
    checkInDates: [],
    currentStreak: 0,
    lastCheckIn: null
  },
  waterStats: {
    current: 0,
    goal: 2500,
    lastDrinkDate: new Date().toISOString().split('T')[0],
    remindersEnabled: false,
    reminderIntervalMinutes: 60
  },
  usageStats: {
    lastChefGenDate: '',
    chefGenCount: 0,
    lastShapeCheckin: '',
    lastWorkoutGenDate: '',
    workoutGenCount: 0,
    lastDietGenDate: '',
    dietGenCount: 0,
    lastScanDate: '',
    scanCount: 0,
    lastListGenDate: '',
    listGenCount: 0
  }
};

export const TROPHIES = [
  { day: 1, title: 'O Início', icon: '🌱', description: 'Deu o primeiro passo!', color: 'bg-green-100 text-green-600' },
  { day: 7, title: 'Uma Semana', icon: '🏆', description: 'Primeira semana completa!', color: 'bg-purple-100 text-purple-600' },
  { day: 30, title: 'Lenda Mensal', icon: '👑', description: 'Você conquistou o mês!', color: 'bg-yellow-200 text-yellow-800' }
];

export const CHALLENGES = [
  { id: 'c1', title: '7 Dias Sem Açúcar', description: 'Elimine doces por uma semana.', durationDays: 7, difficulty: 'Médio', color: 'bg-orange-500' },
  { id: 'c2', title: 'Hidratação Total', description: 'Beba 3L de água por dia.', durationDays: 14, difficulty: 'Fácil', color: 'bg-blue-500' }
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Salmão Grelhado com Aspargos',
    image: 'icon:fish',
    timeMinutes: 20,
    calories: 350,
    tags: [HealthGoal.LOW_CARB, HealthGoal.CUTTING],
    ingredients: ['200g de filé de salmão', '5 aspargos frescos', 'Azeite de oliva', 'Limão siciliano', 'Sal e pimenta a gosto'],
    steps: ['Tempere o salmão com limão, sal e pimenta.', 'Grelhe o salmão em fogo médio por 6 minutos de cada lado.', 'Refogue os aspargos no azeite por 4 minutos até ficarem crocantes.', 'Sirva imediatamente.'],
    isQuick: true,
    category: 'Almoço',
    tip: 'O salmão fica mais suculento se retirado do fogo assim que o centro estiver opaco.'
  },
  {
    id: '2',
    title: 'Escondidinho de Batata Doce com Frango',
    image: 'icon:marmita',
    timeMinutes: 40,
    calories: 420,
    tags: [HealthGoal.MARMITA, HealthGoal.MUSCLE_GAIN],
    ingredients: ['300g de batata doce cozida', '150g de frango desfiado', 'Molho de tomate caseiro', 'Queijo cottage para gratinar'],
    steps: ['Amasse a batata doce até formar um purê.', 'Refogue o frango com o molho de tomate.', 'Em um refratário, faça uma camada de frango e cubra com o purê.', 'Finalize com o queijo e leve ao forno por 15 minutos.'],
    isQuick: false,
    category: 'Marmitas',
    tip: 'Ideal para congelar e consumir durante a semana.'
  },
  {
    id: '3',
    title: 'Omelete de Espinafre e Cogumelos',
    image: 'icon:breakfast',
    timeMinutes: 10,
    calories: 280,
    tags: [HealthGoal.LOW_CARB, HealthGoal.GENERAL],
    ingredients: ['3 ovos', '1 xícara de espinafre fresco', '50g de cogumelos paris', 'Sal e pimenta'],
    steps: ['Bata os ovos levemente.', 'Refogue os cogumelos e o espinafre em uma frigideira antiaderente.', 'Despeje os ovos e cozinhe até a borda soltar.', 'Dobre ao meio e sirva.'],
    isQuick: true,
    category: 'Café da Manhã',
    tip: 'Adicione uma pitada de cúrcuma para um efeito anti-inflamatório.'
  },
  {
    id: '4',
    title: 'Suco Verde Detox Energético',
    image: 'icon:juice-green',
    timeMinutes: 5,
    calories: 120,
    tags: [HealthGoal.DETOX, HealthGoal.GENERAL],
    ingredients: ['2 folhas de couve', '1 maçã verde', 'Suco de 1 limão', '200ml de água de coco', '1 pedaço pequeno de gengibre'],
    steps: ['Lave bem todos os ingredientes.', 'Bata tudo no liquidificador por 2 minutos.', 'Beba sem coar para aproveitar as fibras.'],
    isQuick: true,
    category: 'Sucos',
    tip: 'O gengibre ajuda a acelerar o metabolismo logo cedo.'
  },
  {
    id: '5',
    title: 'Mousse de Abacate com Cacau',
    image: 'icon:dessert',
    timeMinutes: 10,
    calories: 190,
    tags: [HealthGoal.LOW_CARB, HealthGoal.VEGETARIAN],
    ingredients: ['1 abacate maduro', '3 colheres de sopa de cacau 100%', 'Mel ou adoçante stevia a gosto', 'Essência de baunilha'],
    steps: ['Bata todos os ingredientes no processador até ficar homogêneo.', 'Leve à geladeira por pelo menos 1 hora.', 'Sirva gelado.'],
    isQuick: true,
    category: 'Sobremesas',
    tip: 'Uma sobremesa rica em gorduras boas que sacia a vontade de doce.'
  },
  {
    id: '6',
    title: 'Bowl de Quinoa com Vegetais Assados',
    image: 'icon:veggie',
    timeMinutes: 30,
    calories: 310,
    tags: [HealthGoal.VEGETARIAN, HealthGoal.GENERAL],
    ingredients: ['1 xícara de quinoa cozida', 'Abóbora cabotiá picada', 'Grão-de-bico cozido', 'Tahiní para o molho', 'Sementes de girassol'],
    steps: ['Asse a abóbora com grão-de-bico por 20 minutos.', 'Monte o bowl colocando a quinoa como base.', 'Adicione os vegetais assados.', 'Finalize com o molho de tahiní e sementes.'],
    isQuick: false,
    category: 'Almoço',
    tip: 'A quinoa é uma proteína completa, excelente para quem não come carne.'
  },
  {
    id: '7',
    title: 'Filé de Tilápia com Crosta de Ervas',
    image: 'icon:fish',
    timeMinutes: 15,
    calories: 290,
    tags: [HealthGoal.CUTTING, HealthGoal.LOW_CARB],
    ingredients: ['2 filés de tilápia', 'Mix de ervas (salsa, tomilho, alecrim)', 'Farinha de amêndoas para a crosta', 'Azeite'],
    steps: ['Pressione a farinha com ervas sobre o peixe.', 'Aqueça uma frigideira com um fio de azeite.', 'Grelhe por 4 minutos de cada lado cuidando para não queimar a crosta.'],
    isQuick: true,
    category: 'Jantar',
    tip: 'A tilápia é uma proteína magra de digestão rápida, ideal para o jantar.'
  },
  {
    id: '8',
    title: 'Sopa de Abóbora com Gengibre e Frango',
    image: 'icon:soup',
    timeMinutes: 25,
    calories: 240,
    tags: [HealthGoal.DETOX, HealthGoal.CUTTING],
    ingredients: ['500g de abóbora', '100g de frango desfiado', 'Cebola e alho', 'Gengibre ralado', 'Salsinha'],
    steps: ['Cozinhe a abóbora e bata no liquidificador com a água do cozimento.', 'Refogue cebola, alho e o frango.', 'Junte o creme de abóbora e o gengibre.', 'Deixe ferver por 5 minutos.'],
    isQuick: true,
    category: 'Jantar',
    tip: 'Perfeito para dias frios e para ajudar na digestão noturna.'
  }
];
