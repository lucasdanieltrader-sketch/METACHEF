
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Recipe, FoodAnalysis, HealthGoal, SmartListResponse, WorkoutItem, WorkoutJourney, DietPlan, MealSuggestion, ShapeRecord, ShapeAnalysisResult } from "../types";

// Função para limpar e extrair JSON caso a IA envie texto extra
const extractJson = (text: string): string => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }
  return text;
};

export const askChefIA = async (message: string, user: UserProfile, onChunk: (text: string) => void) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const goalStr = Array.isArray(user.goal) ? user.goal.join(', ') : 'Saúde Geral';
    
    const systemInstruction = `Você é o Meta Chef, um consultor de nutrição e culinária de elite.
    Seu tom é profissional, encorajador e altamente técnico quando necessário.
    O usuário atual chama-se ${user.name}, tem como objetivo ${goalStr} e as seguintes restrições: ${user.allergies?.join(', ') || 'nenhuma'}.
    Sempre forneça dicas práticas, hacks de cozinha e informações nutricionais valiosas. 
    Se o usuário perguntar algo fora de nutrição/culinária, gentilmente redirecione para o foco de saúde.`;

    try {
        const result = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: message }] }],
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) onChunk(chunkText);
        }
    } catch (error) {
        console.error("Erro no Chat IA:", error);
        throw error;
    }
};

export const generateDietPlan = async (user: UserProfile): Promise<DietPlan> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const goalStr = Array.isArray(user.goal) ? user.goal.join(', ') : 'Saúde Geral';
    const allergyStr = user.allergies && user.allergies.length > 0 ? `RESTRIÇÕES: ${user.allergies.join(', ')}` : 'Sem restrições alimentares';
    
    const prompt = `Atue como um Nutricionista Esportivo de Elite. Crie um plano alimentar diário altamente personalizado para:
    NOME: ${user.name}
    OBJETIVO: ${goalStr}
    PERFIL: ${user.weight || 70}kg, ${user.height || 170}cm, ${user.age || 30} anos, Gênero ${user.gender || 'Não informado'}.
    NÍVEL DE ATIVIDADE: ${user.activityLevel || 'Moderado'}
    NÚMERO DE REFEIÇÕES: ${user.mealsPerDay || 4} por dia.
    ${allergyStr}
    
    Regras:
    1. Calcule a Taxa Metabólica Basal e o Gasto Total Diário.
    2. Responda em Português do Brasil.
    3. No campo 'tips', inclua conselhos sobre como lidar com as alergias/restrições citadas.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                                protein: { type: Type.STRING },
                                carbs: { type: Type.STRING },
                                fats: { type: Type.STRING }
                            },
                            required: ["protein", "carbs", "fats"]
                        },
                        meals: {
                            type: Type.OBJECT,
                            properties: {
                                breakfast: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, recipeIds: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "recipeIds"] },
                                lunch: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, recipeIds: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "recipeIds"] },
                                snacks: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, recipeIds: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "recipeIds"] },
                                dinner: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, recipeIds: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["description", "recipeIds"] }
                            },
                            required: ["breakfast", "lunch", "snacks", "dinner"]
                        },
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } },
                        duration: { type: Type.STRING },
                        estimatedResult: { type: Type.STRING },
                        waterIntake: { type: Type.STRING },
                        dailyWorkout: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                exercises: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            name: { type: Type.STRING },
                                            duration: { type: Type.STRING },
                                            intensity: { type: Type.STRING },
                                            description: { type: Type.STRING }
                                        },
                                        required: ["name", "duration", "intensity", "description"]
                                    }
                                }
                            },
                            required: ["title", "exercises"]
                        }
                    },
                    required: ["calories", "macros", "meals", "tips", "duration", "estimatedResult", "waterIntake"]
                }
            }
        });
        
        return JSON.parse(extractJson(response.text)) as DietPlan;
    } catch (error) {
        console.error("Erro ao gerar dieta profissional:", error);
        throw error;
    }
};

export const generateDailyPlan = async (user: UserProfile, date: Date): Promise<DietPlan> => {
    return generateDietPlan(user); 
};

export const generateCustomRecipe = async (ingredients: string, user: UserProfile): Promise<Recipe> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const goalStr = Array.isArray(user.goal) ? user.goal.join(', ') : 'Saúde Geral';
    
    const prompt = `Crie uma receita saudável usando: ${ingredients}. Foco: ${goalStr}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        image: { type: Type.STRING },
                        timeMinutes: { type: Type.NUMBER },
                        calories: { type: Type.NUMBER },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        steps: { type: Type.ARRAY, items: { type: Type.STRING } },
                        isQuick: { type: Type.BOOLEAN },
                        category: { type: Type.STRING },
                        tip: { type: Type.STRING }
                    },
                    required: ["id", "title", "timeMinutes", "calories", "ingredients", "steps"]
                }
            }
        });
        const recipe = JSON.parse(extractJson(response.text)) as Recipe;
        recipe.id = `gen-${Date.now()}`;
        recipe.image = 'generate-image';
        return recipe;
    } catch (error) {
        throw error;
    }
};

