import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem, Recipe, Category } from "../types";
import { GEMINI_SYSTEM_INSTRUCTION } from "../constants";

const cleanJsonString = (str: string) => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
        try {
            this.ai = new GoogleGenAI({ apiKey });
        } catch (e) {
            console.error("Gemini Client Initialization Failed:", e);
        }
    } else {
        console.warn("Gemini API Key is missing. AI features will use mock data.");
    }
  }

  async analyzeImage(base64Image: string): Promise<Partial<InventoryItem>[]> {
    if (!this.ai) {
      console.warn("No API Key provided. Returning mock data.");
      return [
        { name: 'Detected Apple', category: Category.Produce, quantity: '3', daysUntilExpiry: 7 },
        { name: 'Detected Milk', category: Category.Dairy, quantity: '1L', daysUntilExpiry: 5 }
      ];
    }

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: "Identify the food items in this image. Return a JSON array where each object has: 'name' (string), 'category' (one of Produce, Dairy, Meat, Pantry, Frozen, Beverages, Other), 'quantity' (string estimate), and 'daysUntilExpiry' (estimated integer based on typical shelf life of fresh produce/goods). Return ONLY the JSON." }
            ]
        },
        config: {
            systemInstruction: GEMINI_SYSTEM_INSTRUCTION
        }
      });

      const text = response.text || "[]";
      return JSON.parse(cleanJsonString(text));
    } catch (error) {
      console.error("Gemini Image Analysis Failed", error);
      throw new Error("Failed to analyze image.");
    }
  }

  async suggestRecipes(inventory: InventoryItem[], householdSize: number = 1, dietaryRestrictions: string[] = []): Promise<Recipe[]> {
    if (!this.ai) return [];
    
    const inventoryList = inventory.map(i => `${i.quantity} ${i.name}`).join(', ');
    const dietString = dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}.` : '';
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given these ingredients: ${inventoryList}. 
                   This is for a household of ${householdSize} people. ${dietString}
                   Suggest 3 healthy, scandinavian-inspired or simple recipes using the ingredients provided.
                   Adjust portion sizes effectively.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        timeEstimate: { type: Type.STRING },
                        matchScore: { type: Type.INTEGER }
                    }
                }
            }
        }
      });
      const text = response.text || "[]";
      const recipes = JSON.parse(cleanJsonString(text));
      return recipes.map((r: any, index: number) => ({ ...r, id: `gen-${Date.now()}-${index}` }));
    } catch (error) {
        return [];
    }
  }

  async generateDiscoverRecipes(mode: 'inventory' | 'random', inventory: InventoryItem[] = []): Promise<Recipe[]> {
    if (!this.ai) return [];

    let prompt = "";
    if (mode === 'inventory') {
        const inventoryList = inventory.map(i => i.name).join(', ');
        prompt = `Create 5 unique, creative recipes that use some of these ingredients: ${inventoryList}. 
                  Be innovative. Focus on maximizing flavor.`;
    } else {
        prompt = `Create 5 trending, popular, or unique recipes from around the world. 
                  Surprise the user with something delicious.`;
    }

    try {
        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                            timeEstimate: { type: Type.STRING },
                            matchScore: { type: Type.INTEGER, description: "Relevance score 0-100" }
                        }
                    }
                }
            }
        });
        const text = response.text || "[]";
        const recipes = JSON.parse(cleanJsonString(text));
        return recipes.map((r: any, index: number) => ({ ...r, id: `explore-${Date.now()}-${index}-${Math.random()}` }));
    } catch (error) {
        console.error("Explore generation failed", error);
        return [];
    }
  }

  async generateShoppingList(inventory: InventoryItem[]): Promise<string[]> {
      if (!this.ai) return [];
      
      const inventoryList = inventory.map(i => `${i.name} (Expires in ${i.daysUntilExpiry} days)`).join(', ');

      try {
          const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this inventory: ${inventoryList}. 
            1. Identify items that are expiring soon or likely low in stock.
            2. Suggest 5-8 essential items that are missing for a balanced Scandinavian kitchen (e.g. basics, fresh produce).
            Return ONLY a JSON array of strings (the item names).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
          });
          const text = response.text || "[]";
          return JSON.parse(cleanJsonString(text));
      } catch (e) {
          console.error("Shopping list generation failed", e);
          return [];
      }
  }

  async getNutritionAnalysis(itemName: string): Promise<{ calories: string, benefits: string, warning: string }> {
      if (!this.ai) return { calories: "N/A", benefits: "Service unavailable", warning: "" };

      try {
          const response = await this.ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Analyze the nutritional value of: ${itemName}. 
              Return a JSON object with: 
              - 'calories' (approx per 100g)
              - 'benefits' (a short sentence about health benefits)
              - 'warning' (a short sentence if high sugar/fat, otherwise empty string).`,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          calories: { type: Type.STRING },
                          benefits: { type: Type.STRING },
                          warning: { type: Type.STRING }
                      }
                  }
              }
          });
          const text = response.text || "{}";
          return JSON.parse(cleanJsonString(text));
      } catch (e) {
          return { calories: "Unknown", benefits: "Analysis failed", warning: "" };
      }
  }
}

export const geminiService = new GeminiService();