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

  async suggestRecipes(inventory: InventoryItem[]): Promise<Recipe[]> {
    if (!this.ai) return [];
    
    const inventoryList = inventory.map(i => `${i.quantity} ${i.name}`).join(', ');
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given these ingredients: ${inventoryList}. Suggest 3 healthy, scandinavian-inspired or simple recipes.`,
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
}

export const geminiService = new GeminiService();