export const analyzeFoodImage = async (base64Data: string, userGoals: HealthGoal[]): Promise<FoodAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analise a comida nesta imagem. Objetivos: ${userGoals.join(', ')}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        foodName: { type: Type.STRING },
                        portionSize: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                                protein: { type: Type.STRING },
                                carbs: { type: Type.STRING },
                                fats: { type: Type.STRING }
                            },
                            required: ["protein", "carbs", "fats"]
                        },
                        benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suitability: { type: Type.STRING },
                        isHealthy: { type: Type.BOOLEAN }
                    },
                    required: ["foodName", "calories", "macros", "isHealthy"]
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as FoodAnalysis;
    } catch (error) {
        throw error;
    }
};

export const generateBudgetShoppingList = async (city: string, budget: number, days: number, people: number, goals: HealthGoal[]): Promise<SmartListResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Gere uma lista de compras de R$${budget} para ${people} pessoas por ${days} dias em ${city}. Foco: ${goals.join(', ')}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    quantity: { type: Type.STRING },
                                    estimatedPrice: { type: Type.NUMBER },
                                    category: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ["name", "quantity", "estimatedPrice"]
                            }
                        },
                        markets: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    type: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ["items"]
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as SmartListResponse;
    } catch (error) {
        throw error;
    }
};

export const generateRecipeImage = async (title: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Professional food photography of ${title}, appetizing, 4k, high detailed` }]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        return '';
    } catch (error) {
        return '';
    }
};

export const generateSingleMeal = async (user: UserProfile, mealType: string): Promise<MealSuggestion> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const goalStr = Array.isArray(user.goal) ? user.goal.join(', ') : 'Saúde Geral';
    const prompt = `Sugira uma refeição saudável (${mealType}) para: ${goalStr}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        recipeIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["description", "recipeIds"]
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as MealSuggestion;
    } catch (error) {
        throw error;
    }
};

export const generateSpecificWorkout = async (target: string, user: UserProfile): Promise<WorkoutItem[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Crie um treino focado em ${target} para nível ${user.level}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            duration: { type: Type.STRING },
                            intensity: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "duration", "intensity", "description"]
                    }
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as WorkoutItem[];
    } catch (error) {
        throw error;
    }
};

export const generateWorkoutJourney = async (goal: string, duration: string, user: UserProfile): Promise<WorkoutJourney> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Crie uma jornada de treino de ${duration} para o objetivo: ${goal}. Nível: ${user.level}. Responda em Português.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        goal: { type: Type.STRING },
                        totalDuration: { type: Type.STRING },
                        phases: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    levelName: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    schedule: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    totalWeeks: { type: Type.NUMBER },
                                    completedWeeks: { type: Type.NUMBER },
                                    isUnlocked: { type: Type.BOOLEAN },
                                    detailedRoutines: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                key: { type: Type.STRING },
                                                title: { type: Type.STRING },
                                                exercises: {
                                                    type: Type.ARRAY,
                                                    items: {
                                                        type: Type.OBJECT,
                                                        properties: {
                                                            name: { type: Type.STRING },
                                                            duration: { type: Type.STRING },
                                                            intensity: { type: Type.STRING },
                                                            description: { type: Type.STRING }
                                                        },
                                                        required: ["name", "duration", "intensity", "description"]
                                                    }
                                                }
                                            },
                                            required: ["key", "title", "exercises"]
                                        }
                                    }
                                },
                                required: ["levelName", "duration", "description", "schedule", "detailedRoutines", "totalWeeks", "completedWeeks", "isUnlocked"]
                            }
                        },
                        createdAt: { type: Type.STRING }
                    },
                    required: ["title", "goal", "totalDuration", "phases", "createdAt"]
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as WorkoutJourney;
    } catch (error) {
        throw error;
    }
};

export const analyzeShapeProgress = async (
    user: UserProfile, 
    formData: any, 
    images: { front: string | null, back: string | null, left: string | null, right: string | null },
    previousRecord?: ShapeRecord
): Promise<ShapeAnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts = [];
    if (images.front) parts.push({ inlineData: { mimeType: 'image/jpeg', data: images.front.split(',')[1] } });
    if (images.back) parts.push({ inlineData: { mimeType: 'image/jpeg', data: images.back.split(',')[1] } });
    
    const prompt = `Atue como Juiz de Fisiculturismo. Analise o shape. Peso: ${formData.weightEnd}kg.`;
    parts.push({ text: prompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: parts },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        overallScore: { type: Type.NUMBER },
                        title: { type: Type.STRING },
                        stats: {
                            type: Type.OBJECT,
                            properties: {
                                definition: { type: Type.NUMBER },
                                volume: { type: Type.NUMBER },
                                symmetry: { type: Type.NUMBER },
                                proportions: { type: Type.NUMBER }
                            }
                        },
                        estimatedBodyFat: { type: Type.STRING },
                        muscleTier: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                        actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                        coachMessage: { type: Type.STRING }
                    },
                    required: ["overallScore", "title", "stats", "coachMessage"]
                }
            }
        });
        return JSON.parse(extractJson(response.text)) as ShapeAnalysisResult;
    } catch (error) {
        throw error;
    }
};
