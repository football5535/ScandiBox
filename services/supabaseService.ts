
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, UserProfile, SubscriptionTier, ShoppingItem, Recipe } from '../types';

// Credentials provided by user
export const SUPABASE_URL = 'https://hyigbttxlisjosgmxcef.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aWdidHR4bGlzam9zZ214Y2VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTc0NTYsImV4cCI6MjA4NjY3MzQ1Nn0.ekC3s9Ilgf3R24AvPah6oNrh0iiBTND8yn2MaAwZn8k';

export let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- MOCK STORAGE FALLBACKS ---
const LOCAL_INV_KEY = 'scandibox_inventory_v3';
const LOCAL_SHOP_KEY = 'scandibox_shopping_v1';
const LOCAL_TIER_KEY = 'scandibox_demo_tier';
const LOCAL_PLAN_KEY = 'scandibox_weekly_plan';

// --- PLANNER SERVICE ---
export const plannerService = {
  getPlan(): Recipe[] {
    const stored = localStorage.getItem(LOCAL_PLAN_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  savePlan(plan: Recipe[]) {
    localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(plan));
  },

  addRecipeToPlan(recipe: Recipe, day: string): Recipe[] {
    const plan = this.getPlan();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Remove existing recipe for that day if it exists
    const filtered = plan.filter(r => r.day !== day);
    
    // Create new entry
    const newEntry: Recipe = { 
        ...recipe, 
        day, 
        id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Ensure unique ID for the plan instance
    };

    const updated = [...filtered, newEntry];
    
    // Sort by day index
    updated.sort((a, b) => {
        const indexA = days.indexOf(a.day || '');
        const indexB = days.indexOf(b.day || '');
        return indexA - indexB;
    });
    
    this.savePlan(updated);
    return updated;
  },

  removeRecipeFromPlan(id: string): Recipe[] {
      const plan = this.getPlan();
      const updated = plan.filter(r => r.id !== id);
      this.savePlan(updated);
      return updated;
  }
};

// --- INVENTORY SERVICE ---
export const inventoryService = {
  async getItems(): Promise<InventoryItem[]> {
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase.from('inventory_items').select('*').eq('user_id', user.id);
                if (!error && data) {
                    // Map snake_case DB columns to camelCase JS properties
                    return data.map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        category: i.category,
                        quantity: i.quantity,
                        status: i.status,
                        // Handle potential date naming diffs
                        addedDate: i.added_date,
                        expiryDate: i.expiry_date,
                        daysUntilExpiry: i.days_until_expiry
                    })) as InventoryItem[];
                }
            }
        } catch (e) { console.warn("Supabase fetch failed", e); }
    }
    const stored = localStorage.getItem(LOCAL_INV_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  async addItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const newItem = { ...item, id: crypto.randomUUID() };
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Map camelCase JS properties to snake_case DB columns
                // Ensure dates are converted to null if empty strings to avoid 400 Bad Request
                const dbItem = {
                    user_id: user.id,
                    name: newItem.name,
                    category: newItem.category,
                    quantity: newItem.quantity,
                    status: newItem.status,
                    added_date: newItem.addedDate || new Date().toISOString(),
                    expiry_date: newItem.expiryDate || null, 
                    days_until_expiry: newItem.daysUntilExpiry
                };

                const { data, error } = await supabase.from('inventory_items').insert([dbItem]).select().single();
                
                if (!error && data) {
                    // Map back to JS object
                    return {
                        id: data.id,
                        name: data.name,
                        category: data.category,
                        quantity: data.quantity,
                        status: data.status,
                        addedDate: data.added_date,
                        expiryDate: data.expiry_date,
                        daysUntilExpiry: data.days_until_expiry
                    } as InventoryItem;
                } else {
                    console.error("Supabase Error:", error);
                }
            }
        } catch (e) { console.warn("Supabase insert failed", e); }
    }
    
    // Local Fallback
    const items = await this.getItems();
    const updated = [newItem, ...items];
    localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(updated));
    return newItem;
  },

  async deleteItem(id: string): Promise<void> {
    if (supabase) {
        try {
            await supabase.from('inventory_items').delete().eq('id', id);
            return;
        } catch (e) {}
    }
    const items = await this.getItems();
    const updated = items.filter(i => i.id !== id);
    localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(updated));
  },

  async batchDeleteItems(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                 await supabase.from('inventory_items').delete().in('id', ids).eq('user_id', user.id);
                 return;
            }
        } catch (e) {}
    }
    
    // Fallback
    const items = await this.getItems();
    const updated = items.filter(i => !ids.includes(i.id));
    localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(updated));
  }
};

