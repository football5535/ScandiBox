import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InventoryItem, UserProfile, SubscriptionTier, ShoppingItem } from '../types';

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

// --- INVENTORY SERVICE ---
export const inventoryService = {
  async getItems(): Promise<InventoryItem[]> {
    if (supabase) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase.from('inventory_items').select('*').eq('user_id', user.id);
                if (!error && data) return data as InventoryItem[];
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
                const itemWithUser = { ...newItem, user_id: user.id };
                const { data, error } = await supabase.from('inventory_items').insert([itemWithUser]).select().single();
                if (!error && data) return data as InventoryItem;
            }
        } catch (e) { console.warn("Supabase insert failed", e); }
    }
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

// --- USER SERVICE ---
export const userService = {
    async getProfile(): Promise<UserProfile | null> {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        let tier = SubscriptionTier.Free;
        
        // 1. Try fetching from DB
        try {
            const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
            if (profile?.subscription_tier) {
                tier = profile.subscription_tier as SubscriptionTier;
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
            preferences: {
                dietaryRestrictions: [],
                householdSize: 1
            }
        };
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