// --- SHOPPING LIST SERVICE ---
export const shoppingService = {
    async getItems(): Promise<ShoppingItem[]> {
        if (supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase.from('shopping_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
                    if (!error && data) return data.map(d => ({ id: d.id, name: d.name, isChecked: d.is_checked }));
                }
            } catch (e) { console.warn("Shopping fetch failed", e); }
        }
        const stored = localStorage.getItem(LOCAL_SHOP_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    async addItem(name: string): Promise<ShoppingItem> {
        const newItem = { id: crypto.randomUUID(), name, isChecked: false };
        if (supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase.from('shopping_items').insert([{
                        name, is_checked: false, user_id: user.id
                    }]).select().single();
                    if (!error && data) return { id: data.id, name: data.name, isChecked: data.is_checked };
                }
            } catch (e) {}
        }
        const items = await this.getItems();
        localStorage.setItem(LOCAL_SHOP_KEY, JSON.stringify([newItem, ...items]));
        return newItem;
    },

    async toggleItem(id: string, isChecked: boolean): Promise<void> {
        if (supabase) {
            try {
                 await supabase.from('shopping_items').update({ is_checked: isChecked }).eq('id', id);
                 return;
            } catch(e) {}
        }
        const items = await this.getItems();
        const updated = items.map(i => i.id === id ? { ...i, isChecked } : i);
        localStorage.setItem(LOCAL_SHOP_KEY, JSON.stringify(updated));
    },

    async deleteItem(id: string): Promise<void> {
        if (supabase) {
            try {
                 await supabase.from('shopping_items').delete().eq('id', id);
                 return;
            } catch(e) {}
        }
        const items = await this.getItems();
        const updated = items.filter(i => i.id !== id);
        localStorage.setItem(LOCAL_SHOP_KEY, JSON.stringify(updated));
    }
}

// --- RECIPE SERVICE ---
export const recipeService = {
    async saveRecipe(recipe: Recipe): Promise<void> {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('saved_recipes').insert({
            user_id: user.id,
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            time_estimate: recipe.timeEstimate,
            match_score: recipe.matchScore
        });
    },

    async getSavedRecipes(): Promise<Recipe[]> {
        if (!supabase) return [];
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase.from('saved_recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        
        if (error || !data) return [];
        
        return data.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            ingredients: r.ingredients,
            instructions: r.instructions,
            timeEstimate: r.time_estimate,
            matchScore: r.match_score
        }));
    },
    
    async deleteSavedRecipe(id: string): Promise<void> {
        if (!supabase) return;
        await supabase.from('saved_recipes').delete().eq('id', id);
    }
}


// --- USER SERVICE ---
export const userService = {
    async getProfile(): Promise<UserProfile | null> {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        let tier = SubscriptionTier.Free;
        let householdSize = 1;
        let dietaryRestrictions: string[] = [];
        let familyName = "";
        let language: 'en' | 'no' = 'en';
        
        // 1. Try fetching from DB
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) {
                if (profile.subscription_tier) tier = profile.subscription_tier as SubscriptionTier;
                if (profile.household_size) householdSize = profile.household_size;
                if (profile.dietary_restrictions) dietaryRestrictions = profile.dietary_restrictions;
                if (profile.family_name) familyName = profile.family_name;
                if (profile.language) language = profile.language;
            }
        } catch (e) {
            console.warn("Could not fetch profile from DB");
        }

        // 2. Override with Local Demo Tier if higher/exists (For Demo purposes)
        const localTier = localStorage.getItem(LOCAL_TIER_KEY);
        if (localTier) {
            tier = localTier as SubscriptionTier;
        }

        return {
            id: user.id,
            email: user.email || '',
            subscriptionTier: tier,
            familyName: familyName,
            preferences: {
                dietaryRestrictions,
                householdSize,
                language
            }
        };
    },

    async updateProfile(updates: { familyName?: string, householdSize?: number, dietaryRestrictions?: string[], language?: 'en' | 'no' }): Promise<void> {
        if (supabase) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const dbUpdates: any = {};
                if (updates.familyName !== undefined) dbUpdates.family_name = updates.familyName;
                if (updates.householdSize !== undefined) dbUpdates.household_size = updates.householdSize;
                if (updates.dietaryRestrictions !== undefined) dbUpdates.dietary_restrictions = updates.dietaryRestrictions;
                if (updates.language !== undefined) dbUpdates.language = updates.language;

                await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
            }
        }
    },

    // Used for the Demo Mode
    async upgradeDemoTier(tier: SubscriptionTier): Promise<void> {
        localStorage.setItem(LOCAL_TIER_KEY, tier);
        
        // Try to update backend if possible, but don't block
        if (supabase) {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 await supabase.from('profiles').upsert({ id: user.id, subscription_tier: tier });
             }
        }
    }
}
